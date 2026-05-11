/**
 * Population-level external ground truth stub — gerçek analytics / deney katmanına yer açar.
 * İstemci tek başına LS ile optimize olmayı bırakır; kohort burada çözülür (salt tutarlı hash).
 */

import crypto from "node:crypto";
import { getHttpClientIp } from "./castleHttpRateLimit.js";

export const RHIZOH_GATEWAY_EXTERNAL_TRUTH_VERSION = "1.0.0";

function clampPct(n, fallback = 15) {
  const x = Math.floor(Number(n));
  if (!Number.isFinite(x)) return fallback;
  return Math.max(0, Math.min(40, x));
}

/**
 * @param {import("node:http").IncomingMessage} req
 */
export function buildRhizohExternalGroundTruthPayload(req) {
  const salt = String(process.env.CASTLE_EXTERNAL_TRUTH_SALT || process.env.CASTLE_GATEWAY_TOKEN || "castle_external_truth_salt");
  const deviceRaw = String(req.headers["x-castle-device"] || req.headers["x-device-id"] || "").trim();
  const ip = String(getHttpClientIp(req) || "");
  const basis = deviceRaw || ip || "anon";
  const h = crypto.createHash("sha256").update(`${basis}|${salt}`, "utf8").digest("hex");
  const bucket = Number.parseInt(h.slice(0, 8), 16) % 100;
  const holdoutPct = clampPct(process.env.RHIZOH_SERVER_HOLDOUT_PCT, 15);
  const populationCohort = bucket < holdoutPct ? "SERVER_HOLDOUT" : "SERVER_TREATMENT";

  return {
    schemaVersion: "1.0.0",
    truthLayerVersion: RHIZOH_GATEWAY_EXTERNAL_TRUTH_VERSION,
    source: "castle_gateway_population_v1",
    issuedAtMs: Date.now(),
    ttlMs: Math.max(60_000, Math.min(3_600_000, Number(process.env.RHIZOH_EXTERNAL_TRUTH_TTL_MS) || 300_000)),
    populationCohort,
    /** Promote / LS yazımı gateway kohortunda kapalı (yerel HOLDOUT’dan bağımsız). */
    promotionEligible: populationCohort !== "SERVER_HOLDOUT",
    /** Finalize’da öğrenilmiş merge için nüfus izni (stub’da promote ile aynı). */
    learningMergeEligible: populationCohort !== "SERVER_HOLDOUT",
    serverHoldoutPct: holdoutPct,
    cohortDigest: h.slice(0, 16),
    cautions: [
      "stub_population_truth_not_analytics_backed",
      "internal_metrics_remain_self_observation_without_external_outcomes"
    ]
  };
}
