/**
 * Rhizoh Knowledge Gateway v0 — queryable habitat knowledge (not founder wiki).
 * User Question → Authority → Meaning → Narrative → Answer
 * Observer trace is NEVER exposed raw to queriers.
 * @see docs/RHIZOH_KNOWLEDGE_GATEWAY_V0.md
 */

import { lookupPinSemanticV0, normalizePinTargetIdV0 } from "./epistemicPinSemanticRegistryV0.js";
import { getMeaningResonanceLedgerSnapshotV0 } from "./meaningResonanceLedgerV0.js";
import { getAttentionSedimentSnapshotV0 } from "./attentionSedimentationBufferV0.js";
import { getBehaviorSedimentSnapshotV0 } from "./behaviorSedimentBufferV0.js";
import { resolveNarrativeFromObserverTraceV0 } from "./narrativeProjectionEngineV0.js";
import { coupleCrossTowerBiasV0 } from "./crossTowerBiasCouplerV0.js";
import { buildEpistemicSeparationProofV0 } from "./epistemicSeparationProofV0.js";
import { getObserverTraceSnapshotV0 } from "./observerReadOnlyHookV0.js";
import { runEpistemicConsumeOnlyPassV0 } from "./epistemicInvocationGuardV0.js";
import {
  isSignificanceQueryV0,
  resolveMeaningResonanceSignificanceV0,
  FOUR_TOWER_STATUS_V0
} from "./meaningResonanceSignificanceV0.js";

export const KNOWLEDGE_GATEWAY_SCHEMA_V0 = "castle.rhizoh.knowledge_gateway.v0";
export const KNOWLEDGE_ANSWER_SCHEMA_V0 = "castle.rhizoh.knowledge_answer.v0";

export const KNOWLEDGE_LAYER_AUTHORITY_V0 = Object.freeze({
  AUTHORITY_LEDGER: Object.freeze({ rank: 1, label: "authority", userFacing: true }),
  BEHAVIOR_SEDIMENT: Object.freeze({ rank: 2, label: "behavior", userFacing: true }),
  MEANING_LEDGER: Object.freeze({ rank: 3, label: "interpretation", userFacing: true }),
  NARRATIVE: Object.freeze({ rank: 4, label: "narration", userFacing: true }),
  OBSERVER_TRACE: Object.freeze({ rank: 0, label: "raw_trace", userFacing: false })
});

const ENTITY_QUERY_ALIASES_V0 = Object.freeze([
  { pattern: /\bwprl\b|sports\s*arena|spor\s*aren/i, entityId: "wprl_sports_arena" },
  { pattern: /\bserencebey\b|origin\s*home/i, entityId: "origin_home_serencebey" },
  { pattern: /\bchess\b|satranç/i, entityId: "chess_arena" },
  { pattern: /\bghost\b/i, entityId: "ghost" },
  { pattern: /\bgemini\b/i, entityId: "gemini_tower" }
]);

function readAuthorityLayerV0() {
  if (typeof window === "undefined") return null;
  try {
    const fn = window.__rhizoh?.authorityLedger;
    if (typeof fn !== "function") return null;
    const snap = fn();
    return snap
      ? Object.freeze({
          layer: KNOWLEDGE_LAYER_AUTHORITY_V0.AUTHORITY_LEDGER.label,
          authorityRank: KNOWLEDGE_LAYER_AUTHORITY_V0.AUTHORITY_LEDGER.rank,
          ledgerHeight: snap.ledgerHeight ?? 0,
          sealPresent: Boolean(snap.diagnosis?.sealPresent),
          realityMutationAutoPath: snap.diagnosis?.realityMutationAutoPath === true,
          interpretationOnly: snap.interpretationOnly === true,
          nonExecutive: snap.nonExecutive === true
        })
      : null;
  } catch {
    return null;
  }
}

/**
 * @param {string} question
 * @param {string} [explicitId]
 */
export function resolveKnowledgeEntityIdV0(question, explicitId) {
  const explicit = normalizePinTargetIdV0(explicitId || "");
  if (explicit) return explicit;
  const q = String(question || "").toLowerCase();
  for (const row of ENTITY_QUERY_ALIASES_V0) {
    if (row.pattern.test(q)) return row.entityId;
  }
  const pinMatch = q.match(/\bpin[_\s]?(\w+)/i);
  if (pinMatch) return normalizePinTargetIdV0(pinMatch[1]);
  return "";
}

/**
 * @param {object} meaningLedger
 * @param {string} entityId
 */
