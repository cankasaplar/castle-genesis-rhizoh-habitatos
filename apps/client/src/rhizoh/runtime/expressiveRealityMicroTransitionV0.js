/**
 * Micro-RTL v0 — interaction feedback loop (200–400ms PAL flicker).
 * Boot RTL = fast break; micro = off-ball movement (screen, cut, reposition).
 *
 * @see docs/RHIZOH_E2X_PRODUCT_REALITY_AND_MODE_TRANSITION_V0.md
 */

import { isRhizohCreativeSurfaceEnabledV0 } from "./castleCreativeSurfaceGateV0.js";
import { resolveExpressiveRealityModeV0 } from "./expressiveRealityModeV0.js";
import {
  extractPalAnchorFromLifeProjectionV0,
  RTL_SESSION_COMPLETE_KEY_V0
} from "./expressiveRealityTransitionV0.js";
import {
  mergePalIntoAnchorContextV0,
  resetMemoryAnchorSessionV0,
  resolveDisplayAnchorV0
} from "./memoryAnchorSystemV0.js";

export const MICRO_RTL_CONTRACT_V0 = "expressive-reality-micro-v0";
export const RTL_EVENT_MICRO_V0 = "rhizoh:rtl-micro";
export const EMOTIONAL_ANCHOR_KEY_V0 = "rhizoh.rtl.emotional_anchor.v0";

export const MICRO_MESSAGE_ARRIVE_V0 = "message_arrive";
export const MICRO_MAP_PIN_CHANGE_V0 = "map_pin_change";
export const MICRO_THREAD_SWITCH_V0 = "thread_switch";
export const MICRO_MEMORY_RECALL_V0 = "memory_recall";
export const MICRO_MAP_SURFACE_OPEN_V0 = "map_surface_open";
export const MICRO_CHAT_RETURN_V0 = "chat_return";
export const MICRO_STORY_SHIFT_V0 = "story_shift";

const MICRO_DURATIONS_MS = Object.freeze({
  [MICRO_MESSAGE_ARRIVE_V0]: 280,
  [MICRO_MAP_PIN_CHANGE_V0]: 360,
  [MICRO_THREAD_SWITCH_V0]: 320,
  [MICRO_MEMORY_RECALL_V0]: 340,
  [MICRO_MAP_SURFACE_OPEN_V0]: 300,
  [MICRO_CHAT_RETURN_V0]: 260,
  [MICRO_STORY_SHIFT_V0]: 400
});

const MICRO_MIN_GAP_MS = 180;
let lastMicroAt = 0;

/**
 * @returns {boolean}
 */
export function isExpressiveRealityBootCompleteV0() {
  try {
    return sessionStorage.getItem(RTL_SESSION_COMPLETE_KEY_V0) === "1";
  } catch {
    return false;
  }
}

/**
 * @returns {Record<string, unknown> | null}
 */
export function readEmotionalAnchorV0() {
  return resolveDisplayAnchorV0();
}

/**
 * @param {ReturnType<typeof extractPalAnchorFromLifeProjectionV0>} palAnchor
 * @param {{ kind?: string, thread_id?: string, trace_id?: string }} [meta]
 */
export function persistEmotionalAnchorV0(palAnchor, meta = {}) {
  return mergePalIntoAnchorContextV0(palAnchor, {
    threadId: meta.thread_id,
    traceId: meta.trace_id,
    kind: meta.kind
  });
}

/**
 * @param {string} kind
 * @param {ReturnType<typeof readEmotionalAnchorV0>} anchor
 * @param {Record<string, unknown>} [extra]
 */
export function buildMicroRtlPhaseV0(kind, anchor, extra = {}) {
  const label = String(anchor?.primary_label || anchor?.label || "Continuity");
  const memory = String(anchor?.memory_anchor || `Bağlandığın yer: ${label}`);

  /** @type {Record<string, { headline: string, lines: string[] }>} */
  const copy = {
    [MICRO_MESSAGE_ARRIVE_V0]: {
      headline: "Süreklilik",
      lines: [memory, "Yeni turn bağlandı"]
    },
    [MICRO_MAP_PIN_CHANGE_V0]: {
      headline: "Yer güncellendi",
      lines: [memory, "PAL pin değişti"]
    },
    [MICRO_THREAD_SWITCH_V0]: {
      headline: "Thread",
      lines: [memory, extra.thread_id ? `Thread ${extra.thread_id}` : "Sohbet dalı değişti"]
    },
    [MICRO_MEMORY_RECALL_V0]: {
      headline: "Hatırlama",
      lines: [memory, "Geçmiş turn'lere referans"]
    },
    [MICRO_MAP_SURFACE_OPEN_V0]: {
      headline: "Harita",
      lines: [memory, "Harita — memory anchor"]
    },
    [MICRO_CHAT_RETURN_V0]: {
      headline: "Sohbete dönüş",
      lines: [memory, "Thread sürdürülüyor"]
    },
    [MICRO_STORY_SHIFT_V0]: {
      headline: "Hikâye",
      lines: [memory, String(extra.detail || "Anlatı kaydı değişti")]
    }
  };

  const block = copy[kind] || { headline: "Continuity", lines: [memory] };

  return Object.freeze({
    id: `micro_${kind}`,
    variant: "micro",
    kind,
    durationMs: MICRO_DURATIONS_MS[kind] || 300,
    headline: block.headline,
    lines: block.lines,
    emotional_anchor: anchor
  });
}

