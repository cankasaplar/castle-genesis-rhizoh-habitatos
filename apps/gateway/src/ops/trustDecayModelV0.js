/**
 * Trust decay vs mythology dynamics v0 — when divergence appears, what do humans do?
 * Same divergence can fork to opposite cultural outcomes (non-executable).
 * @see docs/ops/TRUST_DECAY_MYTHOLOGY_V1.0.md
 */

export const TRUST_DECAY_MODEL_SCHEMA_V0 = "rhizoh.trust_decay_mythology_model.v0";

export const TRUST_DYNAMICS_FORK_V0 = Object.freeze({
  TRUST_DECAY: "trust_decay",
  MYTHOLOGY: "mythology",
  AMBIGUOUS: "ambiguous"
});

export const HUMAN_RESPONSE_V0 = Object.freeze({
  [TRUST_DYNAMICS_FORK_V0.TRUST_DECAY]: Object.freeze({
    tr: "Sistem güvenilmez — uzaklaşma, churn, destek baskısı",
    en: "System unreliable — withdrawal, churn, support pressure"
  }),
  [TRUST_DYNAMICS_FORK_V0.MYTHOLOGY]: Object.freeze({
    tr: "Sistem gerçeği görüyor — divergence derinlik sanılır",
    en: "System sees the truth — divergence read as depth"
  }),
  [TRUST_DYNAMICS_FORK_V0.AMBIGUOUS]: Object.freeze({
    tr: "Aynı divergence iki zıt okumaya açık",
    en: "Same divergence admits opposite readings"
  })
});

/**
 * @param {object} narrativeExport
 * @param {object} [propagationSim]
 */
export function collectTrustDynamicsAxesV0(narrativeExport, propagationSim) {
  const validation = narrativeExport?.validation || {};
  const ui = narrativeExport?.humanOps?.narrativeUiSafety;
  const layers = narrativeExport?.stateLayers;
  const paths = propagationSim?.paths || [];

  const divergenceScore = validation.divergence?.divergenceScore ?? 0;
  const flagCount = validation.divergence?.flags?.length ?? 0;
  const mismatch = validation.divergence?.flags?.some((f) => f.id === "narrative_metrics_mismatch");

  const confidenceDetachedPaths = paths.filter((p) => p.confidencePublicDistortionRisk).length;
  const highAmpPaths = paths.filter(
    (p) => (p.amplification?.authorityAmplificationMultiplier ?? 0) >= 3
  ).length;

  const influencerRelayCount = paths.reduce(
    (sum, p) =>
      sum +
      (p.channel === "tiktok_short" || p.channel === "youtube_clip" || p.channel === "x_repost"
        ? 1
        : 0),
    0
  );

  const exposureRepetition = Math.min(
    1,
    paths.filter((p) => p.persistence?.culturalMemoryFormation).length / Math.max(1, paths.length) +
      (propagationSim?.aggregate?.worstWatermarkSurvivability < 0.3 ? 0.25 : 0)
  );

  const confidenceDetachmentExposure = Math.min(
    1,
    confidenceDetachedPaths / Math.max(1, paths.length) +
      (propagationSim?.aggregate?.dominantDistortionSource ===
      "confidence_detached_from_epistemic_context"
        ? 0.35
        : 0)
  );

  const rawVerificationAccess = Math.min(
    1,
    (ui?.displayRules?.showRawStateFirst ? 0.45 : 0) +
      (layers?.raw?.rollout != null ? 0.25 : 0) +
      (layers?.derived?.globalDerivedState === false ? 0.15 : 0)
  );

  const narrativeContradictionFrequency = Math.min(
    1,
    divergenceScore * 0.5 + flagCount * 0.12 + (mismatch ? 0.25 : 0)
  );

  const communityReinforcement = Math.min(
    1,
    paths.filter((p) => p.persistence?.urbanLegendEmergence).length * 0.35 +
      highAmpPaths * 0.15 +
      (propagationSim?.aggregate?.maxAuthorityAmplificationMultiplier >= 4 ? 0.2 : 0)
  );

  const epistemicGnosticAppeal =
    validation.trustPosture === "narrative_hypothesis_only" &&
    (narrativeExport?.governance?.safeUseAs?.includes("incident_hypothesis_seed") ||
      narrativeExport?.interpretation?.headline?.toLowerCase().includes("rhizoh"));

  return Object.freeze({
    exposureRepetition: Math.round(exposureRepetition * 1000) / 1000,
    confidenceDetachmentExposure: Math.round(confidenceDetachmentExposure * 1000) / 1000,
    influencerRelayCount,
    rawVerificationAccess: Math.round(rawVerificationAccess * 1000) / 1000,
    narrativeContradictionFrequency: Math.round(narrativeContradictionFrequency * 1000) / 1000,
    communityReinforcement: Math.round(communityReinforcement * 1000) / 1000,
    epistemicObservatoryAppeal: epistemicGnosticAppeal,
    divergenceVisible: divergenceScore > 0.15 || flagCount > 0
  });
}

/**
 * @param {ReturnType<typeof collectTrustDynamicsAxesV0>} axes
 */
