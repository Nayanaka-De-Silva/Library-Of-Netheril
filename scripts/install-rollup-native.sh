#!/bin/sh

set -eu

ROLLUP_VERSION=$(node -p "require('./node_modules/rollup/package.json').version")

case "$(uname -m)" in
  aarch64|arm64)
    ROLLUP_PACKAGE='@rollup/rollup-linux-arm64-gnu'
    ;;
  x86_64|amd64)
    ROLLUP_PACKAGE='@rollup/rollup-linux-x64-gnu'
    ;;
  *)
    echo "No explicit Rollup native package mapping for architecture $(uname -m); relying on npm optional dependencies."
    exit 0
    ;;
esac

npm install --no-save "${ROLLUP_PACKAGE}@${ROLLUP_VERSION}"
