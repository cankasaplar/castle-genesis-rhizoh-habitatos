/**
 * Cognitive Visualization Binding V0 — maps drift/admission/REC to UI semantics.
 *
 * Cognitive Transparency Interface — perception projection, not control.
 * PUSH: drift/AlertPacket (suggest only, rate-limited)
 * PULL: admission authority context (audit-safe fetch)
 *
 * interpretationOnly · nonExecutive · DR-01 · DR-02
 * @see docs/RHIZOH_COGNITIVE_VISUALIZATION_BINDING_V1.md
 */

import { MUTATION_REASON_CATEGORY_V1 } from "./mutationReasonCodeOntologyV1.js";
import { assertDriftOutputGuardsV0 } from "./driftSuggestionGuardsV0.js";
import { listPendingCompressionQueueV0, listRecCycleHistoryV0 } from "./recTombstoneQueueV0.js";
import { wireAlertPacketsToNervousNetworkV0 } from "./ticketDriftSignalWireV0.js";

export const COGNITIVE_VIZ_BINDING_SCHEMA_V0 = "castle.rhizoh.cognitive_viz_binding.v0";
export const EPISTEMIC_UI_EVENT_V0 = "rhizoh:epistemic-ui-v0";

/** Category → visual density field (HSL hue, geometry kind). */
export const CATEGORY_VISUAL_MAP_V0 = Object.freeze({
  [MUTATION_REASON_CATEGORY_V1.SC]: Object.freeze({ hueDeg: 15, geometry: "angular_spikes", label: "permission_stress" }),
  [MUTATION_REASON_CATEGORY_V1.QUOTA]: Object.freeze({ hueDeg: 210, geometry: "vertical_bars", label: "quota_topology" }),
  [MUTATION_REASON_CATEGORY_V1.REC]: Object.freeze({ hueDeg: 280, geometry: "waveform_bands", label: "temporal_continuity" }),
  [MUTATION_REASON_CATEGORY_V1.SIG]: Object.freeze({ hueDeg: 45, geometry: "halo_rings", label: "trust_binding" }),
  [MUTATION_REASON_CATEGORY_V1.INTENT]: Object.freeze({ hueDeg: 120, geometry: "directed_edges", label: "intent_binding" }),
  [MUTATION_REASON_CATEGORY_V1.ADMIT]: Object.freeze({ hueDeg: 180, geometry: "gate_brackets", label: "admission_gate" }),
  [MUTATION_REASON_CATEGORY_V1.ENTROPY_DRIFT]: Object.freeze({
    hueDeg: 300,
    geometry: "particle_field",
    label: "stochastic_entropy"
  })
});

const REC_WAVEFORM_ANCHORS_V0 = Object.freeze({
  rec_core_morning: { localTime: "06:44", peak: "A" },
  rec_core_evening: { localTime: "18:44", peak: "B" },
  rec_soft: { localTime: null, peak: "trough" },
  rec_burst: { localTime: null, peak: "ripple" }
});

const DEFAULT_PUSH_RATE_LIMIT_V0 = Object.freeze({ maxEvents: 10, windowMs: 60_000 });

/** @type {number[]} */
const pushTimestampsV0 = [];

/**
 * @param {{ maxEvents?: number, windowMs?: number }} [opts]
 */
function allowPushEventV0(opts = {}) {
  const max = opts.maxEvents ?? DEFAULT_PUSH_RATE_LIMIT_V0.maxEvents;
  const windowMs = opts.windowMs ?? DEFAULT_PUSH_RATE_LIMIT_V0.windowMs;
  const now = Date.now();
  while (pushTimestampsV0.length > 0 && pushTimestampsV0[0] < now - windowMs) {
    pushTimestampsV0.shift();
  }
  if (pushTimestampsV0.length >= max) return false;
  pushTimestampsV0.push(now);
  return true;
}

/**
 * @param {number} n
 */
function clamp01(n) {
  const x = Number(n);
  if (!Number.isFinite(x)) return 0;
  return Math.max(0, Math.min(1, x));
}

/**
 * @param {{
 *   analytics?: object,
 *   anomalies?: { alerts?: object[] },
 *   rateLimit?: { maxEvents?: number, windowMs?: number },
 *   dispatchEvent?: boolean
 * }} input
 */
export function pushPerceptionStreamV0(input) {
  const alerts = input.anomalies?.alerts || [];
  /** @type {object[]} */
  const uiEvents = [];

  for (const alert of alerts) {
    assertDriftOutputGuardsV0(alert);
    if (!allowPushEventV0(input.rateLimit)) continue;

    const visual = CATEGORY_VISUAL_MAP_V0[alert.category] || {
      hueDeg: 0,
      geometry: "neutral_point",
      label: "category_drift"
    };

    const event = Object.freeze({
      schema: COGNITIVE_VIZ_BINDING_SCHEMA_V0,
      eventKind: "epistemic:drift-anomaly",
      flow: "push",
      executionClass: "suggest",
      alertId: alert.alertId,
      category: alert.category,
      suggestion: alert.suggestion,
      deltaHint: alert.deltaHint,
      confidence: alert.confidence,
      visual: Object.freeze({
        ...visual,
        intensity01: clamp01(alert.confidence)
      }),
      interpretationOnly: true,
      nonExecutive: true
    });
    uiEvents.push(event);

    if (input.dispatchEvent !== false && typeof globalThis !== "undefined" && globalThis.dispatchEvent) {
      globalThis.dispatchEvent(new CustomEvent(EPISTEMIC_UI_EVENT_V0, { detail: event }));
    }
  }

  const wired =
    alerts.length > 0
      ? wireAlertPacketsToNervousNetworkV0({
          alerts,
          dispatchEvent: input.dispatchEvent
        })
      : null;

  return Object.freeze({
    schema: COGNITIVE_VIZ_BINDING_SCHEMA_V0,
    flow: "push",
    uiEvents: Object.freeze(uiEvents),
    nervousSignals: wired,
    rateLimited: uiEvents.length < alerts.length,
    interpretationOnly: true,
    nonExecutive: true
  });
}

