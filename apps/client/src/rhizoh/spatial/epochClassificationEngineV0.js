/**
 * SPECFLOW: RESEARCH-ONLY — **Epoch classification engine**
 *
 * Mitigation listesi tek başına yetmez: **epoch üretilmeden önce** gelen olayı sınıflandıran ve
 * `reality_epoch` sıçramasına izin / red / erteleme / birleştirme veren **ön filtre** (karar motoru spec’i).
 *
 * Üst bağlam: `multiLayerRealityConsensusEngineV0.js` (epoch inflation + guardrails).
 *
 * **Politika cebiri:** `epochPolicyAlgebraLayerV0.js` — çoklu verdict bileşimi, sınıflandırıcı çatışması, ROS↔geri besleme.
 */

export const EPOCH_CLASSIFICATION_ENGINE_SCHEMA_V0 = "castle.rhizoh.epoch_classification_engine.v0";

/** Sınıflar — hangi olay türleri sealing / alt-sayaç / red kapsamına girer. */
export const EPOCH_COMMIT_CLASS_TAXONOMY_V0 = Object.freeze([
  {
    id: "sealing_world_geometry",
    title: "Durable world geometry / obstacle authority change",
    mayAdvanceRealityEpoch: true,
    examples: ["signed obstacle merge sealed", "nav mesh bake committed to room scope"]
  },
  {
    id: "sealing_topology_mandate",
    title: "Topology or cross-castle mandate commit",
    mayAdvanceRealityEpoch: true,
    examples: ["region binding published", "lease generation bump sealed", "constitution gate accept"]
  },
  {
    id: "high_rate_substrate",
    title: "High-frequency substrate (must NOT bump epoch alone)",
    mayAdvanceRealityEpoch: false,
    counterTarget: "stream_seq | lamport_micro | sim_subtick",
    examples: ["WAL chunk received", "ROS micro-arbitration log line", "coherence intent tick"]
  },
  {
    id: "noise_or_duplicate",
    title: "Duplicate, out-of-order, or no-op relative to last seal",
    mayAdvanceRealityEpoch: false,
    counterTarget: "drop_or_idempotent_ack",
    examples: ["replay same diff hash", "chunk seq already applied"]
  }
]);

/**
 * Sınıflandırıcı çıktısı — tek karar yüzeyi (total fonksiyon hedefi).
 */
export const EPOCH_CLASSIFIER_VERDICTS_V0 = Object.freeze([
  {
    id: "allow_epoch_bump",
    meaning: "Event is sealing-class and passes budget → sealer may advance reality_epoch.",
    requires: ["commit_class in sealing_*", "rate_budget_ok", "policy_constitution_ok"]
  },
  {
    id: "defer_coalesce",
    meaning: "Valid work but not yet sealing — hold in window for batch seal / same-epoch merge.",
    requires: ["commit_class high_rate_substrate OR batchable sealing fragment"]
  },
  {
    id: "route_subcounter_only",
    meaning: "Record on lamport / stream_seq / intent_seq only; epoch unchanged.",
    requires: ["commit_class high_rate_substrate OR coherence-only"]
  },
  {
    id: "reject",
    meaning: "Unsigned, out-of-scope, constitution fail, or budget exceeded with no coalesce path.",
    requires: ["audit_reason_code"]
  }
]);

/**
 * Karar boru hattı — “üretmeden önce filtre”.
 */
export function describeEpochClassificationPipelineV0() {
  return {
    schema: EPOCH_CLASSIFICATION_ENGINE_SCHEMA_V0,
    stages: [
      {
        order: 1,
        name: "Ingress normalize",
        do: "Attach source (coherence | ros | wal | sim), ids, seq, room_scope, prior_epoch, prior_seal_hash."
      },
      {
        order: 2,
        name: "Commit class assignment",
        do: "Map payload to EPOCH_COMMIT_CLASS_TAXONOMY_V0; default to high_rate_substrate when unknown (deny epoch by default)."
      },
      {
        order: 3,
        name: "Policy + constitution intersect",
        do: "ROS v2 constitution gate + v1 lease scope; fail → reject or defer, never silent epoch."
      },
      {
        order: 4,
        name: "Inflation budget check",
        do: "d(epoch)/dt SLO, seals/sec cap, coalesce window; fail → defer_coalesce unless emergency_fork_token."
      },
      {
        order: 5,
        name: "Verdict emit",
        do: "Emit EPOCH_CLASSIFIER_VERDICTS_V0 exactly one primary verdict + optional secondary (e.g. subcounter route)."
      }
    ],
    invariantNotes: [
      "No component may advance reality_epoch without passing this classifier (enforced at sealer boundary).",
      "Classifier is deterministic given same inputs + same policy_pack_revision.",
      "Unknown event class defaults to route_subcounter_only or reject — never allow_epoch_bump."
    ],
    bridgesMitigationIds: [
      "semantic_commit_classes",
      "coalescing_seal_windows",
      "ros_decision_hysteresis",
      "dual_counter_pattern",
      "observability_epoch_budget"
    ]
  };
}

/**
 * @returns {{ nodes: string[], edges: { from: string; to: string; kind: string }[] }}
 */
export function getEpochClassificationDependencyGraphV0() {
  return {
    nodes: [
      "raw_epoch_candidates",
      "epoch_classifier",
      "commit_class_taxonomy",
      "inflation_budget_meter",
      "constitution_gate_ros_v2",
      "reality_epoch_sealer",
      "subcounter_registry",
      "audit_sink"
    ],
    edges: [
      { from: "raw_epoch_candidates", to: "epoch_classifier", kind: "ingress" },
      { from: "commit_class_taxonomy", to: "epoch_classifier", kind: "rules" },
      { from: "constitution_gate_ros_v2", to: "epoch_classifier", kind: "policy_veto" },
      { from: "inflation_budget_meter", to: "epoch_classifier", kind: "rate_veto_or_defer" },
      { from: "epoch_classifier", to: "reality_epoch_sealer", kind: "allow_only" },
      { from: "epoch_classifier", to: "subcounter_registry", kind: "route_subcounter_only" },
      { from: "epoch_classifier", to: "audit_sink", kind: "verdict_log" }
    ]
  };
}

/**
 * @returns {Record<string, unknown>}
 */
export function buildEpochClassificationEngineSnapshotV0() {
  return {
    schema: EPOCH_CLASSIFICATION_ENGINE_SCHEMA_V0,
    ts: Date.now(),
    taxonomy: EPOCH_COMMIT_CLASS_TAXONOMY_V0,
    verdicts: EPOCH_CLASSIFIER_VERDICTS_V0,
    pipeline: describeEpochClassificationPipelineV0(),
    dependencyGraph: getEpochClassificationDependencyGraphV0()
  };
}
