import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyAuth } from '@/lib/auth';
import { newsFeedCreateSchema } from '@/lib/validation';
import { ZodError } from 'zod';
import { canDisableDefaultFeeds } from '@/lib/news';

const MAX_BODY_SIZE = 1024 * 1024;

export async function GET() {
  try {
    const feeds = await prisma.newsFeed.findMany({ orderBy: [{ isDefault: 'desc' }, { name: 'asc' }] });
    return NextResponse.json(feeds);
  } catch (error) {
    console.error('News feeds fetch error:', error);
    return NextResponse.json({ error: 'Failed to fetch news feeds' }, { status: 500 });
  }
}

export async function POST(request: Request) {
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

    const validatedData = newsFeedCreateSchema.parse(body);

    const feed = await prisma.newsFeed.create({
      data: {
        name: validatedData.name,
        url: validatedData.url,
        isDefault: false,
        isEnabled: true,
      },
    });

    return NextResponse.json(feed);
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
    console.error('News feed create error:', error);
    return NextResponse.json({ error: 'Failed to create news feed' }, { status: 500 });
  }
}
