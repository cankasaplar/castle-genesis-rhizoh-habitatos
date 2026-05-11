/**
 * vNext-563 — Phase Constraint Kernel
 *
 * Merkezi “neye izin verilmemeli” katmanı: makro collapse (reality_shift enter),
 * mikro faz adımı tavanı, coupling zarfı. v559–v562 üretir; v563 sınırlar ve veto eder.
 *
 * Bidirectional phase field ile uyum: global faz ↔ ajan davranışı döngüsü burada
 * kararsızlık ve kötü kilitleme için üst sınır taşır; deterministik kararlar (rastgele yok).
 *
 * v564: `phaseConstraintAdaptationV564` — politika güncellemesi için `applyPolicyMerge`.
 * v565: `phaseConstraintEquilibriumAnchorV565` — uzun dönem denge + değişim tavanı (adaptasyon geri besleme sönümü).
 * v567: `phaseObservationControlCouplingV567` — triaxial bütçe → histerezisli hızlı/yavaş geri besleme.
 * v568: `phaseObservationTrustCalibrationV568` — gözlem güveni → `trustHint568`.
 * v569: `phaseTrustCalibrationDriftV569` — güven öğrenmesi / epistemik bias.
 */

import { createRealityCollapseEventMonitor } from "./phaseIdentityAndCollapseV562.js";

function clamp01(x) {
  return Math.max(0, Math.min(1, x));
}

function wrapPhase01(p) {
  let x = Number(p) || 0;
  x %= 1;
  if (x < 0) x += 1;
  return x;
}

/** @readonly */
export const PHASE_CONSTRAINT_CODE = Object.freeze({
  COLLAPSE_VIRAL_FLOOR: "collapse_viral_floor",
  COLLAPSE_DISPERSION_GATE: "collapse_dispersion_gate",
  COLLAPSE_STRESS_LOCK: "collapse_stress_lock",
  COLLAPSE_RATE_LIMIT: "collapse_rate_limit",
  PHASE_STEP_CAP: "phase_step_cap",
  COUPLING_ENVELOPE: "coupling_envelope"
});

/**
 * Politika nesnesini yerinde v563 kurallarına göre sıkıştırır (kopya döndürmez).
 * @param {typeof DEFAULT_PHASE_CONSTRAINT_POLICY} policy
 */
export function normalizePhaseConstraintPolicyInPlace(policy) {
  policy.collapseViralFloor01 = clamp01(policy.collapseViralFloor01);
  policy.maxDispersion01ForCollapseEnter = clamp01(policy.maxDispersion01ForCollapseEnter);
  policy.collapseStressLock01 = clamp01(policy.collapseStressLock01);
  policy.maxPhaseStepPerTick01 = clamp01(policy.maxPhaseStepPerTick01);
  policy.couplingSoftenAtHighViral01 = clamp01(policy.couplingSoftenAtHighViral01);
  policy.maxCouplingPullScale01 = clamp01(policy.maxCouplingPullScale01);
  const maxE = Math.floor(Number(policy.collapseMaxEntersPerWindow) || 3);
  policy.collapseMaxEntersPerWindow = Math.max(1, Math.min(8, maxE));
  const rw = Math.floor(Number(policy.collapseRateWindowMs) || 90_000);
  policy.collapseRateWindowMs = Math.max(5000, Math.min(600_000, rw));
}

export const DEFAULT_PHASE_CONSTRAINT_POLICY = Object.freeze({
  /** reality_shift enter için viral taban (monitör eşiğiyle hizalı tutulabilir). */
  collapseViralFloor01: 0.72,
  /** Dağılım çok yüksekse makro collapse yok (sahte “shift” freni). */
  maxDispersion01ForCollapseEnter: 0.4,
  /** v557 vb. birleşik stres — üstünde collapse enter kapalı. */
  collapseStressLock01: 0.86,
  /** Zaman penceresi içinde en fazla collapse enter sayısı. */
  collapseMaxEntersPerWindow: 3,
  collapseRateWindowMs: 90_000,
  /** Tek tick’te izin verilen en büyük faz sıçraması (dairesel). */
  maxPhaseStepPerTick01: 0.2,
  /** Yüksek viralSync’te çekimi yumuşatma katsayısı [0–1]. */
  couplingSoftenAtHighViral01: 0.5,
  /** Efektif coupling üst sınırı çarpanı. */
  maxCouplingPullScale01: 1
});

/**
 * @param {number} from01
 * @param {number} to01
 * @returns {number} signed shortest delta in [-0.5, 0.5]
 */
export function shortestSignedPhaseDelta01(from01, to01) {
  const a = wrapPhase01(from01);
  const b = wrapPhase01(to01);
  let d = b - a;
  if (d > 0.5) d -= 1;
  if (d < -0.5) d += 1;
  return d;
}

/**
 * @param {number} from01
 * @param {number} proposed01
 * @param {number} [maxAbsDelta01] policy override
 * @param {typeof DEFAULT_PHASE_CONSTRAINT_POLICY} [policy]
 */
export function constrainProposedPhase01(from01, proposed01, maxAbsDelta01, policy = DEFAULT_PHASE_CONSTRAINT_POLICY) {
  const cap = clamp01(maxAbsDelta01 ?? policy.maxPhaseStepPerTick01 ?? 0.2);
  const d = shortestSignedPhaseDelta01(from01, proposed01);
  if (Math.abs(d) <= cap) {
    return Object.freeze({
      phase01: wrapPhase01(from01 + d),
      allowed: true,
      code: null,
      appliedDelta01: d
    });
  }
  const sign = d >= 0 ? 1 : -1;
  const applied = sign * cap;
  return Object.freeze({
    phase01: wrapPhase01(from01 + applied),
    allowed: false,
    code: PHASE_CONSTRAINT_CODE.PHASE_STEP_CAP,
    requestedDelta01: d,
    appliedDelta01: applied
  });
}

