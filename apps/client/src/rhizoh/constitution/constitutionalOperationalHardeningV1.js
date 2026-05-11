/**
 * Operational hardening — gözlemlenebilirlik standardı, replay determinizm tohumu,
 * çok-bölge policy senkron ipuçları, denetim kaydı gövdesi (hash zinciri gateway’de).
 */

export const RHIZOH_OPERATIONAL_HARDENING_VERSION = "1.0.0";

export const RHIZOH_OBSERVABILITY_SCHEMA_ID = "rhizoh.observability.constitutional_turn.v1";

function stableSerialize(value) {
  if (value === null || typeof value !== "object") return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map((x) => stableSerialize(x)).join(",")}]`;
  const keys = Object.keys(value).sort();
  return `{${keys.map((k) => JSON.stringify(k) + ":" + stableSerialize(value[k])).join(",")}}`;
}

/**
 * @param {unknown} value
 */
export function canonicalRhizohOperationalJson(value) {
  try {
    return stableSerialize(value);
  } catch {
    return JSON.stringify(String(value));
  }
}

/**
 * @param {{
 *   traceId?: string | null,
 *   turnLatencyMs?: number,
 *   pipelineVersion?: string,
 *   decisionAction?: string,
 *   shouldProceed?: boolean,
 *   region?: string | null,
 *   deployment?: string | null
 * }} meta
 */
export function buildRhizohConstitutionalObservabilityEnvelope(meta = {}) {
  const traceId = meta.traceId != null ? String(meta.traceId) : null;
  return {
    schemaId: RHIZOH_OBSERVABILITY_SCHEMA_ID,
    schemaVersion: "1.0.0",
    hardeningVersion: RHIZOH_OPERATIONAL_HARDENING_VERSION,
    traceId,
    spanName: "rhizoh.llm.constitutional_turn",
    resource: {
      service: "castle-gateway",
      region: meta.region != null ? String(meta.region) : null,
      deployment: meta.deployment != null ? String(meta.deployment) : null
    },
    metrics: {
      turnLatencyMs:
        meta.turnLatencyMs != null && Number.isFinite(Number(meta.turnLatencyMs))
          ? Math.max(0, Number(meta.turnLatencyMs))
          : null,
      constitutionalPipelineVersion: meta.pipelineVersion != null ? String(meta.pipelineVersion) : null,
      decisionAction: meta.decisionAction != null ? String(meta.decisionAction) : null,
      shouldProceed: meta.shouldProceed === true || meta.shouldProceed === false ? meta.shouldProceed : null
    }
  };
}

/**
 * Karar motoruna giren donmuş özet — regression/replay için (LLM metni hariç).
 * @param {{
 *   ethics?: Record<string, unknown>,
 *   cost?: Record<string, unknown>,
 *   recovery?: Record<string, unknown>,
 *   latencyAssertion?: Record<string, unknown>,
 *   metrics?: Record<string, unknown>,
 *   envelopeWithinLatencyBudget?: boolean | null
 * }} decisionInput
 * @param {{
 *   primaryPolicyId?: string,
 *   primaryPolicyVersion?: string,
 *   thresholdsFingerprint?: string,
 *   theta?: number,
 *   phase?: string | null
 * }} harnessMeta
 */
export function buildRhizohConstitutionalReplayHarnessSeed(decisionInput = {}, harnessMeta = {}) {
  const ethics = decisionInput.ethics && typeof decisionInput.ethics === "object" ? decisionInput.ethics : {};
  const cost = decisionInput.cost && typeof decisionInput.cost === "object" ? decisionInput.cost : {};
  const recovery =
    decisionInput.recovery && typeof decisionInput.recovery === "object" ? decisionInput.recovery : {};
  const latencyAssertion =
    decisionInput.latencyAssertion && typeof decisionInput.latencyAssertion === "object"
      ? decisionInput.latencyAssertion
      : {};
  const metrics =
    decisionInput.metrics && typeof decisionInput.metrics === "object" ? decisionInput.metrics : {};

  const attractorSnap =
    recovery.attractorSnap && typeof recovery.attractorSnap === "object"
      ? recovery.attractorSnap
      : {};
  const checkpoint =
    recovery.checkpoint && typeof recovery.checkpoint === "object" ? recovery.checkpoint : {};

  const seed = {
    envelopeWithinLatencyBudget:
      decisionInput.envelopeWithinLatencyBudget === true ||
      decisionInput.envelopeWithinLatencyBudget === false
        ? decisionInput.envelopeWithinLatencyBudget
        : null,
    ethics: {
      ethicalScore: ethics.ethicalScore ?? null,
      harmGradient: ethics.harmGradient ?? null,
      coercionPenalty: ethics.coercionPenalty ?? null,
      truthDistortionPenalty: ethics.truthDistortionPenalty ?? null,
      autonomyPreservation: ethics.autonomyPreservation ?? null,
      recommendProceed: ethics.recommendProceed ?? null
    },
    cost: {
      totalRelativeCost: cost.totalRelativeCost ?? null,
      mode: cost.mode ?? null
    },
    recovery: {
      attractorThetaBefore: attractorSnap.thetaBefore ?? null,
      attractorThetaAfter: attractorSnap.thetaAfter ?? null,
      checkpointPhase: checkpoint.phase ?? null
    },
    latencyAssertion: {
      ok: latencyAssertion.ok ?? null,
      headroomMs: latencyAssertion.headroomMs ?? null,
      elapsedMs: latencyAssertion.elapsedMs ?? null
    },
    metricsLite: {
      thetaEffective: metrics.thetaEffective ?? null,
      stressIndex: metrics.stressIndex ?? null,
      collapseRisk: metrics.collapseRisk ?? null
    },
    harnessMeta: {
      primaryPolicyId: harnessMeta.primaryPolicyId ?? null,
      primaryPolicyVersion: harnessMeta.primaryPolicyVersion ?? null,
      thresholdsFingerprint: harnessMeta.thresholdsFingerprint ?? null,
      theta: harnessMeta.theta ?? null,
      phase: harnessMeta.phase ?? null
    }
  };

  return {
    replaySchemaId: "rhizoh.replay.constitutional_decision_seed.v1",
    replaySchemaVersion: "1.0.0",
    seed,
    seedFingerprint: canonicalRhizohOperationalJson(seed)
  };
}

/**
 * Karar çıktısı parmak izi — deterministik regression için.
 * @param {Record<string, unknown>} decision
 */
export function fingerprintRhizohConstitutionalDecision(decision) {
  const trace = Array.isArray(decision.policyTrace) ? decision.policyTrace : [];
  const slimTrace = trace.map((t) => ({
    ruleId: t?.ruleId ?? null,
    severity: t?.severity ?? null,
    matched: t?.matched === true
  }));
  const fpBody = {
    policyId: decision.policyId ?? null,
    action: decision.action ?? null,
    severityRank: decision.severityRank ?? null,
    confidence: decision.confidence ?? null,
    decisionLayerVersion: decision.decisionLayerVersion ?? null,
    policyTrace: slimTrace
  };
  return canonicalRhizohOperationalJson(fpBody);
}

/**
 * Eşik haritası parmak izi — policy paketi drift kontrolü.
 * @param {Record<string, number>} thresholds
 */
export function fingerprintRhizohConstitutionalThresholdMap(thresholds = {}) {
  const sorted = {};
  for (const k of Object.keys(thresholds).sort()) {
    const v = thresholds[k];
    if (Number.isFinite(Number(v))) sorted[k] = Math.round(Number(v) * 10000) / 10000;
  }
  return canonicalRhizohOperationalJson(sorted);
}

/**
 * Çok-bölge senaryosu için çelişki özeti (altyapı yok; sözleşme + öncelik).
 * @param {ReadonlyArray<{ regionId: string, policyVersion?: string, priority?: number, observedAt?: number }>} peers
 */
export function synthesizeRhizohConstitutionalMultiRegionPolicySync(peers = []) {
  const clean = peers
    .filter((p) => p && typeof p === "object" && String(p.regionId || "").trim())
    .map((p) => ({
      regionId: String(p.regionId),
      policyVersion: p.policyVersion != null ? String(p.policyVersion) : "unknown",
      priority: Number.isFinite(Number(p.priority)) ? Number(p.priority) : 0,
      observedAt: Number.isFinite(Number(p.observedAt)) ? Number(p.observedAt) : 0
    }))
    .sort((a, b) => b.priority - a.priority || a.regionId.localeCompare(b.regionId));

  if (clean.length === 0) {
    return {
      multiRegionSchemaId: "rhizoh.multiregion.policy_sync.v1",
      mode: "singleton",
      recommendedLeadRegion: null,
      suggestedConsensusVersion: null,
      conflicts: []
    };
  }

  const versions = [...new Set(clean.map((c) => c.policyVersion))];
  const conflicts =
    versions.length > 1
      ? [
          {
            kind: "version_skew",
            versions,
            detail: "Farklı policyVersion raporları — R7 rollout sırasını kontrol edin."
          }
        ]
      : [];

  const lead = clean[0];

  return {
    multiRegionSchemaId: "rhizoh.multiregion.policy_sync.v1",
    mode: conflicts.length ? "review_required" : "aligned",
    recommendedLeadRegion: lead.regionId,
    suggestedConsensusVersion: versions.length === 1 ? versions[0] : null,
    conflicts
  };
}

/**
 * Denetim satırı gövdesi — gateway SHA256 ile sarar.
 * @param {{
 *   traceId?: string | null,
 *   ts?: number,
 *   decisionAction?: string,
 *   policyId?: string | null,
 *   policyVersion?: string | null,
 *   enforcementApplied?: boolean,
 *   outcomeDigest?: string | null
 * }} fields
 */
export function buildRhizohConstitutionalAuditPayload(fields = {}) {
  const body = {
    auditSchemaId: "rhizoh.audit.constitutional_turn.v1",
    auditSchemaVersion: "1.0.0",
    ts: fields.ts ?? Date.now(),
    traceId: fields.traceId != null ? String(fields.traceId) : null,
    decisionAction: fields.decisionAction != null ? String(fields.decisionAction) : null,
    policyId: fields.policyId != null ? String(fields.policyId) : null,
    policyVersion: fields.policyVersion != null ? String(fields.policyVersion) : null,
    enforcementApplied: fields.enforcementApplied === true,
    outcomeDigest: fields.outcomeDigest != null ? String(fields.outcomeDigest) : null
  };
  return {
    body,
    canonicalBody: canonicalRhizohOperationalJson(body)
  };
}

/**
 * Replay tohumu ile parmak izi tutarlılığı (unit/regression).
 * @param {{ seed: unknown, seedFingerprint: string }} harness
 */
export function verifyRhizohConstitutionalReplaySeedIntegrity(harness) {
  if (!harness || typeof harness !== "object") return false;
  const seed = /** @type {{ seed?: unknown }} */ (harness).seed;
  const fp = /** @type {{ seedFingerprint?: string }} */ (harness).seedFingerprint;
  if (typeof fp !== "string") return false;
  return canonicalRhizohOperationalJson(seed) === fp;
}

/**
 * @param {Record<string, unknown>} decision
 * @param {string} expectedFingerprint
 */
export function verifyRhizohConstitutionalDecisionFingerprint(decision, expectedFingerprint) {
  if (typeof expectedFingerprint !== "string") return false;
  return fingerprintRhizohConstitutionalDecision(decision) === expectedFingerprint;
}
