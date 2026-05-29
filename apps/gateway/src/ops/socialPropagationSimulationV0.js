/**
 * Social propagation simulation v0 — screenshot economy (4 layers).
 * Compression → Amplification → Mutation → Persistence
 * Non-executable; feeds cultural-risk gates and trust-decay prep.
 * @see docs/ops/SOCIAL_PROPAGATION_SIMULATION_V1.0.md
 */

import { createHash } from "node:crypto";

export const SOCIAL_PROPAGATION_SIM_SCHEMA_V0 = "rhizoh.social_propagation_simulation.v0";

/** Elements that may be lost when sharing outside the ops panel. */
export const COMPRESSION_ELEMENT_V0 = Object.freeze({
  RAW_LAYER: { id: "raw_layer", weight: 0.22, label: "RAW metrics visible" },
  UI_WATERMARK: { id: "ui_watermark", weight: 0.14, label: "Screenshot scope watermark" },
  TENANT_BADGE: { id: "tenant_badge", weight: 0.1, label: "Tenant scope badge" },
  DISCLAIMER: { id: "disclaimer", weight: 0.12, label: "Non-binding disclaimer" },
  POLICY_BOUNDARY: { id: "policy_boundary", weight: 0.08, label: "POLICY prohibitions" },
  FINGERPRINT_REF: { id: "fingerprint_ref", weight: 0.06, label: "Fingerprint short code" },
  UNCERTAINTY_TAGS: { id: "uncertainty_tags", weight: 0.1, label: "Uncertainty / divergence tags" },
  PRIMARY_METRIC_CONTEXT: { id: "primary_metric_context", weight: 0.18, label: "Trustworthy confidence context" }
});

/** Clip / share profiles — what gets cropped away. */
export const CLIP_PROFILE_V0 = Object.freeze({
  FULL_PANEL: {
    id: "full_panel",
    drops: [],
    note: "Rare — full ops export"
  },
  HEADLINE_CARD: {
    id: "headline_card",
    drops: ["raw_layer", "tenant_badge", "policy_boundary", "uncertainty_tags", "primary_metric_context"],
    note: "DERIVED headline + health only"
  },
  CONFIDENCE_HERO: {
    id: "confidence_hero",
    drops: [
      "raw_layer",
      "ui_watermark",
      "tenant_badge",
      "disclaimer",
      "policy_boundary",
      "uncertainty_tags",
      "fingerprint_ref"
    ],
    note: "Single number screenshot — highest authority misread risk"
  },
  WATERMARK_CROP: {
    id: "watermark_crop",
    drops: ["ui_watermark", "disclaimer", "fingerprint_ref"],
    note: "Reframe removes scope strip"
  },
  MEME_TEMPLATE: {
    id: "meme_template",
    drops: [
      "raw_layer",
      "ui_watermark",
      "tenant_badge",
      "disclaimer",
      "policy_boundary",
      "fingerprint_ref",
      "uncertainty_tags",
      "primary_metric_context"
    ],
    note: "Headline text only on template"
  }
});

/** @type {Readonly<Record<string, { id: string, distortion: number, authorityAmplification: number, label: string }>>} */
export const PROPAGATION_CHANNEL_V0 = Object.freeze({
  SLACK_INTERNAL: Object.freeze({
    id: "slack_internal",
    distortion: 0.15,
    authorityAmplification: 1.2,
    label: "Slack internal"
  }),
  X_REPOST: Object.freeze({
    id: "x_repost",
    distortion: 0.45,
    authorityAmplification: 2.4,
    label: "X / Twitter repost"
  }),
  YOUTUBE_CLIP: Object.freeze({
    id: "youtube_clip",
    distortion: 0.65,
    authorityAmplification: 3.8,
    label: "YouTube clip"
  }),
  TIKTOK_SHORT: Object.freeze({
    id: "tiktok_short",
    distortion: 0.85,
    authorityAmplification: 5.5,
    label: "TikTok short"
  })
});

/** Interpretation mutation steps (yorum mutasyonu). */
export const MUTATION_STEP_V0 = Object.freeze([
  { id: "literal_ops", template: (h) => h },
  { id: "intensify", template: (h) => h.replace(/stressed/i, "critical").replace(/stable/i, "under watch") },
  {
    id: "ai_warning_framing",
    template: (h) => `AI warning: ${h.replace(/^Rhizoh:\s*/i, "")}`
  },
  {
    id: "collapse_prediction",
    template: () => "Rhizoh predicts collapse — insiders say system failing"
  }
]);

