import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyAuth } from '@/lib/auth';

export async function GET() {
  try {
    const auth = await verifyAuth();
    const settings = await prisma.settings.findFirst();

    return NextResponse.json({
      enabled: settings?.trafficEnabled ?? false,
      apiKey: auth && settings?.trafficApiKey ? '********' : '', // 🛡️ Sentinel: Mask API key to prevent leaking secret to the frontend
      homeAddress: auth ? (settings?.trafficHomeAddress ?? '') : '', // 🛡️ Sentinel: Only expose PII to authenticated users
      workAddress: auth ? (settings?.trafficWorkAddress ?? '') : '', // 🛡️ Sentinel: Only expose PII to authenticated users
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

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const updateData: any = {
      trafficEnabled: enabled ?? false,
      trafficTravelMode: travelMode ?? 'DRIVE',
      trafficUnits: units ?? 'metric',
      trafficHomeAddress: homeAddress || null,
      trafficWorkAddress: workAddress || null,
    };

    if (apiKey !== undefined && apiKey !== '********') {
      updateData.trafficApiKey = apiKey || null;
    }

    if (existingSettings) {
      await prisma.settings.update({
        where: { id: existingSettings.id },
        data: updateData,
      });
    } else {
      await prisma.settings.create({
        data: {
          trafficEnabled: updateData.trafficEnabled,
          trafficApiKey: updateData.trafficApiKey || null,
          trafficHomeAddress: updateData.trafficHomeAddress || null,
          trafficWorkAddress: updateData.trafficWorkAddress || null,
          trafficTravelMode: updateData.trafficTravelMode,
          trafficUnits: updateData.trafficUnits,
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
