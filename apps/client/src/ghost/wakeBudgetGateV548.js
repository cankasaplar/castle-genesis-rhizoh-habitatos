/**
 * vNext-548 — Wake bütçesi: aşırı tetikleme / dikkat dağılması önlemi.
 *
 * - max_wake_per_minute: kayan 60s pencerede üst sınır
 * - silent_stabilization_ms: epizot bittikten sonra minimum sessizlik
 * - decay normalization: baskı (pressure) zamanla sönümlenir → eşik gevşer
 */

const MS_PER_MIN = 60_000;

/**
 * @param {object} [opts]
 * @param {number} [opts.maxWakePerMinute]
 * @param {number} [opts.silentStabilizationMs] epizot → idle sonrası minimum bekleme
 * @param {number} [opts.decayHalfLifeMs] pressure01 sönüm (yarı ömür)
 * @param {number} [opts.pressurePerWake] her rising başında pressure artışı
 * @param {number} [opts.maxThresholdLift] pressure=1 iken wakeThreshold üzerine eklenen üst sınır
 */
export function createWakeBudgetGate(opts = {}) {
  const maxWakePerMinute = opts.maxWakePerMinute ?? 3;
  const silentStabilizationMs = opts.silentStabilizationMs ?? 12_000;
  const decayHalfLifeMs = opts.decayHalfLifeMs ?? 48_000;
  const pressurePerWake = opts.pressurePerWake ?? 0.22;
  const maxThresholdLift = opts.maxThresholdLift ?? 0.14;

  /** @type {number[]} */
  let wakeStartTimes = [];
  let stabilizationUntil = 0;
  /** @type {number} 0–1 birikim; sessizlikte sönümlenir */
  let pressure01 = 0;
  let lastTickMs = /** @type {number | null} */ (null);

  function prune(nowMs) {
    const cutoff = nowMs - MS_PER_MIN;
    wakeStartTimes = wakeStartTimes.filter((t) => t > cutoff);
  }

  return {
    /**
     * @param {number} nowMs
     * @param {number} dtSec
     */
    tick(nowMs, dtSec) {
      if (lastTickMs == null) lastTickMs = nowMs;
      const dtMs = Math.max(0, Math.min(2500, (nowMs - lastTickMs) || dtSec * 1000));
      lastTickMs = nowMs;
      if (decayHalfLifeMs > 0 && dtMs > 0) {
        const lambda = Math.log(2) / decayHalfLifeMs;
        pressure01 *= Math.exp(-lambda * dtMs);
        if (pressure01 < 1e-4) pressure01 = 0;
      }
      prune(nowMs);
    },

    /**
     * Efektif uyanma eşiği: taban + normalization (yüksek pressure → daha zor tetik).
     * @param {number} baseThreshold
     * @param {number} nowMs
     */
    effectiveWakeThreshold(baseThreshold, nowMs) {
      prune(nowMs);
      const lift = pressure01 * maxThresholdLift;
      return Math.min(0.92, baseThreshold + lift);
    },

    /**
     * @param {number} nowMs
     * @param {{ bypassStabilization?: boolean }} [hint] kullanıcı oracle/nudge: sessizlik penceresini atla; dakika limiti geçerli
     */
    canStartWake(nowMs, hint = {}) {
      prune(nowMs);
      if (wakeStartTimes.length >= maxWakePerMinute) return false;
      if (!hint.bypassStabilization && nowMs < stabilizationUntil) return false;
      return true;
    },

    /**
     * rising fazına geçildiğinde çağır.
     * @param {number} nowMs
     */
    recordWakeStart(nowMs) {
      prune(nowMs);
      wakeStartTimes.push(nowMs);
      pressure01 = Math.min(1, pressure01 + pressurePerWake);
    },

    /**
     * decay → idle (epizot bitti).
     * @param {number} nowMs
     */
    onEpisodeComplete(nowMs) {
      stabilizationUntil = Math.max(stabilizationUntil, nowMs + silentStabilizationMs);
    },

    getPressure01() {
      return pressure01;
    },

    getStabilizationUntil() {
      return stabilizationUntil;
    },

    reset() {
      wakeStartTimes = [];
      stabilizationUntil = 0;
      pressure01 = 0;
      lastTickMs = null;
    }
  };
}
