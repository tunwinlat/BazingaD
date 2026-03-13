import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyAuth } from '@/lib/auth';

export async function GET() {
  try {
    const settings = await prisma.settings.findFirst();
    
    return NextResponse.json({
      enabled: settings?.trafficEnabled ?? false,
      apiKey: settings?.trafficApiKey ?? '',
      homeAddress: settings?.trafficHomeAddress ?? '',
      workAddress: settings?.trafficWorkAddress ?? '',
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

export async function PUT(request: Request) {
  try {
    const auth = await verifyAuth();
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { enabled, apiKey, homeAddress, workAddress, travelMode, units } = body;

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

    const existingSettings = await prisma.settings.findFirst();
    
    if (existingSettings) {
      await prisma.settings.update({
        where: { id: existingSettings.id },
        data: {
          trafficEnabled: enabled ?? false,
          trafficApiKey: apiKey || null,
          trafficHomeAddress: homeAddress || null,
          trafficWorkAddress: workAddress || null,
          trafficTravelMode: travelMode ?? 'DRIVE',
          trafficUnits: units ?? 'metric',
        },
      });
    } else {
      await prisma.settings.create({
        data: {
          trafficEnabled: enabled ?? false,
          trafficApiKey: apiKey || null,
          trafficHomeAddress: homeAddress || null,
          trafficWorkAddress: workAddress || null,
          trafficTravelMode: travelMode ?? 'DRIVE',
          trafficUnits: units ?? 'metric',
        },
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
