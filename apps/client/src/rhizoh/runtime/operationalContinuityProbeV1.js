/**
 * Operational Continuity Probe v1 — salt okunur; state / Firestore / RRHP mutasyonu yok.
 *
 * Bu bir **continuity hissi / stale hydrate risk** ölçeridir — IBT kimlik kanıtı veya semantik denklik değildir.
 * `driftClasses` / `primaryDriftClass` yalnızca **gözlemsel sınıflandırma**dır; “aynı Rhizoh restored” iddiası değildir.
 *
 * `confidence` — **tek skaler değil**: katkılar, belirsizlik notları ve (varsa) `aggregate` birlikte okunmalıdır.
 *
 * @see docs/RHIZOH_RCIL_LIVE_WIRING_SPRINT_V1.md (operational gözlem)
 */

import { getRrhpMinimalProjectionSnapshot } from "./rcilRrhpMinimalBridgeV1.js";
import { getRcilContinuityFingerprint, getRcilOperationalOnlyTraceTail } from "./rcilLiveWiringV1.js";

/** @typedef {"fingerprint_divergence" | "tail_partial_only" | "projection_regressed" | "tail_reordered" | "operational_gap" | "non_comparable"} DriftTaxon */

const PRIMARY_PRIORITY = /** @type {const} */ ([
  "projection_regressed",
  "operational_gap",
  "fingerprint_divergence",
  "tail_reordered",
  "tail_partial_only",
  "non_comparable"
]);

/**
 * @param {object} row
 * @returns {string | null}
 */
function traceRowKey(row) {
  if (!row || typeof row !== "object") return null;
  const seq = row.seq ?? row.event?.seq;
  const typ = row.type ?? row.event?.type;
  if (seq == null || typ == null) return null;
  return `${Number(seq)}|${String(typ)}`;
}

/**
 * @param {{ seq?: number, type?: string }} m
 */
function metaKey(m) {
  if (!m || typeof m !== "object") return null;
  if (m.seq == null || m.type == null) return null;
  return `${Number(m.seq)}|${String(m.type)}`;
}

/**
 * `appliedMetaTail` sırası ile canlı operational tail içindeki **son** görünüm indeksleri uyumsuzsa
 * (kısmi örtüşme varken sıra bozulmuş sayılır).
 * @param {unknown[]} meta
 * @param {object[]} liveOpTail
 */
export function detectTailReordered(meta, liveOpTail) {
  if (!Array.isArray(meta) || meta.length < 2 || !Array.isArray(liveOpTail)) return false;
  const liveList = liveOpTail.map(traceRowKey).filter(Boolean);
  let prev = -1;
  for (const m of meta) {
    const k = metaKey(m);
    if (!k) continue;
    const pos = liveList.lastIndexOf(k);
    if (pos < 0) return false;
    if (pos < prev) return true;
    prev = pos;
  }
  return false;
}

/**
 * @param {Set<string>} classes
 * @returns {string | null}
 */
function pickPrimaryDriftClass(classes) {
  for (const p of PRIMARY_PRIORITY) {
    if (classes.has(p)) return p;
  }
  return null;
}

/**
 * Weighted continuity confidence — **aggregate tek başına yeterli değildir**; `contributions` + `uncertaintyNotes` şart.
 * - `non_comparable` **yalnız başına** iken aggregate üretilmez (ceza değil, belirsizlik).
 * - `projection_regressed` **ağır çarpan** (varsayılan 0.22) uygulanır.
 *
 * @param {{
 *   continuity: string,
 *   fingerprintMatch: boolean,
 *   fingerprintComparable: boolean,
 *   operationalTailOverlap: number,
 *   staleRisk: string,
 *   note: string,
 *   driftClasses: string[],
 *   primaryDriftClass: string | null,
 *   restoreMetaLength: number,
 *   overlapRatio: number
 * }} result
 */
