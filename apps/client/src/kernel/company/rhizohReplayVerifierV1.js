import { reduceRhizohEventLogV1 } from "./rhizohStateReducerV1.js";

export const RHIZOH_REPLAY_VERIFIER_VERSION = "v1";

export function verifyRhizohReplayTraceV1(events) {
  const reduced = reduceRhizohEventLogV1(events);
  const checks = [];
  const src = events ?? [];
  for (let i = 0; i < reduced.frames.length; i++) {
    const frame = reduced.frames[i];
    const event = src[i] ?? {};
    const expected = event.snapshotHash ?? null;
    const actual = frame.reconstructedSnapshotHash;
    checks.push(
      Object.freeze({
        frameId: frame.frameId,
        eventId: frame.eventId,
        eventType: frame.eventType,
        expectedSnapshotHash: expected,
        reconstructedSnapshotHash: actual,
        ok: expected === null ? true : expected === actual
      })
    );
  }
  const divergenceFrames = checks.filter((c) => !c.ok);
  return Object.freeze({
    verifierVersion: RHIZOH_REPLAY_VERIFIER_VERSION,
    frameCount: checks.length,
    divergenceCount: divergenceFrames.length,
    ok: divergenceFrames.length === 0,
    checks: Object.freeze(checks),
    divergenceFrames: Object.freeze(divergenceFrames),
    reduced
  });
}

