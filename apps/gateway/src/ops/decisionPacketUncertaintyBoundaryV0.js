/**
 * Decision Packet Uncertainty Boundary (DPUB) v0 — DLGL packet must not collapse uncertainty into certainty.
 * Failure mode: decision packet overconfidence (compression trust inflation, hidden contradictions, SLA urgency).
 * @see docs/ops/DECISION_PACKET_UNCERTAINTY_V1.0.md
 */

import { COHERENCE_VERDICT_V0 } from "./epistemicCoherenceLayerV0.js";

export const DECISION_PACKET_UNCERTAINTY_SCHEMA_V0 = "rhizoh.decision_packet_uncertainty.v0";

export const PACKET_OVERCONFIDENCE_CLASS_V0 = Object.freeze({
  COMPRESSION_TRUST_INFLATION: "compression_trust_inflation",
  HIDDEN_CONTRADICTION_LOSS: "hidden_contradiction_loss",
  SLA_FALSE_URGENCY: "sla_driven_false_urgency"
});

export const CERTAINTY_CAP_V0 = Object.freeze({
  BOUNDED_HYPOTHESIS: "bounded_hypothesis",
  RESOLVED: "resolved"
});

/** Central invariant — must never be violated on export. */
export const DLGL_UNCERTAINTY_INVARIANT_V0 =
  "dlgl_packet_never_collapses_uncertainty_into_certainty";

/**
 * @param {object} narrativeExport
 */
export function buildContradictionDigestV0(narrativeExport) {
  const ecl = narrativeExport?.epistemicCoherence;
  const conflicts = ecl?.crossLayerContradictions?.conflicts ?? [];
  const acrlMismatch = narrativeExport?.actionContextResolution?.intentContextMismatch;

  return Object.freeze({
    schema: "rhizoh.contradiction_digest.v0",
    crossLayerCount: ecl?.crossLayerContradictions?.count ?? 0,
    criticalCount: ecl?.crossLayerContradictions?.criticalCount ?? 0,
    conflicts: Object.freeze(
      conflicts.slice(0, 8).map((c) =>
        Object.freeze({
          class: c.class,
          actionId: c.actionId,
          severity: c.severity,
          note: c.note
        })
      )
    ),
    intentMismatchCount: acrlMismatch?.mismatches?.length ?? 0,
    domainCollision: narrativeExport?.actionContextResolution?.domainCollision?.detected === true,
    alwaysVisibleOnFastPath: true
  });
}

/**
 * @param {object} narrativeExport
 */
export function buildOpenUncertaintyEnvelopeV0(narrativeExport) {
  const ecl = narrativeExport?.epistemicCoherence;
  const fp = narrativeExport?.actionContextResolution?.contextFingerprint;
  const trustFork = narrativeExport?.culturalRisk?.trustDynamics?.fork;

  /** @type {string[]} */
  const openQuestions = [];
  /** @type {string[]} */
  const knownUnknowns = [];

  if (ecl?.systemCoherence?.verdict === COHERENCE_VERDICT_V0.FRAGMENTED) {
    openQuestions.push("layer_alignment_partial_not_resolved");
  }
  if (ecl?.systemCoherence?.verdict === COHERENCE_VERDICT_V0.CONTRADICTORY) {
    openQuestions.push("cross_layer_contradiction_requires_human_resolution");
  }
  if ((ecl?.crossLayerContradictions?.count ?? 0) > 0) {
    knownUnknowns.push(`${ecl.crossLayerContradictions.count}_active_cross_layer_conflicts`);
  }
  if (fp?.coordinationSimActive) {
    knownUnknowns.push("coordination_sim_active_reality_blend_risk");
  }
  if (trustFork === "mythology") {
    knownUnknowns.push("trust_mythology_fork_elevated");
  }
  if (narrativeExport?.appliedSystemsLayer?.roboticsGrounding?.blockActuation) {
    knownUnknowns.push("robotics_actuation_path_not_cleared");
  }
  if (ecl?.contextFragmentationRisk?.active) {
    knownUnknowns.push("deploy_agent_multi_axis_permission_spread");
  }

  knownUnknowns.push("raw_measurements_not_fully_replayed_in_packet");
  openQuestions.push("human_signoff_outcome_not_predetermined");

  return Object.freeze({
    schema: "rhizoh.open_uncertainty_envelope.v0",
    openQuestions: Object.freeze(openQuestions),
    knownUnknowns: Object.freeze(knownUnknowns),
    itemCount: openQuestions.length + knownUnknowns.length
  });
}