export function resolveTrustDynamicsForkV0(axes) {
  if (!axes.divergenceVisible) {
    return Object.freeze({
      fork: TRUST_DYNAMICS_FORK_V0.AMBIGUOUS,
      trustDecayScore: 0.1,
      mythologyScore: 0.1,
      confidence: 0.2,
      reason: "divergence_not_material"
    });
  }

  const mythologyScore = Math.min(
    1,
    axes.exposureRepetition * 0.22 +
      axes.confidenceDetachmentExposure * 0.28 +
      axes.communityReinforcement * 0.2 +
      (axes.influencerRelayCount / 4) * 0.15 +
      (axes.epistemicObservatoryAppeal ? 0.12 : 0) -
      axes.rawVerificationAccess * 0.35
  );

  const trustDecayScore = Math.min(
    1,
    axes.narrativeContradictionFrequency * 0.3 +
      axes.rawVerificationAccess * 0.25 +
      (axes.confidenceDetachmentExposure > 0.5 ? 0.15 : 0) -
      axes.communityReinforcement * 0.2 -
      (axes.epistemicObservatoryAppeal ? 0.1 : 0)
  );

  const margin = Math.abs(mythologyScore - trustDecayScore);
  let fork = TRUST_DYNAMICS_FORK_V0.AMBIGUOUS;
  if (margin >= 0.12) {
    fork =
      mythologyScore > trustDecayScore
        ? TRUST_DYNAMICS_FORK_V0.MYTHOLOGY
        : TRUST_DYNAMICS_FORK_V0.TRUST_DECAY;
  }

  return Object.freeze({
    fork,
    trustDecayScore: Math.round(trustDecayScore * 1000) / 1000,
    mythologyScore: Math.round(mythologyScore * 1000) / 1000,
    margin: Math.round(margin * 1000) / 1000,
    confidence: Math.round(Math.min(0.95, 0.45 + margin) * 1000) / 1000,
    reason:
      fork === TRUST_DYNAMICS_FORK_V0.MYTHOLOGY
        ? "repetition_and_detached_confidence_outweigh_raw_verification"
        : fork === TRUST_DYNAMICS_FORK_V0.TRUST_DECAY
          ? "contradiction_with_raw_access_outweighs_myth_reinforcement"
          : "same_divergence_admits_opposite_readings"
  });
}

/**
 * @param {object} narrativeExport
 */
export function buildTrustDecayMythologyModelV0(narrativeExport) {
  const propagationSim =
    narrativeExport?.humanOps?.socialPropagationSimulation || null;
  const axes = collectTrustDynamicsAxesV0(narrativeExport, propagationSim);
  const forkResolution = resolveTrustDynamicsForkV0(axes);

  const persistenceHints = (propagationSim?.paths || []).map((p) =>
    Object.freeze({
      pathId: p.id,
      halfLifeDays: p.persistence?.narrativeHalfLifeDays,
      urbanLegend: p.persistence?.urbanLegendEmergence,
      prep: p.persistence?.trustDecayForkPrep
    })
  );

  return Object.freeze({
    schema: TRUST_DECAY_MODEL_SCHEMA_V0,
    ranAt: new Date().toISOString(),
    question: "When divergence appears, what do humans do?",
    axes,
    fork: forkResolution.fork,
    scores: Object.freeze({
      trustDecay: forkResolution.trustDecayScore,
      mythology: forkResolution.mythologyScore,
      margin: forkResolution.margin,
      confidence: forkResolution.confidence
    }),
    humanResponse: HUMAN_RESPONSE_V0[forkResolution.fork],
    forkResolution,
    persistenceHints,
    productGuidance: Object.freeze({
      trust_decay: Object.freeze([
        "Increase RAW visibility on first divergence sighting",
        "Bucket public confidence; never hero exact trustworthy_confidence",
        "Proactive ops comms with GCL/rollout audit trail"
      ]),
      mythology: Object.freeze([
        "Avoid mystical observatory framing on stressed states",
        "Pair DERIVED with explicit uncertainty-first copy",
        "Counter urban legend with dated RAW snapshot + fingerprint"
      ]),
      ambiguous: Object.freeze([
        "A/B copy test: uncertainty-first vs depth narrative",
        "Monitor influencer relay paths separately from Slack"
      ])
    })[forkResolution.fork],
    connectsTo: Object.freeze({
      socialPropagation: propagationSim?.schema || null,
      dominantDistortion: propagationSim?.aggregate?.dominantDistortionSource || null
    }),
    nonExecutable: true
  });
}

/**
 * @param {object} narrativeExport
 */
export function buildCulturalRiskBundleV0(narrativeExport) {
  const trustDynamics = buildTrustDecayMythologyModelV0(narrativeExport);
  return Object.freeze({
    schema: "rhizoh.cultural_risk_bundle.v0",
    trustDynamics,
    perceptualRiskClass:
      trustDynamics.fork === TRUST_DYNAMICS_FORK_V0.MYTHOLOGY
        ? "authority_illusion_via_depth_narrative"
        : trustDynamics.fork === TRUST_DYNAMICS_FORK_V0.TRUST_DECAY
          ? "reliability_withdrawal"
          : "bifurcated_interpretation"
  });
}
