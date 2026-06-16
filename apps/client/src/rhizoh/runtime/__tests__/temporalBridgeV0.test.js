import { describe, expect, it, beforeEach } from "vitest";
import {
  VOICE_TEMPORAL_MODE_V0,
  RHIZOH_TEMPORAL_MODE_EVENT_V0,
  enterReplayModeV0,
  exitReplayModeV0,
  getVoiceTemporalModeV0,
  getMutedReplayVoiceSnapshotV0,
  isReplayModeActiveV0,
  shouldMuteVoiceOutputV0,
  __resetTemporalBridgeForTestV0
} from "../temporalBridgeV0.js";
import { __resetRhizohCatchUpGuardForTestV0 } from "../rhizohCatchUpGuardV0.js";
import { emitVoiceOutputWithFallbackV0, __resetVoiceOutputAdapterChainForTestV0 } from "../rhizohVoiceOutputAdapterChainV0.js";

describe("temporalBridgeV0", () => {
  beforeEach(() => {
    __resetTemporalBridgeForTestV0();
    __resetRhizohCatchUpGuardForTestV0();
    __resetVoiceOutputAdapterChainForTestV0();
    window.__rhizoh = {};
  });

  it("enters MUTED_REPLAY voice mode during catch-up", () => {
    expect(getVoiceTemporalModeV0()).toBe(VOICE_TEMPORAL_MODE_V0.LIVE);
    enterReplayModeV0("test");
    expect(getVoiceTemporalModeV0()).toBe(VOICE_TEMPORAL_MODE_V0.MUTED_REPLAY);
    expect(isReplayModeActiveV0()).toBe(true);
    expect(shouldMuteVoiceOutputV0()).toBe(true);
    exitReplayModeV0("test");
    expect(getVoiceTemporalModeV0()).toBe(VOICE_TEMPORAL_MODE_V0.LIVE);
  });

  it("publishes temporal mode event on replay enter/exit", () => {
    const events = [];
    window.addEventListener(RHIZOH_TEMPORAL_MODE_EVENT_V0, (ev) => events.push(ev.detail));
    enterReplayModeV0("test");
    exitReplayModeV0("test");
    expect(events[0]).toEqual(expect.objectContaining({ voiceMode: VOICE_TEMPORAL_MODE_V0.MUTED_REPLAY }));
    expect(events[1]).toEqual(expect.objectContaining({ voiceMode: VOICE_TEMPORAL_MODE_V0.LIVE }));
  });

  it("queues voice output instead of speaking during replay", () => {
    enterReplayModeV0("test");
    const out = emitVoiceOutputWithFallbackV0("Haritaya gidiyorum.", () => true, { source: "test" });
    expect(out.suppressed).toBe(true);
    expect(out.channel).toBe(VOICE_TEMPORAL_MODE_V0.MUTED_REPLAY);
    expect(getMutedReplayVoiceSnapshotV0().count).toBe(1);
    exitReplayModeV0("test");
  });
});
