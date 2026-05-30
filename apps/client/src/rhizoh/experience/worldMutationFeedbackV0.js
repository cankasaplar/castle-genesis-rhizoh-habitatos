/**
 * CORE-ELIGIBLE — World Mutation Feedback Layer (v0).
 *
 * User actions leave **felt** traces on the world instance (observation-only).
 * No execution authority — projection + copy only.
 *
 * Actions:
 * - `observe` → observation imprint (world instance hafif derinleşir)
 * - `enter_castle` → atmosphere shift + castle affinity
 *
 * Return visit: sealed snapshot vs current ledger → "küçük farklar" copy.
 *
 * Drift calibration: `worldDriftCalibrationV0.js` (intensity cap + entropy budget).
 */

import {
  applyWorldDriftCalibrationV0,
  describeDriftCalibrationFeedbackV0
} from "./worldDriftCalibrationV0.js";
import {
  spendEntropyWithEconomyV0,
  applyAttentionDecayToMutationV0,
  describeEntropyEconomyFeedbackV0
} from "./perceptualEntropyEconomyV0.js";

export const WORLD_MUTATION_FEEDBACK_SCHEMA_V0 = "castle.rhizoh.world_mutation_feedback.v0";

export const WORLD_MUTATION_ACTION_V0 = Object.freeze({
  OBSERVE: "observe",
  ENTER_CASTLE: "enter_castle"
});

const STORAGE_KEY_V0 = "rhizoh.world_mutation.v0";

function nowMs() {
  return Date.now();
}

function storageKeyV0(worldInstanceId) {
  return `${STORAGE_KEY_V0}:${String(worldInstanceId || "default")}`;
}

function sealKeyV0(worldInstanceId) {
  return `${STORAGE_KEY_V0}:sealed:${String(worldInstanceId || "default")}`;
}

function clamp01(n) {
  const x = Number(n);
  if (!Number.isFinite(x)) return 0;
  return Math.max(0, Math.min(1, x));
}

/**
 * @returns {{
 *   schema: string,
 *   worldInstanceId: string,
 *   observationImprint: number,
 *   castleAffinity: number,
 *   atmosphereShift: number,
 *   mutationGeneration: number,
 *   lastAction: string | null,
 *   lastActionAtMs: number,
 *   observeCount: number,
 *   enterCastleCount: number
 * }}
 */
export function createEmptyMutationLedgerV0(worldInstanceId) {
  return Object.freeze({
    schema: WORLD_MUTATION_FEEDBACK_SCHEMA_V0,
    worldInstanceId: String(worldInstanceId || ""),
    observationImprint: 0,
    castleAffinity: 0,
    atmosphereShift: 0,
    mutationGeneration: 0,
    lastAction: null,
    lastActionAtMs: 0,
    observeCount: 0,
    enterCastleCount: 0
  });
}

/**
 * @param {unknown} raw
 */
export function parseWorldMutationLedgerV0(raw) {
  if (!raw || typeof raw !== "object") return null;
  const o = /** @type {Record<string, unknown>} */ (raw);
  if (o.schema !== WORLD_MUTATION_FEEDBACK_SCHEMA_V0) return null;
  return Object.freeze({
    schema: WORLD_MUTATION_FEEDBACK_SCHEMA_V0,
    worldInstanceId: String(o.worldInstanceId || ""),
    observationImprint: clamp01(o.observationImprint),
    castleAffinity: clamp01(o.castleAffinity),
    atmosphereShift: clamp01(o.atmosphereShift),
    mutationGeneration: Math.max(0, Number(o.mutationGeneration) || 0),
    lastAction: o.lastAction ? String(o.lastAction) : null,
    lastActionAtMs: Number(o.lastActionAtMs) || 0,
    observeCount: Math.max(0, Number(o.observeCount) || 0),
    enterCastleCount: Math.max(0, Number(o.enterCastleCount) || 0)
  });
}

/**
 * @param {string} worldInstanceId
 */
export function readWorldMutationLedgerV0(worldInstanceId) {
  if (typeof sessionStorage === "undefined") return createEmptyMutationLedgerV0(worldInstanceId);
  try {
    const raw = sessionStorage.getItem(storageKeyV0(worldInstanceId));
    if (!raw) return createEmptyMutationLedgerV0(worldInstanceId);
    return parseWorldMutationLedgerV0(JSON.parse(raw)) || createEmptyMutationLedgerV0(worldInstanceId);
  } catch {
    return createEmptyMutationLedgerV0(worldInstanceId);
  }
}

export function writeWorldMutationLedgerV0(ledger) {
  if (typeof sessionStorage === "undefined" || !ledger?.worldInstanceId) return;
  try {
    sessionStorage.setItem(storageKeyV0(ledger.worldInstanceId), JSON.stringify(ledger));
  } catch {
    /* quota */
  }
}

