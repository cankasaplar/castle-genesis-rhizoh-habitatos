/**
 * vNext-559 — Perceptual rhythm governor
 *
 * Burst salınımını (sıkılma → burst → stabil → sıkılma) sınırlı ve yumuşak tutar:
 * - Sıkılma eğrisi şekillendirme (S-eğrisi)
 * - Engagement osilasyon yumuşatma (yüksek türev → yorgunluk ipucu)
 * - Kolektif yorgunluk → burst aralığı uzar, gevşeme sönükler
 * - Minimum burst cooldown (557 runaway ile birlikte; burst frekans törpüsü)
 *
 * v558 ile: aynı `createCreativeBurstScheduler` örneği `rhythm.scheduler` üzerinden
 * `buildRelaxationBundle({ burstScheduler: rhythm.scheduler, ... })` ile bağlanır.
 *
 * Uzun dönem faz belleği: `rhythmicPhaseMemoryV560` (`ingestRhythmStep`, önerilen aralık, osilasyon parmak izi).
 * Çoklu ajan faz hizası: `crossAgentRhythmSyncV561`.
 */

import { computeStabilityRelaxation01, createCreativeBurstScheduler } from "./adaptiveStabilityRelaxationV558.js";

function clamp01(x) {
  return Math.max(0, Math.min(1, x));
}

/**
 * S-eğrisi sıkılma şekli [0–1] → [0–1]; orta bölgede daha “kararlı” geçiş.
 * @param {number} raw01
 * @param {{ midpoint?: number, steepness?: number }} [opts]
 */
export function shapeBoredomCurve01(raw01, opts = {}) {
  const x = clamp01(raw01);
  const m = opts.midpoint ?? 0.44;
  const k = Math.max(0.5, opts.steepness ?? 4.2);
  const u = Math.tanh((x - m) * k);
  return clamp01(0.5 + 0.5 * u);
}

/**
 * Engagement / dış sinyal riple’ını yumuşatır; osilasyon riski üretir (yorgunluk girdisi).
 * @param {{ alpha?: number, velocityBlend?: number }} [opts]
 */
export function createEngagementOscillationSmoother(opts = {}) {
  const alpha = clamp01(opts.alpha ?? 0.2);
  const velBlend = clamp01(opts.velocityBlend ?? 0.38);
  let ema = 0.5;
  let velEma = 0;

  return {
    /**
     * @param {number} raw01
     * @param {number} [dtSec]
     */
    step(raw01, dtSec = 0.016) {
      const x = clamp01(raw01);
      const dt = Math.max(0, Math.min(0.12, dtSec));
      const a = clamp01(1 - Math.exp(-dt * (12 + alpha * 38)));
      ema = clamp01(ema + (x - ema) * a);
      const vel = x - ema;
      velEma = clamp01(velEma + (vel - velEma) * velBlend);
      const oscillationRisk01 = clamp01(Math.abs(vel - velEma) * 2.8);
      return Object.freeze({
        smoothed01: ema,
        velocity01: vel,
        oscillationRisk01,
        jolt01: clamp01(Math.abs(vel) * 1.4)
      });
    },

    reset() {
      ema = 0.5;
      velEma = 0;
    }
  };
}

/**
 * Çoklu ajan / yüksek eşzamanlı etkileşim yorgunluğu (bounded).
 * @param {{ recoveryPerSec?: number, loadSensitivity?: number }} [opts]
 */
export function createCollectiveFatigueSensor(opts = {}) {
  const rec = opts.recoveryPerSec ?? 0.3;
  const sens = clamp01(opts.loadSensitivity ?? 1);
  let fatigue = 0;

  return {
    ingestCollectiveLoad01(load01, crowdScale01 = 1) {
      const l = clamp01(load01) * clamp01(crowdScale01);
      fatigue = clamp01(fatigue + l * 0.13 * sens);
    },

    tick(dtSec = 0.016) {
      const dt = Math.max(0, Math.min(0.12, dtSec));
      fatigue = clamp01(fatigue * Math.exp(-dt * rec));
    },

    fatigue01() {
      return fatigue;
    },

    /** Burst minimum aralık çarpanı: yorgun → daha seyrek burst (≥1, üst sınır ~2.2) */
    burstIntervalMultiplier01() {
      return Math.max(1, Math.min(2.2, 1 + fatigue * 0.92));
    },

    /** v558 gevşemesini hafifçe keser */
    relaxationDampen01() {
      return clamp01(1 - fatigue * 0.38);
    },

    reset() {
      fatigue = 0;
    }
  };
}

