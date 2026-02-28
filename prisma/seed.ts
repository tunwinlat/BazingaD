import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // Check if data already exists
  const existingCategories = await prisma.category.count();
  
  if (existingCategories > 0) {
    console.log('Database already seeded, skipping...');
    return;
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
