# ==========================================
# Umbreon Store Web API (NestJS) Dockerfile
# ==========================================

FROM node:24-alpine AS base
RUN apk add --no-cache libc6-compat
RUN corepack enable && corepack prepare pnpm@10.26.2 --activate
RUN npm install -g turbo@^2.7.2

# Stage 1: Prune monorepo for web-api
FROM base AS pruner
WORKDIR /app
COPY . .
RUN turbo prune web-api --docker

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

# Build web-api application
RUN pnpm --filter web-api build

# Stage 3: Production Runner
FROM node:24-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=9991
RUN apk add --no-cache dumb-init

# Security: run as non-root user
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nestjs

COPY --from=builder --chown=1001:1001 /app/node_modules ./node_modules
COPY --from=builder --chown=1001:1001 /app/packages ./packages
COPY --from=builder --chown=1001:1001 /app/apps/web-api/node_modules ./apps/web-api/node_modules
COPY --from=builder --chown=1001:1001 /app/apps/web-api/package.json ./apps/web-api/package.json
COPY --from=builder --chown=1001:1001 /app/apps/web-api/dist ./apps/web-api/dist
COPY --from=builder --chown=1001:1001 /app/package.json ./package.json

USER nestjs

EXPOSE 9991

CMD ["dumb-init", "node", "apps/web-api/dist/main.js"]
