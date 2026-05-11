/**
 * MK-1 Determinism Stress Harness v0.1 — Poisoned Trace Suite
 * @see docs/MK1_KERNEL_VALIDATOR_V0_1.md §10
 *
 * Goal: test rejection determinism, not error elimination.
 * System does not eliminate errors — it enforces deterministic rejection semantics.
 * **Falsification / contract adversarial suite** — not smoke-only (πEFC epoch, matrix, dual-read, historical π).
 *
 *   node scripts/mk1StressHarness.mjs [fixture.mjs]
 *   npm run epistemic:mk1-stress
 */

import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { mk1Validate, MK1_ERR, DECISION_CLASS, H_canon } from "./mk1Validate.mjs";
import { evaluateBindIndexed } from "./evaluateBindIndexed.mjs";
import {
  sealAuthorityBundle,
  sealCanonicalAuthorityBundle,
  authorityBundleContentForHash,
  PAG_ERR,
  RBL_A_ERR,
  LIFECYCLE_STATE
} from "./authorityBundle.mjs";
import {
  sealWitnessArtifact,
  verifyArtifactSeal,
  appendWitnessArtifact,
  SOURCE_CLASS,
  RBL_ERR
} from "./witnessArtifact.mjs";
import {
  bindTraceFromArtifacts,
  extractArtifactRootsFromTrace,
  canonicalRootsFromArtifacts,
  RTB_ERR
} from "./rblBindTau.mjs";
import { PI_HASH_TRACE } from "./fixtures/mk1-stress-base.mjs";
import {
  buildTriLayerObservableSnapshot,
  snapshotContentDigest
} from "./ecerTriLayerObservableArtifact.mjs";
import {
  appendTransitionLedger,
  defaultAdmissibilityPolicy,
  epistemicDiff,
  TRANSITION_CLASSIFICATION,
  TRANSITION_SPACE,
  TTA_ERR,
  verifyEpistemicTransition
} from "./ecerEpistemicTransitionKernel.mjs";
import {
  composeMetaDelta,
  verifyEcptPathClosed,
  CONFLICT_SIGNATURE,
  HOGA_ERR
} from "./hogaComposition.mjs";

function stressAuthorityBundle() {
  return sealAuthorityBundle({
    piHash: PI_HASH_TRACE,
    epochId: "E0",
    councilWitness: {},
    dissentWitnesses: [],
    compatMatrixRef: "M:stress",
    dualReadWindow: {},
    sunsetRule: {}
  });
}

const STRESS_GCS_HASH =
  "bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb";

/** PAG_BUNDLE_0_2 + RBL-A1 closure (aligned manifest: `resolutionPolicyRef`, optional `governanceConstraintSetId`). */
function stressCanonicalAuthorityBundle(resolutionPolicyRef = "R1:stress:v0") {
  return sealCanonicalAuthorityBundle({
    piHash: PI_HASH_TRACE,
    epochId: "E0",
    governanceConstraintSetId: "GCS:stress",
    governanceConstraintHash: STRESS_GCS_HASH,
    resolutionPolicyRef,
    resolutionPolicyEpoch: "E0",
    lifecycleState: LIFECYCLE_STATE.ACTIVE,
    authorityWitness: { quorumRef: "stress" }
  });
}

function tloaStressBase() {
  return buildTriLayerObservableSnapshot({
    snapshotId: "tta-S0",
    ebe: { evolutionGate: "EVOLVE_ALLOWED" },
    ebl: { acceptedGapIds: ["g1"] },
    ecdm: { legitimacyClass: "POLICY_EVOLUTION_OK", bottleneckSignal: false },
    closure: { stableBandHint: "IN_BAND" }
  });
}

/** TLOA içerik aynı, kimlik farklı → aynı epistemik digest (TTA trivial). */
function testTtaTrivialContent(_trace, _manifest, _clock) {
  const a = tloaStressBase();
  const b = buildTriLayerObservableSnapshot({
    snapshotId: "tta-S0-prime",
    ebe: { evolutionGate: "EVOLVE_ALLOWED" },
    ebl: { acceptedGapIds: ["g1"] },
    ecdm: { legitimacyClass: "POLICY_EVOLUTION_OK", bottleneckSignal: false },
    closure: { stableBandHint: "IN_BAND" }
  });
  const d = epistemicDiff(a, b);
  return (
    d.unchanged &&
    snapshotContentDigest(a) === snapshotContentDigest(b) &&
    d.transitionSpaceKind === TRANSITION_SPACE.TRIVIAL
  );
}

/** EBE değişimi + PAG yok → TTA_ERR_PAG_CONSTRAINT / ILLEGAL. */
function testTtaPagBlocksGovernanceTouch(_trace, _manifest, _clock) {
  const s0 = tloaStressBase();
  const s1 = buildTriLayerObservableSnapshot({
    snapshotId: "tta-S1",
    ebe: { evolutionGate: "FROZEN" },
    ebl: { acceptedGapIds: ["g1"] },
    ecdm: { legitimacyClass: "POLICY_EVOLUTION_OK", bottleneckSignal: false },
    closure: { stableBandHint: "IN_BAND" }
  });
  const v = verifyEpistemicTransition(s0, s1, {
    ...defaultAdmissibilityPolicy(),
    pagAuthoritySatisfied: false
  });
  return (
    v.admissibility.classification === TRANSITION_CLASSIFICATION.ILLEGAL &&
    v.admissibility.errors.includes(TTA_ERR.PAG_CONSTRAINT)
  );
}

