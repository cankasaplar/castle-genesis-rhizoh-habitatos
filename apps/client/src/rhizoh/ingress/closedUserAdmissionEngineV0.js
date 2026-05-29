/**
 * Closed User Admission Engine v0.1 — role-based epistemic stress cohort planning.
 *
 * NOT a named-invite list. Maps opaque subjects → stress profile → role gate verdict.
 * interpretationOnly · nonExecutive · no execution authority
 * @see docs/RHIZOH_CLOSED_USER_ADMISSION_V0.1.md
 */

export const CLOSED_USER_ADMISSION_SCHEMA_V0 = "castle.rhizoh.closed_user_admission.v0";

export const EPISTEMIC_STRESS_CLASS_V0 = Object.freeze({
  INVARIANT_KEEPER: "invariant_keeper",
  SYSTEMS_ENGINEER: "systems_engineer",
  EDGE_BUILDER: "edge_builder",
  HUMAN_EXPLORER: "human_explorer"
});

export const ROLE_GATE_ID_V0 = Object.freeze({
  INVARIANT_KEEPER: "invariant_keeper_gate",
  SYSTEMS_ENGINEER: "systems_engineer_gate",
  EDGE_BUILDER: "edge_builder_gate",
  HUMAN_EXPLORER: "human_explorer_gate"
});

export const ADMISSION_VERDICT_V0 = Object.freeze({
  ADMIT: "admit",
  HOLD: "hold",
  REJECT: "reject"
});

const STRESS_CLASS_ORDER_V0 = Object.freeze([
  EPISTEMIC_STRESS_CLASS_V0.INVARIANT_KEEPER,
  EPISTEMIC_STRESS_CLASS_V0.SYSTEMS_ENGINEER,
  EPISTEMIC_STRESS_CLASS_V0.EDGE_BUILDER,
  EPISTEMIC_STRESS_CLASS_V0.HUMAN_EXPLORER
]);

/** @type {Record<string, { min: Record<string, number>, max?: Record<string, number> }>} */
const ROLE_GATE_THRESHOLDS_V0 = Object.freeze({
  [ROLE_GATE_ID_V0.INVARIANT_KEEPER]: Object.freeze({
    min: Object.freeze({
      invariant_resistance_score: 0.55,
      reproducibility_interaction_score: 0.35
    }),
    max: Object.freeze({
      causal_disruption_index: 0.45,
      boundary_break_probability: 0.55
    })
  }),
  [ROLE_GATE_ID_V0.SYSTEMS_ENGINEER]: Object.freeze({
    min: Object.freeze({
      reproducibility_interaction_score: 0.5,
      invariant_resistance_score: 0.35
    }),
    max: Object.freeze({
      causal_disruption_index: 0.5
    })
  }),
  [ROLE_GATE_ID_V0.EDGE_BUILDER]: Object.freeze({
    min: Object.freeze({
      boundary_break_probability: 0.45,
      reproducibility_interaction_score: 0.3
    }),
    max: Object.freeze({
      causal_disruption_index: 0.65
    })
  }),
  [ROLE_GATE_ID_V0.HUMAN_EXPLORER]: Object.freeze({
    min: Object.freeze({
      causal_disruption_index: 0.25
    }),
    max: Object.freeze({
      boundary_break_probability: 0.7,
      invariant_resistance_score: 0.85
    })
  })
});

const GATE_TO_CLASS_V0 = Object.freeze({
  [ROLE_GATE_ID_V0.INVARIANT_KEEPER]: EPISTEMIC_STRESS_CLASS_V0.INVARIANT_KEEPER,
  [ROLE_GATE_ID_V0.SYSTEMS_ENGINEER]: EPISTEMIC_STRESS_CLASS_V0.SYSTEMS_ENGINEER,
  [ROLE_GATE_ID_V0.EDGE_BUILDER]: EPISTEMIC_STRESS_CLASS_V0.EDGE_BUILDER,
  [ROLE_GATE_ID_V0.HUMAN_EXPLORER]: EPISTEMIC_STRESS_CLASS_V0.HUMAN_EXPLORER
});

const CLASS_TO_GATE_V0 = Object.freeze({
  [EPISTEMIC_STRESS_CLASS_V0.INVARIANT_KEEPER]: ROLE_GATE_ID_V0.INVARIANT_KEEPER,
  [EPISTEMIC_STRESS_CLASS_V0.SYSTEMS_ENGINEER]: ROLE_GATE_ID_V0.SYSTEMS_ENGINEER,
  [EPISTEMIC_STRESS_CLASS_V0.EDGE_BUILDER]: ROLE_GATE_ID_V0.EDGE_BUILDER,
  [EPISTEMIC_STRESS_CLASS_V0.HUMAN_EXPLORER]: ROLE_GATE_ID_V0.HUMAN_EXPLORER
});

