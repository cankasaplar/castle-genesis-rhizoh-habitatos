/**
 * Castle Stability Co-Governor v1.6 — negotiated stability field (user + system).
 * @see apps/client/docs/RHIZOH_CASTLE_OS_V1_6.md
 */

import { logVoiceInfoV0 } from "../rhizoh/runtime/rhizohProductionLogNamespacesV0.js";
import { REALITY_PHASE_V1_5 } from "./castleRealityPhaseEngineV1_5.js";

export const CASTLE_STABILITY_CO_GOVERNOR_SCHEMA_V1_6 = "castle.stability_co_governor.v1.6";

export const CO_GOVERNOR_ROLE_V1_6 = Object.freeze({
  STEERING: "stability_steering",
  CORRECTION: "reality_correction",
  PHASE_OVERRIDE: "phase_override"
});

const PHASE_INDEX_V1_6 = Object.freeze({
  [REALITY_PHASE_V1_5.LOCKED]: 0,
  [REALITY_PHASE_V1_5.STABLE]: 0.33,
  [REALITY_PHASE_V1_5.TRANSITIONAL]: 0.66,
  [REALITY_PHASE_V1_5.VOLATILE]: 1
});

const INDEX_TO_PHASE_V1_6 = Object.freeze([
  REALITY_PHASE_V1_5.LOCKED,
  REALITY_PHASE_V1_5.STABLE,
  REALITY_PHASE_V1_5.TRANSITIONAL,
  REALITY_PHASE_V1_5.VOLATILE
]);

/** @type {Map<string, object>} */
const sessionIntentProfileV1_6 = new Map();

function clamp01(n) {
  return Math.max(0, Math.min(1, Number(n) || 0));
}

function phaseFromIndexV1_6(index) {
  const clamped = clamp01(index);
  if (clamped <= 0.16) return REALITY_PHASE_V1_5.LOCKED;
  if (clamped <= 0.49) return REALITY_PHASE_V1_5.STABLE;
  if (clamped <= 0.82) return REALITY_PHASE_V1_5.TRANSITIONAL;
  return REALITY_PHASE_V1_5.VOLATILE;
}

function phaseGovernorFromPhaseV1_6(phase) {
  switch (phase) {
    case REALITY_PHASE_V1_5.LOCKED:
      return Object.freeze({
        deformationScale: 0.08,
        inertiaCap: 0.95,
        learningEnabled: false,
        freezeFrame: true
      });
    case REALITY_PHASE_V1_5.STABLE:
      return Object.freeze({
        deformationScale: 0.35,
        inertiaCap: 0.75,
        learningEnabled: true,
        freezeFrame: false
      });
    case REALITY_PHASE_V1_5.TRANSITIONAL:
      return Object.freeze({
        deformationScale: 0.65,
        inertiaCap: 0.55,
        learningEnabled: true,
        freezeFrame: false
      });
    case REALITY_PHASE_V1_5.VOLATILE:
    default:
      return Object.freeze({
        deformationScale: 1,
        inertiaCap: 0.35,
        learningEnabled: true,
        freezeFrame: false
      });
  }
}

function signalToUserBiasV1_6(signal) {
  switch (signal) {
    case "fast_explain":
      return 0.74;
    case "accelerate":
    case "add_aliveness":
    case "prioritize_thread":
      return 0.22;
    case "slow_down":
    case "listen_only":
    case "background_thread":
    case "deprioritize":
      return 0.82;
    case "sustain_mode":
    case "cut_freeze":
      return 0.94;
    case "summarize_request":
      return 0.68;
    case "wrong_understanding":
      return 0.5;
    case "switch_social":
      return 0.58;
    default:
      return 0.5;
  }
}

function signalToRoleV1_6(signal) {
  switch (signal) {
    case "wrong_understanding":
    case "deprioritize":
    case "prioritize_thread":
      return CO_GOVERNOR_ROLE_V1_6.CORRECTION;
    case "cut_freeze":
    case "switch_social":
    case "listen_only":
      return CO_GOVERNOR_ROLE_V1_6.PHASE_OVERRIDE;
    default:
      return CO_GOVERNOR_ROLE_V1_6.STEERING;
  }
}

