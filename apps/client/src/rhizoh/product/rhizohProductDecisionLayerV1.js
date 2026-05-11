/**
 * Product decision layer — rollup metriklerinden UX / faz eşiği / capability gate türetir.
 * Deterministik; harici servis yok. `castle:product-decision` ile gözlemlenebilir.
 */

export const RHIZOH_PRODUCT_DECISION_LAYER_VERSION = "1.0.0";

export const CASTLE_PRODUCT_DECISION_EVENT = "castle:product-decision";

const DEFAULT_UX = { closureBannerMs: 12_000 };

const DEFAULT_PHASE_TUNING = Object.freeze({
  introTurnsForTrust: 6,
  introSeenTurnsForTrust: 3,
  trustBondForNormal: 0.34,
  trustTurnsForNormal: 12
});

const DEFAULT_GATES = Object.freeze({
  suppressGovernanceOpsBadgeUnlessBond01: null
});

/**
 * @param {{ rollup?: object, derived?: object } | null | undefined} snapshot getRhizohBehaviorMetricsSnapshot çıktısı veya { rollup, derived }
 */
export function computeRhizohProductDecisionOverlay(snapshot) {
  /** @type {string[]} */
  const rationale = [];
  const ux = { ...DEFAULT_UX };
  const phaseTuning = { ...DEFAULT_PHASE_TUNING };
  const capabilityGates = { ...DEFAULT_GATES };

  const snap = snapshot && typeof snapshot === "object" ? snapshot : null;
  const rollup = snap?.rollup && typeof snap.rollup === "object" ? snap.rollup : {};
  const derived = snap?.derived && typeof snap.derived === "object" ? snap.derived : {};

  const dismissT = Number(rollup.closureDismiss?.timeout) || 0;
  const dismissR = Number(rollup.closureDismiss?.replaced_or_unmount) || 0;
  const dismissSum = dismissT + dismissR;

  if (dismissSum >= 4 && dismissT >= dismissR) {
    ux.closureBannerMs = dismissSum >= 10 ? 20_000 : 16_000;
    rationale.push("metrics:closure_timeout_pressure");
  }

  const avgDepth = Number(derived.avgTurnDepth);
  const turnN = Number(rollup.turnDepthCount) || 0;
  if (Number.isFinite(avgDepth) && avgDepth < 0.14 && turnN >= 10) {
    phaseTuning.introTurnsForTrust = 5;
    rationale.push("metrics:shallow_intro_compress");
  }

  const dwellTb = Number(rollup.phaseDwellMs?.TRUST_BUILD) || 0;
  const enteredNorm = Number(rollup.phaseEnterCount?.NORMAL_CHAT) || 0;
  if (dwellTb > 180_000 && turnN >= 18 && enteredNorm < 1) {
    phaseTuning.trustBondForNormal = 0.28;
    phaseTuning.trustTurnsForNormal = 10;
    rationale.push("metrics:trust_build_stall_relax");
  }

  if (Number.isFinite(avgDepth) && avgDepth < 0.11 && turnN >= 12) {
    capabilityGates.suppressGovernanceOpsBadgeUnlessBond01 = 0.42;
    rationale.push("metrics:governance_noise_gate");
  }

  const out = {
    schemaVersion: "1.0.0",
    decisionLayerVersion: RHIZOH_PRODUCT_DECISION_LAYER_VERSION,
    evaluatedAt: Date.now(),
    ux,
    phaseTuning,
    capabilityGates,
    rationale
  };

  return out;
}

/**
 * @param {ReturnType<computeRhizohProductDecisionOverlay>} overlay
 */
export function emitRhizohProductDecisionSignal(overlay) {
  if (typeof window === "undefined" || !overlay) return;
  try {
    window.dispatchEvent(new CustomEvent(CASTLE_PRODUCT_DECISION_EVENT, { detail: overlay }));
  } catch {
    /* noop */
  }
}
