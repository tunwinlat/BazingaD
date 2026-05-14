import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

const CACHE_DURATION_MS = 30 * 60 * 1000; // 30 minutes

interface RouteData {
  duration: number; // in seconds
  staticDuration: number; // in seconds
}

interface TrafficResponse {
  homeToWork: RouteData | null;
  workToHome: RouteData | null;
  cached: boolean;
  cacheAge?: number; // Age in minutes for debugging
  error?: string;
  errorCode?: string;
  provider?: string; // Which provider served the data
}

// ─── Google Routes API ─────────────────────────────────────────────

async function fetchGoogleRouteData(
  origin: string,
  destination: string,
  apiKey: string,
  travelMode: string,
  units: string
): Promise<RouteData> {
  const response = await fetch(
    `https://routes.googleapis.com/directions/v2:computeRoutes`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': apiKey,
        'X-Goog-FieldMask': 'routes.duration,routes.staticDuration',
      },
      body: JSON.stringify({
        origin: { address: origin },
        destination: { address: destination },
        travelMode: travelMode,
        routingPreference: 'TRAFFIC_AWARE',
        computeAlternativeRoutes: false,
        routeModifiers: {
          avoidTolls: false,
          avoidHighways: false,
          avoidFerries: false,
        },
        languageCode: 'en-US',
        units: units.toUpperCase() === 'IMPERIAL' ? 'IMPERIAL' : 'METRIC',
      }),
    }
  );

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));

    if (response.status === 403) {
      throw new Error(
        'API_KEY_INVALID: The Google API key is invalid or the Routes API is not enabled. ' +
        'Please enable the Routes API in your Google Cloud Console.'
      );
    }

    if (response.status === 429) {
      throw new Error(
        'RATE_LIMIT_EXCEEDED: You have exceeded the Google API rate limit. ' +
        'Please wait a moment before trying again.'
      );
    }

    if (errorData.error?.message?.includes('not found')) {
      throw new Error(
        `ADDRESS_NOT_FOUND: Could not find one of the specified locations. ` +
        'Please check the addresses and try again.'
      );
    }

    throw new Error(
      `API_ERROR: HTTP ${response.status} - ${response.statusText}`
    );
  }

  const data = await response.json();

  if (!data.routes || data.routes.length === 0) {
    throw new Error(
      'NO_ROUTE_FOUND: Could not find a route between the specified addresses. ' +
      'Please check the addresses and try again.'
    );
  }

  const route = data.routes[0];

  const parseDuration = (durationStr: string): number => {
    if (!durationStr) return 0;
    const match = durationStr.match(/^(\d+)s$/);
    return match ? parseInt(match[1], 10) : 0;
  };

  return {
    duration: parseDuration(route.duration),
    staticDuration: parseDuration(route.staticDuration),
  };
}

// ─── TomTom API ────────────────────────────────────────────────────

interface TomTomPosition {
  lat: number;
  lon: number;
}

async function geocodeTomTom(address: string, apiKey: string): Promise<TomTomPosition> {
  const url = `https://api.tomtom.com/search/2/geocode/${encodeURIComponent(address)}.json?key=${apiKey}&limit=1`;
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(
      `TOMTOM_GEOCODE_ERROR: HTTP ${response.status} - ${response.statusText}`
    );
  }

  const data = await response.json();

  if (!data.results || data.results.length === 0) {
    throw new Error(
      `ADDRESS_NOT_FOUND: Could not geocode address "${address}" with TomTom.`
    );
  }

  const position = data.results[0].position;
  return { lat: position.lat, lon: position.lon };
}

function mapGoogleTravelModeToTomTom(mode: string): string {
  switch (mode) {
    case 'BICYCLE': return 'bicycle';
    case 'WALK': return 'pedestrian';
    case 'TWO_WHEELER': return 'motorcycle';
    case 'TRANSIT': return 'bus'; // closest approximation
    case 'DRIVE':
    default:
      return 'car';
  }
}

