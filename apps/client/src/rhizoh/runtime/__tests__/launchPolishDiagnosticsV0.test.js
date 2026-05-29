import { describe, expect, it } from "vitest";
import {
  buildLaunchPolishVoiceSnapshotV0,
  listMediaTrackSnapshotV0
} from "../launchPolishDiagnosticsV0.js";

describe("launchPolishDiagnosticsV0", () => {
  it("listMediaTrackSnapshotV0 maps track fields", () => {
    const tracks = [{ kind: "audio", readyState: "live", enabled: true, muted: false, label: "mic" }];
    const stream = { getTracks: () => tracks };
    expect(listMediaTrackSnapshotV0(stream)[0].kind).toBe("audio");
  });

  it("buildLaunchPolishVoiceSnapshotV0 returns frozen snapshot", () => {
    const snap = buildLaunchPolishVoiceSnapshotV0({
      voiceTtsSessionId: 3,
      voiceTurnBusy: true,
      recognitionActive: true
    });
    expect(snap.voiceTtsSessionId).toBe(3);
    expect(snap.voiceTurnBusy).toBe(true);
    expect(snap.recognitionActive).toBe(true);
  });
});
