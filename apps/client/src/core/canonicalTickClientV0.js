/**
 * Canonical tick client — gateway authority + online catch-up (World Space boot).
 * Same tick → same layer/seed on mobile and desktop.
 */

import { resolveGenesisGatewayHttpBaseV0 } from "../castleFlight/castleFlightConfig.js";
import { deriveCanonicalAuthorityFromTickV0 } from "./simulationDeviceParityV0.js";
import { reconcileWithCanonicalAuthorityV0 } from "./reconciliationEngineV0.js";
import {
  buildCatchUpCascadePlanV0,
  runCatchUpCascadePlanV0,
  RHIZOH_CATCH_UP_CASCADE_EVENT_V0,
  RHIZOH_CATCH_UP_CASCADE_PHASE_EVENT_V0
} from "./cascadeReplayRendererV0.js";
import {
  buildCatchUpPhasesV1,
  reconcileCatchUpV1,
  RHIZOH_CASCADE_PHASE_V1
} from "./cascadeReconciliationKernelV1.js";
import { listSimulationEventsV0 } from "../storage/EventStoreV0.js";
import { publishOfflineVoidStateV0 } from "./offlineVoidGateV0.js";
import { readCodexStateV0 } from "./ReplayEngineV0.js";
import { canPersistUserTopologyN12V0 } from "../pwa/rhizohPwaPermissionsN12V0.js";
import { logCastleLifecycleV0 } from "../rhizoh/runtime/rhizohProductionLogNamespacesV0.js";
import { enterReplayModeV0, exitReplayModeV0 } from "../rhizoh/runtime/temporalBridgeV0.js";
import {
  isChessArenaWorkspaceOpenV0,
  isChessClusterArenaOpenV0
} from "../rhizoh/runtime/chessEngineContentionGateV0.js";

export const RHIZOH_CANONICAL_TICK_SCHEMA_V0 = "castle.rhizoh.canonical_tick_client.v0";
export const RHIZOH_CANONICAL_TICK_EVENT_V0 = "rhizoh:canonical-tick-v0";

let startedV0 = false;
let pollTimerV0 = 0;
let catchUpRunningV0 = false;
/** @type {number | null} */
let lastTickV0 = null;

function shouldDeferCanonicalCatchUpV0() {
  if (typeof window === "undefined") return false;
  return isChessArenaWorkspaceOpenV0() || isChessClusterArenaOpenV0();
}

/**
 * @returns {Promise<object | null>}
 */
export async function fetchCanonicalAuthorityV0() {
  const origin = String(resolveGenesisGatewayHttpBaseV0() || "").trim().replace(/\/+$/, "");
  if (!origin) return null;

  try {
    const res = await fetch(`${origin}/rhizoh/genesis/runtime`, { method: "GET", cache: "no-store" });
    const j = await res.json().catch(() => null);
    if (!res.ok || !j?.ok) return null;
    const tick = Number(j.canonicalTick?.value);
    if (!Number.isFinite(tick)) return null;
    return deriveCanonicalAuthorityFromTickV0(tick);
  } catch {
    return null;
  }
}

/**
 * Local shadow authority when gateway unreachable (deterministic, not wall-clock).
 */
export function readLocalShadowAuthorityV0() {
  const codex = readCodexStateV0();
  const layer = Math.max(0, Number(codex.cycleLayer) || 0);
  const seed = Number(codex.seed) || 12345;
  return Object.freeze({
    schema: RHIZOH_CANONICAL_TICK_SCHEMA_V0,
    canonicalLayer: layer,
    seed,
    tick: layer,
    timestamp: Date.now(),
    source: "local_shadow"
  });
}

function publishCanonicalTickV0(authority) {
  if (typeof window !== "undefined") {
    window.__rhizoh = window.__rhizoh || {};
    window.__rhizoh.canonicalAuthority = Object.freeze(authority);
    window.dispatchEvent(new CustomEvent(RHIZOH_CANONICAL_TICK_EVENT_V0, { detail: authority }));
  }
}

/**
 * Online catch-up: reconcile pending + cascade layers + clear void.
 */
