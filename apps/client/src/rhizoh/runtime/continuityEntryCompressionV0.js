/**
 * Continuity Entry Compression v0 — DEPRECATED visible 3-step pipeline.
 * Default entry: {@link continuitySeamlessEntryV0.js} (silent continuation).
 * Opt-in only: `VITE_RHIZOH_VISIBLE_ENTRY_PIPELINE=1`.
 *
 * @deprecated Use continuitySeamlessEntryV0 — transition must not be felt.
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
  getOriginSeedAnchorV0,
  mergePalIntoAnchorContextV0,
  readUserAnchorV0,
  resolveDisplayAnchorV0
} from "./memoryAnchorSystemV0.js";

export const CEC_CONTRACT_V0 = "continuity-entry-compression-v0";
export const CEC_EVENT_V0 = "rhizoh:continuity-entry-compression";

export const CEC_PHASE_OPEN_V0 = "cec_open";
export const CEC_PHASE_ANCHOR_RESTORE_V0 = "cec_anchor_restore";
export const CEC_PHASE_CONTINUE_V0 = "cec_continue";

/** @type {readonly string[]} */
export const CEC_PHASE_SEQUENCE_V0 = Object.freeze([
  CEC_PHASE_OPEN_V0,
  CEC_PHASE_ANCHOR_RESTORE_V0,
  CEC_PHASE_CONTINUE_V0
]);

const CEC_DURATIONS_MS = Object.freeze({
  [CEC_PHASE_OPEN_V0]: 280,
  [CEC_PHASE_ANCHOR_RESTORE_V0]: 360,
  [CEC_PHASE_CONTINUE_V0]: 260
});

function readFullCeremonyEnv() {
  if (typeof import.meta === "undefined" || !import.meta.env) return false;
  return String(import.meta.env.VITE_RHIZOH_RTL_FULL_CEREMONY || "").trim() === "1";
}

/**
 * @returns {boolean}
 */
function readVisiblePipelineEnv() {
  if (typeof import.meta === "undefined" || !import.meta.env) return false;
  return String(import.meta.env.VITE_RHIZOH_VISIBLE_ENTRY_PIPELINE || "").trim() === "1";
}

