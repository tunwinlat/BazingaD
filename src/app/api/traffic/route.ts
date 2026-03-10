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
}

async function fetchRouteData(
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
    
    // Handle specific error cases
    if (response.status === 403) {
      throw new Error(
        'API_KEY_INVALID: The API key is invalid or the Routes API is not enabled. ' +
        'Please enable the Routes API in your Google Cloud Console.'
      );
    }
    
    if (response.status === 429) {
      throw new Error(
        'RATE_LIMIT_EXCEEDED: You have exceeded the API rate limit. ' +
        'Please wait a moment before trying again.'
      );
    }
    
    if (errorData.error?.message?.includes('not found')) {
      throw new Error(
        `ADDRESS_NOT_FOUND: Could not find location "${origin}" or "${destination}". ` +
        'Please check the addresses and try again.'
      );
    }
    
    throw new Error(
      errorData.error?.message || `API_ERROR: HTTP ${response.status} - ${response.statusText}`
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
  
  // Parse duration from proto3 format (e.g., "1234s")
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

export async function GET() {
  try {
    // Get traffic settings
    const settings = await prisma.settings.findFirst();
    
    if (!settings?.trafficEnabled) {
      return NextResponse.json(
        { error: 'Traffic feature is not enabled' },
        { status: 400 }
      );
    }

    if (!settings.trafficApiKey) {
      return NextResponse.json(
        { error: 'API key is not configured' },
        { status: 400 }
      );
    }

    if (!settings.trafficHomeAddress || !settings.trafficWorkAddress) {
      return NextResponse.json(
        { error: 'Home and work addresses are not configured' },
        { status: 400 }
      );
    }

    // Check cache - get the most recent entry
    const cache = await prisma.trafficCache.findFirst({
      orderBy: { cachedAt: 'desc' },
    });

    // Use UTC time for consistent comparison
    const now = new Date();
    const cacheTime = cache ? new Date(cache.cachedAt) : null;
    const cacheAgeMs = cacheTime ? now.getTime() - cacheTime.getTime() : Infinity;
    const cacheAgeMinutes = Math.floor(cacheAgeMs / 60000);
    const isCacheValid = cache && cacheAgeMs < CACHE_DURATION_MS;


    // Return cached data if valid (less than 30 minutes old)
    if (isCacheValid && cache) {
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
      return NextResponse.json(response);
    }


    // Fetch fresh data from Google Routes API
    try {
      const [homeToWork, workToHome] = await Promise.all([
        fetchRouteData(
          settings.trafficHomeAddress,
          settings.trafficWorkAddress,
          settings.trafficApiKey,
          settings.trafficTravelMode,
          settings.trafficUnits
        ),
        fetchRouteData(
          settings.trafficWorkAddress,
          settings.trafficHomeAddress,
          settings.trafficApiKey,
          settings.trafficTravelMode,
          settings.trafficUnits
        ),
      ]);

      // Update cache - delete old entries and create new one
      // This ensures we only keep the latest cache entry
      await prisma.trafficCache.deleteMany({});
      
      await prisma.trafficCache.create({
        data: {
          homeToWorkDuration: homeToWork.duration,
          homeToWorkStatic: homeToWork.staticDuration,
          workToHomeDuration: workToHome.duration,
          workToHomeStatic: workToHome.staticDuration,
          cachedAt: new Date(),
        },
      });


      const response: TrafficResponse = {
        homeToWork,
        workToHome,
        cached: false,
        cacheAge: 0,
      };
      return NextResponse.json(response);
    } catch (apiError) {
      console.error('[Traffic API] Error fetching from Google:', apiError);
      
      // If we have any cache (even stale), return it with a warning
      if (cache) {
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
          error: `Using stale cache (${cacheAgeMinutes} min old). ${apiError instanceof Error ? apiError.message : 'Unknown error'}`,
        };
        return NextResponse.json(response);
      }

      // Parse error code from message
      const errorMessage = apiError instanceof Error ? apiError.message : 'Unknown error';
      const errorCode = errorMessage.includes(':') 
        ? errorMessage.split(':')[0] 
        : 'UNKNOWN_ERROR';

      return NextResponse.json(
        { 
          error: errorMessage,
          errorCode,
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
