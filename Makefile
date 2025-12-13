.PHONY: help dev-build dev-up dev-down dev-restart dev-shell dev-logs mcp-up mcp-down clean install test build

# Default target
help:
	@echo "Available commands:"
	@echo "  make dev-build       - Build the development container"
	@echo "  make dev-up          - Start the development container"
	@echo "  make dev-down        - Stop the development container"
	@echo "  make dev-restart     - Restart the development container"
	@echo "  make dev-shell       - Open a shell in the development container"
	@echo "  make dev-logs        - Show development container logs"
	@echo "  make mcp-up          - Start all MCP servers"
	@echo "  make mcp-down        - Stop all MCP servers"
	@echo "  make install         - Install dependencies in dev container"
	@echo "  make test            - Run tests in dev container"
	@echo "  make build           - Build packages in dev container"
	@echo "  make clean           - Clean up containers and volumes"

# Development container commands
dev-build:
	docker-compose -f docker-compose.dev.yml build devcontainer

dev-up:
	docker-compose -f docker-compose.dev.yml up -d devcontainer

dev-down:
	docker-compose -f docker-compose.dev.yml down

dev-restart: dev-down dev-up

dev-shell:
	docker exec -it niro-mcp-devcontainer /bin/bash

dev-logs:
	docker-compose -f docker-compose.dev.yml logs -f devcontainer

# MCP server commands
mcp-up:
	docker-compose -f docker-compose.dev.yml --profile mcp-servers up -d

mcp-down:
	docker-compose -f docker-compose.dev.yml --profile mcp-servers down

# Development commands (run inside container)
install:
	docker exec -it niro-mcp-devcontainer bun install

test:
	docker exec -it niro-mcp-devcontainer bun test

build:
	docker exec -it niro-mcp-devcontainer bun run build

# Cleanup
clean:
	docker-compose -f docker-compose.dev.yml down -v
	docker system prune -f
