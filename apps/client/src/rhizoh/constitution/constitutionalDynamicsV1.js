/**
 * RHIZOH Constitutional dynamics v1 — single-tick aggregator: normative state (membrane, claim, firewall,
 * deception, identity) + causal replay frame (seal chain). Not a blockchain; causal seal chain for audit/replay.
 */

import { RHIZOH_ACTION_POLICY_VERSION, evaluateRhizohMembraneGate } from "./actionPolicyMatrixV1.js";
import { RHIZOH_CLAIM_CONTRACT_VERSION, evaluateRhizohClaimGate } from "./claimContractLayerV1.js";
import {
  RHIZOH_IDENTITY_CONSTITUTION_VERSION,
  tickRhizohIdentityConstitutionSnapshot,
  suggestRhizohMembraneFloorFromConstitution
} from "./identityConstitutionV1.js";
import { RHIZOH_EMOTIONAL_FIREWALL_VERSION, evaluateRhizohEmotionalFirewall } from "./emotionalFirewallV1.js";
import { RHIZOH_DECEPTION_DETECTION_VERSION, evaluateRhizohDeceptionDetection } from "./deceptionDetectionV1.js";
import { resolveRhizohThetaPhase } from "./thetaPhaseTransitionV1.js";

export const RHIZOH_CONSTITUTIONAL_DYNAMICS_VERSION = "1.5.0";

/**
 * @typedef {import('./identityConstitutionV1.js').RhizohIdentityConstitutionSnapshot} RhizohIdentityConstitutionSnapshot
 */

/**
 * @typedef {{
 *   subjectId?: string,
 *   now: number,
 *   identity: RhizohIdentityConstitutionSnapshot,
 *   identityTick?: { active?: boolean, deltaTrust?: number },
 *   actorMembraneFloor?: string | null,
 *   kernelActionId?: string | null,
 *   claimPartial?: import('./claimContractLayerV1.js').RhizohClaimContractEnvelope | Record<string, unknown> | null,
 *   affectRaw?: import('./emotionalFirewallV1.js').RhizohAffectEnvelope | Record<string, unknown> | null,
 *   deceptionInput?: Parameters<typeof evaluateRhizohDeceptionDetection>[0] | null,
 *   parentSealHash?: string | null,
 *   causalEdges?: ReadonlyArray<{ from: string, to: string, kind?: string }>,
 *   replayWeightHints?: { impact?: number, novelty?: number, divergence?: number },
 *   adaptation?: {
 *     thetaPrev?: number,
 *     targetStress?: number,
 *     alpha?: number,
 *     thetaMin?: number,
 *     thetaMax?: number,
 *     disabled?: boolean,
 *     // Önceki LLM turundan kapalı döngü geri beslemesi [0,1] — belirsizlik kanalına karışır
 *     priorLlmStressBump?: number,
 *     immuneThresholdsBase?: Partial<{
 *       stressTrigger: number,
 *       throttleTrigger: number,
 *       cooldownTrigger: number,
 *       quarantineStressMin: number
 *     }>
 *   }
 * }} RhizohConstitutionalTickSnapshot
 */

/**
 * @typedef {{
 *   frameVersion: string,
 *   constitutionVersions: Record<string, string>,
 *   tickAt: number,
 *   subjectId: string | null,
 *   snapshotHash: string,
 *   decisionEnvelope: Record<string, unknown>,
 *   uncertaintyEnvelope: Record<string, unknown>,
 *   causalEdges: ReadonlyArray<{ from: string, to: string, kind?: string }>,
 *   parentSealHash: string | null,
 *   sealHash: string | null,
 *   replayWeight: number
 * }} RhizohConstitutionalReplayFrame
 */

