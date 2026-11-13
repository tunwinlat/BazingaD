import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyAuth } from '@/lib/auth';
import { newsSettingsSchema } from '@/lib/validation';
import { ZodError } from 'zod';
import { newsCache } from '@/lib/cache';
import { DEFAULT_AI_ENDPOINT, MASKED_API_KEY } from '@/lib/ai-config';
import { serializeNewsSettings } from '@/lib/news-settings';
import type { Prisma } from '@prisma/client';

const MAX_BODY_SIZE = 1024 * 1024;

export async function GET() {
  try {
    const auth = await verifyAuth();
    const settings = await prisma.settings.findFirst();

    return NextResponse.json(serializeNewsSettings(settings, !!auth));
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
    // Validate the effective configuration as partial updates may change only one field.
    newsSettingsSchema.parse({
      newsApiEndpoint: settings?.newsApiEndpoint ?? DEFAULT_AI_ENDPOINT,
      newsApiFormat: settings?.newsApiFormat ?? 'auto',
      ...validatedData,
    });
    const updateData: Prisma.SettingsCreateInput = {};

    if (validatedData.newsEnabled !== undefined) updateData.newsEnabled = validatedData.newsEnabled;
    if (validatedData.newsApiKey !== undefined && validatedData.newsApiKey !== MASKED_API_KEY) {
      updateData.newsApiKey = validatedData.newsApiKey || null;
    }
    if (validatedData.newsApiEndpoint !== undefined) updateData.newsApiEndpoint = validatedData.newsApiEndpoint;
    if (validatedData.newsApiModel !== undefined) updateData.newsApiModel = validatedData.newsApiModel;
    if (validatedData.newsApiFormat !== undefined) updateData.newsApiFormat = validatedData.newsApiFormat;
    if (validatedData.newsCheckIntervalMinutes !== undefined) updateData.newsCheckIntervalMinutes = validatedData.newsCheckIntervalMinutes;
    if (validatedData.newsUnreadRetentionHours !== undefined) updateData.newsUnreadRetentionHours = validatedData.newsUnreadRetentionHours;
    if (validatedData.newsReadRetentionHours !== undefined) updateData.newsReadRetentionHours = validatedData.newsReadRetentionHours;
    if (validatedData.newsMaxArticleAgeHours !== undefined) updateData.newsMaxArticleAgeHours = validatedData.newsMaxArticleAgeHours;

    if (settings) {
      settings = await prisma.settings.update({ where: { id: settings.id }, data: updateData });
    } else {
      settings = await prisma.settings.create({ data: updateData });
    }

    newsCache.delete('current_articles');

    return NextResponse.json(serializeNewsSettings(settings, true));
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