/**
 * @param {string} worldInstanceId
 */
export function readSealedWorldMutationLedgerV0(worldInstanceId) {
  if (typeof sessionStorage === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(sealKeyV0(worldInstanceId));
    if (!raw) return null;
    return parseWorldMutationLedgerV0(JSON.parse(raw));
  } catch {
    return null;
  }
}

/** Call on pagehide — snapshot for return-visit delta. */
export function sealWorldMutationLedgerV0(worldInstanceId) {
  const cur = readWorldMutationLedgerV0(worldInstanceId);
  if (typeof sessionStorage === "undefined") return;
  try {
    sessionStorage.setItem(sealKeyV0(worldInstanceId), JSON.stringify(cur));
  } catch {
    /* noop */
  }
}

/**
 * Record a user action → deterministic micro-mutation on world instance felt state.
 *
 * @param {{
 *   worldInstanceId: string,
 *   action: 'observe' | 'enter_castle',
 *   identityBinding?: { selfSignature: string, sessionIdentity: string } | null
 * }} io
 */
export function recordWorldMutationV0(io) {
  const id = String(io?.worldInstanceId || "");
  const action = String(io?.action || "");
  if (!id || !action) return { ok: false, ledger: createEmptyMutationLedgerV0(id) };

  const prev = readWorldMutationLedgerV0(id);
  const t = nowMs();
  let next = { ...prev };

  if (action === WORLD_MUTATION_ACTION_V0.OBSERVE) {
    next = {
      ...prev,
      observationImprint: clamp01(prev.observationImprint + 0.12),
      atmosphereShift: clamp01(prev.atmosphereShift + 0.04),
      mutationGeneration: prev.mutationGeneration + 1,
      lastAction: WORLD_MUTATION_ACTION_V0.OBSERVE,
      lastActionAtMs: t,
      observeCount: prev.observeCount + 1
    };
  } else if (action === WORLD_MUTATION_ACTION_V0.ENTER_CASTLE) {
    next = {
      ...prev,
      castleAffinity: clamp01(prev.castleAffinity + 0.18),
      atmosphereShift: clamp01(prev.atmosphereShift + 0.1),
      observationImprint: clamp01(prev.observationImprint + 0.05),
      mutationGeneration: prev.mutationGeneration + 1,
      lastAction: WORLD_MUTATION_ACTION_V0.ENTER_CASTLE,
      lastActionAtMs: t,
      enterCastleCount: prev.enterCastleCount + 1
    };
  } else {
    return { ok: false, ledger: prev };
  }

  let economyResult = null;
  const binding = io.identityBinding;
  if (binding?.selfSignature && binding?.sessionIdentity) {
    economyResult = spendEntropyWithEconomyV0({
      selfSignature: binding.selfSignature,
      sessionIdentity: binding.sessionIdentity,
      action
    });
    if (!economyResult.allowed) {
      return Object.freeze({
        ok: false,
        ledger: prev,
        throttled: true,
        economy: economyResult.state,
        feedbackLine:
          economyResult.feedbackLine || describeEntropyEconomyFeedbackV0({ ...economyResult.state, blocked: true })
      });
    }
    next = applyAttentionDecayToMutationV0({
      prev,
      proposed: next,
      attention01: economyResult.attention01
    });
  }

  const { ledger: calibrated, calibration } = applyWorldDriftCalibrationV0({
    prev,
    proposed: next,
    action,
    economyHandled: Boolean(economyResult),
    entropyRemaining: economyResult?.state?.remaining
  });

  if (!calibration.allowed) {
    return Object.freeze({
      ok: false,
      ledger: prev,
      throttled: true,
      calibration,
      feedbackLine: describeDriftCalibrationFeedbackV0(calibration)
    });
  }

  const ledger = Object.freeze(calibrated);
  writeWorldMutationLedgerV0(ledger);

  const calLine = describeDriftCalibrationFeedbackV0(calibration);
  const ecoLine = economyResult ? describeEntropyEconomyFeedbackV0(economyResult.state) : null;
  return Object.freeze({
    ok: true,
    ledger,
    calibration,
    economy: economyResult?.state ?? null,
    feedbackLine: ecoLine || calLine || describeMutationActionFeedbackV0(action, ledger)
  });
}

/**
 * @param {'observe' | 'enter_castle'} action
 * @param {ReturnType<typeof readWorldMutationLedgerV0>} ledger
 */
export function describeMutationActionFeedbackV0(action, ledger) {
  if (action === WORLD_MUTATION_ACTION_V0.OBSERVE) {
    return "Gözlem izi dünyaya işlendi — örnek hafif derinleşti.";
  }
  if (action === WORLD_MUTATION_ACTION_V0.ENTER_CASTLE) {
    return "Castle teması atmosfere kaydı — nabız yükseldi.";
  }
  if (ledger.mutationGeneration > 0) {
    return "Dünya örneğinde küçük bir kayma hissediliyor.";
  }
  return null;
}