export const PERSISTENCE_SCENARIO_V0 = Object.freeze({
  FLASH_INCIDENT: { id: "flash_incident", halfLifeDays: 2, revivalProbability: 0.05 },
  SEASONAL_REPOST: { id: "seasonal_repost", halfLifeDays: 45, revivalProbability: 0.35 },
  URBAN_LEGEND: { id: "urban_legend", halfLifeDays: 180, revivalProbability: 0.72 }
});

/**
 * @param {object} narrativeExport
 */
export function extractPropagationSourceArtifactsV0(narrativeExport) {
  const ui = narrativeExport?.humanOps?.narrativeUiSafety;
  const wm = narrativeExport?.screenshotScopeWatermark;
  const fp = narrativeExport?.narrativeFingerprint;
  const layers = narrativeExport?.stateLayers;
  const validation = narrativeExport?.validation || {};

  return Object.freeze({
    headline: layers?.derived?.narrative?.headline || narrativeExport?.interpretation?.headline || "Rhizoh: unknown",
    narrativeTr: layers?.derived?.narrative?.narrativeTr || narrativeExport?.interpretation?.narrativeTr || "",
    health: layers?.derived?.systemState?.health,
    trustworthyConfidence:
      narrativeExport?.systemState?.confidenceTrustworthy ??
      layers?.derived?.systemState?.confidenceTrustworthy,
    primaryMetricLabel: ui?.displayRules?.primaryMetricLabel || "trustworthy_confidence",
    tenantId: narrativeExport?.tenantScope?.tenantId,
    watermarkLines: wm?.lines,
    fingerprintShort: fp?.shortCode,
    disclaimer: ui?.disclaimer,
    uncertaintyTagIds: (validation.uncertainty?.tags || []).map((t) => t.id),
    divergenceFlags: (validation.divergence?.flags || []).map((f) => f.id),
    policyProhibitions: layers?.policy?.prohibitedActions?.length || 0,
    rawRolloutActive: layers?.raw?.rollout?.activeTurns,
    hasRawLayer: Boolean(layers?.raw)
  });
}

/**
 * @param {ReturnType<typeof extractPropagationSourceArtifactsV0>} artifacts
 * @param {keyof typeof CLIP_PROFILE_V0} profileKey
 */
export function simulateCompressionLayerV0(artifacts, profileKey = "HEADLINE_CARD") {
  const profile = CLIP_PROFILE_V0[profileKey] || CLIP_PROFILE_V0.HEADLINE_CARD;
  const drops = new Set(profile.drops);

  const present = {};
  let retainedWeight = 0;
  let totalWeight = 0;

  for (const el of Object.values(COMPRESSION_ELEMENT_V0)) {
    totalWeight += el.weight;
    const isPresent =
      (el.id === "raw_layer" && artifacts.hasRawLayer && !drops.has("raw_layer")) ||
      (el.id === "ui_watermark" && artifacts.watermarkLines && !drops.has("ui_watermark")) ||
      (el.id === "tenant_badge" && artifacts.tenantId && !drops.has("tenant_badge")) ||
      (el.id === "disclaimer" && artifacts.disclaimer && !drops.has("disclaimer")) ||
      (el.id === "policy_boundary" && artifacts.policyProhibitions > 0 && !drops.has("policy_boundary")) ||
      (el.id === "fingerprint_ref" && artifacts.fingerprintShort && !drops.has("fingerprint_ref")) ||
      (el.id === "uncertainty_tags" &&
        artifacts.uncertaintyTagIds?.length > 0 &&
        !drops.has("uncertainty_tags")) ||
      (el.id === "primary_metric_context" &&
        artifacts.trustworthyConfidence != null &&
        !drops.has("primary_metric_context"));

    present[el.id] = isPresent;
    if (isPresent) retainedWeight += el.weight;
  }

  const semanticCompressionScore = totalWeight > 0 ? 1 - retainedWeight / totalWeight : 1;

  const clippedPayload = Object.freeze({
    headline: artifacts.headline,
    health: artifacts.health,
    confidenceNumber:
      profile.id === "confidence_hero" ? null : drops.has("primary_metric_context") ? null : artifacts.trustworthyConfidence,
    confidenceHero: profile.id === "confidence_hero" ? artifacts.trustworthyConfidence : null,
    tenantId: drops.has("tenant_badge") ? null : artifacts.tenantId,
    fingerprintShort: drops.has("fingerprint_ref") ? null : artifacts.fingerprintShort
  });

  return Object.freeze({
    layer: "compression",
    profile: profile.id,
    drops: profile.drops,
    present,
    semanticCompressionScore: Math.round(semanticCompressionScore * 1000) / 1000,
    clippedPayload,
    confidenceDetachedRisk:
      profile.id === "confidence_hero" ||
      (clippedPayload.confidenceHero != null && !present.primary_metric_context)
  });
}

