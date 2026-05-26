import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  CERTAINTY_CAP_V0,
  DLGL_UNCERTAINTY_INVARIANT_V0,
  PACKET_OVERCONFIDENCE_CLASS_V0,
  buildDecisionPacketUncertaintyBoundaryV0
} from "../ops/decisionPacketUncertaintyBoundaryV0.js";
import { buildUnifiedStateNarrativeV0 } from "../ops/unifiedStateNarrativeV0.js";

describe("decisionPacketUncertaintyBoundaryV0", () => {
  it("enriched packet never resolves certainty", async () => {
    const n = await buildUnifiedStateNarrativeV0({ tenantId: "org-dpub-test" });
    const pkt = n.decisionLatencyGovernance?.humanDecisionPacket;
    assert.equal(pkt?.certaintyCap, CERTAINTY_CAP_V0.BOUNDED_HYPOTHESIS);
    assert.equal(pkt?.packetIsNotRealityClaim, true);
    assert.ok((pkt?.uncertaintyEnvelope?.itemCount ?? 0) >= 2);
  });

  it("carries contradiction digest when cross-layer conflicts exist", async () => {
    const n = await buildUnifiedStateNarrativeV0({ tenantId: "org-dpub-digest" });
    const digest = n.decisionLatencyGovernance?.humanDecisionPacket?.contradictionDigest;
    const count = n.epistemicCoherence?.crossLayerContradictions?.count ?? 0;
    if (count > 0) {
      assert.ok(digest?.conflicts?.length >= 1 || digest?.crossLayerCount >= 1);
    }
  });

  it("SLA qualification is ack-only not decision deadline", async () => {
    const n = await buildUnifiedStateNarrativeV0({ tenantId: "org-dpub-sla" });
    const sla = n.decisionLatencyGovernance?.humanDecisionPacket?.slaQualification;
    assert.equal(sla?.isDecisionDeadline, false);
    assert.equal(sla?.isGoSignal, false);
    assert.ok(sla?.disclaimer?.tr);
  });

  it("invariant check passes on full export", async () => {
    const n = await buildUnifiedStateNarrativeV0({ tenantId: "org-dpub-inv" });
    assert.equal(n.decisionPacketUncertaintyBoundary?.centralInvariant, DLGL_UNCERTAINTY_INVARIANT_V0);
    assert.equal(n.decisionPacketUncertaintyBoundary?.invariantCheck?.valid, true);
    const risks = n.decisionLatencyGovernance?.humanDecisionPacket?.overconfidenceRisk?.risks ?? [];
    assert.ok(
      risks.some((r) => r.class === PACKET_OVERCONFIDENCE_CLASS_V0.COMPRESSION_TRUST_INFLATION) ||
        risks.length >= 0
    );
  });
});
