/**
 * vNext-550 — Mikro-wake sızıntısı (perception deadlock kırıcı).
 *
 * Tam wake FSM / wake budget tüketmez; yalnızca düşük genlikli “canlılık” katar.
 */

import { meanContradiction01 } from "../habitat/runtime/wakeMoments.js";

/**
 * @param {object} [opts]
 * @param {number} [opts.baseLeak] taban genlik
 * @param {number} [opts.maxMicro] üst sınır [0–1]
 * @param {number} [opts.staleStartMs] idle bu süreden sonra sızıntı büyür
 * @param {number} [opts.staleMsForFull] stale eğrisi ölçeği
 */
export function createMicroWakeLeakEngine(opts = {}) {
  const baseLeak = opts.baseLeak ?? 0.015;
  const maxMicro = opts.maxMicro ?? 0.2;
  const staleStartMs = opts.staleStartMs ?? 6_500;
  const staleMsForFull = opts.staleMsForFull ?? 14_000;

  let phase = 0;
  let idleAccumMs = 0;

  return {
    /**
     * @param {import("../bridge/CastleFieldBridge.js").CastleFieldBridgeFrame} frame
     * @param {{ wakePhase: string, resistance01: number, dtSec: number }} io
     * @returns {number} 0..maxMicro
     */
    sample(frame, io) {
      const dt = Math.max(0, Math.min(0.12, io.dtSec));
      if (io.wakePhase !== "idle") {
        idleAccumMs = 0;
        return 0;
      }

      idleAccumMs += dt * 1000;
      const contra = meanContradiction01(frame);
      const r = Math.max(0, Math.min(1, io.resistance01));
      const fieldCoupling = contra * (0.038 + (1 - r) * 0.052);

      let stale01 = 0;
      if (idleAccumMs > staleStartMs) {
        stale01 = Math.min(1, (idleAccumMs - staleStartMs) / staleMsForFull);
      }

      const leak = baseLeak + fieldCoupling * (0.52 + stale01 * 0.9);
      phase += dt * (0.4 + contra * 1.1);
      const shim = Math.sin(phase) * 0.5 + 0.5;
      return Math.min(maxMicro, leak * (0.6 + shim * 0.4));
    },

    reset() {
      phase = 0;
      idleAccumMs = 0;
    }
  };
}
