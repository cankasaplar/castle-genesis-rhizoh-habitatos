/**
 * Hot Reload Runtime v0.1 — continuous world transition (no restart feeling).
 * World does not restart — it transitions.
 * @see docs/RHIZOH_WORLD_EXPANSION_LAYER_V0.1.md
 */

import { readLastT0PresenceFrameV0 } from "./rhizohT0UnifiedPresenceFrameV0.js";
import { captureWorldIdentitySnapshotV0 } from "./rhizohProductionDeploymentRunbookV0.js";
import { readPetCitizenV0 } from "./rhizohPetCitizenRuntimeV0.js";
import { deriveOrganismHeartbeatV0 } from "./rhizohOrganismHeartbeatV0.js";

export const HOT_RELOAD_RUNTIME_SCHEMA_V0 = "castle.rhizoh.hot_reload_runtime.v0";

export const HOT_RELOAD_MODE_V0 = "continuous";

export const HOT_RELOAD_PRESERVE_V0 = Object.freeze([
  "scr",
  "wal",
  "icl",
  "pet",
  "studioOrganism"
]);

/** @type {ReturnType<typeof buildHotReloadRuntimeSnapshotV0> | null} */
let lastHotReload = null;

function readRhizohV0() {
  return typeof window !== "undefined" ? window.__rhizoh || {} : {};
}

export function buildHotReloadRuntimeSnapshotV0() {
  const rh = readRhizohV0();
  return Object.freeze({
    schema: HOT_RELOAD_RUNTIME_SCHEMA_V0,
    mode: HOT_RELOAD_MODE_V0,
    preserve: HOT_RELOAD_PRESERVE_V0,
    atMs: Date.now(),
    active: rh.hotReloadRuntime?.active === true,
    phase: rh.hotReloadRuntime?.phase || "idle"
  });
}

/**
 * @param {{
 *   patch?: Record<string, unknown>,
 *   moduleLabels?: string[]
 * }} [opts]
 */
export async function executeWorldHotReloadV0(opts = {}) {
  const rh = readRhizohV0();
  const frame = rh.presenceFrame || readLastT0PresenceFrameV0();
  const pet = readPetCitizenV0();
  const t0Snapshot = Object.freeze({
    coherenceId: frame?.coherenceId || null,
    masterNowMs: frame?.masterNowMs || Date.now(),
    tickSeq: frame?.tickSeq ?? null,
    heartbeat: deriveOrganismHeartbeatV0(frame)
  });

  const steps = [];

  publishHotReloadPhaseV0("update_detected");
  steps.push(Object.freeze({ step: "update_detected", atMs: Date.now() }));

  publishHotReloadPhaseV0("snapshot_t0");
  steps.push(Object.freeze({ step: "snapshot_t0", snapshot: t0Snapshot }));

  const identitySnap = captureWorldIdentitySnapshotV0();
  steps.push(Object.freeze({ step: "identity_snapshot", snapshot: identitySnap }));

  publishHotReloadPhaseV0("pet_motion_frozen");
  if (typeof window !== "undefined" && pet?.inhabited) {
    window.__rhizoh.petCitizen = Object.freeze({
      ...pet,
      motion_frame_lock: pet.motion_frame_lock || {
        frozen_for_hot_reload: true,
        atMs: Date.now()
      }
    });
  }
  steps.push(Object.freeze({ step: "pet_motion_frozen", inhabited: pet?.inhabited === true }));

  publishHotReloadPhaseV0("patch_modules");
  const patch = Object.freeze({ ...(opts.patch || {}), atMs: Date.now() });
  if (typeof window !== "undefined") {
    window.__rhizoh.hotReloadPatch = patch;
  }
  steps.push(Object.freeze({ step: "patch_modules", labels: opts.moduleLabels || [], patch }));

  publishHotReloadPhaseV0("restore_scr_tick");
  if (typeof window !== "undefined" && frame) {
    window.__rhizoh.presenceFrame = Object.freeze({
      ...frame,
      coherenceId: t0Snapshot.coherenceId || frame.coherenceId,
      masterNowMs: t0Snapshot.masterNowMs,
      hot_reload_preserved: true
    });
    window.__rhizoh.scr = Object.freeze({
      ...(rh.scr || {}),
      stable: true,
      hot_reload: true,
      tick_seq: t0Snapshot.tickSeq
    });
  }
  steps.push(Object.freeze({ step: "restore_scr_tick", tick_seq: t0Snapshot.tickSeq }));

  publishHotReloadPhaseV0("resume_pet_studio");
  if (typeof window !== "undefined" && window.__rhizoh.petCitizen?.inhabited) {
    const locked = window.__rhizoh.petCitizen.motion_frame_lock;
    window.__rhizoh.petCitizen = Object.freeze({
      ...window.__rhizoh.petCitizen,
      motion_frame_lock: Object.freeze({
        ...locked,
        frozen_for_hot_reload: false,
        resumed_at_ms: Date.now()
      })
    });
  }
  steps.push(Object.freeze({ step: "resume_pet_studio" }));

  publishHotReloadPhaseV0("complete");

  const report = Object.freeze({
    schema: HOT_RELOAD_RUNTIME_SCHEMA_V0,
    ok: true,
    mode: HOT_RELOAD_MODE_V0,
    preserve: HOT_RELOAD_PRESERVE_V0,
    phase_shift: true,
    world_restart: false,
    t0_preserved: Boolean(t0Snapshot.coherenceId),
    steps: Object.freeze(steps),
    atMs: Date.now()
  });

  lastHotReload = report;
  if (typeof window !== "undefined") {
    window.__rhizoh.hotReloadRuntime = Object.freeze({
      ...buildHotReloadRuntimeSnapshotV0(),
      active: false,
      phase: "complete",
      last_report: report
    });
  }

  return report;
}

function publishHotReloadPhaseV0(phase) {
  if (typeof window === "undefined") return;
  window.__rhizoh = window.__rhizoh || {};
  window.__rhizoh.hotReloadRuntime = Object.freeze({
    ...buildHotReloadRuntimeSnapshotV0(),
    active: phase !== "complete" && phase !== "idle",
    phase
  });
}

export function readHotReloadRuntimeV0() {
  return (
    lastHotReload ||
    (typeof window !== "undefined" ? window.__rhizoh?.hotReloadRuntime : null) ||
    null
  );
}

export function resetRhizohHotReloadRuntimeForTestV0() {
  lastHotReload = null;
  if (typeof window !== "undefined" && window.__rhizoh) {
    delete window.__rhizoh.hotReloadRuntime;
    delete window.__rhizoh.hotReloadPatch;
  }
}