export function buildContinuityConfidenceV1(result) {
  const classes = new Set(result.driftClasses || []);
  const onlyNonComparable =
    classes.size === 1 && classes.has("non_comparable") && result.primaryDriftClass === "non_comparable";

  /** @type {{ key: string, value: number | null, nominalWeight: number, used: boolean, rationale?: string }[]} */
  const contributions = [];
  const uncertaintyNotes = [];

  if (result.fingerprintComparable) {
    const v = result.fingerprintMatch ? 1 : 0.12;
    contributions.push({
      key: "fingerprint_operational",
      value: v,
      nominalWeight: 0.35,
      used: true,
      rationale: result.fingerprintMatch ? "operational_fp_match" : "operational_fp_mismatch"
    });
  } else {
    contributions.push({
      key: "fingerprint_operational",
      value: null,
      nominalWeight: 0.35,
      used: false,
      rationale: "fingerprint_not_comparable_no_penalty"
    });
    uncertaintyNotes.push("fingerprint_axis_absent_not_penalized");
  }

  const metaLen = Math.max(0, Math.floor(Number(result.restoreMetaLength)) || 0);
  const ratio = Math.min(1, Math.max(0, Number(result.overlapRatio) || 0));
  if (metaLen > 0) {
    contributions.push({
      key: "operational_tail_overlap",
      value: ratio,
      nominalWeight: 0.3,
      used: true,
      rationale: "overlap_ratio_on_restore_meta"
    });
  } else {
    contributions.push({
      key: "operational_tail_overlap",
      value: null,
      nominalWeight: 0.3,
      used: false,
      rationale: "no_restore_meta_tail"
    });
    if (!result.fingerprintComparable) {
      uncertaintyNotes.push("tail_axis_absent_meta_empty");
    }
  }

  const cval = result.continuity === "stable" ? 1 : result.continuity === "unknown" ? 0.55 : 0.15;
  contributions.push({
    key: "continuity_label",
    value: cval,
    nominalWeight: 0.2,
    used: true,
    rationale: `continuity_${result.continuity}`
  });

  const sval = result.staleRisk === "low" ? 1 : result.staleRisk === "medium" ? 0.52 : 0.22;
  contributions.push({
    key: "stale_risk_inverse",
    value: sval,
    nominalWeight: 0.15,
    used: true,
    rationale: `stale_${result.staleRisk}`
  });

  let denom = 0;
  let numer = 0;
  for (const c of contributions) {
    if (c.used && c.value != null) {
      denom += c.nominalWeight;
      numer += c.value * c.nominalWeight;
    }
  }

  let aggregate = denom > 0 ? numer / denom : null;

  /** `non_comparable` yalnız — skor üretme (0’a çekme değil: belirsizlik). */
  if (onlyNonComparable) {
    aggregate = null;
    uncertaintyNotes.push("non_comparable_only_aggregate_withheld_not_penalty");
  }

  let regressionPenaltyApplied = false;
  let regressionMultiplier = 1;
  if (classes.has("projection_regressed")) {
    regressionPenaltyApplied = true;
    regressionMultiplier = 0.22;
    if (aggregate != null) aggregate *= regressionMultiplier;
    uncertaintyNotes.push("projection_regressed_heavy_penalty_applied");
  }

  let operationalGapMultiplier = 1;
  if (classes.has("operational_gap") && aggregate != null) {
    operationalGapMultiplier = 0.55;
    aggregate *= operationalGapMultiplier;
  }

  let fingerprintDivMultiplier = 1;
  if (classes.has("fingerprint_divergence") && aggregate != null) {
    fingerprintDivMultiplier = 0.72;
    aggregate *= fingerprintDivMultiplier;
  }

  let tailReorderMultiplier = 1;
  if (classes.has("tail_reordered") && aggregate != null) {
    tailReorderMultiplier = 0.78;
    aggregate *= tailReorderMultiplier;
  }

  let tailPartialMultiplier = 1;
  if (classes.has("tail_partial_only") && aggregate != null) {
    tailPartialMultiplier = 0.88;
    aggregate *= tailPartialMultiplier;
  }

  if (aggregate != null && aggregate > 1) aggregate = 1;

  let band = "unknown";
  if (aggregate == null) band = "unknown";
  else if (aggregate >= 0.72) band = "high";
  else if (aggregate >= 0.48) band = "medium";
  else if (aggregate >= 0.28) band = "low";
  else band = "low";

  return {
    aggregate,
    band,
    contributions,
    uncertaintyNotes,
    regressionPenaltyApplied,
    multipliers: {
      projection_regressed: regressionPenaltyApplied ? regressionMultiplier : null,
      operational_gap: classes.has("operational_gap") ? operationalGapMultiplier : null,
      fingerprint_divergence: classes.has("fingerprint_divergence") ? fingerprintDivMultiplier : null,
      tail_reordered: classes.has("tail_reordered") ? tailReorderMultiplier : null,
      tail_partial_only: classes.has("tail_partial_only") ? tailPartialMultiplier : null
    }
  };
}

/**
 * @param {object} partial
 */
function finalizeProbeResult(partial) {
  const metaLen = Math.max(0, Math.floor(Number(partial.restoreMetaLength)) || 0);
  const ratio = metaLen > 0 ? partial.operationalTailOverlap / metaLen : 0;
  const out = {
    ...partial,
    restoreMetaLength: metaLen,
    overlapRatio: ratio
  };
  out.confidence = buildContinuityConfidenceV1(out);
  return out;
}

