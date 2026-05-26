/**
 * Unified State Narrative v0 — interpretation compression (non-executable).
 * Merges GCL + Rollout + Lifecycle + LoadTest analysis → one SystemState + narrative.
 * Addresses over-instrumentation drift: many truth sources, one story.
 * @see docs/ops/UNIFIED_STATE_NARRATIVE_V1.0.md
 */

import { readFileSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { FAILURE_MODE_ID_V0 } from "./failureModeClassificationV0.js";
import {
  getGlobalCostLedgerSnapshotV0,
  resolveGclLedgerHealthV0,
  readGlobalCostLedgerConfigV0
} from "./globalCostLedgerV0.js";
import {
  getPhasedRolloutStatsV0,
  reconcilePhasedRolloutInflightV0,
  readPhasedRolloutClusterConfigV0
} from "./phasedRolloutClusterV0.js";
import { isCoordinationSimEnabledV0, readCoordinationSimConfigV0 } from "./inMemoryRedisCoordinationV0.js";
import { validateNarrativeV0 } from "./narrativeValidationV0.js";
import {
  INTERPRETATION_SAFETY_CONTRACT_V0,
  partitionStateLayersV0,
  buildGovernanceMetadataV0,
  assertInterpretationSafetyContractV0
} from "./interpretationSafetyContractV0.js";
import { enrichNarrativeWithHumanOpsGovernanceV0 } from "./humanOpsGovernanceV0.js";
import {
  buildScreenshotScopeWatermarkV0,
  buildTenantScopeEnvelopeV0,
  computeNarrativeFingerprintV0,
  resolveNarrativeTenantScopeV0,
  sealDerivedLayersForTenantV0,
  tagSignalsWithTenantScopeV0
} from "./narrativeTenantIsolationV0.js";
import { runSocialPropagationSimulationV0 } from "./socialPropagationSimulationV0.js";
import { buildCulturalRiskBundleV0 } from "./trustDecayModelV0.js";
import { buildAppliedSystemsLayerV0 } from "./appliedSystemsLayerV0.js";
import { buildActionSemanticGovernanceLayerV0 } from "./actionSemanticGovernanceLayerV0.js";
import { buildActionContextResolutionLayerV0 } from "./actionContextResolutionLayerV0.js";
import { buildEpistemicCoherenceLayerV0 } from "./epistemicCoherenceLayerV0.js";
import { buildCoherenceAuthorityBoundaryV0 } from "./coherenceAuthorityBoundaryV0.js";
import { buildDecisionLatencyGovernanceLayerV0 } from "./decisionLatencyGovernanceLayerV0.js";
import { buildDecisionPacketUncertaintyBoundaryV0 } from "./decisionPacketUncertaintyBoundaryV0.js";
import { buildEpistemicDecisionPacingLayerV0 } from "./epistemicDecisionPacingLayerV0.js";
import { buildEpistemicTemporalCoherenceLayerV0 } from "./epistemicTemporalCoherenceLayerV0.js";
import { buildRealityDriftObserverLayerV0 } from "./realityDriftObserverLayerV0.js";
import { buildDriftCausalityLayerV0 } from "./driftCausalityLayerV0.js";

export const UNIFIED_STATE_NARRATIVE_SCHEMA_V0 = "rhizoh.unified_state_narrative.v1";

export const SYSTEM_HEALTH_V0 = Object.freeze({
  STABLE: "stable",
  STRESSED: "stressed",
  DEGRADED: "degraded"
});

export const SYSTEM_PRESSURE_V0 = Object.freeze({
  LOW: "low",
  MEDIUM: "medium",
  HIGH: "high"
});

export const SYSTEM_RISK_V0 = Object.freeze({
  NONE: "none",
  SATURATION: "saturation",
  LEAK: "leak",
  DRIFT: "drift"
});

/**
 * Live operational signals (no load-test file required).
 */
export async function gatherOperationalSignalsV0() {
  const [gclHealth, gclSnap, rollout, reconcile] = await Promise.all([
    resolveGclLedgerHealthV0(),
    getGlobalCostLedgerSnapshotV0(),
    getPhasedRolloutStatsV0(),
    reconcilePhasedRolloutInflightV0()
  ]);

  const limit = Number(rollout.limit) || 0;
  const active = Number(rollout.activeTurns) || 0;
  const utilization = limit > 0 ? active / limit : 0;

  return Object.freeze({
    gatheredAt: new Date().toISOString(),
    source: "live_ops",
    gcl: { health: gclHealth, snapshot: gclSnap, config: readGlobalCostLedgerConfigV0() },
    rollout,
    lifecycle: reconcile,
    coordination: {
      sim: isCoordinationSimEnabledV0(),
      simConfig: readCoordinationSimConfigV0(),
      clusterConfig: readPhasedRolloutClusterConfigV0()
    },
    derived: Object.freeze({
      rolloutUtilization: Math.round(utilization * 1000) / 1000,
      leaseSkew: rollout.leaseSkew ?? 0,
      zsetPressure: rollout.zsetPressure ?? "ok"
    })
  });
}

/**
 * @param {string} [analysisPath]
 */
export function gatherLoadTestSignalsV0(analysisPath) {
  const here = dirname(fileURLToPath(import.meta.url));
  const defaultPath = join(here, "../../../../docs/ops/export/load_test_analysis_LATEST.json");
  const path = analysisPath || defaultPath;
  if (!existsSync(path)) {
    return { available: false, path };
  }
  try {
    const raw = JSON.parse(readFileSync(path, "utf8"));
    return Object.freeze({
      available: true,
      path,
      analysis: raw,
      dominantFailureMode: raw.dominantFailureMode,
      executionMode: raw.executionMode,
      systemHealthIntelligence: raw.systemHealthIntelligence,
      divergence: raw.divergence
    });
  } catch {
    return { available: false, path, error: "parse_failed" };
  }
}

/**
 * @param {object} signals
 */
export function compressToSystemStateV0(signals) {
  const rollout = signals.rollout || {};
  const gclHealth = signals.gcl?.health || {};
  const lifecycle = signals.lifecycle || {};
  const lt = signals.loadTest?.available ? signals.loadTest.analysis : null;

  const limit = Number(rollout.limit) || 0;
  const active = Number(rollout.activeTurns) || 0;
  const util = limit > 0 ? active / limit : 0;
  const zsetPressure = rollout.zsetPressure || "ok";
  const dominant = lt?.dominantFailureMode || FAILURE_MODE_ID_V0.HEALTHY;

  let pressure = SYSTEM_PRESSURE_V0.LOW;
  if (util >= 0.7 || zsetPressure === "elevated") pressure = SYSTEM_PRESSURE_V0.HIGH;
  else if (util >= 0.35 || zsetPressure === "watch") pressure = SYSTEM_PRESSURE_V0.MEDIUM;

  if (lt?.systemHealthIntelligence?.verdict?.includes("degraded")) {
    pressure = SYSTEM_PRESSURE_V0.HIGH;
  } else if (dominant === FAILURE_MODE_ID_V0.SOFT_SATURATION) {
    pressure = pressure === SYSTEM_PRESSURE_V0.LOW ? SYSTEM_PRESSURE_V0.MEDIUM : pressure;
  }

  let risk = SYSTEM_RISK_V0.NONE;
  if (dominant === FAILURE_MODE_ID_V0.SOFT_SATURATION) risk = SYSTEM_RISK_V0.SATURATION;
  else if (
    dominant === FAILURE_MODE_ID_V0.ROLLOUT_HYSTERESIS ||
    (limit > 0 && active > limit * 0.2) ||
    Number(lifecycle.purged) > 0
  ) {
    risk = SYSTEM_RISK_V0.LEAK;
  } else if (dominant === FAILURE_MODE_ID_V0.GCL_DRIFT) {
    risk = SYSTEM_RISK_V0.DRIFT;
  }

  let health = SYSTEM_HEALTH_V0.STABLE;
  if (!gclHealth.ok || rollout.health?.ok === false) {
    health = SYSTEM_HEALTH_V0.DEGRADED;
  } else if (
    risk !== SYSTEM_RISK_V0.NONE ||
    pressure === SYSTEM_PRESSURE_V0.HIGH ||
    dominant !== FAILURE_MODE_ID_V0.HEALTHY
  ) {
    health = SYSTEM_HEALTH_V0.STRESSED;
  }
  if (risk === SYSTEM_RISK_V0.DRIFT || (limit > 0 && active > limit * 0.5)) {
    health = SYSTEM_HEALTH_V0.DEGRADED;
  }

  let confidence = 0.75;
  if (signals.loadTest?.available) confidence += 0.12;
  if (gclHealth.ok) confidence += 0.05;
  if (signals.source === "live_ops") confidence += 0.03;
  if (signals.coordination?.sim) confidence -= 0.08;
  if (dominant === FAILURE_MODE_ID_V0.REDIS_COORDINATION_LAG && !rollout.health?.redisConnected) {
    confidence -= 0.1;
  }
  confidence = Math.max(0.35, Math.min(0.95, Math.round(confidence * 1000) / 1000));

  return Object.freeze({
    health,
    pressure,
    risk,
    confidence,
    drivers: Object.freeze({
      dominantPattern: dominant,
      rolloutUtilization: Math.round(util * 1000) / 1000,
      gclOk: gclHealth.ok !== false,
      lifecyclePurged: Number(lifecycle.purged) || 0,
      executionMode: lt?.executionMode || signals.coordination?.sim ? "coordination_sim" : "live"
    })
  });
}

/**
 * @param {ReturnType<typeof compressToSystemStateV0>} state
 * @param {object} signals
 */
export function interpretSystemStateV0(state, signals) {
  const { health, pressure, risk, confidence } = state;
  const lt = signals.loadTest;

  /** @type {string[]} */
  const storyParts = [];

  if (health === SYSTEM_HEALTH_V0.STABLE) {
    storyParts.push("Sistem şu anda operasyonel olarak dengeli görünüyor.");
  } else if (health === SYSTEM_HEALTH_V0.STRESSED) {
    storyParts.push("Sistem çalışıyor ancak kapasite veya kuyruk baskısı altında.");
  } else {
    storyParts.push("Sistem finansal veya execution katmanında bozulma riski taşıyor.");
  }

  if (risk === SYSTEM_RISK_V0.SATURATION) {
    storyParts.push("Başarı oranı yüksek kalırken kuyruk büyüyor (soft saturation).");
  } else if (risk === SYSTEM_RISK_V0.LEAK) {
    storyParts.push("Rollout in-flight state ile gerçek yük arasında uyumsuzluk (leak/hysteresis).");
  } else if (risk === SYSTEM_RISK_V0.DRIFT) {
    storyParts.push("GCL ile rollout slotları arasında drift sinyali var.");
  }

  if (signals.coordination?.sim) {
    storyParts.push("Coordination katmanı SIM modunda — Redis validation henüz tamamlanmadı.");
  }

  const narrativeTr = storyParts.join(" ");
  const narrativeEn = storyParts
    .map((p) => {
      if (p.includes("soft saturation")) return "Success stays high while queue grows (soft saturation).";
      if (p.includes("leak")) return "Rollout in-flight state diverges from real load (leak/hysteresis).";
      if (p.includes("drift")) return "GCL vs rollout slot drift detected.";
      if (p.includes("SIM")) return "Coordination is simulated; real Redis validation pending.";
      if (p.includes("dengeli")) return "System appears operationally balanced.";
      if (p.includes("baskısı")) return "System is under capacity or queue pressure.";
      return "System shows degradation risk on financial or execution layer.";
    })
    .join(" ");

  /** @type {{ id: string, priority: number, rationale: string, executable: false }[]} */
  const suggestedActions = [];

  if (risk === SYSTEM_RISK_V0.SATURATION) {
    suggestedActions.push({
      id: "reduce_burst_concurrency",
      priority: 1,
      rationale: "Kuyruk büyümesi successRate'ı gizliyor — concurrency veya tier gözden geçir.",
      executable: false
    });
  }
  if (risk === SYSTEM_RISK_V0.LEAK) {
    suggestedActions.push({
      id: "run_lifecycle_reconcile_review",
      priority: 1,
      rationale: "activeTurns/trackedLeases skew — reconcile çıktısı ve lease TTL kontrol et.",
      executable: false
    });
  }
  if (risk === SYSTEM_RISK_V0.DRIFT) {
    suggestedActions.push({
      id: "audit_gcl_rollout_pairing",
      priority: 1,
      rationale: "Finansal kayıt ile rollout slot eşlemesini denetle (drift).",
      executable: false
    });
  }
  if (health === SYSTEM_HEALTH_V0.STABLE && pressure === SYSTEM_PRESSURE_V0.LOW) {
    suggestedActions.push({
      id: "maintain_current_posture",
      priority: 3,
      rationale: "Tek hikaye: stabil — agresif değişiklik önerilmez.",
      executable: false
    });
  }
  if (lt?.available && lt.divergence?.validationLayer?.status === "deferred") {
    suggestedActions.push({
      id: "schedule_redis_validation",
      priority: 2,
      rationale: "SIM sign-off sonrası ops:redis-stress ile coordination doğrula.",
      executable: false
    });
  }

  suggestedActions.sort((a, b) => a.priority - b.priority);

  return Object.freeze({
    narrativeTr,
    narrativeEn,
    headline:
      health === SYSTEM_HEALTH_V0.STABLE
        ? "Rhizoh: stable"
        : health === SYSTEM_HEALTH_V0.STRESSED
          ? `Rhizoh: stressed (${risk})`
          : `Rhizoh: degraded (${risk})`,
    suggestedActions,
    interpretationOnly: true,
    executionContract: "no_automatic_execution_v0"
  });
}

/**
 * @param {{
 *   loadTestAnalysisPath?: string,
 *   principal?: string | null,
 *   dau?: number,
 *   tenantCount?: number,
 *   instances?: number,
 *   tenantId?: string,
 *   platformScope?: boolean,
 *   tenantIsolationProbe?: string
 * }} [opts]
 */
export async function buildUnifiedStateNarrativeV0(opts = {}) {
  const scopeBase = resolveNarrativeTenantScopeV0({
    tenantId: opts.tenantId,
    platformScope: opts.tenantId ? false : opts.platformScope !== false,
    principal: opts.principal ?? null
  });
  const tenantScope = buildTenantScopeEnvelopeV0(scopeBase, opts.tenantIsolationProbe ?? null);

  const live = await gatherOperationalSignalsV0();
  const loadTest = opts.loadTestAnalysisPath
    ? gatherLoadTestSignalsV0(opts.loadTestAnalysisPath)
    : gatherLoadTestSignalsV0();

  const signals = tagSignalsWithTenantScopeV0(
    Object.freeze({
      ...live,
      loadTest,
      loadTestAnalysis: loadTest.available ? loadTest.analysis : null
    }),
    tenantScope
  );

  const systemState = compressToSystemStateV0(signals);
  const interpretation = interpretSystemStateV0(systemState, signals);
  const validation = validateNarrativeV0(signals, systemState, interpretation);
  assertInterpretationSafetyContractV0();

  const enrichedState = Object.freeze({
    ...systemState,
    confidenceHeadline: systemState.confidence,
    confidenceTrustworthy: validation.confidenceDecomposition.composite.trustworthy,
    confidenceAdjusted: validation.adjustedConfidence
  });
  const enrichedInterpretation = Object.freeze({
    ...interpretation,
    trustPosture: validation.trustPosture,
    interpretationSafetyContract: INTERPRETATION_SAFETY_CONTRACT_V0
  });
  const stateLayers = sealDerivedLayersForTenantV0(
    partitionStateLayersV0(signals, enrichedState, enrichedInterpretation, validation),
    tenantScope
  );
  const governance = buildGovernanceMetadataV0(validation);

  const sourceCount = [
    signals.gcl?.health,
    signals.rollout,
    signals.lifecycle,
    loadTest.available
  ].filter(Boolean).length;

  const core = Object.freeze({
    schema: UNIFIED_STATE_NARRATIVE_SCHEMA_V0,
    generatedAt: new Date().toISOString(),
    tenantScope,
    interpretationSafetyContract: INTERPRETATION_SAFETY_CONTRACT_V0,
    stateLayers,
    governance,
    systemState: enrichedState,
    interpretation: enrichedInterpretation,
    validation,
    compression: Object.freeze({
      inputSources: sourceCount,
      output: "single_system_state_vector",
      note: "Reduces over-instrumentation drift — metrics/leases/ledger/classifier → one narrative"
    }),
    signalsSummary: Object.freeze({
      gclOk: signals.gcl?.health?.ok !== false,
      rolloutActive: signals.rollout?.activeTurns,
      rolloutLimit: signals.rollout?.limit,
      lifecyclePurged: signals.lifecycle?.purged,
      loadTestDominant: loadTest.available ? loadTest.dominantFailureMode : null,
      coordinationSim: signals.coordination?.sim === true
    }),
    truthSourcesMerged: Object.freeze([
      "gcl_financial",
      "rollout_execution",
      "lifecycle_reconcile",
      loadTest.available ? "load_test_analysis" : null
    ].filter(Boolean))
  });

  const enriched = enrichNarrativeWithHumanOpsGovernanceV0(core, {
    dau: opts.dau,
    tenantCount: opts.tenantCount,
    instances: opts.instances
  });

  const narrativeFingerprint = computeNarrativeFingerprintV0(enriched);
  const screenshotScopeWatermark = buildScreenshotScopeWatermarkV0({
    ...enriched,
    narrativeFingerprint
  });

  const withWatermark = {
    ...enriched,
    narrativeFingerprint,
    screenshotScopeWatermark
  };

  const socialPropagationSimulation = runSocialPropagationSimulationV0(withWatermark);

  const withPropagation = {
    ...withWatermark,
    humanOps: Object.freeze({
      ...withWatermark.humanOps,
      socialPropagationSimulation
    })
  };

  const culturalRisk = buildCulturalRiskBundleV0(withPropagation);

  const withCultural = { ...withPropagation, culturalRisk };

  const appliedSystemsLayer = buildAppliedSystemsLayerV0(withCultural, {
    institutionId: opts.institutionId,
    experimentId: opts.experimentId,
    shardId: opts.tenantId
  });

  const actionSemanticGovernance = buildActionSemanticGovernanceLayerV0(withCultural);
  const withAsgl = { ...withCultural, appliedSystemsLayer, actionSemanticGovernance };

  const actionContextResolution = buildActionContextResolutionLayerV0(withAsgl);
  const withAcrl = { ...withAsgl, actionContextResolution };

  const epistemicCoherence = buildEpistemicCoherenceLayerV0(withAcrl);
  const withEcl = { ...withAcrl, epistemicCoherence };

  const coherenceAuthorityBoundary = buildCoherenceAuthorityBoundaryV0(withEcl);
  const withCab = { ...withEcl, coherenceAuthorityBoundary };

  const decisionLatencyGovernance = buildDecisionLatencyGovernanceLayerV0(withCab);
  const withDlgl = { ...withCab, decisionLatencyGovernance };

  const decisionPacketUncertaintyBoundary = buildDecisionPacketUncertaintyBoundaryV0(withDlgl);

  const enrichedPacket = decisionPacketUncertaintyBoundary?.enrichedHumanDecisionPacket;
  const dlglFinal = enrichedPacket
    ? Object.freeze({
        ...decisionLatencyGovernance,
        humanDecisionPacket: enrichedPacket
      })
    : decisionLatencyGovernance;

  const withDpub = Object.freeze({
    ...withDlgl,
    decisionLatencyGovernance: dlglFinal,
    decisionPacketUncertaintyBoundary
  });

  const epistemicDecisionPacing = buildEpistemicDecisionPacingLayerV0(withDpub);
  const withEdpl = { ...withDpub, epistemicDecisionPacing };

  const epistemicTemporalCoherence = buildEpistemicTemporalCoherenceLayerV0(withEdpl);
  const withEtcl = { ...withEdpl, epistemicTemporalCoherence };

  const realityDriftObserver = buildRealityDriftObserverLayerV0(withEtcl);
  const withRdol = { ...withEtcl, realityDriftObserver };

  const driftCausality = buildDriftCausalityLayerV0(withRdol);

  return Object.freeze({
    ...withRdol,
    driftCausality
  });
}
