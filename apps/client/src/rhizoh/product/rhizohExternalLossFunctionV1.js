/**
 * External Loss Function Layer — policy döngüsünden bağımsız “kayıp / ödül” proxy’leri.
 *
 * Tek kök haritası (4 risk):
 * - Self-reinforcement, yerel truth anchor, kohort eksikliği, justification‑evaluation
 *   → hepsi **“observable closed‑loop without population‑level external outcomes”** dalından beslenir.
 * Bu katman minimal proxy ile o boşluğu doldurmaya başlar; gerçek churn / KPI backend’i sonra bağlanır.
 */

import { emitRhizohBehaviorSignal } from "../telemetry/rhizohBehaviorSignalsV1.js";
import { loadRhizohProductSession } from "./rhizohProductSessionPersistenceV1.js";
import {
  getRhizohExternalGroundTruthCachedSync,
  resolveRhizohExternalGroundTruthUrl
} from "./rhizohExternalGroundTruthV1.js";

export const RHIZOH_EXTERNAL_LOSS_LAYER_VERSION = "1.4.0";

const LS_EVENTS = "rhizoh.external_loss.events.v1";
const LS_FLUSH_META = "rhizoh.external_loss.flush_meta.v1";
const LS_BLOCK_PROMOTE = "rhizoh.policy.block_promote_on_external_loss.v1";
const LS_BLOCK_MERGE = "rhizoh.policy.block_merge_on_external_loss.v1";
/** LS "1" → çarpan her zaman 1 (dış kayıp gradyanı kapalı). */
const LS_DISABLE_LR_GRADIENT = "rhizoh.policy.disable_external_loss_lr_gradient.v1";
/** LS "1" → dış döngü gecikmesiyle iç LR düşürme kapalı. */
const LS_DISABLE_EXTERNAL_ASYMMETRY = "rhizoh.policy.disable_external_loop_asymmetry.v1";
const MAX_EVENTS = 48;
const WINDOW_MS = 72 * 60 * 60 * 1000;

/** @type {Readonly<{ root: string, risks: string[], missingLayer: string, mitigations: string[] }>} */
export const RHIZOH_POLICY_LEARNING_RISK_ROOT_MAP = Object.freeze({
  observable_closed_loop_without_external_loss: Object.freeze({
    root: "Tek gözlem düzlemi içinde korelasyonlar truth sanılıyor; population variance ve outbound outcome yok.",
    risks: Object.freeze([
      "①_self_reinforcement_bias",
      "②_local_truth_anchor_observation_not_reality",
      "③_missing_population_cohort_overfit",
      "④_evaluation_as_justification_not_validation"
    ]),
    missingLayer: "external_loss_function",
    mitigations: Object.freeze([
      "gateway_population_cohort_stub_or_analytics",
      "explicit_rating_abandon_return_task_proxy_signals",
      "promote_decorrelation_quota_holdout_counterfactual_finalize",
      "require_external_truth_ls_flag_optional",
      "external_loop_asymmetry_dampen_stale_truth_or_batch",
      "external_asymmetry_floor_tune_for_pipeline_latency",
      "real_user_outcome_signals_product_session_satisfaction_correction"
    ])
  })
});

export function readRhizohPolicyBlockPromoteOnExternalLoss() {
  try {
    return typeof window !== "undefined" && window.localStorage.getItem(LS_BLOCK_PROMOTE) === "1";
  } catch {
    return false;
  }
}

export function readRhizohPolicyBlockMergeOnExternalLoss() {
  try {
    return typeof window !== "undefined" && window.localStorage.getItem(LS_BLOCK_MERGE) === "1";
  } catch {
    return false;
  }
}

export function readRhizohPolicyDisableExternalLossLearningRateGradient() {
  try {
    return typeof window !== "undefined" && window.localStorage.getItem(LS_DISABLE_LR_GRADIENT) === "1";
  } catch {
    return false;
  }
}

export function readRhizohPolicyDisableExternalLoopAsymmetry() {
  try {
    return typeof window !== "undefined" && window.localStorage.getItem(LS_DISABLE_EXTERNAL_ASYMMETRY) === "1";
  } catch {
    return false;
  }
}

