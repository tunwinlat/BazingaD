import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // Check if data already exists
  const existingCategories = await prisma.category.count();
  
  if (existingCategories > 0) {
    console.log('Database already seeded, skipping...');
    return;
  }

  // Seed default news feeds if none exist
  const existingFeeds = await prisma.newsFeed.count();
  if (existingFeeds === 0) {
    const defaultFeeds = [
      { name: 'TechCrunch', url: 'https://techcrunch.com/feed/', isDefault: true },
      { name: 'Ars Technica', url: 'https://feeds.arstechnica.com/arstechnica/index', isDefault: true },
      { name: 'The Verge', url: 'https://www.theverge.com/rss/index.xml', isDefault: true },
      { name: 'Wired', url: 'https://www.wired.com/feed/rss', isDefault: true },
      { name: 'Hacker News', url: 'https://hnrss.org/frontpage?points=100', isDefault: true },
      { name: 'TLDR AI', url: 'https://tldr.tech/api/rss/ai', isDefault: true },
      { name: 'Krebs on Security', url: 'https://krebsonsecurity.com/feed/', isDefault: true },
      { name: 'GitHub Blog', url: 'https://github.blog/feed/', isDefault: true },
      { name: 'ByteByteGo', url: 'https://blog.bytebytego.com/feed', isDefault: true },
    ];
    await Promise.all(defaultFeeds.map(feed => prisma.newsFeed.create({ data: feed })));
    console.log('Created default news feeds');
  }

  // Create default categories only - no sample blocks for privacy
  const categories = await Promise.all([
    prisma.category.create({
      data: {
        name: 'Development',
        icon: 'Code',
        sortOrder: 0,
      },
    }),
    prisma.category.create({
      data: {
        name: 'Work',
        icon: 'Briefcase',
        sortOrder: 1,
      },
    }),
    prisma.category.create({
      data: {
        name: 'Media',
        icon: 'Play',
        sortOrder: 2,
      },
    }),
    prisma.category.create({
      data: {
        name: 'Social',
        icon: 'Users',
        sortOrder: 3,
      },
    }),
  ]);

  console.log('Created categories:', categories.map(c => c.name));
  console.log('✅ Seed completed successfully!');
  console.log('Note: No sample blocks were created. Add your own blocks through the admin panel.');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
