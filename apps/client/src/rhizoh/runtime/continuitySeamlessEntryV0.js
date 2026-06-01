/**
 * Continuity Seamless Entry v0 — no entry, only continuation.
 * Silent: anchor restore · PAL merge · surfaces ready. User feels "I was already here."
 *
 * @see docs/RHIZOH_CONTINUITY_SEAMLESS_ENTRY_V0.md
 */

import { isRhizohCreativeSurfaceEnabledV0 } from "./castleCreativeSurfaceGateV0.js";
import {
  EXPRESSIVE_REALITY_MODE_CREATIVE_V0,
  resolveExpressiveRealityModeV0
} from "./expressiveRealityModeV0.js";
import {
  buildExpressiveRealityTransitionPlanV0,
  extractPalAnchorFromLifeProjectionV0,
  markExpressiveRealityTransitionCompleteV0,
  persistExpressiveRealityTransitionContextV0,
  RTL_EVENT_CONTEXT_V0,
  RTL_EVENT_SURFACE_REVEAL_V0,
  RTL_SESSION_COMPLETE_KEY_V0,
  RTL_SESSION_CONTEXT_KEY_V0
} from "./expressiveRealityTransitionV0.js";
import {
  mergePalIntoAnchorContextV0,
  readUserAnchorV0,
  resolveDisplayAnchorV0
} from "./memoryAnchorSystemV0.js";
import { emitCeolStartV0 } from "./rhizohCeolV0.js";
import { pushT0ContinuityPulseV0 } from "./t0ContinuitySurfaceStreamV0.js";
import { resolveT0ContextStripV0 } from "./t0ContextStripV0.js";

export const CSE_CONTRACT_V0 = "continuity-seamless-entry-v0";
export const CSE_EVENT_V0 = "rhizoh:continuity-seamless-entry";

/** SSOT — uninterrupted play, not user transition. */
export const CONTINUITY_SEAMLESS_BINDING_V0 =
  "Rhizoh does not transition users. It maintains uninterrupted play.";

/** T0 — restore must not land on empty screen (@see docs/RHIZOH_T0_CONTINUITY_SURFACE_V0.md). */
export const CONTINUITY_NO_EMPTY_RESTORE_V0 =
  "Restoration never returns to an empty screen.";

/** SSOT — phase boundary disappears; no visible transition pipeline. */
export const TRANSITION_AS_CONTINUITY_PRINCIPLE_V0 =
  "Transition is not a phase. It is a disappearance of phase boundary.";

function readFullCeremonyEnv() {
  if (typeof import.meta === "undefined" || !import.meta.env) return false;
  return String(import.meta.env.VITE_RHIZOH_RTL_FULL_CEREMONY || "").trim() === "1";
}

function readVisiblePipelineEnv() {
  if (typeof import.meta === "undefined" || !import.meta.env) return false;
  return String(import.meta.env.VITE_RHIZOH_VISIBLE_ENTRY_PIPELINE || "").trim() === "1";
}

/**
 * Default E2-X session open path (silent).
 * @returns {boolean}
 */
export function shouldUseContinuitySeamlessEntryV0() {
  if (!isRhizohCreativeSurfaceEnabledV0()) return false;
  if (resolveExpressiveRealityModeV0() !== EXPRESSIVE_REALITY_MODE_CREATIVE_V0) return false;
  if (readFullCeremonyEnv() || readVisiblePipelineEnv()) return false;
  try {
    if (sessionStorage.getItem(RTL_SESSION_COMPLETE_KEY_V0) === "1") return false;
  } catch {
    /* ignore */
  }
  return true;
}

/**
 * @returns {Record<string, unknown> | null}
 */
function readPersistedRtlContextV0() {
  try {
    const raw = sessionStorage.getItem(RTL_SESSION_CONTEXT_KEY_V0);
    if (!raw) return null;
    const p = JSON.parse(raw);
    return p && typeof p === "object" ? /** @type {Record<string, unknown>} */ (p) : null;
  } catch {
    return null;
  }
}

