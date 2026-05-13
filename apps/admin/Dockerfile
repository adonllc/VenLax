FROM node:20-alpine AS base
RUN npm install -g pnpm@9

# ── Stage 1: install dependencies ────────────────────────────────────────────
FROM base AS deps
WORKDIR /app
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./
COPY apps/admin/package.json ./apps/admin/
COPY packages/ui/package.json ./packages/ui/
COPY packages/shared/package.json ./packages/shared/
# Install admin deps, then shared's own devDeps (needed for tsc)
RUN pnpm install --frozen-lockfile --filter admin... && \
    pnpm install --frozen-lockfile --filter @venlaxiq/shared && \
    pnpm install --frozen-lockfile --filter @venlaxiq/ui

# ── Stage 2: build ────────────────────────────────────────────────────────────
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/apps/admin/node_modules ./apps/admin/node_modules
COPY --from=deps /app/packages/shared/node_modules ./packages/shared/node_modules
COPY --from=deps /app/packages/ui/node_modules ./packages/ui/node_modules
COPY package.json pnpm-workspace.yaml ./
COPY packages/shared ./packages/shared
COPY packages/ui ./packages/ui
COPY apps/admin ./apps/admin
RUN pnpm --filter @venlaxiq/shared build
ENV NEXT_TELEMETRY_DISABLED=1
RUN pnpm --filter admin build

# ── Stage 3: minimal production image ─────────────────────────────────────────
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3002
RUN apk add --no-cache wget && addgroup -g 1001 -S nodejs && adduser -S nodejs -u 1001
COPY --from=builder --chown=nodejs:nodejs /app/apps/admin/.next/standalone ./
COPY --from=builder --chown=nodejs:nodejs /app/apps/admin/.next/static ./apps/admin/.next/static
USER nodejs
EXPOSE 3002
ENV PORT=3002
ENV HOSTNAME=0.0.0.0
HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
  CMD wget -qO- http://localhost:3002/ || exit 1
CMD ["node", "apps/admin/server.js"]
