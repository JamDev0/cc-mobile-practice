#!/usr/bin/env bash

set -euo pipefail

OUT_DIR="${1:-.cursor/tmp/gh-help}"

commands_file="$OUT_DIR/commands.txt"
status_file="$OUT_DIR/help-status.tsv"
failures_file="$OUT_DIR/failures.txt"

if [ ! -f "$commands_file" ]; then
  echo "Missing $commands_file"
  echo "Run scripts/run.sh first."
  exit 1
fi

total="$(wc -l < "$commands_file" | tr -d '[:space:]')"
failed="0"
if [ -f "$failures_file" ]; then
  failed="$(wc -l < "$failures_file" | tr -d '[:space:]')"
fi
succeeded=$((total - failed))

echo "GitHub CLI help sweep summary"
echo "Output directory: $OUT_DIR"
echo "Commands discovered: $total"
echo "Help succeeded: $succeeded"
echo "Help failed: $failed"
echo "Special-case docs: completion--help.txt, extension__exec--help.txt"

if [ -f "$status_file" ]; then
  echo ""
  echo "Non-zero exit codes by command:"
  awk -F '\t' '$1 != "0" {print "- ["$1"] "$2}' "$status_file" || true
fi

if [ -f "$failures_file" ]; then
  echo ""
  echo "Failures:"
  sed 's/^/- /' "$failures_file"
fi
