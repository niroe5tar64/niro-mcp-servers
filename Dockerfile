# Use Bun official image
FROM oven/bun:1 AS base
WORKDIR /app

# Install dependencies
FROM base AS install
COPY package.json bun.lockb* ./
# Copy all package.json files maintaining directory structure
COPY packages/confluence-md/package.json ./packages/confluence-md/
COPY packages/shared/package.json ./packages/shared/
RUN bun install --frozen-lockfile

# Build
FROM base AS build
COPY --from=install /app/node_modules ./node_modules
COPY . .
RUN bun run build

# Production
FROM base AS production
COPY --from=install /app/node_modules ./node_modules
COPY --from=build /app/packages ./packages
COPY package.json ./

# Run as non-root user
USER bun
EXPOSE 3000

# Default command (override in docker-compose for specific servers)
CMD ["bun", "run", "start"]