/**
 * @param {number} ackMinutes
 */
export function qualifySlaAckPressureV0(ackMinutes) {
  return Object.freeze({
    ackMinutes,
    role: "human_ack_target_only",
    isAckTarget: true,
    isDecisionDeadline: false,
    isGoSignal: false,
    isCertaintyImplying: false,
    disclaimer: Object.freeze({
      tr: `${ackMinutes} dk yanıt hedefi — karar doğruluğu veya icra onayı değildir.`,
      en: `${ackMinutes}m ack target — not decision correctness or execution approval.`
    })
  });
}

/**
 * @param {object} humanPacket
 * @param {object} narrativeExport
 */
export function detectPacketOverconfidenceRiskV0(humanPacket, narrativeExport) {
  const ecl = narrativeExport?.epistemicCoherence;
  const fast = humanPacket?.fastPathEligible === true;
  const contradictionCount = ecl?.crossLayerContradictions?.count ?? 0;
  const hasHeadline = Boolean(humanPacket?.bundle?.headline);

  /** @type {object[]} */
  const risks = [];

  if (hasHeadline && fast && contradictionCount > 0) {
    risks.push(
      Object.freeze({
        class: PACKET_OVERCONFIDENCE_CLASS_V0.HIDDEN_CONTRADICTION_LOSS,
        severity: "high",
        note: "fast_path_plus_headline_without_prominent_contradiction_digest"
      })
    );
  }

  if (hasHeadline && (ecl?.systemCoherence?.verdict !== COHERENCE_VERDICT_V0.CONTRADICTORY)) {
    risks.push(
      Object.freeze({
        class: PACKET_OVERCONFIDENCE_CLASS_V0.COMPRESSION_TRUST_INFLATION,
        severity: "medium",
        note: "clean_packet_surface_may_read_as_resolved_truth"
      })
    );
  }

  if (humanPacket?.ackSlaMinutes != null && humanPacket.ackSlaMinutes <= 60) {
    risks.push(
      Object.freeze({
        class: PACKET_OVERCONFIDENCE_CLASS_V0.SLA_FALSE_URGENCY,
        severity: "low",
        note: "sla_minutes_may_pressure_premature_decision",
        mitigation: "sla_qualification_not_deadline"
      })
    );
  }

  return Object.freeze({
    detected: risks.length > 0,
    risks: Object.freeze(risks)
  });
}

/**
 * Enrich DLGL packet — preserves uncertainty; never sets certainty to resolved.
 * @param {object} humanPacket
 * @param {object} narrativeExport
 */
export function amendHumanDecisionPacketWithUncertaintyV0(humanPacket, narrativeExport) {
  const envelope = buildOpenUncertaintyEnvelopeV0(narrativeExport);
  const digest = buildContradictionDigestV0(narrativeExport);
  const slaQual = qualifySlaAckPressureV0(humanPacket?.ackSlaMinutes ?? 30);
  const overconfidence = detectPacketOverconfidenceRiskV0(humanPacket, narrativeExport);

  return Object.freeze({
    ...humanPacket,
    certaintyCap: CERTAINTY_CAP_V0.BOUNDED_HYPOTHESIS,
    packetIsNotRealityClaim: true,
    packetIsNotResolvedDecision: true,
    uncertaintyEnvelope: envelope,
    contradictionDigest: digest,
    slaQualification: slaQual,
    overconfidenceRisk: overconfidence,
    mandatoryBanner: Object.freeze({
      tr: "Paket özetidir — belirsizlik kapanmadı; RAW ve çelişki özeti okunur.",
      en: "Packet is summary — uncertainty not closed; read RAW and contradiction digest."
    }),
    layersNeverHidden: Object.freeze([
      "raw",
      "cross_layer_contradictions",
      "cab_negations",
      "acrl_blocked_cells"
    ])
  });
}

