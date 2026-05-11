/**
 * vNext-561 — Cross-agent rhythm synchronization layer
 *
 * Çoklu ajan faz hizalaması (dairesel ortalama), kolektif uyum / dağılım,
 * hızlı faz çöküşü + engagement sıçraması ile viral senkronizasyon sinyali,
 * aşırı kilitlenmeye karşı deterministik anti-scatter (desync prevention).
 *
 * v560 bellek + v559 ritim ile: fazlar harici olarak üretilebilir (ör. yerel burst fazı).
 *
 * v562: `phaseIdentityAndCollapseV562` — ajan faz kimliği + viral eşikte reality_shift olayı.
 * v563: `phaseConstraintKernelV563` — collapse / faz adımı / coupling için merkezi kısıt çekirdeği.
 * v564: `phaseConstraintAdaptationV564` — kısıtların zamana göre gevşeyip sıkılaşması.
 * v565: `phaseConstraintEquilibriumAnchorV565` — adaptasyon geri beslemesinin sönümü / denge ankrajı.
 * v566: `phaseAnchorPlasticityV566` — referans setpoint’in yavaşça yeniden öğrenilmesi.
 * v567: `phaseObservationControlCouplingV567` — bütçe gözlemi ile hızlı/yavaş döngü bağlantısı.
 * v568: `phaseObservationTrustCalibrationV568` — gözleme güven ağırlığı ve coupling ipucu.
 * v569: `phaseTrustCalibrationDriftV569` — epistemik bias / güven drift öğrenmesi.
 */

import { deterministicVolatilityNoise01 } from "./adaptiveStabilityRelaxationV558.js";

function clamp01(x) {
  return Math.max(0, Math.min(1, x));
}

export function wrapPhase01(p) {
  let x = Number(p) || 0;
  x %= 1;
  if (x < 0) x += 1;
  return x;
}

/** En kısa yön farkı [-0.5, 0.5] */
export function circularDelta01(fromPhase01, toPhase01) {
  const a = wrapPhase01(fromPhase01);
  const b = wrapPhase01(toPhase01);
  let d = b - a;
  if (d > 0.5) d -= 1;
  if (d < -0.5) d += 1;
  return d;
}

/**
 * Dairesel ortalama + uyum (resultant uzunluğu R = cohesion).
 * @param {Array<{ phase01: number, weight01?: number }>} entries
 */
export function circularMeanPhase01(entries) {
  if (!entries?.length) {
    return Object.freeze({ mean01: 0.5, resultant01: 0, cohesion01: 0 });
  }
  let cx = 0;
  let cy = 0;
  let wsum = 0;
  for (const e of entries) {
    const p = wrapPhase01(e.phase01);
    const ang = p * 2 * Math.PI;
    const w = clamp01(e.weight01 ?? 1);
    cx += Math.cos(ang) * w;
    cy += Math.sin(ang) * w;
    wsum += w;
  }
  if (wsum < 1e-9) {
    return Object.freeze({ mean01: 0.5, resultant01: 0, cohesion01: 0 });
  }
  const mx = cx / wsum;
  const my = cy / wsum;
  const R = Math.min(1, Math.hypot(mx, my));
  if (R < 1e-6) {
    return Object.freeze({ mean01: 0.5, resultant01: 0, cohesion01: 0 });
  }
  let ang = Math.atan2(my, mx);
  if (ang < 0) ang += 2 * Math.PI;
  return Object.freeze({
    mean01: ang / (2 * Math.PI),
    resultant01: R,
    cohesion01: R
  });
}

/** 1 − R: yüksek → fazlar dağınık */
export function rhythmDispersion01(entries) {
  const { cohesion01 } = circularMeanPhase01(entries);
  return clamp01(1 - cohesion01);
}

/**
 * Kolektif faza sınırlı çekim (tick başına max adım).
 */
