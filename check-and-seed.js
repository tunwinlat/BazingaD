const { PrismaClient } = require('@prisma/client');
const { execSync } = require('child_process');

const prisma = new PrismaClient();

async function checkAndSeed() {
  const categoryCount = await prisma.category.count();
  const feedCount = await prisma.newsFeed.count();

  if (categoryCount === 0 || feedCount === 0) {
    execSync('node prisma/seed.js', { stdio: 'inherit' });
  }

  await prisma.$disconnect();
}

checkAndSeed()
  .catch(e => {
    console.error(e);
    process.exit(1);
  });
