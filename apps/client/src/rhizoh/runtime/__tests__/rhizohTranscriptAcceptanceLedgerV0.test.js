import { describe, expect, it, beforeEach } from "vitest";
import {
  __resetTranscriptAcceptanceLedgerForTestV0,
  assessSuspectedFalseNegativeV0,
  buildTranscriptFilterForensicsV0,
  getTranscriptAcceptanceSnapshotV0,
  recordTranscriptAcceptedV0,
  recordTranscriptRejectedV0
} from "../rhizohTranscriptAcceptanceLedgerV0.js";

describe("rhizohTranscriptAcceptanceLedgerV0", () => {
  beforeEach(() => {
    __resetTranscriptAcceptanceLedgerForTestV0();
  });

  it("stores full transcript + forensics on rejection", () => {
    const row = recordTranscriptRejectedV0({
      text: "Rhizoh nasılsın bugün",
      reason: "fast_noise_drop",
      confidence: 0.62,
      maxRms: 0.08,
      band: "unknown",
      strategy: "whisper_only",
      recordedMs: 9000,
      decision: {
        speakMode: "silent",
        confidenceTier: "slow_ready",
        dropKind: "noise_drop",
        fastIntent: "noise"
      }
    });

    expect(row.transcript).toBe("Rhizoh nasılsın bugün");
    expect(row.confidence).toBe(0.62);
    expect(row.maxRms).toBe(0.08);
    expect(row.filter.meaningful).toBe(true);
    expect(row.filter.wordCount).toBe(3);
    expect(row.suspectedFalseNegative).toBe(true);
    expect(getTranscriptAcceptanceSnapshotV0().suspectedFalseNegatives).toBe(1);
  });

  it("flags ui_chrome_echo with low template score as suspected false negative", () => {
    const forensics = buildTranscriptFilterForensicsV0("Altyazı M.K.", {
      confidence: 0.4,
      maxRms: 0.13
    });
    expect(forensics.contamination?.reason).toBe("ui_chrome_echo");
    expect(
      assessSuspectedFalseNegativeV0("rejected", "ui_chrome_echo", {
        ...forensics,
        confidence: 0.4
      })
    ).toBe(false);
  });

  it("tracks accept rate and keeps last 20", () => {
    for (let i = 0; i < 22; i += 1) {
      recordTranscriptRejectedV0({ text: `reject ${i}`, reason: "fast_noise_drop" });
    }
    recordTranscriptAcceptedV0({ text: "Rhizoh burada mısın", confidence: 0.7 });

    const snap = getTranscriptAcceptanceSnapshotV0();
    expect(snap.accepted).toBe(1);
    expect(snap.rejected).toBe(22);
    expect(snap.tail.length).toBe(20);
    expect(snap.acceptRate).toBeCloseTo(1 / 23, 2);
    expect(snap.lastRejection?.preview).toBe("reject 21");
  });
});