export function cappedPullTowardCollective(localPhase01, collectivePhase01, pullStrength01, maxAbsStep01) {
  const d = circularDelta01(localPhase01, collectivePhase01);
  const t = clamp01(pullStrength01);
  const step = Math.sign(d) * Math.min(Math.abs(d) * t, clamp01(maxAbsStep01));
  return wrapPhase01(wrapPhase01(localPhase01) + step);
}

/**
 * Dağılım çöküşü + engagement artışı → viral senkron sinyali [0–1].
 */
export function viralSynchronizationSignal01(
  prevDispersion01,
  dispersion01,
  engagementSmoothed01,
  prevEngagement01,
  opts = {}
) {
  const wC = opts.wCollapse ?? 1.35;
  const wE = opts.wEngage ?? 0.85;
  const collapse = clamp01(Number(prevDispersion01) - Number(dispersion01));
  const eRise = clamp01(Number(engagementSmoothed01) - Number(prevEngagement01));
  const raw = clamp01(collapse * wC + eRise * wE);
  return Object.freeze({
    viralSync01: raw,
    collapseRate01: collapse,
    engagementRise01: eRise
  });
}

/**
 * @param {object} [opts]
 * @param {number} [opts.basePull01] kolektif çekim gücü tabanı
 * @param {number} [opts.maxPullPerTick01] tek tick’te max faz adımı
 * @param {number} [opts.desyncGuard01] viralSync yüksekken çekimi azalt
 * @param {number} [opts.antiLockScatter01] viralSync yüksekken deterministik saçılım genliği
 * @param {object} [opts.viral] viralSynchronizationSignal01 seçenekleri
 */
export function createCrossAgentRhythmOrchestrator(opts = {}) {
  const basePull = clamp01(opts.basePull01 ?? 0.14);
  const maxStep = clamp01(opts.maxPullPerTick01 ?? 0.16);
  const desyncGuard = clamp01(opts.desyncGuard01 ?? 0.42);
  const antiLock = clamp01(opts.antiLockScatter01 ?? 0.11);
  let prevDisp = 1;
  let prevEng = 0.5;
  let tickIdx = 0;

  return {
    /**
     * @param {Array<{ phase01: number, weight01?: number, id?: string }>} agentEntries
     * @param {number} [engagementSmoothed01] v559 smoother çıktısı
     */
    step(agentEntries, engagementSmoothed01 = 0.5) {
      tickIdx += 1;
      const mean = circularMeanPhase01(agentEntries);
      const disp = rhythmDispersion01(agentEntries);
      const eng = clamp01(engagementSmoothed01);
      const viral = viralSynchronizationSignal01(prevDisp, disp, eng, prevEng, opts.viral);

      const cohesionBoost = mean.cohesion01 * 0.09;
      let pullEff = clamp01(basePull + cohesionBoost);
      pullEff = clamp01(pullEff * (1 - viral.viralSync01 * desyncGuard));

      const scatter = viral.viralSync01 * antiLock;
      const aligned = (agentEntries ?? []).map((e, i) => {
        let ph = cappedPullTowardCollective(e.phase01, mean.mean01, pullEff, maxStep);
        if (scatter > 0.004) {
          const n = deterministicVolatilityNoise01(tickIdx * 997 + i * 131 + Math.floor(ph * 1000)) - 0.5;
          ph = wrapPhase01(ph + n * 2 * scatter);
        }
        return Object.freeze({
          ...e,
          phaseAligned01: ph,
          collectivePhase01: mean.mean01
        });
      });

      prevDisp = disp;
      prevEng = eng;

      return Object.freeze({
        collectivePhase01: mean.mean01,
        cohesion01: mean.cohesion01,
        dispersion01: disp,
        viralSync01: viral.viralSync01,
        collapseRate01: viral.collapseRate01,
        engagementRise01: viral.engagementRise01,
        pullEffective01: pullEff,
        agents: aligned
      });
    },

    reset() {
      prevDisp = 1;
      prevEng = 0.5;
      tickIdx = 0;
    }
  };
}
