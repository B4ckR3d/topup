# ==========================================
# Umbreon Store Web Client (React Router v7) Dockerfile
# ==========================================

FROM node:24-alpine AS base
RUN apk add --no-cache libc6-compat
RUN corepack enable && corepack prepare pnpm@10.26.2 --activate
RUN npm install -g turbo@^2.7.2

# Stage 1: Prune monorepo for web-client
FROM base AS pruner
WORKDIR /app
COPY . .
RUN turbo prune web-client --docker

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

# Accept build arguments for Vite client bundle
ARG VITE_API_URL
ARG VITE_GOOGLE_CLIENT_ID
ARG VITE_S3_URL
ENV VITE_API_URL=$VITE_API_URL
ENV VITE_GOOGLE_CLIENT_ID=$VITE_GOOGLE_CLIENT_ID
ENV VITE_S3_URL=$VITE_S3_URL

# Build web-client (React Router SSR & Client Assets)
RUN pnpm --filter web-client build

# Stage 3: Production Runner
FROM node:24-alpine AS runner
WORKDIR /app/apps/web-client

ENV NODE_ENV=production
ENV PORT=9992
RUN apk add --no-cache dumb-init

# Security: run as non-root user
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 reactrouter

COPY --from=builder --chown=1001:1001 /app/node_modules /app/node_modules
COPY --from=builder --chown=1001:1001 /app/packages /app/packages
COPY --from=builder --chown=1001:1001 /app/package.json /app/package.json
COPY --from=builder --chown=1001:1001 /app/apps/web-client/node_modules ./node_modules
COPY --from=builder --chown=1001:1001 /app/apps/web-client/build ./build
COPY --from=builder --chown=1001:1001 /app/apps/web-client/public ./public
COPY --from=builder --chown=1001:1001 /app/apps/web-client/package.json ./package.json

# Copy to root /app as well to ensure any tool referencing /app works seamlessly
COPY --from=builder --chown=1001:1001 /app/apps/web-client/build /app/build
COPY --from=builder --chown=1001:1001 /app/apps/web-client/public /app/public

USER reactrouter

EXPOSE 9992

CMD ["dumb-init", "node", "node_modules/@react-router/serve/dist/cli.js", "./build/server/index.js"]