/**
 * @param {object} narrativeExport
 */
export function validateDlglUncertaintyInvariantV0(narrativeExport) {
  const packet = narrativeExport?.decisionLatencyGovernance?.humanDecisionPacket;
  const violations = [];

  if (!packet) {
    violations.push("missing_human_decision_packet");
    return Object.freeze({ valid: false, violations: Object.freeze(violations) });
  }

  if (packet.certaintyCap === CERTAINTY_CAP_V0.RESOLVED) {
    violations.push("certainty_cap_must_not_be_resolved");
  }
  if (packet.packetIsNotRealityClaim !== true) {
    violations.push("packet_must_not_be_reality_claim");
  }
  if ((packet.uncertaintyEnvelope?.itemCount ?? 0) < 2) {
    violations.push("uncertainty_envelope_too_sparse");
  }
  if (packet.fastPathEligible && (packet.contradictionDigest?.crossLayerCount ?? 0) > 0) {
    if ((packet.contradictionDigest?.conflicts?.length ?? 0) === 0) {
      violations.push("fast_path_must_carry_contradiction_digest");
    }
  }
  if (packet.slaQualification?.isDecisionDeadline === true) {
    violations.push("sla_must_not_be_decision_deadline");
  }

  return Object.freeze({
    invariant: DLGL_UNCERTAINTY_INVARIANT_V0,
    valid: violations.length === 0,
    violations: Object.freeze(violations)
  });
}

/**
 * @param {object} narrativeExport
 */
export function buildDecisionPacketUncertaintyBoundaryV0(narrativeExport) {
  const basePacket = narrativeExport?.decisionLatencyGovernance?.humanDecisionPacket;
  const enrichedPacket = basePacket
    ? amendHumanDecisionPacketWithUncertaintyV0(basePacket, narrativeExport)
    : null;
  const invariant = validateDlglUncertaintyInvariantV0({
    ...narrativeExport,
    decisionLatencyGovernance: {
      ...narrativeExport?.decisionLatencyGovernance,
      humanDecisionPacket: enrichedPacket
    }
  });

  return Object.freeze({
    schema: DECISION_PACKET_UNCERTAINTY_SCHEMA_V0,
    generatedAt: new Date().toISOString(),
    role: "prevents_decision_packet_overconfidence",
    centralInvariant: DLGL_UNCERTAINTY_INVARIANT_V0,
    invariantCheck: invariant,
    enrichedHumanDecisionPacket: enrichedPacket,
    failureModes: Object.freeze({
      compressionTrustInflation: PACKET_OVERCONFIDENCE_CLASS_V0.COMPRESSION_TRUST_INFLATION,
      hiddenContradictionLoss: PACKET_OVERCONFIDENCE_CLASS_V0.HIDDEN_CONTRADICTION_LOSS,
      slaFalseUrgency: PACKET_OVERCONFIDENCE_CLASS_V0.SLA_FALSE_URGENCY
    }),
    invariants: Object.freeze([
      DLGL_UNCERTAINTY_INVARIANT_V0,
      "contradiction_digest_always_attached_when_conflicts_exist",
      "sla_is_ack_target_not_go_signal",
      "fast_path_never_hides_lower_layer_warnings"
    ]),
    nonExecutable: true,
    nonBinding: true
  });
}
