import { getCastleFlightConfig } from "../../castleFlight/castleFlightConfig.js";
import { getOrCreateCastleDevUid, getRhizohGatewayHealthBase } from "../useRhizohGatewayMonitor.js";
import {
  getEpistemicGatewayRoutesReachable,
  markEpistemicGatewayAuthFailedV0,
  markEpistemicGatewayRoutesMissing,
  markEpistemicGatewayRoutesOk
} from "./epistemicGatewayCapability.js";

const QUEUE = [];
let flushTimer = 0;
let inFlight = false;
const WINDOW_MS = 220;

function buildHeaders(idToken = "") {
  const cfg = getCastleFlightConfig();
  const h = {
    "Content-Type": "application/json",
    "X-Castle-Dev-Uid": getOrCreateCastleDevUid()
  };
  const gt = String(cfg.gatewayToken || "").trim();
  if (gt) h["X-Castle-Gateway-Token"] = gt;
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
      headers: buildHeaders(idToken),
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
    if (typeof window !== "undefined") {
      try {
        window.__CASTLE_EPISTEMIC_TELEMETRY__ = Object.freeze({
          lastStatus: "ok",
          lastError: null,
          at: Date.now()
        });
      } catch {
        /* noop */
      }
    }
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
    if (typeof window !== "undefined") {
      try {
        window.__CASTLE_EPISTEMIC_TELEMETRY__ = Object.freeze({
          lastStatus: r.skipRetry ? "skipped" : "error",
          lastError: r.error || "batch_failed",
          at: Date.now()
        });
      } catch {
        /* noop */
      }
    }
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

export function enqueueEpistemicLedgerEntry(entry, idToken = "") {
  if (!entry || typeof entry !== "object") return;
  if (getEpistemicGatewayRoutesReachable() === false) return;
  const tok = String(idToken || "").trim();
  const cfg = getCastleFlightConfig();
  const gt = String(cfg.gatewayToken || "").trim();
  const devUid = getOrCreateCastleDevUid();
  if (!tok && (!gt || !devUid)) return;
  QUEUE.push({ entry, idToken: tok });
  if (QUEUE.length > 200) QUEUE.splice(0, QUEUE.length - 200);
  scheduleFlush();
}