/** @type {Map<string, object>} */
const admittedSubjectsV0 = new Map();

function clamp01(n) {
  const x = Number(n);
  if (!Number.isFinite(x)) return 0;
  return Math.max(0, Math.min(1, x));
}

/**
 * Deterministic profile from behavioral / harness signals (no name lookup).
 * @param {Record<string, unknown>} [signals]
 */
export function computeEpistemicStressProfileV0(signals = {}) {
  const formal = clamp01(signals.formalCorrectnessStress ?? signals.invariantStress);
  const infra = clamp01(signals.infraReplayStress ?? signals.executionStress);
  const edge = clamp01(signals.physicalCouplingStress ?? signals.edgeStress);
  const human = clamp01(signals.interpretationStress ?? signals.narrativeStress);

  const profile = Object.freeze({
    invariant_resistance_score: clamp01(0.55 * formal + 0.25 * infra + 0.1 * (1 - human)),
    boundary_break_probability: clamp01(0.5 * edge + 0.2 * human + 0.15 * infra),
    reproducibility_interaction_score: clamp01(0.45 * infra + 0.35 * formal + 0.1 * edge),
    causal_disruption_index: clamp01(0.4 * human + 0.25 * edge + 0.15 * (1 - formal))
  });

  return Object.freeze({
    schema: CLOSED_USER_ADMISSION_SCHEMA_V0,
    interpretationOnly: true,
    nonExecutive: true,
    profile
  });
}

/**
 * Primary stress class = argmax of axis-aligned composite scores.
 * @param {{ profile: Record<string, number> }} packed
 */
export function assignStressClassV0(packed) {
  const p = packed?.profile || packed;
  const scores = Object.freeze({
    [EPISTEMIC_STRESS_CLASS_V0.INVARIANT_KEEPER]: p.invariant_resistance_score * 0.7 + p.reproducibility_interaction_score * 0.3,
    [EPISTEMIC_STRESS_CLASS_V0.SYSTEMS_ENGINEER]: p.reproducibility_interaction_score * 0.65 + p.invariant_resistance_score * 0.35,
    [EPISTEMIC_STRESS_CLASS_V0.EDGE_BUILDER]: p.boundary_break_probability * 0.7 + p.reproducibility_interaction_score * 0.2,
    [EPISTEMIC_STRESS_CLASS_V0.HUMAN_EXPLORER]: p.causal_disruption_index * 0.65 + p.boundary_break_probability * 0.2
  });

  let best = EPISTEMIC_STRESS_CLASS_V0.INVARIANT_KEEPER;
  let bestScore = -1;
  for (const cls of STRESS_CLASS_ORDER_V0) {
    const s = scores[cls];
    if (s > bestScore) {
      bestScore = s;
      best = cls;
    }
  }

  return Object.freeze({
    primaryStressClass: best,
    gateId: CLASS_TO_GATE_V0[best],
    classScores: scores
  });
}

/**
 * @param {string} gateId
 * @param {{ profile: Record<string, number> }} packed
 */
export function evaluateRoleGateV0(gateId, packed) {
  const p = packed?.profile || packed;
  const rule = ROLE_GATE_THRESHOLDS_V0[gateId];
  const reasons = [];

  if (!rule) {
    return Object.freeze({ gateId, pass: false, reasons: ["unknown_gate"] });
  }

  for (const [k, min] of Object.entries(rule.min || {})) {
    if ((p[k] ?? 0) < min) reasons.push(`below_min:${k}`);
  }
  for (const [k, max] of Object.entries(rule.max || {})) {
    if ((p[k] ?? 0) > max) reasons.push(`above_max:${k}`);
  }

  return Object.freeze({
    gateId,
    stressClass: GATE_TO_CLASS_V0[gateId],
    pass: reasons.length === 0,
    reasons: Object.freeze(reasons)
  });
}

/**
 * Risk veto flags — legal / reputational / academic misrepresentation guards.
 * @param {Record<string, boolean>} [riskFlags]
 */
export function evaluateRiskGatesV0(riskFlags = {}) {
  const blocks = [];
  if (riskFlags.namedCelebrityDependency) blocks.push("named_celebrity_dependency");
  if (riskFlags.personalDataWithoutBasis) blocks.push("personal_data_without_basis");
  if (riskFlags.reputationalEndorsementClaim) blocks.push("reputational_endorsement_claim");
  if (riskFlags.executionAuthorityRequested) blocks.push("execution_authority_requested");
  if (riskFlags.bypassLegalPreamble) blocks.push("bypass_legal_preamble");

  return Object.freeze({
    pass: blocks.length === 0,
    blocks: Object.freeze(blocks)
  });
}

/**
 * Opaque invite payload — cohort + target stress class, no PII.
 * @param {{ cohortId: string, stressClassTarget?: string, seed?: number }} opts
 */
