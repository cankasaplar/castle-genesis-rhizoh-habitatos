/**
 * L9 Execution Feedback — motor metriklerinden gate politikası (throttle, soğuma çarpanı).
 */

import { getCastleRuntimeMetrics } from "./castleRuntimeMetrics.js";

const FPS_SOFT = 32;
const FPS_HARD = 22;

/**
 * Cooldown sürelerini uzatır (1.0 = değişmez). Arbitration aşamasında uygulanır.
 */
export function getL9CooldownMultiplier() {
  const { fpsEma } = getCastleRuntimeMetrics();
  if (fpsEma >= FPS_SOFT) return 1;
  if (fpsEma <= FPS_HARD) return 2.25;
  const t = (FPS_SOFT - fpsEma) / (FPS_SOFT - FPS_HARD);
  return 1 + t * 1.25;
}

/**
 * Arka plan L9 interval adımını seyrekleştirir (1 = her tik, 2 = her 2 tikte bir).
 */
export function getL9BackgroundTickStride() {
  const m = getL9CooldownMultiplier();
  if (m < 1.2) return 1;
  if (m < 1.65) return 2;
  return 3;
}

/**
 * propose() öncesi — cooldown yakmadan düşük öncelikli tetiklemeyi keser.
 * @returns {{ ok: boolean, reason?: string }}
 */
export function evaluateL9ProposeThrottle(trigger) {
  const { fpsEma } = getCastleRuntimeMetrics();
  const t = String(trigger || "");
  if (fpsEma >= FPS_SOFT) return { ok: true };

  if (t === "spiral_geometry" || t === "demo") {
    return { ok: false, reason: "runtime_throttle" };
  }
  if (fpsEma < FPS_HARD && t === "swarm_nexus") {
    return { ok: false, reason: "runtime_throttle_swarm" };
  }
  return { ok: true };
}
