# syntax=docker/dockerfile:1

# ============================================================================
# Stage 1 — deps: install production dependencies (cached layer)
# ============================================================================
FROM node:20-slim AS deps
WORKDIR /app

# Copy lockfile + package.json first to maximize cache hits
COPY package.json bun.lock* package-lock.json* ./

# Install ALL deps (including devDeps) — we prune in a later stage
RUN npm install --legacy-peer-deps

# ============================================================================
# Stage 2 — builder: build the Next.js standalone production bundle
# ============================================================================
FROM node:20-slim AS builder
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Prisma: generate the client (needed at build time for type imports)
RUN npx prisma generate

# Next.js standalone production build
ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build

# ============================================================================
# Stage 3 — runner: minimal production image
# ============================================================================
FROM node:20-slim AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

# Run as a non-root user for security
RUN addgroup --system --gid 1001 nodejs \
 && adduser  --system --uid 1001 nextjs

# Copy the standalone server bundle (Next.js `output: standalone`)
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/public ./public

# Prisma schema + migrations (so `prisma db push` works at runtime)
COPY --from=builder --chown=nextjs:nodejs /app/prisma ./prisma

# Directories for runtime-generated assets (AI images, TTS audio, uploads)
RUN mkdir -p /app/db /app/public/assets /app/upload \
 && chown -R nextjs:nodejs /app/db /app/public/assets /app/upload

USER nextjs

EXPOSE 3000

# On first run: push the Prisma schema to SQLite, then start the server.
# DATABASE_URL is set by docker-compose / env; defaults to /app/db/custom.db.
CMD ["sh", "-c", "npx prisma db push --accept-data-loss && node server.js"]
