# Use Node.js 20 LTS as base image
FROM node:20-alpine AS base

# Install dependencies only when needed
FROM base AS deps
RUN apk add --no-cache libc6-compat openssl
WORKDIR /app

# Copy package files
COPY package.json package-lock.json* ./
RUN npm ci --only=production && npm cache clean --force

# Build stage with all dependencies
FROM base AS builder
RUN apk add --no-cache libc6-compat openssl
WORKDIR /app

# Install all dependencies (including dev dependencies)
COPY package.json package-lock.json* ./
RUN npm ci

# Copy source files and configuration
COPY tsconfig.json prisma.config.ts ./
COPY src ./src

# Generate Prisma Client and build TypeScript
RUN npx prisma generate && npm run build

# Production image
FROM base AS runner
RUN apk add --no-cache openssl
WORKDIR /app

ENV NODE_ENV=production

# Create a non-root user
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nodejs

# Copy production dependencies from deps stage
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/package.json ./package.json

# Copy built application
COPY --from=builder /app/build ./build

# Copy Prisma schema and migrations for runtime
COPY --from=builder /app/src/database/schema.prisma ./src/database/schema.prisma
COPY --from=builder /app/src/database/migrations ./src/database/migrations

# Copy generated Prisma Client
COPY --from=builder /app/src/database/generated ./src/database/generated

# Copy static assets
COPY --from=builder /app/src/public ./src/public

# Copy Prisma config
COPY --from=builder /app/prisma.config.ts ./prisma.config.ts

# Change ownership to nodejs user
RUN chown -R nodejs:nodejs /app
USER nodejs

# Expose port
EXPOSE 8080

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://0.0.0.0.0.0.0:8080/health', (res) => { process.exit(res.statusCode === 200 ? 0 : 1) })" || exit 1

# Start the application
CMD ["npm", "start"]