export async function runCanonicalCatchUpV0(authority) {
  if (!canPersistUserTopologyN12V0() || catchUpRunningV0) {
    return Object.freeze({ ok: false, reason: catchUpRunningV0 ? "catch_up_in_progress" : "n12_denied" });
  }
  if (shouldDeferCanonicalCatchUpV0()) {
    return Object.freeze({ ok: false, reason: "chess_surface_active" });
  }
  catchUpRunningV0 = true;
  enterReplayModeV0("canonical_catch_up");
  try {
    publishCanonicalTickV0(authority);
    const eventsOut = await listSimulationEventsV0(0);
    const events = (eventsOut.events || []).filter((e) => e.syncStatus !== "PENDING_SYNC");
    const localLayer = readCodexStateV0().cycleLayer || 0;
    const reconcileOut = reconcileCatchUpV1(
      events,
      localLayer,
      authority.canonicalLayer,
      authority.seed,
      0
    );
    const phases = buildCatchUpPhasesV1(reconcileOut);

    for (const phase of phases) {
      publishCascadePhaseV1(phase);
      if (phase.phase === RHIZOH_CASCADE_PHASE_V1.LAYER_REPLAY && reconcileOut.missingTicks > 0) {
        const plan = buildCatchUpCascadePlanV0({
          fromLayer: reconcileOut.fromTick,
          toLayer: reconcileOut.toTick,
          canonicalSeed: authority.seed,
          stepMs: 280
        });
        await runCatchUpCascadePlanV0(plan);
      } else {
        await sleepMsV0(phase.phase === RHIZOH_CASCADE_PHASE_V1.VOID_FILL ? 400 : 320);
      }
    }

    const recon = await reconcileWithCanonicalAuthorityV0(authority);
    publishOfflineVoidStateV0(false);
    logCastleLifecycleV0("canonical_catch_up", {
      layer: authority.canonicalLayer,
      seed: authority.seed,
      cascadeSteps: reconcileOut.missingTicks,
      divergence: recon.snapshot?.divergenceScore
    });
    return Object.freeze({ ok: true, authority, reconcileOut, recon });
  } finally {
    exitReplayModeV0("canonical_catch_up");
    catchUpRunningV0 = false;
  }
}

async function pollCanonicalTickV0() {
  if (!canPersistUserTopologyN12V0()) return;
  if (typeof navigator !== "undefined" && navigator.onLine === false) return;
  if (shouldDeferCanonicalCatchUpV0()) return;

  const authority = (await fetchCanonicalAuthorityV0()) || readLocalShadowAuthorityV0();
  const tick = Number(authority.tick);
  if (Number.isFinite(tick) && tick === lastTickV0) return;
  lastTickV0 = tick;

  publishCanonicalTickV0(authority);

  const localLayer = readCodexStateV0().cycleLayer || 0;
  const voidActive = window.__rhizoh?.offlineVoid?.active === true;
  if (voidActive || authority.canonicalLayer > localLayer) {
    await runCanonicalCatchUpV0(authority);
  }
}

/**
 * Boot wire for World Space — polls gateway tick, triggers catch-up on reconnect.
 */
export function startCanonicalTickClientV0() {
  if (startedV0 || typeof window === "undefined") return;
  startedV0 = true;

  const onOnline = () => {
    void pollCanonicalTickV0();
  };
  window.addEventListener("online", onOnline);
  void pollCanonicalTickV0();

  pollTimerV0 = window.setInterval(() => {
    void pollCanonicalTickV0();
  }, 5000);

  if (typeof window !== "undefined") {
    window.__rhizoh = window.__rhizoh || {};
    window.__rhizoh.canonicalTickClient = Object.freeze({
      schema: RHIZOH_CANONICAL_TICK_SCHEMA_V0,
      started: true
    });
  }
}

export function stopCanonicalTickClientV0() {
  if (pollTimerV0) window.clearInterval(pollTimerV0);
  pollTimerV0 = 0;
  startedV0 = false;
}

/** @internal vitest */
export function __resetCanonicalTickClientForTestV0() {
  stopCanonicalTickClientV0();
  lastTickV0 = null;
  catchUpRunningV0 = false;
}

function publishCascadePhaseV1(phase) {
  if (typeof window !== "undefined") {
    window.dispatchEvent(
      new CustomEvent("rhizoh:cascade-phase-v1", { detail: Object.freeze(phase) })
    );
  }
}

function sleepMsV0(ms) {
  return new Promise((resolve) => {
    if (typeof window !== "undefined") window.setTimeout(resolve, ms);
    else resolve(undefined);
  });
}

// re-export for overlay
export { RHIZOH_CATCH_UP_CASCADE_EVENT_V0, RHIZOH_CATCH_UP_CASCADE_PHASE_EVENT_V0 };
