/**
 * vNext-560 — Rhythmic phase memory layer
 *
 * Burst geçmişi özeti, yorgunluk iyileşme modeli (çift zaman sabiti),
 * uzun dönem osilasyon parmak izi, saat/gün bazlı engagement önceliği (seasonal prior).
 *
 * v559 ile: ritim fazı artık olay dizisi + öğrenilen aralık önerisi; faz kilidi / erken kapanma
 * riskine karşı soğuma ve parmak izi gözlemlenebilirlik sağlar.
 *
 * Çoklu ajan: `crossAgentRhythmSyncV561` — kolektif faz, viral senkron sinyali, desync koruması.
 */

function clamp01(x) {
  return Math.max(0, Math.min(1, x));
}

/**
 * @typedef {{ startMs: number, endMs: number | null, boredom01: number, runaway01: number }} BurstPhaseRecord
 */

/**
 * Burst başlangıç/bitiş kaydı → ortalama aralık, önerilen cooldown çarpanı.
 * @param {{ maxEvents?: number }} [opts]
 */
export function createBurstPhaseMemory(opts = {}) {
  const max = Math.max(8, Math.min(128, opts.maxEvents ?? 48));
  /** @type {BurstPhaseRecord[]} */
  const events = [];
  /** @type {BurstPhaseRecord | null} */
  let open = null;

  return {
    /** @param {number} nowMs */
    onBurstStart(nowMs, meta = {}) {
      const t = Number(nowMs) || Date.now();
      open = {
        startMs: t,
        endMs: null,
        boredom01: clamp01(meta.boredom01 ?? 0),
        runaway01: clamp01(meta.runaway01 ?? 0)
      };
    },

    /** @param {number} nowMs */
    onBurstEnd(nowMs) {
      if (!open) return;
      const t = Number(nowMs) || Date.now();
      const rec = { ...open, endMs: t };
      events.push(rec);
      while (events.length > max) events.shift();
      open = null;
    },

    /** v559 adımı: önceki ve şimdiki inBurst ile geçişleri kaydet */
    ingestFromRhythmStep(prevInBurst, step, nowMs) {
      const t = Number(nowMs) || Date.now();
      const inB = Boolean(step?.inBurst);
      if (!prevInBurst && inB) {
        this.onBurstStart(t, {
          boredom01: step?.shapedBoredom01,
          runaway01: step?.runawayRisk01
        });
      } else if (prevInBurst && !inB) {
        this.onBurstEnd(t);
      }
    },

    /** Son tamamlanmış burst’lar arası ortalama ms; yoksa null */
    averageInterBurstIntervalMs() {
      const completed = events.filter((e) => e.endMs != null && e.endMs > e.startMs);
      if (completed.length < 2) return null;
      let sum = 0;
      let n = 0;
      for (let i = 1; i < completed.length; i++) {
        sum += completed[i].startMs - completed[i - 1].startMs;
        n++;
      }
      return n > 0 ? sum / n : null;
    },

    /**
     * Öğrenilen aralığa göre min cooldown önerisi (sınırlı).
     * @param {number} baseMinMs
     * @param {{ learnRate01?: number, maxStretch01?: number }} [tune]
     */
    suggestCooldownMs(baseMinMs, tune = {}) {
      const base = Math.max(1000, Number(baseMinMs) || 14_000);
      const avg = this.averageInterBurstIntervalMs();
      if (avg == null || !Number.isFinite(avg)) return base;
      const lr = clamp01(tune.learnRate01 ?? 0.22);
      const stretch = clamp01(tune.maxStretch01 ?? 0.35);
      const target = base + (avg - base) * lr;
      const hi = base * (1 + stretch);
      const lo = base * (1 - stretch * 0.25);
      return Math.round(Math.max(lo, Math.min(hi, target)));
    },

    recentRecords(n = 8) {
      return Object.freeze(events.slice(-n));
    },

    reset() {
      events.length = 0;
      open = null;
    }
  };
}

/**
 * İki zaman sabitli yorgunluk iyileşmesi: derin yorgunlukta daha yavaş λ.
 * @param {number} fatigue01
 * @param {number} dtSec
 * @param {{ deepThreshold01?: number, lambdaFast?: number, lambdaSlow?: number }} [opts]
 */
export function tickFatigueRecoveryModel(fatigue01, dtSec, opts = {}) {
  const f = clamp01(fatigue01);
  const dt = Math.max(0, Math.min(0.15, dtSec));
  const deepTh = clamp01(opts.deepThreshold01 ?? 0.52);
  const lamF = opts.lambdaFast ?? 0.34;
  const lamS = opts.lambdaSlow ?? 0.16;
  const lam = f > deepTh ? lamS : lamF;
  return clamp01(f * Math.exp(-dt * lam));
}

