/**
 * RESL presentation → RhizohPresenceField / QPP kinetics bridge.
 * Uses unified presence frame when available (global clock).
 */

import { sampleT0PresenceFrameV0 } from "./rhizohT0UnifiedPresenceFrameV0.js";

/**
 * @param {object | null} resl
 * @param {ReturnType<typeof sampleT0PresenceFrameV0> | null} [frame]
 */
export function reslToQppKineticsV0(resl, frame = null) {
  const unified = frame || sampleT0PresenceFrameV0();
  const orb = resl?.orbModulation;
  const feel = resl?.transitionFeel;
  const intensity = Number(unified?.surfaces?.orb?.intensity01 ?? orb?.intensity01) || 0.65;
  const breathe01 = Number(unified?.surfaces?.field?.breathe01 ?? unified?.breathe01) || 0;
  const breathe = breathe01 > 0.2 || orb?.breathe === true;
  const breathSec = Math.max(
    2.8,
    Math.min(7.5, (Number(unified?.breathPeriodMs ?? orb?.breathPeriodMs) || 4200) / 1000)
  );
  const felDampen = Number(unified?.fel?.dampen01 ?? 1);

  return Object.freeze({
    slowBreath: breathe ? 0.95 + (1 - breathe01) * 0.35 : 2.6,
    traceBreathSec: breathSec,
    blurExtraPx: feel?.felDampen01 ? Math.round(feel.felDampen01 * 6 * (1 - felDampen)) : 0,
    resonanceLineSecScale: breathe ? 0.95 + intensity * 0.35 : 0.72,
    orbitDriftScale: breathe ? 0.92 + intensity * 0.2 : 0.7,
    unifiedBreathe01: breathe01,
    fieldPulse01: Number(unified?.surfaces?.field?.pulse01) || 0
  });
}

/**
 * @param {import("./rhizohReslPresentationPolicyV0.js").ReturnType<typeof import("./rhizohReslPresentationPolicyV0.js").resolveReslPresentationV0> | null} resl
 */
export function reslToPresenceFieldLabelV0(resl) {
  const line = String(resl?.continuityLine || "").trim();
  if (line) return line;
  const badge = String(resl?.presenceBadge?.label || "").trim();
  return badge || "present";
}