/** CONSTITUTIONAL_DRIFT geçişi witness’sız → ECDM_BYPASS. */
function testTtaEcdmBypassNoWitness(_trace, _manifest, _clock) {
  const s0 = tloaStressBase();
  const s1 = buildTriLayerObservableSnapshot({
    snapshotId: "tta-S-drift",
    ebe: { evolutionGate: "EVOLVE_ALLOWED" },
    ebl: { acceptedGapIds: ["g1"] },
    ecdm: { legitimacyClass: "CONSTITUTIONAL_DRIFT", bottleneckSignal: true },
    closure: { stableBandHint: "DRIFT_RISK" }
  });
  const v = verifyEpistemicTransition(s0, s1, {
    ...defaultAdmissibilityPolicy(),
    transitionWitnessRef: null
  });
  return (
    v.admissibility.errors.includes(TTA_ERR.ECDM_BYPASS) &&
    v.diff.requiresCutOverWitness === true
  );
}

/** Zincir ucu digest uyuşmazlığı → DIGEST_DISCONTINUITY. */
function testTtaDigestDiscontinuity(_trace, _manifest, _clock) {
  const s0 = tloaStressBase();
  const s1 = buildTriLayerObservableSnapshot({
    snapshotId: "tta-S-ebl",
    ebe: { evolutionGate: "EVOLVE_ALLOWED" },
    ebl: { acceptedGapIds: ["g1", "g2"] },
    ecdm: { legitimacyClass: "POLICY_EVOLUTION_OK", bottleneckSignal: false },
    closure: { stableBandHint: "IN_BAND" }
  });
  const v = verifyEpistemicTransition(s0, s1, {
    ...defaultAdmissibilityPolicy(),
    requireDigestContinuity: true,
    priorChainTipDigest: "deadbeefdeadbeefdeadbeefdeadbeefdeadbeefdeadbeefdeadbeefdeadbeef"
  });
  return v.admissibility.errors.includes(TTA_ERR.DIGEST_DISCONTINUITY);
}

/** EBL değişimi bütçe uygun değil → EBL_INFEASIBLE. */
function testTtaEblInfeasible(_trace, _manifest, _clock) {
  const s0 = tloaStressBase();
  const s1 = buildTriLayerObservableSnapshot({
    snapshotId: "tta-S-ebl2",
    ebe: { evolutionGate: "EVOLVE_ALLOWED" },
    ebl: { acceptedGapIds: ["g1", "g2"] },
    ecdm: { legitimacyClass: "POLICY_EVOLUTION_OK", bottleneckSignal: false },
    closure: { stableBandHint: "IN_BAND" }
  });
  const v = verifyEpistemicTransition(s0, s1, {
    ...defaultAdmissibilityPolicy(),
    eblBudgetFeasible: false
  });
  return v.admissibility.errors.includes(TTA_ERR.EBL_INFEASIBLE);
}

/** ECDM alanında sıfır tolerans → DRIFT_UNBOUNDED / DRIFTED. */
function testTtaEcdmStrictNone(_trace, _manifest, _clock) {
  const s0 = tloaStressBase();
  const s1 = buildTriLayerObservableSnapshot({
    snapshotId: "tta-S-ecdm-nudge",
    ebe: { evolutionGate: "EVOLVE_ALLOWED" },
    ebl: { acceptedGapIds: ["g1"] },
    ecdm: { legitimacyClass: "AMBIGUOUS", bottleneckSignal: false },
    closure: { stableBandHint: "IN_BAND" }
  });
  const v = verifyEpistemicTransition(s0, s1, {
    ...defaultAdmissibilityPolicy(),
    ecdmMaxLegitimacyDrift: "NONE"
  });
  return (
    v.admissibility.classification === TRANSITION_CLASSIFICATION.DRIFTED &&
    v.admissibility.errors.includes(TTA_ERR.DRIFT_UNBOUNDED)
  );
}

/** Ledger append deterministik seq. */
function testTtaLedgerAppend(_trace, _manifest, _clock) {
  const s0 = tloaStressBase();
  const s1 = buildTriLayerObservableSnapshot({
    snapshotId: "tta-S-ok",
    ebe: { evolutionGate: "EVOLVE_ALLOWED" },
    ebl: { acceptedGapIds: ["g1"] },
    ecdm: { legitimacyClass: "POLICY_EVOLUTION_OK", bottleneckSignal: false },
    closure: { stableBandHint: "FREEZE_RISK" }
  });
  const v = verifyEpistemicTransition(s0, s1, defaultAdmissibilityPolicy());
  let ledger = { entries: [] };
  ledger = appendTransitionLedger(ledger, v.ledgerEntry);
  ledger = appendTransitionLedger(ledger, v.ledgerEntry);
  return (
    ledger.entries.length === 2 &&
    ledger.entries[0].seq === 0 &&
    ledger.entries[1].seq === 1
  );
}

