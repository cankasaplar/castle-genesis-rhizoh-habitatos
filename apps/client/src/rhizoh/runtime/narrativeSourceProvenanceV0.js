/**
 * Source provenance tagging for Narrative layer (D) outputs — anti semantic-trust-creep.
 * Every user-visible companion / narrative string SHOULD carry auditable chain metadata.
 *
 * @see docs/RHIZOH_CASTLE_GENESIS_PRODUCTION_ARCHITECTURE_V1.md §0.10
 */

export const NARRATIVE_SOURCE_PROVENANCE_SCHEMA_V0 = "castle.rhizoh.narrative_source_provenance.v0";

/** Max hops stored on envelope — prevents provenance inflation in UI/audit exports. */
export const MAX_NARRATIVE_SOURCE_CHAIN_V0 = 8;

/** @typedef {"untrusted_external_origin" | "trusted_internal_derived" | "mixed_origin" | "baseline_no_signal"} NarrativeTrustClassV0 */
/** @typedef {"stable" | "drifting" | "sparse"} NarrativeConfidenceShapeV0 */

export const NARRATIVE_CONFIDENCE_SHAPE_V0 = Object.freeze({
  STABLE: "stable",
  DRIFTING: "drifting",
  SPARSE: "sparse"
});

export const NARRATIVE_TRUST_CLASS_V0 = Object.freeze({
  UNTRUSTED_EXTERNAL: "untrusted_external_origin",
  TRUSTED_INTERNAL: "trusted_internal_derived",
  MIXED: "mixed_origin",
  BASELINE: "baseline_no_signal"
});

/** @typedef {"dedupe" | "length_limit" | "low_entropy_merge"} ProvenanceFoldReasonV0 */

export const PROVENANCE_FOLD_REASON_V0 = Object.freeze({
  DEDUPE: "dedupe",
  LENGTH_LIMIT: "length_limit",
  LOW_ENTROPY_MERGE: "low_entropy_merge"
});

const EXTERNAL_CHAIN_PREFIXES_V0 = Object.freeze(["lab.", "lab_plugin", "external."]);
const INTERNAL_CHAIN_PREFIXES_V0 = Object.freeze([
  "weather.",
  "traffic.",
  "compute",
  "resonance",
  "epi_sig",
  "satellite.registry",
  "companion.policy"
]);

/** @type {import('./narrativeSourceProvenanceV0.js').NarrativeOutputWithProvenanceV0[]} */
const recentNarrativeOutputsV0 = [];
const MAX_RECENT_NARRATIVE_V0 = 64;

/**
 * @typedef {Object} NarrativeProvenanceSummaryV0
 * @property {string} dominant_source — UI-primary anchor (one id)
 * @property {NarrativeConfidenceShapeV0} confidence_shape
 */

/**
 * @typedef {Object} NarrativeSourceProvenanceV0
 * @property {readonly string[]} source_chain — capped/deduped audit chain
 * @property {NarrativeTrustClassV0} trust_class
 * @property {number} derivation_depth — logical depth before cap
 * @property {NarrativeProvenanceSummaryV0} provenance_summary — UI-safe digest
 * @property {ProvenanceFoldReasonV0 | null} provenance_fold_reason — audit: why chain was normalized
 * @property {number} provenance_fold_count — hops removed or folded (0 if none)
 * @property {number} provenance_entropy_delta — 0–1 relative Shannon diversity loss (pre vs post fold)
 */

/**
 * @typedef {Object} NarrativeOutputWithProvenanceV0
 * @property {string} schema
 * @property {string} text
 * @property {NarrativeSourceProvenanceV0} provenance
 * @property {number} emittedAtMs
 */

/**
 * @param {unknown} entry
 * @returns {boolean}
 */
function isExternalChainEntryV0(entry) {
  const s = String(entry || "").toLowerCase();
  return EXTERNAL_CHAIN_PREFIXES_V0.some((p) => s.startsWith(p) || s.includes("lab.observation"));
}

/**
 * @param {unknown} entry
 * @returns {boolean}
 */
function isInternalChainEntryV0(entry) {
  const s = String(entry || "").toLowerCase();
  return INTERNAL_CHAIN_PREFIXES_V0.some((p) => s.startsWith(p));
}

/**
 * @param {string} entry
 * @returns {string}
 */
