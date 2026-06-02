import { getCastleFlightConfig } from "../../castleFlight/castleFlightConfig.js";
import { getOrCreateCastleDevUid, getRhizohGatewayHealthBase } from "../useRhizohGatewayMonitor.js";
import {
  getEpistemicGatewayRoutesReachable,
  markEpistemicGatewayAuthFailedV0,
  markEpistemicGatewayRoutesMissing,
  markEpistemicGatewayRoutesOk
} from "./epistemicGatewayCapability.js";
import { isRhizohProductIngressHostV0 } from "../runtime/rhizohUiLocaleV0.js";
import {
  attachEpistemicTelemetryChannelV1,
  drainEpistemicTelemetryShadowV1,
  getEpistemicTelemetryShadowCountV1,
  isEpistemicTelemetryChannelAttachedV1,
  pushEpistemicTelemetryShadowV1
} from "./epistemicTelemetryBarrierV1.js";

let warnedMissingGatewayToken = false;

function publishEpistemicTelemetryStateV0(status, detail = {}) {
  if (typeof window === "undefined") return;
  try {
    window.__CASTLE_EPISTEMIC_TELEMETRY__ = Object.freeze({
      lastStatus: status,
      lastError: detail.lastError ?? null,
      shadowCount: getEpistemicTelemetryShadowCountV1(),
      channelAttached: isEpistemicTelemetryChannelAttachedV1(),
      at: Date.now(),
      ...detail
    });
  } catch {
    /* noop */
  }
}

function hasEpistemicTransportCredentials(idToken = "") {
  const tok = String(idToken || "").trim();
  const cfg = getCastleFlightConfig();
  const gt = String(cfg.gatewayToken || "").trim();
  const devUid = getOrCreateCastleDevUid();
  return Boolean(tok || (gt && devUid));
}

function canRemoteEpistemicTransmit(idToken = "") {
  if (getEpistemicGatewayRoutesReachable() === false) return false;
  if (!getRhizohGatewayHealthBase()) return false;
  if (!hasEpistemicTransportCredentials(idToken)) return false;
  return isEpistemicTelemetryChannelAttachedV1();
}

const QUEUE = [];
let flushTimer = 0;
let inFlight = false;
const WINDOW_MS = 220;

/**
 * Epistemic ingest auth: prefer gateway transport (token + dev uid).
 * Do not attach Firebase Bearer when gateway token is present — Render prod often
 * has no Firebase Admin / CASTLE_JWT_SECRET; Bearer would shadow the transport path.
 * @param {string} [idToken]
 */
export function buildEpistemicTransportHeadersV0(idToken = "") {
  const cfg = getCastleFlightConfig();
  const h = {
    "Content-Type": "application/json",
    "X-Castle-Dev-Uid": getOrCreateCastleDevUid()
  };
  const gt = String(cfg.gatewayToken || "").trim();
  if (gt) {
    h["X-Castle-Gateway-Token"] = gt;
    return h;
  }
  const tok = String(idToken || "").trim();
  if (tok) h.Authorization = `Bearer ${tok}`;
  return h;
}

async function postBatch(entries, idToken) {
  const base = getRhizohGatewayHealthBase();
  if (!base) return { ok: false, error: "no_gateway_base" };
  if (getEpistemicGatewayRoutesReachable() === false) {
    return { ok: false, error: "epistemic_remote_routes_missing", skipRetry: true };
  }
  try {
    const res = await fetch(`${String(base).replace(/\/+$/, "")}/rhizoh/epistemic/logs/batch`, {
      method: "POST",
      headers: buildEpistemicTransportHeadersV0(idToken),
      body: JSON.stringify({ entries }),
      ...(typeof AbortSignal !== "undefined" && typeof AbortSignal.timeout === "function"
        ? { signal: AbortSignal.timeout(12000) }
        : {})
    });
    const j = await res.json().catch(() => ({}));
    if (res.status === 404) {
      markEpistemicGatewayRoutesMissing("batch", base);
      return { ok: false, error: j.error || "http_404", skipRetry: true };
    }
    if (res.status === 401 || res.status === 403) {
      markEpistemicGatewayAuthFailedV0("batch_auth", j.error || `http_${res.status}`);
      return { ok: false, error: j.error || `http_${res.status}`, skipRetry: true };
    }
    if (!res.ok || !j?.ok) return { ok: false, error: j.error || `http_${res.status}` };
    markEpistemicGatewayRoutesOk();
    publishEpistemicTelemetryStateV0("ok", { flushedCount: entries.length });
    return { ok: true, latest: j.latest || null };
  } catch (e) {
    return { ok: false, error: String(e?.message || e || "epistemic_log_upload_failed") };
  }
}