function testHogaCommuteComposition(_trace, _manifest, _clock) {
  const r = composeMetaDelta(
    { id: "META_J_COMMUTE_A" },
    { id: "META_J_COMMUTE_B" },
    {}
  );
  return r.ok && r.signature === CONFLICT_SIGNATURE.COMMUTE;
}

function testHogaIncompatibleComposition(_trace, _manifest, _clock) {
  const r = composeMetaDelta(
    { id: "META_INCOMPAT_A" },
    { id: "META_INCOMPAT_B" },
    {}
  );
  return !r.ok && r.errors.includes(HOGA_ERR.META_INCOMPATIBLE);
}

function testHogaOrderSensitiveUnwitnessed(_trace, _manifest, _clock) {
  const r = composeMetaDelta(
    { id: "META_ORDER_FIRST" },
    { id: "META_ORDER_SECOND" },
    {}
  );
  return !r.ok && r.errors.includes(HOGA_ERR.ORDER_SENSITIVE_UNWITNESSED);
}

function testHogaOrderSensitiveWitnessed(_trace, _manifest, _clock) {
  const r = composeMetaDelta(
    { id: "META_ORDER_FIRST" },
    { id: "META_ORDER_SECOND" },
    { compositionWitnessRef: "W:hoga-stress" }
  );
  return r.ok && r.signature === CONFLICT_SIGNATURE.ORDER_SENSITIVE;
}

function testHogaUnknownPairAmbiguous(_trace, _manifest, _clock) {
  const r = composeMetaDelta({ id: "META_X_UNKNOWN" }, { id: "META_Y_UNKNOWN" }, {});
  return (
    !r.ok &&
    r.signature === CONFLICT_SIGNATURE.AMBIGUOUS &&
    r.errors.includes(HOGA_ERR.COMPOSITION_UNDEFINED)
  );
}

function testHogaEcptPathValid(_trace, _manifest, _clock) {
  const r = verifyEcptPathClosed({
    path: ["PH_REGULATED", "PH_AMENDMENT", "PH_LOCK"],
    edges: ["PH_REGULATED>PH_AMENDMENT", "PH_AMENDMENT>PH_LOCK"]
  });
  return r.ok === true && r.errors.length === 0;
}

function testHogaEcptMissingEdge(_trace, _manifest, _clock) {
  const r = verifyEcptPathClosed({
    path: ["PH_REGULATED", "PH_BAD", "PH_LOCK"],
    edges: ["PH_REGULATED>PH_AMENDMENT", "PH_AMENDMENT>PH_LOCK"]
  });
  return !r.ok && r.errors.includes(HOGA_ERR.ECPT_PATH_NOT_CLOSED);
}

function testHogaEcptForbiddenMiddle(_trace, _manifest, _clock) {
  const r = verifyEcptPathClosed({
    path: ["PH_A", "PH_TRAP", "PH_C"],
    edges: ["PH_A>PH_TRAP", "PH_TRAP>PH_C"],
    forbiddenMiddles: [{ from: "PH_A", forbiddenMiddle: "PH_TRAP", to: "PH_C" }]
  });
  return !r.ok && r.errors.includes(HOGA_ERR.ECPT_HIDDEN_INTERMEDIATE);
}

/** Hash-consistent bundle with unknown lifecycle string → `RBL_A_ERR_LIFECYCLE_INVALID`. */
function stressCanonicalBundleInvalidLifecycle() {
  const fields = {
    piHash: PI_HASH_TRACE,
    epochId: "E0",
    governanceConstraintSetId: "GCS:stress",
    governanceConstraintHash: STRESS_GCS_HASH,
    resolutionPolicyRef: "R1:stress:v0",
    resolutionPolicyEpoch: "E0",
    lifecycleState: "LIFECYCLE_BOGUS",
    authorityWitness: { quorumRef: "stress" }
  };
  return {
    _version: "PAG_BUNDLE_0_2",
    ...fields,
    bundleHash: H_canon(authorityBundleContentForHash(fields))
  };
}

/**
 * @param {object} baseTrace
 * @param {object} manifest
 * @param {object} clock
 */
