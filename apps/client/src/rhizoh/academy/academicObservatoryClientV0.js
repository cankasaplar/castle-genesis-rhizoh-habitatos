/**
 * Client fetch for Academic Observatory export (own threads only via Firebase auth).
 */

import { getCastleFlightConfig } from "../../castleFlight/castleFlightConfig.js";
import { getOrCreateCastleDevUid, getRhizohApiBase } from "../useRhizohGatewayMonitor.js";

/**
 * @param {string} [idToken]
 */
export function buildAcademicObservatoryHeadersV0(idToken = "") {
  const cfg = getCastleFlightConfig();
  /** @type {Record<string, string>} */
  const headers = {
    Accept: "application/json",
    "X-Castle-Dev-Uid": getOrCreateCastleDevUid()
  };
  const gt = String(cfg.gatewayToken || "").trim();
  if (gt) headers["X-Castle-Gateway-Token"] = gt;
  const tok = String(idToken || "").trim();
  if (tok) headers.Authorization = `Bearer ${tok}`;
  return headers;
}

/**
 * @param {{
 *   threadId?: string,
 *   traceId?: string,
 *   mode?: "live" | "paper" | "export",
 *   idToken?: string,
 *   signal?: AbortSignal
 * }} input
 */
export async function fetchAcademicObservatoryExportV0(input = {}) {
  const base = String(getRhizohApiBase() || "").trim().replace(/\/+$/, "");
  if (!base) {
    return { ok: false, error: "no_gateway_base" };
  }

  const url = new URL(`${base}/rhizoh/academic/observatory/export`);
  const mode = String(input.mode || "live").trim().toLowerCase();
  url.searchParams.set("mode", mode);
  if (input.threadId) url.searchParams.set("thread_id", String(input.threadId));
  if (input.traceId) url.searchParams.set("trace_id", String(input.traceId));
  if (mode === "paper") url.searchParams.set("paper", "1");

  const headers = buildAcademicObservatoryHeadersV0(input.idToken);
  const res = await fetch(url.toString(), {
    method: "GET",
    headers,
    cache: "no-store",
    signal: input.signal
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok || !json?.ok) {
    return {
      ok: false,
      error: json?.error || `http_${res.status}`,
      hint: json?.hint,
      status: res.status
    };
  }
  return { ok: true, body: json };
}
