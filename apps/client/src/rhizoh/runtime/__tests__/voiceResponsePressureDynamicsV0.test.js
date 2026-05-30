import { describe, expect, it, beforeEach } from "vitest";
import { VOICE_DIRECTED_SPEECH_BAND } from "../voiceDirectedSpeechObservationV0.js";
import {
  resetResponsePressureDynamicsForTestV0,
  tickResponsePressureDynamicsV0
} from "../voiceResponsePressureDynamicsV0.js";

describe("voiceResponsePressureDynamicsV0", () => {
  beforeEach(() => resetResponsePressureDynamicsForTestV0());

  it("raises pressure under shared_focus", () => {
    const a = tickResponsePressureDynamicsV0({
      basePressure: 0.25,
      pressureCap: 0.45,
      sharedAttentionType: "shared_focus",
      event: "speech",
      text: "bak şuna"
    });
    expect(a.dynamicPressure).toBeGreaterThan(0.25);
  });

  it("collapses under ambient noise", () => {
    tickResponsePressureDynamicsV0({
      basePressure: 0.35,
      pressureCap: 0.45,
      band: VOICE_DIRECTED_SPEECH_BAND.AMBIENT,
      event: "ambient_noise"
    });
    const b = tickResponsePressureDynamicsV0({
      basePressure: 0.35,
      pressureCap: 0.45,
      band: VOICE_DIRECTED_SPEECH_BAND.AMBIENT,
      event: "ambient_noise"
    });
    expect(b.dynamicPressure).toBeLessThan(0.1);
  });

  it("lowers pressure as silence accumulates", () => {
    const t0 = 1_000_000;
    tickResponsePressureDynamicsV0({
      atMs: t0,
      basePressure: 0.3,
      pressureCap: 0.45,
      event: "speech",
      text: "merhaba"
    });
    const silent = tickResponsePressureDynamicsV0({
      atMs: t0 + 120_000,
      basePressure: 0.3,
      pressureCap: 0.45,
      event: "stream_empty"
    });
    expect(silent.dynamicPressure).toBeLessThan(0.3);
  });
});