async function flushNow() {
  if (inFlight) return;
  if (!QUEUE.length) return;
  inFlight = true;
  const batch = QUEUE.splice(0, 80);
  const idToken = batch.map((x) => x.idToken).find(Boolean) || "";
  const entries = batch.map((x) => x.entry);
  const r = await postBatch(entries, idToken);
  inFlight = false;
  if (!r.ok) {
    publishEpistemicTelemetryStateV0(r.skipRetry ? "skipped" : "error", {
      lastError: r.error || "batch_failed"
    });
    if (r.skipRetry) {
      return;
    }
    for (const row of batch.slice(-40)) QUEUE.unshift(row);
    return;
  }
  if (r.latest && typeof window !== "undefined") {
    try {
      window.dispatchEvent(
        new CustomEvent("castle-rhizoh-epistemic-ledger", {
          detail: { latest: r.latest }
        })
      );
    } catch {
      /* noop */
    }
  }
  if (QUEUE.length) scheduleFlush();
}

function scheduleFlush() {
  if (flushTimer) return;
  flushTimer = window.setTimeout(() => {
    flushTimer = 0;
    void flushNow();
  }, WINDOW_MS);
}

export function flushEpistemicTelemetryShadowBufferV1() {
  const drained = drainEpistemicTelemetryShadowV1();
  if (!drained.length) return 0;
  for (const row of drained) {
    QUEUE.push({ entry: row.entry, idToken: row.idToken });
  }
  if (QUEUE.length > 200) QUEUE.splice(0, QUEUE.length - 200);
  publishEpistemicTelemetryStateV0("flush_pending", { drainedCount: drained.length });
  scheduleFlush();
  return drained.length;
}

/**
 * Attach epistemic core channel (gateway connected) and flush shadow buffer.
 * @param {string} [reason]
 */
export function onEpistemicTelemetryGatewayAttachV1(reason = "gateway_connected") {
  const attach = attachEpistemicTelemetryChannelV1(reason);
  const drained = flushEpistemicTelemetryShadowBufferV1();
  if (!drained && attach.reattached) {
    publishEpistemicTelemetryStateV0("attached", { attachReason: reason });
  }
  return Object.freeze({ ...attach, drainedCount: drained });
}

export function enqueueEpistemicLedgerEntry(entry, idToken = "") {
  if (!entry || typeof entry !== "object") return;
  if (getEpistemicGatewayRoutesReachable() === false) return;
  const tok = String(idToken || "").trim();
  const cfg = getCastleFlightConfig();
  const gt = String(cfg.gatewayToken || "").trim();
  const devUid = getOrCreateCastleDevUid();
  if (!gt && !tok && isRhizohProductIngressHostV0() && !warnedMissingGatewayToken) {
    warnedMissingGatewayToken = true;
    console.warn(
      "[Rhizoh epistemic] VITE_GATEWAY_TOKEN build'e gömülü değil — ledger batch atlanıyor. " +
        "scripts/setup-rhizoh-t0-production.ps1 ile .env.production üretin ve Firebase hosting yeniden deploy edin."
    );
  }
  if (!hasEpistemicTransportCredentials(tok)) return;
  if (!canRemoteEpistemicTransmit(tok)) {
    pushEpistemicTelemetryShadowV1({ entry, idToken: tok });
    publishEpistemicTelemetryStateV0("buffering", { lastError: null });
    return;
  }
  QUEUE.push({ entry, idToken: tok });
  if (QUEUE.length > 200) QUEUE.splice(0, QUEUE.length - 200);
  scheduleFlush();
}