/**
 * @param {ReturnType<typeof simulateCompressionLayerV0>} compressed
 * @param {keyof typeof PROPAGATION_CHANNEL_V0} channelKey
 */
export function simulateAmplificationLayerV0(compressed, channelKey = "X_REPOST") {
  const channel = PROPAGATION_CHANNEL_V0[channelKey] || PROPAGATION_CHANNEL_V0.X_REPOST;
  const base = compressed.semanticCompressionScore;
  const amplifiedDistortion = Math.min(
    1,
    base + channel.distortion * (1 - base * 0.5)
  );
  const authorityAmplificationMultiplier =
    Math.round(channel.authorityAmplification * (1 + compressed.confidenceDetachedRisk * 0.8) * 100) / 100;

  return Object.freeze({
    layer: "amplification",
    channel: channel.id,
    channelLabel: channel.label,
    distortion: channel.distortion,
    authorityAmplificationMultiplier,
    effectiveDistortion: Math.round(amplifiedDistortion * 1000) / 1000,
    reachTier: channel.authorityAmplification >= 4 ? "mass" : channel.authorityAmplification >= 2 ? "wide" : "internal"
  });
}

/**
 * @param {string} headline
 * @param {number} [maxSteps]
 */
export function simulateMutationChainV0(headline, maxSteps = 4) {
  let text = headline;
  const chain = [];

  for (const step of MUTATION_STEP_V0.slice(0, maxSteps)) {
    const next = step.template(text);
    const changed = next !== text;
    chain.push(
      Object.freeze({
        stepId: step.id,
        before: text,
        after: next,
        changed
      })
    );
    text = next;
  }

  const mutationSeverity =
    chain.filter((c) => c.changed).length / Math.max(1, chain.length);

  return Object.freeze({
    layer: "mutation",
    originHeadline: headline,
    finalText: text,
    chain,
    mutationSeverity: Math.round(mutationSeverity * 1000) / 1000,
    interpretiveDrift: headline.toLowerCase() !== text.toLowerCase()
  });
}

/**
 * @param {ReturnType<typeof simulateMutationChainV0>} mutation
 * @param {keyof typeof PERSISTENCE_SCENARIO_V0} persistenceKey
 */
export function simulatePersistenceLayerV0(mutation, persistenceKey = "SEASONAL_REPOST") {
  const scenario = PERSISTENCE_SCENARIO_V0[persistenceKey] || PERSISTENCE_SCENARIO_V0.SEASONAL_REPOST;
  const stickiness = mutation.mutationSeverity * scenario.revivalProbability;
  const narrativeHalfLifeDays = Math.max(
    1,
    Math.round(scenario.halfLifeDays * (1 - mutation.mutationSeverity * 0.6))
  );

  return Object.freeze({
    layer: "persistence",
    scenario: scenario.id,
    narrativeHalfLifeDays,
    revivalProbability: scenario.revivalProbability,
    culturalMemoryFormation: stickiness >= 0.4,
    urbanLegendEmergence: mutation.finalText.toLowerCase().includes("collapse") && scenario.revivalProbability >= 0.5,
    trustDecayForkPrep: stickiness >= 0.35 ? "mythology_risk" : "trust_decay_risk"
  });
}

/**
 * Light semantic watermark — structure signature + digest ref (not steganography).
 * @param {object} narrativeExport
 */
