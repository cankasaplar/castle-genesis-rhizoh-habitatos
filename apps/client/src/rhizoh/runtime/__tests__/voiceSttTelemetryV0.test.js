import { describe, expect, it, afterEach } from "vitest";
import {
  getVoiceSttTelemetrySnapshotV0,
  installVoiceSttTelemetryV0,
  noteVoiceSttEventV0,
  resetVoiceSttTelemetryForTestV0
} from "../voiceSttTelemetryV0.js";
import { stampVoiceUserGestureV0, resetVoiceUserGestureAnchorForTestV0 } from "../voiceUserGestureAnchorV0.js";

describe("voiceSttTelemetryV0", () => {
  afterEach(() => {
    resetVoiceSttTelemetryForTestV0();
    resetVoiceUserGestureAnchorForTestV0();
  });

  it("installs live voiceStt getter before any STT session", () => {
    installVoiceSttTelemetryV0();
    const snap = getVoiceSttTelemetrySnapshotV0();
    expect(snap.telemetryInstalled).toBe(true);
    expect(snap.lastEvent?.tag).toBe("STT_TELEMETRY_READY");
  });

  it("tracks session lifecycle and gesture anchor in snapshot", () => {
    installVoiceSttTelemetryV0();
    stampVoiceUserGestureV0("mic_button");
    noteVoiceSttEventV0("STT_SESSION_BEGIN", { lang: "tr-TR", continuous: false, keepAlive: true });
    noteVoiceSttEventV0("STT_HANDLERS_ATTACHED", { lang: "tr-TR" });
    noteVoiceSttEventV0("STT_START", { lang: "tr-TR" });
    noteVoiceSttEventV0("STT_RESULT", { isFinal: false, chars: 4, preview: "merh" });
    noteVoiceSttEventV0("STT_INTERIM", { chars: 4 });
    noteVoiceSttEventV0("STT_FINAL", { chars: 8, preview: "merhaba" });

    const snap = getVoiceSttTelemetrySnapshotV0();
    expect(snap.handlersAttached).toBe(true);
    expect(snap.hasOnstart).toBe(true);
    expect(snap.hasAnyResult).toBe(true);
    expect(snap.finalCount).toBe(1);
    expect(snap.lang).toBe("tr-TR");
    expect(snap.voiceGestureAnchor?.trustLevel).toBe("full");
  });
});
