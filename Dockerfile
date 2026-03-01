# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm install -g npm@11.11.0 && npm ci

# Copy prisma schema
COPY prisma ./prisma/

# Generate Prisma client
RUN npx prisma generate

# Copy source code
COPY . .

# Build the application
RUN npm run build

# Compile seed script to JavaScript
RUN npx tsx prisma/seed.ts --check 2>/dev/null || npx tsc prisma/seed.ts --outDir /app/dist --esModuleInterop --module commonjs --target es2020 --moduleResolution node

# Production dependencies stage
FROM node:20-alpine AS deps

WORKDIR /app

COPY package*.json ./
RUN npm install -g npm@11.11.0 && npm ci --only=production

# Production stage
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV DATABASE_URL="file:/app/data/prod.db"
ENV DOCKER_ENV=true

# Install wget for healthcheck
RUN apk add --no-cache wget

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nextjs -u 1001

# Copy production dependencies
COPY --from=deps /app/node_modules ./node_modules
COPY package*.json ./

# Copy prisma files
COPY prisma ./prisma/
RUN npx prisma generate

# Copy compiled seed script and check-and-seed script
COPY --from=builder /app/dist/seed.js ./prisma/
COPY check-and-seed.js ./

# Copy built application
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000/api/health || exit 1

# Start script - run as root to fix permissions, then switch to nextjs
COPY docker-entrypoint.sh /usr/local/bin/
RUN chmod +x /usr/local/bin/docker-entrypoint.sh

ENTRYPOINT ["docker-entrypoint.sh"]
CMD ["node", "node_modules/.bin/next", "start"]
