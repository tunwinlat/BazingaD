#!/bin/sh
set -e

# Create data directory if it doesn't exist (for volume mounts) and fix permissions
mkdir -p /app/data
chown -R nextjs:nodejs /app/data

# Run database migrations as nextjs user
echo "📦 Running database migrations..."
su -s /bin/sh nextjs -c "npx prisma migrate deploy"

# Seed database if empty
echo "🌱 Checking if seed is needed..."
su -s /bin/sh nextjs -c "node check-and-seed.js"

echo "🚀 Starting application..."

# Switch to nextjs user and execute the main command
exec su -s /bin/sh nextjs -c "cd /app && $*"
