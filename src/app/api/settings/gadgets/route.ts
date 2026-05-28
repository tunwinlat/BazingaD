import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyAuth } from '@/lib/auth';
import { z } from 'zod';

const gadgetConfigSchema = z.object({
  type: z.enum(['password']),
  id: z.string(),
});

const updateSchema = z.object({
  gadgetBarLeftEnabled: z.boolean().optional(),
  gadgetBarRightEnabled: z.boolean().optional(),
  gadgetBarLeftConfig: z.array(gadgetConfigSchema).optional(),
  gadgetBarRightConfig: z.array(gadgetConfigSchema).optional(),
});

export async function GET() {
  try {
    const settings = await prisma.settings.findFirst();
    return NextResponse.json({
      leftEnabled: settings?.gadgetBarLeftEnabled ?? false,
      rightEnabled: settings?.gadgetBarRightEnabled ?? false,
      leftConfig: JSON.parse(settings?.gadgetBarLeftConfig ?? '[]'),
      rightConfig: JSON.parse(settings?.gadgetBarRightConfig ?? '[]'),
    });
  } catch (error) {
    console.error('Failed to fetch gadget settings:', error);
    return NextResponse.json({ error: 'Failed to fetch settings' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await verifyAuth();
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const validated = updateSchema.parse(body);

    const updateData: Record<string, unknown> = {};
    if (validated.gadgetBarLeftEnabled !== undefined) {
      updateData.gadgetBarLeftEnabled = validated.gadgetBarLeftEnabled;
    }
    if (validated.gadgetBarRightEnabled !== undefined) {
      updateData.gadgetBarRightEnabled = validated.gadgetBarRightEnabled;
    }
    if (validated.gadgetBarLeftConfig !== undefined) {
      updateData.gadgetBarLeftConfig = JSON.stringify(validated.gadgetBarLeftConfig);
    }
    if (validated.gadgetBarRightConfig !== undefined) {
      updateData.gadgetBarRightConfig = JSON.stringify(validated.gadgetBarRightConfig);
    }

    const settings = await prisma.settings.findFirst();
    if (settings) {
      await prisma.settings.update({
        where: { id: settings.id },
        data: updateData,
      });
    } else {
      await prisma.settings.create({
        data: {
          ...updateData,
          siteTitle: 'Start Page',
        },
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid input', details: error.issues }, { status: 400 });
    }
    console.error('Failed to update gadget settings:', error);
    return NextResponse.json({ error: 'Failed to update settings' }, { status: 500 });
  }
}
