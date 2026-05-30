/**
 * Behavioral drift baseline v0 — reference snapshot before Phase 3 economic stress.
 * Measures normal-band patterns; drift detection compares future runs to this baseline.
 */
import crypto from "node:crypto";
import { canonicalObservabilityJsonV0, fingerprintAgentContextV0 } from "./agentObservabilityV0.js";
import {
  getAgentSessionKeyV0,
  simulateRecursiveToolChainV0,
  resetAgentContainmentSessionsV0,
  readAgentContainmentConfigV0
} from "./agentContainmentV0.js";
import { assessCostBeforeTurnV0, resetCostContainmentV0 } from "./costContainmentV0.js";

export const BEHAVIORAL_DRIFT_BASELINE_SCHEMA_V0 = "rhizoh.behavioral_drift.baseline.v0";

const COHORT_TIERS = [50, 200, 500];

/**
 * Shannon entropy (bits) over discrete tool/event histogram.
 * @param {Record<string, number>} counts
 */
function histogramEntropyBits(counts) {
  const total = Object.values(counts).reduce((a, b) => a + b, 0);
  if (total <= 0) return 0;
  let h = 0;
  for (const c of Object.values(counts)) {
    if (c <= 0) continue;
    const p = c / total;
    h -= p * Math.log2(p);
  }
  return Number(h.toFixed(4));
}

/**
 * Synthetic “normal user” session — no injection, shallow tool use.
 * @param {string} uid
 * @param {number} index
 */
function simulateNormalUserSessionV0(uid, index) {
  const sessionKey = getAgentSessionKeyV0(uid, `baseline-${index}`);
  const tools = ["search_docs", "read_context", "summarize"];
  const toolHist = {};
  const events = [];
  let tokens = 0;
  for (let t = 0; t < 2; t++) {
    const tool = tools[t % tools.length];
    const r = simulateRecursiveToolChainV0(sessionKey, tool, 1);
    toolHist[tool] = (toolHist[tool] || 0) + 1;
    events.push({ tool, ok: r[0]?.ok ?? true });
    tokens += 120 + index % 40;
  }
  const ctx = {
    agentId: `agent-${uid}`,
    tenant: "baseline",
    locale: index % 3 === 0 ? "tr" : index % 3 === 1 ? "en" : "de"
  };
  const fp = fingerprintAgentContextV0(ctx);
  return {
    uid,
    sessionKey,
    toolHist,
    events,
    estimatedTokens: tokens,
    contextEntropyProxy: fp.hash,
    contextKeys: fp.keys?.length ?? 0
  };
}

/**
 * @param {number} cohortSize
 */
function simulateCohortV0(cohortSize) {
  const sessions = [];
  const toolAggregate = {};
  const contextHashes = {};
  let tokenSum = 0;

  for (let i = 0; i < cohortSize; i++) {
    const uid = `baseline-user-${i % Math.min(cohortSize, 50)}`;
    const s = simulateNormalUserSessionV0(uid, i);
    sessions.push(s);
    tokenSum += s.estimatedTokens;
    for (const [tool, c] of Object.entries(s.toolHist)) {
      toolAggregate[tool] = (toolAggregate[tool] || 0) + c;
    }
    contextHashes[s.contextEntropyProxy] = (contextHashes[s.contextEntropyProxy] || 0) + 1;
  }

  const principal = `cohort-${cohortSize}`;
  resetCostContainmentV0();
  let costBlocked = 0;
  for (const s of sessions.slice(0, Math.min(20, sessions.length))) {
    const pre = assessCostBeforeTurnV0(principal, { estimatedTokens: s.estimatedTokens });
    if (!pre.proceed) costBlocked += 1;
  }

  return {
    cohortSize,
    sessionCount: sessions.length,
    toolUsageDistribution: toolAggregate,
    toolEntropyBits: histogramEntropyBits(toolAggregate),
    uniqueContextFingerprints: Object.keys(contextHashes).length,
    contextFingerprintSpread: contextHashes,
    avgTokensPerSession: Number((tokenSum / cohortSize).toFixed(2)),
    costProbeBlockedRate: Number((costBlocked / Math.min(20, sessions.length)).toFixed(4)),
    localeMix: { tr: 0.34, en: 0.33, de: 0.33 }
  };
}

/**
 * Capture full baseline across phased rollout tiers (50 / 200 / 500).
 */
export function captureBehavioralDriftBaselineV0() {
  resetAgentContainmentSessionsV0();
  resetCostContainmentV0();

  const cohorts = COHORT_TIERS.map((n) => simulateCohortV0(n));
  const baseline = {
    schema: BEHAVIORAL_DRIFT_BASELINE_SCHEMA_V0,
    capturedAt: new Date().toISOString(),
    purpose: "Reference before Phase 3 economic stress — not global readiness proof",
    containmentConfig: readAgentContainmentConfigV0(),
    cohorts,
    aggregate: {
      toolUsageDistribution: mergeHistograms(cohorts.map((c) => c.toolUsageDistribution)),
      toolEntropyBits: histogramEntropyBits(
        mergeHistograms(cohorts.map((c) => c.toolUsageDistribution))
      ),
      tierLabels: COHORT_TIERS
    },
    operationalTrust: {
      phase1: "containment_verified_separately",
      phase2: "forensics_verified_separately",
      phase3Gate: "may_proceed_controlled",
      globalReadiness: false,
      note: "controlled_exposure ≠ global_readiness"
    },
    driftMonitoring: {
      status: "baseline_only",
      activeThresholds: false,
      next: "compare_future_runs_to_baseline_digest"
    }
  };

  baseline.digest = crypto
    .createHash("sha256")
    .update(canonicalObservabilityJsonV0(baseline), "utf8")
    .digest("hex");

  return baseline;
}

/**
 * @param {Record<string, number>[]} list
 */
function mergeHistograms(list) {
  const out = {};
  for (const h of list) {
    for (const [k, v] of Object.entries(h)) {
      out[k] = (out[k] || 0) + v;
    }
  }
  return out;
}

/**
 * Compare a live/sample metric bundle to baseline (drift hint, not alarm engine).
 * @param {ReturnType<typeof captureBehavioralDriftBaselineV0>} baseline
 * @param {{ toolEntropyBits?: number, uniqueContextFingerprints?: number }} sample
 */
export function compareToBehavioralDriftBaselineV0(baseline, sample) {
  const ref = baseline.cohorts[baseline.cohorts.length - 1];
  const entropyDelta = (sample.toolEntropyBits ?? 0) - ref.toolEntropyBits;
  const fpDelta = (sample.uniqueContextFingerprints ?? 0) - ref.uniqueContextFingerprints;
  return {
    schema: "rhizoh.behavioral_drift.compare.v0",
    entropyDelta,
    fingerprintSpreadDelta: fpDelta,
    driftSuspected: Math.abs(entropyDelta) > 0.5 || Math.abs(fpDelta) > ref.uniqueContextFingerprints * 0.25,
    note: "Thresholds not active in v0 — human/counsel review"
  };
}
