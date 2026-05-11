/**
 * RHIZOH meta-adversarial loop — sentetik saldırı senaryoları üretip savunma skorunu toplu test eder.
 */

import {
  scoreRhizohAdversarialThetaInjection,
  RHIZOH_ADVERSARIAL_THETA_INJECTION_VERSION
} from "./adversarialThetaInjectionDefenseV1.js";

export const RHIZOH_META_ADVERSARIAL_LOOP_VERSION = "1.0.0";

/** Savunma katmanı ile aynı paket sürümü referansı (audit). */
export const RHIZOH_META_ADVERSARIAL_DEFENSE_PAIR_VERSION = RHIZOH_ADVERSARIAL_THETA_INJECTION_VERSION;

function clamp01(x) {
  const n = Number(x);
  if (!Number.isFinite(n)) return 0;
  return Math.max(0, Math.min(1, n));
}

function hashSeed(seed) {
  const s = String(seed ?? "rhizoh-meta-adv");
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h = Math.imul(h ^ s.charCodeAt(i), 16777619);
  }
  return h >>> 0;
}

function mulberry32(seed) {
  let a = seed >>> 0;
  return () => {
    a += 0x6d2b79f5;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export const RHIZOH_META_ADVERSARIAL_SCENARIO_IDS_V1 = Object.freeze([
  "spike_train",
  "bump_burst",
  "ghost_decorrelation",
  "compound_chaos"
]);

/**
 * @typedef {{
 *   scenarioId?: string,
 *   seed?: number | string,
 *   length?: number,
 *   baseStress?: number,
 *   baseThetaDelta?: number
 * }} RhizohMetaAdversarialSynthSpec
 */

/**
 * @param {RhizohMetaAdversarialSynthSpec} spec
 * @returns {import('./adversarialThetaInjectionDefenseV1.js').RhizohThetaObservation[]}
 */
export function synthesizeRhizohMetaAdversarialObservations(spec = {}) {
  const scenarioId = spec.scenarioId || "spike_train";
  const length = Math.max(8, Math.min(128, Math.floor(spec.length ?? 32)));
  const rng = mulberry32(hashSeed(spec.seed ?? 1337));
  const baseStress = clamp01(spec.baseStress ?? 0.38);

  /** @type {import('./adversarialThetaInjectionDefenseV1.js').RhizohThetaObservation[]} */
  const out = [];
  let stress = baseStress;
  let tick = 0;

  for (let i = 0; i < length; i++) {
    tick += 60_000;
    let thetaDelta = typeof spec.baseThetaDelta === "number" ? spec.baseThetaDelta : 0;
    let priorBump = 0;

    if (scenarioId === "spike_train") {
      if (rng() > 0.82) stress = clamp01(stress + 0.18 + rng() * 0.14);
      else stress = clamp01(stress * 0.97 + baseStress * 0.03);
    } else if (scenarioId === "bump_burst") {
      stress = clamp01(baseStress + (rng() - 0.5) * 0.06);
      priorBump = rng() > 0.72 ? 0.07 + rng() * 0.06 : rng() * 0.02;
    } else if (scenarioId === "ghost_decorrelation") {
      const spikeDown = rng() > 0.78;
      stress = spikeDown ? clamp01(stress - 0.12 - rng() * 0.08) : clamp01(stress + (rng() - 0.45) * 0.04);
      thetaDelta = spikeDown ? 0.03 + rng() * 0.05 : (rng() - 0.5) * 0.02;
    } else if (scenarioId === "compound_chaos") {
      if (rng() > 0.78) stress = clamp01(stress + 0.22);
      if (rng() > 0.75) priorBump = 0.08 + rng() * 0.05;
      if (rng() > 0.82) thetaDelta = 0.04 + rng() * 0.04;
      stress = clamp01(stress * 0.94 + baseStress * 0.06);
    } else {
      stress = clamp01(baseStress + (rng() - 0.5) * 0.1);
    }

    out.push({
      at: tick,
      stressIndex: stress,
      priorLlmStressBump: priorBump,
      thetaDelta
    });
  }

  return out;
}

/**
 * @param {{
 *   scenarios?: ReadonlyArray<string>,
 *   seed?: number | string,
 *   synthLength?: number,
 *   baseObservations?: import('./adversarialThetaInjectionDefenseV1.js').RhizohThetaObservation[],
 *   defenseOpts?: Parameters<typeof scoreRhizohAdversarialThetaInjection>[1],
 *   prependBase?: boolean
 * }} opts
 */
export function runRhizohMetaAdversarialTrainingRound(opts = {}) {
  const scenarios =
    opts.scenarios?.length ? [...opts.scenarios] : [...RHIZOH_META_ADVERSARIAL_SCENARIO_IDS_V1];
  const synthLength = Math.floor(opts.synthLength ?? 30);
  const prependBase = opts.prependBase !== false;

  /** @type {Record<string, ReturnType<typeof scoreRhizohAdversarialThetaInjection> & { scenarioId: string }>} */
  const reports = {};

  let sumSuspicion = 0;
  for (const scenarioId of scenarios) {
    const synth = synthesizeRhizohMetaAdversarialObservations({
      scenarioId,
      seed: `${opts.seed ?? "default"}:${scenarioId}`,
      length: synthLength
    });
    const merged =
      prependBase && opts.baseObservations?.length ? [...opts.baseObservations, ...synth] : synth;
    const score = scoreRhizohAdversarialThetaInjection(merged, opts.defenseOpts);
    reports[scenarioId] = { scenarioId, ...score };
    sumSuspicion += score.suspicion;
  }

  const aggregateSuspicion =
    scenarios.length > 0 ? Math.round((sumSuspicion / scenarios.length) * 1000) / 1000 : 0;

  return {
    reports,
    scenarioIds: scenarios,
    aggregateSuspicion,
    suggestTighterDefense: aggregateSuspicion > 0.42,
    suggestIncreaseObservationWindow:
      aggregateSuspicion > 0.55 && (opts.defenseOpts?.window ?? 24) < 36,
    loopVersion: RHIZOH_META_ADVERSARIAL_LOOP_VERSION
  };
}

/**
 * Tek çağrıda çoklu sentez partisi (hızlı regresyon).
 * @param {number} [count]
 * @param {RhizohMetaAdversarialSynthSpec} [spec]
 */
export function batchSynthesizeRhizohMetaAdversarial(count = 4, spec = {}) {
  /** @type {import('./adversarialThetaInjectionDefenseV1.js').RhizohThetaObservation[][]} */
  const batches = [];
  const n = Math.max(1, Math.min(24, Math.floor(count)));
  for (let b = 0; b < n; b++) {
    batches.push(
      synthesizeRhizohMetaAdversarialObservations({
        ...spec,
        seed: `${spec.seed ?? "batch"}:${b}`
      })
    );
  }
  return batches;
}