/** Varsayılan taban: aşırı ölçek düşürme → learning stagnation önlemi. */
const DEFAULT_EXTERNAL_ASYMMETRY_FLOOR01 = 0.26;

const LS_ASYMMETRY_FLOOR = "rhizoh.policy.external_asymmetry_floor.v1";

export function readRhizohPolicyExternalAsymmetryFloor01() {
  try {
    if (typeof window === "undefined") return DEFAULT_EXTERNAL_ASYMMETRY_FLOOR01;
    const raw = window.localStorage.getItem(LS_ASYMMETRY_FLOOR);
    if (raw == null || raw === "") return DEFAULT_EXTERNAL_ASYMMETRY_FLOOR01;
    const n = Number(raw);
    if (!Number.isFinite(n)) return DEFAULT_EXTERNAL_ASYMMETRY_FLOOR01;
    return Math.max(0.12, Math.min(0.55, n));
  } catch {
    return DEFAULT_EXTERNAL_ASYMMETRY_FLOOR01;
  }
}

/** Dış batch — yavaş ingest normal; decay yumuşak + taban. */
const EXTERNAL_BATCH_ACK_HALFIFE_MS = 360_000;
const BATCH_PENDING_NEVER_ACKED_COVERAGE01 = 0.48;
const BATCH_DECAY_FLOOR01 = 0.22;

/** Truth absent/invalid ≠ sunucu onaylı stale — yanlış “eski” cezası azaltılır. */
const TRUTH_UNKNOWN_COVERAGE01 = 0.52;
const TRUTH_STALE_COVERAGE01 = 0.38;
const FRESH_OVERRUN_RELAX_MIN = 0.18;

/**
 * İç döngü (sık) / dış döngü (seyrek): dış truth veya batch ingest gecikmişse `scale01` küçülür.
 * @param {number} [nowMs]
 */
export function getRhizohExternalLoopAsymmetryScale(nowMs = Date.now()) {
  const now = Number(nowMs) || Date.now();
  if (readRhizohPolicyDisableExternalLoopAsymmetry()) {
    return {
      scale01: 1,
      truthCoverage01: 1,
      batchCoverage01: 1,
      bypassed: true
    };
  }

  const hasTruthUrl = Boolean(String(resolveRhizohExternalGroundTruthUrl() || "").trim());
  const hasBatchUrl = Boolean(String(resolveRhizohExternalLossBatchUrl() || "").trim());

  if (!hasTruthUrl && !hasBatchUrl) {
    return {
      scale01: 1,
      truthCoverage01: 1,
      batchCoverage01: 1,
      bypassed: true,
      reason: "no_external_endpoints"
    };
  }

  let truthCoverage01 = 1;
  if (hasTruthUrl) {
    const snap = getRhizohExternalGroundTruthCachedSync();
    if (snap.status === "fresh" && snap.bundle) {
      const ttl = Math.max(120_000, Number(snap.bundle.ttlMs) || 300_000);
      const ba = Math.max(0, Number(snap.bundleAgeMs) || 0);
      const slack = ttl * 0.5;
      const overrun = Math.max(0, ba - slack);
      truthCoverage01 = Math.max(
        FRESH_OVERRUN_RELAX_MIN,
        1 - Math.min(1, overrun / Math.max(ttl, 1))
      );
    } else if (snap.status === "stale" && snap.bundle) {
      truthCoverage01 = TRUTH_STALE_COVERAGE01;
    } else {
      /** absent | invalid — dış kanal yanıtı yok / henüz yok: “bilinmeyen” için agresif küçültme yok */
      truthCoverage01 = TRUTH_UNKNOWN_COVERAGE01;
    }
  }

  let batchCoverage01 = 1;
  if (hasBatchUrl) {
    const events = loadEvents();
    const fm = readFlushMeta();
    if (events.length === 0) {
      batchCoverage01 = 1;
    } else if (!fm.lastOkAt || fm.lastOkAt <= 0) {
      /** Kuyruk var, henüz HTTP 200 yok: throttling veya seyrek ingest normal */
      batchCoverage01 = BATCH_PENDING_NEVER_ACKED_COVERAGE01;
    } else {
      const age = Math.max(0, now - fm.lastOkAt);
      batchCoverage01 = Math.max(
        BATCH_DECAY_FLOOR01,
        Math.min(1, Math.exp(-age / EXTERNAL_BATCH_ACK_HALFIFE_MS))
      );
    }
  }

  const rawScale = Math.min(truthCoverage01, batchCoverage01);
  const floor01 = readRhizohPolicyExternalAsymmetryFloor01();
  const scale01 = Math.max(floor01, Math.min(1, rawScale));

  return {
    scale01: Math.round(scale01 * 1000) / 1000,
    rawScale01: Math.round(rawScale * 1000) / 1000,
    scaleFloor01: floor01,
    truthCoverage01: Math.round(truthCoverage01 * 1000) / 1000,
    batchCoverage01: Math.round(batchCoverage01 * 1000) / 1000,
    hasTruthUrl,
    hasBatchUrl,
    bypassed: false
  };
}