export function runMK1StressSuite(baseTrace, manifest, clock) {
  return {
    mutation: testMutation(baseTrace, manifest, clock),
    clockDrift: testClockDrift(baseTrace, manifest, clock),
    ordering: testOrderingShuffle(baseTrace, manifest, clock),
    replay: testReplayDivergence(baseTrace, manifest, clock),
    piefcEpochMismatch: testPiefcEpochMismatch(baseTrace, manifest, clock),
    piefcMatrixUndefined: testPiefcMatrixUndefined(baseTrace, manifest, clock),
    piefcDualReadCutover: testPiefcDualReadCutover(baseTrace, manifest, clock),
    piefcReplayHistoricalPi: testPiefcReplayHistoricalPi(baseTrace, manifest, clock),
    pagInvalidBundle: testPagInvalidBundle(baseTrace, manifest, clock),
    pagPiScopeMismatch: testPagPiScopeMismatch(baseTrace, manifest, clock),
    pagEpochScopeMismatch: testPagEpochScopeMismatch(baseTrace, manifest, clock),
    pagBundleAligned: testPagBundleAligned(baseTrace, manifest, clock),
    rblAAuthorityDrift: testRblAAuthorityDrift(baseTrace, manifest, clock),
    rblAPolicyScopeMismatch: testRblAPolicyScopeMismatch(baseTrace, manifest, clock),
    rblAGcsScopeMismatch: testRblAGcsScopeMismatch(baseTrace, manifest, clock),
    rblALifecycleInvalid: testRblALifecycleInvalid(baseTrace, manifest, clock),
    rblACanonicalAligned: testRblACanonicalAligned(baseTrace, manifest, clock),
    rblSealVerify: testRblSealVerify(baseTrace, manifest, clock),
    rblAppendRejectTamper: testRblAppendRejectTamper(baseTrace, manifest, clock),
    rblWitnessless: testRblWitnessless(baseTrace, manifest, clock),
    rtbRoundTrip: testRtbRoundTrip(baseTrace, manifest, clock),
    rtbBindPiMismatch: testRtbBindPiMismatch(baseTrace, manifest, clock),
    rtbExtractNoBinding: testRtbExtractNoBinding(baseTrace, manifest, clock),
    rtbContextualDeterminism: testRtbContextualDeterminism(baseTrace, manifest, clock),
    ttaTrivialContent: testTtaTrivialContent(baseTrace, manifest, clock),
    ttaPagBlocksGovernanceTouch: testTtaPagBlocksGovernanceTouch(
      baseTrace,
      manifest,
      clock
    ),
    ttaEcdmBypassNoWitness: testTtaEcdmBypassNoWitness(baseTrace, manifest, clock),
    ttaDigestDiscontinuity: testTtaDigestDiscontinuity(baseTrace, manifest, clock),
    ttaEblInfeasible: testTtaEblInfeasible(baseTrace, manifest, clock),
    ttaEcdmStrictNone: testTtaEcdmStrictNone(baseTrace, manifest, clock),
    ttaLedgerAppend: testTtaLedgerAppend(baseTrace, manifest, clock),
    hogaCommuteComposition: testHogaCommuteComposition(baseTrace, manifest, clock),
    hogaIncompatibleComposition: testHogaIncompatibleComposition(
      baseTrace,
      manifest,
      clock
    ),
    hogaOrderSensitiveUnwitnessed: testHogaOrderSensitiveUnwitnessed(
      baseTrace,
      manifest,
      clock
    ),
    hogaOrderSensitiveWitnessed: testHogaOrderSensitiveWitnessed(
      baseTrace,
      manifest,
      clock
    ),
    hogaUnknownPairAmbiguous: testHogaUnknownPairAmbiguous(
      baseTrace,
      manifest,
      clock
    ),
    hogaEcptPathValid: testHogaEcptPathValid(baseTrace, manifest, clock),
    hogaEcptMissingEdge: testHogaEcptMissingEdge(baseTrace, manifest, clock),
    hogaEcptForbiddenMiddle: testHogaEcptForbiddenMiddle(
      baseTrace,
      manifest,
      clock
    )
  };
}

/** 1-bit mutation ⇒ ANF identity divergence (opId no longer matches ⟨π,σ,ι,γ,μ⟩). */
function testMutation(trace, manifest, clock) {
  const mutated = structuredClone(trace);
  mutated.edges[0].opId = `${mutated.edges[0].opId}x`;
  const result = mk1Validate(mutated, manifest, clock);
  return !result.valid && result.code === MK1_ERR.IDENTITY_DIVERGENCE;
}

/** Injected clock drift ⇒ CLOCK_NON_INJECTIVE (requires trace.mk1ClockWitness + clock.tick). */
function testClockDrift(trace, manifest, clock) {
  const driftClock = { ...clock, tick: clock.tick - 1 };
  const result = mk1Validate(trace, manifest, driftClock);
  return !result.valid && result.code === MK1_ERR.CLOCK_NON_INJECTIVE;
}

/**
 * Edge reorder: π(trace) restores canonical representative → same `finalHash` (UCFC runtime proof).
 */
function testOrderingShuffle(trace, manifest, clock) {
  const shuffled = structuredClone(trace);
  shuffled.edges = [...shuffled.edges].reverse();
  const result = mk1Validate(shuffled, manifest, clock);
  return result.valid === true && result.class === "MK1_VALID_TRACE";
}

/** Same inputs ⇒ same acceptance outcome + same witness. */
function testReplayDivergence(trace, manifest, clock) {
  const a = mk1Validate(trace, manifest, clock);
  const b = mk1Validate(structuredClone(trace), manifest, clock);
  if (a.valid && b.valid) {
    return a.witness === b.witness;
  }
  return a.valid === b.valid && !a.valid && !b.valid && a.code === b.code;
}

/** π authority ≠ trace.piHash, no matrix ⇒ PROJECTION_AUTHORITY_MISMATCH; structural still valid. */
function testPiefcEpochMismatch(trace, manifest, clock) {
  const badPi = PI_HASH_TRACE.startsWith("a")
    ? `b${PI_HASH_TRACE.slice(1)}`
    : `a${PI_HASH_TRACE.slice(1)}`;
  const r = mk1Validate(trace, {
    manifest,
    clock,
    piAuthority: badPi,
    epochContext: { authorityEpochId: "E0", traceEpochId: "E0" }
  });
  return (
    "mk1" in r &&
    r.mk1.valid === true &&
    r.piEfcCode === MK1_ERR.PROJECTION_AUTHORITY_MISMATCH &&
    r.decisionClass === DECISION_CLASS.REJECT_UNDEFINED_POLICY
  );
}

