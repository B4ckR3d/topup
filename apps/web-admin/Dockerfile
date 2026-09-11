# ==========================================
# Umbreon Store Web Admin (AdonisJS 6) Dockerfile
# ==========================================

FROM node:24-alpine AS base
RUN apk add --no-cache libc6-compat
RUN corepack enable && corepack prepare pnpm@10.26.2 --activate
RUN npm install -g turbo@^2.7.2

# Stage 1: Prune monorepo for web-admin
FROM base AS pruner
WORKDIR /app
COPY . .
RUN turbo prune web-admin --docker

# Stage 2: Install dependencies & Build
FROM base AS builder
WORKDIR /app
RUN apk add --no-cache python3 make g++

COPY --from=pruner /app/out/json/ .
COPY --from=pruner /app/out/pnpm-lock.yaml ./pnpm-lock.yaml
RUN pnpm install --frozen-lockfile

COPY --from=pruner /app/out/full/ .

# Build dependent internal workspace packages first
RUN pnpm --filter @umbreon/configs build
RUN pnpm --filter @umbreon/db build
RUN pnpm --filter @umbreon/ui build

# Build web-admin (compiles TypeScript server & Vite/Inertia SSR assets into build/)
ARG VITE_S3_URL=""
ENV VITE_S3_URL=$VITE_S3_URL
RUN pnpm --filter web-admin build

# Stage 3: Production Runner
FROM node:24-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3333
ENV HOST=0.0.0.0
RUN apk add --no-cache dumb-init

# Security: run as non-root user
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 adonisjs

COPY --from=builder --chown=1001:1001 /app/node_modules ./node_modules
COPY --from=builder --chown=1001:1001 /app/packages ./packages
COPY --from=builder --chown=1001:1001 /app/apps/web-admin/node_modules ./apps/web-admin/node_modules
COPY --from=builder --chown=1001:1001 /app/apps/web-admin/build ./apps/web-admin/build
COPY --from=builder --chown=1001:1001 /app/apps/web-admin/build/public ./public
COPY --from=builder --chown=1001:1001 /app/apps/web-admin/build/public ./apps/web-admin/public
COPY --from=builder --chown=1001:1001 /app/apps/web-admin/build/ssr ./ssr
COPY --from=builder --chown=1001:1001 /app/apps/web-admin/package.json ./apps/web-admin/package.json
COPY --from=builder --chown=1001:1001 /app/package.json ./package.json

USER adonisjs

EXPOSE 3333

CMD ["dumb-init", "node", "apps/web-admin/build/bin/server.js"]
