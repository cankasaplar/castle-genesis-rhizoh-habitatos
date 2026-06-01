import { describe, expect, it } from "vitest";
import {
  ARL_BINDING_SENTENCE_V0,
  ARL_PHASE_COGNITION_PULSE_V0,
  ARL_PHASE_SILENCE_V0,
  ARL_PHASE_STABILIZE_QUIET_V0,
  resolveAttentionRhythmV0
} from "../rhizohAttentionRhythmV0.js";

describe("rhizohAttentionRhythmV0", () => {
  it("exposes ARL binding", () => {
    expect(ARL_BINDING_SENTENCE_V0).toContain("silence");
  });

  it("uses cognition_pulse when busy", () => {
    const r = resolveAttentionRhythmV0({ rhizohFieldState: "GENERATING" });
    expect(r.rhythm_phase).toBe(ARL_PHASE_COGNITION_PULSE_V0);
    expect(r.system_silence).toBe(false);
  });

  it("enters stabilize_quiet shortly after busy ends", () => {
    const r = resolveAttentionRhythmV0({
      rhizohFieldState: "IDLE",
      msSinceBusyEnd: 400
    });
    expect(r.rhythm_phase).toBe(ARL_PHASE_STABILIZE_QUIET_V0);
    expect(r.system_silence).toBe(true);
  });

  it("enters silence on sustained idle", () => {
    const r = resolveAttentionRhythmV0({
      rhizohFieldState: "IDLE",
      msSinceBusyEnd: 8000
    });
    expect(r.rhythm_phase).toBe(ARL_PHASE_SILENCE_V0);
    expect(r.anchor_emphasis).toBe("quiet");
  });
});