export function hopFamilyKeyV0(entry) {
  const s = String(entry);
  if (s.startsWith("meta.")) return s;
  const dot = s.indexOf(".");
  return dot > 0 ? s.slice(0, dot) : s;
}

/**
 * Collapse consecutive same-family hops (e.g. weather.api + weather.cache → weather.merged).
 * @param {readonly string[]} chain
 * @returns {{ chain: string[], merged: boolean }}
 */
/**
 * Shannon entropy (bits) over hop-family labels — diversity proxy for audit/academic export.
 * @param {readonly string[]} chain
 * @returns {number}
 */
export function computeHopFamilyShannonEntropyV0(chain) {
  const labels = [];
  for (const entry of chain) {
    const s = String(entry);
    if (s.startsWith("meta.provenance_folded")) {
      labels.push("meta.fold_sink");
    } else {
      labels.push(hopFamilyKeyV0(s));
    }
  }
  if (labels.length === 0) return 0;

  const counts = new Map();
  for (const label of labels) {
    counts.set(label, (counts.get(label) || 0) + 1);
  }

  let h = 0;
  const n = labels.length;
  for (const c of counts.values()) {
    const p = c / n;
    h -= p * Math.log2(p);
  }
  return h;
}

/**
 * Relative diversity loss after normalization: (H_before − H_after) / H_before, clamped 0–1.
 * @param {readonly string[]} beforeChain — logical pre-fold chain (raw input)
 * @param {readonly string[]} afterChain — stored source_chain
 * @returns {number}
 */
export function computeProvenanceEntropyDeltaV0(beforeChain, afterChain) {
  const hBefore = computeHopFamilyShannonEntropyV0(beforeChain);
  const hAfter = computeHopFamilyShannonEntropyV0(afterChain);
  if (hBefore <= 1e-9) return 0;
  const delta = (hBefore - hAfter) / hBefore;
  return Math.round(Math.max(0, Math.min(1, delta)) * 100) / 100;
}

export function collapseLowEntropyFamilyRunsV0(chain) {
  const out = [];
  let merged = false;
  for (const entry of chain) {
    const fam = hopFamilyKeyV0(entry);
    const prev = out[out.length - 1];
    if (prev && hopFamilyKeyV0(prev) === fam && !String(prev).startsWith("meta.")) {
      out[out.length - 1] = `${fam}.merged`;
      merged = true;
    } else {
      out.push(entry);
    }
  }
  return { chain: out, merged };
}

/**
 * Dedupe consecutive hops; optional low-entropy merge; cap length with fold marker.
 * @param {readonly string[]} sourceChain
 * @returns {{
 *   chain: readonly string[],
 *   logicalDepth: number,
 *   folded: boolean,
 *   foldReason: ProvenanceFoldReasonV0 | null,
 *   foldCount: number,
 *   entropyDelta: number
 * }}
 */
export function normalizeNarrativeSourceChainV0(sourceChain) {
  const raw = Array.isArray(sourceChain) ? sourceChain.map((x) => String(x).trim()).filter(Boolean) : [];
  const logicalDepth = raw.length;
  if (logicalDepth === 0) {
    return {
      chain: Object.freeze([]),
      logicalDepth: 0,
      folded: false,
      foldReason: null,
      foldCount: 0,
      entropyDelta: 0
    };
  }

  const deduped = [];
  for (const entry of raw) {
    if (deduped[deduped.length - 1] !== entry) deduped.push(entry);
  }
  const hadDedupe = deduped.length < raw.length;

  let working = deduped.slice();
  let foldReason = null;
  let foldCount = 0;

  const entropy = collapseLowEntropyFamilyRunsV0(working);
  if (entropy.merged) {
    working = entropy.chain;
    foldReason = PROVENANCE_FOLD_REASON_V0.LOW_ENTROPY_MERGE;
    foldCount = Math.max(foldCount, deduped.length - working.length);
  }

  if (working.length <= MAX_NARRATIVE_SOURCE_CHAIN_V0) {
    if (!foldReason && hadDedupe) {
      foldReason = PROVENANCE_FOLD_REASON_V0.DEDUPE;
      foldCount = raw.length - working.length;
    }
    const chain = Object.freeze(working);
    return {
      chain,
      logicalDepth,
      folded: foldReason != null,
      foldReason,
      foldCount,
      entropyDelta: computeProvenanceEntropyDeltaV0(raw, chain)
    };
  }

  const head = working.slice(0, 2);
  const tail = working.slice(-5);
  const foldedSegment = working.length - head.length - tail.length;
  const chain = Object.freeze([
    ...head,
    `meta.provenance_folded:${foldedSegment}`,
    ...tail
  ]);
  const dedupeHops = hadDedupe ? raw.length - deduped.length : 0;
  return {
    chain,
    logicalDepth,
    folded: true,
    foldReason: PROVENANCE_FOLD_REASON_V0.LENGTH_LIMIT,
    foldCount: Math.max(foldCount, foldedSegment + dedupeHops, logicalDepth - chain.length),
    entropyDelta: computeProvenanceEntropyDeltaV0(raw, chain)
  };
}