function loadEvents() {
  try {
    if (typeof window === "undefined") return [];
    const raw = window.localStorage.getItem(LS_EVENTS);
    if (!raw) return [];
    const p = JSON.parse(raw);
    return Array.isArray(p?.events) ? p.events : [];
  } catch {
    return [];
  }
}

function saveEvents(events) {
  try {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(
      LS_EVENTS,
      JSON.stringify({
        schemaVersion: "1.0.0",
        layerVersion: RHIZOH_EXTERNAL_LOSS_LAYER_VERSION,
        updatedAt: Date.now(),
        events: events.slice(-MAX_EVENTS)
      })
    );
  } catch {
    /* noop */
  }
}

function readFlushMeta() {
  try {
    if (typeof window === "undefined") return { lastOkAt: 0, lastLenSent: 0 };
    const raw = window.localStorage.getItem(LS_FLUSH_META);
    if (!raw) return { lastOkAt: 0, lastLenSent: 0 };
    const p = JSON.parse(raw);
    return {
      lastOkAt: Number.isFinite(Number(p.lastOkAt)) ? Number(p.lastOkAt) : 0,
      lastLenSent: Number.isFinite(Number(p.lastLenSent)) ? Number(p.lastLenSent) : 0
    };
  } catch {
    return { lastOkAt: 0, lastLenSent: 0 };
  }
}

/** Panel / governor: batch ingest son onay + kuyruk. */
export function getRhizohExternalLossBatchIngestSnapshot() {
  if (typeof window === "undefined") {
    return { pendingEvents: 0, lastOkAt: 0, ageMsSinceAck: null };
  }
  const fm = readFlushMeta();
  const now = Date.now();
  const lastOkAt = fm.lastOkAt > 0 ? fm.lastOkAt : 0;
  return {
    pendingEvents: loadEvents().length,
    lastOkAt,
    ageMsSinceAck: lastOkAt > 0 ? Math.max(0, now - lastOkAt) : null
  };
}

function writeFlushMeta(partial) {
  try {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(
      LS_FLUSH_META,
      JSON.stringify({
        schemaVersion: "1.0.0",
        updatedAt: Date.now(),
        ...partial
      })
    );
  } catch {
    /* noop */
  }
}

function readGatewayTokenBestEffort() {
  try {
    return String(typeof import.meta !== "undefined" ? import.meta.env?.VITE_GATEWAY_TOKEN || "" : "").trim();
  } catch {
    return "";
  }
}

/** Gateway HTTP kökü — test ortamında `globalThis.__RHIZOH_TEST_GATEWAY_HTTP__`. */
function readGatewayHttpForDerivedEndpoints() {
  try {
    const g = typeof globalThis !== "undefined" ? globalThis.__RHIZOH_TEST_GATEWAY_HTTP__ : "";
    const gv = g != null ? String(g).trim() : "";
    if (gv) return gv;
  } catch {
    /* noop */
  }
  return String(
    typeof import.meta !== "undefined" ? import.meta.env?.VITE_GATEWAY_HTTP || import.meta.env?.VITE_RHIZOH_LLM_HTTP || "" : ""
  ).trim();
}

