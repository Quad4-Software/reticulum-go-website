# Stage 1: Build the frontend
FROM cgr.dev/chainguard/node:latest-dev AS node-builder
WORKDIR /app
USER root
RUN corepack enable && corepack prepare pnpm@10.25.0 --activate
USER node
COPY --chown=node:node frontend/package.json frontend/pnpm-lock.yaml ./frontend/
WORKDIR /app/frontend
ENV PUBLIC_SHOW_COOLIFY=true
RUN pnpm install --frozen-lockfile
COPY --chown=node:node frontend/ .
RUN pnpm run build

# Stage 2: Build the Go binary with embedded assets
FROM cgr.dev/chainguard/go:latest-dev AS go-builder
WORKDIR /app
COPY go.mod ./
RUN go mod download
COPY cmd/ ./cmd/
COPY internal/ ./internal/
COPY --from=node-builder /app/frontend/build ./cmd/server/dist
RUN CGO_ENABLED=0 go build -ldflags="-s -w" -o reticulum-go-web ./cmd/server

# Stage 3: Minimal runtime image
FROM cgr.dev/chainguard/wolfi-base:latest
WORKDIR /app
COPY --from=go-builder /app/reticulum-go-web .
RUN apk add --no-cache ca-certificates

EXPOSE 8080
ENV PORT=8080
ENV HOST=0.0.0.0
ENV DOMAIN=""
ENV NODE_ENV=production
ENV PUBLIC_SHOW_COOLIFY=true

USER 65532

CMD ["./reticulum-go-web"]

