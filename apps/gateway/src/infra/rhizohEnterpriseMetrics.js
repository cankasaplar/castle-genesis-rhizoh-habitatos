/**
 * Enterprise autoscaler / Prometheus çıkarımı — Rhizoh /rhizoh/llm tur sayaçları.
 * R5 `action` etiketi sabit kümede tutulur → Prometheus cardinality patlaması önlenir.
 */

const LATENCY_UPPER_MS = [50, 100, 250, 500, 1000, 2500, 5000, 15000];

/** R5 RhizohConstitutionalDecisionAction + tur özeti */
const R5_METRIC_ACTIONS = new Set(["allow", "modify", "reject", "throttle", "require_recovery"]);

/**
 * @param {unknown} action decision.action veya benzeri
 * @returns {string} güvenli label değeri (≤ ~7 zaman serisi + none/other/error)
 */
export function normalizeRhizohDecisionActionMetricLabel(action) {
  if (action == null || action === "") return "none";
  const s = String(action)
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_]/g, "_")
    .slice(0, 48);
  if (!s) return "none";
  if (R5_METRIC_ACTIONS.has(s)) return s;
  if (s === "none" || s === "error") return s;
  return "other";
}

/** @type {{ turnsTotal: number, turnErrors: number, decisionByAction: Record<string, number>, latencyBuckets: number[] }} */
export const rhizohEnterpriseMetrics = {
  turnsTotal: 0,
  turnErrors: 0,
  decisionByAction: {},
  latencyBuckets: LATENCY_UPPER_MS.map(() => 0)
};

function observeLatencyBucket(ms) {
  const n = Math.max(0, Number(ms) || 0);
  for (let i = 0; i < LATENCY_UPPER_MS.length; i++) {
    if (n <= LATENCY_UPPER_MS[i]) rhizohEnterpriseMetrics.latencyBuckets[i] += 1;
  }
}

/**
 * @param {{
 *   turnLatencyMs?: number,
 *   decisionAction?: string,
 *   ok?: boolean
 * }} snap
 */
export function recordRhizohLlmTurnCompleted(snap = {}) {
  rhizohEnterpriseMetrics.turnsTotal += 1;
  if (snap.ok === false) rhizohEnterpriseMetrics.turnErrors += 1;
  const raw = snap.ok === false && snap.decisionAction == null ? "error" : snap.decisionAction;
  const action = normalizeRhizohDecisionActionMetricLabel(raw);
  rhizohEnterpriseMetrics.decisionByAction[action] =
    (rhizohEnterpriseMetrics.decisionByAction[action] || 0) + 1;
  if (snap.turnLatencyMs != null && Number.isFinite(Number(snap.turnLatencyMs))) {
    observeLatencyBucket(snap.turnLatencyMs);
  }
}

export function renderRhizohPrometheusMetrics() {
  const m = rhizohEnterpriseMetrics;
  const lines = [];
  lines.push("# HELP castle_rhizoh_llm_turns_total Completed POST /rhizoh/llm orchestrator turns.");
  lines.push("# TYPE castle_rhizoh_llm_turns_total counter");
  lines.push(`castle_rhizoh_llm_turns_total ${m.turnsTotal}`);

  lines.push("# HELP castle_rhizoh_llm_turn_errors_total Turns ending in error path.");
  lines.push("# TYPE castle_rhizoh_llm_turn_errors_total counter");
  lines.push(`castle_rhizoh_llm_turn_errors_total ${m.turnErrors}`);

  lines.push("# HELP castle_rhizoh_constitutional_decisions_total Decisions by R5 action.");
  lines.push("# TYPE castle_rhizoh_constitutional_decisions_total counter");
  for (const [action, n] of Object.entries(m.decisionByAction)) {
    const safe = action.replace(/[^a-zA-Z0-9_]/g, "_") || "unknown";
    lines.push(`castle_rhizoh_constitutional_decisions_total{action="${safe}"} ${n}`);
  }

  lines.push("# HELP castle_rhizoh_llm_turn_latency_ms_bucket Cumulative latency buckets (ms).");
  lines.push("# TYPE castle_rhizoh_llm_turn_latency_ms_bucket counter");
  for (let i = 0; i < LATENCY_UPPER_MS.length; i++) {
    lines.push(
      `castle_rhizoh_llm_turn_latency_ms_bucket{le="${LATENCY_UPPER_MS[i]}"} ${m.latencyBuckets[i]}`
    );
  }

  return `${lines.join("\n")}\n`;
}
