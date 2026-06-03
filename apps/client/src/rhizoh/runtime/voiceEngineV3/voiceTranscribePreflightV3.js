/**
 * Voice v3 — pre-flight transcribe routing (before any upload).
 * Observation / transport policy only — not layer execution authority.
 */

export const VOICE_TRANSCRIBE_PREFLIGHT_V3 = Object.freeze({
  /** Full hybrid path below this size + duration. */
  directBothMaxBytes: 96_000,
  directBothMaxMs: 7_200,
  /** Single-upload fast path band. */
  directFastMinBytes: 96_000,
  directFastMinMs: 7_200,
  /** Split upload when payload exceeds duration threshold (default: 12s single pass). */
  splitMinBytes: 180_000,
  splitMinMs: 12_000,
  splitMinChunks: 3,
  maxSegmentBytes: 58_000,
  /** Typical ~10s take → at most two upload segments. */
  splitTargetMaxSegments: 2
});

/**
 * @param {{ bytes?: number, recordedMs?: number, chunkCount?: number }} input
 */
export function planVoiceTranscribePreflightV3(input = {}) {
  const bytes = Math.max(0, Number(input.bytes) || 0);
  const recordedMs = Math.max(0, Number(input.recordedMs) || 0);
  const chunkCount = Math.max(0, Number(input.chunkCount) || 0);

  const largeBytes = bytes >= VOICE_TRANSCRIBE_PREFLIGHT_V3.splitMinBytes;
  const longTake = recordedMs >= VOICE_TRANSCRIBE_PREFLIGHT_V3.splitMinMs;
  const canSplit = chunkCount >= VOICE_TRANSCRIBE_PREFLIGHT_V3.splitMinChunks;

  if ((largeBytes || longTake) && canSplit) {
    const maxSegmentBytes = Math.max(
      VOICE_TRANSCRIBE_PREFLIGHT_V3.maxSegmentBytes,
      Math.ceil(bytes / VOICE_TRANSCRIBE_PREFLIGHT_V3.splitTargetMaxSegments)
    );
    const estSegments = Math.min(
      VOICE_TRANSCRIBE_PREFLIGHT_V3.splitTargetMaxSegments,
      Math.max(2, Math.ceil(bytes / maxSegmentBytes))
    );
    return Object.freeze({
      mode: "split",
      path: "accurate",
      reason: largeBytes && longTake ? "bytes_and_duration" : largeBytes ? "bytes" : "duration",
      bytes,
      recordedMs,
      chunkCount,
      segmentCount: estSegments,
      maxSegmentBytes
    });
  }

  if (
    bytes >= VOICE_TRANSCRIBE_PREFLIGHT_V3.directFastMinBytes ||
    recordedMs >= VOICE_TRANSCRIBE_PREFLIGHT_V3.directFastMinMs
  ) {
    return Object.freeze({
      mode: "direct",
      path: "fast",
      reason: canSplit ? "payload_medium" : "payload_medium_no_split",
      bytes,
      recordedMs,
      chunkCount,
      segmentCount: 1,
      maxSegmentBytes: VOICE_TRANSCRIBE_PREFLIGHT_V3.maxSegmentBytes
    });
  }

  return Object.freeze({
    mode: "direct",
    path: "both",
    reason: "payload_normal",
    bytes,
    recordedMs,
    chunkCount,
    segmentCount: 1,
    maxSegmentBytes: VOICE_TRANSCRIBE_PREFLIGHT_V3.maxSegmentBytes
  });
}

/**
 * @param {{ mode: string, path: string }} plan
 * @param {number} attempt zero-based retry index
 * @returns {"fast" | "accurate" | "both"}
 */
export function resolveTranscribeRetryPathV3(plan, attempt) {
  const base = plan?.path === "fast" || plan?.path === "accurate" || plan?.path === "both" ? plan.path : "both";
  if (attempt <= 0) return base;
  if (attempt === 1) return base === "accurate" ? "fast" : "accurate";
  return base === "both" ? "fast" : "both";
}