/**
 * @param {readonly string[]} chain
 * @returns {string}
 */
export function pickDominantProvenanceSourceV0(chain) {
  if (!chain.length) return "baseline.no_signal";
  for (let i = chain.length - 1; i >= 0; i--) {
    const s = String(chain[i]);
    if (s.startsWith("meta.")) continue;
    if (s.startsWith("compute") || s.includes("computeViscosity")) return s;
  }
  for (let i = chain.length - 1; i >= 0; i--) {
    const s = String(chain[i]);
    if (s.startsWith("resonance") || s.startsWith("epi_sig")) return s;
  }
  for (let i = chain.length - 1; i >= 0; i--) {
    const s = String(chain[i]);
    if (isExternalChainEntryV0(s)) return s;
  }
  const last = chain[chain.length - 1];
  return String(last).startsWith("meta.") ? "baseline.no_signal" : String(last);
}

/**
 * @param {{ source_chain: readonly string[], trust_class: NarrativeTrustClassV0, derivation_depth: number, folded?: boolean }} input
 * @returns {NarrativeProvenanceSummaryV0}
 */
export function buildProvenanceSummaryV0(input) {
  const { source_chain, trust_class, derivation_depth, folded = false } = input;
  const dominant_source = pickDominantProvenanceSourceV0(source_chain);

  let confidence_shape = NARRATIVE_CONFIDENCE_SHAPE_V0.STABLE;

  if (
    trust_class === NARRATIVE_TRUST_CLASS_V0.BASELINE ||
    derivation_depth <= 1 ||
    dominant_source === "baseline.no_signal"
  ) {
    confidence_shape = NARRATIVE_CONFIDENCE_SHAPE_V0.SPARSE;
  } else if (
    folded ||
    derivation_depth > MAX_NARRATIVE_SOURCE_CHAIN_V0 ||
    trust_class === NARRATIVE_TRUST_CLASS_V0.MIXED ||
    (trust_class === NARRATIVE_TRUST_CLASS_V0.UNTRUSTED_EXTERNAL &&
      !source_chain.some((c) => String(c).startsWith("compute")))
  ) {
    confidence_shape = NARRATIVE_CONFIDENCE_SHAPE_V0.DRIFTING;
  }

  return Object.freeze({
    dominant_source,
    confidence_shape
  });
}

export function inferNarrativeTrustClassV0(sourceChain) {
  const chain = Array.isArray(sourceChain) ? sourceChain.map((x) => String(x).trim()).filter(Boolean) : [];
  if (chain.length === 0) return NARRATIVE_TRUST_CLASS_V0.BASELINE;

  const hasExternal = chain.some(isExternalChainEntryV0);
  const hasInternal = chain.some(isInternalChainEntryV0);
  const onlyBaseline = chain.every((c) => c.includes("baseline") || c.includes("no_signal"));

  if (onlyBaseline && !hasExternal && !hasInternal) return NARRATIVE_TRUST_CLASS_V0.BASELINE;
  if (hasExternal && hasInternal) return NARRATIVE_TRUST_CLASS_V0.MIXED;
  if (hasExternal) return NARRATIVE_TRUST_CLASS_V0.UNTRUSTED_EXTERNAL;
  if (hasInternal) return NARRATIVE_TRUST_CLASS_V0.TRUSTED_INTERNAL;
  return NARRATIVE_TRUST_CLASS_V0.MIXED;
}

/**
 * @param {{ sourceChain: readonly string[], trustClass?: NarrativeTrustClassV0, derivationDepth?: number }} input
 * @returns {NarrativeSourceProvenanceV0}
 */
