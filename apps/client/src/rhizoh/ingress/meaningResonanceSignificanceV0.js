/**
 * Meaning Resonance Significance v0 — "why is it important?" (fourth tower).
 * Explains observed return patterns · NOT learning · NOT truth mutation.
 * @see docs/RHIZOH_MEANING_RESONANCE_SIGNIFICANCE_V0.md
 */

import { getAttentionSedimentSnapshotV0 } from "./attentionSedimentationBufferV0.js";
import { getMeaningResonanceLedgerSnapshotV0 } from "./meaningResonanceLedgerV0.js";
import { lookupPinSemanticV0 } from "./epistemicPinSemanticRegistryV0.js";
import { coupleCrossTowerBiasV0 } from "./crossTowerBiasCouplerV0.js";
import { buildMapAttentionWeightsV0 } from "./behavioralInfluenceLayerV0.js";
import { OBSERVER_PLANE_V0, OBSERVER_TRACE_EXCLUDED_SINKS_V0 } from "./observerReadOnlyHookV0.js";

export const MEANING_RESONANCE_SIGNIFICANCE_SCHEMA_V0 =
  "castle.rhizoh.meaning_resonance_significance.v0";

export const FOUR_TOWER_STATUS_V0 = Object.freeze({
  CHESS: Object.freeze({ id: "chess", strength: "very_strong", role: "truth_anchor" }),
  MAP: Object.freeze({ id: "map", strength: "strong", role: "attention_field" }),
  NARRATIVE: Object.freeze({ id: "narrative", strength: "working", role: "meaning_renderer" }),
  MEANING_RESONANCE: Object.freeze({ id: "meaning_resonance", strength: "emerging", role: "significance_explainer" })
});

/**
 * @param {string} entityId
 * @param {readonly object[]} strata
 */
function findEntityStratumV0(entityId, strata) {
  const id = String(entityId || "").toLowerCase();
  return (
    strata.find((s) => {
      const key = String(s.key || "").toLowerCase();
      const target = key.split(":")[1] || key;
      return key.includes(id) || id.includes(target) || target.includes(id);
    }) || null
  );
}

/**
 * @param {string} entityId
 * @param {object} meaningLedger
 */
function countMeaningHitsV0(entityId, meaningLedger) {
  const records = meaningLedger?.records || [];
  return records.filter((r) => {
    const mapT = String(r.coOccurrence?.mapSignal?.target || "");
    const chessT = String(r.coOccurrence?.chessSignal?.target || "");
    return mapT.includes(entityId) || chessT.includes(entityId) || entityId.includes(mapT);
  }).length;
}

/**
 * @param {{ entityId: string, locale?: string, sediment?: object, meaningLedger?: object }} [opts]
 */
