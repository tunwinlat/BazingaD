# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm ci

# Copy prisma schema
COPY prisma ./prisma/

# Generate Prisma client
RUN npx prisma generate

# Copy source code
COPY . .

# Build the application
RUN npm run build

# Production dependencies stage
FROM node:20-alpine AS deps

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

# Production stage
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV DATABASE_URL="file:/app/data/prod.db"

# Install wget for healthcheck
RUN apk add --no-cache wget

# Copy production dependencies
COPY --from=deps /app/node_modules ./node_modules
COPY package*.json ./

# Copy prisma files
COPY prisma ./prisma/
RUN npx prisma generate

# Copy built application
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public

# Create data directory for SQLite
RUN mkdir -p /app/data

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000/api/health || exit 1

# Start script
COPY docker-entrypoint.sh /usr/local/bin/
RUN chmod +x /usr/local/bin/docker-entrypoint.sh

ENTRYPOINT ["docker-entrypoint.sh"]
CMD ["node", "node_modules/.bin/next", "start"]
