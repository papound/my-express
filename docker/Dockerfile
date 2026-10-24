# Multi-stage Dockerfile for Next.js 15 with Puppeteer & Thai Fonts support

FROM node:22-alpine AS base

# Install dependencies for Chromium & Thai fonts
RUN apk add --no-cache \
    chromium \
    nss \
    freetype \
    harfbuzz \
    ca-certificates \
    ttf-freefont \
    font-noto-thai \
    font-noto

# Skip automatic Chromium download in puppeteer; use system Chromium
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true \
    PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser

WORKDIR /app

# Dependencies Stage
FROM base AS deps
COPY package.json package-lock.json* ./
RUN npm ci

# Builder Stage
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Build Next.js
ENV NEXT_TELEMETRY_DISABLED=1
RUN mkdir -p /app/public
RUN npm run build

# Runner Stage (Production)
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    PORT=3000 \
    HOSTNAME="0.0.0.0"

# Create non-root user
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# Copy built application
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/data/logo ./data/logo
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Create data directory for volume mount
RUN mkdir -p /data/ThongTha && chown -R nextjs:nodejs /data

USER nextjs

EXPOSE 3000

CMD ["node", "server.js"]

