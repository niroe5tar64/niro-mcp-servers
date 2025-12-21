#!/bin/sh
set -eu

SRC_DIR="/home/bun/.claude/commands"
DST_DIR="$(dirname "$0")/../references"

if [ ! -d "$SRC_DIR" ]; then
  echo "Source directory not found: $SRC_DIR" >&2
  exit 1
fi

mkdir -p "$DST_DIR"

# Copy markdown command specs into references for use by the skill.
# Do not delete any files in references; this is a non-destructive sync.
cp -f "$SRC_DIR"/*.md "$DST_DIR"/ 2>/dev/null || true

ls -1 "$DST_DIR"/*.md 2>/dev/null || true
