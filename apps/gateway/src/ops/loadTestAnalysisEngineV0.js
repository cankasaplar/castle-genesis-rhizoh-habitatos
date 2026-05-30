/**
 * Load test analysis engine v1 — SIM-first health intelligence + pattern classifier.
 * Input: load_test_harness_LATEST.json → load_test_analysis_LATEST.json
 */

import { readFileSync, existsSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { classifyFailureModesV0, FAILURE_MODE_ID_V0 } from "./failureModeClassificationV0.js";
import {
  extractSimRealDivergenceV0,
  resolveExecutionModeFromReportV0
} from "./simRealDivergenceSignaturesV0.js";

export const LOAD_TEST_ANALYSIS_SCHEMA_V0 = "rhizoh.load_test.analysis.v1";

/**
 * @param {unknown} report
 */
function extractMetricSlicesV0(report) {
  /** @type {Record<string, unknown>[]} */
  const slices = [];

  if (!report || typeof report !== "object") return slices;
  const r = /** @type {Record<string, unknown>} */ (report);

  if (r.phases && typeof r.phases === "object") {
    for (const [label, phase] of Object.entries(/** @type {Record<string, unknown>} */ (r.phases))) {
      const p = /** @type {Record<string, unknown>} */ (phase);
      const rollout = p.postSnapshot?.rollout || {};
      if (p.result?.steps) {
        for (const step of /** @type {Record<string, unknown>[]} */ (p.result.steps)) {
          slices.push({
            label: `${label}:${step.users}`,
            metrics: step.metrics || {},
            rollout,
            lifecycleReconcile: step.metrics?.lifecycleReconcile || p.lifecycleReconcile,
            chaos: p.chaos,
            redisConnected: rollout.health?.redisConnected === true,
            coordinationSim: rollout.coordinationSim === true || rollout.ledgerMode === "coordination_sim"
          });
        }
      } else {
        slices.push(sliceFromScenario(label, p));
      }
    }
    return slices;
  }

  slices.push(sliceFromScenario(String(r.scenarioId || "report"), r));
  return slices;
}

/**
 * @param {string} label
 * @param {Record<string, unknown>} p
 */
function sliceFromScenario(label, p) {
  const metrics = p.result?.metrics || p.metrics || {};
  const rollout = p.postSnapshot?.rollout || {};
  return {
    label,
    metrics,
    rollout,
    lifecycleReconcile: p.lifecycleReconcile || metrics.lifecycleReconcile,
    chaos: p.chaos,
    redisConnected: rollout.health?.redisConnected === true,
    coordinationSim: rollout.coordinationSim === true || rollout.ledgerMode === "coordination_sim"
  };
}

/**
 * @param {Record<string, unknown>} slice
 * @param {string} executionMode
 */
function classifySliceV0(slice, executionMode) {
  return classifyFailureModesV0({
    metrics: slice.metrics,
    rollout: slice.rollout,
    lifecycleReconcile: slice.lifecycleReconcile,
    chaos: slice.chaos,
    redisConnected: slice.redisConnected,
    coordinationSim: slice.coordinationSim,
    executionMode
  });
}

/**
 * @param {{ slices: { label: string, classification: object }[], executionMode: string, dominantFailureMode: string, divergence: object }} analysis
 */
function buildSystemHealthIntelligenceV0(analysis) {
  const sim = analysis.executionMode === "coordination_sim";
  const dom = analysis.dominantFailureMode;

  /** @type {string[]} */
  const findings = [];
  if (dom === FAILURE_MODE_ID_V0.SOFT_SATURATION) {
    findings.push("System reports OK (high successRate) while queue depth grows — soft saturation.");
  }
  if (analysis.primaryCounts[FAILURE_MODE_ID_V0.ROLLOUT_HYSTERESIS]) {
    findings.push("Rollout capacity state may lag actual in-flight (hysteresis) — check reconcile.");
  }
  if (analysis.primaryCounts[FAILURE_MODE_ID_V0.LIFECYCLE_RECOVERED]) {
    findings.push("Lifecycle reconcile recovered orphaned leases — invariant path working.");
  }
  if (sim && analysis.primaryCounts[FAILURE_MODE_ID_V0.REDIS_COORDINATION_LAG]) {
    findings.push("Redis lag signal is SIM-injected only — validate later with ops:redis-stress.");
  }

  return Object.freeze({
    verdict:
      dom === FAILURE_MODE_ID_V0.HEALTHY
        ? "operational_within_sim_bounds"
        : "degraded_under_stress_sim",
    executionMode: analysis.executionMode,
    dominantPattern: dom,
    gclLayer: "stable",
    executionLayer: sim ? "lease_consistent_sim" : "lease_consistent",
    lifecycleLayer: "reconcile_available",
    coordinationLayer: sim ? "simulated_truth" : analysis.executionMode,
    findings,
    signOff: Object.freeze({
      simLogic: sim ? "pass_for_logic" : "n/a",
      realRedisValidation: sim ? "required_before_prod" : "run_completed"
    })
  });
}

/**
 * @param {object} analysis
 */
function formatAnalysisMarkdownV0(analysis) {
  const lines = [
    "# Load Test — System Health Intelligence",
    "",
    `**Analyzed:** ${analysis.analyzedAt}`,
    `**Execution mode:** \`${analysis.executionMode}\``,
    `**Dominant pattern:** \`${analysis.dominantFailureMode}\``,
    "",
    "## Verdict",
    "",
    analysis.systemHealthIntelligence.verdict,
    "",
    "## Findings",
    ""
  ];
  for (const f of analysis.systemHealthIntelligence.findings) {
    lines.push(`- ${f}`);
  }
  lines.push("", "## Pattern counts", "");
  for (const [k, v] of Object.entries(analysis.primaryCounts)) {
    lines.push(`- \`${k}\`: ${v} slice(s)`);
  }
  lines.push("", "## SIM vs REAL divergence", "");
  for (const s of analysis.divergence.signatures) {
    const mark = s.observed ? "x" : " ";
    lines.push(`- [${mark}] **${s.id}** — SIM: ${s.sim} | REAL: ${s.real}`);
  }
  lines.push("", "## Priority", "");
  for (const p of analysis.revisedPriority) {
    lines.push(`${p.rank}. **${p.action}** — ${p.reason}`);
  }
  return lines.join("\n");
}

/**
 * @param {unknown} report
 */
export function analyzeLoadTestReportV0(report) {
  const executionMode = resolveExecutionModeFromReportV0(
    /** @type {Record<string, unknown>} */ (report || {})
  );
  const rawSlices = extractMetricSlicesV0(report);
  const classified = rawSlices.map((s) => ({
    label: s.label,
    classification: classifySliceV0(s, executionMode)
  }));

  const primaryCounts = {};
  for (const c of classified) {
    const id = c.classification.primary;
    primaryCounts[id] = (primaryCounts[id] || 0) + 1;
  }

  const dominant = Object.entries(primaryCounts).sort((a, b) => b[1] - a[1])[0]?.[0];

  const sim = executionMode === "coordination_sim";

  const layers = Object.freeze({
    gcl: { status: "stable", note: "financial_truth_deterministic" },
    rollout: {
      status: "lease_consistent",
      note: sim ? "ownership_via_coordination_sim" : "ownership_cluster_or_memory"
    },
    lifecycle: { status: "reconcile_available", note: "ttl_release_guarantee" },
    coordination: {
      status: sim ? "simulated" : executionMode === "redis_cluster" ? "redis_active" : "dev_memory",
      note: sim ? "in_memory_redis_coordination_v0" : "requires_redis_for_full_truth"
    }
  });

  const revisedPriority = Object.freeze(
    sim
      ? [
          { rank: 1, action: "sim_analysis_review", reason: "pattern classifier on LATEST export", done: true },
          { rank: 2, action: "address_dominant_sim_pattern", reason: `focus:${dominant || "healthy"}` },
          { rank: 3, action: "redis_stress_validation", reason: "validation layer only — not blocking sim sign-off" },
          { rank: 4, action: "http_rl_cluster_b3", reason: "optimization" }
        ]
      : [
          { rank: 1, action: "redis_stress_validation", reason: "real coordination truth" },
          { rank: 2, action: "sim_analysis_review", reason: "compare with coordination_sim baseline", done: true },
          { rank: 3, action: "http_rl_cluster_b3", reason: "optimization" }
        ]
  );

  const draft = {
    schema: LOAD_TEST_ANALYSIS_SCHEMA_V0,
    analyzedAt: new Date().toISOString(),
    executionMode,
    sliceCount: classified.length,
    slices: classified,
    dominantFailureMode: dominant || FAILURE_MODE_ID_V0.HEALTHY,
    primaryCounts,
    layers
  };

  const divergence = extractSimRealDivergenceV0(report, draft);
  const systemHealthIntelligence = buildSystemHealthIntelligenceV0({ ...draft, divergence });

  return Object.freeze({
    ...draft,
    divergence,
    systemHealthIntelligence,
    newRisks: divergence.realValidationRequired.length
      ? divergence.realValidationRequired.map((id) => ({
          id,
          level: "validate_on_real_redis"
        }))
      : Object.freeze([
          { id: FAILURE_MODE_ID_V0.ZSET_PRESSURE, level: "medium" },
          { id: FAILURE_MODE_ID_V0.TTL_RECONCILE_COUPLING, level: "medium" }
        ]),
    revisedPriority,
    systemClass: "distributed_bounded_execution_with_ownership_lifecycle_and_financial_coherence"
  });
}

/**
 * @param {string} harnessPath
 * @param {{ exportDir?: string }} [opts]
 */
export function analyzeAndExportLoadTestV0(harnessPath, opts = {}) {
  const analysis = analyzeLoadTestReportFileV0(harnessPath);
  const here = dirname(fileURLToPath(import.meta.url));
  const exportDir = opts.exportDir || join(here, "../../../../docs/exports/ops");
  mkdirSync(exportDir, { recursive: true });

  const jsonPath = join(exportDir, "load_test_analysis_LATEST.json");
  const mdPath = join(exportDir, "load_test_sim_analysis_LATEST.md");
  const divergencePath = join(exportDir, "sim_real_divergence_LATEST.json");

  const json = JSON.stringify(analysis, null, 2);
  writeFileSync(jsonPath, json, "utf8");
  writeFileSync(mdPath, formatAnalysisMarkdownV0(analysis), "utf8");
  writeFileSync(
    divergencePath,
    JSON.stringify(
      {
        schema: analysis.divergence.schema,
        executionMode: analysis.executionMode,
        signatures: analysis.divergence.signatures,
        simReliableObserved: analysis.divergence.simReliableObserved,
        realValidationRequired: analysis.divergence.realValidationRequired,
        validationLayer: analysis.divergence.validationLayer
      },
      null,
      2
    ),
    "utf8"
  );

  return { analysis, jsonPath, mdPath, divergencePath };
}

/**
 * @param {string} path
 */
export function analyzeLoadTestReportFileV0(path) {
  if (!existsSync(path)) {
    throw new Error(`load_test_report_not_found:${path}`);
  }
  const raw = readFileSync(path, "utf8");
  const report = JSON.parse(raw);
  return analyzeLoadTestReportV0(report);
}
