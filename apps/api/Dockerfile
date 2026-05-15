FROM node:20-alpine AS base
RUN npm install -g pnpm@9

# ── Stage 1: install dependencies ────────────────────────────────────────────
FROM base AS deps
WORKDIR /app
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./
COPY apps/api/package.json ./apps/api/
COPY packages/shared/package.json ./packages/shared/
# Install api deps, then shared's own deps (including devDeps for tsc)
RUN pnpm install --frozen-lockfile --filter api... && \
    pnpm install --frozen-lockfile --filter @venlaxiq/shared

# ── Stage 2: build ────────────────────────────────────────────────────────────
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/apps/api/node_modules ./apps/api/node_modules
COPY --from=deps /app/packages/shared/node_modules ./packages/shared/node_modules
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./
COPY packages/shared ./packages/shared
COPY apps/api ./apps/api
# Build shared first so its dist/ is available for the API at runtime
RUN pnpm --filter @venlaxiq/shared build
# Build API
RUN pnpm --filter api build
# Resolve workspace symlinks into a standalone production bundle
RUN pnpm deploy --filter api --prod /deploy

# ── Stage 3: minimal production image ─────────────────────────────────────────
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
RUN npm install -g pnpm@9 && \
    apk add --no-cache wget && \
    addgroup -g 1001 -S nodejs && adduser -S nodejs -u 1001
# pnpm deploy output: real files, no symlinks, workspace deps included
COPY --from=builder --chown=nodejs:nodejs /deploy/node_modules ./node_modules
COPY --from=builder --chown=nodejs:nodejs /deploy/dist ./dist
COPY --from=builder --chown=nodejs:nodejs /deploy/package.json ./package.json
COPY --from=builder --chown=nodejs:nodejs /app/apps/api/src/db/migrations ./migrations
COPY --from=builder --chown=nodejs:nodejs /app/apps/api/src ./src
COPY --from=builder --chown=nodejs:nodejs /app/apps/api/scripts ./scripts
COPY --from=builder --chown=nodejs:nodejs /app/packages/shared ./packages/shared
USER nodejs
EXPOSE 3001
HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
  CMD wget -qO- http://localhost:3001/health || exit 1
CMD ["node", "dist/index.js"]
