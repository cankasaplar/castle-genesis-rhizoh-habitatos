import { describe, expect, it } from "vitest";
import {
  buildVoiceGateTraceSnapshotV0,
  VOICE_GATE_TRACE_CONTRACT_V0
} from "../voiceGateTraceV0.js";

describe("voiceGateTraceV0", () => {
  it("captures gate fail input combination", () => {
    const snap = buildVoiceGateTraceSnapshotV0({
      gate: {
        allow_listen: false,
        reason: "voice_not_ready",
        silent_presence: true,
        first_paint_ok: true,
        voice_ready_coherence: { presence: { rhizoh_is_present: true, silence_form: "active_idle" } }
      },
      refs: { voiceReady: false, fieldState: "IDLE" },
      attempt: "initial"
    });
    expect(snap.allow_listen).toBe(false);
    expect(snap.reason).toBe("voice_not_ready");
    expect(snap.voiceReady).toBe(false);
    expect(snap.field).toBe("IDLE");
    expect(snap.ref_drift).toBe(false);
    expect(snap.ephemeral).toBe(true);
    expect(snap.observabilityOnly).toBe(true);
  });

  it("flags ref drift when UI state diverges from refs", () => {
    const snap = buildVoiceGateTraceSnapshotV0({
      gate: { allow_listen: true, reason: "ok", silent_presence: false, first_paint_ok: true },
      refs: { voiceReady: true, fieldState: "IDLE" },
      ui: { voiceReady: false, fieldState: "LISTENING" },
      attempt: "after_prewarm"
    });
    expect(snap.ref_drift).toBe(true);
    expect(snap.voiceReadyUi).toBe(false);
    expect(snap.fieldUi).toBe("LISTENING");
  });

  it("does not mutate gate input (read-only snapshot)", () => {
    const gate = Object.freeze({
      allow_listen: false,
      reason: "presence_absent",
      silent_presence: true,
      first_paint_ok: true
    });
    buildVoiceGateTraceSnapshotV0({ gate, refs: { voiceReady: true, fieldState: "IDLE" } });
    expect(gate.reason).toBe("presence_absent");
  });

  it("exports frozen observability contract", () => {
    expect(VOICE_GATE_TRACE_CONTRACT_V0.observabilityOnly).toBe(true);
    expect(VOICE_GATE_TRACE_CONTRACT_V0.ephemeral).toBe(true);
    expect(Object.isFrozen(VOICE_GATE_TRACE_CONTRACT_V0)).toBe(true);
  });
});
