import { describe, expect, it, beforeEach } from "vitest";
import {
  emitLivePresenceV0,
  getLiveLayerSnapshotV0,
  __resetLiveLayerForTestV0
} from "../rhizohLiveLayerV0.js";
import {
  scheduleThinkingObservationV0,
  runThinkingObservationV0,
  getThinkingLayerSnapshotV0,
  __flushThinkingQueueForTestV0,
  __resetThinkingLayerForTestV0
} from "../rhizohThinkingLayerV0.js";
import { emitPresenceEventV0, PRESENCE_EVENT_KIND_V0 } from "../rhizohPresenceSignatureV0.js";
import { governPulseEmissionV0 } from "../rhizohPulseGovernanceV0.js";
import { __resetIdentityEventLogForTestV0 } from "../rhizohIdentityEventLogV0.js";
import { __resetIdentityLifecycleForTestV0 } from "../rhizohIdentityLifecycleV0.js";
import { __resetPulseGovernanceForTestV0 } from "../rhizohPulseGovernanceV0.js";
import { __resetGroundingLayerForTestV1 } from "../rhizohGroundingLayerV1.js";

describe("rhizohLiveThinkingLayerV0", () => {
  beforeEach(() => {
    __resetLiveLayerForTestV0();
    __resetThinkingLayerForTestV0();
    __resetIdentityEventLogForTestV0();
    __resetIdentityLifecycleForTestV0();
    __resetPulseGovernanceForTestV0();
    __resetGroundingLayerForTestV1();
  });

  it("live layer emits immediately without governance block", () => {
    const out = emitLivePresenceV0({
      phrase: "Buradayım.",
      kind: PRESENCE_EVENT_KIND_V0.ACK,
      speak: false,
      observe: false
    });
    expect(out.ok).toBe(true);
    expect(out.layer).toBe("live");
    expect(out.blockingGovernance).toBe(false);
    expect(out.fireAndForget).toBe(true);
  });

  it("presence event delegates to live layer never suppressed", () => {
    const out = emitPresenceEventV0({
      phrase: "Buradayım.",
      speak: false,
      observe: false
    });
    expect(out.ok).toBe(true);
    expect(out.layer).toBe("live");
  });

  it("thinking layer runs async observation after live", () => {
    emitLivePresenceV0({
      phrase: "Buradayım.",
      source: "instant_presence",
      userInitiated: true,
      speak: false
    });
    __flushThinkingQueueForTestV0();
    const snap = getThinkingLayerSnapshotV0();
    expect(snap.observationCount).toBeGreaterThan(0);
    expect(snap.blocksExecution).toBe(false);
    expect(snap.lastObservation?.observationOnly).toBe(true);
    expect(snap.lastObservation?.blockedLive).toBe(false);
  });

  it("governance observation wouldBlock but does not block live", () => {
    const governed = governPulseEmissionV0(
      { type: "transport_switch", phrase: "ws fail" },
      { eventLog: { recent: [] } }
    );
    expect(governed.observationOnly).toBe(true);
    expect(governed.wouldBlock).toBe(true);
    expect(governed.shouldRoute).toBe(true);
  });

  it("live layer snapshot marks critical path", () => {
    emitLivePresenceV0({ phrase: "test", speak: false, observe: false });
    const snap = getLiveLayerSnapshotV0();
    expect(snap.blocksOnGovernance).toBe(false);
    expect(snap.role).toBe("critical_path");
  });

  it("thinking observation writes identity async", () => {
    runThinkingObservationV0({
      source: "instant_presence",
      phrase: "Buradayım.",
      kind: PRESENCE_EVENT_KIND_V0.ACK,
      intent: "presence",
      userInitiated: true,
      incrementTurn: true
    });
    const snap = getThinkingLayerSnapshotV0();
    expect(snap.observationCount).toBe(0);
    scheduleThinkingObservationV0({
      source: "test",
      phrase: "x",
      kind: PRESENCE_EVENT_KIND_V0.ACK,
      incrementTurn: true
    });
    __flushThinkingQueueForTestV0();
    expect(getThinkingLayerSnapshotV0().observationCount).toBe(1);
  });
});
