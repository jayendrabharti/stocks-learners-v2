# Use Node.js 20 LTS
FROM node:20-alpine AS base

# Install dependencies
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm ci --only=production && npm cache clean --force

# Dev deps for building
FROM base AS build-deps
RUN apk add --no-cache libc6-compat
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm ci

# Build the app
FROM base AS builder
WORKDIR /app

# Copy node_modules with dev deps
COPY --from=build-deps /app/node_modules ./node_modules

# Copy all required files
COPY package.json tsconfig.json prisma.config.ts ./
COPY src ./src

# Generate Prisma Client before building TypeScript
RUN npx prisma generate --schema=./src/database/prisma/schema.prisma

# Build TypeScript
RUN npm run build

# Production image
FROM base AS runner
WORKDIR /app

# Create non-root user
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nodejs

# Copy build output & production deps
COPY --from=builder /app/build ./build
COPY --from=deps /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/prisma.config.ts ./prisma.config.ts

# Copy prisma schema + migrations + generated client
COPY --from=builder /app/src/database ./src/database

# Copy public assets
COPY --from=builder /app/src/public ./src/public

# Own the folder
RUN chown -R nodejs:nodejs /app
USER nodejs

# Expose Cloud Run port
EXPOSE 8080

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://0.0.0.0:8080/health', (res) => { process.exit(res.statusCode === 200 ? 0 : 1) })" || exit 1

# Start container: run migrations then boot server
CMD ["sh", "-c", "npx prisma migrate deploy && npm start"]
