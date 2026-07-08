# Stage 1: Build the frontend with SSR support
FROM cgr.dev/chainguard/node:latest-dev AS node-builder

WORKDIR /app

USER root
RUN corepack enable && corepack prepare pnpm@11.10.0 --activate

USER node

WORKDIR /app/frontend

COPY --chown=node:node frontend/package.json frontend/pnpm-lock.yaml frontend/pnpm-workspace.yaml ./

ENV PUBLIC_SHOW_COOLIFY=true

RUN pnpm install --frozen-lockfile && \
    pnpm add -D @sveltejs/adapter-node

COPY --chown=node:node frontend/ .
COPY --chown=node:node docker/scripts/configure-ssr.sh docker/scripts/verify-build.sh ./

RUN chmod +x configure-ssr.sh verify-build.sh && \
    ./configure-ssr.sh && \
    pnpm run build && \
    ./verify-build.sh

# Stage 2: Runtime with Node.js
FROM cgr.dev/chainguard/node:latest

WORKDIR /app

COPY --from=node-builder --chown=node:node /app/frontend/build ./build
COPY --from=node-builder --chown=node:node /app/frontend/package.json ./package.json
COPY --from=node-builder --chown=node:node /app/frontend/node_modules ./node_modules

EXPOSE 3000

ENV PORT=3000 \
    HOST=0.0.0.0 \
    NODE_ENV=production \
    PUBLIC_SHOW_COOLIFY=true

USER node

CMD ["build/index.js"]

