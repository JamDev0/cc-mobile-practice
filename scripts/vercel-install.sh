#!/usr/bin/env bash
# Vercel install: init git submodule, build vendor/cc-feedback, then install root deps.
# For private submodules, set GIT_SUBMODULE_TOKEN in Vercel (e.g. GitHub PAT) and
# uncomment the url.insteadOf block below.

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

# Optional: use token for submodule clone (for private cc-feedback)
# if [ -n "${GIT_SUBMODULE_TOKEN:-}" ]; then
#   git config --global url."https://${GIT_SUBMODULE_TOKEN}@github.com/".insteadOf "https://github.com/"
# fi

echo "[vercel-install] Initializing git submodule vendor/cc-feedback..."
git submodule update --init --recursive

if [ ! -f "vendor/cc-feedback/package.json" ]; then
  echo "[vercel-install] ERROR: vendor/cc-feedback/package.json missing after submodule update." >&2
  echo "If cc-feedback is a private repo, set GIT_SUBMODULE_TOKEN in Vercel (GitHub PAT with repo read)." >&2
  exit 1
fi

echo "[vercel-install] Installing and building vendor/cc-feedback..."
(cd vendor/cc-feedback && npm install --no-audit --no-fund && npm run build)

echo "[vercel-install] Installing root dependencies..."
npm install --no-audit --no-fund

echo "[vercel-install] Done."