function buildSystemProfileV1_6(realityStability) {
  const phase = realityStability.phase || {};
  return Object.freeze({
    phase: phase.phase || REALITY_PHASE_V1_5.STABLE,
    stabilityScore: phase.stabilityScore ?? 0.5,
    deformationScale: phase.deformationScale ?? 0.35,
    volatility: realityStability.volatility ?? 0,
    learningEnabled: phase.learningEnabled !== false,
    freezeFrame: phase.freezeFrame === true
  });
}

function buildUserIntentProfileV1_6(ownerId, signal, options = {}) {
  const memory = options.memoryPriors;
  const prior = sessionIntentProfileV1_6.get(ownerId) || {
    focusBias: memory?.focusBias ?? 0.5,
    speechPriority: memory?.speechPriority ?? 0.5,
    memoryPriority: memory?.memoryPriority ?? 0.35,
    preferredPhaseRange: Object.freeze({
      min: clamp01((memory?.phaseIndexPrior ?? 0.45) - 0.12),
      max: clamp01((memory?.phaseIndexPrior ?? 0.45) + 0.12)
    })
  };

  let focusBias = prior.focusBias;
  let speechPriority = prior.speechPriority;
  let memoryPriority = prior.memoryPriority;
  let minPhase = prior.preferredPhaseRange.min;
  let maxPhase = prior.preferredPhaseRange.max;

  switch (signal) {
    case "fast_explain":
      speechPriority = clamp01(speechPriority + 0.32);
      focusBias = clamp01(focusBias + 0.18);
      minPhase = 0.16;
      maxPhase = 0.49;
      break;
    case "accelerate":
    case "slow_down":
      speechPriority = clamp01(speechPriority - 0.2);
      focusBias = clamp01(focusBias + 0.15);
      minPhase = 0.16;
      break;
    case "summarize_request":
      speechPriority = clamp01(speechPriority - 0.35);
      memoryPriority = clamp01(memoryPriority + 0.35);
      minPhase = 0.33;
      maxPhase = 0.49;
      break;
    case "listen_only":
      speechPriority = clamp01(speechPriority - 0.45);
      focusBias = clamp01(focusBias + 0.2);
      minPhase = 0;
      maxPhase = 0.33;
      break;
    case "add_aliveness":
      maxPhase = Math.max(maxPhase, 0.82);
      focusBias = clamp01(focusBias - 0.08);
      break;
    case "sustain_mode":
    case "cut_freeze":
      focusBias = clamp01(focusBias + 0.25);
      minPhase = 0;
      maxPhase = 0.16;
      break;
    case "background_thread":
      speechPriority = clamp01(speechPriority - 0.15);
      memoryPriority = clamp01(memoryPriority + 0.1);
      break;
    case "prioritize_thread":
      speechPriority = clamp01(speechPriority + 0.15);
      focusBias = clamp01(focusBias + 0.1);
      break;
    case "deprioritize":
      speechPriority = clamp01(speechPriority - 0.18);
      break;
    case "wrong_understanding":
      speechPriority = clamp01(speechPriority + 0.08);
      break;
    case "switch_social":
      minPhase = 0.49;
      maxPhase = 0.82;
      break;
    default:
      break;
  }

  const profile = Object.freeze({
    focusBias: Number(focusBias.toFixed(4)),
    speechPriority: Number(speechPriority.toFixed(4)),
    memoryPriority: Number(memoryPriority.toFixed(4)),
    preferredPhaseRange: Object.freeze({
      min: Number(minPhase.toFixed(4)),
      max: Number(maxPhase.toFixed(4))
    }),
    sustainLens: options.sustainLens || null,
    targetThreadId: options.targetThreadId || null
  });
  sessionIntentProfileV1_6.set(ownerId, profile);
  return profile;
}

