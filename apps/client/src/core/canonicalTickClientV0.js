/**
 * Canonical tick client — gateway authority + online catch-up (World Space boot).
 * Same tick → same layer/seed on mobile and desktop.
 */

import { resolveGenesisGatewayHttpBaseV0 } from "../castleFlight/castleFlightConfig.js";
import { deriveCanonicalAuthorityFromTickV0 } from "./simulationDeviceParityV0.js";
import { reconcileWithCanonicalAuthorityV0 } from "./reconciliationEngineV0.js";
import { maybeRunCatchUpCascadeV0 } from "./cascadeReplayRendererV0.js";
import { publishOfflineVoidStateV0 } from "./offlineVoidGateV0.js";
import { readCodexStateV0 } from "./ReplayEngineV0.js";
import { canPersistUserTopologyN12V0 } from "../pwa/rhizohPwaPermissionsN12V0.js";
import { logCastleLifecycleV0 } from "../rhizoh/runtime/rhizohProductionLogNamespacesV0.js";

export const RHIZOH_CANONICAL_TICK_SCHEMA_V0 = "castle.rhizoh.canonical_tick_client.v0";
export const RHIZOH_CANONICAL_TICK_EVENT_V0 = "rhizoh:canonical-tick-v0";

let startedV0 = false;
let pollTimerV0 = 0;
let catchUpRunningV0 = false;
/** @type {number | null} */
let lastTickV0 = null;

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
  catchUpRunningV0 = true;
  try {
    publishCanonicalTickV0(authority);
    const cascade = await maybeRunCatchUpCascadeV0(authority);
    const recon = await reconcileWithCanonicalAuthorityV0(authority);
    publishOfflineVoidStateV0(false);
    logCastleLifecycleV0("canonical_catch_up", {
      layer: authority.canonicalLayer,
      seed: authority.seed,
      cascadeSteps: cascade.steps ?? 0,
      divergence: recon.snapshot?.divergenceScore
    });
    return Object.freeze({ ok: true, authority, cascade, recon });
  } finally {
    catchUpRunningV0 = false;
  }
}

async function pollCanonicalTickV0() {
  if (!canPersistUserTopologyN12V0()) return;
  if (typeof navigator !== "undefined" && navigator.onLine === false) return;

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