function stableSerialize(value) {
  if (value === null || typeof value !== "object") return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map((x) => stableSerialize(x)).join(",")}]`;
  const keys = Object.keys(value).sort();
  return `{${keys.map((k) => JSON.stringify(k) + ":" + stableSerialize(value[k])).join(",")}}`;
}

/**
 * @param {string} text
 */
async function sha256HexUtf8(text) {
  if (typeof globalThis.crypto?.subtle?.digest === "function") {
    const buf = await globalThis.crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
    return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, "0")).join("");
  }
  let h = 5381;
  for (let i = 0; i < text.length; i++) h = Math.imul(h, 33) ^ text.charCodeAt(i);
  return `fallback_${(h >>> 0).toString(16)}_${text.length}`;
}

/**
 * Formal sketch: SealWeight = f(impact, novelty, uncertainty, divergence).
 * @param {{
 *   impact?: number,
 *   novelty?: number,
 *   uncertainty?: number,
 *   divergence?: number
 * }} p
 */
export function computeRhizohReplaySealWeight(p) {
  const impact = clamp01(p.impact ?? 0);
  const novelty = clamp01(p.novelty ?? 0);
  const uncertainty = clamp01(p.uncertainty ?? 0);
  const divergence = clamp01(p.divergence ?? 0);
  const w = 0.32 * impact + 0.22 * novelty + 0.28 * uncertainty + 0.18 * divergence;
  return Math.round(clamp01(w) * 1000) / 1000;
}

function clamp01(x) {
  const n = Number(x);
  if (!Number.isFinite(n)) return 0;
  return Math.max(0, Math.min(1, n));
}

/**
 * Policy hooks: organism stress index → containment mode (calibrate in deployment).
 */
export const RHIZOH_ORGANISM_STRESS_DEFAULTS_V1 = Object.freeze({
  throttleStressMin: 0.42,
  cooloffStressMin: 0.58,
  amputationStressMin: 0.74,
  quarantineStressMin: 0.88
});

/** Default immune-band triggers (mapped to organism stress mins in tick). */
export const RHIZOH_DEFAULT_IMMUNE_THRESHOLDS_V1 = Object.freeze({
  stressTrigger: RHIZOH_ORGANISM_STRESS_DEFAULTS_V1.throttleStressMin,
  throttleTrigger: RHIZOH_ORGANISM_STRESS_DEFAULTS_V1.cooloffStressMin,
  cooldownTrigger: RHIZOH_ORGANISM_STRESS_DEFAULTS_V1.amputationStressMin,
  quarantineStressMin: RHIZOH_ORGANISM_STRESS_DEFAULTS_V1.quarantineStressMin
});

/**
 * Constitutional potential / organism stress (immune × replay bridge).
 * Potential = Risk + Uncertainty + Conflict − Trust (literal mix; terms in [0,1]).
 * stressIndex = normalized scalar in [0,1] for thresholds.
 *
 * @param {{
 *   risk: number,
 *   uncertainty: number,
 *   conflict: number,
 *   trust: number
 * }} components
 */
export function computeRhizohConstitutionalPotential(components) {
  const risk = clamp01(components.risk);
  const uncertainty = clamp01(components.uncertainty);
  const conflict = clamp01(components.conflict);
  const trust = clamp01(components.trust);
  const raw = Math.round((risk + uncertainty + conflict - trust) * 1000) / 1000;
  const stressIndex = Math.round(clamp01((raw + 1) / 3) * 1000) / 1000;
  return {
    raw,
    stressIndex,
    components: { risk, uncertainty, conflict, trust }
  };
}

/**
 * @param {number} stressIndex
 * @param {Partial<typeof RHIZOH_ORGANISM_STRESS_DEFAULTS_V1>} [cfg]
 */
export function resolveRhizohOrganismStressResponse(stressIndex, cfg = {}) {
  const c = { ...RHIZOH_ORGANISM_STRESS_DEFAULTS_V1, ...cfg };
  const s = clamp01(stressIndex);
  if (s >= c.quarantineStressMin) {
    return {
      mode: /** @type {const} */ ("quarantine"),
      throttleFactor: 0,
      recommendedCooloffMs: 120_000,
      recommendedLocalAmputation: true
    };
  }
  if (s >= c.amputationStressMin) {
    return {
      mode: /** @type {const} */ ("local_amputation"),
      throttleFactor: 0.12,
      recommendedCooloffMs: 45_000,
      recommendedLocalAmputation: true
    };
  }
  if (s >= c.cooloffStressMin) {
    return {
      mode: /** @type {const} */ ("cooloff"),
      throttleFactor: 0.28,
      recommendedCooloffMs: 12_000,
      recommendedLocalAmputation: false
    };
  }
  if (s >= c.throttleStressMin) {
    return {
      mode: /** @type {const} */ ("throttle"),
      throttleFactor: 0.55,
      recommendedCooloffMs: 0,
      recommendedLocalAmputation: false
    };
  }
  return {
    mode: /** @type {const} */ ("nominal"),
    throttleFactor: 1,
    recommendedCooloffMs: 0,
    recommendedLocalAmputation: false
  };
}

/**
 * Constitutional adaptation law (adaptive immunity).
 * θ_{t+1} = clamp(θ_t + α · (Stress − Target)); θ_effective = 0 when adaptation.disabled.
 */
export const RHIZOH_CONSTITUTIONAL_ADAPTATION_DEFAULTS_V1 = Object.freeze({
  targetStress: 0.38,
  alpha: 0.035,
  thetaMin: 0,
  thetaMax: 1,
  cooloffGamma: 0.6,
  claimStrictnessEta: 0.5,
  /** Scales the 0.4 factor in immune threshold compression: scale = 1 − θ · 0.4 · thresholdShiftScale */
  thresholdShiftScale: 1.0
});

/**
 * @param {{
 *   thetaPrev: number,
 *   stressIndex: number,
 *   targetStress?: number,
 *   alpha?: number,
 *   thetaMin?: number,
 *   thetaMax?: number,
 *   adaptation?: { disabled?: boolean }
 * }} args
 */
export function stepRhizohConstitutionalAdaptation(args) {
  const d = RHIZOH_CONSTITUTIONAL_ADAPTATION_DEFAULTS_V1;
  const adaptation = args.adaptation && typeof args.adaptation === "object" ? args.adaptation : {};
  const disabled = adaptation.disabled ?? false;

  const targetStress = args.targetStress != null ? Number(args.targetStress) : d.targetStress;
  const alpha = args.alpha != null ? Number(args.alpha) : d.alpha;
  const thetaMin = args.thetaMin != null ? Number(args.thetaMin) : d.thetaMin;
  const thetaMax = args.thetaMax != null ? Number(args.thetaMax) : d.thetaMax;
  const thetaPrev = Number(args.thetaPrev) || 0;
  const stressIndex = clamp01(args.stressIndex);

  const delta = disabled ? 0 : alpha * (stressIndex - clamp01(targetStress));

  let thetaNext = thetaPrev + delta;
  thetaNext = Math.max(thetaMin, Math.min(thetaMax, thetaNext));
  thetaNext = Math.round(thetaNext * 10000) / 10000;

  const law = "θ_{t+1} = clamp(θ_t + α · (Stress − Target))";
  const thetaEffective = disabled ? 0 : thetaNext;

  return {
    thetaPrev,
    thetaNext,
    delta: Math.round(delta * 10000) / 10000,
    thetaEffective,
    law,
    stressIndex,
    targetStress: clamp01(targetStress),
    alpha
  };
}

/**
 * θ rises → scale falls → triggers fire earlier (stricter immune membrane).
 * @param {{
 *   stressTrigger: number,
 *   throttleTrigger: number,
 *   cooldownTrigger: number,
 *   quarantineStressMin?: number,
 *   [key: string]: unknown
 * }} thresholds
 * @param {number} theta
 */
export function applyRhizohAdaptationToOrganismThresholds(thresholds, theta) {
  const th = clamp01(theta);
  const k = 0.4 * (RHIZOH_CONSTITUTIONAL_ADAPTATION_DEFAULTS_V1.thresholdShiftScale ?? 1);
  const scale = Math.max(0.05, Math.min(1, 1 - th * k));
  const out = {
    ...thresholds,
    stressTrigger: Number(thresholds.stressTrigger) * scale,
    throttleTrigger: Number(thresholds.throttleTrigger) * scale,
    cooldownTrigger: Number(thresholds.cooldownTrigger) * scale
  };
  if (typeof thresholds.quarantineStressMin === "number") {
    out.quarantineStressMin = thresholds.quarantineStressMin * scale;
  }
  return out;
}

/**
 * @param {ReturnType<typeof resolveRhizohOrganismStressResponse>} response
 * @param {number} theta
 * @param {number} [gamma]
 */
export function applyRhizohAdaptationToCooloff(response, theta, gamma) {
  const g = gamma != null ? Number(gamma) : RHIZOH_CONSTITUTIONAL_ADAPTATION_DEFAULTS_V1.cooloffGamma;
  const multiplier = 1 + g * clamp01(theta);
  return {
    ...response,
    recommendedCooloffMs: Math.round(Number(response.recommendedCooloffMs || 0) * multiplier),
    adaptationCooloffMultiplier: Math.round(multiplier * 1000) / 1000
  };
}

/**
 * Tighten claim cap under stress memory. Fractional caps [0,1] stay fractional; integer caps use floor path.
 * @param {number} cap
 * @param {number} theta
 * @param {number} [eta]
 */
export function applyRhizohAdaptationToClaimCap(cap, theta, eta) {
  if (cap == null || typeof cap !== "number" || !Number.isFinite(cap)) return cap;
  const e = eta != null ? Number(eta) : RHIZOH_CONSTITUTIONAL_ADAPTATION_DEFAULTS_V1.claimStrictnessEta;
  const multiplier = 1 - e * clamp01(theta);
  if (cap <= 1 && cap >= 0) {
    return Math.round(Math.max(0, Math.min(1, cap * multiplier)) * 1000) / 1000;
  }
  return Math.max(1, Math.floor(cap * multiplier));
}

/**
 * Build canonical replay frame (sealHash filled by sealConstitutionalReplayFrame).
 * @param {{
 *   tickAt: number,
 *   subjectId: string | null,
 *   snapshotSubset: unknown,
 *   decisionEnvelope: Record<string, unknown>,
 *   uncertaintyEnvelope: Record<string, unknown>,
 *   causalEdges: ReadonlyArray<{ from: string, to: string, kind?: string }>,
 *   parentSealHash: string | null,
 *   replayWeight: number
 * }} p
 */
export async function serializeConstitutionalReplayFrame(p) {
  const constitutionVersions = {
    dynamics: RHIZOH_CONSTITUTIONAL_DYNAMICS_VERSION,
    action: RHIZOH_ACTION_POLICY_VERSION,
    claim: RHIZOH_CLAIM_CONTRACT_VERSION,
    identity: RHIZOH_IDENTITY_CONSTITUTION_VERSION,
    firewall: RHIZOH_EMOTIONAL_FIREWALL_VERSION,
    deception: RHIZOH_DECEPTION_DETECTION_VERSION
  };
  const snapshotHash = await sha256HexUtf8(stableSerialize(p.snapshotSubset));
  /** @type {RhizohConstitutionalReplayFrame} */
  const frame = {
    frameVersion: RHIZOH_CONSTITUTIONAL_DYNAMICS_VERSION,
    constitutionVersions,
    tickAt: p.tickAt,
    subjectId: p.subjectId,
    snapshotHash,
    decisionEnvelope: p.decisionEnvelope,
    uncertaintyEnvelope: p.uncertaintyEnvelope,
    causalEdges: p.causalEdges || [],
    parentSealHash: p.parentSealHash ?? null,
    sealHash: null,
    replayWeight: Math.round(clamp01(p.replayWeight) * 1000) / 1000
  };
  return frame;
}

/**
 * sealHash = H(parentSealHash + "|" + canonicalBody) where canonicalBody is the frame without seal fields
 * (parent binds the chain explicitly outside the serialized body).
 * @param {RhizohConstitutionalReplayFrame} frame
 */
export async function sealConstitutionalReplayFrame(frame) {
  const inner = { ...frame, sealHash: null, parentSealHash: null };
  const canonical = stableSerialize(inner);
  const payload = `${frame.parentSealHash || "genesis"}|${canonical}`;
  const sealHash = await sha256HexUtf8(payload);
  return { ...frame, sealHash };
}

/**
 * Single constitutional tick: normative outputs + replay frame + seal.
 * @param {RhizohConstitutionalTickSnapshot} snapshot
 * @param {{ skipSeal?: boolean }} [opts]
 */
export async function constitutionalTick(snapshot, opts = {}) {
  const now = Number(snapshot.now);
  const subjectId = snapshot.subjectId != null ? String(snapshot.subjectId) : null;

  const identity = tickRhizohIdentityConstitutionSnapshot(snapshot.identity, {
    now,
    active: snapshot.identityTick?.active,
    deltaTrust: snapshot.identityTick?.deltaTrust
  });

  const derived = suggestRhizohMembraneFloorFromConstitution({
    trust: identity.trust,
    stake: identity.stake,
    risk: identity.risk,
    anchoredAt: identity.firstAnchoredAt,
    now
  });

  const declared = snapshot.actorMembraneFloor != null && String(snapshot.actorMembraneFloor).length > 0
    ? String(snapshot.actorMembraneFloor)
    : null;
  const effectiveFloor = declared || derived.floor;

  const membraneDecision = {
    derivedFloor: derived.floor,
    derivedReason: derived.reason,
    declaredFloor: declared,
    effectiveFloor,
    influence: derived.influence,
    timeFactor: derived.timeFactor
  };

  /** @type {Record<string, unknown>} */
  const decisionEnvelope = {
    membrane: membraneDecision,
    identity: {
      trust: identity.trust,
      stake: identity.stake,
      risk: identity.risk,
      membraneFloorHint: identity.membraneFloorHint,
      influenceHint: identity.influenceHint,
      lastActiveAt: identity.lastActiveAt
    }
  };

  /** @type {Record<string, unknown>} */
  const uncertaintyEnvelope = {};

  let claimResult = null;
  if (snapshot.claimPartial && snapshot.claimPartial.class) {
    claimResult = evaluateRhizohClaimGate(
      /** @type {any} */ (snapshot.claimPartial),
      {
        actorMembraneFloor: effectiveFloor,
        kernelActionId: snapshot.kernelActionId
      }
    );
    decisionEnvelope.claimGate = claimResult;
    if (claimResult.envelope) {
      uncertaintyEnvelope.claimClass = claimResult.envelope.class;
      uncertaintyEnvelope.claimConfidenceCap = claimResult.envelope.confidence;
    }
  }

  let firewallResult = null;
  if (snapshot.affectRaw && typeof snapshot.affectRaw === "object") {
    firewallResult = evaluateRhizohEmotionalFirewall(snapshot.affectRaw);
    decisionEnvelope.firewall = {
      verdict: firewallResult.verdict,
      ok: firewallResult.ok,
      delayMs: firewallResult.delayMs,
      manipulationRisk: firewallResult.manipulationRisk
    };
    uncertaintyEnvelope.manipulationRisk = firewallResult.manipulationRisk;
    uncertaintyEnvelope.suggestedClaimConfidenceCap = firewallResult.suggestedClaimConfidenceCap;
  }

  let deceptionResult = null;
  if (snapshot.deceptionInput && snapshot.deceptionInput.claimId) {
    deceptionResult = evaluateRhizohDeceptionDetection(snapshot.deceptionInput);
    decisionEnvelope.deception = {
      truthConfidence: deceptionResult.truthConfidence,
      deceptionRisk: deceptionResult.deceptionRisk,
      ok: deceptionResult.ok,
      contradictionPenalty: deceptionResult.contradictionPenalty
    };
    uncertaintyEnvelope.deceptionRisk = deceptionResult.deceptionRisk;
    uncertaintyEnvelope.truthConfidence = deceptionResult.truthConfidence;
    uncertaintyEnvelope.uncertaintyAfterPropagation = deceptionResult.uncertaintyAfterPropagation;
  }

  let actionGate = null;
  if (snapshot.kernelActionId) {
    actionGate = evaluateRhizohMembraneGate(snapshot.kernelActionId, effectiveFloor);
    decisionEnvelope.actionMembrane = {
      ok: actionGate.ok,
      error: actionGate.ok ? undefined : actionGate.error,
      semanticKind: actionGate.policy?.semanticKind,
      requiredFloor: actionGate.policy?.identityFloor
    };
  }

  const claimCapRaw =
    firewallResult?.suggestedClaimConfidenceCap ??
    (claimResult?.envelope ? claimResult.envelope.confidence : null);

  const risk = clamp01(identity.risk);
  const llmSurfaceUncertainty = clamp01(snapshot.adaptation?.priorLlmStressBump ?? 0) * 0.75;
  const uncertainty = Math.max(
    firewallResult?.manipulationRisk ?? 0,
    deceptionResult?.uncertaintyAfterPropagation ?? 0,
    deceptionResult ? 1 - deceptionResult.truthConfidence : 0,
    llmSurfaceUncertainty
  );
  let conflict = deceptionResult?.contradictionPenalty ?? 0;
  if (claimResult && claimResult.ok === false) conflict = Math.max(conflict, 0.55);
  if (actionGate && !actionGate.ok) conflict = Math.max(conflict, 0.48);
  if (declared && derived.floor !== effectiveFloor) conflict = Math.max(conflict, 0.2);
  const trust = clamp01(identity.trust);

  const constitutionalPotential = computeRhizohConstitutionalPotential({
    risk,
    uncertainty,
    conflict,
    trust
  });

  const adaptDisabled = snapshot.adaptation?.disabled === true;
  const thetaPrev = Number(snapshot.adaptation?.thetaPrev) || 0;

  const adaptationStep = stepRhizohConstitutionalAdaptation({
    thetaPrev,
    stressIndex: constitutionalPotential.stressIndex,
    targetStress: snapshot.adaptation?.targetStress,
    alpha: snapshot.adaptation?.alpha,
    thetaMin: snapshot.adaptation?.thetaMin,
    thetaMax: snapshot.adaptation?.thetaMax,
    adaptation: { disabled: adaptDisabled }
  });

  const thetaEffective = adaptationStep.thetaEffective;

  const immuneThresholdsBase = {
    ...RHIZOH_DEFAULT_IMMUNE_THRESHOLDS_V1,
    ...(snapshot.adaptation?.immuneThresholdsBase || {})
  };
  const adaptedImmuneThresholds = applyRhizohAdaptationToOrganismThresholds(
    immuneThresholdsBase,
    thetaEffective
  );
  const adaptedStressThresholds = {
    throttleStressMin: adaptedImmuneThresholds.stressTrigger,
    cooloffStressMin: adaptedImmuneThresholds.throttleTrigger,
    amputationStressMin: adaptedImmuneThresholds.cooldownTrigger,
    quarantineStressMin:
      typeof adaptedImmuneThresholds.quarantineStressMin === "number"
        ? adaptedImmuneThresholds.quarantineStressMin
        : RHIZOH_ORGANISM_STRESS_DEFAULTS_V1.quarantineStressMin
  };

  let organismStress = resolveRhizohOrganismStressResponse(
    constitutionalPotential.stressIndex,
    adaptedStressThresholds
  );
  organismStress = applyRhizohAdaptationToCooloff(organismStress, thetaEffective);

  const constitutionalAdaptation = {
    thetaPrev: adaptationStep.thetaPrev,
    thetaNext: adaptationStep.thetaNext,
    delta: adaptationStep.delta,
    thetaEffective: adaptationStep.thetaEffective,
    stressIndex: adaptationStep.stressIndex,
    targetStress: adaptationStep.targetStress,
    alpha: adaptationStep.alpha,
    disabled: adaptDisabled,
    law: adaptationStep.law,
    adaptedImmuneThresholds,
    adaptedStressThresholds
  };

  const thetaPhase = resolveRhizohThetaPhase(thetaEffective);
  constitutionalAdaptation.thetaPhase = thetaPhase.phase;
  constitutionalAdaptation.thetaPhaseModifiers = {
    organismBias: thetaPhase.organismBias,
    claimCapBias: thetaPhase.claimCapBias,
    llmHedgeBias: thetaPhase.llmHedgeBias,
    replaySealAggression: thetaPhase.replaySealAggression
  };

  uncertaintyEnvelope.constitutionalPotential = {
    raw: constitutionalPotential.raw,
    stressIndex: constitutionalPotential.stressIndex,
    components: constitutionalPotential.components
  };
  uncertaintyEnvelope.constitutionalAdaptation = {
    thetaNext: adaptationStep.thetaNext,
    thetaEffective,
    delta: adaptationStep.delta,
    targetStress: adaptationStep.targetStress,
    thetaPhase: thetaPhase.phase,
    llmHedgeBias: thetaPhase.llmHedgeBias
  };

  decisionEnvelope.organismStress = {
    mode: organismStress.mode,
    throttleFactor: organismStress.throttleFactor,
    recommendedCooloffMs: organismStress.recommendedCooloffMs,
    recommendedLocalAmputation: organismStress.recommendedLocalAmputation,
    adaptationCooloffMultiplier: organismStress.adaptationCooloffMultiplier
  };
  decisionEnvelope.constitutionalAdaptation = constitutionalAdaptation;

  let claimCap = claimCapRaw;
  if (claimCap != null && typeof claimCap === "number") {
    claimCap = Math.round(clamp01(claimCap * organismStress.throttleFactor) * 1000) / 1000;
    claimCap = applyRhizohAdaptationToClaimCap(claimCap, thetaEffective);
  }

  const baseAllow =
    (actionGate == null || actionGate.ok) &&
    (firewallResult == null || firewallResult.ok) &&
    (claimResult == null || claimResult.ok !== false);

  const organismBlocks =
    organismStress.mode === "quarantine" || organismStress.mode === "local_amputation";

  const executionEnvelope = {
    allowExecution: baseAllow && !organismBlocks,
    effectiveMembraneFloor: effectiveFloor,
    claimConfidenceCap: claimCap,
    blockReasons: [
      actionGate && !actionGate.ok ? `action:${actionGate.error}` : null,
      firewallResult && !firewallResult.ok ? `firewall:${firewallResult.reason}` : null,
      claimResult && claimResult.ok === false ? `claim:${claimResult.code}` : null,
      organismBlocks ? `organism:${organismStress.mode}` : null
    ].filter(Boolean),
    organismStress: {
      mode: organismStress.mode,
      stressIndex: constitutionalPotential.stressIndex,
      raw: constitutionalPotential.raw,
      throttleFactor: organismStress.throttleFactor,
      recommendedCooloffMs: organismStress.recommendedCooloffMs,
      adaptationTheta: thetaEffective,
      adaptationCooloffMultiplier: organismStress.adaptationCooloffMultiplier ?? 1
    },
    constitutionalAdaptation: {
      thetaNext: adaptationStep.thetaNext,
      delta: adaptationStep.delta,
      targetStress: adaptationStep.targetStress,
      disabled: adaptDisabled
    }
  };

  const causalEdges = snapshot.causalEdges || [];

  const uncertaintyForWeight = Math.max(
    uncertaintyEnvelope.deceptionRisk != null ? Number(uncertaintyEnvelope.deceptionRisk) : 0,
    uncertaintyEnvelope.manipulationRisk != null ? Number(uncertaintyEnvelope.manipulationRisk) : 0,
    deceptionResult?.uncertaintyAfterPropagation != null ? Number(deceptionResult.uncertaintyAfterPropagation) : 0,
    constitutionalPotential.stressIndex
  );

  const replayWeight = computeRhizohReplaySealWeight({
    impact: snapshot.replayWeightHints?.impact ?? (snapshot.kernelActionId ? 0.55 : 0.2),
    novelty: snapshot.replayWeightHints?.novelty ?? (claimResult ? 0.45 : 0.15),
    uncertainty: uncertaintyForWeight,
    divergence: snapshot.replayWeightHints?.divergence ?? (derived.floor !== effectiveFloor ? 0.4 : 0.1)
  });

  const snapshotSubset = {
    subjectId,
    now,
    identityTick: snapshot.identityTick,
    actorMembraneFloor: declared,
    kernelActionId: snapshot.kernelActionId,
    claimClass: snapshot.claimPartial?.class,
    affectKeys: snapshot.affectRaw ? Object.keys(snapshot.affectRaw).sort() : null,
    deceptionClaimId: snapshot.deceptionInput?.claimId,
    constitutionalStressIndex: constitutionalPotential.stressIndex,
    adaptiveTheta: adaptationStep.thetaNext,
    thetaPhase: thetaPhase.phase
  };

  let replayFrame = await serializeConstitutionalReplayFrame({
    tickAt: now,
    subjectId,
    snapshotSubset,
    decisionEnvelope,
    uncertaintyEnvelope,
    causalEdges,
    parentSealHash: snapshot.parentSealHash ?? null,
    replayWeight
  });

  if (!opts.skipSeal) {
    replayFrame = await sealConstitutionalReplayFrame(replayFrame);
  }

  return {
    dynamicsVersion: RHIZOH_CONSTITUTIONAL_DYNAMICS_VERSION,
    tickAt: now,
    subjectId,
    identity,
    membrane: membraneDecision,
    constitutionalPotential,
    organismStress,
    constitutionalAdaptation,
    thetaPhase,
    claim: claimResult,
    affect: firewallResult,
    deception: deceptionResult,
    actionGate,
    executionEnvelope,
    replayFrame
  };
}
