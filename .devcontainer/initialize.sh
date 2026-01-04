#!/bin/bash
set -e

# ホストマシン上でコンテナ作成前に必要なディレクトリを作成
# マウントに失敗しないよう、事前にディレクトリとファイルを確保

echo "Initializing host directories for DevContainer..."

# Claude Code 設定ディレクトリ
mkdir -p ~/.claude/rules ~/.claude/ide ~/.claude/plans ~/.claude/todos ~/.claude/debug

# Claude Code 設定ファイル（空ファイルを作成）
touch ~/.claude/settings.json

# Codex 設定ディレクトリ
mkdir -p ~/.codex

echo "Host directories initialized successfully."
