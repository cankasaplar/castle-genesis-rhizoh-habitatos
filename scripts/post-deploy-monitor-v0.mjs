#!/usr/bin/env node
/**
 * Post-deploy 60s stability window (compressed in CI).
 * @see docs/RHIZOH_PRODUCTION_AUTOMATION_LAYER_V0.md
 */
import { ensureWorldDeployWindowV0 } from "./lib/world-deploy-node-harness-v0.mjs";
import { bootstrapWorldV0 } from "../apps/client/src/rhizoh/runtime/rhizohWorldBootstrapV0.js";
import {
  evaluateDeploySuccessConditionV0,
  detectProductionAnomaliesV0,
  publishProductionLiveMonitorV0,
  executeProductionRollbackV0,
  POST_DEPLOY_OBSERVATION_MS_V0
} from "../apps/client/src/rhizoh/runtime/rhizohProductionDeploymentRunbookV0.js";

const compressed = process.argv.includes("--compressed");
const waitMs = compressed ? 0 : POST_DEPLOY_OBSERVATION_MS_V0;
const autoRollback = process.argv.includes("--auto-rollback");

ensureWorldDeployWindowV0();

if (!globalThis.window.__rhizoh?.worldBootStatus?.ok) {
  await bootstrapWorldV0({ skipGates: true, stressTicks: 24 });
}

if (waitMs > 0) {
  console.log(`Post-deploy observation window: ${waitMs / 1000}s...`);
  await new Promise((r) => setTimeout(r, waitMs));
}

publishProductionLiveMonitorV0();
const success = evaluateDeploySuccessConditionV0();
const anomalies = detectProductionAnomaliesV0();
const rh = globalThis.window.__rhizoh;

const report = Object.freeze({
  scr: rh.scr?.stable === true || rh.organismRhythm?.ok === true,
  icl: rh.worldIdentityConsistency?.equivalence?.same_world === true,
  pet: rh.petCitizen?.inhabited === true,
  studio: rh.studioLoop?.ok === true || success.studio_loop_ok === true,
  castle:
    rh.castleCoherenceLock?.projection_locked === true ||
    rh.castleCoherenceLock?.perception_locked === true,
  organism: rh.organismRhythm?.ok === true,
  wal_chain_ok: success.wal_chain_ok === true
});

console.table(report);

const ok =
  report.scr &&
  report.icl &&
  report.pet &&
  report.studio &&
  report.castle &&
  report.organism &&
  report.wal_chain_ok;

globalThis.window.__rhizoh.deployStatus = Object.freeze({
  success: ok,
  timestamp: Date.now(),
  report,
  anomalies: anomalies.anomalies,
  auto_rollback: anomalies.auto_rollback === true
});

if (!ok) {
  console.error("World unstable — rollback recommended");
  if (autoRollback || anomalies.auto_rollback) {
    console.error("Triggering logical rollback...");
    await executeProductionRollbackV0({ skipIcl: true });
  }
  process.exit(1);
}

console.log("World stable — deployment complete");
process.exit(0);
