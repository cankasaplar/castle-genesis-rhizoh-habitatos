#!/usr/bin/env bash
# Rhizoh Production Automation Layer v0 — single command world deployment.
# Cross-platform entry: delegates to Node orchestrator.
# @see docs/RHIZOH_PRODUCTION_AUTOMATION_LAYER_V0.md
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

echo "Rhizoh Production Automation Layer starting..."

export DRY_RUN="${DRY_RUN:-0}"
unset FULL_TESTS
node scripts/deploy-world-v0.mjs "$@"

echo "Rhizoh world deployment complete."
