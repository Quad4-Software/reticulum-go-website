#!/bin/bash
set -euo pipefail

if [ ! -f build/index.js ]; then
    echo "Build failed: index.js not found in build directory"
    echo "Build directory contents:"
    ls -la build/ || true
    exit 1
fi