export function resolveMeaningResonanceSignificanceV0(opts = {}) {
  const locale = opts.locale ?? "en";
  const tr = locale === "tr";
  const entityId = String(opts.entityId || "");
  const sediment = opts.sediment ?? getAttentionSedimentSnapshotV0();
  const meaningLedger = opts.meaningLedger ?? getMeaningResonanceLedgerSnapshotV0();
  const semantic = entityId ? lookupPinSemanticV0(entityId, { locale }) : null;
  const strata = sediment?.strata || [];
  const stratum = findEntityStratumV0(entityId, strata);
  const coupled = coupleCrossTowerBiasV0({ locale, sediment });
  const mapWeights = buildMapAttentionWeightsV0({ sediment });
  const mapPin = mapWeights.pins?.find((p) => entityId.includes(p.target) || p.target.includes(entityId));

  const repeatReturn = (stratum?.frequency ?? 0) >= 2;
  const temporalSpan = (stratum?.temporalSpanMs ?? 0) > 0;
  const meaningHits = countMeaningHitsV0(entityId, meaningLedger);
  const significanceScore = Math.round(
    Math.min(
      1,
      (repeatReturn ? 0.35 : 0) +
        (temporalSpan ? 0.2 : 0) +
        Math.min(0.25, (stratum?.frequency ?? 0) / 8) +
        Math.min(0.15, meaningHits / 5) +
        (coupled.couplingStrength ?? 0) * 0.15
    ) * 1000
  ) / 1000;

  const title = semantic?.title || entityId || "—";

  const authorityLine = tr
    ? `${title} habitat kayıtlarında doğrulanmış bir düğüm olarak mevcuttur.`
    : `${title} exists as a verified node in habitat records.`;

  let meaningLine;
  if (repeatReturn && temporalSpan) {
    meaningLine = tr
      ? `Gözlemciler bu arenaya zaman içinde tekrar tekrar dönmüştür (${stratum.frequency}×, ${Math.round((stratum.temporalSpanMs || 0) / 60000)} dk aralık).`
      : `Observers repeatedly return to this arena over time (${stratum.frequency}×, ~${Math.round((stratum.temporalSpanMs || 0) / 60000)} min span).`;
  } else if (repeatReturn) {
    meaningLine = tr
      ? `Gözlemciler bu düğüme tekrar eden dikkat göstermiştir (${stratum.frequency}×).`
      : `Observers show repeated attention to this node (${stratum.frequency}×).`;
  } else if (meaningHits > 0) {
    meaningLine = tr
      ? `Anlam defterinde zayıf eş-oluşum izleri kayıtlı (${meaningHits} kayıt).`
      : `Weak co-occurrence traces recorded in the meaning ledger (${meaningHits} records).`;
  } else {
    meaningLine = tr
      ? "Henüz tekrar eden dönüş paterni gözlenmedi — önem iddiası üretilmez."
      : "No repeating return pattern observed yet — no importance claim is produced.";
  }

  let narrativeLine;
  if (significanceScore >= 0.35) {
    narrativeLine = tr
      ? "Bu arena, tekrar eden bir dikkat çıpası olarak işlev görüyor gibi görünür (yorum — hakikat iddiası değil)."
      : "This arena appears to function as a recurring attention anchor (interpretation — not a truth claim).";
  } else if (significanceScore > 0) {
    narrativeLine = tr
      ? "Erken dikkat sinyalleri var; henüz güçlü bir önem paterni oluşmadı."
      : "Early attention signals present; no strong importance pattern yet.";
  } else {
    narrativeLine = tr
      ? "Önem açıklaması için yeterli sediment birikmedi."
      : "Insufficient sediment accumulated for an importance explanation.";
  }

  return Object.freeze({
    schema: MEANING_RESONANCE_SIGNIFICANCE_SCHEMA_V0,
    plane: OBSERVER_PLANE_V0.MEANING_LEDGER,
    entityId,
    queryMode: "significance",
    significanceScore,
    towers: FOUR_TOWER_STATUS_V0,
    significance: Object.freeze({
      authority: authorityLine,
      meaning: meaningLine,
      narrative: narrativeLine
    }),
    evidence: Object.freeze({
      sedimentFrequency: stratum?.frequency ?? 0,
      temporalSpanMs: stratum?.temporalSpanMs ?? 0,
      meaningLedgerHits: meaningHits,
      mapVisibilityWeight: mapPin?.visibilityWeight ?? 1,
      couplingStrength: coupled.couplingStrength ?? 0,
      meaningStability: coupled.meaningStability ?? 0
    }),
    isLearning: false,
    explainsObservedBehavior: true,
    influencesCausalGraph: false,
    influencesIdentity: false,
    habitatBiasOnly: true,
    excludedFrom: OBSERVER_TRACE_EXCLUDED_SINKS_V0,
    interpretationOnly: true
  });
}

/**
 * @param {string} question
 */
export function isSignificanceQueryV0(question) {
  return /\b(why|neden|önemli|important|significance|matter|matters)\b/i.test(String(question || ""));
}

export function mountMeaningResonanceSignificanceConsoleV0() {
  if (typeof window === "undefined") return;
  window.__rhizoh = window.__rhizoh || {};
  window.__rhizoh.meaningResonanceSignificance = Object.freeze({
    resolve: resolveMeaningResonanceSignificanceV0,
    isSignificanceQuery: isSignificanceQueryV0,
    towers: FOUR_TOWER_STATUS_V0
  });
}
