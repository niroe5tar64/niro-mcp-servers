#!/bin/bash
set -e

# スクリプトのディレクトリを取得（サブモジュール対応）
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Update system packages
sudo apt-get update
sudo apt-get install -y vim tree jq unzip

# Install bun
curl -fsSL https://bun.sh/install | bash

append_line_once() {
  local line="$1"
  local file="$2"
  grep -qxF "$line" "$file" || echo "$line" >> "$file"
}

# Add bun to PATH for bash and zsh
append_line_once 'export PATH="$HOME/.bun/bin:$PATH"' ~/.bashrc
append_line_once 'export PATH="$HOME/.bun/bin:$PATH"' ~/.zshrc

# Update PATH for current session
export PATH="$HOME/.bun/bin:$PATH"

# Install CLI tools (npm) - check if npm packages are installed (not just command exists)
if ! npm list -g @anthropic-ai/claude-code @openai/codex &> /dev/null; then
    echo "Installing Claude Code and Codex CLI tools..."
    npm install -g @anthropic-ai/claude-code @openai/codex
else
    echo "Claude Code and Codex CLI tools already installed, skipping..."
fi

# Install wrapper scripts for claude and codex
mkdir -p ~/.local/bin
cp "${SCRIPT_DIR}/bin/claude" ~/.local/bin/claude
cp "${SCRIPT_DIR}/bin/codex" ~/.local/bin/codex
chmod +x ~/.local/bin/claude ~/.local/bin/codex

# Add ~/.local/bin to PATH (prepend to ensure wrappers are found first)
append_line_once 'export PATH="$HOME/.local/bin:$PATH"' ~/.bashrc
append_line_once 'export PATH="$HOME/.local/bin:$PATH"' ~/.zshrc

# Fix git credential helper (retry after initial container setup completes)
# Wait a bit to avoid "Device or resource busy" error during container startup
sleep 2
if ! git config --global --get credential.helper &> /dev/null; then
    echo "Configuring git credential helper..."
    git config --global credential.helper store 2> /dev/null || true
fi