/** Tam URL veya boş (gateway kökünden türetilir). */
export function resolveRhizohExternalLossBatchUrl() {
  const explicit = String(typeof import.meta !== "undefined" ? import.meta.env?.VITE_RHIZOH_EXTERNAL_LOSS_BATCH_HTTP || "" : "").trim();
  if (explicit) return explicit.replace(/\/+$/, "");
  const llm = readGatewayHttpForDerivedEndpoints();
  if (!llm) return "";
  try {
    const u = new URL(llm, typeof window !== "undefined" ? window.location.origin : "http://localhost");
    return `${u.origin}/rhizoh/product/external-loss/batch`;
  } catch {
    return "";
  }
}

/**
 * Gateway’e batch gönderir (throttle: yeni olay yoksa ~45s içinde tekrarlamaz).
 */
export async function flushRhizohExternalLossBatchBestEffort() {
  if (typeof window === "undefined") return { ok: false, reason: "ssr", sent: 0 };
  const url = resolveRhizohExternalLossBatchUrl();
  if (!url) return { ok: false, reason: "no_url", sent: 0 };
  const events = loadEvents();
  if (!events.length) return { ok: true, reason: "empty", sent: 0 };

  const fm = readFlushMeta();
  const now = Date.now();
  const flushThrottleMs = 45_000;
  if (events.length <= fm.lastLenSent && now - fm.lastOkAt < flushThrottleMs) {
    return { ok: true, reason: "throttled", sent: 0 };
  }

  const slice = events.slice(-64);
  const session = loadRhizohProductSession(undefined);
  const sid = String(session.sessionId || "").slice(0, 128);
  const tok = readGatewayTokenBestEffort();
  const ctrl = typeof AbortController !== "undefined" ? new AbortController() : null;
  const timer = ctrl ? window.setTimeout(() => ctrl.abort(), 3200) : 0;

  try {
    /** @type {Record<string, string>} */
    const headers = { Accept: "application/json", "Content-Type": "application/json" };
    if (tok) headers.Authorization = `Bearer ${tok}`;
    if (sid) headers["x-castle-device"] = sid;

    const body = {
      schemaVersion: "1.0.0",
      layerVersion: RHIZOH_EXTERNAL_LOSS_LAYER_VERSION,
      clientTs: now,
      sessionId: sid,
      deviceHint: sid,
      events: slice.map((e) => ({
        ts: e.ts,
        kind: e.kind,
        severity: e.severity,
        meta: e.meta && typeof e.meta === "object" ? e.meta : {}
      }))
    };

    const res = await fetch(url, {
      method: "POST",
      signal: ctrl?.signal,
      headers,
      body: JSON.stringify(body)
    });
    if (!res.ok) return { ok: false, reason: `http_${res.status}`, sent: 0 };
    writeFlushMeta({ lastOkAt: now, lastLenSent: events.length });
    try {
      emitRhizohBehaviorSignal("rhizoh.external_loss.batch_flushed", { sent: slice.length });
    } catch {
      /* noop */
    }
    return { ok: true, reason: "sent", sent: slice.length };
  } catch {
    return { ok: false, reason: "network", sent: 0 };
  } finally {
    if (timer) window.clearTimeout(timer);
  }
}

/**
 * Doğrudan kayıp olayı (UI veya özel akıştan).
 * @param {string} kind
 * @param {number} severity -1…1 (negatif = kayıp)
 * @param {Record<string, unknown>} [meta]
 */
export function recordRhizohExternalLossEvent(kind, severity, meta = {}) {
  if (typeof window === "undefined") return;
  const s = Number(severity);
  const sev = Number.isFinite(s) ? Math.max(-1, Math.min(1, s)) : 0;
  const ev = {
    ts: Date.now(),
    kind: String(kind || "unknown").slice(0, 64),
    severity: sev,
    meta: meta && typeof meta === "object" ? meta : {}
  };
  const next = [...loadEvents(), ev];
  saveEvents(next);
}