/**
 * @param {{
 *   restoredSlice: {
 *     operationalReconcileTotal?: unknown,
 *     lastAppliedSeq?: unknown,
 *     appliedKeysTail?: unknown,
 *     appliedMetaTail?: unknown
 *   },
 *   fingerprintAtRestoreOperationalOnly?: string | null
 * }} input
 */
export function runOperationalContinuityProbeV1(input) {
  const slice = input?.restoredSlice && typeof input.restoredSlice === "object" ? input.restoredSlice : null;
  const liveFpOp = getRcilContinuityFingerprint({ semantics: "operational_only" });
  const liveOpTail = getRcilOperationalOnlyTraceTail(64);
  const liveProj = getRrhpMinimalProjectionSnapshot();

  const restoredAtRestore = input?.fingerprintAtRestoreOperationalOnly;
  const fingerprintComparable = typeof restoredAtRestore === "string" && restoredAtRestore.length > 0;
  const fingerprintMatch = fingerprintComparable ? restoredAtRestore === liveFpOp : false;

  const meta = Array.isArray(slice?.appliedMetaTail) ? slice.appliedMetaTail : [];
  const liveKeys = new Set(liveOpTail.map(traceRowKey).filter(Boolean));
  let operationalTailOverlap = 0;
  for (const m of meta) {
    const k = metaKey(m);
    if (k && liveKeys.has(k)) operationalTailOverlap += 1;
  }

  const restoredTotal = Math.max(0, Math.floor(Number(slice?.operationalReconcileTotal)) || 0);
  const liveTotal = Number(liveProj?.operationalReconcileTotal) || 0;
  const projectionDelta = liveTotal - restoredTotal;
  const metaLen = meta.length;

  /** @type {Set<string>} */
  const driftClasses = new Set();

  if (!slice) {
    driftClasses.add("non_comparable");
    return finalizeProbeResult({
      continuity: "unknown",
      fingerprintMatch: false,
      fingerprintComparable: false,
      operationalTailOverlap: 0,
      staleRisk: "high",
      note: "missing_restored_slice",
      driftClasses: [...driftClasses],
      primaryDriftClass: pickPrimaryDriftClass(driftClasses),
      restoreMetaLength: 0
    });
  }

  if (projectionDelta < 0) driftClasses.add("projection_regressed");
  if (restoredTotal > liveTotal) driftClasses.add("operational_gap");
  if (fingerprintComparable && !fingerprintMatch) driftClasses.add("fingerprint_divergence");
  if (metaLen >= 2 && detectTailReordered(meta, liveOpTail) && operationalTailOverlap > 0) {
    driftClasses.add("tail_reordered");
  }
  if (!fingerprintComparable && metaLen > 0 && operationalTailOverlap / metaLen > 0 && operationalTailOverlap / metaLen < 0.6 && projectionDelta >= 0) {
    driftClasses.add("tail_partial_only");
  }
  if (!fingerprintComparable && metaLen === 0) {
    driftClasses.add("non_comparable");
  }

  const ratio = metaLen > 0 ? operationalTailOverlap / metaLen : 0;

  let continuity = "unknown";
  let staleRisk = "medium";
  let note = "insufficient_signals";

  if (fingerprintComparable) {
    if (fingerprintMatch) {
      continuity = "stable";
      staleRisk = "low";
      note = "fingerprint_match";
    } else {
      continuity = "drift";
      staleRisk = operationalTailOverlap === 0 ? "high" : "medium";
      note = "fingerprint_mismatch";
    }
  } else {
    if (metaLen === 0) {
      continuity = "unknown";
      staleRisk = projectionDelta < 0 ? "high" : "medium";
      note = "no_restore_meta_no_fingerprint";
    } else {
      if (ratio >= 0.6 && projectionDelta >= 0) {
        continuity = "stable";
        staleRisk = "low";
        note = "tail_overlap_projection_ok";
      } else if (ratio >= 0.3) {
        continuity = "unknown";
        staleRisk = "medium";
        note = "partial_tail_overlap";
      } else {
        continuity = "drift";
        staleRisk = "high";
        note = "low_tail_overlap_possible_stale";
      }
      if (projectionDelta < 0) {
        continuity = "drift";
        staleRisk = "high";
        note = "projection_regressed_vs_slice";
      }
    }
  }

  const primary = pickPrimaryDriftClass(driftClasses);

  return finalizeProbeResult({
    continuity,
    fingerprintMatch,
    fingerprintComparable,
    operationalTailOverlap,
    staleRisk,
    note,
    driftClasses: [...driftClasses],
    primaryDriftClass: driftClasses.size > 0 ? primary : null,
    restoreMetaLength: metaLen
  });
}