async function fetchTomTomRouteData(
  origin: string,
  destination: string,
  apiKey: string,
  travelMode: string,
): Promise<RouteData> {
  // TomTom requires coordinates, so geocode first
  const [originPos, destPos] = await Promise.all([
    geocodeTomTom(origin, apiKey),
    geocodeTomTom(destination, apiKey),
  ]);

  const tomtomMode = mapGoogleTravelModeToTomTom(travelMode);
  const locations = `${originPos.lat},${originPos.lon}:${destPos.lat},${destPos.lon}`;
  const url = `https://api.tomtom.com/routing/1/calculateRoute/${locations}/json?key=${apiKey}&travelMode=${tomtomMode}&computeTravelTimeFor=all`;

  const response = await fetch(url);

  if (!response.ok) {
    if (response.status === 403) {
      throw new Error(
        'API_KEY_INVALID: The TomTom API key is invalid or not authorized.'
      );
    }
    if (response.status === 429) {
      throw new Error(
        'RATE_LIMIT_EXCEEDED: You have exceeded the TomTom API rate limit.'
      );
    }
    throw new Error(
      `API_ERROR: HTTP ${response.status} - ${response.statusText}`
    );
  }

  const data = await response.json();

  if (!data.routes || data.routes.length === 0) {
    throw new Error(
      'NO_ROUTE_FOUND: Could not find a route between the specified addresses.'
    );
  }

  const summary = data.routes[0].summary;

  return {
    duration: summary.travelTimeInSeconds ?? 0,
    staticDuration: summary.noTrafficTravelTimeInSeconds ?? summary.travelTimeInSeconds ?? 0,
  };
}

// ─── Provider abstraction ──────────────────────────────────────────

type Provider = 'google' | 'tomtom';

interface ProviderConfig {
  name: Provider;
  apiKey: string | null | undefined;
  fetchRoute: (
    origin: string,
    destination: string,
    apiKey: string,
    travelMode: string,
    units: string
  ) => Promise<RouteData>;
}

async function fetchWithFallback(
  origin: string,
  destination: string,
  primary: ProviderConfig,
  fallback: ProviderConfig,
  travelMode: string,
  units: string
): Promise<{ data: RouteData; provider: Provider }> {
  // Try primary first
  if (primary.apiKey) {
    try {
      const data = await primary.fetchRoute(
        origin,
        destination,
        primary.apiKey,
        travelMode,
        units
      );
      return { data, provider: primary.name };
    } catch (error) {
      console.warn(`[Traffic API] ${primary.name} failed:`, error);
      // If fallback is not configured, re-throw
      if (!fallback.apiKey) {
        throw error;
      }
      // Otherwise, try fallback
    }
  }

  // Try fallback
  if (fallback.apiKey) {
    const data = await fallback.fetchRoute(
      origin,
      destination,
      fallback.apiKey,
      travelMode,
      units
    );
    return { data, provider: fallback.name };
  }

  throw new Error('No traffic provider configured');
}

// ─── Validation & helpers ──────────────────────────────────────────

function validateSettings(settings: {
  trafficEnabled?: boolean;
  trafficApiKey?: string | null;
  trafficTomTomApiKey?: string | null;
  trafficHomeAddress?: string | null;
  trafficWorkAddress?: string | null;
} | null): NextResponse | null {
  if (!settings?.trafficEnabled) {
    return NextResponse.json(
      { error: 'Traffic feature is not enabled' },
      { status: 400 }
    );
  }

  const hasGoogle = !!settings.trafficApiKey;
  const hasTomTom = !!settings.trafficTomTomApiKey;

  if (!hasGoogle && !hasTomTom) {
    return NextResponse.json(
      { error: 'No traffic API provider is configured. Please add a Google or TomTom API key.' },
      { status: 400 }
    );
  }

  if (!settings.trafficHomeAddress || !settings.trafficWorkAddress) {
    return NextResponse.json(
      { error: 'Home and work addresses are not configured' },
      { status: 400 }
    );
  }

  return null;
}

function getSafeErrorInfo(error: unknown): { message: string; code: string } {
  let message = 'Failed to fetch traffic data';
  let code = 'UNKNOWN_ERROR';

  if (error instanceof Error) {
    if (error.message.startsWith('API_KEY_INVALID:')) {
      code = 'API_KEY_INVALID';
      message = 'The API key is invalid or the traffic API is not enabled.';
    } else if (error.message.startsWith('RATE_LIMIT_EXCEEDED:')) {
      code = 'RATE_LIMIT_EXCEEDED';
      message = 'You have exceeded the API rate limit.';
    } else if (error.message.startsWith('ADDRESS_NOT_FOUND:')) {
      code = 'ADDRESS_NOT_FOUND';
      message = 'Could not find one of the specified locations.';
    } else if (error.message.startsWith('NO_ROUTE_FOUND:')) {
      code = 'NO_ROUTE_FOUND';
      message = 'Could not find a route between the specified addresses.';
    } else if (error.message.startsWith('API_ERROR:')) {
      code = 'API_ERROR';
    }
  }

  return { message, code };
}