/** @deprecated Visible pipeline only — not default. */
export function shouldUseContinuityEntryCompressionV0() {
  if (!readVisiblePipelineEnv()) return false;
  if (!isRhizohCreativeSurfaceEnabledV0()) return false;
  if (resolveExpressiveRealityModeV0() !== EXPRESSIVE_REALITY_MODE_CREATIVE_V0) return false;
  if (readFullCeremonyEnv()) return false;
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

/**
 * @param {{
 *   threadId?: string,
 *   traceId?: string,
 *   lifeContinuity?: unknown,
 *   lifeEntityProjection?: unknown,
 *   lifeEntityResolver?: unknown
 * }} [input]
 */
export function buildContinuityEntryCompressionPlanV0(input = {}) {
  const base = buildExpressiveRealityTransitionPlanV0(input);
  const pal = extractPalAnchorFromLifeProjectionV0(
    input.lifeEntityProjection,
    input.lifeEntityResolver
  );
  mergePalIntoAnchorContextV0(pal, { kind: "cec_anchor_restore", threadId: base.thread_id || undefined });
  const display = resolveDisplayAnchorV0();
  const user = readUserAnchorV0();
  const origin = getOriginSeedAnchorV0();
  const persisted = readPersistedRtlContextV0();

  const primary = String(display?.primary_label || display?.label || origin.label);
  const thread_id =
    base.thread_id ||
    (user?.thread_id ? String(user.thread_id) : "") ||
    (persisted?.thread_id ? String(persisted.thread_id) : "") ||
    null;

  const phases = Object.freeze([
    Object.freeze({
      id: CEC_PHASE_OPEN_V0,
      variant: "compression",
      durationMs: CEC_DURATIONS_MS[CEC_PHASE_OPEN_V0],
      headline: "Açılıyor",
      lines: ["Süreklilik alanı"]
    }),
    Object.freeze({
      id: CEC_PHASE_ANCHOR_RESTORE_V0,
      variant: "compression",
      durationMs: CEC_DURATIONS_MS[CEC_PHASE_ANCHOR_RESTORE_V0],
      headline: primary,
      lines: [
        String(display?.memory_anchor || `Bağın: ${primary}`),
        user ? "Kişisel köken geri yüklendi" : "Paylaşılan tohum topolojisi"
      ],
      palAnchor: pal
    }),
    Object.freeze({
      id: CEC_PHASE_CONTINUE_V0,
      variant: "compression",
      durationMs: CEC_DURATIONS_MS[CEC_PHASE_CONTINUE_V0],
      headline: "Devam",
      lines: [thread_id ? "Thread sürdürülüyor" : "Hazırsın"],
      surfaces: Object.freeze(["map", "studio", "chat"])
    })
  ]);

  return Object.freeze({
    contract_version: CEC_CONTRACT_V0,
    compression: true,
    experience_state: base.experience_state,
    thread_id,
    trace_id: base.trace_id,
    pal_anchor: pal,
    display_anchor: display,
    phases
  });
}

/**
 * @param {ReturnType<typeof buildContinuityEntryCompressionPlanV0>} plan
 * @param {{
 *   onPhase?: (phase: Record<string, unknown>, index: number) => void,
 *   onComplete?: (plan: ReturnType<typeof buildContinuityEntryCompressionPlanV0>) => void,
 *   signal?: AbortSignal
 * }} [callbacks]
 */
export function runContinuityEntryCompressionV0(plan, callbacks = {}) {
  let cancelled = false;
  let timer = null;
  let index = 0;

  const cancel = () => {
    cancelled = true;
    if (timer) clearTimeout(timer);
  };

  if (callbacks.signal?.aborted) return { cancel };
  callbacks.signal?.addEventListener("abort", cancel, { once: true });

  const revealSurfaces = () => {
    if (typeof window === "undefined") return;
    for (const surface of ["map", "studio", "chat"]) {
      window.dispatchEvent(
        new CustomEvent(RTL_EVENT_SURFACE_REVEAL_V0, {
          detail: Object.freeze({ surface, phaseId: CEC_PHASE_CONTINUE_V0, visible: true, compressed: true })
        })
      );
    }
  };

  const step = () => {
    if (cancelled) return;
    const phase = plan.phases[index];
    if (!phase) {
      revealSurfaces();
      markExpressiveRealityTransitionCompleteV0();
      persistExpressiveRealityTransitionContextV0(
        /** @type {ReturnType<typeof buildExpressiveRealityTransitionPlanV0>} */ (
          /** @type {unknown} */ (plan)
        )
      );
      callbacks.onComplete?.(plan);
      if (typeof window !== "undefined") {
        window.dispatchEvent(
          new CustomEvent(RTL_EVENT_CONTEXT_V0, {
            detail: Object.freeze({ plan, complete: true, compressed: true })
          })
        );
        window.dispatchEvent(
          new CustomEvent(CEC_EVENT_V0, {
            detail: Object.freeze({ plan, complete: true })
          })
        );
      }
      return;
    }

    callbacks.onPhase?.(phase, index);

    if (phase.id === CEC_PHASE_CONTINUE_V0) {
      revealSurfaces();
    }

    index += 1;
    const durationMs = Math.max(0, Number(phase.durationMs) || 0);
    timer = durationMs > 0 ? setTimeout(step, durationMs) : undefined;
    if (durationMs === 0) step();
  };

  step();
  return { cancel };
}

/**
 * @param {Parameters<typeof buildContinuityEntryCompressionPlanV0>[0]} [input]
 * @param {Parameters<typeof runContinuityEntryCompressionV0>[1]} [callbacks]
 */
export function maybeStartContinuityEntryCompressionV0(input, callbacks) {
  if (!shouldUseContinuityEntryCompressionV0()) {
    return { started: false, cancel: () => {} };
  }
  const plan = buildContinuityEntryCompressionPlanV0(input);
  const runner = runContinuityEntryCompressionV0(plan, callbacks);
  return { started: true, plan, cancel: runner.cancel };
}

/**
 * Total planned duration (ms) for tests / ops.
 * @param {ReturnType<typeof buildContinuityEntryCompressionPlanV0>} plan
 */
export function continuityEntryCompressionTotalMsV0(plan) {
  return plan.phases.reduce((sum, p) => sum + Math.max(0, Number(p.durationMs) || 0), 0);
}
