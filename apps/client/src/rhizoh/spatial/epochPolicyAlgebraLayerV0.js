/**
 * SPECFLOW: RESEARCH-ONLY — **Epoch policy algebra layer**
 *
 * Sınıflandırıcı tek başına yetmez: **birden fazla kaynak / birden fazla sınıflandırıcı** ve **bileşik verdict**
 * için cebirsel kurallar, çatışma çözümü ve ROS ↔ classifier **çift yönlü geri besleme** sözleşmesi.
 *
 * Alt katman: `epochClassificationEngineV0.js`. ROS: `realityOperatingSystemGovernanceNetworkV1.js`.
 */

export const EPOCH_POLICY_ALGEBRA_LAYER_SCHEMA_V0 = "castle.rhizoh.epoch_policy_algebra_layer.v0";

/**
 * Verdict bileşimi — iki veya daha fazla ara verdict’ten tek **composed** verdict.
 * Lattice sırası (güçlü → zayıf): reject > defer_coalesce > route_subcounter_only > allow_epoch_bump (meet = en güçlü).
 */
export const VERDICT_COMPOSITION_RULES_V0 = Object.freeze([
  {
    id: "meet_strictest_wins",
    title: "Meet (∧): strictest verdict wins",
    rule: "compose(V1..Vn) = min_lattice(V*) under order reject > defer_coalesce > route_subcounter_only > allow_epoch_bump",
    rationale: "Safety: any reject or defer blocks naive allow.",
    example: "allow ∧ defer → defer; allow ∧ reject → reject"
  },
  {
    id: "join_only_when_all_allow",
    title: "Join (∨): epoch bump only if all sealing-class allows agree",
    rule: "join_for_epoch_bump = all Vi === allow_epoch_bump with same commit_class fingerprint",
    rationale: "Prevents half-open sealing from two partial observers."
  },
  {
    id: "defer_absorbs_allow",
    title: "Defer coalesces with allow into defer until window closes",
    rule: "allow ∧ defer → defer (single seal batch); window policy from inflation mitigations"
  },
  {
    id: "subcounter_routes_union",
    title: "Subcounter routes union then dedupe",
    rule: "route_subcounter_only composed = merge counter targets without epoch side-effect"
  }
]);

/**
 * Birden fazla sınıflandırıcı (ör. oda başına, kale başına, trunk vs fork) çatışınca.
 */
export const INTER_CLASSIFIER_CONFLICT_RESOLUTION_V0 = Object.freeze([
  {
    id: "precedence_stack",
    title: "Ordered classifier precedence",
    rule: "Lower index wins when verdicts differ after meet; stack defined per policy_pack_revision.",
    example: ["constitution_gate_classifier", "ros_arbitration_classifier", "wal_room_classifier"]
  },
  {
    id: "clock_dominance",
    title: "Higher arbitration clock dominates same tier",
    rule: "If same classifier tier ties, compare (ros_total_order, policy_revision); never wall-clock alone."
  },
  {
    id: "fork_escalation",
    title: "Irreducible conflict → fork token",
    rule: "If meet = reject from one trunk and allow from peer without merge base → emit fork_escalation_token; no epoch bump."
  }
]);

/**
 * Çok kaynaklı olaylar — soyut “arbitraj cebiri” (uygulama değil sözleşme).
 */
export const MULTI_SOURCE_ARBITRATION_MATH_V0 = Object.freeze({
  model: "partial_order_lift",
  inputs: {
    sources: "set S of {coherence, ros, wal, sim_observer}",
    perSource: "mapping S → provisional (verdict, commit_class, confidence_01, signature_ok)"
  },
  lift: "Each source defines a relation ≼_s on verdict lattice; global ≼ = ∩_s ≼_s when compatible else conflict.",
  reduce: "compose via meet_strictest_wins; if conflict irreducible → fork_escalation or precedence_stack.",
  invariants: [
    "Signature_ok false → that source’s allow treated as reject for meet.",
    "Confidence is advisory unless policy binds quorum thresholds to it."
  ]
});

