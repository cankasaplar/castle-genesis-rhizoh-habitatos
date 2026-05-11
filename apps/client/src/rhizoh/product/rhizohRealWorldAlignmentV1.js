/**
 * Gerçek dünya hizası — üç temel boşluğun görünür değerlendirmesi (dashboard / governance).
 *
 * A) Bağımsız doğrulayıcı: şu an istemci + gateway stub; iş sonucu / CRM / destek hattı ayrı kaynak değil.
 * B) Kohort: session bucket ≠ population; stabil özne anahtarı continuityMeta ile gelmeli.
 * C) Zaman ekseni: hızlı iç geri bildirim vs gecikmiş dış düzeltme — bias riski ölçülür.
 */

import { getRhizohExternalGroundTruthCachedSync } from "./rhizohExternalGroundTruthV1.js";
import {
  getRhizohExternalLoopAsymmetryScale,
  getRhizohExternalLossLearningRateMultiplier
} from "./rhizohExternalLossFunctionV1.js";
import { getRhizohProductPolicyAuditTail, resolveRhizohPolicyHoldoutSubjectKey } from "./rhizohProductPolicyStoreV1.js";

export const RHIZOH_REAL_WORLD_ALIGNMENT_VERSION = "1.0.0";

const WINDOW_MS = 86_400_000;

function clamp01(x) {
  const n = Number(x);
  if (!Number.isFinite(n)) return 0;
  return Math.max(0, Math.min(1, n));
}

/**
 * @param {Record<string, unknown> | null | undefined} continuityMeta
 * @param {number} [nowMs]
 */
export function getRhizohRealWorldAlignmentAssessment(continuityMeta, nowMs = Date.now()) {
  const now = Number(nowMs) || Date.now();
  if (typeof window === "undefined") {
    return {
      schemaVersion: "1.0.0",
      alignmentVersion: RHIZOH_REAL_WORLD_ALIGNMENT_VERSION,
      ts: now,
      unavailable: true
    };
  }

  const ext = getRhizohExternalGroundTruthCachedSync();
  const asym = getRhizohExternalLoopAsymmetryScale(now);
  const lr = getRhizohExternalLossLearningRateMultiplier();
  const subjectKey = resolveRhizohPolicyHoldoutSubjectKey(continuityMeta);

  const audit = getRhizohProductPolicyAuditTail(64);
  const since = now - WINDOW_MS;
  const promotes24h = audit.filter(
    (e) =>
      e &&
      typeof e.ts === "number" &&
      e.ts >= since &&
      typeof e.action === "string" &&
      e.action.startsWith("promote_")
  ).length;

  /** A — bağımsız outcome kaynağı yok; bundle bile istemci önbelleğinden */
  let groundTruthIndependence = "client_observed_only";
  if (ext.status === "fresh" && ext.bundle?.populationCohort) {
    groundTruthIndependence = "server_population_stub";
  } else if (ext.status === "stale" && ext.bundle) {
    groundTruthIndependence = "server_stub_stale";
  }

  /** B — kohort öznesi */
  const m = continuityMeta && typeof continuityMeta === "object" ? continuityMeta : {};
  const hasStableSubject = Boolean(
    (typeof m.analystStableKey === "string" && m.analystStableKey.trim()) ||
      (typeof m.populationSubjectKey === "string" && m.populationSubjectKey.trim()) ||
      (typeof m.firebaseUid === "string" && m.firebaseUid.trim()) ||
      (typeof m.userId === "string" && m.userId.trim())
  );
  const cohortModel = hasStableSubject ? "stable_subject_bucket" : "session_id_bucket_proxy";

  /** C — iç hız yüksek, dış ölçek düşükse bias riski */
  const internalVelocity01 = clamp01(promotes24h / 6);
  const externalResponsiveness01 = asym.scale01;
  const timeAxisBiasRisk01 = Math.round(
    clamp01(internalVelocity01 * (1 - externalResponsiveness01) * (0.45 + 0.55 * lr.multiplier01)) * 1000
  ) / 1000;

  return {
    schemaVersion: "1.0.0",
    alignmentVersion: RHIZOH_REAL_WORLD_ALIGNMENT_VERSION,
    ts: now,
    gaps: {
      A_groundTruthNotIndependent: {
        summary:
          "External loss ve truth hâlâ istemci gözlemi + gateway stub; iş/business outcome doğrulayıcısı ayrı değil.",
        groundTruthIndependence,
        recommendation: "Bağlantı: CRM, faturalama, destek çözümü veya sunucu tarafı outcome ingest (cohort-level)."
      },
      B_cohortNotPopulation: {
        summary:
          hasStableSubject
            ? "Holdout/TREATMENT stabil özne anahtarı ile bucket’lanıyor (daha iyi)."
            : "Holdout sessionId üzerinden — aynı kullanıcı zaman içinde farklı bucket’a düşebilir; population değil.",
        cohortModel,
        holdoutSubjectKeyHint: hasStableSubject ? "stable_meta" : "session_fallback",
        subjectKeyChars: subjectKey.length
      },
      C_timeAxisBias: {
        summary:
          "Hızlı iç promote + gecikmiş dış ölçek → geç gelen gerçeklik düşük ağırlıklı hissedilebilir (drift klasik nedeni).",
        timeAxisBiasRisk01,
        promotes24h,
        externalLoopScale01: asym.scale01
      }
    }
  };
}