function buildCachedResponse(
  cache: {
    homeToWorkDuration: number;
    homeToWorkStatic: number;
    workToHomeDuration: number;
    workToHomeStatic: number;
  },
  cacheAgeMinutes: number,
  apiError?: Error
): TrafficResponse {
  const response: TrafficResponse = {
    homeToWork: {
      duration: cache.homeToWorkDuration,
      staticDuration: cache.homeToWorkStatic,
    },
    workToHome: {
      duration: cache.workToHomeDuration,
      staticDuration: cache.workToHomeStatic,
    },
    cached: true,
    cacheAge: cacheAgeMinutes,
  };

  if (apiError) {
    const { message: safeMessage, code } = getSafeErrorInfo(apiError);
    response.error = `Using stale cache (${cacheAgeMinutes} min old). ${safeMessage}`;
    response.errorCode = code;
  }

  return response;
}

// ─── GET handler ───────────────────────────────────────────────────

export async function GET() {
  try {
    const settings = await prisma.settings.findFirst();

    const settingsError = validateSettings(settings);
    if (settingsError) return settingsError;

    const homeAddress = settings!.trafficHomeAddress as string;
    const workAddress = settings!.trafficWorkAddress as string;
    const travelMode = settings!.trafficTravelMode;
    const units = settings!.trafficUnits;
    const primaryProvider = (settings!.trafficPrimaryProvider as Provider) || 'google';

    // Build provider configs
    const googleConfig: ProviderConfig = {
      name: 'google',
      apiKey: settings!.trafficApiKey,
      fetchRoute: fetchGoogleRouteData,
    };

    const tomtomConfig: ProviderConfig = {
      name: 'tomtom',
      apiKey: settings!.trafficTomTomApiKey,
      fetchRoute: fetchTomTomRouteData,
    };

    const [primary, fallback] = primaryProvider === 'google'
      ? [googleConfig, tomtomConfig]
      : [tomtomConfig, googleConfig];

    // Check cache
    const cache = await prisma.trafficCache.findFirst({
      orderBy: { cachedAt: 'desc' },
    });

    const now = new Date();
    const cacheTime = cache ? new Date(cache.cachedAt) : null;
    const cacheAgeMs = cacheTime ? now.getTime() - cacheTime.getTime() : Infinity;
    const cacheAgeMinutes = Math.floor(cacheAgeMs / 60000);
    const isCacheValid = cache && cacheAgeMs < CACHE_DURATION_MS;

    if (isCacheValid && cache) {
      return NextResponse.json(buildCachedResponse(cache, cacheAgeMinutes));
    }

    // Fetch fresh data with fallback
    try {
      const [homeToWorkResult, workToHomeResult] = await Promise.all([
        fetchWithFallback(homeAddress, workAddress, primary, fallback, travelMode, units),
        fetchWithFallback(workAddress, homeAddress, primary, fallback, travelMode, units),
      ]);

      // Delete old cache entries and create new one
      await prisma.trafficCache.deleteMany({});

      await prisma.trafficCache.create({
        data: {
          homeToWorkDuration: homeToWorkResult.data.duration,
          homeToWorkStatic: homeToWorkResult.data.staticDuration,
          workToHomeDuration: workToHomeResult.data.duration,
          workToHomeStatic: workToHomeResult.data.staticDuration,
          cachedAt: new Date(),
        },
      });

      const response: TrafficResponse = {
        homeToWork: homeToWorkResult.data,
        workToHome: workToHomeResult.data,
        cached: false,
        cacheAge: 0,
        provider: homeToWorkResult.provider,
      };
      return NextResponse.json(response);
    } catch (apiError) {
      console.error('[Traffic API] Error fetching traffic data:', apiError);

      if (cache) {
        const err = apiError instanceof Error ? apiError : new Error('Unknown error');
        return NextResponse.json(buildCachedResponse(cache, cacheAgeMinutes, err));
      }

      const { message, code } = getSafeErrorInfo(apiError);

      return NextResponse.json(
        {
          error: message,
          errorCode: code,
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('[Traffic API] Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