/**
 * @param {object} [opts]
 * @param {ReturnType<typeof createCreativeBurstScheduler>} [opts.scheduler] yoksa içerde oluşturulur
 * @param {{ burstWindowMs?: number, boredomTrigger01?: number, maxRunawayForBurst?: number }} [opts.burst]
 * @param {{ midpoint?: number, steepness?: number }} [opts.boredomCurve]
 * @param {{ alpha?: number, velocityBlend?: number }} [opts.smoother]
 * @param {{ recoveryPerSec?: number, loadSensitivity?: number }} [opts.fatigue]
 * @param {number} [opts.minBurstIntervalMs] son burst bitişinden sonra minimum bekleme
 */
export function createPerceptualRhythmGovernor(opts = {}) {
  const smoother = createEngagementOscillationSmoother(opts.smoother);
  const fatigue = createCollectiveFatigueSensor(opts.fatigue);
  const scheduler = opts.scheduler ?? createCreativeBurstScheduler(opts.burst);
  const minIntervalMs = Math.max(2000, opts.minBurstIntervalMs ?? 14_000);
  const boredomTrig = clamp01(opts.burst?.boredomTrigger01 ?? 0.68);

  let lastBurstEndMs = 0;
  let prevInBurst = false;

  return {
    scheduler,
    fatigue,
    smoother,

    /**
     * @param {object} p
     * @param {number} p.nowMs
     * @param {number} [p.rawActivity01] ham engagement / yoğunluk
     * @param {number} [p.stagnation01]
     * @param {number} [p.runawayRisk01]
     * @param {number} [p.collectiveLoad01] çoklu kullanıcı yükü özeti [0–1]
     * @param {number} [p.crowdScale01]
     * @param {number} [p.lowActivityThreshold]
     * @param {number} [p.dtSec]
     */
    step(p) {
      const now = Number(p.nowMs) || Date.now();
      const dt = Math.max(0, Math.min(0.12, p.dtSec ?? 0.016));

      const snapPre = scheduler.snapshot();
      if (prevInBurst && now >= snapPre.burstUntilMs) {
        lastBurstEndMs = Math.max(lastBurstEndMs, snapPre.burstUntilMs);
      }

      fatigue.tick(dt);
      if (p.collectiveLoad01 != null) {
        fatigue.ingestCollectiveLoad01(p.collectiveLoad01, p.crowdScale01 ?? 1);
      }

      const sm = smoother.step(p.rawActivity01 ?? 0.5, dt);
      fatigue.ingestCollectiveLoad01(sm.oscillationRisk01 * 0.22, 1);

      const relaxBase = computeStabilityRelaxation01({
        activity01: sm.smoothed01,
        stagnation01: p.stagnation01 ?? 0,
        runawayRisk01: p.runawayRisk01 ?? 0,
        lowActivityThreshold: p.lowActivityThreshold
      });
      const shapedBoredom = shapeBoredomCurve01(relaxBase.boredom01, opts.boredomCurve);

      const nextEarliest =
        lastBurstEndMs + minIntervalMs * fatigue.burstIntervalMultiplier01();
      const cooldownMs = Math.max(0, nextEarliest - now);

      const gate =
        cooldownMs > 0 ? Math.min(shapedBoredom, Math.max(0, boredomTrig - 0.09)) : shapedBoredom;
      const boredomForScheduler = clamp01(gate * fatigue.relaxationDampen01());

      const st = scheduler.tick({
        nowMs: now,
        boredom01: boredomForScheduler,
        runawayRisk01: p.runawayRisk01 ?? 0
      });

      prevInBurst = st.inBurst;

      return Object.freeze({
        ...st,
        shapedBoredom01: shapedBoredom,
        engagementSmoothed01: sm.smoothed01,
        oscillationRisk01: sm.oscillationRisk01,
        collectiveFatigue01: fatigue.fatigue01(),
        burstCooldownRemainingMs: cooldownMs,
        boredomGated01: boredomForScheduler
      });
    },

    reset() {
      smoother.reset();
      fatigue.reset();
      scheduler.reset();
      lastBurstEndMs = 0;
      prevInBurst = false;
    }
  };
}
