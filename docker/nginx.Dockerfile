# ── Stage 1: Build Admin SPA ──
FROM oven/bun:1-alpine AS admin-builder

WORKDIR /app

# Copy root workspace files
COPY package.json bun.lock tsconfig.base.json ./

# Copy shared (workspace dependency)
COPY shared/ ./shared/

# Copy admin package
COPY packages/admin/ ./packages/admin/

# Install dependencies
RUN bun install --frozen-lockfile

# Build admin (Vite SPA → dist/)
WORKDIR /app/packages/admin
RUN bun run build

# ── Stage 2: Nginx with admin static files ──
FROM nginx:alpine

# Copy admin built files
COPY --from=admin-builder /app/packages/admin/dist /app/admin-dist

# Copy nginx config
COPY docker/nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
