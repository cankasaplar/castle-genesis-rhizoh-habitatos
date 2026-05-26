#!/usr/bin/env node
import { DLGL_UNCERTAINTY_INVARIANT_V0 } from "./decisionPacketUncertaintyBoundaryV0.js";
import { buildUnifiedStateNarrativeV0 } from "./unifiedStateNarrativeV0.js";

const n = await buildUnifiedStateNarrativeV0({ tenantId: "org-dpub-gate-ci" });
const dpub = n.decisionPacketUncertaintyBoundary;
const pkt = n.decisionLatencyGovernance?.humanDecisionPacket;

if (!dpub?.schema) {
  console.error("DPUB_GATE_FAIL: missing decisionPacketUncertaintyBoundary");
  process.exit(1);
}

const inv = dpub.invariantCheck;
const payload = {
  gate: "rhizoh.decision_packet_uncertainty_gate.v0",
  ranAt: new Date().toISOString(),
  invariant: DLGL_UNCERTAINTY_INVARIANT_V0,
  invariantValid: inv?.valid === true,
  certaintyCap: pkt?.certaintyCap,
  uncertaintyItems: pkt?.uncertaintyEnvelope?.itemCount,
  slaNotDeadline: pkt?.slaQualification?.isDecisionDeadline === false,
  digestAttached: Boolean(pkt?.contradictionDigest),
  passed:
    inv?.valid === true &&
    pkt?.certaintyCap === "bounded_hypothesis" &&
    pkt?.slaQualification?.isDecisionDeadline === false
};

console.log(JSON.stringify(payload, null, 2));
process.exit(payload.passed ? 0 : 1);
