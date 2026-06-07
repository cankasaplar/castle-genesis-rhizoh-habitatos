import { describe, expect, it, beforeEach, vi } from "vitest";
import {
  runRhizohPulseTickV1,
  __resetRhizohPulseLoopForTestV1
} from "../rhizohPulseLoopV1.js";
import {
  touchIdentityLifecycleV0,
  runIdentityLifecycleDecayV0,
  __resetIdentityLifecycleForTestV0
} from "../rhizohIdentityLifecycleV0.js";
import {
  getIdentityEventLogSnapshotV0,
  __resetIdentityEventLogForTestV0
} from "../rhizohIdentityEventLogV0.js";
import {
  buildPresenceSignatureV0,
  emitPresenceEventV0,
  PRESENCE_EVENT_KIND_V0
} from "../rhizohPresenceSignatureV0.js";
import {
  evaluatePersonaSchedulerPulseV1,
  __resetPersonaSchedulerForTestV0
} from "../rhizohPersonaLoopSchedulerV0.js";
import {
  noteGatewayWsUpgradeFailedV0,
  __resetGatewayTransportFallbackForTestV0
} from "../rhizohGatewayTransportFallbackV0.js";
import {
  getComputeAdapterSnapshotV0,
  __resetComputeAdapterForTestV0
} from "../rhizohComputeAdapterRegistryV0.js";
import { __resetIdentityContinuityForTestV0 } from "../rhizohIdentityContinuityCoreV0.js";
import { __resetVoiceOutputAdapterChainForTestV0 } from "../rhizohVoiceOutputAdapterChainV0.js";

describe("rhizohPulseLoopV1", () => {
  beforeEach(() => {
    __resetRhizohPulseLoopForTestV1();
    __resetIdentityLifecycleForTestV0();
    __resetIdentityEventLogForTestV0();
    __resetIdentityContinuityForTestV0();
    __resetPersonaSchedulerForTestV0();
    __resetGatewayTransportFallbackForTestV0();
    __resetComputeAdapterForTestV0();
    __resetVoiceOutputAdapterChainForTestV0();
  });

  it("identity event log is SSOT across transport carriers", () => {
    touchIdentityLifecycleV0({ intent: "presence", carrier: "ws", preview: "a" });
    noteGatewayWsUpgradeFailedV0("test");
    touchIdentityLifecycleV0({ intent: "presence", carrier: "http_preferred", preview: "b" });

    const log = getIdentityEventLogSnapshotV0();
    expect(log.ssot).toBe(true);
    expect(log.count).toBeGreaterThanOrEqual(3);
    const carriers = log.recent.map((r) => r.carrier);
    expect(carriers).toContain("ws");
    expect(carriers).toContain("http_preferred");
  });

  it("lifecycle decays activeTask on TTL", () => {
    vi.useFakeTimers();
    touchIdentityLifecycleV0({ activeTask: "briefing", carrier: "local" });
    vi.advanceTimersByTime(31 * 60 * 1000);
    const decay = runIdentityLifecycleDecayV0();
    expect(decay.activeTask).toBeNull();
    expect(decay.decayed).toBe(true);
    vi.useRealTimers();
  });

  it("presence signature is event not message", () => {
    const sig = buildPresenceSignatureV0({
      kind: PRESENCE_EVENT_KIND_V0.ACK,
      carrier: "http_preferred"
    });
    expect(sig.isPresenceEvent).toBe(true);
    expect(sig.isMessage).toBe(false);
    expect(sig.isResponse).toBe(false);
  });

  it("pulse tick unifies subsystems", () => {
    const snap = runRhizohPulseTickV1();
    expect(snap.unified).toBe(true);
    expect(snap.schema).toBe("rhizoh.pulse_loop.v1");
    expect(snap.transport.role).toBe("carrier_only");
    expect(snap.compute.isolatedFromVoice).toBe(true);
    expect(snap.eventLog.ssot).toBe(true);
  });

  it("compute adapter registry isolated from voice", () => {
    const compute = getComputeAdapterSnapshotV0();
    expect(compute.layer).toBe("compute_rendering");
    expect(compute.voicePipelineImpact).toBe(false);
  });

  it("scheduler respects focus guard", () => {
    const evalOut = evaluatePersonaSchedulerPulseV1({
      userFocused: true,
      sessionDepth: 0,
      continuity: { state: "idle" },
      lifecycle: { emotionalToneLabel: "steady", emotionalToneEma: 0.5 }
    });
    expect(evalOut.context.focusGuard).toBe(true);
    expect(evalOut.shouldEmit).toBe(false);
  });

  it("emitPresenceEvent uses live layer not governance gate", () => {
    const out = emitPresenceEventV0({
      phrase: "Buradayım.",
      kind: PRESENCE_EVENT_KIND_V0.ACK,
      carrier: "local",
      speak: false,
      observe: false
    });
    expect(out.ok).toBe(true);
    expect(out.layer).toBe("live");
    expect(out.blockingGovernance).toBe(false);
    expect(out.signature.isPresenceEvent).toBe(true);
  });
});