/**
 * castle:rhizoh-signal detail → kayıp katmanı (aggregator tarafından çağrılır).
 * @param {Record<string, unknown>} detail
 */
export function ingestRhizohExternalLossFromSignalDetail(detail) {
  if (!detail || typeof detail.name !== "string") return;
  const name = detail.name;

  switch (name) {
    case "rhizoh.external_loss.explicit_rating": {
      const r = Number(detail.rating);
      const sev = r >= 1 ? 0.42 : r <= -1 ? -0.48 : 0;
      recordRhizohExternalLossEvent("explicit_rating", sev, { rating: r });
      break;
    }
    case "rhizoh.external_loss.abandon": {
      recordRhizohExternalLossEvent("session_abandon", -0.32, {
        phase: detail.phase != null ? String(detail.phase).slice(0, 32) : "",
        msSinceReply: Number(detail.msSinceReply) || 0
      });
      break;
    }
    case "rhizoh.external_loss.correction": {
      recordRhizohExternalLossEvent("undo_correction", -0.28, {
        label: detail.label != null ? String(detail.label).slice(0, 120) : ""
      });
      break;
    }
    case "rhizoh.external_loss.task_proxy": {
      const ok = Boolean(detail.ok);
      recordRhizohExternalLossEvent("task_success_proxy", ok ? 0.24 : -0.38, { ok });
      break;
    }
    case "rhizoh.external_loss.latency_frustration": {
      const bump = Math.min(1, Math.max(0, Number(detail.frustration01) || 0));
      recordRhizohExternalLossEvent("latency_frustration", -0.14 - bump * 0.35, { frustration01: bump });
      break;
    }
    case "rhizoh.closure.dismiss": {
      if (detail.reason === "timeout") {
        recordRhizohExternalLossEvent("closure_timeout_proxy", -0.12, {
          visibleMs: Number(detail.visibleMs) || 0
        });
      }
      break;
    }
    case "rhizoh.session.return_24h": {
      recordRhizohExternalLossEvent("return_24h_proxy", 0.18, { gapMs: Number(detail.gapMs) || 0 });
      break;
    }
    case "rhizoh.session.return_7d": {
      recordRhizohExternalLossEvent("return_7d_proxy", 0.22, { gapMs: Number(detail.gapMs) || 0 });
      break;
    }
    /** —— Ürün outcome / memnuniyet / düzeltme (gerçek veya ürün-tanımlı implicit) —— */
    case "rhizoh.product.session_outcome": {
      const o = String(detail.outcome || "").toLowerCase().slice(0, 32);
      const implicit = Boolean(detail.implicit);
      let kind = "product_session_outcome_unknown";
      let sev = -0.06;
      if (o === "success" || o === "complete" || o === "completed") {
        kind = "product_session_success";
        sev = 0.46;
      } else if (o === "failure" || o === "fail" || o === "failed") {
        kind = "product_session_failure";
        sev = -0.54;
      } else if (o === "abandon" || o === "drop" || o === "bounce") {
        kind = "product_session_abandon_or_drop";
        sev = -0.41;
      } else if (o === "continue" || o === "engaged") {
        kind = "product_session_continue";
        sev = 0.1;
      }
      recordRhizohExternalLossEvent(kind, sev, {
        outcome: o,
        implicit,
        label: detail.label != null ? String(detail.label).slice(0, 64) : ""
      });
      break;
    }
    case "rhizoh.product.satisfaction_proxy": {
      const src = String(detail.source || "").toLowerCase().slice(0, 24);
      if (src === "thumb" || src === "thumbs") {
        const t = Number(detail.thumbs01 ?? detail.rating01);
        let sev = 0;
        if (Number.isFinite(t)) {
          sev = t >= 0.5 ? 0.39 : -0.44;
        } else if (detail.rating != null) {
          const r = Number(detail.rating);
          sev = r >= 1 ? 0.39 : r <= -1 ? -0.44 : 0;
        }
        recordRhizohExternalLossEvent("product_satisfaction_thumb", sev, {
          thumbs01: Number.isFinite(Number(detail.thumbs01)) ? Number(detail.thumbs01) : null,
          rating: Number(detail.rating) || null
        });
      } else if (src === "dwell") {
        const z = Number(detail.zScore);
        const d = Number(detail.delta01);
        const u = Number.isFinite(z) ? z : Number.isFinite(d) ? d : 0;
        const sev = Math.max(-0.46, Math.min(0.42, u * 0.36));
        recordRhizohExternalLossEvent("product_satisfaction_dwell", sev, {
          zScore: Number.isFinite(z) ? z : null,
          delta01: Number.isFinite(d) ? d : null
        });
      } else if (src === "rage_click") {
        const n = Math.min(1, Math.max(0, Number(detail.burst01) || 0));
        recordRhizohExternalLossEvent("product_satisfaction_rage_click", -0.16 - n * 0.44, { burst01: n });
      }
      break;
    }
    case "rhizoh.product.correction_signal": {
      const k = String(detail.kind || "generic").toLowerCase().slice(0, 32);
      /** @type {Record<string, number>} */
      const sevMap = {
        assert_wrong: -0.49,
        this_is_wrong: -0.49,
        undo: -0.33,
        retry: -0.24,
        generic: -0.27
      };
      const sev = sevMap[k] ?? -0.3;
      recordRhizohExternalLossEvent(`product_correction_${k}`.slice(0, 64), sev, {
        kind: k,
        contextId: detail.contextId != null ? String(detail.contextId).slice(0, 64) : ""
      });
      break;
    }
    default:
      break;
  }
}

