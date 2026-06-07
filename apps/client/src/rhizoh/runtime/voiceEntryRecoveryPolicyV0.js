/**
 * Voice entry recovery policy — event-driven side system (actuator hints only).
 *
 * LAYER SEPARATION (do not collapse):
 *   Gate     = physics law   — evaluateVoiceEntryGateV0 (decision)
 *   Trace    = sensor        — voiceGateTraceV0 (observation)
 *   Recovery = actuator hint — this module (orchestration guidance only)
 *
 * HINT INFLATION GUARD:
 * - UX orchestrator MUST consume uxHintBucket only (max 5 buckets), not per-reason branches.
 * - Granular uxHintKey is debug/internal; new keys require registry + bucket mapping update.
 * - validateVoiceEntryRecoveryHintRegistryV0() enforces closed hint set at test/CI time.
 *
 * CONTRACT (do not violate):
 * - MUST NOT import or call evaluateVoiceEntryGateV0.
 * - MUST NOT mutate gate inputs, trace snapshots, or ref state.
 * - MUST NOT subscribe to trace output or feed trace → decision.
 * - Input = VoiceEvent payload (reason string + attempt index); output = frozen hint.
 * - Execution (retry timer, UX, mic re-tap) lives in a separate orchestrator — not here.
 *
 * Flow: VoiceEvent → RecoveryPolicy (this) → [orchestrator] → UX bucket (not hint maze)
 * Never: Recovery → Gate input mutation
 */

export const VOICE_ENTRY_RECOVERY_POLICY_SCHEMA_V0 = "castle.rhizoh.voice_entry_recovery_policy.v0";

/** @type {Readonly<{ sideSystemOnly: true, maxUxBuckets: 5 }>} */
export const VOICE_ENTRY_RECOVERY_CONTRACT_V0 = Object.freeze({
  sideSystemOnly: true,
  maxUxBuckets: 5
});

/** Coarse UX buckets — orchestrator renders at most one pattern per bucket. */
export const VOICE_ENTRY_UX_HINT_BUCKET_V0 = Object.freeze({
  WAIT_SILENT: "wait_silent",
  TAP_AGAIN: "tap_again",
  PERMISSION_DEVICE: "permission_device",
  TEXT_FALLBACK: "text_fallback",
  EXHAUSTED: "exhausted"
});

/**
 * Closed granular hint registry → UX bucket (prevents decision-free UX maze).
 * @type {Readonly<Record<string, string>>}
 */
export const VOICE_ENTRY_UX_HINT_TO_BUCKET_V0 = Object.freeze({
  voice_boot_wait: VOICE_ENTRY_UX_HINT_BUCKET_V0.WAIT_SILENT,
  voice_adapter_wait: VOICE_ENTRY_UX_HINT_BUCKET_V0.WAIT_SILENT,
  presence_warming: VOICE_ENTRY_UX_HINT_BUCKET_V0.WAIT_SILENT,
  first_paint_wait: VOICE_ENTRY_UX_HINT_BUCKET_V0.WAIT_SILENT,
  shell_mount_wait: VOICE_ENTRY_UX_HINT_BUCKET_V0.WAIT_SILENT,
  mic_tap_again: VOICE_ENTRY_UX_HINT_BUCKET_V0.TAP_AGAIN,
  mic_permission_or_device: VOICE_ENTRY_UX_HINT_BUCKET_V0.PERMISSION_DEVICE,
  gateway_warm_text_fallback: VOICE_ENTRY_UX_HINT_BUCKET_V0.TEXT_FALLBACK,
  voice_retry_exhausted: VOICE_ENTRY_UX_HINT_BUCKET_V0.EXHAUSTED
});

/** @typedef {'none' | 'bounded_retry' | 'presence_recheck' | 'wait_event' | 'user_guidance'} VoiceEntryRecoveryClassV0 */

