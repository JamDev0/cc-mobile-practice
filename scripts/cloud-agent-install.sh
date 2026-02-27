#!/usr/bin/env bash

set -euo pipefail

if ! command -v node >/dev/null 2>&1; then
  echo "Node.js is not installed. This workspace expects Node 22.x." >&2
  exit 1
fi

node_major="$(node -p "process.versions.node.split('.')[0]")"
if [ "$node_major" != "22" ]; then
  echo "Expected Node 22.x (see .nvmrc), found $(node -v)." >&2
  exit 1
fi

echo "Using Node $(node -v) and npm $(npm -v)"
echo "Installing npm dependencies..."
npm install

echo "Installing Playwright browser + Linux deps (Chromium only)..."
npx playwright install --with-deps chromium

echo "Cloud agent dependency bootstrap complete."
