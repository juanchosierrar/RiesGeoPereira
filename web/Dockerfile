FROM node:22-slim AS base

# --- Dependencies ---
FROM base AS deps
# Install compatibility libraries for native binaries
RUN apt-get update && apt-get install -y --no-install-recommends \
    python3 make g++ \
    && rm -rf /var/lib/apt/lists/*
WORKDIR /app
# Copy only what's needed to install dependencies
COPY web/package.json web/.npmrc ./
# Use npm install (NOT npm ci) so npm downloads the correct
# platform-specific SWC binary for THIS Linux host, regardless
# of what OS generated the lockfile.
RUN npm install --legacy-peer-deps

# --- Build ---
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY web/ ./
ENV NODE_OPTIONS="--max-old-space-size=2048"
ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build

# --- Production Runner ---
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

RUN groupadd --system --gid 1001 nodejs \
    && useradd --system --uid 1001 --gid nodejs nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["node", "server.js"]
