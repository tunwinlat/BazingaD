import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyAuth } from '@/lib/auth';
import { newsSettingsSchema } from '@/lib/validation';
import { ZodError } from 'zod';
import { newsCache } from '@/lib/cache';

const MAX_BODY_SIZE = 1024 * 1024;

export async function GET() {
  try {
    const auth = await verifyAuth();
    const settings = await prisma.settings.findFirst();

    return NextResponse.json({
      enabled: settings?.newsEnabled ?? false,
      apiKey: auth ? settings?.newsApiKey : null,
      checkIntervalMinutes: settings?.newsCheckIntervalMinutes ?? 60,
      unreadRetentionHours: settings?.newsUnreadRetentionHours ?? 24,
      readRetentionHours: settings?.newsReadRetentionHours ?? 8,
    });
  } catch (error) {
    console.error('News settings fetch error:', error);
    return NextResponse.json({ error: 'Failed to fetch news settings' }, { status: 500 });
  }
}

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

    let body;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: 'Invalid JSON in request body' }, { status: 400 });
    }

    const validatedData = newsSettingsSchema.parse(body);

    let settings = await prisma.settings.findFirst();
    const updateData: Record<string, unknown> = {};

    if (validatedData.newsEnabled !== undefined) updateData.newsEnabled = validatedData.newsEnabled;
    if (validatedData.newsApiKey !== undefined) updateData.newsApiKey = validatedData.newsApiKey;
    if (validatedData.newsCheckIntervalMinutes !== undefined) updateData.newsCheckIntervalMinutes = validatedData.newsCheckIntervalMinutes;
    if (validatedData.newsUnreadRetentionHours !== undefined) updateData.newsUnreadRetentionHours = validatedData.newsUnreadRetentionHours;
    if (validatedData.newsReadRetentionHours !== undefined) updateData.newsReadRetentionHours = validatedData.newsReadRetentionHours;

    if (settings) {
      settings = await prisma.settings.update({ where: { id: settings.id }, data: updateData });
    } else {
      settings = await prisma.settings.create({
        data: {
          newsEnabled: validatedData.newsEnabled ?? false,
          newsCheckIntervalMinutes: validatedData.newsCheckIntervalMinutes ?? 60,
          newsUnreadRetentionHours: validatedData.newsUnreadRetentionHours ?? 24,
          newsReadRetentionHours: validatedData.newsReadRetentionHours ?? 8,
          ...(validatedData.newsApiKey && { newsApiKey: validatedData.newsApiKey }),
        },
      });
    }

    newsCache.delete('current_articles');

    return NextResponse.json({
      enabled: settings.newsEnabled,
      apiKey: settings.newsApiKey,
      checkIntervalMinutes: settings.newsCheckIntervalMinutes,
      unreadRetentionHours: settings.newsUnreadRetentionHours,
      readRetentionHours: settings.newsReadRetentionHours,
    });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        {
          error: 'Validation failed',
          details: error.issues.map(e => ({ field: e.path.join('.'), message: e.message })),
        },
        { status: 400 }
      );
    }
    console.error('News settings update error:', error);
    return NextResponse.json({ error: 'Failed to update news settings' }, { status: 500 });
  }
}
