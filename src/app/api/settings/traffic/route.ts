import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyAuth } from '@/lib/auth';

export async function GET() {
  try {
    const auth = await verifyAuth();
    const settings = await prisma.settings.findFirst();

    return NextResponse.json({
      enabled: settings?.trafficEnabled ?? false,
      apiKey: auth && settings?.trafficApiKey ? '********' : '',
      tomTomApiKey: auth && settings?.trafficTomTomApiKey ? '********' : '',
      primaryProvider: settings?.trafficPrimaryProvider ?? 'google',
      homeAddress: auth ? (settings?.trafficHomeAddress ?? '') : '',
      workAddress: auth ? (settings?.trafficWorkAddress ?? '') : '',
      travelMode: settings?.trafficTravelMode ?? 'DRIVE',
      units: settings?.trafficUnits ?? 'metric',
    });
  } catch (error) {
    console.error('Traffic settings GET error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch traffic settings' },
      { status: 500 }
    );
  }
}

const MAX_BODY_SIZE = 1024 * 1024;

export async function PUT(request: Request) {
  try {
    const auth = await verifyAuth();
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const contentLength = request.headers.get('content-length');
    if (contentLength && Number(contentLength) > MAX_BODY_SIZE) {
      return NextResponse.json({ error: 'Request body too large' }, { status: 413 });
    }

    const body = await request.json();
    const {
      enabled,
      apiKey,
      tomTomApiKey,
      primaryProvider,
      homeAddress,
      workAddress,
      travelMode,
      units,
    } = body;

    // Validate address lengths to prevent DB abuse
    if (homeAddress !== undefined && typeof homeAddress === 'string' && homeAddress.length > 500) {
      return NextResponse.json({ error: 'Home address too long' }, { status: 400 });
    }
    if (workAddress !== undefined && typeof workAddress === 'string' && workAddress.length > 500) {
      return NextResponse.json({ error: 'Work address too long' }, { status: 400 });
    }

    // Validate travel mode
    const validModes = ['DRIVE', 'BICYCLE', 'WALK', 'TWO_WHEELER', 'TRANSIT'];
    if (travelMode && !validModes.includes(travelMode)) {
      return NextResponse.json(
        { error: 'Invalid travel mode' },
        { status: 400 }
      );
    }

    // Validate units
    const validUnits = ['metric', 'imperial'];
    if (units && !validUnits.includes(units)) {
      return NextResponse.json(
        { error: 'Invalid units' },
        { status: 400 }
      );
    }

    // Validate primary provider
    if (primaryProvider && !['google', 'tomtom'].includes(primaryProvider)) {
      return NextResponse.json(
        { error: 'Invalid primary provider. Must be "google" or "tomtom".' },
        { status: 400 }
      );
    }

    const existingSettings = await prisma.settings.findFirst();

    const updateData: {
      trafficEnabled: boolean;
      trafficHomeAddress: string | null;
      trafficWorkAddress: string | null;
      trafficTravelMode: string;
      trafficUnits: string;
      trafficPrimaryProvider: string;
      trafficApiKey?: string | null;
      trafficTomTomApiKey?: string | null;
    } = {
      trafficEnabled: enabled ?? false,
      trafficHomeAddress: homeAddress || null,
      trafficWorkAddress: workAddress || null,
      trafficTravelMode: travelMode ?? 'DRIVE',
      trafficUnits: units ?? 'metric',
      trafficPrimaryProvider: primaryProvider ?? 'google',
    };

    if (apiKey !== undefined && apiKey !== '********') {
      updateData.trafficApiKey = apiKey || null;
    }

    if (tomTomApiKey !== undefined && tomTomApiKey !== '********') {
      updateData.trafficTomTomApiKey = tomTomApiKey || null;
    }

    if (existingSettings) {
      await prisma.settings.update({
        where: { id: existingSettings.id },
        data: updateData,
      });
    } else {
      await prisma.settings.create({
        data: updateData,
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Traffic settings PUT error:', error);
    return NextResponse.json(
      { error: 'Failed to update traffic settings' },
      { status: 500 }
    );
  }
}