export function buildNarrativeSourceProvenanceV0(input) {
  const rawChain = Array.isArray(input.sourceChain) ? input.sourceChain : [];
  const { chain: source_chain, logicalDepth, folded, foldReason, foldCount, entropyDelta } =
    normalizeNarrativeSourceChainV0(rawChain);
  const trust_class = input.trustClass || inferNarrativeTrustClassV0(source_chain);
  const derivation_depth =
    Number.isFinite(input.derivationDepth) && input.derivationDepth >= 0
      ? Math.floor(input.derivationDepth)
      : logicalDepth;

  const provenance_summary = buildProvenanceSummaryV0({
    source_chain,
    trust_class,
    derivation_depth,
    folded
  });

  return Object.freeze({
    source_chain,
    trust_class,
    derivation_depth,
    provenance_summary,
    provenance_fold_reason: foldReason,
    provenance_fold_count: foldCount,
    provenance_entropy_delta: entropyDelta
  });
}

/**
 * @param {{ text: string, sourceChain: readonly string[], trustClass?: NarrativeTrustClassV0, derivationDepth?: number, register?: boolean }} input
 * @returns {NarrativeOutputWithProvenanceV0}
 */
export function wrapNarrativeOutputV0(input) {
  const text = String(input.text || "").trim();
  const provenance = buildNarrativeSourceProvenanceV0({
    sourceChain: input.sourceChain,
    trustClass: input.trustClass,
    derivationDepth: input.derivationDepth
  });

  const out = Object.freeze({
    schema: NARRATIVE_SOURCE_PROVENANCE_SCHEMA_V0,
    text,
    provenance,
    emittedAtMs: Date.now()
  });

  if (input.register !== false) {
    registerNarrativeOutputV0(out);
  }
  return out;
}

/**
 * @param {NarrativeOutputWithProvenanceV0} output
 */
export function registerNarrativeOutputV0(output) {
  if (!output?.provenance?.source_chain) return;
  recentNarrativeOutputsV0.push(output);
  while (recentNarrativeOutputsV0.length > MAX_RECENT_NARRATIVE_V0) {
    recentNarrativeOutputsV0.shift();
  }
  if (typeof window !== "undefined") {
    window.__rhizoh_narrative_provenance = {
      recent: recentNarrativeOutputsV0.slice(-16),
      last: output
    };
  }
}

/**
 * @returns {readonly NarrativeOutputWithProvenanceV0[]}
 */
export function listRecentNarrativeOutputsV0() {
  return recentNarrativeOutputsV0.slice();
}

/**
 * @param {unknown} output
 * @returns {boolean}
 */
export function hasValidNarrativeProvenanceV0(output) {
  if (!output || typeof output !== "object") return false;
  const p = /** @type {NarrativeOutputWithProvenanceV0} */ (output).provenance;
  if (!p || !Array.isArray(p.source_chain) || p.source_chain.length === 0) return false;
  if (!p.trust_class || typeof p.derivation_depth !== "number") return false;
  const sum = p.provenance_summary;
  if (!sum || typeof sum.dominant_source !== "string" || !sum.confidence_shape) return false;
  return true;
}

/**
 * @param {readonly NarrativeOutputWithProvenanceV0[]} [outputs]
 * @returns {{ orphanCount: number, ok: boolean }}
 */
export function detectOrphanNarrativeOutputsV0(outputs = recentNarrativeOutputsV0) {
  let orphanCount = 0;
  for (const o of outputs) {
    const hasText = Boolean(String(o?.text || "").trim());
    if (hasText && !hasValidNarrativeProvenanceV0(o)) orphanCount += 1;
    if (hasText && o.provenance?.trust_class === NARRATIVE_TRUST_CLASS_V0.BASELINE && o.provenance.derivation_depth > 0) {
      orphanCount += 1;
    }
  }
  return { orphanCount, ok: orphanCount === 0 };
}

/**
 * Build provenance for Atlas-style density narration from Real + Derived ids.
 * @param {{ labObservation?: boolean, weatherApi?: boolean, computeFnId?: string }} ctx
 * @returns {readonly string[]}
 */
export function buildDefaultDensityNarrativeSourceChainV0(ctx = {}) {
  const chain = [];
  if (ctx.labObservation) chain.push("lab.observation.snapshot");
  if (ctx.weatherApi !== false) chain.push("weather.api");
  if (ctx.trafficApi) chain.push("traffic.api");
  chain.push(ctx.computeFnId || "computeViscosity.v2");
  return Object.freeze(chain);
}
