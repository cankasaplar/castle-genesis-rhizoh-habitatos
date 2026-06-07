import { describe, expect, it, beforeEach } from "vitest";
import {
  emitVoiceOutputWithFallbackV0,
  getVoiceOutputAdapterSnapshotV0,
  __resetVoiceOutputAdapterChainForTestV0
} from "../rhizohVoiceOutputAdapterChainV0.js";
import {
  bindTurnIdentityV0,
  getIdentityContinuitySnapshotV0,
  __resetIdentityContinuityForTestV0
} from "../rhizohIdentityContinuityCoreV0.js";
import {
  resolveGatewayTransportV0,
  noteGatewayWsUpgradeFailedV0,
  __resetGatewayTransportFallbackForTestV0
} from "../rhizohGatewayTransportFallbackV0.js";
import { resetTurnSovereigntyStateForTestsV0 } from "../behavioralTurnSovereigntyV0.js";
import { __resetIdentityEventLogForTestV0 } from "../rhizohIdentityEventLogV0.js";
import { __resetIdentityLifecycleForTestV0 } from "../rhizohIdentityLifecycleV0.js";

describe("rhizohVoicePersonaStackV0", () => {
  beforeEach(() => {
    __resetVoiceOutputAdapterChainForTestV0();
    __resetIdentityContinuityForTestV0();
    __resetGatewayTransportFallbackForTestV0();
    __resetIdentityEventLogForTestV0();
    __resetIdentityLifecycleForTestV0();
    resetTurnSovereigntyStateForTestsV0();
  });

  it("voice output chain never user-facing dead", () => {
    const snap = getVoiceOutputAdapterSnapshotV0();
    expect(snap.userFacingDead).toBe(false);
    expect(snap.textBufferAvailable).toBe(true);
  });

  it("falls back to text buffer when TTS fn fails", () => {
    const out = emitVoiceOutputWithFallbackV0("Buradayım.", () => false, { source: "test" });
    expect(out.ok).toBe(true);
    expect(out.channel).toBe("text_output_buffer");
  });

  it("identity continuity accumulates turns via event log SSOT", () => {
    bindTurnIdentityV0({ intent: "presence", preview: "rhizoh", modality: "voice" });
    const snap = getIdentityContinuitySnapshotV0();
    expect(snap.turnCount).toBe(1);
    expect(snap.whoAmI).toContain("Rhizoh");
    expect(snap.loopActive).toBe(true);
    expect(snap.ssot).toBe("identity_event_log");
    expect(snap.eventLog.count).toBeGreaterThan(0);
  });

  it("gateway HTTP preferred after WS upgrade fail", () => {
    noteGatewayWsUpgradeFailedV0("test");
    const t = resolveGatewayTransportV0();
    expect(t.wsUpgradeFailed).toBe(true);
    expect(t.castlePresenceViaHttp).toBe(true);
  });
});