export function getRhizohExternalLossSummary() {
  const now = Date.now();
  const events = loadEvents().filter((e) => e && typeof e.ts === "number" && now - e.ts <= WINDOW_MS);
  let penaltyMass = 0;
  let rewardMass = 0;
  let negN = 0;
  let posN = 0;
  for (const e of events) {
    const s = Number(e.severity);
    if (!Number.isFinite(s)) continue;
    if (s < -0.05) {
      penaltyMass += -s;
      negN += 1;
    } else if (s > 0.05) {
      rewardMass += s;
      posN += 1;
    }
  }
  const penalty01 = negN > 0 ? Math.min(1, penaltyMass / (negN * 0.55)) : 0;
  const reward01 = posN > 0 ? Math.min(1, rewardMass / (posN * 0.45)) : 0;
  const net01 = Math.round((reward01 - penalty01) * 1000) / 1000;
  return {
    layerVersion: RHIZOH_EXTERNAL_LOSS_LAYER_VERSION,
    windowMs: WINDOW_MS,
    eventCount: events.length,
    negativeCount: negN,
    positiveCount: posN,
    penalty01,
    reward01,
    net01,
    riskRootKey: "observable_closed_loop_without_external_loss"
  };
}

/**
 * İsteğe bağlı promote freni — LS `rhizoh.policy.block_promote_on_external_loss.v1` = "1".
 */
export function getRhizohExternalLossPromotionGate() {
  if (!readRhizohPolicyBlockPromoteOnExternalLoss()) {
    return { blocked: false, reason: null, summary: getRhizohExternalLossSummary() };
  }
  const summary = getRhizohExternalLossSummary();
  if (summary.negativeCount >= 2 && summary.penalty01 >= 0.38) {
    return { blocked: true, reason: "external_loss_penalty", summary };
  }
  return { blocked: false, reason: null, summary };
}

/**
 * Dış kayıp özütünden policy güncelleme büyüklüğü çarpanı (0…1].
 * `externalLossScore01` ≈ [-1,1]: ceza baskısı yüksekken küçülür; ödül tarafında tam adıma yaklaşır.
 */