/** M(E0,E1) = UNDEFINED ⇒ COMPAT_MATRIX_UNDEFINED. */
function testPiefcMatrixUndefined(trace, manifest, clock) {
  const r = mk1Validate(trace, {
    manifest,
    clock,
    piAuthority: PI_HASH_TRACE,
    epochContext: { authorityEpochId: "E1", traceEpochId: "E0" },
    compatibilityMatrix: () => "UNDEFINED"
  });
  return (
    "mk1" in r &&
    r.mk1.valid === true &&
    r.piEfcCode === MK1_ERR.COMPAT_MATRIX_UNDEFINED &&
    r.decisionClass === DECISION_CLASS.REJECT_UNDEFINED_POLICY
  );
}

/** CUT_OVER / dual-read: witness required ([piEMS §4.2.1]). */
function testPiefcDualReadCutover(trace, manifest, clock) {
  const r = mk1Validate(trace, {
    manifest,
    clock,
    piAuthority: PI_HASH_TRACE,
    epochContext: {
      authorityEpochId: "E1",
      traceEpochId: "E0",
      dualReadRequired: true
    }
  });
  return (
    "mk1" in r &&
    r.mk1.valid === true &&
    r.piEfcCode === MK1_ERR.DUAL_READ_WITNESS_MISSING &&
    r.decisionClass === DECISION_CLASS.REJECT_UNDEFINED_POLICY
  );
}

/** Malformed `ProjectionAuthorityBundle` ⇒ PAG_ERR_INVALID_BUNDLE (πEFC not reached). */
function testPagInvalidBundle(trace, manifest, clock) {
  const r = evaluateBindIndexed(
    trace,
    PI_HASH_TRACE,
    { authorityEpochId: "E0", traceEpochId: "E0" },
    clock,
    manifest,
    undefined,
    /** @type {unknown} */ ({ piHash: "not-hex" })
  );
  return (
    "mk1" in r &&
    r.piEfcCode === PAG_ERR.INVALID_BUNDLE &&
    r.decisionClass === DECISION_CLASS.REJECT_UNDEFINED_POLICY
  );
}

/** Sealed bundle.piHash ≠ π_authority ⇒ PAG_ERR_PIHASH_SCOPE_MISMATCH. */
function testPagPiScopeMismatch(trace, manifest, clock) {
  const bundle = stressAuthorityBundle();
  const wrongPi = PI_HASH_TRACE.startsWith("a")
    ? `b${PI_HASH_TRACE.slice(1)}`
    : `a${PI_HASH_TRACE.slice(1)}`;
  const r = evaluateBindIndexed(
    trace,
    wrongPi,
    { authorityEpochId: "E0", traceEpochId: "E0" },
    clock,
    manifest,
    undefined,
    bundle
  );
  return (
    "mk1" in r &&
    r.piEfcCode === PAG_ERR.PIHASH_SCOPE_MISMATCH &&
    r.decisionClass === DECISION_CLASS.REJECT_UNDEFINED_POLICY
  );
}

/** Bundle.epochId ≠ epoch_ctx authority scope ⇒ PAG_ERR_EPOCH_SCOPE_MISMATCH. */
function testPagEpochScopeMismatch(trace, manifest, clock) {
  const bundle = stressAuthorityBundle();
  const r = evaluateBindIndexed(
    trace,
    PI_HASH_TRACE,
    { authorityEpochId: "E1", traceEpochId: "E0" },
    clock,
    manifest,
    undefined,
    bundle
  );
  return (
    "mk1" in r &&
    r.piEfcCode === PAG_ERR.EPOCH_SCOPE_MISMATCH &&
    r.decisionClass === DECISION_CLASS.REJECT_UNDEFINED_POLICY
  );
}

/** Aligned bundle + π + epoch ⇒ same πEFC acceptance as without bundle. */
function testPagBundleAligned(trace, manifest, clock) {
  const bundle = stressAuthorityBundle();
  const matrix = (/** @type {string} */ i, /** @type {string} */ j) =>
    i === j ? "SELF" : "NON_BREAKING";
  const r = evaluateBindIndexed(
    trace,
    PI_HASH_TRACE,
    { authorityEpochId: "E0", traceEpochId: "E0" },
    clock,
    manifest,
    matrix,
    bundle
  );
  return (
    "mk1" in r &&
    r.mk1.valid === true &&
    r.decisionClass === DECISION_CLASS.ACCEPT_SELF &&
    r.compatibility === "SELF" &&
    r.piEfcCode === undefined
  );
}

/** Tampered `bundleHash` on canonical bundle ⇒ RBL_A_ERR_AUTHORITY_DRIFT. */
function testRblAAuthorityDrift(trace, manifest, clock) {
  const bundle = stressCanonicalAuthorityBundle();
  bundle.bundleHash = PI_HASH_TRACE.startsWith("c")
    ? `d${PI_HASH_TRACE.slice(1)}`
    : `c${PI_HASH_TRACE.slice(1)}`;
  const matrix = (/** @type {string} */ i, /** @type {string} */ j) =>
    i === j ? "SELF" : "NON_BREAKING";
  const r = evaluateBindIndexed(
    trace,
    PI_HASH_TRACE,
    {
      authorityEpochId: "E0",
      traceEpochId: "E0",
      governanceConstraintSetId: "GCS:stress"
    },
    clock,
    { ...manifest, resolutionPolicyRef: "R1:stress:v0" },
    matrix,
    bundle
  );
  return (
    "mk1" in r &&
    r.piEfcCode === RBL_A_ERR.AUTHORITY_DRIFT &&
    r.decisionClass === DECISION_CLASS.REJECT_UNDEFINED_POLICY
  );
}

