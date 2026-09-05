import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const existing = await prisma.newsFeed.count();
  if (existing === 0) {
    const feeds = [
      { name: 'TechCrunch', url: 'https://techcrunch.com/feed/', isDefault: true },
      { name: 'Ars Technica', url: 'https://feeds.arstechnica.com/arstechnica/index', isDefault: true },
      { name: 'The Verge', url: 'https://www.theverge.com/rss/index.xml', isDefault: true },
      { name: 'Wired', url: 'https://www.wired.com/feed/rss', isDefault: true },
      { name: 'Hacker News', url: 'https://hnrss.org/frontpage?points=100', isDefault: true },
      { name: 'TLDR AI', url: 'https://tldr.tech/api/rss/ai', isDefault: true },
      { name: 'AI Weekly', url: 'https://aiweekly.co/feed', isDefault: true },
      { name: 'Krebs on Security', url: 'https://krebsonsecurity.com/feed/', isDefault: true },
      { name: 'GitHub Blog', url: 'https://github.blog/feed/', isDefault: true },
      { name: 'ByteByteGo', url: 'https://blog.bytebytego.com/feed', isDefault: true },
    ];
    await Promise.all(feeds.map(f => prisma.newsFeed.create({ data: f })));
    console.log('Created default news feeds');
  } else {
    console.log('News feeds already exist');
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
