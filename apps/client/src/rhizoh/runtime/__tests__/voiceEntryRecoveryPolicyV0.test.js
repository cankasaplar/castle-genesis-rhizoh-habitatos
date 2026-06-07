import { describe, expect, it } from "vitest";
import {
  resolveVoiceEntryRecoveryHintV0,
  resolveVoiceEntryUxHintBucketV0,
  validateVoiceEntryRecoveryHintRegistryV0,
  VOICE_ENTRY_RECOVERY_CONTRACT_V0,
  VOICE_ENTRY_UX_HINT_BUCKET_V0
} from "../voiceEntryRecoveryPolicyV0.js";

describe("voiceEntryRecoveryPolicyV0", () => {
  it("returns bounded retry for voice_not_ready", () => {
    const hint = resolveVoiceEntryRecoveryHintV0({ reason: "voice_not_ready", attempt: 0 });
    expect(hint.recoveryClass).toBe("bounded_retry");
    expect(hint.shouldScheduleRetry).toBe(true);
    expect(hint.delayMs).toBe(400);
    expect(hint.sideSystemOnly).toBe(true);
    expect(hint.uxHintBucket).toBe(VOICE_ENTRY_UX_HINT_BUCKET_V0.WAIT_SILENT);
  });

  it("marks retry exhausted without scheduling more", () => {
    const hint = resolveVoiceEntryRecoveryHintV0({ reason: "presence_absent", attempt: 3 });
    expect(hint.exhausted).toBe(true);
    expect(hint.shouldScheduleRetry).toBe(false);
    expect(hint.uxHintKey).toBe("voice_retry_exhausted");
    expect(hint.uxHintBucket).toBe(VOICE_ENTRY_UX_HINT_BUCKET_V0.EXHAUSTED);
  });

  it("user_guidance reasons never auto-retry", () => {
    const hint = resolveVoiceEntryRecoveryHintV0({ reason: "gesture_expired", attempt: 0 });
    expect(hint.recoveryClass).toBe("user_guidance");
    expect(hint.shouldScheduleRetry).toBe(false);
    expect(hint.uxHintBucket).toBe(VOICE_ENTRY_UX_HINT_BUCKET_V0.TAP_AGAIN);
  });

  it("ok reason yields no recovery", () => {
    const hint = resolveVoiceEntryRecoveryHintV0({ reason: "ok", attempt: 0 });
    expect(hint.recoveryClass).toBe("none");
    expect(hint.shouldScheduleRetry).toBe(false);
    expect(hint.uxHintBucket).toBe(null);
  });

  it("exports frozen side-system contract", () => {
    expect(VOICE_ENTRY_RECOVERY_CONTRACT_V0.sideSystemOnly).toBe(true);
    expect(VOICE_ENTRY_RECOVERY_CONTRACT_V0.maxUxBuckets).toBe(5);
    expect(Object.isFrozen(VOICE_ENTRY_RECOVERY_CONTRACT_V0)).toBe(true);
  });

  it("collapses wait reasons to single UX bucket (hint inflation guard)", () => {
    const reasons = [
      "voice_not_ready",
      "adapter_not_ready",
      "presence_absent",
      "first_paint_pending",
      "shell_not_present"
    ];
    const buckets = reasons.map(
      (reason) => resolveVoiceEntryRecoveryHintV0({ reason, attempt: 0 }).uxHintBucket
    );
    expect(new Set(buckets)).toEqual(new Set([VOICE_ENTRY_UX_HINT_BUCKET_V0.WAIT_SILENT]));
  });

  it("validateVoiceEntryRecoveryHintRegistryV0 passes closed registry", () => {
    const v = validateVoiceEntryRecoveryHintRegistryV0();
    expect(v.ok).toBe(true);
    expect(v.uxBucketCount).toBeLessThanOrEqual(5);
    expect(resolveVoiceEntryUxHintBucketV0("voice_boot_wait")).toBe(
      VOICE_ENTRY_UX_HINT_BUCKET_V0.WAIT_SILENT
    );
  });
});