/** manifest.resolutionPolicyRef ≠ bundle ⇒ RBL_A_ERR_POLICY_SCOPE_MISMATCH. */
function testRblAPolicyScopeMismatch(trace, manifest, clock) {
  const bundle = stressCanonicalAuthorityBundle("R1:stress:v0");
  const matrix = (/** @type {string} */ i, /** @type {string} */ j) =>
    i === j ? "SELF" : "NON_BREAKING";
  const r = evaluateBindIndexed(
    trace,
    PI_HASH_TRACE,
    {
      authorityEpochId: "E0",
      traceEpochId: "E0",
      governanceConstraintSetId: "GCS:stress"
    },
    clock,
    { ...manifest, resolutionPolicyRef: "R1:other" },
    matrix,
    bundle
  );
  return (
    "mk1" in r &&
    r.piEfcCode === RBL_A_ERR.POLICY_SCOPE_MISMATCH &&
    r.decisionClass === DECISION_CLASS.REJECT_UNDEFINED_POLICY
  );
}

/** epochContext / manifest GCS id ≠ bundle ⇒ RBL_A_ERR_GCS_SCOPE_MISMATCH. */
function testRblAGcsScopeMismatch(trace, manifest, clock) {
  const bundle = stressCanonicalAuthorityBundle();
  const matrix = (/** @type {string} */ i, /** @type {string} */ j) =>
    i === j ? "SELF" : "NON_BREAKING";
  const r = evaluateBindIndexed(
    trace,
    PI_HASH_TRACE,
    {
      authorityEpochId: "E0",
      traceEpochId: "E0",
      governanceConstraintSetId: "GCS:other"
    },
    clock,
    { ...manifest, resolutionPolicyRef: "R1:stress:v0" },
    matrix,
    bundle
  );
  return (
    "mk1" in r &&
    r.piEfcCode === RBL_A_ERR.GCS_SCOPE_MISMATCH &&
    r.decisionClass === DECISION_CLASS.REJECT_UNDEFINED_POLICY
  );
}

/** Unknown lifecycle label (hash-consistent) ⇒ RBL_A_ERR_LIFECYCLE_INVALID. */
function testRblALifecycleInvalid(trace, manifest, clock) {
  const bundle = stressCanonicalBundleInvalidLifecycle();
  const matrix = (/** @type {string} */ i, /** @type {string} */ j) =>
    i === j ? "SELF" : "NON_BREAKING";
  const r = evaluateBindIndexed(
    trace,
    PI_HASH_TRACE,
    {
      authorityEpochId: "E0",
      traceEpochId: "E0",
      governanceConstraintSetId: "GCS:stress"
    },
    clock,
    { ...manifest, resolutionPolicyRef: "R1:stress:v0" },
    matrix,
    bundle
  );
  return (
    "mk1" in r &&
    r.piEfcCode === RBL_A_ERR.LIFECYCLE_INVALID &&
    r.decisionClass === DECISION_CLASS.REJECT_UNDEFINED_POLICY
  );
}

/** Canonical RBL closure aligned with manifest + epoch ctx ⇒ πEFC ACCEPT_SELF. */
function testRblACanonicalAligned(trace, manifest, clock) {
  const bundle = stressCanonicalAuthorityBundle();
  const matrix = (/** @type {string} */ i, /** @type {string} */ j) =>
    i === j ? "SELF" : "NON_BREAKING";
  const r = evaluateBindIndexed(
    trace,
    PI_HASH_TRACE,
    {
      authorityEpochId: "E0",
      traceEpochId: "E0",
      governanceConstraintSetId: "GCS:stress"
    },
    clock,
    { ...manifest, resolutionPolicyRef: "R1:stress:v0" },
    matrix,
    bundle
  );
  return (
    "mk1" in r &&
    r.mk1.valid === true &&
    r.decisionClass === DECISION_CLASS.ACCEPT_SELF &&
    r.compatibility === "SELF" &&
    r.piEfcCode === undefined
  );
}

/** RBL-I4: mühür doğrulaması; payloadHash = H_canon(signal). */
function testRblSealVerify(_trace, _manifest, _clock) {
  const sealed = sealWitnessArtifact(
    { reading: 1.23, quantity: "temp" },
    {
      sourceClass: SOURCE_CLASS.TELEMETRY,
      projectionEpochId: "E0",
      piHash: PI_HASH_TRACE,
      observedAt: "2026-05-10T12:00:00.000Z",
      normalizationSpec: "rbl-v0:identity-json"
    },
    ["sensor-node-7", "relay-east"]
  );
  return (
    sealed.ok === true &&
    verifyArtifactSeal(sealed.artifact) === true &&
    typeof sealed.artifact.payloadHash === "string" &&
    sealed.artifact.payloadHash.length === 64
  );
}

