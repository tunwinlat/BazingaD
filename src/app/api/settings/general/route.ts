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
    // Verify authentication
    const auth = await verifyAuth();
    if (!auth) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
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
    const existingSettings = await prisma.settings.findFirst();
    
    if (existingSettings) {
      await prisma.settings.update({
        where: { id: existingSettings.id },
        data: {
          ...(siteTitle !== undefined && { siteTitle: siteTitle.trim() || 'Start Page' }),
          ...(favicon !== undefined && { favicon }),
        },
      });
    } else {
      await prisma.settings.create({
        data: {
          siteTitle: siteTitle?.trim() || 'Start Page',
          favicon: favicon || null,
        },
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating general settings:', error);
    return NextResponse.json(
      { error: 'Failed to update settings' },
      { status: 500 }
    );
  }
}
