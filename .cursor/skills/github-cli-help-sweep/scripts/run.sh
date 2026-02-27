#!/usr/bin/env bash

set -euo pipefail

OUT_DIR="${1:-.cursor/tmp/gh-help}"

mkdir -p "$OUT_DIR"

echo "Collecting gh reference..."
gh help reference > "$OUT_DIR/reference.txt"

echo "Extracting command paths..."
awk '/^## gh / || /^### gh / {sub(/^###[ ]?/,""); sub(/^##[ ]?/,""); print}' \
  "$OUT_DIR/reference.txt" \
| sed 's/^gh //' \
| awk '{
    cmd=""
    for(i=1;i<=NF;i++){
      if($i ~ /^[\[<{]/) break
      cmd = cmd (cmd?" ":"") $i
    }
    if(cmd!="") print cmd
  }' \
| sort -u > "$OUT_DIR/commands.txt"

rm -f "$OUT_DIR/help-status.tsv" "$OUT_DIR/failures.txt"

echo "Running help sweep..."
while IFS= read -r cmd; do
  [ -z "$cmd" ] && continue
  out="$OUT_DIR/${cmd// /__}--help.txt"

  read -r -a parts <<< "$cmd"
  if gh "${parts[@]}" --help </dev/null > "$out" 2>&1; then
    printf "0\t%s\n" "$cmd" >> "$OUT_DIR/help-status.tsv"
  else
    rc=$?
    printf "%s\t%s\n" "$rc" "$cmd" >> "$OUT_DIR/help-status.tsv"
    echo "FAILED: gh $cmd --help" >> "$OUT_DIR/failures.txt"
  fi
done < "$OUT_DIR/commands.txt"

echo "Running special-case help..."
gh completion --help > "$OUT_DIR/completion--help.txt" 2>&1 || true
gh help extension exec > "$OUT_DIR/extension__exec--help.txt" 2>&1 || true

total="$(wc -l < "$OUT_DIR/commands.txt" | tr -d '[:space:]')"
failed="0"
if [ -f "$OUT_DIR/failures.txt" ]; then
  failed="$(wc -l < "$OUT_DIR/failures.txt" | tr -d '[:space:]')"
fi
succeeded=$((total - failed))

cat <<EOF
GitHub CLI help sweep complete.

Output directory: $OUT_DIR
Commands discovered: $total
Help succeeded: $succeeded
Help failed: $failed
Special cases handled: gh completion --help, gh help extension exec
EOF