/** Append-only ledger; bozuk mühür ⇒ APPEND_SEAL_FAIL. */
function testRblAppendRejectTamper(_trace, _manifest, _clock) {
  const s = sealWitnessArtifact(
    { n: 1 },
    {
      sourceClass: SOURCE_CLASS.METRIC_STREAM,
      projectionEpochId: "E0",
      piHash: PI_HASH_TRACE,
      observedAt: "2026-05-10T12:00:01.000Z"
    },
    ["w1"]
  );
  if (!s.ok) {
    return false;
  }
  const good = appendWitnessArtifact([], s.artifact);
  if (!good.ok || good.ledger.length !== 1) {
    return false;
  }
  const tampered = { ...s.artifact, payloadHash: "b".repeat(64) };
  const bad = appendWitnessArtifact(good.ledger, tampered);
  return bad.ok === false && bad.code === RBL_ERR.APPEND_SEAL_FAIL;
}

/** RBL-I2: tanıksız artefakt kabul edilmez. */
function testRblWitnessless(_trace, _manifest, _clock) {
  const r = sealWitnessArtifact(
    { x: 1 },
    {
      sourceClass: SOURCE_CLASS.HUMAN_ASSERTION,
      projectionEpochId: "E0",
      piHash: PI_HASH_TRACE,
      observedAt: "2026-05-10T12:00:02.000Z"
    },
    []
  );
  return r.ok === false && r.code === RBL_ERR.WITNESSLESS;
}

/** RTB-B1: Bind → MK-1 geçerli τ → extract ⇒ kanonik kökler bijeksiyon. */
function testRtbRoundTrip(trace, manifest, clock) {
  const a1 = sealWitnessArtifact(
    { v: 1 },
    {
      sourceClass: SOURCE_CLASS.TELEMETRY,
      projectionEpochId: "E0",
      piHash: PI_HASH_TRACE,
      observedAt: "2026-05-10T12:00:10.000Z"
    },
    ["w-a"]
  );
  const a2 = sealWitnessArtifact(
    { v: 2 },
    {
      sourceClass: SOURCE_CLASS.TELEMETRY,
      projectionEpochId: "E0",
      piHash: PI_HASH_TRACE,
      observedAt: "2026-05-10T12:00:11.000Z"
    },
    ["w-b"]
  );
  if (!a1.ok || !a2.ok) {
    return false;
  }
  const bindCtx = {
    piHash: PI_HASH_TRACE,
    projectionEpochId: "E0",
    manifestVersion: manifest.manifestVersion,
    mk1ClockWitness: trace.mk1ClockWitness
  };
  const skeleton = { nodes: trace.nodes, edges: trace.edges };
  const bound = bindTraceFromArtifacts([a1.artifact, a2.artifact], bindCtx, skeleton);
  if (!bound.ok) {
    return false;
  }
  const v = mk1Validate(bound.trace, manifest, clock);
  if (!v.valid) {
    return false;
  }
  const ex = extractArtifactRootsFromTrace(bound.trace);
  const cr = canonicalRootsFromArtifacts([a1.artifact, a2.artifact]);
  if (!ex.ok || !cr.ok) {
    return false;
  }
  return (
    ex.artifactRoots.length === cr.roots.length &&
    ex.artifactRoots.every((h, i) => h === cr.roots[i])
  );
}

/** Artefakt π ≠ bindingContext ⇒ RTB_ERR_PI_EPOCH_MISMATCH. */
function testRtbBindPiMismatch(trace, manifest, clock) {
  const altPi = PI_HASH_TRACE.startsWith("a")
    ? `b${PI_HASH_TRACE.slice(1)}`
    : `a${PI_HASH_TRACE.slice(1)}`;
  const good = sealWitnessArtifact(
    { v: 1 },
    {
      sourceClass: SOURCE_CLASS.TELEMETRY,
      projectionEpochId: "E0",
      piHash: PI_HASH_TRACE,
      observedAt: "2026-05-10T12:00:12.000Z"
    },
    ["w1"]
  );
  const bad = sealWitnessArtifact(
    { v: 2 },
    {
      sourceClass: SOURCE_CLASS.TELEMETRY,
      projectionEpochId: "E0",
      piHash: altPi,
      observedAt: "2026-05-10T12:00:13.000Z"
    },
    ["w2"]
  );
  if (!good.ok || !bad.ok) {
    return false;
  }
  const bindCtx = {
    piHash: PI_HASH_TRACE,
    projectionEpochId: "E0",
    manifestVersion: manifest.manifestVersion,
    mk1ClockWitness: trace.mk1ClockWitness
  };
  const skeleton = { nodes: trace.nodes, edges: trace.edges };
  const bound = bindTraceFromArtifacts([good.artifact, bad.artifact], bindCtx, skeleton);
  return bound.ok === false && bound.code === RTB_ERR.PI_EPOCH_MISMATCH;
}

/** RBL-τ bağlı olmayan τ ⇒ extract NO_BINDING_VERSION (baseline fixture). */
function testRtbExtractNoBinding(trace, _manifest, _clock) {
  const ex = extractArtifactRootsFromTrace(trace);
  return ex.ok === false && ex.code === RTB_ERR.NO_BINDING_VERSION;
}