/** @type {Readonly<Record<string, { recoveryClass: VoiceEntryRecoveryClassV0, maxAttempts: number, delayMs: number, uxHintKey: string | null }>>} */
export const VOICE_ENTRY_RECOVERY_BY_REASON_V0 = Object.freeze({
  ok: Object.freeze({ recoveryClass: "none", maxAttempts: 0, delayMs: 0, uxHintKey: null }),
  unknown: Object.freeze({ recoveryClass: "none", maxAttempts: 0, delayMs: 0, uxHintKey: null }),
  voice_not_ready: Object.freeze({
    recoveryClass: "bounded_retry",
    maxAttempts: 2,
    delayMs: 400,
    uxHintKey: "voice_boot_wait"
  }),
  adapter_not_ready: Object.freeze({
    recoveryClass: "bounded_retry",
    maxAttempts: 3,
    delayMs: 320,
    uxHintKey: "voice_adapter_wait"
  }),
  presence_absent: Object.freeze({
    recoveryClass: "presence_recheck",
    maxAttempts: 3,
    delayMs: 320,
    uxHintKey: "presence_warming"
  }),
  first_paint_pending: Object.freeze({
    recoveryClass: "wait_event",
    maxAttempts: 2,
    delayMs: 280,
    uxHintKey: "first_paint_wait"
  }),
  shell_not_present: Object.freeze({
    recoveryClass: "wait_event",
    maxAttempts: 2,
    delayMs: 280,
    uxHintKey: "shell_mount_wait"
  }),
  gesture_expired: Object.freeze({
    recoveryClass: "user_guidance",
    maxAttempts: 0,
    delayMs: 0,
    uxHintKey: "mic_tap_again"
  }),
  mic_blocked: Object.freeze({
    recoveryClass: "user_guidance",
    maxAttempts: 0,
    delayMs: 0,
    uxHintKey: "mic_permission_or_device"
  }),
  gateway_delay: Object.freeze({
    recoveryClass: "bounded_retry",
    maxAttempts: 2,
    delayMs: 500,
    uxHintKey: "gateway_warm_text_fallback"
  })
});

/**
 * @param {string | null | undefined} uxHintKey
 * @returns {string | null}
 */
export function resolveVoiceEntryUxHintBucketV0(uxHintKey) {
  if (uxHintKey == null) return null;
  const key = String(uxHintKey);
  return VOICE_ENTRY_UX_HINT_TO_BUCKET_V0[key] || null;
}

/**
 * CI/test guard — closed hint set, bucket cap, no orphan keys.
 */
export function validateVoiceEntryRecoveryHintRegistryV0() {
  const granularHints = new Set(["voice_retry_exhausted"]);
  for (const rule of Object.values(VOICE_ENTRY_RECOVERY_BY_REASON_V0)) {
    if (rule.uxHintKey) granularHints.add(rule.uxHintKey);
  }
  for (const hint of granularHints) {
    if (!VOICE_ENTRY_UX_HINT_TO_BUCKET_V0[hint]) {
      return Object.freeze({ ok: false, error: `unregistered_ux_hint:${hint}` });
    }
  }
  const buckets = new Set(Object.values(VOICE_ENTRY_UX_HINT_TO_BUCKET_V0));
  if (buckets.size > VOICE_ENTRY_RECOVERY_CONTRACT_V0.maxUxBuckets) {
    return Object.freeze({
      ok: false,
      error: `ux_bucket_cap_exceeded:${buckets.size}>${VOICE_ENTRY_RECOVERY_CONTRACT_V0.maxUxBuckets}`
    });
  }
  return Object.freeze({
    ok: true,
    granularHintCount: granularHints.size,
    uxBucketCount: buckets.size
  });
}

/**
 * Pure recovery hint from a gate-fail reason — no gate re-evaluation, no side effects.
 * @param {{ reason?: string, attempt?: number }} event
 */
export function resolveVoiceEntryRecoveryHintV0(event = {}) {
  const reason = String(event.reason || "unknown");
  const attempt = Math.max(0, Number(event.attempt) || 0);
  const rule =
    VOICE_ENTRY_RECOVERY_BY_REASON_V0[reason] || VOICE_ENTRY_RECOVERY_BY_REASON_V0.unknown;
  const exhausted = rule.maxAttempts > 0 && attempt >= rule.maxAttempts;
  const shouldScheduleRetry =
    !exhausted &&
    rule.recoveryClass !== "none" &&
    rule.recoveryClass !== "user_guidance" &&
    rule.maxAttempts > 0;
  const uxHintKey = exhausted ? "voice_retry_exhausted" : rule.uxHintKey;

  return Object.freeze({
    ...VOICE_ENTRY_RECOVERY_CONTRACT_V0,
    schema: VOICE_ENTRY_RECOVERY_POLICY_SCHEMA_V0,
    reason,
    attempt,
    recoveryClass: rule.recoveryClass,
    shouldScheduleRetry,
    delayMs: rule.delayMs,
    maxAttempts: rule.maxAttempts,
    exhausted,
    uxHintKey,
    /** Orchestrator UX surface — use this, not per-reason branches. */
    uxHintBucket: resolveVoiceEntryUxHintBucketV0(uxHintKey)
  });
}
