import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // Create default categories
  const categories = await Promise.all([
    prisma.category.create({
      data: {
        name: 'Development',
        icon: 'dev',
        sortOrder: 0,
      },
    }),
    prisma.category.create({
      data: {
        name: 'Work',
        icon: 'work',
        sortOrder: 1,
      },
    }),
    prisma.category.create({
      data: {
        name: 'Media',
        icon: 'media',
        sortOrder: 2,
      },
    }),
    prisma.category.create({
      data: {
        name: 'Social',
        icon: 'social',
        sortOrder: 3,
      },
    }),
  ]);

  console.log('Created categories:', categories.map(c => c.name));

  // Create sample blocks
  const devCategory = categories.find(c => c.name === 'Development')!;
  const workCategory = categories.find(c => c.name === 'Work')!;
  const mediaCategory = categories.find(c => c.name === 'Media')!;
  const socialCategory = categories.find(c => c.name === 'Social')!;

  const blocks = await Promise.all([
    // Development
    prisma.block.create({
      data: {
        title: 'GitHub',
        url: 'https://github.com',
        description: 'Code hosting platform',
        categoryId: devCategory.id,
      },
    }),
    prisma.block.create({
      data: {
        title: 'Stack Overflow',
        url: 'https://stackoverflow.com',
        description: 'Developer Q&A',
        categoryId: devCategory.id,
      },
    }),
    prisma.block.create({
      data: {
        title: 'Vercel',
        url: 'https://vercel.com',
        description: 'Deployment platform',
        categoryId: devCategory.id,
      },
    }),
    // Work
    prisma.block.create({
      data: {
        title: 'Gmail',
        url: 'https://mail.google.com',
        description: 'Email',
        categoryId: workCategory.id,
      },
    }),
    prisma.block.create({
      data: {
        title: 'Google Drive',
        url: 'https://drive.google.com',
        description: 'Cloud storage',
        categoryId: workCategory.id,
      },
    }),
    prisma.block.create({
      data: {
        title: 'Notion',
        url: 'https://notion.so',
        description: 'Workspace',
        categoryId: workCategory.id,
      },
    }),
    // Media
    prisma.block.create({
      data: {
        title: 'YouTube',
        url: 'https://youtube.com',
        description: 'Video platform',
        categoryId: mediaCategory.id,
      },
    }),
    prisma.block.create({
      data: {
        title: 'Netflix',
        url: 'https://netflix.com',
        description: 'Streaming service',
        categoryId: mediaCategory.id,
      },
    }),
    prisma.block.create({
      data: {
        title: 'Spotify',
        url: 'https://open.spotify.com',
        description: 'Music streaming',
        categoryId: mediaCategory.id,
      },
    }),
    // Social
    prisma.block.create({
      data: {
        title: 'Twitter',
        url: 'https://twitter.com',
        description: 'Social network',
        categoryId: socialCategory.id,
      },
    }),
    prisma.block.create({
      data: {
        title: 'LinkedIn',
        url: 'https://linkedin.com',
        description: 'Professional network',
        categoryId: socialCategory.id,
      },
    }),
    prisma.block.create({
      data: {
        title: 'Discord',
        url: 'https://discord.com',
        description: 'Chat platform',
        categoryId: socialCategory.id,
      },
    }),
  ]);

  console.log('Created blocks:', blocks.map(b => b.title));
  console.log('✅ Seed completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
