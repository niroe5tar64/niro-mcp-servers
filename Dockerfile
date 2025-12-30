# Use Bun official image
FROM oven/bun:1 AS base
WORKDIR /app

# Install dependencies
FROM base AS install
# Copy all files first to ensure workspace resolution works correctly
COPY . .
# Install dependencies (workspace dependencies will be resolved)
RUN bun install

# Build
FROM base AS build
COPY --from=install /app/node_modules ./node_modules
COPY --from=install /app/packages ./packages
COPY package.json bun.lock* bunfig.toml* ./
RUN bun run build

# Production
FROM base AS production
COPY --from=install /app/node_modules ./node_modules
COPY --from=build /app/packages ./packages
COPY package.json ./

# Rename bun user to dev-user
RUN usermod -l dev-user bun && \
    groupmod -n dev-user bun && \
    usermod -d /home/dev-user -m dev-user

# Run as non-root user
USER dev-user
EXPOSE 50301

# Default command (override in docker-compose for specific servers)
CMD ["bun", "run", "start"]