/**
 * @param {ReturnType<typeof readWorldMutationLedgerV0>} current
 * @param {ReturnType<typeof readWorldMutationLedgerV0> | null} sealed
 */
export function diffMutationLedgersV0(current, sealed) {
  if (!sealed) {
    return Object.freeze({
      hasDelta: current.mutationGeneration > 0,
      generationDelta: current.mutationGeneration,
      imprintDelta: current.observationImprint,
      affinityDelta: current.castleAffinity,
      atmosphereDelta: current.atmosphereShift
    });
  }
  return Object.freeze({
    hasDelta:
      current.mutationGeneration !== sealed.mutationGeneration ||
      Math.abs(current.observationImprint - sealed.observationImprint) > 0.02 ||
      Math.abs(current.castleAffinity - sealed.castleAffinity) > 0.02,
    generationDelta: current.mutationGeneration - sealed.mutationGeneration,
    imprintDelta: current.observationImprint - sealed.observationImprint,
    affinityDelta: current.castleAffinity - sealed.castleAffinity,
    atmosphereDelta: current.atmosphereShift - sealed.atmosphereShift
  });
}

/**
 * @param {{
 *   worldInstanceId: string,
 *   returning?: boolean
 * }} io
 */
export function buildWorldMutationFeedbackV0(io) {
  const current = readWorldMutationLedgerV0(io.worldInstanceId);
  const sealed = readSealedWorldMutationLedgerV0(io.worldInstanceId);
  const delta = diffMutationLedgersV0(current, sealed);

  const recentActionLine =
    current.lastAction === WORLD_MUTATION_ACTION_V0.OBSERVE
      ? "Son hamlen gözlemdi — dünya örneği biraz daha net."
      : current.lastAction === WORLD_MUTATION_ACTION_V0.ENTER_CASTLE
        ? "Son hamlen Castle'dı — atmosfer kaydı."
        : null;

  let returnDeltaLine = null;
  if (io.returning && sealed && delta.hasDelta) {
    const parts = [];
    if (delta.imprintDelta > 0.05) parts.push("gözlem derinliği arttı");
    if (delta.affinityDelta > 0.05) parts.push("Castle yakınlığı güçlendi");
    if (delta.atmosphereDelta > 0.05) parts.push("atmosfer kayması var");
    returnDeltaLine =
      parts.length > 0
        ? `Geri döndüğünde küçük farklar: ${parts.join(" · ")}.`
        : "Geri döndüğünde dünya aynı değil — ama değişim küçük ve sessiz.";
  } else if (io.returning && current.mutationGeneration > 0 && !sealed) {
    returnDeltaLine = "Önceki oturumdan iz taşıyorsun — dünya seni hatırlıyor.";
  }

  const presenceShift = applyMutationToCastlePresenceV0({
    basePulse: 0.4,
    ledger: current
  });

  return Object.freeze({
    schema: WORLD_MUTATION_FEEDBACK_SCHEMA_V0,
    ledger: current,
    sealed,
    delta,
    recentActionLine,
    returnDeltaLine,
    presenceShift,
    worldInstanceWeight:
      current.observationImprint > 0.35
        ? "derinleşmiş gözlem katmanı"
        : current.castleAffinity > 0.35
          ? "Castle'a yakın örnek"
          : "hafif tohum"
  });
}

/**
 * @param {{ basePulse: number, ledger: ReturnType<typeof readWorldMutationLedgerV0> }} io
 */
export function applyMutationToCastlePresenceV0(io) {
  const base = clamp01(io.basePulse);
  const L = io.ledger;
  const pulse = clamp01(base + L.castleAffinity * 0.22 + L.atmosphereShift * 0.08);
  const tintWarmth = clamp01(0.35 + L.atmosphereShift * 0.4 + L.observationImprint * 0.15);
  return Object.freeze({
    pulse01: pulse,
    tintWarmth,
    atmosphereBias:
      L.atmosphereShift > 0.55 ? "shifted_warm" : L.atmosphereShift > 0.2 ? "shifted_neutral" : "baseline"
  });
}

export function clearWorldMutationForTestV0(worldInstanceId) {
  if (typeof sessionStorage === "undefined") return;
  try {
    if (worldInstanceId) {
      sessionStorage.removeItem(storageKeyV0(worldInstanceId));
      sessionStorage.removeItem(sealKeyV0(worldInstanceId));
    } else {
      for (let i = sessionStorage.length - 1; i >= 0; i -= 1) {
        const k = sessionStorage.key(i);
        if (k && k.startsWith(STORAGE_KEY_V0)) sessionStorage.removeItem(k);
      }
    }
  } catch {
    /* noop */
  }
}
