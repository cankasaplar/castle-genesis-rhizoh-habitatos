/**
 * Anchor balance field + drift warnings (ops / observation only — no execution authority).
 * @see docs/RHIZOH_MEMORY_ANCHOR_SYSTEM_V0.md §11
 */

export const ANCHOR_DRIFT_MONITOR_CONTRACT_V0 = "anchor-drift-monitor-v0";

/** @typedef {"pal" | "user" | "cohort" | "seed"} AnchorSourceV0 */

const MAX_SAMPLES = 48;
const SEED_DOMINANCE_RATIO = 0.65;
const COHORT_DOMINANCE_RATIO = 0.55;

/** @type {AnchorSourceV0[]} */
const samples = [];

/**
 * @param {AnchorSourceV0} source
 */
export function recordAnchorBalanceSampleV0(source) {
  const s = /** @type {AnchorSourceV0} */ (
    ["pal", "user", "cohort", "seed"].includes(source) ? source : "seed"
  );
  samples.push(s);
  if (samples.length > MAX_SAMPLES) samples.shift();
}

/**
 * @returns {{ pal: number, user: number, cohort: number, seed: number, sampleCount: number }}
 */
export function computeAnchorBalanceFieldV0() {
  const n = samples.length;
  if (!n) {
    return Object.freeze({ pal: 0, user: 0, cohort: 0, seed: 0, sampleCount: 0 });
  }
  let pal = 0;
  let user = 0;
  let cohort = 0;
  let seed = 0;
  for (const s of samples) {
    if (s === "pal") pal += 1;
    else if (s === "user") user += 1;
    else if (s === "cohort") cohort += 1;
    else seed += 1;
  }
  return Object.freeze({
    pal: pal / n,
    user: user / n,
    cohort: cohort / n,
    seed: seed / n,
    sampleCount: n
  });
}

/**
 * @param {{ hasUserAnchor?: boolean }} [ctx]
 * @returns {string[]}
 */
export function getAnchorDriftWarningsV0(ctx = {}) {
  const field = computeAnchorBalanceFieldV0();
  if (field.sampleCount < 6) return [];

  /** @type {string[]} */
  const warnings = [];

  if (field.seed >= SEED_DOMINANCE_RATIO) {
    warnings.push("seed_dominance");
  }
  if (field.cohort >= COHORT_DOMINANCE_RATIO) {
    warnings.push("cohort_dominance");
  }
  if (ctx.hasUserAnchor === true && field.user < 0.15 && field.seed > 0.4) {
    warnings.push("user_anchor_collapse_to_seed");
  }

  return warnings;
}

/**
 * Observation snapshot for trust debug / dev console.
 * @param {{ hasUserAnchor?: boolean }} [ctx]
 */
export function buildAnchorDriftObservationV0(ctx = {}) {
  const balance = computeAnchorBalanceFieldV0();
  const warnings = getAnchorDriftWarningsV0(ctx);
  return Object.freeze({
    contract_version: ANCHOR_DRIFT_MONITOR_CONTRACT_V0,
    balance,
    warnings,
    observation_only: true
  });
}

export function resetAnchorDriftMonitorV0() {
  samples.length = 0;
}
