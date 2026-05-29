import { describe, it, expect } from "vitest";
import {
  CANONICAL_REALITY_AUTHORITY_INVARIANT_V0,
  WAL_WORLD_DIFF_KIND_V0,
  normalizeWalWorldDiffV0,
  mapWalDiffToSealCandidateV0,
  submitWorldAuthoritySealCandidateV0,
  assertNoDirectEpochWriteInPatchV0,
  computeWalDiffPayloadHashV0,
  buildWorldAuthoritySealIngressSnapshotV0
} from "../submitWorldAuthoritySealCandidateV0.js";
import {
  createDefaultRealitySealLayerStateV0,
  replaySealAuditTrailV0
} from "../realitySealingCoreV0.js";

function topoDiff(id, extra = {}) {
  return {
    diffId: id,
    kind: WAL_WORLD_DIFF_KIND_V0.TOPOLOGY_PATCH,
    roomScope: "room:main",
    signed: true,
    payload: { regionUid: "region:istanbul:fatih" },
    ...extra
  };
}

describe("submitWorldAuthoritySealCandidateV0", () => {
  it("states the canonical reality authority invariant", () => {
    expect(CANONICAL_REALITY_AUTHORITY_INVARIANT_V0).toContain("Only the sealer");
  });

  it("rejects direct epoch bump attempts from WAL", () => {
    const n = normalizeWalWorldDiffV0({
      diffId: "x",
      kind: WAL_WORLD_DIFF_KIND_V0.OBSTACLE_DELTA,
      attemptDirectEpochBump: true
    });
    expect(n.ok).toBe(false);
    expect(n.code).toBe("WAL_DIRECT_EPOCH_FORBIDDEN");
  });

  it("maps topology patch to sealing_topology_mandate candidate", () => {
    const c = mapWalDiffToSealCandidateV0(topoDiff("t1"), 100);
    expect(c.source).toBe("wal");
    expect(c.commitClassId).toBe("sealing_topology_mandate");
    expect(c.candidateId).toBe("wal:t1");
  });

  it("maps scene chunk to high_rate_substrate (no naive epoch path)", () => {
    const c = mapWalDiffToSealCandidateV0(
      {
        diffId: "s1",
        kind: WAL_WORLD_DIFF_KIND_V0.SCENE_CHUNK,
        signed: true
      },
      1
    );
    expect(c.commitClassId).toBe("high_rate_substrate");
  });

  it("enqueues without advancing epoch until drain", () => {
    const seal0 = createDefaultRealitySealLayerStateV0();
    const r = submitWorldAuthoritySealCandidateV0(seal0, topoDiff("e1"));
    expect(r.ok).toBe(true);
    expect(r.seal.realityEpoch).toBe(0);
    expect(r.seal.sealQueue).toHaveLength(1);
  });

  it("advances epoch only through sealer drain", () => {
    const seal0 = createDefaultRealitySealLayerStateV0();
    const r = submitWorldAuthoritySealCandidateV0(seal0, topoDiff("e2"), { drain: true });
    expect(r.ok).toBe(true);
    expect(r.seal.realityEpoch).toBe(1);
    expect(r.drained?.sealed).toBe(1);
    expect(replaySealAuditTrailV0(r.seal.auditTrail).ok).toBe(true);
  });

  it("rejects unsigned diffs by default", () => {
    const r = submitWorldAuthoritySealCandidateV0(
      createDefaultRealitySealLayerStateV0(),
      topoDiff("u1", { signed: false })
    );
    expect(r.ok).toBe(false);
    expect(r.code).toBe("WAL_DIFF_UNSIGNED");
  });

  it("blocks direct epoch writes in kernel patches", () => {
    expect(assertNoDirectEpochWriteInPatchV0({ realityEpoch: 9 }).ok).toBe(false);
    expect(assertNoDirectEpochWriteInPatchV0({ realitySeal: { realityEpoch: 2 } }).ok).toBe(false);
    expect(assertNoDirectEpochWriteInPatchV0({ presence: {} }).ok).toBe(true);
  });

  it("produces stable wal diff payload hash", () => {
    const d = topoDiff("h1");
    expect(computeWalDiffPayloadHashV0(d)).toBe(computeWalDiffPayloadHashV0(d));
  });

  it("builds ingress debug snapshot", () => {
    const snap = buildWorldAuthoritySealIngressSnapshotV0(createDefaultRealitySealLayerStateV0());
    expect(snap.schema).toContain("seal_ingress");
    expect(snap.epochWriteForbiddenLayers).toContain("wal");
  });
});