/**
 * @param {string} kind
 * @param {{
 *   threadId?: string,
 *   traceId?: string,
 *   lifeEntityProjection?: unknown,
 *   lifeEntityResolver?: unknown,
 *   lifeContinuityRecall?: unknown,
 *   detail?: string,
 *   force?: boolean
 * }} [input]
 * @returns {boolean}
 */
export function triggerMicroExpressiveRealityTransitionV0(kind, input = {}) {
  if (!isRhizohCreativeSurfaceEnabledV0()) return false;
  if (resolveExpressiveRealityModeV0() !== "E2-X") return false;
  if (!isExpressiveRealityBootCompleteV0() && !input.force) return false;

  const now = Date.now();
  if (!input.force && now - lastMicroAt < MICRO_MIN_GAP_MS) return false;
  lastMicroAt = now;

  const pal = extractPalAnchorFromLifeProjectionV0(
    input.lifeEntityProjection,
    input.lifeEntityResolver
  );
  const anchor = persistEmotionalAnchorV0(pal, {
    kind,
    thread_id: input.threadId,
    trace_id: input.traceId
  });

  const phase = buildMicroRtlPhaseV0(kind, anchor, {
    thread_id: input.threadId,
    detail: input.detail
  });

  if (typeof window !== "undefined") {
    window.dispatchEvent(
      new CustomEvent(RTL_EVENT_MICRO_V0, {
        detail: Object.freeze({
          kind,
          phase,
          anchor,
          recall: input.lifeContinuityRecall || null
        })
      })
    );
  }

  return true;
}

/**
 * @param {Parameters<typeof extractPalAnchorFromLifeProjectionV0>[0]} projection
 * @param {Parameters<typeof extractPalAnchorFromLifeProjectionV0>[1]} [resolver]
 * @param {{ threadId?: string, traceId?: string }} [meta]
 */
export function maybeTriggerMapPinChangeMicroRtlV0(projection, resolver, meta = {}) {
  const pal = extractPalAnchorFromLifeProjectionV0(projection, resolver);
  const prev = readEmotionalAnchorV0();
  const prevLabel = prev?.primary_label || prev?.label;
  const labelChanged = prevLabel && pal.label && prevLabel !== pal.label;
  const visibilityChanged = prev && Boolean(prev.pal_visible) !== Boolean(pal.visible);
  if (!labelChanged && !visibilityChanged && prev?.castle_id === pal.castle_id) {
    return triggerMicroExpressiveRealityTransitionV0(MICRO_MESSAGE_ARRIVE_V0, {
      ...meta,
      lifeEntityProjection: projection,
      lifeEntityResolver: resolver
    });
  }
  return triggerMicroExpressiveRealityTransitionV0(MICRO_MAP_PIN_CHANGE_V0, {
    ...meta,
    lifeEntityProjection: projection,
    lifeEntityResolver: resolver
  });
}

/**
 * @param {{ source?: string }} [opts]
 */
export function maybeTriggerMapSurfaceMicroRtlV0(opts = {}) {
  const anchor = readEmotionalAnchorV0();
  return triggerMicroExpressiveRealityTransitionV0(MICRO_MAP_SURFACE_OPEN_V0, {
    detail: opts.source ? `Kaynak: ${opts.source}` : undefined,
    lifeEntityProjection: anchor ? { projections: [] } : undefined,
    force: false
  });
}

/**
 * @param {string} threadId
 */
export function triggerThreadSwitchMicroRtlV0(threadId) {
  return triggerMicroExpressiveRealityTransitionV0(MICRO_THREAD_SWITCH_V0, { threadId });
}

/**
 * @param {unknown} recall
 * @param {{ threadId?: string }} [meta]
 */
export function triggerMemoryRecallMicroRtlV0(recall, meta = {}) {
  return triggerMicroExpressiveRealityTransitionV0(MICRO_MEMORY_RECALL_V0, {
    ...meta,
    lifeContinuityRecall: recall
  });
}

export function triggerChatReturnMicroRtlV0() {
  const anchor = readEmotionalAnchorV0();
  return triggerMicroExpressiveRealityTransitionV0(MICRO_CHAT_RETURN_V0, {
    threadId: anchor?.thread_id ? String(anchor.thread_id) : undefined
  });
}

/**
 * @param {string} detail
 */
export function triggerStoryShiftMicroRtlV0(detail) {
  return triggerMicroExpressiveRealityTransitionV0(MICRO_STORY_SHIFT_V0, { detail });
}

/**
 * Chat / message pulse — SSOT alias for `message_arrive`.
 * @param {Parameters<typeof triggerMicroExpressiveRealityTransitionV0>[1]} [input]
 */
export function triggerMessageMicroRtlV0(input = {}) {
  return triggerMicroExpressiveRealityTransitionV0(MICRO_MESSAGE_ARRIVE_V0, input);
}

/**
 * Map / PAL spatial anchor pulse — SSOT alias for pin-change path.
 * @param {Parameters<typeof maybeTriggerMapPinChangeMicroRtlV0>[0]} projection
 * @param {Parameters<typeof maybeTriggerMapPinChangeMicroRtlV0>[1]} [resolver]
 * @param {Parameters<typeof maybeTriggerMapPinChangeMicroRtlV0>[2]} [meta]
 */
export function triggerMapAnchorPulseV0(projection, resolver, meta = {}) {
  return maybeTriggerMapPinChangeMicroRtlV0(projection, resolver, meta);
}

export function resetEmotionalAnchorSessionV0() {
  resetMemoryAnchorSessionV0();
  lastMicroAt = 0;
}
