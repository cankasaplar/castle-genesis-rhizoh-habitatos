import { describe, expect, it } from "vitest";
import {
  IDENTITY_ARBITRATION_ACTION_V0,
  IDENTITY_CONTINUITY_VERDICT_V0,
  assertIdentityContinuityV0,
  computeIdentityConfidenceV0,
  deriveEpistemicFingerprintV0,
  deriveWitnessSemanticsV0
} from "../epistemicIdentityContinuityV0.js";

const BASE = {
  livingWorldId: "world:istanbul",
  issuancePath: "canonical_chain",
  lineageRoot: "lineage:root-a",
  witnessAnchor: { weight: 4, class: "gateway", decayRate: 0.05, lastWitnessAtMs: Date.now() }
};

describe("epistemicIdentityContinuityV0 (RESEARCH-ONLY)", () => {
  it("deriveWitnessSemantics produces stable digest for same anchor", () => {
    const a = deriveWitnessSemanticsV0(BASE.witnessAnchor, { nowMs: 1_000_000 });
    const b = deriveWitnessSemanticsV0(BASE.witnessAnchor, { nowMs: 1_000_000 });
    expect(a.semanticsDigest).toBe(b.semanticsDigest);
    expect(a.stabilityScore).toBeGreaterThan(0);
  });

  it("same inputs → same epistemic fingerprint (observability boundary)", () => {
    const a = deriveEpistemicFingerprintV0({ ...BASE, nowMs: 100 });
    const b = deriveEpistemicFingerprintV0({ ...BASE, nowMs: 100 });
    expect(a.epistemicFingerprintId).toBe(b.epistemicFingerprintId);
  });

  it("assertIdentityContinuity: same_subject for identical fingerprints", () => {
    const fp = deriveEpistemicFingerprintV0(BASE);
    const out = assertIdentityContinuityV0({
      priorFingerprint: fp,
      currentFingerprint: fp,
      bootSealVersion: 3
    });
    expect(out.verdict).toBe(IDENTITY_CONTINUITY_VERDICT_V0.SAME_SUBJECT);
    expect(out.hardGate).toBe(false);
    expect(out.action).toBe(IDENTITY_ARBITRATION_ACTION_V0.ALLOW_AS_SAME_SUBJECT);
  });

  it("lineage_ok_identity_fork when lineage holds but fingerprint differs", () => {
    const prior = deriveEpistemicFingerprintV0(BASE);
    const current = deriveEpistemicFingerprintV0({
      ...BASE,
      witnessAnchor: { ...BASE.witnessAnchor, weight: 9 }
    });
    const out = assertIdentityContinuityV0({
      priorFingerprint: prior,
      currentFingerprint: current,
      bootSealVersion: 4,
      lineageEquivalent: true
    });
    expect(out.verdict).toBe(IDENTITY_CONTINUITY_VERDICT_V0.LINEAGE_OK_IDENTITY_FORK);
    expect(out.action).toBe(IDENTITY_ARBITRATION_ACTION_V0.GENERATE_TEMPORAL_IDENTITY_ID);
    expect(out.hardGate).toBe(false);
  });

  it("identity_drift on soft witness weight band", () => {
    const prior = deriveEpistemicFingerprintV0(BASE);
    const current = deriveEpistemicFingerprintV0({
      ...BASE,
      witnessAnchor: { ...BASE.witnessAnchor, weight: 5 },
      lineageRoot: "lineage:foreign"
    });
    const out = assertIdentityContinuityV0({
      priorFingerprint: prior,
      currentFingerprint: current,
      bootSealVersion: 5,
      lineageEquivalent: false
    });
    expect([IDENTITY_CONTINUITY_VERDICT_V0.IDENTITY_DRIFT, IDENTITY_CONTINUITY_VERDICT_V0.UNRELATED]).toContain(
      out.verdict
    );
    expect(out.hardGate).toBe(false);
  });

  it("computeIdentityConfidence decreases when fingerprint diverges", () => {
    const prior = deriveEpistemicFingerprintV0(BASE);
    const current = deriveEpistemicFingerprintV0({
      livingWorldId: "world:other",
      issuancePath: "fork",
      lineageRoot: "x",
      witnessAnchor: { weight: 0 }
    });
    const hi = computeIdentityConfidenceV0(prior, prior);
    const lo = computeIdentityConfidenceV0(prior, current);
    expect(hi.confidence).toBeGreaterThan(lo.confidence);
  });
});
