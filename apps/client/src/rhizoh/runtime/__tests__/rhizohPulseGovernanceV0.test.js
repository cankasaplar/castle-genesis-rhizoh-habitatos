import { describe, expect, it, beforeEach } from "vitest";
import {
  governPulseEventV0,
  __resetPulsePriorityForTestV0
} from "../rhizohPulsePriorityEngineV0.js";
import {
  classifyEventSemanticsV0,
  filterIdentityNoiseV0
} from "../rhizohSemanticCompressionFilterV0.js";
import {
  routeGovernedOutputV0,
  OUTPUT_CHANNEL_V0,
  RENDER_AS_V0
} from "../rhizohOutputContractRouterV0.js";
import {
  safePulseStageV0,
  governPulseEmissionV0,
  __resetPulseGovernanceForTestV0
} from "../rhizohPulseGovernanceV0.js";
import { runRhizohPulseTickV1, __resetRhizohPulseLoopForTestV1 } from "../rhizohPulseLoopV1.js";
import { __resetIdentityEventLogForTestV0 } from "../rhizohIdentityEventLogV0.js";
import { __resetIdentityLifecycleForTestV0 } from "../rhizohIdentityLifecycleV0.js";
import { __resetPersonaSchedulerForTestV0 } from "../rhizohPersonaLoopSchedulerV0.js";

describe("rhizohPulseGovernanceV0", () => {
  beforeEach(() => {
    __resetPulsePriorityForTestV0();
    __resetPulseGovernanceForTestV0();
    __resetRhizohPulseLoopForTestV1();
    __resetIdentityEventLogForTestV0();
    __resetIdentityLifecycleForTestV0();
    __resetPersonaSchedulerForTestV0();
  });

  it("transport_switch is telemetry log-only", () => {
    const gov = governPulseEventV0({ type: "transport_switch" });
    expect(gov.logOnly).toBe(true);
    expect(gov.voiceEligible).toBe(false);
    expect(gov.uiEligible).toBe(false);
    expect(gov.suppressed).toBe(true);
  });

  it("presence_ack is critical and voice+ui eligible", () => {
    const gov = governPulseEventV0({ presenceKind: "presence_ack" }, { voiceReady: true });
    expect(gov.voiceEligible).toBe(true);
    expect(gov.uiEligible).toBe(true);
    expect(gov.eventWeight).toBeGreaterThan(0.9);
  });

  it("semantic filter separates meaningful from telemetry", () => {
    const filtered = filterIdentityNoiseV0({
      recent: [
        { id: "1", type: "turn_bind", intent: "presence" },
        { id: "2", type: "transport_switch", intent: "http_fallback" },
        { id: "3", type: "lifecycle_touch" }
      ]
    });
    expect(filtered.meaningfulCount).toBeGreaterThan(0);
    expect(filtered.telemetryCount).toBeGreaterThan(0);
  });

  it("classify marks transport as telemetry not identity", () => {
    const c = classifyEventSemanticsV0({ type: "transport_switch" });
    expect(c.telemetry).toBe(true);
    expect(c.retainInIdentity).toBe(false);
  });

  it("output contract routes UI presence without chat bubble", () => {
    const gov = governPulseEventV0({ presenceKind: "presence_observe" }, { voiceReady: true });
    const routed = routeGovernedOutputV0(gov, {
      phrase: "Buradayım.",
      signature: { kind: "presence_observe", isPresenceEvent: true }
    });
    expect(routed.ok).toBe(true);
    const ui = routed.channels.find((c) => c.channel === OUTPUT_CHANNEL_V0.UI_PRESENCE);
    expect(ui?.renderAs).toBe(RENDER_AS_V0.PRESENCE_CHIP);
    expect(ui?.contractBound).toBe(true);
  });

  it("safePulseStage isolates subsystem failure", () => {
    const stage = safePulseStageV0(
      "test_stage",
      () => {
        throw new Error("boom");
      },
      { fallback: true }
    );
    expect(stage.ok).toBe(false);
    expect(stage.degraded).toBe(true);
    expect(stage.usedFallback).toBe(true);
    expect(stage.result).toEqual({ fallback: true });
  });

  it("pulse tick reports governor role and stage health", () => {
    const snap = runRhizohPulseTickV1();
    expect(snap.role).toBe("live_first_governor");
    expect(snap.stageHealth).toBeDefined();
    expect(snap.systemHealth).toBeDefined();
    expect(snap.pulseGovernance.role).toBe("governor_with_grounding");
  });

  it("governPulseEmission observation wouldBlock but never blocks live", () => {
    const governed = governPulseEmissionV0(
      { type: "transport_switch", phrase: "should not route" },
      { eventLog: { recent: [] } }
    );
    expect(governed.wouldBlock).toBe(true);
    expect(governed.observationOnly).toBe(true);
  });
});