function computeMeaningResonanceLevelV0(meaningLedger, entityId) {
  const records = meaningLedger?.records || [];
  if (!records.length) return "none";
  const hits = records.filter((r) => {
    const mapT = r.coOccurrence?.mapSignal?.target || "";
    const chessT = r.coOccurrence?.chessSignal?.target || "";
    return mapT.includes(entityId) || chessT.includes(entityId) || entityId.includes(mapT);
  });
  if (!hits.length) return records.length > 2 ? "low" : "none";
  const avg = hits.reduce((a, r) => a + (r.epistemicWeight || 0), 0) / hits.length;
  if (avg >= 0.25) return "medium";
  if (avg >= 0.12) return "low";
  return "trace";
}

/**
 * @param {{ entityId: string, semantic: object, locale: string, meaningResonance: string, coupled: object, sediment: object }} ctx
 */
function buildKnowledgeAnswerTextV0(ctx) {
  const tr = ctx.locale === "tr";
  const title = ctx.semantic?.title || ctx.entityId || "—";

  if (tr) {
    return [
      `${title}, Rhizoh habitatındaki bir gözlem düğümüdür.`,
      "",
      "Bu düğüm:",
      "• canlı spor/oyun olaylarını izler,",
      "• oyun alanlarını haritaya projekte eder,",
      "• gözlem yoğunluğu verilerini toplar,",
      "• anlam katmanına zayıf semantik sinyaller gönderir.",
      "",
      `Anlam rezonansı: ${ctx.meaningResonance}.`,
      ctx.sediment.stratumCount > 0
        ? `Dikkat sedimenti: ${ctx.sediment.stratumCount} katman (habitat bias — hakikati değiştirmez).`
        : "Dikkat sedimenti henüz birikmedi.",
      "",
      "Bu cevap kurucu wiki değil — habitat kayıtlarından üretilmiştir."
    ].join("\n");
  }

  return [
    `${title} is an observation node in the Rhizoh habitat.`,
    "",
    "This node:",
    "• monitors live sport/game events,",
    "• projects play surfaces onto the map,",
    "• collects observation-density signals,",
    "• emits weak semantic signals to the meaning layer.",
    "",
    `Meaning resonance: ${ctx.meaningResonance}.`,
    ctx.sediment.stratumCount > 0
      ? `Attention sediment: ${ctx.sediment.stratumCount} strata (habitat bias — does not alter truth).`
      : "Attention sediment not yet accumulated.",
    "",
    "This answer is not a founder wiki — it is assembled from habitat records."
  ].join("\n");
}

/**
 * @param {{ question?: string, entityId?: string, locale?: string }} [opts]
 */