export function buildSemanticWatermarkResidualV0(narrativeExport) {
  const artifacts = extractPropagationSourceArtifactsV0(narrativeExport);
  const structureSignature = createHash("sha256")
    .update(
      `${artifacts.headline}|${artifacts.primaryMetricLabel}|${artifacts.tenantId}`,
      "utf8"
    )
    .digest("hex")
    .slice(0, 16);

  return Object.freeze({
    schema: "rhizoh.semantic_watermark_residual.v0",
    structureSignature,
    digestReference: artifacts.fingerprintShort,
    wordingPattern: Object.freeze({
      headlineTokenCount: artifacts.headline.split(/\s+/).length,
      hasRhizohPrefix: /^Rhizoh:/i.test(artifacts.headline),
      metricLabel: artifacts.primaryMetricLabel
    }),
    forensicCeilingNote:
      "Light residual only — heavy forensic watermarking can amplify mythology; prefer bucketed public confidence."
  });
}

/**
 * @param {object} narrativeExport
 * @param {ReturnType<typeof simulateCompressionLayerV0>} compressed
 */
export function computeWatermarkSurvivabilityV0(narrativeExport, compressed) {
  const ui = narrativeExport?.humanOps?.narrativeUiSafety;
  const semantic = buildSemanticWatermarkResidualV0(narrativeExport);

  const uiSurvival = compressed.present?.ui_watermark ? 1 : 0;
  const disclaimerSurvival = compressed.present?.disclaimer ? 1 : 0;
  const tenantSurvival = compressed.present?.tenant_badge ? 1 : 0;
  const fpSurvival = compressed.present?.fingerprint_ref ? 1 : 0;

  const uiWatermarkSurvivability = Math.round(((uiSurvival + disclaimerSurvival + tenantSurvival) / 3) * 1000) / 1000;

  const semanticSurvivability =
    compressed.present?.fingerprint_ref && compressed.present?.primary_metric_context
      ? 0.85
      : compressed.present?.fingerprint_ref
        ? 0.55
        : semantic.digestReference && compressed.profile !== "meme_template"
          ? 0.35
          : 0.2;

  const combined = Math.round((uiWatermarkSurvivability * 0.5 + semanticSurvivability * 0.5) * 1000) / 1000;

  return Object.freeze({
    schema: "rhizoh.watermark_survivability.v0",
    uiWatermarkSurvivability,
    semanticSurvivability: Math.round(semanticSurvivability * 1000) / 1000,
    combinedSurvivability: combined,
    criticalRisk: combined < 0.35,
    mitigationsPresent: Boolean(ui?.displayRules?.requireDisclaimerBanner),
    structureSignature: semantic.structureSignature
  });
}

/**
 * @param {object} narrativeExport
 * @param {{ clipProfile?: string, channel?: string, persistence?: string }} [opts]
 */
export function runPropagationPathV0(narrativeExport, opts = {}) {
  const artifacts = extractPropagationSourceArtifactsV0(narrativeExport);
  const compression = simulateCompressionLayerV0(artifacts, opts.clipProfile || "HEADLINE_CARD");
  const amplification = simulateAmplificationLayerV0(compression, opts.channel || "X_REPOST");
  const mutation = simulateMutationChainV0(
    compression.clippedPayload.headline || artifacts.headline
  );
  const persistence = simulatePersistenceLayerV0(mutation, opts.persistence || "SEASONAL_REPOST");
  const watermarkSurvivability = computeWatermarkSurvivabilityV0(narrativeExport, compression);

  const pathRiskScore = Math.min(
    1,
    compression.semanticCompressionScore * 0.35 +
      amplification.effectiveDistortion * 0.25 +
      mutation.mutationSeverity * 0.2 +
      (persistence.culturalMemoryFormation ? 0.15 : 0) +
      (compression.confidenceDetachedRisk ? 0.2 : 0) -
      watermarkSurvivability.combinedSurvivability * 0.1
  );

  const mitigated =
    narrativeExport?.humanOps?.narrativeUiSafety?.displayRules?.neverShowHeadlineConfidenceAlone === true &&
    narrativeExport?.humanOps?.narrativeUiSafety?.displayRules?.primaryMetricLabel === "trustworthy_confidence" &&
    narrativeExport?.screenshotScopeWatermark?.lines &&
    narrativeExport?.tenantScope?.tenantId;

  return Object.freeze({
    clipProfile: compression.profile,
    channel: amplification.channel,
    compression,
    amplification,
    mutation,
    persistence,
    watermarkSurvivability,
    pathRiskScore: Math.round(pathRiskScore * 1000) / 1000,
    residualRisk: mitigated && pathRiskScore < 0.75 ? "reduced" : pathRiskScore >= 0.75 ? "high" : "medium",
    confidencePublicDistortionRisk: compression.confidenceDetachedRisk
  });
}

