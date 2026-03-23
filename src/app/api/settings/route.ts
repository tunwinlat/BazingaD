import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyAuth } from '@/lib/auth';
import { settingsUpdateSchema, SettingsUpdateInput } from '@/lib/validation';
import bcrypt from 'bcryptjs';
import { ZodError } from 'zod';
import { settingsCache } from '@/lib/cache';

const MAX_BODY_SIZE = 1024 * 1024;

// Get settings - public endpoint (no auth required for read)
export async function GET() {
  try {
    const auth = await verifyAuth();
    let settings = await prisma.settings.findFirst();

    if (!settings) {
      // Create default settings
      settings = await prisma.settings.create({
        data: {
          dashboardProtected: false,
          sessionDurationHours: 24,
          weatherEnabled: false,
          weatherUnits: 'metric',
        },
      });
    }

    return NextResponse.json({
      dashboardProtected: settings.dashboardProtected,
      sessionDurationHours: settings.sessionDurationHours,
      weatherEnabled: settings.weatherEnabled,
      weatherLatitude: auth ? settings.weatherLatitude : null,
      weatherLongitude: auth ? settings.weatherLongitude : null,
      weatherLocationName: auth ? settings.weatherLocationName : '',
      weatherUnits: settings.weatherUnits,
    });
  } catch (error) {
    console.error('Settings fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch settings' },
      { status: 500 }
    );
  }
}

async function parseAndValidateRequest(request: Request) {
  // Check content length
  const contentLength = request.headers.get('content-length');
  if (contentLength && parseInt(contentLength) > MAX_BODY_SIZE) {
    return { errorResponse: NextResponse.json({ error: 'Request body too large' }, { status: 413 }) };
  }

  // Parse request body
  let body;
  try {
    body = await request.json();
  } catch {
    return { errorResponse: NextResponse.json({ error: 'Invalid JSON in request body' }, { status: 400 }) };
  }

  // Validate input
  const validatedData = settingsUpdateSchema.parse(body);

  return { validatedData };
}

async function updateOrCreateSettings(validatedData: SettingsUpdateInput) {
  let settings = await prisma.settings.findFirst();

  const updateData: Record<string, unknown> = {};

  if (validatedData.dashboardProtected !== undefined) {
    updateData.dashboardProtected = validatedData.dashboardProtected;
  }

  if (validatedData.sessionDurationHours !== undefined) {
    updateData.sessionDurationHours = validatedData.sessionDurationHours;
  }

  if (validatedData.dashboardPassword) {
    updateData.dashboardPassword = await bcrypt.hash(validatedData.dashboardPassword, 12);
  }

  // Weather settings
  if (validatedData.weatherEnabled !== undefined) {
    updateData.weatherEnabled = validatedData.weatherEnabled;
  }
  if (validatedData.weatherLatitude !== undefined) {
    updateData.weatherLatitude = validatedData.weatherLatitude;
  }
  if (validatedData.weatherLongitude !== undefined) {
    updateData.weatherLongitude = validatedData.weatherLongitude;
  }
  if (validatedData.weatherLocationName !== undefined) {
    updateData.weatherLocationName = validatedData.weatherLocationName;
  }
  if (validatedData.weatherUnits !== undefined) {
    updateData.weatherUnits = validatedData.weatherUnits;
  }

  if (settings) {
    settings = await prisma.settings.update({
      where: { id: settings.id },
      data: updateData,
    });
  } else {
    settings = await prisma.settings.create({
      data: {
        dashboardProtected: validatedData.dashboardProtected ?? false,
        sessionDurationHours: validatedData.sessionDurationHours ?? 24,
        weatherEnabled: validatedData.weatherEnabled ?? false,
        weatherUnits: validatedData.weatherUnits ?? 'metric',
        ...(validatedData.dashboardPassword && {
          dashboardPassword: await bcrypt.hash(validatedData.dashboardPassword, 12)
        }),
      },
    });
  }

  return settings;
}

// Update settings - requires authentication
export async function PUT(request: Request) {
  try {
    // Verify authentication
    const auth = await verifyAuth();
    if (!auth) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { errorResponse, validatedData } = await parseAndValidateRequest(request);
    if (errorResponse) return errorResponse;
    if (!validatedData) throw new Error('Validation failed without error response');

    const settings = await updateOrCreateSettings(validatedData);

    // Clear settings cache after update
    settingsCache.delete("dashboard_auth_settings");

    return NextResponse.json({
      dashboardProtected: settings.dashboardProtected,
      sessionDurationHours: settings.sessionDurationHours,
      weatherEnabled: settings.weatherEnabled,
      weatherLatitude: settings.weatherLatitude,
      weatherLongitude: settings.weatherLongitude,
      weatherLocationName: settings.weatherLocationName,
      weatherUnits: settings.weatherUnits,
    });
  } catch (error) {
    if (error instanceof ZodError) {
      console.error('Validation error details:', JSON.stringify(error.issues, null, 2));
      return NextResponse.json(
        {
          error: 'Validation failed',
          details: error.issues.map(e => ({
            field: e.path.join('.'),
            message: e.message,
          })),
        },
        { status: 400 }
      );
    }

    console.error('Settings update error:', error);
    return NextResponse.json(
      { error: 'Failed to update settings' },
      { status: 500 }
    );
  }
}
