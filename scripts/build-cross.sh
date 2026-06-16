#!/usr/bin/env bash
#
# Build the Windows (.exe) and Linux (.deb + AppImage) artifacts using the
# official electron-builder Docker image (ships Wine + Linux packaging tools).
#
# Run from the project root, with Docker Desktop running:
#   ./scripts/build-cross.sh
#
# Artifacts land in ./dist/.  macOS .dmg must be built natively (npm run dist:mac).

set -euo pipefail

cd "$(dirname "$0")/.."

# --platform linux/amd64 keeps Wine happy on Apple Silicon (emulated) and is
# a no-op on Intel Macs. The cache volumes avoid re-downloading Electron each run.
docker run --rm -ti \
  --platform linux/amd64 \
  -v "${PWD}":/project \
  -v "${HOME}/.cache/electron":/root/.cache/electron \
  -v "${HOME}/.cache/electron-builder":/root/.cache/electron-builder \
  electronuserland/builder:wine \
  /bin/bash -c "npm ci && npm run dist:win && npm run dist:linux"

echo
echo "Done. Windows + Linux artifacts are in ./dist/"
