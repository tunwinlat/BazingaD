import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyAuth } from '@/lib/auth';
import { newsTopicCreateSchema } from '@/lib/validation';
import { ZodError } from 'zod';

const MAX_BODY_SIZE = 1024 * 1024;

export async function GET() {
  try {
    const topics = await prisma.newsTopic.findMany({ orderBy: { createdAt: 'desc' } });
    return NextResponse.json(topics);
  } catch (error) {
    console.error('News topics fetch error:', error);
    return NextResponse.json({ error: 'Failed to fetch news topics' }, { status: 500 });
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

    const validatedData = newsTopicCreateSchema.parse(body);

    const topic = await prisma.newsTopic.create({
      data: { phrase: validatedData.phrase },
    });

    return NextResponse.json(topic);
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
    if (error instanceof Error && error.message.includes('Unique constraint')) {
      return NextResponse.json({ error: 'Topic already exists' }, { status: 409 });
    }
    console.error('News topic create error:', error);
    return NextResponse.json({ error: 'Failed to create news topic' }, { status: 500 });
  }
}
