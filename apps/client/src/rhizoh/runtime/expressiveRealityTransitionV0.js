/**
 * Reality Transition Layer (RTL) v0 — E2-C → E2-X as experiential event, not env flip.
 * Paper export = externalize mind; PAL anchor = internalize place.
 *
 * @see docs/RHIZOH_E2X_PRODUCT_REALITY_AND_MODE_TRANSITION_V0.md
 */

import { isRhizohCreativeSurfaceEnabledV0 } from "./castleCreativeSurfaceGateV0.js";
import {
  EXPRESSIVE_REALITY_MODE_CREATIVE_V0,
  EXPRESSIVE_REALITY_MODE_OBSERVER_V0,
  resolveExpressiveRealityModeV0
} from "./expressiveRealityModeV0.js";
import { resetMemoryAnchorSessionV0 } from "./memoryAnchorSystemV0.js";

export const RTL_CONTRACT_V0 = "expressive-reality-transition-v0";
export const RTL_SESSION_COMPLETE_KEY_V0 = "rhizoh.rtl.completed.v0";
export const RTL_SESSION_CONTEXT_KEY_V0 = "rhizoh.rtl.context.v0";
export const RTL_EVENT_CONTEXT_V0 = "rhizoh:expressive-reality-context";
export const RTL_EVENT_SURFACE_REVEAL_V0 = "rhizoh:rtl-surface-reveal";

export const RTL_PHASE_ENTRY_V0 = "entry_moment";
export const RTL_PHASE_PAL_ANCHOR_V0 = "pal_anchor";
export const RTL_PHASE_MAP_REVEAL_V0 = "map_reveal";
export const RTL_PHASE_STUDIO_REVEAL_V0 = "studio_reveal";
export const RTL_PHASE_CHAT_RESUME_V0 = "chat_resume";
export const RTL_PHASE_COMPLETE_V0 = "complete";

/** @type {readonly string[]} */
export const RTL_PHASE_SEQUENCE_V0 = Object.freeze([
  RTL_PHASE_ENTRY_V0,
  RTL_PHASE_PAL_ANCHOR_V0,
  RTL_PHASE_MAP_REVEAL_V0,
  RTL_PHASE_STUDIO_REVEAL_V0,
  RTL_PHASE_CHAT_RESUME_V0,
  RTL_PHASE_COMPLETE_V0
]);

const DEFAULT_DURATIONS_MS = Object.freeze({
  [RTL_PHASE_ENTRY_V0]: 1000,
  [RTL_PHASE_PAL_ANCHOR_V0]: 1200,
  [RTL_PHASE_MAP_REVEAL_V0]: 800,
  [RTL_PHASE_STUDIO_REVEAL_V0]: 600,
  [RTL_PHASE_CHAT_RESUME_V0]: 500,
  [RTL_PHASE_COMPLETE_V0]: 0
});

/**
 * @param {unknown} projection
 * @param {unknown} [resolver]
 */
