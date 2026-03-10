const { PrismaClient } = require('@prisma/client');
const { execSync } = require('child_process');

const prisma = new PrismaClient();

async function checkAndSeed() {
  const count = await prisma.category.count();
  if (count === 0) {
    execSync('node prisma/seed.js', { stdio: 'inherit' });
  }
  await prisma.$disconnect();
}

checkAndSeed()
  .then(() => {
    console.log('✅ Database ready!');
  })
  .catch(e => {
    console.error(e);
    process.exit(1);
  });
