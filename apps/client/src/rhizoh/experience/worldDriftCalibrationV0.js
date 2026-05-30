/**
 * CORE-ELIGIBLE — World Drift Calibration (v0).
 *
 * Mutation exists; this layer controls *how much* change is felt per session.
 * - drift intensity cap (per-action + cumulative)
 * - per-user perceptual entropy budget (session-local spend)
 *
 * Observation only — no WAL / sealer authority.
 */

export const WORLD_DRIFT_CALIBRATION_SCHEMA_V0 = "castle.rhizoh.world_drift_calibration.v0";

const MUTATION_ACTION_V0 = Object.freeze({
  OBSERVE: "observe",
  ENTER_CASTLE: "enter_castle"
});

/** Max single-action delta on any felt axis (0–1). */
export const DRIFT_INTENSITY_CAP_PER_ACTION_V0 = 0.14;

/** Max cumulative felt drift per session on combined axes. */
export const DRIFT_CUMULATIVE_CAP_V0 = 0.72;

/** Session entropy budget (abstract units, not UI metrics). */
export const PERCEPTUAL_ENTROPY_BUDGET_V0 = 1.0;

const ENTROPY_STORAGE_KEY_V0 = "rhizoh.drift.entropy_budget.v0";

const ENTROPY_COST_V0 = Object.freeze({
  [MUTATION_ACTION_V0.OBSERVE]: 0.22,
  [MUTATION_ACTION_V0.ENTER_CASTLE]: 0.28
});

function clamp01(n) {
  const x = Number(n);
  if (!Number.isFinite(x)) return 0;
  return Math.max(0, Math.min(1, x));
}

function entropyKeyV0(worldInstanceId) {
  return `${ENTROPY_STORAGE_KEY_V0}:${String(worldInstanceId || "default")}`;
}

/**
 * @returns {{ spent: number, remaining: number, budget: number }}
 */
export function readPerceptualEntropyBudgetV0(worldInstanceId) {
  const budget = PERCEPTUAL_ENTROPY_BUDGET_V0;
  if (typeof sessionStorage === "undefined") {
    return { spent: 0, remaining: budget, budget };
  }
  try {
    const raw = sessionStorage.getItem(entropyKeyV0(worldInstanceId));
    const spent = raw ? clamp01(Number(JSON.parse(raw)?.spent)) : 0;
    return { spent, remaining: clamp01(budget - spent), budget };
  } catch {
    return { spent: 0, remaining: budget, budget };
  }
}

function writeEntropySpentV0(worldInstanceId, spent) {
  if (typeof sessionStorage === "undefined") return;
  try {
    sessionStorage.setItem(
      entropyKeyV0(worldInstanceId),
      JSON.stringify({ schema: WORLD_DRIFT_CALIBRATION_SCHEMA_V0, spent: clamp01(spent) })
    );
  } catch {
    /* quota */
  }
}

/**
 * Combined felt drift score for cap checks (not shown to user).
 * @param {{ observationImprint: number, castleAffinity: number, atmosphereShift: number }} ledger
 */
export function measureFeltDriftMagnitudeV0(ledger) {
  return clamp01(
    ledger.observationImprint * 0.4 + ledger.castleAffinity * 0.35 + ledger.atmosphereShift * 0.25
  );
}

/**
 * Clamp proposed ledger vs previous under drift caps.
 *
 * @param {{
 *   prev: { worldInstanceId: string, observationImprint: number, castleAffinity: number, atmosphereShift: number },
 *   proposed: { worldInstanceId: string, observationImprint: number, castleAffinity: number, atmosphereShift: number, mutationGeneration?: number, lastAction?: string | null, lastActionAtMs?: number, observeCount?: number, enterCastleCount?: number },
 *   action: string,
 *   economyHandled?: boolean,
 *   entropyRemaining?: number
 * }} io
 */
export function applyWorldDriftCalibrationV0(io) {
  const { prev, proposed, action } = io;
  const cap = DRIFT_INTENSITY_CAP_PER_ACTION_V0;

  const dImprint = proposed.observationImprint - prev.observationImprint;
  const dAffinity = proposed.castleAffinity - prev.castleAffinity;
  const dAtmo = proposed.atmosphereShift - prev.atmosphereShift;

  const clampDelta = (d) => Math.max(0, Math.min(cap, d));

  let next = {
    ...proposed,
    observationImprint: clamp01(prev.observationImprint + clampDelta(dImprint)),
    castleAffinity: clamp01(prev.castleAffinity + clampDelta(dAffinity)),
    atmosphereShift: clamp01(prev.atmosphereShift + clampDelta(dAtmo))
  };

  const prevMag = measureFeltDriftMagnitudeV0(prev);
  let nextMag = measureFeltDriftMagnitudeV0(next);
  if (nextMag > DRIFT_CUMULATIVE_CAP_V0) {
    const scale = DRIFT_CUMULATIVE_CAP_V0 / Math.max(nextMag, 0.001);
    next = {
      ...next,
      observationImprint: clamp01(prev.observationImprint + (next.observationImprint - prev.observationImprint) * scale),
      castleAffinity: clamp01(prev.castleAffinity + (next.castleAffinity - prev.castleAffinity) * scale),
      atmosphereShift: clamp01(prev.atmosphereShift + (next.atmosphereShift - prev.atmosphereShift) * scale)
    };
    nextMag = measureFeltDriftMagnitudeV0(next);
  }

  const cost = ENTROPY_COST_V0[action] ?? 0.25;
  let allowed = true;
  let budget = readPerceptualEntropyBudgetV0(prev.worldInstanceId);
  let entropyRemaining = budget.remaining;

  if (io.economyHandled) {
    allowed = true;
    entropyRemaining = clamp01(Number(io.entropyRemaining) ?? budget.remaining);
  } else {
    allowed = budget.remaining >= cost - 1e-6;
    if (allowed) {
      writeEntropySpentV0(prev.worldInstanceId, budget.spent + cost);
      entropyRemaining = clamp01(budget.remaining - cost);
    }
  }

  const intensityCapped =
    dImprint > cap + 1e-6 || dAffinity > cap + 1e-6 || dAtmo > cap + 1e-6 || nextMag >= DRIFT_CUMULATIVE_CAP_V0 - 0.01;

  return Object.freeze({
    ledger: Object.freeze(next),
    calibration: Object.freeze({
      allowed,
      intensityCapped,
      cumulativeCapped: nextMag >= DRIFT_CUMULATIVE_CAP_V0 - 0.01,
      entropyCost: cost,
      entropyRemaining,
      driftMagnitude: nextMag,
      economyHandled: Boolean(io.economyHandled)
    })
  });
}

/**
 * @param {{ allowed: boolean, intensityCapped: boolean, entropyRemaining: number }} cal
 */
export function describeDriftCalibrationFeedbackV0(cal) {
  if (!cal.allowed) {
    return "Dünya bugün yeterince kaydı — nefes al, yarın tekrar.";
  }
  if (cal.intensityCapped) {
    return "Değişim ölçülü — dünya küçük adımlarla kayıyor.";
  }
  return null;
}

export function clearDriftCalibrationForTestV0(worldInstanceId) {
  if (typeof sessionStorage === "undefined") return;
  try {
    if (worldInstanceId) {
      sessionStorage.removeItem(entropyKeyV0(worldInstanceId));
    } else {
      for (let i = sessionStorage.length - 1; i >= 0; i -= 1) {
        const k = sessionStorage.key(i);
        if (k && k.startsWith(ENTROPY_STORAGE_KEY_V0)) sessionStorage.removeItem(k);
      }
    }
  } catch {
    /* noop */
  }
}
