import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';

// Get settings
export async function GET() {
  try {
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
      weatherLatitude: settings.weatherLatitude,
      weatherLongitude: settings.weatherLongitude,
      weatherLocationName: settings.weatherLocationName,
      weatherUnits: settings.weatherUnits,
    });
  } catch (error) {
    console.error('Settings fetch error:', error);
    return NextResponse.json({ error: 'Failed to fetch settings' }, { status: 500 });
  }
}

// Update settings
export async function PUT(request: Request) {
  try {
    const { 
      dashboardProtected, 
      sessionDurationHours, 
      dashboardPassword,
      weatherEnabled,
      weatherLatitude,
      weatherLongitude,
      weatherLocationName,
      weatherUnits,
    } = await request.json();
    
    let settings = await prisma.settings.findFirst();
    
    const updateData: any = {};
    
    if (dashboardProtected !== undefined) {
      updateData.dashboardProtected = dashboardProtected;
    }
    
    if (sessionDurationHours !== undefined) {
      updateData.sessionDurationHours = Math.max(1, Math.min(720, sessionDurationHours));
    }
    
    if (dashboardPassword) {
      updateData.dashboardPassword = await bcrypt.hash(dashboardPassword, 10);
    }

    // Weather settings
    if (weatherEnabled !== undefined) {
      updateData.weatherEnabled = weatherEnabled;
    }
    if (weatherLatitude !== undefined) {
      updateData.weatherLatitude = weatherLatitude;
    }
    if (weatherLongitude !== undefined) {
      updateData.weatherLongitude = weatherLongitude;
    }
    if (weatherLocationName !== undefined) {
      updateData.weatherLocationName = weatherLocationName;
    }
    if (weatherUnits !== undefined) {
      updateData.weatherUnits = weatherUnits;
    }
    
    if (settings) {
      settings = await prisma.settings.update({
        where: { id: settings.id },
        data: updateData,
      });
    } else {
      settings = await prisma.settings.create({
        data: {
          dashboardProtected: dashboardProtected ?? false,
          sessionDurationHours: sessionDurationHours ?? 24,
          weatherEnabled: weatherEnabled ?? false,
          weatherUnits: weatherUnits ?? 'metric',
          ...(dashboardPassword && { dashboardPassword: await bcrypt.hash(dashboardPassword, 10) }),
        },
      });
    }

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
    console.error('Settings update error:', error);
    return NextResponse.json({ error: 'Failed to update settings' }, { status: 500 });
  }
}