function buildCoGovernorStateV1_6(systemProfile, userBias, userInfluence) {
  const systemStabilityBias = clamp01(systemProfile.stabilityScore ?? 0.5);
  const userStabilityBias = clamp01(userBias);
  const delta = Number((userStabilityBias - systemStabilityBias).toFixed(4));
  const magnitude = Math.abs(delta);
  let direction = "aligned";
  if (delta > 0.12) direction = "user_leans_stable";
  else if (delta < -0.12) direction = "user_leans_fast";

  const finalStabilityWeight = Number(
    clamp01(0.35 + userInfluence * 0.55 + magnitude * 0.25).toFixed(4)
  );

  return Object.freeze({
    userStabilityBias: Number(userStabilityBias.toFixed(4)),
    systemStabilityBias: Number(systemStabilityBias.toFixed(4)),
    negotiationField: Object.freeze({
      delta,
      magnitude: Number(magnitude.toFixed(4)),
      direction,
      userInfluence: Number(userInfluence.toFixed(4))
    }),
    finalStabilityWeight
  });
}

function blendPhaseV1_6(systemPhase, userPhaseIndex, weight) {
  const systemIndex = PHASE_INDEX_V1_6[systemPhase] ?? 0.33;
  const blendedIndex = Number(
    (systemIndex * (1 - weight) + userPhaseIndex * weight).toFixed(4)
  );
  return Object.freeze({
    blendedIndex,
    resolvedPhase: phaseFromIndexV1_6(blendedIndex),
    systemIndex,
    userPhaseIndex
  });
}

function buildStabilityAgreementV1_6(
  userIntentProfile,
  systemProfile,
  coGovernorState,
  phaseBlend,
  deformationRange
) {
  return Object.freeze({
    schema: "castle.stability_agreement.v1.6",
    userIntentProfile,
    systemInferenceProfile: systemProfile,
    negotiatedPhaseRange: Object.freeze({
      min: userIntentProfile.preferredPhaseRange.min,
      max: userIntentProfile.preferredPhaseRange.max,
      systemPhase: systemProfile.phase,
      userPhaseIndex: phaseBlend.userPhaseIndex,
      resolvedPhase: phaseBlend.resolvedPhase,
      blendedIndex: phaseBlend.blendedIndex
    }),
    allowedDeformationRange: deformationRange,
    coGovernorState,
    interactionContract: true
  });
}

function topicMatchesLensV1_6(topicLabel = "", lens = "") {
  const topic = String(topicLabel).toLowerCase();
  if (!lens) return false;
  if (lens === "co_watch") return topic.includes("co_watch") || topic.includes("sport") || topic.includes("match");
  if (lens === "focus") return topic.includes("audiobook") || topic.includes("book") || topic.includes("focus");
  if (lens === "social") return topic.includes("social") || topic.includes("conversation") || topic.includes("chat");
  return topic.includes(lens);
}

function applyAgreementToThreadsV1_6(threads, agreement, feedback) {
  if (!threads.length || !feedback) return threads;

  const signal = feedback.signal;
  const profile = agreement.userIntentProfile;

  if (signal === "cut_freeze") {
    return Object.freeze(
      threads.map((n) =>
        Object.freeze({ ...n, stabilizedShare: n.stabilizedShare ?? n.executionShare ?? 0, frozen: true })
      )
    );
  }

  if (signal === "sustain_mode" && profile.sustainLens) {
    const boosted = threads.map((n) => {
      const base = n.stabilizedShare ?? n.executionShare ?? 0;
      const match = topicMatchesLensV1_6(n.topicLabel, profile.sustainLens);
      const share = match ? clamp01(base * 1.45 + 0.12) : clamp01(base * 0.72);
      return Object.freeze({ ...n, stabilizedShare: share, executionShare: share, deformedShare: share, sustained: match });
    });
    return normalizeThreadSharesV1_6(boosted);
  }

  if (signal === "prioritize_thread" && profile.targetThreadId) {
    return normalizeThreadSharesV1_6(
      threads.map((n) => {
        const base = n.stabilizedShare ?? n.executionShare ?? 0;
        const match = n.threadId === profile.targetThreadId;
        const share = match ? clamp01(base * 1.35 + 0.1) : clamp01(base * 0.78);
        return Object.freeze({ ...n, stabilizedShare: share, executionShare: share, prioritized: match });
      })
    );
  }

  if (signal === "deprioritize" && profile.targetThreadId) {
    return normalizeThreadSharesV1_6(
      threads.map((n) => {
        const base = n.stabilizedShare ?? n.executionShare ?? 0;
        const match = n.threadId === profile.targetThreadId;
        const share = match ? clamp01(base * 0.45) : base;
        return Object.freeze({ ...n, stabilizedShare: share, executionShare: share, deprioritized: match });
      })
    );
  }

  if (signal === "add_aliveness") {
    return Object.freeze(
      threads.map((n) => {
        const base = n.stabilizedShare ?? n.executionShare ?? 0;
        const share = clamp01(base + 0.04);
        return Object.freeze({ ...n, stabilizedShare: share, executionShare: share, alivenessBoost: true });
      })
    );
  }

  return threads;
}

