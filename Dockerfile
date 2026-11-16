# Stage 1: install all dependencies and build the SSR bundle
FROM cgr.dev/chainguard/node:latest-dev AS node-builder

WORKDIR /app/frontend

USER node

COPY --chown=node:node frontend/package.json frontend/pnpm-lock.yaml frontend/pnpm-workspace.yaml frontend/.npmrc ./

RUN mkdir -p "$HOME/.local/bin" && \
    corepack enable --install-directory "$HOME/.local/bin" && \
    corepack install
ENV PATH="/home/node/.local/bin:${PATH}"

ENV PUBLIC_SHOW_COOLIFY=true \
    SVELTEKIT_ADAPTER=node

RUN pnpm install --frozen-lockfile

COPY --chown=node:node frontend/ .
COPY --chown=node:node docker/scripts/configure-ssr.sh docker/scripts/verify-build.sh ./

RUN chmod +x configure-ssr.sh verify-build.sh && \
    ./configure-ssr.sh && \
    pnpm run build && \
    ./verify-build.sh

# Stage 2: production dependencies only (Chainguard runtime has no corepack/pnpm)
FROM cgr.dev/chainguard/node:latest-dev AS prod-deps

WORKDIR /app/frontend

USER node

COPY --chown=node:node frontend/package.json frontend/pnpm-lock.yaml frontend/pnpm-workspace.yaml frontend/.npmrc ./

RUN mkdir -p "$HOME/.local/bin" && \
    corepack enable --install-directory "$HOME/.local/bin" && \
    corepack install
ENV PATH="/home/node/.local/bin:${PATH}"

RUN pnpm install --prod --frozen-lockfile

# Stage 3: minimal rootless runtime
FROM cgr.dev/chainguard/node:latest

WORKDIR /app

COPY --from=node-builder --chown=node:node /app/frontend/build ./build
COPY --from=prod-deps --chown=node:node /app/frontend/node_modules ./node_modules
COPY --from=node-builder --chown=node:node /app/frontend/package.json ./package.json

EXPOSE 3000

ENV PORT=3000 \
    HOST=0.0.0.0 \
    NODE_ENV=production \
    PUBLIC_SHOW_COOLIFY=true \
    SOURCE_ZIP_CACHE_DIR=/tmp/reticulum-go-source-cache \
    DOCS_CACHE_DIR=/tmp/reticulum-go-docs-cache

USER node

CMD ["build/index.js"]
