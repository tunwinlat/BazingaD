#!/bin/sh
set -e

# Create data directory if it doesn't exist (for volume mounts) and fix permissions
mkdir -p /app/data
chown -R nextjs:nodejs /app/data

# Run database migrations as nextjs user
echo "📦 Running database migrations..."
su nextjs -c "npx prisma migrate deploy"

# Seed database if empty
echo "🌱 Checking if seed is needed..."
su nextjs -c "node -e \"
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkAndSeed() {
  const count = await prisma.category.count();
  if (count === 0) {
    console.log('No categories found, running seed...');
    const { execSync } = require('child_process');
    execSync('node prisma/seed.js', { stdio: 'inherit' });
  } else {
    console.log('Database already seeded.');
  }
  await prisma.\$disconnect();
}

checkAndSeed().catch(e => {
  console.error(e);
  process.exit(1);
});
\""

echo "✅ Database ready!"

# Execute the main command as nextjs user
exec su nextjs -c "$@"