export function extractPalAnchorFromLifeProjectionV0(projection, resolver) {
  const bundle =
    projection && typeof projection === "object" ? /** @type {Record<string, unknown>} */ (projection) : {};
  const projections = Array.isArray(bundle.projections) ? bundle.projections : [];

  /** @type {Record<string, unknown> | null} */
  let mapPin = null;
  for (const item of projections) {
    if (!item || typeof item !== "object") continue;
    const row = /** @type {Record<string, unknown>} */ (item);
    if (String(row.projection_kind) === "map_pin") {
      mapPin = row;
      break;
    }
  }

  const activation =
    mapPin?.activation && typeof mapPin.activation === "object"
      ? /** @type {Record<string, unknown>} */ (mapPin.activation)
      : null;
  const location =
    mapPin?.location && typeof mapPin.location === "object"
      ? /** @type {Record<string, unknown>} */ (mapPin.location)
      : null;

  const place_name = String(location?.place_name || "").trim();
  const castle_label = String(mapPin?.label || "").trim();
  const label =
    place_name && castle_label
      ? `${castle_label} · ${place_name}`
      : place_name || castle_label || "Last known conversational location";

  const visible = activation?.visible === true;
  const stage = String(activation?.stage || (visible ? "revealed" : "awaiting"));

  const resolverCastle =
    resolver && typeof resolver === "object"
      ? String(/** @type {Record<string, unknown>} */ (resolver).castle_id || "").trim()
      : "";

  return Object.freeze({
    label,
    place_name: place_name || undefined,
    castle_label: castle_label || undefined,
    castle_id: String(mapPin?.entity_id || resolverCastle || ""),
    visible,
    stage,
    memory_anchor: visible
      ? `Bağlandığın yer: ${label}`
      : "Konum henüz kazanılmadı — konuşmaya devam et."
  });
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
export function buildExpressiveRealityTransitionPlanV0(input = {}) {
  const fromMode = EXPRESSIVE_REALITY_MODE_OBSERVER_V0;
  const toMode = resolveExpressiveRealityModeV0();
  const anchor = extractPalAnchorFromLifeProjectionV0(
    input.lifeEntityProjection,
    input.lifeEntityResolver
  );

  const thread_id =
    String(input.threadId || "").trim() ||
    (input.lifeContinuity &&
    typeof input.lifeContinuity === "object" &&
    /** @type {Record<string, unknown>} */ (input.lifeContinuity).thread_id
      ? String(/** @type {Record<string, unknown>} */ (input.lifeContinuity).thread_id)
      : "");

  const trace_id = String(input.traceId || "").trim();

  /** @type {{ id: string, durationMs: number, headline: string, lines: string[], surface?: string, palAnchor?: ReturnType<typeof extractPalAnchorFromLifeProjectionV0> }} */
  const phases = [
    {
      id: RTL_PHASE_ENTRY_V0,
      durationMs: DEFAULT_DURATIONS_MS[RTL_PHASE_ENTRY_V0],
      headline: "Dünya katmanı etkin",
      lines: [
        "World layer activated",
        anchor.visible ? `Location: PAL anchored` : "Location: awaiting PAL anchor",
        thread_id ? "Continuity: restored" : "Continuity: ready",
        "Surface: unlocking"
      ]
    },
    {
      id: RTL_PHASE_PAL_ANCHOR_V0,
      durationMs: DEFAULT_DURATIONS_MS[RTL_PHASE_PAL_ANCHOR_V0],
      headline: "Memory anchor",
      lines: [anchor.memory_anchor],
      palAnchor: anchor
    },
    {
      id: RTL_PHASE_MAP_REVEAL_V0,
      durationMs: DEFAULT_DURATIONS_MS[RTL_PHASE_MAP_REVEAL_V0],
      headline: "Map",
      lines: [anchor.visible ? "Harita — bağlandığın yer" : "Harita — yer kazanılınca açılır"],
      surface: "map"
    },
    {
      id: RTL_PHASE_STUDIO_REVEAL_V0,
      durationMs: DEFAULT_DURATIONS_MS[RTL_PHASE_STUDIO_REVEAL_V0],
      headline: "Studio",
      lines: ["Üretim alanı — aynı thread"],
      surface: "studio"
    },
    {
      id: RTL_PHASE_CHAT_RESUME_V0,
      durationMs: DEFAULT_DURATIONS_MS[RTL_PHASE_CHAT_RESUME_V0],
      headline: "Sohbet",
      lines: [thread_id ? `Thread ${thread_id} sürdürülüyor` : "Süreklilik hazır"],
      surface: "chat"
    },
    {
      id: RTL_PHASE_COMPLETE_V0,
      durationMs: 0,
      headline: "Experience state",
      lines: [`${toMode} — expressive reality active`]
    }
  ];

  return Object.freeze({
    contract_version: RTL_CONTRACT_V0,
    experience_state: toMode,
    from_mode: fromMode,
    to_mode: toMode,
    thread_id: thread_id || null,
    trace_id: trace_id || null,
    pal_anchor: anchor,
    phases: Object.freeze(phases)
  });
}

export function shouldRunExpressiveRealityTransitionV0() {
  if (!isRhizohCreativeSurfaceEnabledV0()) return false;
  if (resolveExpressiveRealityModeV0() !== EXPRESSIVE_REALITY_MODE_CREATIVE_V0) return false;
  try {
    if (sessionStorage.getItem(RTL_SESSION_COMPLETE_KEY_V0) === "1") return false;
  } catch {
    /* ignore */
  }
  return true;
}

export function markExpressiveRealityTransitionCompleteV0() {
  try {
    sessionStorage.setItem(RTL_SESSION_COMPLETE_KEY_V0, "1");
  } catch {
    /* ignore */
  }
}

export function resetExpressiveRealityTransitionSessionV0() {
  try {
    sessionStorage.removeItem(RTL_SESSION_COMPLETE_KEY_V0);
    sessionStorage.removeItem(RTL_SESSION_CONTEXT_KEY_V0);
  } catch {
    /* ignore */
  }
  resetMemoryAnchorSessionV0();
}

/**
 * @param {ReturnType<typeof buildExpressiveRealityTransitionPlanV0>} plan
 */
export function persistExpressiveRealityTransitionContextV0(plan) {
  try {
    sessionStorage.setItem(
      RTL_SESSION_CONTEXT_KEY_V0,
      JSON.stringify({
        thread_id: plan.thread_id,
        trace_id: plan.trace_id,
        pal_anchor: plan.pal_anchor
      })
    );
  } catch {
    /* ignore */
  }
}

/**
 * @param {ReturnType<typeof buildExpressiveRealityTransitionPlanV0>} plan
 * @param {{
 *   onPhase?: (phase: Record<string, unknown>, index: number) => void,
 *   onSurfaceReveal?: (surface: string) => void,
 *   onComplete?: (plan: ReturnType<typeof buildExpressiveRealityTransitionPlanV0>) => void,
 *   signal?: AbortSignal
 * }} [callbacks]
 * @returns {{ cancel: () => void }}
 */
export function runExpressiveRealityTransitionV0(plan, callbacks = {}) {
  let cancelled = false;
  let timer = null;
  let index = 0;

  const cancel = () => {
    cancelled = true;
    if (timer) clearTimeout(timer);
  };

  if (callbacks.signal) {
    if (callbacks.signal.aborted) return { cancel };
    callbacks.signal.addEventListener("abort", cancel, { once: true });
  }

  const step = () => {
    if (cancelled) return;
    const phase = plan.phases[index];
    if (!phase) {
      markExpressiveRealityTransitionCompleteV0();
      persistExpressiveRealityTransitionContextV0(plan);
      callbacks.onComplete?.(plan);
      if (typeof window !== "undefined") {
        window.dispatchEvent(
          new CustomEvent(RTL_EVENT_CONTEXT_V0, {
            detail: Object.freeze({ plan, complete: true })
          })
        );
      }
      return;
    }

    callbacks.onPhase?.(phase, index);

    if (phase.surface && typeof window !== "undefined") {
      callbacks.onSurfaceReveal?.(phase.surface);
      window.dispatchEvent(
        new CustomEvent(RTL_EVENT_SURFACE_REVEAL_V0, {
          detail: Object.freeze({ surface: phase.surface, phaseId: phase.id, visible: true })
        })
      );
    }

    const durationMs = Math.max(0, Number(phase.durationMs) || 0);
    index += 1;
    if (durationMs === 0) {
      step();
      return;
    }
    timer = setTimeout(step, durationMs);
  };

  step();
  return { cancel };
}

/**
 * @param {{
 *   threadId?: string,
 *   traceId?: string,
 *   lifeContinuity?: unknown,
 *   lifeEntityProjection?: unknown,
 *   lifeEntityResolver?: unknown
 * }} detail
 */
export function dispatchExpressiveRealityContextV0(detail) {
  if (typeof window === "undefined") return;
  const plan = buildExpressiveRealityTransitionPlanV0(detail);
  try {
    sessionStorage.setItem(
      RTL_SESSION_CONTEXT_KEY_V0,
      JSON.stringify({
        thread_id: plan.thread_id,
        trace_id: plan.trace_id,
        pal_anchor: plan.pal_anchor
      })
    );
  } catch {
    /* ignore */
  }

  window.dispatchEvent(
    new CustomEvent(RTL_EVENT_CONTEXT_V0, {
      detail: Object.freeze({ ...detail, plan })
    })
  );
}

/**
 * Start boot transition if E2-X and not yet completed this session.
 * @param {Parameters<typeof buildExpressiveRealityTransitionPlanV0>[0]} [input]
 * @param {Parameters<typeof runExpressiveRealityTransitionV0>[1]} [callbacks]
 */
export function maybeStartExpressiveRealityBootTransitionV0(input, callbacks) {
  if (!shouldRunExpressiveRealityTransitionV0()) {
    return { started: false, cancel: () => {} };
  }
  const plan = buildExpressiveRealityTransitionPlanV0(input);
  const runner = runExpressiveRealityTransitionV0(plan, callbacks);
  return { started: true, plan, cancel: runner.cancel };
}