/**
 * Osilasyon riski dizisi → uzun dönem parmak izi (deterministik özet).
 * @param {{ windowSize?: number }} [opts]
 */
export function createLongTermOscillationFingerprint(opts = {}) {
  const w = Math.max(12, Math.min(256, opts.windowSize ?? 64));
  /** @type {number[]} */
  const buf = [];

  return {
    push(oscillationRisk01) {
      buf.push(clamp01(oscillationRisk01));
      while (buf.length > w) buf.shift();
    },

    fingerprint01() {
      if (!buf.length) {
        return Object.freeze({
          mean01: 0,
          variance01: 0,
          zeroCrossRate01: 0,
          energy01: 0,
          sampleCount: 0
        });
      }
      const n = buf.length;
      let sum = 0;
      for (const x of buf) sum += x;
      const mean = sum / n;
      let v = 0;
      for (const x of buf) v += (x - mean) ** 2;
      v /= Math.max(1, n);
      let crosses = 0;
      for (let i = 1; i < n; i++) {
        const a = buf[i - 1] - mean;
        const b = buf[i] - mean;
        if (a * b < 0) crosses++;
      }
      const zeroCrossRate01 = clamp01(crosses / Math.max(1, n - 1));
      const energy01 = clamp01(mean + Math.sqrt(v) * 0.85);
      return Object.freeze({
        mean01: clamp01(mean),
        variance01: clamp01(v * 1.15),
        zeroCrossRate01,
        energy01,
        sampleCount: n
      });
    },

    reset() {
      buf.length = 0;
    }
  };
}

/**
 * UTC saat + hafta içi/sonu ile yumuşak engagement önceliği [0–1].
 * @param {number} [nowMs]
 * @param {{ hourPeakShiftRad?: number, weekendBump01?: number }} [opts]
 */
export function seasonalEngagementPrior01(nowMs = Date.now(), opts = {}) {
  const d = new Date(Number(nowMs) || Date.now());
  const hour = d.getUTCHours();
  const dow = d.getUTCDay();
  const hourPhase = (2 * Math.PI * hour) / 24;
  const shift = opts.hourPeakShiftRad ?? 1.15;
  const seasonal = 0.48 + 0.38 * Math.sin(hourPhase - shift);
  const weekend = dow === 0 || dow === 6 ? clamp01(opts.weekendBump01 ?? 0.09) : 0;
  return clamp01(seasonal + weekend);
}

/**
 * Ham aktiviteyi mevsim önceliği ile karıştırır (uzun dönem bellek ipucu).
 */
export function blendEngagementWithSeason(rawActivity01, nowMs, seasonBlend01 = 0.2) {
  const raw = clamp01(rawActivity01);
  const sw = clamp01(seasonBlend01);
  const prior = seasonalEngagementPrior01(nowMs);
  return clamp01(raw * (1 - sw) + prior * sw);
}

/**
 * Tek nesnede bellek + parmak izi; ritim governor beslemesi için.
 * @param {object} [opts]
 */
export function createRhythmicPhaseMemoryLayer(opts = {}) {
  const burstMemory = createBurstPhaseMemory(opts.burst);
  const oscillationFp = createLongTermOscillationFingerprint(opts.oscillation);

  let lastRhythmInBurst = false;

  return {
    burstMemory,
    oscillationFp,

    /**
     * @param {object} rhythmStep v559 step çıktısı
     * @param {number} nowMs
     * @param {number} [rawActivity01] seasonal blend öncesi veya sonra (çağıran seçer)
     */
    ingestRhythmStep(rhythmStep, nowMs, rawActivity01) {
      const t = Number(nowMs) || Date.now();
      burstMemory.ingestFromRhythmStep(lastRhythmInBurst, rhythmStep, t);
      lastRhythmInBurst = Boolean(rhythmStep?.inBurst);
      if (rhythmStep?.oscillationRisk01 != null) {
        oscillationFp.push(rhythmStep.oscillationRisk01);
      }
    },

    /** @param {number} baseMinMs v559 minBurstIntervalMs */
    suggestedMinBurstIntervalMs(baseMinMs) {
      return burstMemory.suggestCooldownMs(baseMinMs, opts.suggest);
    },

    oscillationFingerprint01() {
      return oscillationFp.fingerprint01();
    },

    /** fatigue01 üzerinde recovery model bir adım */
    stepFatigue(fatigue01, dtSec) {
      return tickFatigueRecoveryModel(fatigue01, dtSec, opts.recovery);
    },

    reset() {
      burstMemory.reset();
      oscillationFp.reset();
      lastRhythmInBurst = false;
    }
  };
}
