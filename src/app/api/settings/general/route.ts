import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyAuth } from '@/lib/auth';
import { themes } from '@/lib/themes';
import { settingsCache } from '@/lib/cache';

const CACHE_KEY = 'general_settings';

// Get general settings
export async function GET() {
  try {
    // Check cache first
    const cached = settingsCache.get<{
      siteTitle: string;
      favicon: string | null;
      theme: string;
      defaultView: string;
      openInNewTab: boolean;
      navTransitionEnabled: boolean;
      navTransitionType: string;
    }>(CACHE_KEY);
    
    if (cached) {
      return NextResponse.json(cached, {
        headers: {
          'X-Cache': 'HIT',
          'Cache-Control': 'private, max-age=60',
        },
      });
    }

    const settings = await prisma.settings.findFirst();
    
    const result = {
      siteTitle: settings?.siteTitle || 'Start Page',
      favicon: settings?.favicon || null,
      theme: settings?.theme || 'default',
      defaultView: settings?.defaultView || 'comfortable',
      openInNewTab: settings?.openInNewTab ?? true,
      navTransitionEnabled: settings?.navTransitionEnabled ?? false,
      navTransitionType: settings?.navTransitionType || 'overlay',
    };

    // Store in cache
    settingsCache.set(CACHE_KEY, result, 60);
    
    return NextResponse.json(result, {
      headers: {
        'X-Cache': 'MISS',
        'Cache-Control': 'private, max-age=60',
      },
    });
  } catch (error) {
    console.error('Error fetching general settings:', error);
    return NextResponse.json(
      { error: 'Failed to fetch settings' },
      { status: 500 }
    );
  }
}

const MAX_BODY_SIZE = 1024 * 1024;

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

    const contentLength = request.headers.get('content-length');
    if (contentLength && Number(contentLength) > MAX_BODY_SIZE) {
      return NextResponse.json({ error: 'Request body too large' }, { status: 413 });
    }

    const body = await request.json();
    const { siteTitle, favicon, theme, defaultView, openInNewTab, navTransitionEnabled, navTransitionType } = body;

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

    // Validate theme
    if (theme !== undefined) {
      const validThemes = themes.map(t => t.id);
      if (!validThemes.includes(theme)) {
        return NextResponse.json(
          { error: 'Invalid theme' },
          { status: 400 }
        );
      }
    }

    // Validate defaultView
    if (defaultView !== undefined) {
      const validViews = ['comfortable', 'compact', 'dense', 'list'];
      if (!validViews.includes(defaultView)) {
        return NextResponse.json(
          { error: 'Invalid default view' },
          { status: 400 }
        );
      }
    }

    // Validate openInNewTab
    if (openInNewTab !== undefined && typeof openInNewTab !== 'boolean') {
      return NextResponse.json(
        { error: 'Invalid openInNewTab value' },
        { status: 400 }
      );
    }

    // Validate navTransitionEnabled
    if (navTransitionEnabled !== undefined && typeof navTransitionEnabled !== 'boolean') {
      return NextResponse.json(
        { error: 'Invalid navTransitionEnabled value' },
        { status: 400 }
      );
    }

    // Validate navTransitionType
    if (navTransitionType !== undefined) {
      const validTypes = ['overlay', 'exit'];
      if (!validTypes.includes(navTransitionType)) {
        return NextResponse.json(
          { error: 'Invalid navTransitionType value' },
          { status: 400 }
        );
      }
    }

    // Get or create settings
    let existingSettings = await prisma.settings.findFirst();
    
    if (existingSettings) {
      await prisma.settings.update({
        where: { id: existingSettings.id },
        data: {
          ...(siteTitle !== undefined && { siteTitle: siteTitle.trim() || 'Start Page' }),
          ...(favicon !== undefined && { favicon }),
          ...(theme !== undefined && { theme }),
          ...(defaultView !== undefined && { defaultView }),
          ...(openInNewTab !== undefined && { openInNewTab }),
          ...(navTransitionEnabled !== undefined && { navTransitionEnabled }),
          ...(navTransitionType !== undefined && { navTransitionType }),
        },
      });
    } else {
      existingSettings = await prisma.settings.create({
        data: {
          siteTitle: siteTitle?.trim() || 'Start Page',
          favicon: favicon || null,
          theme: theme || 'default',
          defaultView: defaultView || 'comfortable',
          openInNewTab: openInNewTab ?? true,
          navTransitionEnabled: navTransitionEnabled ?? false,
          navTransitionType: navTransitionType || 'overlay',
        },
      });
    }

    // Invalidate cache
    settingsCache.delete(CACHE_KEY);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating general settings:', error);
    return NextResponse.json(
      { error: 'Failed to update settings' },
      { status: 500 }
    );
  }
}
