/**
 * R4 — Constitutional product interface layer — dış dünya için stabil zarf, şema sürümü, gecikme bütçesi, gözlemlenebilir metrikler.
 */

export const RHIZOH_CONSTITUTIONAL_PRODUCT_API_SCHEMA_VERSION = "1.0.0";

/** SLA için varsayılan üst sınır önerisi (ms); ürün konfigürasyonu ezmeli. */
export const RHIZOH_CONSTITUTIONAL_PRODUCT_DEFAULT_LATENCY_BUDGET_MS_V1 = 2500;

/**
 * @param {unknown} payload
 * @param {{
 *   emittedAt?: number,
 *   latencyMs?: number,
 *   latencyBudgetMs?: number,
 *   constitutionalVersions?: Record<string, string>,
 *   traceId?: string | null,
 *   contractId?: string
 * }} meta
 */
export function buildRhizohConstitutionalProductEnvelope(payload, meta = {}) {
  const emittedAt = meta.emittedAt ?? Date.now();
  const latencyMs = meta.latencyMs != null ? Math.max(0, Number(meta.latencyMs)) : undefined;
  const budget =
    meta.latencyBudgetMs != null
      ? Math.max(0, Number(meta.latencyBudgetMs))
      : RHIZOH_CONSTITUTIONAL_PRODUCT_DEFAULT_LATENCY_BUDGET_MS_V1;
  const within =
    latencyMs == null ? null : latencyMs <= budget;

  return {
    contractId: meta.contractId ?? "rhizoh.constitutional.product.v1",
    schemaVersion: RHIZOH_CONSTITUTIONAL_PRODUCT_API_SCHEMA_VERSION,
    emittedAt,
    latencyMs,
    latencyBudgetMs: budget,
    withinLatencyBudget: within,
    constitutionalVersions: meta.constitutionalVersions ?? {},
    traceId: meta.traceId ?? null,
    payload
  };
}

/**
 * @param {number} t0 epoch ms
 * @param {number} budgetMs
 * @param {number} [now]
 */
export function assertRhizohConstitutionalLatencyBudget(t0, budgetMs, now = Date.now()) {
  const elapsed = Math.max(0, now - Number(t0 || 0));
  const b = Math.max(0, Number(budgetMs || 0));
  return {
    ok: elapsed <= b,
    elapsedMs: elapsed,
    budgetMs: b,
    headroomMs: Math.round(Math.max(0, b - elapsed))
  };
}

/**
 * Kernel / overlay çıktısından düz telemetry nesnesi (observable metrics export).
 * @param {Record<string, unknown>} kernelLike
 */
export function exportRhizohConstitutionalObservableMetrics(kernelLike = {}) {
  const tick = /** @type {Record<string, unknown>} */ (kernelLike.tick || {});
  const ext = /** @type {Record<string, unknown>} */ (kernelLike.extensions || {});
  const ca = /** @type {Record<string, unknown>} */ (tick.constitutionalAdaptation || {});
  const pot = /** @type {Record<string, unknown>} */ (tick.constitutionalPotential || {});
  const exec = /** @type {Record<string, unknown>} */ (tick.executionEnvelope || {});

  return {
    schemaVersion: RHIZOH_CONSTITUTIONAL_PRODUCT_API_SCHEMA_VERSION,
    dynamicsVersion: tick.dynamicsVersion ?? null,
    thetaEffective: kernelLike.runtimeTheta ?? ca.thetaEffective ?? ca.thetaNext ?? null,
    thetaPhase:
      kernelLike.runtimeThetaPhase?.phase ??
      /** @type {Record<string, unknown>} */ (tick.thetaPhase || {}).phase ??
      null,
    stressIndex: pot.stressIndex ?? null,
    allowExecution: exec.allowExecution ?? null,
    organismStressMode: /** @type {Record<string, unknown>} */ (tick.organismStress || {}).mode ?? null,
    collapseRisk: /** @type {Record<string, unknown>} */ (ext.phaseCollapse || {}).collapseRisk ?? null,
    bifurcationAmplification:
      /** @type {Record<string, unknown>} */ (ext.bifurcation || {}).amplificationFactor ?? null,
    incompletenessPressure:
      /** @type {Record<string, unknown>} */ (kernelLike.layers?.W_godel_boundary || {})
        .incompletenessPressure ?? null,
    queueTruncated: /** @type {Record<string, unknown>} */ (kernelLike.irVm || {}).queueTruncated ?? null
  };
}

/**
 * İstemci / gateway için minimal istek sözleşmesi alanları (belgeleme helper).
 */
export const RHIZOH_CONSTITUTIONAL_PRODUCT_INPUT_CONTRACT_V1 = Object.freeze({
  requiredContextKeys: ["constitutionalTheta", "now"],
  optionalContextKeys: ["subjectId", "agentId", "traceId", "latencyBudgetMs"],
  constitutionalHeadersSuggested: ["x-rhizoh-constitutional-schema", "x-rhizoh-trace-id"]
});