export function getRhizohExternalLossLearningRateMultiplier() {
  const asym = getRhizohExternalLoopAsymmetryScale(Date.now());
  const summary = getRhizohExternalLossSummary();
  if (readRhizohPolicyDisableExternalLossLearningRateGradient()) {
    const multiplier01 = Math.max(0.06, Math.min(1, asym.scale01));
    return {
      multiplier01: Math.round(multiplier01 * 1000) / 1000,
      externalLossScore01: 0,
      summary,
      gradientDisabled: true,
      externalLoopAsymmetry: asym
    };
  }
  const net = Number(summary.net01);
  const pen = Math.max(0, Math.min(1, Number(summary.penalty01)));
  const negN = Math.max(0, Math.floor(Number(summary.negativeCount)) || 0);
  const pressure = Math.max(0, Math.min(1, pen * (0.55 + 0.45 * Math.min(1, negN / 5))));
  const externalLossScore01 = Math.max(-1, Math.min(1, (Number.isFinite(net) ? net : 0) - 0.5 * pressure));
  const u = (externalLossScore01 + 1) / 2;
  const baseMult = Math.max(0.08, Math.min(1, 0.12 + 0.88 * u ** 1.35));
  const multiplier01 = Math.max(0.05, Math.min(1, baseMult * asym.scale01));

  return {
    multiplier01: Math.round(multiplier01 * 1000) / 1000,
    externalLossScore01: Math.round(externalLossScore01 * 1000) / 1000,
    summary,
    gradientDisabled: false,
    externalLoopAsymmetry: asym
  };
}

/** LS `rhizoh.policy.block_merge_on_external_loss.v1` — finalize’da öğrenilmiş merge freni. */
export function getRhizohExternalLossMergeGate() {
  if (!readRhizohPolicyBlockMergeOnExternalLoss()) {
    return { blocked: false, reason: null, summary: getRhizohExternalLossSummary() };
  }
  const summary = getRhizohExternalLossSummary();
  if (summary.negativeCount >= 2 && summary.penalty01 >= 0.38) {
    return { blocked: true, reason: "external_loss_penalty", summary };
  }
  return { blocked: false, reason: null, summary };
}

/** 👍 / 👎 — UI düğmesinden çağır. */
export function emitRhizohExplicitProductRating(thumbsUp) {
  emitRhizohBehaviorSignal("rhizoh.external_loss.explicit_rating", {
    rating: thumbsUp ? 1 : -1
  });
}

/** Oturum terk proxy (örn. uzun süre yanıt yok). */
export function emitRhizohSessionAbandonLoss(meta = {}) {
  emitRhizohBehaviorSignal("rhizoh.external_loss.abandon", meta);
}

/** Kullanıcı düzeltmesi / geri alma. */
export function emitRhizohUserCorrectionLoss(label = "") {
  emitRhizohBehaviorSignal("rhizoh.external_loss.correction", { label });
}

/** Görev / hedef başarı proxy (ürün tanımlı boolean). */
export function emitRhizohTaskSuccessProxy(ok) {
  emitRhizohBehaviorSignal("rhizoh.external_loss.task_proxy", { ok: Boolean(ok) });
}

/** Ürün tanımlı oturum sonucu: success | failure | abandon | drop | continue | … (implicit=true ile örtük). */
export function emitRhizohProductSessionOutcome(outcome, meta = {}) {
  emitRhizohBehaviorSignal("rhizoh.product.session_outcome", {
    outcome: String(outcome || "").slice(0, 48),
    implicit: meta.implicit === true,
    label: meta.label != null ? String(meta.label).slice(0, 64) : ""
  });
}

/**
 * Memnuniyet proxy: thumb | dwell | rage_click
 * @param {"thumb"|"dwell"|"rage_click"} source
 */
export function emitRhizohProductSatisfactionProxy(source, payload = {}) {
  emitRhizohBehaviorSignal("rhizoh.product.satisfaction_proxy", {
    source: String(source || "").slice(0, 24),
    ...payload
  });
}

/** Düzeltme: assert_wrong | undo | retry | this_is_wrong | generic */
export function emitRhizohProductCorrectionSignal(kind, meta = {}) {
  emitRhizohBehaviorSignal("rhizoh.product.correction_signal", {
    kind: String(kind || "generic").slice(0, 32),
    ...meta
  });
}

/** Gecikme hayal kırıklığı 0…1. */
export function emitRhizohLatencyFrustration(frustration01) {
  emitRhizohBehaviorSignal("rhizoh.external_loss.latency_frustration", {
    frustration01: Number(frustration01) || 0
  });
}
