# ── Stage 1: Build ──
FROM oven/bun:1-alpine AS builder

WORKDIR /app

# Copy root workspace files
COPY package.json bun.lock bunfig.toml tsconfig.base.json ./

# Copy shared types (workspace dependency)
COPY shared/ ./shared/

# Copy web package
COPY packages/web/ ./packages/web/

# Install dependencies (workspace-aware)
RUN bun install --frozen-lockfile

# Build Next.js (output: standalone with monorepo tracing)
WORKDIR /app/packages/web
RUN bun run build

# ── Stage 2: Production runner ──
FROM oven/bun:1-alpine AS runner

WORKDIR /app

# Copy standalone output (self-contained server.js + node_modules)
COPY --from=builder /app/packages/web/.next/standalone ./

# Copy static assets and public files
COPY --from=builder /app/packages/web/.next/static ./.next/static
COPY --from=builder /app/packages/web/public ./public 2>/dev/null || true

EXPOSE 11001

ENV NODE_ENV=production
ENV PORT=11001

# Next.js standalone outputs a server.js entry point
CMD ["bun", "server.js"]
