/**
 * RHIZOH adversarial θ / stress injection defense — dışarıdan gelen yapay stres sıçramalarına karşı bağışıklık.
 */

export const RHIZOH_ADVERSARIAL_THETA_INJECTION_VERSION = "1.0.0";

function clamp01(x) {
  const n = Number(x);
  if (!Number.isFinite(n)) return 0;
  return Math.max(0, Math.min(1, n));
}

/**
 * @typedef {{
 *   at?: number,
 *   stressIndex?: number | null,
 *   theta?: number | null,
 *   thetaDelta?: number | null,
 *   priorLlmStressBump?: number | null,
 *   externalStressHint?: number | null
 * }} RhizohThetaObservation
 */

/**
 * @param {RhizohThetaObservation[]} observations en yenisi sonda
 * @param {{
 *   window?: number,
 *   spikeTau?: number,
 *   decorrelationPenalty?: number
 * }} [opts]
 */
export function scoreRhizohAdversarialThetaInjection(observations, opts = {}) {
  const win = Math.max(4, Math.floor(opts.window ?? 24));
  const slice = (observations || []).slice(-win);
  if (slice.length < 3) {
    return {
      suspicion: 0,
      dampenPriorLlmStressFactor: 1,
      capThetaUpwardDelta: null,
      freezeStressAdaptation: false,
      signals: { sparseWindow: true },
      trace: [{ kind: "insufficient_observations" }]
    };
  }

  const spikeTau = opts.spikeTau != null ? clamp01(opts.spikeTau) : 0.22;
  const decorrelationPenalty = opts.decorrelationPenalty != null ? clamp01(opts.decorrelationPenalty) : 0.35;

  /** @type {number[]} */
  const stresses = [];
  /** @type {number[]} */
  const bumps = [];

  for (let i = 0; i < slice.length; i++) {
    const o = slice[i];
    if (typeof o.stressIndex === "number" && Number.isFinite(o.stressIndex)) stresses.push(clamp01(o.stressIndex));
    if (typeof o.priorLlmStressBump === "number" && Number.isFinite(o.priorLlmStressBump)) {
      bumps.push(clamp01(o.priorLlmStressBump));
    }
  }

  let stressSpikeScore = 0;
  for (let i = 1; i < stresses.length; i++) {
    stressSpikeScore = Math.max(stressSpikeScore, stresses[i] - stresses[i - 1]);
  }
  stressSpikeScore = clamp01(stressSpikeScore / Math.max(spikeTau, 1e-6));

  let bumpBurstScore = 0;
  if (bumps.length >= 3) {
    const hi = bumps.filter((b) => b >= 0.06).length / bumps.length;
    bumpBurstScore = clamp01(hi * 1.4);
  }

  let ghostDecorrelation = 0;
  if (slice.length >= 4) {
    let negCorrHints = 0;
    let paired = 0;
    for (let i = 1; i < slice.length; i++) {
      const prev = slice[i - 1];
      const cur = slice[i];
      const s0 = typeof prev.stressIndex === "number" ? clamp01(prev.stressIndex) : null;
      const s1 = typeof cur.stressIndex === "number" ? clamp01(cur.stressIndex) : null;
      const dt = typeof cur.thetaDelta === "number" ? cur.thetaDelta : null;
      if (s0 != null && s1 != null && dt != null) {
        paired += 1;
        const ds = s1 - s0;
        if (ds < -0.03 && dt > 0.02) negCorrHints += 1;
      }
    }
    ghostDecorrelation = clamp01(negCorrHints / Math.max(1, paired));
  }

  const suspicion = clamp01(
    0.38 * stressSpikeScore + 0.32 * bumpBurstScore + decorrelationPenalty * ghostDecorrelation
  );

  const dampenPriorLlmStressFactor = Math.round(Math.max(0.15, 1 - suspicion * 0.85) * 1000) / 1000;
  const capThetaUpwardDelta = suspicion > 0.45 ? Math.max(0.02, 0.09 - suspicion * 0.07) : null;
  const freezeStressAdaptation = suspicion > 0.72;

  return {
    suspicion: Math.round(suspicion * 1000) / 1000,
    dampenPriorLlmStressFactor,
    capThetaUpwardDelta,
    freezeStressAdaptation,
    signals: {
      stressSpikeScore: Math.round(stressSpikeScore * 1000) / 1000,
      bumpBurstScore: Math.round(bumpBurstScore * 1000) / 1000,
      ghostDecorrelation: Math.round(ghostDecorrelation * 1000) / 1000
    },
    trace: [
      { kind: "adversarial_theta_stress_blend", suspicion },
      ...(freezeStressAdaptation ? [{ kind: "freeze_adaptation_recommended" }] : [])
    ]
  };
}

/**
 * snapshot.adaptation benzeri bir nesnede önceden gelen LLM stresini savunma ile inceltir.
 * @param {{
 *   priorLlmStressBump?: number,
 *   thetaDelta?: number,
 *   adaptationDisabled?: boolean
 * }} adaptationLike
 * @param {ReturnType<typeof scoreRhizohAdversarialThetaInjection>} defense
 */
export function immunizeRhizohThetaStressAdaptationInput(adaptationLike, defense) {
  const bump = adaptationLike?.priorLlmStressBump;
  const factor = defense.dampenPriorLlmStressFactor ?? 1;
  let priorLlmStressBump =
    typeof bump === "number" && Number.isFinite(bump) ? clamp01(bump * factor) : bump;

  let thetaDeltaCapNote = null;
  let thetaDelta =
    typeof adaptationLike?.thetaDelta === "number" ? adaptationLike.thetaDelta : undefined;

  if (defense.freezeStressAdaptation) {
    priorLlmStressBump = typeof bump === "number" ? Math.min(clamp01(bump), 0.04) : bump;
  }

  if (defense.capThetaUpwardDelta != null && thetaDelta != null && thetaDelta > defense.capThetaUpwardDelta) {
    thetaDeltaCapNote = "theta_delta_capped_by_injection_defense";
    thetaDelta = Math.min(thetaDelta, defense.capThetaUpwardDelta);
  }

  return {
    priorLlmStressBump,
    thetaDelta,
    adaptationDisabled: adaptationLike?.adaptationDisabled === true || defense.freezeStressAdaptation,
    defenseMeta: {
      suspicion: defense.suspicion,
      thetaDeltaCapNote,
      dampenPriorLlmStressFactor: factor
    }
  };
}
