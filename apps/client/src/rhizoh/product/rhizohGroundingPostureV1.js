/**
 * Sistem “grounding” duruşu — değişmeyen mimari sınır (observability/diagnostic vs truth-grounded learning).
 * Alignment ölçer; bağımsız referans sistemi (truth layer) ayrıdır.
 */

import { getRhizohGroundTruthBridgeMvpHintSync } from "./rhizohGroundTruthBridgeV1.js";

export const RHIZOH_GROUNDING_POSTURE_VERSION = "1.0.0";

/** Katman → şu anki güven seviyesi (ürün gerçeği; stub değil iddia). */
export const RHIZOH_GROUNDING_LAYER_TABLE = Object.freeze([
  { layer: "behavior_truth", state: "implemented", note: "Davranış rollup + sinyaller" },
  { layer: "decision_truth", state: "implemented", note: "Karar / policy yüzeyi" },
  { layer: "external_truth", state: "partial_stub", note: "Gateway stub + istemci hizası; bağımsız outcome yok" },
  { layer: "population_truth", state: "partial_fallback", note: "Kohort = yönlendirme + anahtar; istatistiksel grup / embedding yok" }
]);

/** İki mod: şu an A, hedef B. */
export const RHIZOH_GROUNDING_MODES = Object.freeze({
  current:
    "Mode A — sistemin gördüğünü ve açıkladığını ölçer (self-observing + diagnostics); iç referanslı kapalı ölçüm.",
  needed:
    "Mode B — sistem dışı label ile ‘ne doğruydu?’yu yeniden hesaplar; gecikmiş outcome ile kararı backdate eder."
});

/** Üç teknik blok (henüz kapanmamış gap). */
export const RHIZOH_GROUNDING_OPEN_GAPS = Object.freeze({
  externalOutcomeIngestion: {
    id: "external_outcome_ingestion",
    summary:
      "Bağımsız olay kaynağı + sistem dışı etiket (success/fail/neutral, timestamp, session link). Olmadan her şey self-described truth.",
    status: "open"
  },
  cohortAsStatisticalGroup: {
    id: "cohort_statistical_group",
    summary:
      "Şu an cohort ≈ tanımlayıcı çözümleme; eksik: population embedding, cross-user normalization, cohort drift izleme.",
    status: "open"
  },
  temporalAlignment: {
    id: "temporal_alignment",
    summary:
      "timeAxisBiasRisk ölçülür; eksik: delayed outcome replay, backdated policy correction, historical decision reweighting.",
    status: "open"
  }
});

export const RHIZOH_ALIGNMENT_VS_TRUTH = Object.freeze({
  alignment: "Mesafe / tutarsızlık ölçümü (diagnostic).",
  truth: "Bağımsız referans sistemi (system-external labels).",
  warning: "Alignment layer ≠ truth layer; ikisi farklı şeyler."
});

/** Minimal “bir üst seviye” pipeline (feature listesi değil, hedef sıra). */
export const RHIZOH_GROUNDING_MVP_CLOSURE_LOOP = Object.freeze([
  "External outcome event (success | fail | neutral, ts, session/decision link)",
  "Sunucu tarafı agregasyon (cohort bucket, outcome rate)",
  "Decision replay hook: bu karar gerçek outcome’a göre yanlış mıydı?"
]);

export const RHIZOH_GROUNDING_POSITIONING_ONE_LINER = Object.freeze({
  current:
    "İleri düzey, kendini gözlemleyen uyarlanabilir ürün zekâsı; kısmi dış grounding sinyalleri; henüz truth-grounded learning değil.",
  closureTarget: "Temporal + cohort + external closure loop — kararların geçmiş gerçekliğe göre yeniden ağırlıklandırılması."
});

/**
 * Panel / dokümantasyon / UI için tek nesne.
 * @param {number} [nowMs]
 */
export function getRhizohGroundingPostureSnapshot(nowMs = Date.now()) {
  const now = Number(nowMs) || Date.now();
  const bridgeHint = getRhizohGroundTruthBridgeMvpHintSync();
  const grounded = Boolean(bridgeHint.groundedLearningMode);

  const layerTable = grounded
    ? RHIZOH_GROUNDING_LAYER_TABLE.map((row) => {
        if (row.layer === "external_truth") {
          return {
            ...row,
            state: "mvp_bridge",
            note: "Gateway outcome ingest + cohort aggregate (MVP); kalıcı store sonraki adım."
          };
        }
        if (row.layer === "population_truth") {
          return {
            ...row,
            state: "mvp_aggregate",
            note: "Kohort bazlı outcomeRate/sampleN özetı (tek kullanıcı ≠ gerçeklik); embedding yok."
          };
        }
        return row;
      })
    : RHIZOH_GROUNDING_LAYER_TABLE;

  const modes = grounded
    ? Object.freeze({
        current: String(RHIZOH_GROUNDING_MODES.needed),
        needed:
          "Kalıcı nüfus mağazası (Firestore/BigQuery/Postgres) + çok-kaynak outcome birleştirme + denetim zinciri."
      })
    : RHIZOH_GROUNDING_MODES;

  const openGaps = grounded
    ? Object.freeze({
        ...RHIZOH_GROUNDING_OPEN_GAPS,
        externalOutcomeIngestion: {
          ...RHIZOH_GROUNDING_OPEN_GAPS.externalOutcomeIngestion,
          status: "mvp_live",
          summary:
            "Gateway POST /rhizoh/product/outcome + aggregate GET — sistem dışı etiket MVP; üretimde async persist önerilir."
        },
        temporalAlignment: {
          ...RHIZOH_GROUNDING_OPEN_GAPS.temporalAlignment,
          status: "partial_replay_hook",
          summary:
            "runRhizohRetrospectiveReplayHook: gecikmiş nüfus outcome ile supporting kararlara karşı contrary rollback."
        }
      })
    : RHIZOH_GROUNDING_OPEN_GAPS;

  const fundamentalTruth = grounded
    ? "Ground Truth Bridge MVP açık: dış outcome özetı + retrospective replay ile kısmi Mode B (grounded learning); kalıcı kohort store henüz yok."
    : "Sistem hâlâ iç referanslı: davranış ve karar düzlemi güçlü; population ve dış outcome bağımsız referans değil.";

  const positioning = grounded
    ? Object.freeze({
        current:
          "Dış etiket özetı ve replay düzeltmesi devrede; tanısal iç öğrenmeyi nüfus gerçekliği ile sınırlı şekilde düzeltir.",
        closureTarget: String(RHIZOH_GROUNDING_POSITIONING_ONE_LINER.closureTarget)
      })
    : RHIZOH_GROUNDING_POSITIONING_ONE_LINER;
  const populationTruth = grounded
    ? {
        mode: "embedded_cohort",
        confidence01:
          bridgeHint.cohortConfidence01 != null
            ? Number(bridgeHint.cohortConfidence01)
            : 0.5
      }
    : {
        mode: "bucket_fallback",
        confidence01: null
      };

  return {
    schemaVersion: "1.0.0",
    postureVersion: RHIZOH_GROUNDING_POSTURE_VERSION,
    ts: now,
    fundamentalTruth,
    layerTable,
    modes,
    openGaps,
    alignmentVsTruth: RHIZOH_ALIGNMENT_VS_TRUTH,
    mvpClosureLoop: RHIZOH_GROUNDING_MVP_CLOSURE_LOOP,
    positioning,
    populationTruth,
    groundTruthBridge: bridgeHint
  };
}