/**
 * PULL — admission authority context (never auto-commits).
 * @param {{
 *   reconcile?: object | null,
 *   commit?: object | null,
 *   admission?: object | null
 * }} input
 */
export function pullAuthorityContextV0(input) {
  return Object.freeze({
    schema: COGNITIVE_VIZ_BINDING_SCHEMA_V0,
    flow: "pull",
    proposedCubeDelta: input.reconcile?.proposedCubeDelta ?? null,
    commitStatus: input.commit?.ok === true ? "committed" : input.commit ? "rejected" : "pending",
    admissionVerdict: input.admission?.verdict ?? null,
    executionClass: "read_only",
    interpretationOnly: true,
    nonExecutive: true,
    cubeStateCommit: false
  });
}

/**
 * @param {{
 *   indexSnapshot?: { categoryCounts?: Record<string, number> },
 *   drift?: { categoryCounts?: Record<string, number>, signals?: object[] }
 * }} input
 */
export function buildDensityFieldV0(input) {
  const counts = input.drift?.categoryCounts || input.indexSnapshot?.categoryCounts || {};
  let total = 0;
  for (const c of Object.values(counts)) total += c;

  /** @type {object[]} */
  const layers = [];
  for (const [category, count] of Object.entries(counts)) {
    const share01 = total > 0 ? count / total : 0;
    const visual = CATEGORY_VISUAL_MAP_V0[category] || {
      hueDeg: 0,
      geometry: "neutral_point",
      label: "unknown"
    };
    layers.push(
      Object.freeze({
        category,
        count,
        share01,
        visual: Object.freeze({
          ...visual,
          intensity01: clamp01(share01)
        })
      })
    );
  }

  return Object.freeze({
    schema: COGNITIVE_VIZ_BINDING_SCHEMA_V0,
    kind: "spatial_density_field",
    layers: Object.freeze(layers),
    interpretationOnly: true,
    nonExecutive: true
  });
}

/**
 * @param {{
 *   epochId?: string,
 *   pendingQueue?: object[],
 *   recHistory?: object[]
 * }} [input]
 */
export function buildRecTimeLayerV0(input) {
  const pending = input?.pendingQueue ?? listPendingCompressionQueueV0();
  const history = input?.recHistory ?? listRecCycleHistoryV0();
  const epochId = String(input?.epochId || history[history.length - 1]?.epochId || "rec_soft");

  const anchor = REC_WAVEFORM_ANCHORS_V0[epochId] || REC_WAVEFORM_ANCHORS_V0.rec_soft;

  return Object.freeze({
    schema: COGNITIVE_VIZ_BINDING_SCHEMA_V0,
    kind: "rec_time_layer",
    epochId,
    waveform: Object.freeze({
      peak: anchor.peak,
      localTimeAnchor: anchor.localTime,
      envelopeThickness01: clamp01(pending.length / 20),
      pendingCompressionCount: pending.length,
      completedCycles: history.length
    }),
    interpretationOnly: true,
    nonExecutive: true
  });
}

/**
 * @param {{
 *   pipeline: object,
 *   rateLimit?: { maxEvents?: number, windowMs?: number },
 *   dispatchEvent?: boolean
 * }} input
 */
export function bindCognitiveVisualizationV0(input) {
  const p = input.pipeline;
  const push = pushPerceptionStreamV0({
    analytics: p.analytics,
    anomalies: p.anomalies,
    rateLimit: input.rateLimit,
    dispatchEvent: input.dispatchEvent
  });
  const pull = pullAuthorityContextV0({
    reconcile: p.reconcile,
    commit: p.commit,
    admission: p.admission
  });
  const densityField = buildDensityFieldV0({
    indexSnapshot: p.index?.indexSnapshot,
    drift: p.index?.drift
  });
  const recTimeLayer = buildRecTimeLayerV0({
    epochId: p.reconcile?.proposedCubeDelta?.epochId
  });

  return Object.freeze({
    schema: COGNITIVE_VIZ_BINDING_SCHEMA_V0,
    push,
    pull,
    densityField,
    recTimeLayer,
    interpretationOnly: true,
    nonExecutive: true
  });
}

/** Test only. */
export function clearCognitiveVizPushRateLimitForTestV0() {
  pushTimestampsV0.length = 0;
}
