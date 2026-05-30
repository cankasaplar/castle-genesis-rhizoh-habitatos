/**
 * Projection contract v0 — semantic firewall for Interaction Geometry outputs.
 * RESEARCH-ONLY surface contract: no identity substrate access; see docs/INTERACTION_GEOMETRY_V0.md §8.
 */

/** Product-facing form descriptors (session-non-referential; versioned allowlist). */
export const ALLOWED_PRODUCT_FORM_DESCRIPTORS_V0 = Object.freeze([
  "turn_pacing_calm",
  "turn_pacing_moderate",
  "turn_pacing_dense",
  "language_mix_low",
  "language_mix_moderate",
  "language_mix_high",
  "recall_load_low",
  "recall_load_moderate",
  "recall_load_high",
  "session_form_unknown_v0"
]);

/** Debug / observability causal labels (engineering vocabulary only). */
export const ALLOWED_DEBUG_CAUSAL_LABELS_V0 = Object.freeze([
  "recall_overlay_correlation",
  "witness_step_ordering",
  "envelope_latency_skew",
  "projection_descriptor_rejected",
  "debug_causal_unknown_v0"
]);

/** Research export: only these keys allowed in aggregate rows (counts / rates). */
export const ALLOWED_RESEARCH_AGGREGATE_KEYS_V0 = Object.freeze([
  "sample_count",
  "turn_count",
  "descriptor_histogram",
  "mean_recall_proxy",
  "mean_language_mix_proxy"
]);

const productSet = new Set(ALLOWED_PRODUCT_FORM_DESCRIPTORS_V0);
const debugSet = new Set(ALLOWED_DEBUG_CAUSAL_LABELS_V0);
const researchKeySet = new Set(ALLOWED_RESEARCH_AGGREGATE_KEYS_V0);

/**
 * @param {string} id
 * @returns {boolean}
 */
export function isAllowedProductFormDescriptorV0(id) {
  return productSet.has(String(id || "").trim());
}

/**
 * @param {string} id
 * @returns {boolean}
 */
export function isAllowedDebugCausalLabelV0(id) {
  return debugSet.has(String(id || "").trim());
}

/**
 * Burstiness proxy [0,1] → **only** allowlisted product descriptor (metric → label lock).
 * @param {unknown} burst01
 * @returns {string | null}
 */
export function mapBurstiness01ToProductDescriptorV0(burst01) {
  const x = Number(burst01);
  if (!Number.isFinite(x)) return null;
  const t = Math.max(0, Math.min(1, x));
  if (t < 0.33) return "turn_pacing_calm";
  if (t < 0.66) return "turn_pacing_moderate";
  return "turn_pacing_dense";
}

/**
 * @param {unknown} mix01 language hybridity proxy [0,1]
 * @returns {string | null}
 */
export function mapLanguageMix01ToProductDescriptorV0(mix01) {
  const x = Number(mix01);
  if (!Number.isFinite(x)) return null;
  const t = Math.max(0, Math.min(1, x));
  if (t < 0.33) return "language_mix_low";
  if (t < 0.66) return "language_mix_moderate";
  return "language_mix_high";
}

/**
 * High-precision **identity / trait** colloquialism patterns (presentation copy scan).
 * Extend only with review — false positives break legitimate engineering copy.
 */
const LEAKAGE_RULES_V0 = Object.freeze([
  { id: "en_you_are_a", re: /\byou\s+are\s+(a|an)\s+/i },
  { id: "en_user_is_a", re: /\bthe\s+user\s+is\s+(a|an)\s+/i },
  { id: "en_impulsive_user", re: /\bimpulsive\s+user\b/i },
  { id: "en_personality_trait", re: /\bpersonality\s+trait\b/i },
  { id: "tr_kullanici_kisilik", re: /kullanıcının\s+kişili/i },
  { id: "tr_kullanici_soyle_biri", re: /kullanıcı\s+şöyle\s+biri/i },
  { id: "tr_zeka_seviyesi", re: /zeka\s+seviyesi/i },
  { id: "expertise_level", re: /\bexpertise\s+level\b/i }
]);

/**
 * Scan user-visible or doc copy for identity-leakage phrases (non-blocking API).
 * @param {string} text
 * @returns {{ ruleId: string, index: number, length: number }[]}
 */
export function projectionCopyLeakageFindingsV0(text) {
  const s = String(text || "");
  if (!s) return [];
  /** @type {{ ruleId: string, index: number, length: number }[]} */
  const out = [];
  for (const { id, re } of LEAKAGE_RULES_V0) {
    re.lastIndex = 0;
    let m;
    while ((m = re.exec(s)) != null) {
      out.push({ ruleId: id, index: m.index, length: m[0].length });
    }
  }
  return out;
}

/**
 * Research aggregates: numeric-only values, allowlisted keys; `descriptor_histogram` must be Record<string, number> with allowlisted descriptor keys.
 * @param {Record<string, unknown>} row
 * @returns {{ ok: true, row: Record<string, number | Record<string, number>> } | { ok: false, errors: string[] }}
 */
export function validateResearchAggregateRowV0(row) {
  if (!row || typeof row !== "object" || Array.isArray(row)) {
    return { ok: false, errors: ["row_must_be_object"] };
  }
  /** @type {string[]} */
  const errors = [];
  /** @type {Record<string, number | Record<string, number>>} */
  const out = {};
  for (const [k, v] of Object.entries(row)) {
    if (!researchKeySet.has(k)) {
      errors.push(`forbidden_research_key:${k}`);
      continue;
    }
    if (k === "descriptor_histogram") {
      if (!v || typeof v !== "object" || Array.isArray(v)) {
        errors.push("descriptor_histogram_must_be_object");
        continue;
      }
      /** @type {Record<string, number>} */
      const hist = {};
      for (const [dk, dv] of Object.entries(v)) {
        if (!isAllowedProductFormDescriptorV0(dk)) {
          errors.push(`histogram_descriptor_not_allowed:${dk}`);
          continue;
        }
        const n = Number(dv);
        if (!Number.isFinite(n)) {
          errors.push(`histogram_non_numeric:${dk}`);
          continue;
        }
        hist[dk] = n;
      }
      out[k] = hist;
      continue;
    }
    const n = Number(v);
    if (!Number.isFinite(n)) {
      errors.push(`non_numeric:${k}`);
      continue;
    }
    out[k] = n;
  }
  if (errors.length) return { ok: false, errors };
  return { ok: true, row: out };
}
