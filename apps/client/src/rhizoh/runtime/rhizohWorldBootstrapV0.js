/**
 * World Bootstrap v0 — production world runtime orchestrator (not deploy script).
 * Single entry: SCR → WAL → ICL → Pet → Studio → Castle → Co-presence.
 * @see docs/RHIZOH_PRODUCTION_AUTOMATION_LAYER_V0.md
 */

import { buildT0UnifiedPresenceFrameV0 } from "./rhizohT0UnifiedPresenceFrameV0.js";
import { compileExperienceContinuityV0 } from "./rhizohExperienceContinuityCompilerV0.js";
import { runStudioExecutionLoopV0 } from "./rhizohStudioExecutionLoopV0.js";
import { publishCastleProjectionV0 } from "./rhizohCastleProjectionLayerV0.js";
import { publishStudioProductionOrganismV0 } from "./rhizohStudioProductionOrganismV0.js";
import {
  refreshIdentityConsistencyForDeployGateV0,
  startWorldWalPersistenceV0,
  startOrganismHeartbeatV0,
  enableCastleCoPresenceSurfaceV0,
  captureWorldIdentitySnapshotV0,
  evaluatePreDeployGatesV0
} from "./rhizohProductionDeploymentRunbookV0.js";

export const WORLD_BOOTSTRAP_SCHEMA_V0 = "castle.rhizoh.world_bootstrap.v0";

export const RHIZOH_WORLD_BOOTSTRAP_EVENT_V0 = "rhizoh:world-bootstrap-v0";

function readRhizohV0() {
  return typeof window !== "undefined" ? window.__rhizoh || {} : {};
}

/**
 * @param {number} [nowMs]
 */
export function initScrv0(nowMs = Date.now()) {
  const cognitive =
    readRhizohV0().cognitiveAttention ?? {
      attention_inertia: {
        mcib: { causes: [{ id: "world_boot" }], superposition01: 0.16 },
        ccf: { experiential_now_id: "en_world_boot", collapse_mode: "singular" }
      }
    };
  const frame = buildT0UnifiedPresenceFrameV0(
    { rhizoh_is_present: true, silence_form: "listening", rhizoh_attention: "focused" },
    { orbModulation: { breathe: true, intensity01: 0.6 }, transitionFeel: {} },
    null,
    nowMs
  );
  if (typeof window !== "undefined") {
    window.__rhizoh = window.__rhizoh || {};
    window.__rhizoh.presenceFrame = frame;
    window.__rhizoh.presenceState = { rhizoh_is_present: true, rhizoh_attention: "focused" };
    window.__rhizoh.cognitiveAttention = cognitive;
    window.__rhizoh.scr = Object.freeze({
      stable: true,
      tick_seq: frame.tickSeq,
      coherence_id: frame.coherenceId,
      atMs: nowMs
    });
  }
  const ecc = compileExperienceContinuityV0({
    presence: { rhizoh_is_present: true, silence_form: "listening" },
    resl: { orbModulation: { breathe: true, intensity01: frame.breathe01 } },
    cognitive,
    nowMs
  });
  if (typeof window !== "undefined") {
    window.__rhizoh.experienceContinuity = ecc;
  }
  return Object.freeze({ frame, ecc, cognitive });
}

export async function initWalV0() {
  const status = await startWorldWalPersistenceV0({ mode: "append-only" });
  return status;
}

export async function initIclV0() {
  return refreshIdentityConsistencyForDeployGateV0();
}

/**
 * @param {ReturnType<typeof initScrv0>} scr
 */
export function initPetV0(scr) {
  const run = runStudioExecutionLoopV0({
    ecc: scr.ecc,
    frame: scr.frame,
    cognitive: scr.cognitive,
    resl: { orbModulation: {} }
  });
  return run;
}

/**
 * @param {object | null} run
 */
export function initStudioOrganismV0(run) {
  return publishStudioProductionOrganismV0({ run });
}

export function initCastleProjectionV0() {
  return publishCastleProjectionV0();
}

/**
 * @param {ReturnType<typeof initScrv0>} scr
 */
export function initCoPresenceV0(scr) {
  return enableCastleCoPresenceSurfaceV0({
    frame: scr.frame,
    cognitive: scr.cognitive
  });
}

/**
 * Bootstraps full world runtime stack for production.
 * @param {{
 *   skipGates?: boolean,
 *   stressTicks?: number,
 *   nowMs?: number
 * }} [opts]
 */
export async function bootstrapWorldV0(opts = {}) {
  const nowMs = Number(opts.nowMs) || Date.now();
  console.log("Bootstrapping Rhizoh World...");

  if (!opts.skipGates) {
    const { primeProductionDeployReadinessV0 } = await import(
      "./rhizohProductionDeploymentRunbookV0.js"
    );
    const gates = await primeProductionDeployReadinessV0({
      stressTicks: opts.stressTicks ?? 48,
      startMs: nowMs - 60_000
    });
    if (!gates.ok) {
      const status = Object.freeze({
        schema: WORLD_BOOTSTRAP_SCHEMA_V0,
        ok: false,
        code: "pre_deploy_gate_failed",
        t0: nowMs,
        mode: "production_world",
        gates
      });
      if (typeof window !== "undefined") {
        window.__rhizoh.worldBootStatus = status;
      }
      return status;
    }
  }

  const scr = initScrv0(nowMs);
  startOrganismHeartbeatV0({ mode: "production", interval: false });
  await initWalV0();
  await initIclV0();
  const run = initPetV0(scr);
  initStudioOrganismV0(run);
  initCastleProjectionV0();
  initCoPresenceV0(scr);

  captureWorldIdentitySnapshotV0();
  await refreshIdentityConsistencyForDeployGateV0();
  const gates = evaluatePreDeployGatesV0();

  const petInhabited = readRhizohV0().petCitizen?.inhabited === true;
  const runtimeOk = Boolean(run?.wal_entry_id) && petInhabited && run?.ok !== false;

  const status = Object.freeze({
    schema: WORLD_BOOTSTRAP_SCHEMA_V0,
    ok: opts.skipGates ? runtimeOk : gates.ok === true && runtimeOk,
    t0: nowMs,
    atMs: Date.now(),
    mode: "production_world",
    wal_entry_id: run?.wal_entry_id || null,
    gates_ok: gates.ok,
    runtime_ok: runtimeOk
  });

  if (typeof window !== "undefined") {
    window.__rhizoh = window.__rhizoh || {};
    window.__rhizoh.worldBootStatus = status;
    window.__rhizoh.studioLoop = Object.freeze({
      ok: Boolean(run?.wal_entry_id),
      wal_entry_id: run?.wal_entry_id || null
    });
    try {
      window.dispatchEvent(
        new CustomEvent(RHIZOH_WORLD_BOOTSTRAP_EVENT_V0, {
          detail: Object.freeze({ status })
        })
      );
    } catch {
      /* noop */
    }
  }

  console.log(status.ok ? "World is alive" : "World bootstrap incomplete");
  return status;
}

export function readWorldBootStatusV0() {
  return readRhizohV0().worldBootStatus || null;
}
