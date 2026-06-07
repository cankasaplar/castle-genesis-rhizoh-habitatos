import { describe, expect, it, beforeEach } from "vitest";
import {
  __resetTranscriptAcceptanceLedgerForTestV0,
  getTranscriptAcceptanceSnapshotV0,
  recordTranscriptAcceptedV0,
  recordTranscriptRejectedV0
} from "../rhizohTranscriptAcceptanceLedgerV0.js";

describe("rhizohTranscriptAcceptanceLedgerV0", () => {
  beforeEach(() => {
    __resetTranscriptAcceptanceLedgerForTestV0();
  });

  it("tracks accepted and rejected with reason histogram", () => {
    recordTranscriptRejectedV0({ text: "Teşekkürler.", reason: "fast_noise_drop" });
    recordTranscriptRejectedV0({ text: "Altyazı M.K.", reason: "ui_chrome_echo" });
    recordTranscriptAcceptedV0({ text: "Rhizoh burada mısın", pipelinePath: "fast" });

    const snap = getTranscriptAcceptanceSnapshotV0();
    expect(snap.accepted).toBe(1);
    expect(snap.rejected).toBe(2);
    expect(snap.turnGap).toBe(false);
    expect(snap.rejectionReasons).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ reason: "fast_noise_drop", count: 1 }),
        expect.objectContaining({ reason: "ui_chrome_echo", count: 1 })
      ])
    );
  });

  it("flags turnGap when only rejections", () => {
    recordTranscriptRejectedV0({ text: "Teşekkürler.", reason: "fast_noise_drop" });
    expect(getTranscriptAcceptanceSnapshotV0().turnGap).toBe(true);
  });
});
