/**
 * Castle Learning Trace Strip v1.9 — observable learning state UI projection.
 * Answers: "Why did the system behave this way?" — last 3 visible events.
 * @see apps/client/docs/RHIZOH_CASTLE_OS_V1_9.md
 */

import { LEARNING_TRACE_KIND_V1_8 } from "./castleStabilityLearningTraceV1_8.js";
import { MODALITY_V1_7 } from "./castleStabilityMemoryGraphV1_7.js";
import { getUserPhysicsProfileV1_7 } from "./castleStabilityMemoryGraphV1_7.js";

export const CASTLE_LEARNING_TRACE_STRIP_SCHEMA_V1_9 = "castle.learning_trace_strip.v1.9";

export const LEARNING_TRACE_TRIGGER_V1_9 = Object.freeze({
  MIC_INTERRUPT: "mic_interrupt",
  CO_WATCH_OVERRIDE: "co_watch_override",
  USER_PHASE_CHANGE: "user_phase_change",
  DRIFT_EVENT: "drift_event",
  PRIOR_APPLIED: "prior_applied",
  CLOUD_RECONCILE: "cloud_reconcile",
  PHYSICS_DECAY: "physics_decay"
});

const TRIGGER_LABEL_TR_V1_9 = Object.freeze({
  [LEARNING_TRACE_TRIGGER_V1_9.MIC_INTERRUPT]: "mic interrupt",
  [LEARNING_TRACE_TRIGGER_V1_9.CO_WATCH_OVERRIDE]: "co_watch override",
  [LEARNING_TRACE_TRIGGER_V1_9.USER_PHASE_CHANGE]: "phase override",
  [LEARNING_TRACE_TRIGGER_V1_9.DRIFT_EVENT]: "drift event",
  [LEARNING_TRACE_TRIGGER_V1_9.PRIOR_APPLIED]: "learned prior",
  [LEARNING_TRACE_TRIGGER_V1_9.CLOUD_RECONCILE]: "cloud reconcile",
  [LEARNING_TRACE_TRIGGER_V1_9.PHYSICS_DECAY]: "physics decay"
});

const REASON_COPY_TR_V1_9 = Object.freeze({
  rapid_interrupt_pattern: "rapid user re-entry detected",
  high_salience_implicit_steering: "high salience implicit steering",
  ambient_voice_engagement: "ambient voice engagement",
  explicit_override_recorded: "user explicit control signal",
  physics_observation_tick: "physics observation tick",
  learned_physics_prior_applied_before_interaction: "learned prior applied before interaction",
  stale_physics_decay_toward_defaults: "stale profile decay toward defaults",
  overfit_guard_pull_toward_defaults: "overfit guard normalization",
  cross_device_physics_reconcile: "cross-device cognitive reconciliation",
  cross_device_physics_merge: "cross-device merge import",
  cloud_sync_push_debounced: "debounced cloud sync push",
  cloud_sync_queued_offline: "offline queue — no cloud adapter"
});

function num(n, fallback = 0) {
  const v = Number(n);
  return Number.isFinite(v) ? v : fallback;
}

export function inferLearningTraceTriggerV1_9(entry = {}) {
  const kind = entry.kind;
  const reason = entry.reason || "";
  const modality = entry.modality;

  if (kind === LEARNING_TRACE_KIND_V1_8.IMPLICIT_BIAS && reason === "rapid_interrupt_pattern") {
    return LEARNING_TRACE_TRIGGER_V1_9.MIC_INTERRUPT;
  }
  if (
    kind === LEARNING_TRACE_KIND_V1_8.MEMORY_OBSERVE &&
    modality === MODALITY_V1_7.CO_WATCH &&
    (entry.deltas?.overrideRecorded || reason === "explicit_override_recorded")
  ) {
    return LEARNING_TRACE_TRIGGER_V1_9.CO_WATCH_OVERRIDE;
  }
  if (kind === LEARNING_TRACE_KIND_V1_8.MEMORY_OBSERVE && reason === "explicit_override_recorded") {
    return LEARNING_TRACE_TRIGGER_V1_9.USER_PHASE_CHANGE;
  }
  if (kind === LEARNING_TRACE_KIND_V1_8.DECAY || kind === LEARNING_TRACE_KIND_V1_8.RENORMALIZE) {
    return LEARNING_TRACE_TRIGGER_V1_9.PHYSICS_DECAY;
  }
  if (kind === LEARNING_TRACE_KIND_V1_8.SYNC_IMPORT) {
    return LEARNING_TRACE_TRIGGER_V1_9.CLOUD_RECONCILE;
  }
  if (kind === LEARNING_TRACE_KIND_V1_8.PRIOR_APPLIED) {
    return LEARNING_TRACE_TRIGGER_V1_9.PRIOR_APPLIED;
  }
  if (entry.deltas?.driftRecorded || reason.includes("drift")) {
    return LEARNING_TRACE_TRIGGER_V1_9.DRIFT_EVENT;
  }
  if (kind === LEARNING_TRACE_KIND_V1_8.IMPLICIT_BIAS) {
    return LEARNING_TRACE_TRIGGER_V1_9.MIC_INTERRUPT;
  }
  return LEARNING_TRACE_TRIGGER_V1_9.DRIFT_EVENT;
}