export function generateInvitePayloadV0(opts) {
  const cohortId = String(opts.cohortId || "cohort_default");
  const target = opts.stressClassTarget || EPISTEMIC_STRESS_CLASS_V0.SYSTEMS_ENGINEER;
  const seed = Number(opts.seed) || 0;
  const token = `rhizoh_inv_${cohortId}_${target}_${seed}`.replace(/[^a-z0-9_]/gi, "_").slice(0, 96);

  return Object.freeze({
    schema: CLOSED_USER_ADMISSION_SCHEMA_V0,
    inviteToken: token,
    cohortId,
    stressClassTarget: target,
    interpretationOnly: true,
    nonExecutive: true
  });
}

/**
 * @param {{
 *   subjectRef: string,
 *   signals?: Record<string, unknown>,
 *   riskFlags?: Record<string, boolean>,
 *   invite?: { inviteToken?: string, stressClassTarget?: string },
 *   requestedGateId?: string
 * }} input
 */
export function evaluateClosedAdmissionV0(input) {
  const subjectRef = String(input?.subjectRef || "anonymous");
  const packed = computeEpistemicStressProfileV0(input?.signals || {});
  const assignment = assignStressClassV0(packed);
  const gateId = input?.requestedGateId || assignment.gateId;
  const gate = evaluateRoleGateV0(gateId, packed);
  const risk = evaluateRiskGatesV0(input?.riskFlags || {});

  let verdict = ADMISSION_VERDICT_V0.ADMIT;
  if (!risk.pass) verdict = ADMISSION_VERDICT_V0.REJECT;
  else if (!gate.pass) verdict = ADMISSION_VERDICT_V0.HOLD;

  const invite = input?.invite;
  if (invite?.stressClassTarget && invite.stressClassTarget !== assignment.primaryStressClass) {
    if (verdict === ADMISSION_VERDICT_V0.ADMIT) verdict = ADMISSION_VERDICT_V0.HOLD;
  }

  const report = Object.freeze({
    schema: CLOSED_USER_ADMISSION_SCHEMA_V0,
    interpretationOnly: true,
    nonExecutive: true,
    subjectRef,
    verdict,
    primaryStressClass: assignment.primaryStressClass,
    gateId,
    gate,
    risk,
    profile: packed.profile,
    classScores: assignment.classScores
  });

  if (verdict === ADMISSION_VERDICT_V0.ADMIT) {
    admittedSubjectsV0.set(subjectRef, report);
  }

  return report;
}

export function isSubjectAdmittedV0(subjectRef) {
  return admittedSubjectsV0.has(String(subjectRef));
}

export function getAdmittedSubjectReportV0(subjectRef) {
  return admittedSubjectsV0.get(String(subjectRef)) ?? null;
}

/**
 * Seeded cohort simulation for go-live capacity planning (not a mailing list).
 * @param {{ nodeCount?: number, seed?: number }} [opts]
 */
export function simulateGoLiveCohortV0(opts = {}) {
  const n = Math.max(1, Math.min(5000, Math.round(Number(opts.nodeCount) || 50)));
  const seed = Number(opts.seed) || 42;

  /** @param {number} i */
  function pseudo(i) {
    const x = Math.sin(seed * 999 + i * 7919) * 10000;
    return x - Math.floor(x);
  }

  const histogram = Object.fromEntries(STRESS_CLASS_ORDER_V0.map((c) => [c, 0]));
  let admit = 0;
  let hold = 0;
  let reject = 0;

  for (let i = 0; i < n; i++) {
    const signals = {
      formalCorrectnessStress: pseudo(i),
      infraReplayStress: pseudo(i + 1),
      physicalCouplingStress: pseudo(i + 2),
      interpretationStress: pseudo(i + 3)
    };
    const r = evaluateClosedAdmissionV0({
      subjectRef: `sim_node_${i}`,
      signals,
      riskFlags: { reputationalEndorsementClaim: pseudo(i + 4) > 0.97 }
    });
    histogram[r.primaryStressClass] = (histogram[r.primaryStressClass] || 0) + 1;
    if (r.verdict === ADMISSION_VERDICT_V0.ADMIT) admit++;
    else if (r.verdict === ADMISSION_VERDICT_V0.HOLD) hold++;
    else reject++;
  }

  return Object.freeze({
    schema: CLOSED_USER_ADMISSION_SCHEMA_V0,
    interpretationOnly: true,
    nodeCount: n,
    seed,
    histogram: Object.freeze({ ...histogram }),
    verdictCounts: Object.freeze({ admit, hold, reject }),
    admitRate: admit / n
  });
}

export function clearClosedAdmissionForTestV0() {
  admittedSubjectsV0.clear();
}

export function listStressClassesV0() {
  return STRESS_CLASS_ORDER_V0;
}

export function getRoleGateThresholdsV0() {
  return ROLE_GATE_THRESHOLDS_V0;
}
