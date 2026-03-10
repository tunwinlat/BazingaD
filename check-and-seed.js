const { PrismaClient } = require('@prisma/client');
const { execSync } = require('child_process');

const prisma = new PrismaClient();

async function checkAndSeed() {
  const count = await prisma.category.count();
  if (count === 0) {
    console.log('No categories found, running seed...');
    execSync('node prisma/seed.js', { stdio: 'inherit' });
  } else {
    console.log('Database already seeded.');
  }
  await prisma.$disconnect();
}

checkAndSeed()
  .catch(e => {
    console.error(e);
    process.exit(1);
  });
