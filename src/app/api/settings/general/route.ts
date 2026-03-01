import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyAuth } from '@/lib/auth';

// Get general settings
export async function GET() {
  try {
    const settings = await prisma.settings.findFirst();
    
    return NextResponse.json({
      siteTitle: settings?.siteTitle || 'Start Page',
      favicon: settings?.favicon || null,
    });
  } catch (error) {
    console.error('Error fetching general settings:', error);
    return NextResponse.json(
      { error: 'Failed to fetch settings' },
      { status: 500 }
    );
  }
}

// Update general settings
export async function PUT(request: Request) {
  try {
    console.log('PUT /api/settings/general called');
    
    // Verify authentication
    const auth = await verifyAuth();
    console.log('Auth result:', auth);
    
    if (!auth) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    console.log('Request body:', body);
    const { siteTitle, favicon } = body;

    // Validate inputs
    if (siteTitle !== undefined && (typeof siteTitle !== 'string' || siteTitle.length > 100)) {
      return NextResponse.json(
        { error: 'Invalid site title' },
        { status: 400 }
      );
    }

    if (favicon !== undefined && favicon !== null && (typeof favicon !== 'string' || favicon.length > 50000)) {
      return NextResponse.json(
        { error: 'Invalid favicon' },
        { status: 400 }
      );
    }

    // Get or create settings
    let existingSettings = await prisma.settings.findFirst();
    
    if (existingSettings) {
      await prisma.settings.update({
        where: { id: existingSettings.id },
        data: {
          ...(siteTitle !== undefined && { siteTitle: siteTitle.trim() || 'Start Page' }),
          ...(favicon !== undefined && { favicon }),
        },
      });
    } else {
      // Create with default values first, then update if needed
      existingSettings = await prisma.settings.create({
        data: {
          siteTitle: 'Start Page',
          favicon: null,
        },
      });
      // If we have values to set, update the newly created record
      if (siteTitle !== undefined || favicon !== undefined) {
        await prisma.settings.update({
          where: { id: existingSettings.id },
          data: {
            ...(siteTitle !== undefined && { siteTitle: siteTitle.trim() || 'Start Page' }),
            ...(favicon !== undefined && { favicon }),
          },
        });
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating general settings:', error);
    return NextResponse.json(
      { error: 'Failed to update settings', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
