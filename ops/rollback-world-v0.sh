#!/usr/bin/env bash
# Rhizoh world rollback — infra + logical state restore.
# @see docs/RHIZOH_PRODUCTION_AUTOMATION_LAYER_V0.md §8
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

echo "Rhizoh world rollback starting..."

if [ "${DRY_RUN:-0}" != "1" ]; then
  git revert HEAD --no-edit || echo "WARN: git revert skipped"
  command -v render >/dev/null && render rollback rhizoh-core || echo "WARN: render rollback skipped"
  command -v firebase >/dev/null && firebase hosting:clone || echo "WARN: firebase clone skipped"
  command -v vercel >/dev/null && vercel rollback || echo "WARN: vercel rollback skipped"
fi

node -e "
import { ensureWorldDeployWindowV0 } from './scripts/lib/world-deploy-node-harness-v0.mjs';
import { executeProductionRollbackV0, enableEmergencyModeV0 } from './apps/client/src/rhizoh/runtime/rhizohProductionDeploymentRunbookV0.js';
ensureWorldDeployWindowV0();
enableEmergencyModeV0('rollback_world');
const r = await executeProductionRollbackV0({ skipIcl: true });
if (!r.ok) process.exit(1);
console.log('Logical world rollback OK');
"

echo "Rhizoh world rollback complete."