export function askRhizohKnowledgeGatewayV0(opts = {}) {
  const locale = opts.locale ?? "en";
  const question = String(opts.question || "").trim();
  const entityId = resolveKnowledgeEntityIdV0(question, opts.entityId);
  const semantic = entityId ? lookupPinSemanticV0(entityId, { locale }) : null;
  const queryMode =
    opts.queryMode === "significance" || isSignificanceQueryV0(question) ? "significance" : "definition";

  return runEpistemicConsumeOnlyPassV0(() => {
    const authority = readAuthorityLayerV0();
    const behaviorSediment = getBehaviorSedimentSnapshotV0();
    const meaningLedger = getMeaningResonanceLedgerSnapshotV0();
    const sediment = getAttentionSedimentSnapshotV0();
    const narrative = resolveNarrativeFromObserverTraceV0({ locale, behavioralInfluence: true });
    const coupled = coupleCrossTowerBiasV0({ locale, sediment });
    const separation = buildEpistemicSeparationProofV0({ locale });
    const traceCount = getObserverTraceSnapshotV0()?.count ?? 0;

    const meaningResonance = computeMeaningResonanceLevelV0(meaningLedger, entityId);
    const authorityStatus = semantic?.grounded !== false && entityId ? "verified_node" : "unregistered";

    const significance =
      entityId && queryMode === "significance"
        ? resolveMeaningResonanceSignificanceV0({
            entityId,
            locale,
            sediment,
            behaviorSediment,
            meaningLedger
          })
        : null;

    const answerText = entityId
      ? queryMode === "significance" && significance
        ? [
            `Authority: ${significance.significance.authority}`,
            `Meaning: ${significance.significance.meaning}`,
            `Narrative: ${significance.significance.narrative}`,
            "",
            locale === "tr"
              ? "Bu öğrenme değil — gözlenen davranışın açıklanmasıdır."
              : "This is not learning — it is an explanation of observed behavior."
          ].join("\n")
        : buildKnowledgeAnswerTextV0({
            entityId,
            semantic,
            locale,
            meaningResonance,
            coupled,
            sediment
          })
      : locale === "tr"
        ? "Varlık tanımlanamadı. entityId veya daha net bir soru verin (ör. WPRL Sports Arena)."
        : "Entity not resolved. Provide entityId or a clearer question (e.g. WPRL Sports Arena).";

    return Object.freeze({
      schema: KNOWLEDGE_ANSWER_SCHEMA_V0,
      gateway: KNOWLEDGE_GATEWAY_SCHEMA_V0,
      queriedAtMs: Date.now(),
      question: question || null,
      entityId: entityId || null,
      queryMode,
      towers: FOUR_TOWER_STATUS_V0,
      significance,
      answer: Object.freeze({
        text: answerText,
        authorityStatus,
        narrativeStatus: narrative.entityCount > 0 ? "active" : "sparse",
        meaningResonance,
        significanceScore: significance?.significanceScore ?? null,
        explainsObservedBehavior: significance?.explainsObservedBehavior === true,
        habitatBiasOnly: true,
        badBiasBlocked: true
      }),
      layers: Object.freeze({
        authority: authority || Object.freeze({
          layer: KNOWLEDGE_LAYER_AUTHORITY_V0.AUTHORITY_LEDGER.label,
          authorityRank: 1,
          available: false,
          note: "authority ledger not mounted"
        }),
        meaning: Object.freeze({
          layer: KNOWLEDGE_LAYER_AUTHORITY_V0.MEANING_LEDGER.label,
          authorityRank: KNOWLEDGE_LAYER_AUTHORITY_V0.MEANING_LEDGER.rank,
          recordCount: meaningLedger.count ?? 0,
          tower: FOUR_TOWER_STATUS_V0.MEANING_RESONANCE.role,
          interpretationOnly: true,
          learns: false,
          explainsObservedBehavior: significance?.explainsObservedBehavior === true
        }),
        behavior: Object.freeze({
          layer: KNOWLEDGE_LAYER_AUTHORITY_V0.BEHAVIOR_SEDIMENT.label,
          authorityRank: KNOWLEDGE_LAYER_AUTHORITY_V0.BEHAVIOR_SEDIMENT.rank,
          entityCount: behaviorSediment.entityCount ?? 0,
          tower: FOUR_TOWER_STATUS_V0.BEHAVIOR.role,
          behaviorBias: true,
          truthBias: false,
          interpretationOnly: true,
          learns: false
        }),
        narrative: Object.freeze({
          layer: KNOWLEDGE_LAYER_AUTHORITY_V0.NARRATIVE.label,
          authorityRank: KNOWLEDGE_LAYER_AUTHORITY_V0.NARRATIVE.rank,
          entityCount: narrative.entityCount,
          influencesSelection: narrative.temporalSediment?.influencesSelection === true,
          interpretationOnly: true,
          primaryFocus: narrative.primaryFocus?.entityId ?? null
        }),
        observerTrace: Object.freeze({
          exposed: false,
          userFacing: false,
          aggregatedCountOnly: traceCount
        })
      }),
      coupling: Object.freeze({
        meaningStability: coupled.meaningStability ?? 0,
        couplingStrength: coupled.couplingStrength ?? 0,
        biasNotLearning: coupled.biasNotLearning === true,
        behaviorBias: coupled.behaviorBias === true,
        truthBias: coupled.truthBias === false
      }),
      separationHolds: separation.separationHolds === true,
      queriableByExternalLlm: true,
      provenance: Object.freeze([
        "authority_ledger_read_only",
        "behavior_sediment_plane_e",
        "meaning_resonance_significance",
        "meaning_ledger_interpretation",
        "narrative_renderer",
        "attention_sediment_bias_not_truth"
      ]),
      interpretationOnly: true
    });
  }, 0);
}

export function exportKnowledgeAnswerJsonV0(opts = {}) {
  return JSON.stringify(askRhizohKnowledgeGatewayV0(opts), null, 2);
}

export function mountRhizohKnowledgeGatewayConsoleV0() {
  if (typeof window === "undefined") return;
  window.__rhizoh = window.__rhizoh || {};
  window.__rhizoh.knowledgeGateway = Object.freeze({
    ask: askRhizohKnowledgeGatewayV0,
    askWhy: (opts = {}) => askRhizohKnowledgeGatewayV0({ ...opts, queryMode: "significance" }),
    resolveEntity: resolveKnowledgeEntityIdV0,
    exportJson: exportKnowledgeAnswerJsonV0,
    layerAuthority: KNOWLEDGE_LAYER_AUTHORITY_V0,
    towers: FOUR_TOWER_STATUS_V0
  });
}
