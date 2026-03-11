import { NextResponse } from 'next/server';

interface OpenMeteoGeocodeResult {
  id: number;
  name: string;
  latitude: number;
  longitude: number;
  elevation?: number;
  feature_code?: string;
  country_code?: string;
  admin1_id?: number;
  admin2_id?: number;
  admin3_id?: number;
  admin4_id?: number;
  timezone?: string;
  population?: number;
  postcodes?: string[];
  country_id?: number;
  country?: string;
  admin1?: string;
  admin2?: string;
  admin3?: string;
  admin4?: string;
}

interface OpenMeteoGeocodeResponse {
  results?: OpenMeteoGeocodeResult[];
  generationtime_ms: number;
}

// Geocode search using Open-Meteo (free, no API key required)
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    let query = searchParams.get('q');

    if (!query || query.trim().length < 2) {
      return NextResponse.json(
        { error: 'Query must be at least 2 characters' },
        { status: 400 }
      );
    }

    // Sanitize query to prevent abuse
    // Strip control characters, allow unicode alphanumeric, spaces, hyphens, commas, apostrophes
    query = query.trim().replace(/[^\p{L}\p{N}\s\-,']/gu, '');

    // Enforce max length of 100 characters
    if (query.length > 100) {
      query = query.substring(0, 100);
    }

    if (query.length < 2) {
      return NextResponse.json(
        { error: 'Query contains invalid characters after sanitization' },
        { status: 400 }
      );
    }

    // Call Open-Meteo Geocoding API
    const url = new URL('https://geocoding-api.open-meteo.com/v1/search');
    url.searchParams.set('name', query.trim());
    url.searchParams.set('count', '5');
    url.searchParams.set('language', 'en');
    url.searchParams.set('format', 'json');

    const response = await fetch(url.toString(), {
      headers: {
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Geocoding API error: ${response.status}`);
    }

    const data: OpenMeteoGeocodeResponse = await response.json();

    if (!data.results || data.results.length === 0) {
      return NextResponse.json(
        { error: 'No locations found', results: [] },
        { status: 404 }
      );
    }

    // Format results
    const results = data.results.map((result) => ({
      id: result.id,
      name: result.name,
      latitude: result.latitude,
      longitude: result.longitude,
      displayName: formatLocationName(result),
      country: result.country,
      admin1: result.admin1,
    }));

    return NextResponse.json({ results });
  } catch (error) {
    console.error('Geocode error:', error);
    return NextResponse.json(
      { error: 'Failed to search location' },
      { status: 500 }
    );
  }
}

function formatLocationName(result: OpenMeteoGeocodeResult): string {
  const parts = [result.name];
  
  if (result.admin1 && result.admin1 !== result.name) {
    parts.push(result.admin1);
  }
  
  if (result.country) {
    parts.push(result.country);
  }
  
  return parts.join(', ');
}