/** Tabletop paths through screenshot economy. */
export const PROPAGATION_SCENARIO_V0 = Object.freeze([
  { id: "slack_headline_share", clipProfile: "HEADLINE_CARD", channel: "SLACK_INTERNAL", persistence: "FLASH_INCIDENT" },
  { id: "x_confidence_hero", clipProfile: "CONFIDENCE_HERO", channel: "X_REPOST", persistence: "SEASONAL_REPOST" },
  { id: "youtube_watermark_crop", clipProfile: "WATERMARK_CROP", channel: "YOUTUBE_CLIP", persistence: "SEASONAL_REPOST" },
  { id: "tiktok_meme_mutation", clipProfile: "MEME_TEMPLATE", channel: "TIKTOK_SHORT", persistence: "URBAN_LEGEND" }
]);

/**
 * @param {object} narrativeExport
 */
export function runSocialPropagationSimulationV0(narrativeExport) {
  const paths = PROPAGATION_SCENARIO_V0.map((s) =>
    Object.freeze({
      ...s,
      ...runPropagationPathV0(narrativeExport, s)
    })
  );

  const highResidual = paths.filter((p) => p.residualRisk === "high").length;
  const worstWatermark = paths.reduce(
    (min, p) => Math.min(min, p.watermarkSurvivability.combinedSurvivability),
    1
  );
  const maxAuthorityAmp = Math.max(...paths.map((p) => p.amplification.authorityAmplificationMultiplier));
  const confidenceDistortionPaths = paths.filter((p) => p.confidencePublicDistortionRisk).length;

  const dominantDistortionSource =
    confidenceDistortionPaths >= paths.length / 2
      ? "confidence_detached_from_epistemic_context"
      : "headline_mutation_chain";

  return Object.freeze({
    schema: SOCIAL_PROPAGATION_SIM_SCHEMA_V0,
    ranAt: new Date().toISOString(),
    scenarioCount: paths.length,
    highResidualCount: highResidual,
    paths,
    aggregate: Object.freeze({
      worstWatermarkSurvivability: worstWatermark,
      maxAuthorityAmplificationMultiplier: maxAuthorityAmp,
      confidenceDistortionPathCount: confidenceDistortionPaths,
      dominantDistortionSource
    }),
    semanticWatermark: buildSemanticWatermarkResidualV0(narrativeExport),
    confidenceReadabilityPolicy: buildConfidencePublicReadabilityPolicyV0(narrativeExport),
    tabletopVerdict:
      highResidual === 0
        ? "propagation_paths_mitigated_for_tabletop_set"
        : `${highResidual} propagation paths still high — tighten watermark, bucket confidence, RAW-first education`,
    note: "Simulation only; measures meaning outside the system, not CPU/Redis"
  });
}

/**
 * Future-facing policy stub — bucketed public confidence (non-executable).
 * @param {object} narrativeExport
 */
export function buildConfidencePublicReadabilityPolicyV0(narrativeExport) {
  const ui = narrativeExport?.humanOps?.narrativeUiSafety;
  const conf = narrativeExport?.systemState?.confidenceTrustworthy;

  let publicBucket = "unknown";
  if (conf != null) {
    if (conf >= 0.85) publicBucket = "high_hypothesis";
    else if (conf >= 0.6) publicBucket = "moderate_hypothesis";
    else publicBucket = "low_hypothesis";
  }

  return Object.freeze({
    schema: "rhizoh.confidence_public_readability_policy.v0",
    status: "recommended_not_enforced",
    rawConfidenceInternal: true,
    publicConfidenceBucketed: publicBucket,
    uncertaintyFirstRendering: ui?.displayRules?.showRawStateFirst === true,
    neverPublishExactTrustworthyOnShareableSurfaces: true,
    rationale:
      "Detached numeric confidence amplifies authority in propagation more than headline text."
  });
}