function normalizeThreadSharesV1_6(threads) {
  const sum = threads.reduce((s, n) => s + (n.stabilizedShare ?? n.executionShare ?? 0), 0) || 1;
  return Object.freeze(
    threads.map((n) => {
      const share = Number(((n.stabilizedShare ?? n.executionShare ?? 0) / sum).toFixed(4));
      return Object.freeze({ ...n, stabilizedShare: share, executionShare: share, deformedShare: share });
    })
  );
}

function deriveNegotiatedPlanV1_6(stabilizedPlan, threads, agreement, feedback) {
  const dominant = threads.reduce(
    (a, b) => ((b.stabilizedShare ?? 0) > (a.stabilizedShare ?? 0) ? b : a),
    threads[0]
  );

  const profile = agreement.userIntentProfile;
  const deformation = agreement.allowedDeformationRange.resolved;
  const coState = agreement.coGovernorState;

  let speakShare = stabilizedPlan.speakShare ?? 0;
  let memoryShare = stabilizedPlan.memoryShare ?? 0;
  let highlightShare = stabilizedPlan.highlightShare ?? 0;

  speakShare = clamp01(speakShare * (0.65 + profile.speechPriority * 0.7));
  memoryShare = clamp01(memoryShare * (0.75 + profile.memoryPriority * 0.5));
  highlightShare = clamp01(highlightShare * (0.8 + profile.speechPriority * 0.35));

  if (feedback?.signal === "summarize_request") {
    speakShare = clamp01(Math.min(speakShare, 0.18));
    memoryShare = clamp01(Math.max(memoryShare, 0.42));
  }
  if (feedback?.signal === "listen_only") {
    speakShare = clamp01(Math.min(speakShare, 0.08));
  }
  if (feedback?.signal === "wrong_understanding") {
    speakShare = clamp01(Math.max(speakShare, 0.38));
    highlightShare = clamp01(highlightShare * 1.2);
  }

  speakShare = clamp01(speakShare * (1 - deformation * 0.15 * coState.negotiationField.magnitude));

  const SPEAK_THRESHOLD = 0.35;
  const BACKGROUND_THRESHOLD = 0.1;
  const phase = agreement.negotiatedPhaseRange.resolvedPhase;
  const governor = phaseGovernorFromPhaseV1_6(phase);

  return Object.freeze({
    ...stabilizedPlan,
    humanGoverned: true,
    humanCoGovernance: true,
    humanSignal: feedback?.signal || null,
    coGovernorRole: feedback ? signalToRoleV1_6(feedback.signal) : null,
    phase,
    stabilityScore: Number(
      (agreement.systemInferenceProfile.stabilityScore * (1 - coState.finalStabilityWeight) +
        coState.userStabilityBias * coState.finalStabilityWeight).toFixed(4)
    ),
    speak: speakShare >= SPEAK_THRESHOLD,
    speakShare: Number(speakShare.toFixed(4)),
    memoryWrite: memoryShare >= 0.15,
    memoryShare: Number(memoryShare.toFixed(4)),
    uiHighlight: highlightShare >= 0.2,
    highlightShare: Number(highlightShare.toFixed(4)),
    backgroundNarrative: speakShare >= BACKGROUND_THRESHOLD && speakShare < SPEAK_THRESHOLD,
    dominantThreadId: dominant?.threadId || stabilizedPlan.dominantThreadId,
    learningEnabled: governor.learningEnabled,
    summarySpikeScheduled: feedback?.signal === "summarize_request",
    negotiationActive: coState.negotiationField.magnitude > 0.08
  });
}

