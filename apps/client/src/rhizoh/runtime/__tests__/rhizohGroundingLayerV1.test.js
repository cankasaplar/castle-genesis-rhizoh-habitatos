import { describe, expect, it, beforeEach } from "vitest";
import {
  noteGroundSignalV1,
  evaluateGroundingV1,
  applyGroundingOverrideV1,
  isGovernanceFastPathV1,
  GROUND_SIGNAL_KIND_V1,
  __resetGroundingLayerForTestV1
} from "../rhizohGroundingLayerV1.js";
import { governPulseEventV0, __resetPulsePriorityForTestV0 } from "../rhizohPulsePriorityEngineV0.js";
import { governPulseEmissionV0, safePulseStageV0, __resetPulseGovernanceForTestV0 } from "../rhizohPulseGovernanceV0.js";
import {
  mountOutputContractConsumerV0,
  getOutputContractConsumerSnapshotV0,
  __resetOutputContractConsumerForTestV0
} from "../rhizohOutputContractConsumerV0.js";
import { routeGovernedOutputV0 } from "../rhizohOutputContractRouterV0.js";
import { runRhizohPulseTickV1, __resetRhizohPulseLoopForTestV1 } from "../rhizohPulseLoopV1.js";

describe("rhizohGroundingLayerV1", () => {
  beforeEach(() => {
    __resetGroundingLayerForTestV1();
    __resetPulsePriorityForTestV0();
    __resetPulseGovernanceForTestV0();
    __resetOutputContractConsumerForTestV0();
    __resetRhizohPulseLoopForTestV1();
  });

  it("rescues suppressed telemetry when world WS fail signal present", () => {
    noteGroundSignalV1(GROUND_SIGNAL_KIND_V1.GATEWAY_WS_FAIL, { reason: "test" });
    const gov = governPulseEventV0({ type: "transport_switch" });
    expect(gov.suppressed).toBe(true);

    const grounding = evaluateGroundingV1({
      governance: gov,
      semanticMass: 0.1,
      transport: { wsUpgradeFailed: true },
      eventLog: { recent: [] }
    });
    expect(grounding.unexpectedImportant).toBe(true);

    const overridden = applyGroundingOverrideV1(gov, grounding);
    expect(overridden.suppressed).toBe(false);
    expect(overridden.groundingOverride).toBe("ws_fail_world_anchor");
  });

  it("detects semantic drift vs world mismatch", () => {
    noteGroundSignalV1(GROUND_SIGNAL_KIND_V1.USER_SPEECH);
    const grounding = evaluateGroundingV1({
      governance: { suppressed: false },
      semanticMass: 0.05,
      eventLog: { recent: [] }
    });
    expect(grounding.mismatch).toBe(true);
    expect(grounding.telemetryRescue.length).toBeGreaterThan(0);
  });

  it("fast path bypasses heavy semantic filter for presence_ack", () => {
    const governed = governPulseEmissionV0(
      { presenceKind: "presence_ack", phrase: "Buradayım.", userInitiated: true },
      { voiceReady: true, eventLog: { recent: [] } }
    );
    expect(governed.fastPath).toBe(true);
    expect(governed.shouldRoute).toBe(true);
  });

  it("safePulseStage marks degraded on fallback not healthy pass", () => {
    const stage = safePulseStageV0(
      "x",
      () => {
        throw new Error("fail");
      },
      { ok: false }
    );
    expect(stage.degraded).toBe(true);
    expect(stage.usedFallback).toBe(true);
    expect(stage.ok).toBe(false);
  });

  it("output contract consumer rejects chat bubble semantics", () => {
    mountOutputContractConsumerV0();
    window.dispatchEvent(
      new CustomEvent("rhizoh:output-contract-v0", {
        detail: {
          schema: "rhizoh.output_contract_router.v0",
          isChatBubble: true,
          isPresenceEvent: true,
          renderAs: "chat_message"
        }
      })
    );
    const snap = getOutputContractConsumerSnapshotV0();
    expect(snap.violationCount).toBeGreaterThan(0);
    expect(snap.contractAware).toBe(false);
  });

  it("output contract consumer accepts presence_chip", () => {
    mountOutputContractConsumerV0();
    const gov = governPulseEventV0({ presenceKind: "presence_observe" }, { voiceReady: true });
    routeGovernedOutputV0(gov, {
      phrase: "Buradayım.",
      signature: { kind: "presence_observe", isPresenceEvent: true }
    });
    const snap = getOutputContractConsumerSnapshotV0();
    expect(snap.consumedCount).toBeGreaterThan(0);
  });

  it("pulse tick exposes systemHealth degraded stages", () => {
    const snap = runRhizohPulseTickV1();
    expect(snap.role).toBe("live_first_governor");
    expect(snap.systemHealth).toBeDefined();
    expect(snap.liveLayer?.signature?.kind).toBe("presence_pulse");
    expect(snap.liveLayer?.llmBypass).toBe(true);
  });

  it("isGovernanceFastPath for user initiated presence", () => {
    expect(isGovernanceFastPathV1({ userInitiated: true })).toBe(true);
    expect(isGovernanceFastPathV1({ presenceKind: "presence_ack" })).toBe(true);
    expect(isGovernanceFastPathV1({ type: "transport_switch" })).toBe(false);
  });
});
