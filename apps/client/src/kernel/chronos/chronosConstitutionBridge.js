/**
 * chronosReschedule — after constitutional mutation, temporal fabric updates.
 */

import { clamp01 } from "../constitutional/constitutionalState.js";

/**
 * @typedef {object} ChronosSchedule
 * @property {number} version
 * @property {number} wakeCycle
 * @property {number} verificationCadence
 * @property {number} memoryCompaction
 * @property {number} sovereignReview
 * @property {number} [nextWakeAt]
 * @property {number} [nextVerificationAt]
 * @property {number} [nextCompactionAt]
 * @property {number} [nextSovereignReviewAt]
 * @property {"LOW" | "NORMAL" | "URGENT" | "SOVEREIGN"} priorityClass
 */

/**
 * @param {object} o
 * @param {ChronosSchedule | null} [o.prevSchedule]
 * @param {boolean} o.mutationApplied
 * @param {number} o.sovereignTier [0..1]
 * @param {number} o.now
 * @param {number} o.drift [0..1]
 * @param {number} [o.contradiction] [0..1]
 * @param {number} [o.discomfort] [0..1]
 * @returns {ChronosSchedule}
 */
export function chronosReschedule({
  prevSchedule,
  mutationApplied,
  sovereignTier,
  now,
  drift,
  contradiction = 0,
  discomfort = 0
}) {
  const base = prevSchedule || {
    version: 0,
    wakeCycle: 1,
    verificationCadence: 1,
    memoryCompaction: 2.5,
    sovereignReview: 6
  };

  const st = clamp01(sovereignTier);
  const d = clamp01(drift);
  const k = clamp01(contradiction);
  const u = clamp01(discomfort);
  const version = base.version + (mutationApplied ? 1 : 0);
  const urgency = clamp01(k * 0.45 + u * 0.35 + st * 0.2);

  const wakeCycle = clamp01((mutationApplied ? base.wakeCycle * 0.94 : base.wakeCycle) * (1 - urgency * 0.22));
  const verificationCadence = clamp01(
    Math.max(0.12, base.verificationCadence * (1 - st * 0.08 - d * 0.05 - urgency * 0.14))
  );
  const memoryCompaction = clamp01(base.memoryCompaction * (1 - d * 0.04));
  const sovereignReview = clamp01(base.sovereignReview * (1 + st * 0.06));
  const priorityClass =
    st >= 0.84 ? "SOVEREIGN" : urgency >= 0.72 ? "URGENT" : urgency >= 0.38 ? "NORMAL" : "LOW";

  return {
    version,
    wakeCycle,
    verificationCadence,
    memoryCompaction,
    sovereignReview,
    priorityClass,
    nextWakeAt: now + wakeCycle,
    nextVerificationAt: now + verificationCadence,
    nextCompactionAt: now + memoryCompaction,
    nextSovereignReviewAt: now + sovereignReview
  };
}