function revealSurfacesSilentV0() {
  if (typeof window === "undefined") return;
  for (const surface of ["map", "studio", "chat"]) {
    window.dispatchEvent(
      new CustomEvent(RTL_EVENT_SURFACE_REVEAL_V0, {
        detail: Object.freeze({
          surface,
          phaseId: "continued",
          visible: true,
          seamless: true
        })
      })
    );
  }
}

/**
 * @param {{
 *   threadId?: string,
 *   traceId?: string,
 *   lifeContinuity?: unknown,
 *   lifeEntityProjection?: unknown,
 *   lifeEntityResolver?: unknown
 * }} [input]
 */
export function buildContinuitySeamlessEntrySnapshotV0(input = {}) {
  const base = buildExpressiveRealityTransitionPlanV0(input);
  const pal = extractPalAnchorFromLifeProjectionV0(
    input.lifeEntityProjection,
    input.lifeEntityResolver
  );
  const user = readUserAnchorV0();
  const persisted = readPersistedRtlContextV0();
  const display = mergePalIntoAnchorContextV0(pal, {
    kind: "continued",
    threadId: base.thread_id || undefined
  });

  const thread_id =
    base.thread_id ||
    (user?.thread_id ? String(user.thread_id) : "") ||
    (persisted?.thread_id ? String(persisted.thread_id) : "") ||
    null;

  return Object.freeze({
    contract_version: CSE_CONTRACT_V0,
    seamless: true,
    continued: true,
    experience_state: base.experience_state,
    thread_id,
    trace_id: base.trace_id,
    pal_anchor: pal,
    display_anchor: display || resolveDisplayAnchorV0()
  });
}

/**
 * Run entry as continuation — zero visible phases.
 * @param {Parameters<typeof buildContinuitySeamlessEntrySnapshotV0>[0]} [input]
 * @param {{ onComplete?: (snap: ReturnType<typeof buildContinuitySeamlessEntrySnapshotV0>) => void }} [callbacks]
 */
export function runContinuitySeamlessEntryV0(input = {}, callbacks = {}) {
  const snap = buildContinuitySeamlessEntrySnapshotV0(input);
  emitCeolStartV0();
  revealSurfacesSilentV0();
  markExpressiveRealityTransitionCompleteV0();
  persistExpressiveRealityTransitionContextV0(
    /** @type {ReturnType<typeof buildExpressiveRealityTransitionPlanV0>} */ (
      /** @type {unknown} */ (snap)
    )
  );

  if (typeof window !== "undefined") {
    window.dispatchEvent(
      new CustomEvent(RTL_EVENT_CONTEXT_V0, {
        detail: Object.freeze({ plan: snap, complete: true, seamless: true, continued: true })
      })
    );
    window.dispatchEvent(
      new CustomEvent(CSE_EVENT_V0, {
        detail: Object.freeze({ snapshot: snap, continued: true })
      })
    );
  }

  const primary = String(snap.display_anchor?.primary_label || snap.display_anchor?.label || "");
  const ctx = resolveT0ContextStripV0({ activeSurface: "world" });
  pushT0ContinuityPulseV0(
    primary ? `Continued · ${primary}` : ctx.strip,
    "continued"
  );

  callbacks.onComplete?.(snap);
  return { snapshot: snap, cancel: () => {} };
}

/**
 * @param {Parameters<typeof runContinuitySeamlessEntryV0>[0]} [input]
 * @param {Parameters<typeof runContinuitySeamlessEntryV0>[1]} [callbacks]
 */
export function maybeRunContinuitySeamlessEntryV0(input, callbacks) {
  if (!shouldUseContinuitySeamlessEntryV0()) {
    return { started: false, cancel: () => {} };
  }
  const result = runContinuitySeamlessEntryV0(input, callbacks);
  return { started: true, ...result };
}