/**
 * v561 `pullEffective01` veya benzeri çekim ölçeğini viral üzerinden zarflar.
 * @param {number} pull01 [0–1] civarı
 * @param {number} viralSync01
 * @param {typeof DEFAULT_PHASE_CONSTRAINT_POLICY} [policy]
 */
export function envelopeCouplingPull01(pull01, viralSync01, policy = DEFAULT_PHASE_CONSTRAINT_POLICY) {
  const p = clamp01(pull01);
  const v = clamp01(viralSync01);
  const soften = clamp01(policy.couplingSoftenAtHighViral01 ?? 0.5);
  const mag = clamp01((1 - v * soften) * clamp01(policy.maxCouplingPullScale01 ?? 1));
  const out = clamp01(p * mag);
  const shaped = mag < 0.985 && p > 1e-4;
  return Object.freeze({
    pull01: out,
    code: shaped ? PHASE_CONSTRAINT_CODE.COUPLING_ENVELOPE : null
  });
}

/**
 * @param {Partial<typeof DEFAULT_PHASE_CONSTRAINT_POLICY>} [policyOverrides]
 */
export function createPhaseConstraintKernel(policyOverrides = {}) {
  /** @type {typeof DEFAULT_PHASE_CONSTRAINT_POLICY} */
  const policy = { ...DEFAULT_PHASE_CONSTRAINT_POLICY, ...policyOverrides };
  /** @type {number[]} */
  let collapseEnterTimestamps = [];

  function pruneCollapseWindow(nowMs) {
    const t = Number(nowMs) || Date.now();
    const w = Math.max(1000, policy.collapseRateWindowMs ?? 90_000);
    while (collapseEnterTimestamps.length && t - collapseEnterTimestamps[0] > w) {
      collapseEnterTimestamps.shift();
    }
  }

  normalizePhaseConstraintPolicyInPlace(policy);

  return {
    getPolicy() {
      return policy;
    },

    /**
     * v564 adaptasyon katmanından gelen kısmi politika (aynı çekirdek örneği, rate-limit durumu korunur).
     * @param {Partial<typeof DEFAULT_PHASE_CONSTRAINT_POLICY>} partial
     */
    applyPolicyMerge(partial) {
      if (!partial || typeof partial !== "object") return;
      for (const k of Object.keys(partial)) {
        if (Object.prototype.hasOwnProperty.call(DEFAULT_PHASE_CONSTRAINT_POLICY, k) && partial[k] !== undefined) {
          policy[k] = partial[k];
        }
      }
      normalizePhaseConstraintPolicyInPlace(policy);
    },

    /**
     * @param {import("./phaseIdentityAndCollapseV562.js").CollapseEnterContext} ctx
     * @returns {{ allowed: boolean, code: string | null }}
     */
    evaluateCollapseEnter(ctx) {
      const viral = clamp01(ctx.viralSync01 ?? 0);
      const disp = clamp01(Number(ctx.dispersion01 ?? 0));
      const stress = clamp01(Number(ctx.stress01 ?? 0));
      const nowMs = Number(ctx.atMs) || Date.now();

      if (stress >= clamp01(policy.collapseStressLock01)) {
        return Object.freeze({ allowed: false, code: PHASE_CONSTRAINT_CODE.COLLAPSE_STRESS_LOCK });
      }
      if (disp > clamp01(policy.maxDispersion01ForCollapseEnter)) {
        return Object.freeze({ allowed: false, code: PHASE_CONSTRAINT_CODE.COLLAPSE_DISPERSION_GATE });
      }
      if (viral < clamp01(policy.collapseViralFloor01)) {
        return Object.freeze({ allowed: false, code: PHASE_CONSTRAINT_CODE.COLLAPSE_VIRAL_FLOOR });
      }

      pruneCollapseWindow(nowMs);
      const maxE = Math.max(0, Math.floor(policy.collapseMaxEntersPerWindow ?? 3));
      if (collapseEnterTimestamps.length >= maxE) {
        return Object.freeze({ allowed: false, code: PHASE_CONSTRAINT_CODE.COLLAPSE_RATE_LIMIT });
      }

      return Object.freeze({ allowed: true, code: null });
    },

    /**
     * Enter olayı gerçekten işlendikten sonra (monitör onayı sonrası) çağrılır.
     * @param {number} atMs
     */
    commitCollapseEnter(atMs) {
      const t = Number(atMs) || Date.now();
      pruneCollapseWindow(t);
      collapseEnterTimestamps.push(t);
    },

    resetCollapseRateLimiter() {
      collapseEnterTimestamps = [];
    },

    constrainPhaseStep(from01, proposed01) {
      return constrainProposedPhase01(from01, proposed01, policy.maxPhaseStepPerTick01, policy);
    },

    envelopeCoupling(pull01, viralSync01) {
      return envelopeCouplingPull01(pull01, viralSync01, policy);
    }
  };
}

/**
 * v562 collapse monitörünü v563 çekirdeğine bağlar (enter veto + commit).
 * @param {ReturnType<typeof createPhaseConstraintKernel>} kernel
 * @param {Parameters<typeof createRealityCollapseEventMonitor>[0]} [monitorOpts]
 */
export function createConstrainedRealityCollapseMonitor(kernel, monitorOpts = {}) {
  return createRealityCollapseEventMonitor({
    ...monitorOpts,
    shouldAllowEnter: (ctx) => kernel.evaluateCollapseEnter(ctx).allowed,
    onCollapseEnterCommitted: (ctx) => kernel.commitCollapseEnter(ctx.atMs)
  });
}