/**
 * ROS ↔ classifier çift yön: karar döngüsü (kapalı devre hedefi).
 */
export const ROS_CLASSIFIER_BIDIRECTIONAL_FEEDBACK_V0 = Object.freeze({
  classifierToRos: {
    title: "Classifier constrains ROS proposal space",
    channels: [
      "verdict_budget_signal (remaining seals / epoch budget)",
      "commit_class_histogram (inflation early warning)",
      "reject_audit_stream (policy tuning input)"
    ],
    effect: "ROS scheduler may batch arbitration publishes; hysteresis thresholds adapt."
  },
  rosToClassifier: {
    title: "ROS outcomes retune classifier context",
    channels: [
      "lease_generation (who may propose sealing-class)",
      "arbitration_total_order_stamp (tie-break input)",
      "emergency_readonly_world (force all verdicts to route_subcounter_only or reject)"
    ],
    effect: "Classifier pipeline stage 3–4 uses fresh ROS context; no stale lease after revocation."
  },
  syncContract: {
    id: "single_writer_per_epoch_slice",
    rule: "At most one authoritative writer updates (classifier_state, ros_arbitration_context) per composed epoch slice commit.",
    note: "Avoids ping-pong oscillation between ROS and classifier in same tick."
  }
});

/**
 * @returns {Record<string, unknown>}
 */
export function describeEpochPolicyAlgebraLayerV0() {
  return {
    compositionLaws: VERDICT_COMPOSITION_RULES_V0,
    interClassifier: INTER_CLASSIFIER_CONFLICT_RESOLUTION_V0,
    multiSourceMath: MULTI_SOURCE_ARBITRATION_MATH_V0,
    feedback: ROS_CLASSIFIER_BIDIRECTIONAL_FEEDBACK_V0,
    summary:
      "Policy algebra sits above raw classification: compose multi-source verdicts, resolve classifier conflicts, and close the loop with ROS without epoch inflation."
  };
}

/**
 * @returns {{ nodes: string[], edges: { from: string; to: string; kind: string }[] }}
 */
export function getEpochPolicyAlgebraDependencyGraphV0() {
  return {
    nodes: [
      "source_coherence",
      "source_ros",
      "source_wal",
      "classifier_shard_a",
      "classifier_shard_b",
      "verdict_composer_meet_join",
      "epoch_policy_algebra",
      "ros_governance_network",
      "reality_epoch_sealer"
    ],
    edges: [
      { from: "source_coherence", to: "classifier_shard_a", kind: "intent_events" },
      { from: "source_wal", to: "classifier_shard_b", kind: "stream_events" },
      { from: "source_ros", to: "classifier_shard_a", kind: "arbitration_hints" },
      { from: "classifier_shard_a", to: "verdict_composer_meet_join", kind: "provisional_v1" },
      { from: "classifier_shard_b", to: "verdict_composer_meet_join", kind: "provisional_v2" },
      { from: "verdict_composer_meet_join", to: "epoch_policy_algebra", kind: "composed_verdict" },
      { from: "epoch_policy_algebra", to: "reality_epoch_sealer", kind: "allow_gate" },
      { from: "epoch_policy_algebra", to: "ros_governance_network", kind: "budget_feedback" },
      { from: "ros_governance_network", to: "epoch_policy_algebra", kind: "lease_context_refresh" }
    ]
  };
}

/**
 * @returns {Record<string, unknown>}
 */
export function buildEpochPolicyAlgebraLayerSnapshotV0() {
  return {
    schema: EPOCH_POLICY_ALGEBRA_LAYER_SCHEMA_V0,
    ts: Date.now(),
    ...describeEpochPolicyAlgebraLayerV0(),
    dependencyGraph: getEpochPolicyAlgebraDependencyGraphV0()
  };
}