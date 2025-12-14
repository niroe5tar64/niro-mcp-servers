#!/usr/bin/env bash
set -euo pipefail

# ---- utilities --------------------------------------------------------------

trim() {
  local s="$1"
  s="${s#"${s%%[![:space:]]*}"}"
  s="${s%"${s##*[![:space:]]}"}"
  printf '%s' "$s"
}

# Bash glob match. NOTE: do not quote $pattern (glob needs expansion).
matches_deny_pattern() {
  local cmd pattern
  cmd="$(trim "$1")"
  pattern="$(trim "$2")"
  [[ "$cmd" == $pattern ]]
}

die() {
  # Hook error message (stderr) + Claude Code should treat non-zero as deny
  echo "Error: $*" >&2
  exit 2
}

# ---- read stdin JSON --------------------------------------------------------

input="$(cat || true)"

# We only support jq. If jq is missing, fail closed.
if ! command -v jq >/dev/null 2>&1; then
  die "jq が見つかりません。deny-check を実行できないため拒否します。"
fi

tool_name="$(echo "$input" | jq -r '.tool_name // empty' 2>/dev/null || true)"

# Only check Bash tool calls
if [ "$tool_name" != "Bash" ]; then
  exit 0
fi

command="$(echo "$input" | jq -r '.tool_input.command // empty' 2>/dev/null || true)"
command="$(trim "$command")"

# If we couldn't read the command, fail closed (avoid "allow all" on format changes).
if [ -z "$command" ]; then
  die "Bash command が空、または読み取れませんでした（入力JSONの形式変更の可能性）。"
fi

# ---- resolve settings.json --------------------------------------------------

# Priority:
# 1) CLAUDE_SETTINGS_PATH (devcontainer.json などで固定できる)
# 2) repo local: $PWD/.claude/settings.json
# 3) user home:  $HOME/.claude/settings.json
settings_file="${CLAUDE_SETTINGS_PATH:-}"

if [ -z "$settings_file" ]; then
  if [ -f "$PWD/.claude/settings.json" ]; then
    settings_file="$PWD/.claude/settings.json"
  else
    settings_file="$HOME/.claude/settings.json"
  fi
fi

if [ ! -f "$settings_file" ]; then
  die "settings.json が見つかりません: $settings_file"
fi

# ---- load deny patterns -----------------------------------------------------

# Extract only Bash(...) patterns and strip wrapper.
# If parsing fails, fail closed (deny list unavailable).
deny_patterns="$(jq -r '
  (.permissions.deny // [])
  | .[]
  | select(type=="string")
  | select(startswith("Bash("))
  | sub("^Bash\\("; "")
  | sub("\\)$"; "")
' "$settings_file" 2>/dev/null || true)"

if [ -z "${deny_patterns//[[:space:]]/}" ]; then
  # No patterns => allow (this is intentional; don't break developers by default)
  exit 0
fi

# ---- check whole command ----------------------------------------------------

while IFS= read -r pattern; do
  pattern="$(trim "${pattern:-}")"
  [ -z "$pattern" ] && continue

  if matches_deny_pattern "$command" "$pattern"; then
    die "コマンドが拒否されました: '$command' (パターン: '$pattern')"
  fi
done <<<"$deny_patterns"

# ---- check split parts (; && || only) --------------------------------------

temp_command="$command"
temp_command="${temp_command//;/$'\n'}"
temp_command="${temp_command//&&/$'\n'}"
temp_command="${temp_command//\|\|/$'\n'}"

IFS=$'\n'
for cmd_part in $temp_command; do
  cmd_part="$(trim "${cmd_part:-}")"
  [ -z "$cmd_part" ] && continue

  while IFS= read -r pattern; do
    pattern="$(trim "${pattern:-}")"
    [ -z "$pattern" ] && continue

    if matches_deny_pattern "$cmd_part" "$pattern"; then
      die "コマンドが拒否されました: '$cmd_part' (パターン: '$pattern')"
    fi
  done <<<"$deny_patterns"
done

# Allow
exit 0
