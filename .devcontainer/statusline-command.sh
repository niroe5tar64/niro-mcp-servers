#!/bin/bash

# Read JSON input from stdin
input=$(cat)

# Extract basic information
model=$(echo "$input" | jq -r '.model.display_name // .model.id')
current_dir=$(echo "$input" | jq -r '.workspace.current_dir')
output_style=$(echo "$input" | jq -r '.output_style.name // "default"')

# Get short directory name (basename)
dir_name=$(basename "$current_dir")

# Get git branch if in a git repository
git_info=""
if git -C "$current_dir" rev-parse --git-dir > /dev/null 2>&1; then
    branch=$(git -C "$current_dir" -c core.useBuiltinFSMonitor=false -c core.fsmonitor=false branch --show-current 2>/dev/null)
    if [ -n "$branch" ]; then
        # Check if there are uncommitted changes
        if ! git -C "$current_dir" -c core.useBuiltinFSMonitor=false -c core.fsmonitor=false diff --quiet 2>/dev/null || \
           ! git -C "$current_dir" -c core.useBuiltinFSMonitor=false -c core.fsmonitor=false diff --cached --quiet 2>/dev/null; then
            git_info=" $(printf '\033[33m')±$(printf '\033[0m') $branch"
        else
            git_info=" $(printf '\033[32m')✓$(printf '\033[0m') $branch"
        fi
    fi
fi

# Calculate context window usage percentage
context_info=""
usage=$(echo "$input" | jq '.context_window.current_usage')
if [ "$usage" != "null" ]; then
    current=$(echo "$usage" | jq '.input_tokens + .cache_creation_input_tokens + .cache_read_input_tokens')
    size=$(echo "$input" | jq '.context_window.context_window_size')
    if [ "$size" != "null" ] && [ "$size" -gt 0 ]; then
        pct=$((current * 100 / size))
        # Color code based on usage: green < 50%, yellow < 80%, red >= 80%
        if [ "$pct" -lt 50 ]; then
            color=$(printf '\033[32m')
        elif [ "$pct" -lt 80 ]; then
            color=$(printf '\033[33m')
        else
            color=$(printf '\033[31m')
        fi
        context_info=" │ ${color}${pct}%%$(printf '\033[0m') ctx"
    fi
fi

# Output style indicator (only if not default)
style_info=""
if [ "$output_style" != "default" ]; then
    style_info=" │ $(printf '\033[36m')$output_style$(printf '\033[0m')"
fi

# Build the status line
printf "$(printf '\033[35m')%s$(printf '\033[0m') │ $(printf '\033[34m')%s$(printf '\033[0m')%s%s%s\n" \
    "$model" "$dir_name" "$git_info" "$context_info" "$style_info"