/**
 * Aynı normalize edilmiş signal, farklı witnessSet → farklı artifactHash → farklı rblWitnessCommitment → farklı finalHash.
 * (Contextual determinism: aynı “ham veri” yorumu değil, epistemik tarih farklıdır.)
 */
function testRtbContextualDeterminism(trace, manifest, clock) {
  const ctxBase = {
    sourceClass: SOURCE_CLASS.TELEMETRY,
    projectionEpochId: "E0",
    piHash: PI_HASH_TRACE,
    observedAt: "2026-05-10T12:30:00.000Z"
  };
  const signal = { v: 1, probe: "contextual-determinism" };
  const narrow = sealWitnessArtifact(signal, ctxBase, ["sole-witness"]);
  const wide = sealWitnessArtifact(signal, ctxBase, ["other-a", "other-b"]);
  if (!narrow.ok || !wide.ok) {
    return false;
  }
  if (narrow.artifact.artifactHash === wide.artifact.artifactHash) {
    return false;
  }
  const bindCtx = {
    piHash: PI_HASH_TRACE,
    projectionEpochId: "E0",
    manifestVersion: manifest.manifestVersion,
    mk1ClockWitness: trace.mk1ClockWitness
  };
  const skeleton = { nodes: trace.nodes, edges: trace.edges };
  const tN = bindTraceFromArtifacts([narrow.artifact], bindCtx, skeleton);
  const tW = bindTraceFromArtifacts([wide.artifact], bindCtx, skeleton);
  if (!tN.ok || !tW.ok) {
    return false;
  }
  if (tN.trace.finalHash === tW.trace.finalHash) {
    return false;
  }
  const vN = mk1Validate(tN.trace, manifest, clock);
  const vW = mk1Validate(tW.trace, manifest, clock);
  return vN.valid === true && vW.valid === true;
}

/** Same τ + same historical π / matrix ⇒ same πEFC outcome (decision immutability layer). */
function testPiefcReplayHistoricalPi(trace, manifest, clock) {
  const opts = {
    manifest,
    clock,
    piAuthority: PI_HASH_TRACE,
    epochContext: { authorityEpochId: "E0", traceEpochId: "E0" },
    compatibilityMatrix: (i, j) => (i === j ? "SELF" : "NON_BREAKING")
  };
  const a = mk1Validate(trace, opts);
  const b = mk1Validate(structuredClone(trace), opts);
  if (!("mk1" in a) || !("mk1" in b)) {
    return false;
  }
  return (
    a.mk1.valid === b.mk1.valid &&
    a.mk1.valid === true &&
    a.decisionClass === b.decisionClass &&
    a.decisionClass === DECISION_CLASS.ACCEPT_SELF &&
    a.compatibility === b.compatibility &&
    a.witness === b.witness
  );
}

export function runAll(trace, manifest, clock) {
  const results = runMK1StressSuite(trace, manifest, clock);

  const pass =
    results.mutation &&
    results.clockDrift &&
    results.ordering &&
    results.replay &&
    results.piefcEpochMismatch &&
    results.piefcMatrixUndefined &&
    results.piefcDualReadCutover &&
    results.piefcReplayHistoricalPi &&
    results.pagInvalidBundle &&
    results.pagPiScopeMismatch &&
    results.pagEpochScopeMismatch &&
    results.pagBundleAligned &&
    results.rblAAuthorityDrift &&
    results.rblAPolicyScopeMismatch &&
    results.rblAGcsScopeMismatch &&
    results.rblALifecycleInvalid &&
    results.rblACanonicalAligned &&
    results.rblSealVerify &&
    results.rblAppendRejectTamper &&
    results.rblWitnessless &&
    results.rtbRoundTrip &&
    results.rtbBindPiMismatch &&
    results.rtbExtractNoBinding &&
    results.rtbContextualDeterminism &&
    results.ttaTrivialContent &&
    results.ttaPagBlocksGovernanceTouch &&
    results.ttaEcdmBypassNoWitness &&
    results.ttaDigestDiscontinuity &&
    results.ttaEblInfeasible &&
    results.ttaEcdmStrictNone &&
    results.ttaLedgerAppend &&
    results.hogaCommuteComposition &&
    results.hogaIncompatibleComposition &&
    results.hogaOrderSensitiveUnwitnessed &&
    results.hogaOrderSensitiveWitnessed &&
    results.hogaUnknownPairAmbiguous &&
    results.hogaEcptPathValid &&
    results.hogaEcptMissingEdge &&
    results.hogaEcptForbiddenMiddle;

  return {
    pass,
    results,
    class: pass ? "MK1_STABLE" : "MK1_DEGRADED"
  };
}

async function runCli() {
  const file = process.argv[2];
  if (!file) {
    console.error(MK1_ERR.INVALID_INPUT);
    process.exit(1);
  }

  const mod = await import(
    pathToFileURL(resolve(process.cwd(), file)).href
  );
  const { trace, manifest, clock } = mod;
  const out = runAll(trace, manifest, clock);
  console.log(JSON.stringify(out, null, 2));
  process.exit(out.pass ? 0 : 1);
}

if (import.meta.url === pathToFileURL(process.argv[1] || "").href) {
  runCli();
}
