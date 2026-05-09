# ---- Base: Downgraded to Node 20 LTS for webpack stability ----
FROM node:20-slim AS base

# ---- Dependencies ----
FROM base AS deps
RUN apt-get update && apt-get install -y --no-install-recommends \
    python3 make g++ \
    && rm -rf /var/lib/apt/lists/*
WORKDIR /app

# Copy package files
COPY web/package.json web/.npmrc ./

# Install deps (npm install resolves platform-specific SWC binaries for this Linux host)
RUN npm install --legacy-peer-deps

# ---- Build ----
FROM base AS builder
WORKDIR /app

# Increase Node memory for webpack build
ENV NODE_OPTIONS="--max-old-space-size=3072"
ENV NEXT_TELEMETRY_DISABLED=1

COPY --from=deps /app/node_modules ./node_modules
COPY web/ ./

# Run a clean build (no rimraf, node_modules already clean from deps stage)
RUN npm run build

# ---- Production Runner ----
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
