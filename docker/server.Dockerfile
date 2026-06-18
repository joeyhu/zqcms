FROM oven/bun:1-alpine

WORKDIR /app

# Install prisma CLI and dependencies
COPY packages/server/package.json packages/server/bun.lock ./
RUN bun install --frozen-lockfile

# Copy shared types
COPY shared/ ../shared/

# Copy server source and prisma schema
COPY packages/server/ ./

# Generate Prisma client
RUN cd /app && bunx prisma generate

EXPOSE 11003

ENV API_PORT=11003

CMD ["bun", "run", "src/index.ts"]
