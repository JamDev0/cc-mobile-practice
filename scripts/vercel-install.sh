#!/usr/bin/env bash
# Vercel install: init git submodule, build vendor/cc-feedback, then install root deps.
# For private submodules, set GIT_SUBMODULE_TOKEN in Vercel (e.g. GitHub PAT) and
# uncomment the url.insteadOf block below.

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

CC_FEEDBACK_URL="https://github.com/JamDev0/cc-feedback.git"
# Optional: use token for submodule clone (for private cc-feedback)
# if [ -n "${GIT_SUBMODULE_TOKEN:-}" ]; then
#   CC_FEEDBACK_URL="https://${GIT_SUBMODULE_TOKEN}@github.com/JamDev0/cc-feedback.git"
# fi

echo "[vercel-install] Initializing git submodule vendor/cc-feedback..."
git submodule update --init --recursive

if [ ! -f "vendor/cc-feedback/package.json" ]; then
  echo "[vercel-install] Submodule update left vendor/cc-feedback empty (common on Vercel). Cloning manually..."
  RAW_REF="$(git rev-parse HEAD:vendor/cc-feedback 2>/dev/null)" || true
  # Only use if it's a 40-char SHA (avoid passing rev specs like HEAD:vendor/cc-feedback into checkout)
  if [ -n "${RAW_REF:-}" ] && [ "${#RAW_REF}" -eq 40 ] && [[ "$RAW_REF" =~ ^[0-9a-f]{40}$ ]]; then
    SUBMODULE_COMMIT="$RAW_REF"
  else
    SUBMODULE_COMMIT=""
  fi
  rm -rf vendor/cc-feedback
  git clone --depth 1 "$CC_FEEDBACK_URL" vendor/cc-feedback
  if [ -n "${SUBMODULE_COMMIT:-}" ]; then
    (cd vendor/cc-feedback && git fetch --depth 1 origin "$SUBMODULE_COMMIT" && git checkout "$SUBMODULE_COMMIT")
  fi
  if [ ! -f "vendor/cc-feedback/package.json" ]; then
    echo "[vercel-install] ERROR: vendor/cc-feedback/package.json still missing." >&2
    echo "If cc-feedback is private, set GIT_SUBMODULE_TOKEN in Vercel and uncomment the token block in this script." >&2
    exit 1
  fi
fi

echo "[vercel-install] Installing and building vendor/cc-feedback..."
(cd vendor/cc-feedback && npm install --no-audit --no-fund && npm run build)

echo "[vercel-install] Installing root dependencies..."
npm install --no-audit --no-fund

echo "[vercel-install] Done."
