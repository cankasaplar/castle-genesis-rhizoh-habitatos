import { describe, expect, it, beforeEach } from "vitest";
import {
  COUNCIL_MEMORY_KIND_V0,
  COUNCIL_OBSERVATION_GOVERNANCE_V0,
  COUNCIL_SESSION_PHASE_V0,
  COUNCIL_TRIGGER_KIND_V0,
  __resetEpistemicCouncilForTestV0,
  evaluateCouncilTriggerV0,
  maybeEnqueueEpistemicCouncilV0,
  runEpistemicCouncilDryRunV0
} from "../rhizohEpistemicCouncilV0.js";
import { TOPOLOGY_EVENT_TYPES_V0 } from "../rhizohTopologyEventEmitterV0.js";

describe("rhizohEpistemicCouncilV0", () => {
  beforeEach(() => {
    __resetEpistemicCouncilForTestV0();
    if (typeof window !== "undefined") {
      window.__rhizoh = {};
    }
  });

  it("triggers on policy diff drift", () => {
    const ev = evaluateCouncilTriggerV0({
      policyDiff: { drifted: true },
      matchId: "cluster_2_abc",
      slotId: 2
    });
    expect(ev?.shouldInvoke).toBe(true);
    expect(ev?.triggers).toContain(COUNCIL_TRIGGER_KIND_V0.POLICY_DIFF_DRIFT);
  });

  it("triggers on topology drift magnitude", () => {
    const ev = evaluateCouncilTriggerV0({
      topologyEventType: TOPOLOGY_EVENT_TYPES_V0.DRIFT_DETECTED,
      driftMagnitude: 0.8,
      matchId: "cluster_5_abc"
    });
    expect(ev?.triggers).toContain(COUNCIL_TRIGGER_KIND_V0.TOPOLOGY_DRIFT);
  });

  it("does not trigger from council annotation source", () => {
    const out = maybeEnqueueEpistemicCouncilV0({
      sourceKind: COUNCIL_MEMORY_KIND_V0.CONTEXTUAL_ANNOTATION,
      policyDiff: { drifted: true }
    });
    expect(out).toBeNull();
  });

  it("runs dry-run session through lifecycle phases", async () => {
    const trigger = evaluateCouncilTriggerV0({ stockfishTimeout: true, matchId: "cluster_1_x" });
    const obs = await runEpistemicCouncilDryRunV0(trigger);
    expect(obs.kind).toBe(COUNCIL_MEMORY_KIND_V0.CONTEXTUAL_ANNOTATION);
    expect(obs.governance.feedsDriftDetection).toBe(false);
    expect(window.__rhizoh?.epistemicCouncil?.lastObservation?.sessionId).toBeTruthy();
  });

  it("isolates council governance from execution paths", () => {
    expect(COUNCIL_OBSERVATION_GOVERNANCE_V0.feedsMoveSelection).toBe(false);
    expect(COUNCIL_OBSERVATION_GOVERNANCE_V0.epistemicRole).toBe("contextual_annotation");
    expect(COUNCIL_SESSION_PHASE_V0.EMIT_OBSERVATION).toBe("EMIT_OBSERVATION");
  });
});