export function extractTraceDeltaV1_9(entry = {}) {
  const deltas = entry.deltas || {};
  const delta = Object.create(null);

  if (deltas.speechPriority != null) delta.speechPriority = num(deltas.speechPriority);
  if (deltas.phaseIndexPrior != null) delta.stabilityBias = num(deltas.phaseIndexPrior);
  if (deltas.userInfluencePrior != null && delta.stabilityBias == null) {
    delta.stabilityBias = num(deltas.userInfluencePrior);
  }
  if (entry.modality) delta.modalityShift = String(entry.modality);
  if (deltas.decayRate != null) delta.stabilityBias = -num(deltas.decayRate);
  if (deltas.maxDeviation != null) delta.stabilityBias = -num(deltas.maxDeviation) * 0.1;

  return Object.freeze(delta);
}

/**
 * LearningTraceItem — UI-facing trace projection.
 */
export function mapTraceEntryToLearningTraceItemV1_9(entry) {
  if (!entry) return null;
  const trigger = inferLearningTraceTriggerV1_9(entry);
  const delta = extractTraceDeltaV1_9(entry);
  const reason = REASON_COPY_TR_V1_9[entry.reason] || entry.reason || "stability adaptation";

  return Object.freeze({
    schema: CASTLE_LEARNING_TRACE_STRIP_SCHEMA_V1_9,
    timestamp: num(entry.atMs, Date.now()),
    trigger,
    triggerLabel: TRIGGER_LABEL_TR_V1_9[trigger] || trigger,
    delta,
    reason,
    traceId: entry.traceId,
    kind: entry.kind,
    modality: entry.modality || null,
    source: entry.source || null,
    humanVisible: entry.humanVisible !== false,
    raw: entry
  });
}

export function formatTraceItemDeltaV1_9(item) {
  if (!item?.delta) return "";
  const parts = [];
  const d = item.delta;
  if (d.speechPriority != null) {
    const sign = d.speechPriority >= 0 ? "+" : "";
    parts.push(`${sign}${d.speechPriority.toFixed(2)} speech priority`);
  }
  if (d.stabilityBias != null) {
    const sign = d.stabilityBias >= 0 ? "+" : "";
    parts.push(`${sign}${d.stabilityBias.toFixed(2)} stability damping`);
  }
  if (d.modalityShift) {
    parts.push(`modality shift: ${d.modalityShift}`);
  }
  return parts.join(" · ") || "observational delta";
}

export function formatTraceItemLineV1_9(item, index = 0) {
  if (!item) return "";
  const deltaText = formatTraceItemDeltaV1_9(item);
  return `${index + 1}. ${item.triggerLabel} → ${deltaText}\n   reason: ${item.reason}`;
}

export function buildLearningTraceStripV1_9(learningTrace, limit = 3) {
  const items = (learningTrace?.entries || [])
    .slice(-limit)
    .map(mapTraceEntryToLearningTraceItemV1_9)
    .filter(Boolean);

  return Object.freeze({
    schema: CASTLE_LEARNING_TRACE_STRIP_SCHEMA_V1_9,
    title: "Last 3 Learning Events",
    items: Object.freeze(items),
    lines: Object.freeze(items.map((item, i) => formatTraceItemLineV1_9(item, i))),
    totalCount: learningTrace?.totalCount ?? items.length,
    traceable: items.every((e) => e.humanVisible),
    replayable: items.length > 0,
    explainable: true
  });
}

export function getTraceDecisionPathV1_9(traceId, learningTrace) {
  const entries = learningTrace?.entries || [];
  const idx = entries.findIndex((e) => e.traceId === traceId);
  if (idx < 0) return null;

  const windowStart = Math.max(0, idx - 2);
  const path = entries.slice(windowStart, idx + 1).map(mapTraceEntryToLearningTraceItemV1_9);

  return Object.freeze({
    schema: CASTLE_LEARNING_TRACE_STRIP_SCHEMA_V1_9,
    traceId,
    path: Object.freeze(path),
    replayable: true
  });
}

export function previewPhysicsRewindV1_9(ownerId, traceItem, atMs = Date.now()) {
  const profile = getUserPhysicsProfileV1_7(String(ownerId));
  if (!traceItem) {
    return Object.freeze({ preview: false, reason: "missing_trace" });
  }

  const modality = traceItem.modality || MODALITY_V1_7.GENERAL;
  const bias = profile.modalityBiasGraph?.[modality] || profile.modalityBiasGraph?.[MODALITY_V1_7.GENERAL];
  const rewindScale = 0.85;

  return Object.freeze({
    schema: CASTLE_LEARNING_TRACE_STRIP_SCHEMA_V1_9,
    preview: true,
    atMs,
    traceId: traceItem.traceId,
    trigger: traceItem.trigger,
    projectedSpeakShare: num(bias?.speechPriority, 0.5) * rewindScale,
    projectedStabilityBias: num(bias?.phaseIndex, 0.45) * rewindScale,
    modality,
    note: "rewind preview — observational only, no execution authority"
  });
}

export const LEARNING_TRACE_REPLAY_EVENT_V1_9 = "castle.learning_trace.replay.v1.9";

export function publishLearningTraceReplayV1_9(traceId, decisionPath) {
  if (typeof window === "undefined") return;
  window.dispatchEvent(
    new CustomEvent(LEARNING_TRACE_REPLAY_EVENT_V1_9, {
      detail: Object.freeze({ traceId, decisionPath, atMs: Date.now() })
    })
  );
}