export function negotiateStabilityV1_6(realityStability, options = {}) {
  const atMs = Number(options.atMs) || Date.now();
  const ownerId = String(
    options.ownerId || realityStability.dynamics?.contextualIdentity?.ownerId || "user_local"
  );
  const feedback = options.feedback || null;
  const systemProfile = buildSystemProfileV1_6(realityStability);

  if (!feedback || feedback.released) {
    const memory = options.memoryPriors;
    const passiveProfile =
      sessionIntentProfileV1_6.get(ownerId) ||
      buildUserIntentProfileV1_6(ownerId, null, { memoryPriors: memory });
    const passiveBias = memory?.phaseIndexPrior ?? passiveProfile.focusBias;
    const passiveInfluence = memory?.userInfluencePrior ?? 0;
    const coGovernorState = buildCoGovernorStateV1_6(systemProfile, passiveBias, passiveInfluence);
    const phaseBlend = blendPhaseV1_6(
      systemProfile.phase,
      memory?.phaseIndexPrior ?? passiveProfile.focusBias,
      passiveInfluence
    );
    const resolvedDeformation = memory?.learnedPhysicsActive
      ? Number(
          clamp01(
            systemProfile.deformationScale * (1 - passiveInfluence) +
              (1 - passiveBias) * passiveInfluence * 0.5
          ).toFixed(4)
        )
      : systemProfile.deformationScale;

    const agreement = buildStabilityAgreementV1_6(
      passiveProfile,
      systemProfile,
      coGovernorState,
      phaseBlend,
      Object.freeze({
        min: Math.min(systemProfile.deformationScale, resolvedDeformation),
        max: Math.max(systemProfile.deformationScale, resolvedDeformation),
        resolved: resolvedDeformation
      })
    );

    const passivePlan =
      passiveInfluence > 0.05 && memory?.learnedPhysicsActive
        ? deriveNegotiatedPlanV1_6(realityStability.stabilizedPlan, [...(realityStability.stabilizedFrame?.threads || [])], agreement, null)
        : realityStability.stabilizedPlan;

    return Object.freeze({
      schema: CASTLE_STABILITY_CO_GOVERNOR_SCHEMA_V1_6,
      negotiated: passiveInfluence > 0.05 && memory?.learnedPhysicsActive,
      coGovernorState,
      stabilityAgreement: Object.freeze({
        ...agreement,
        memoryPriorsApplied: memory?.learnedPhysicsActive === true
      }),
      negotiatedPlan: passivePlan,
      negotiatedFrame: Object.freeze({
        ...realityStability.stabilizedFrame,
        phase: Object.freeze({
          ...realityStability.phase,
          coGoverned: passiveInfluence > 0.05,
          memoryInfluenced: memory?.learnedPhysicsActive === true
        }),
        memoryPriors: memory || null
      }),
      negotiatedPhase: Object.freeze({
        ...realityStability.phase,
        coGoverned: passiveInfluence > 0.05,
        memoryInfluenced: memory?.learnedPhysicsActive === true
      }),
      atMs
    });
  }

  const userBias = signalToUserBiasV1_6(feedback.signal);
  const memoryInfluence = options.memoryPriors?.userInfluencePrior ?? 0;
  const userInfluence = clamp01(
    (feedback.source === "voice_parse" ? 0.72 : 0.85) * (1 - memoryInfluence * 0.25) +
      memoryInfluence * 0.15
  );
  const userIntentProfile = buildUserIntentProfileV1_6(ownerId, feedback.signal, {
    sustainLens: feedback.sustainLens,
    targetThreadId: feedback.targetThreadId,
    memoryPriors: options.memoryPriors
  });

  const coGovernorState = buildCoGovernorStateV1_6(systemProfile, userBias, userInfluence);

  const userPhaseIndex = clamp01(
    options.memoryPriors?.phaseIndexPrior ??
      (userIntentProfile.preferredPhaseRange.min + userIntentProfile.preferredPhaseRange.max) / 2
  );
  const phaseBlend = blendPhaseV1_6(
    systemProfile.phase,
    userPhaseIndex,
    coGovernorState.finalStabilityWeight
  );

  const resolvedDeformation = Number(
    clamp01(
      systemProfile.deformationScale * (1 - coGovernorState.finalStabilityWeight) +
        (1 - userBias) * coGovernorState.finalStabilityWeight
    ).toFixed(4)
  );

  const deformationRange = Object.freeze({
    min: Number(Math.min(systemProfile.deformationScale, resolvedDeformation).toFixed(4)),
    max: Number(Math.max(systemProfile.deformationScale, resolvedDeformation).toFixed(4)),
    resolved: resolvedDeformation
  });

  const agreement = buildStabilityAgreementV1_6(
    userIntentProfile,
    systemProfile,
    coGovernorState,
    phaseBlend,
    deformationRange
  );

  const governor = phaseGovernorFromPhaseV1_6(phaseBlend.resolvedPhase);
  const threads = applyAgreementToThreadsV1_6(
    [...(realityStability.stabilizedFrame?.threads || [])],
    agreement,
    feedback
  );

  const negotiatedPhase = Object.freeze({
    ...realityStability.phase,
    phase: phaseBlend.resolvedPhase,
    deformationScale: resolvedDeformation,
    learningEnabled: governor.learningEnabled,
    freezeFrame: governor.freezeFrame,
    stabilityScore: coGovernorState.userStabilityBias,
    coGoverned: true,
    priorPhase: systemProfile.phase,
    blendedIndex: phaseBlend.blendedIndex
  });

  const negotiatedPlan = deriveNegotiatedPlanV1_6(
    realityStability.stabilizedPlan,
    threads,
    agreement,
    feedback
  );

  const negotiatedFrame = Object.freeze({
    ...realityStability.stabilizedFrame,
    schema: CASTLE_STABILITY_CO_GOVERNOR_SCHEMA_V1_6,
    threads,
    phase: negotiatedPhase,
    stabilityAgreement: agreement,
    coGovernorState,
    atMs
  });

  logVoiceInfoV0("STABILITY_CO_GOVERNOR", {
    signal: feedback.signal,
    role: signalToRoleV1_6(feedback.signal),
    systemPhase: systemProfile.phase,
    resolvedPhase: phaseBlend.resolvedPhase,
    negotiationDirection: coGovernorState.negotiationField.direction,
    finalStabilityWeight: coGovernorState.finalStabilityWeight,
    speakShare: negotiatedPlan.speakShare,
    memoryShare: negotiatedPlan.memoryShare
  });

  return Object.freeze({
    schema: CASTLE_STABILITY_CO_GOVERNOR_SCHEMA_V1_6,
    negotiated: true,
    coGovernorState,
    stabilityAgreement: agreement,
    negotiatedPlan,
    negotiatedFrame,
    negotiatedPhase,
    atMs
  });
}

export function getSessionStabilityProfileV1_6(ownerId) {
  return sessionIntentProfileV1_6.get(String(ownerId)) || null;
}

export function getCoGovernorSnapshotV1_6() {
  return Object.freeze({
    schema: CASTLE_STABILITY_CO_GOVERNOR_SCHEMA_V1_6,
    identity: "stability_co_governor",
    sessionOwners: Object.freeze([...sessionIntentProfileV1_6.keys()])
  });
}

/** @internal vitest */
export function __resetStabilityCoGovernorForTestV1_6() {
  sessionIntentProfileV1_6.clear();
}
