/**
 * Report client realityHealth to gateway — operational signal (env-gated).
 *
 * VITE_SUBSTRATE_HEALTH_REPORT=1
 * Uses VITE_LIVE_GATEWAY_BASE or VITE_GATEWAY_HTTP host + VITE_GATEWAY_TOKEN
 */

import { buildRealityHealthMetricsSnapshotV0 } from "./realityHealthMetricsV0.js";

export const SUBSTRATE_HEALTH_REPORT_SCHEMA_V0 = "castle.rhizoh.substrate_health_report.v0";
export const SUBSTRATE_HEALTH_REPORT_INTERVAL_MS_V0 = 60_000;

function reportEnabled() {
  try {
    return typeof import.meta !== "undefined" && import.meta.env?.VITE_SUBSTRATE_HEALTH_REPORT === "1";
  } catch {
    return false;
  }
}

function gatewayBaseUrl() {
  try {
    const env = import.meta.env;
    const base = String(env.VITE_LIVE_GATEWAY_BASE || env.VITE_GATEWAY_HTTP || "").trim();
    if (!base) return "";
    return base.replace(/\/rhizoh\/llm\/?$/i, "").replace(/\/+$/, "");
  } catch {
    return "";
  }
}

function gatewayToken() {
  try {
    return String(import.meta.env?.VITE_GATEWAY_TOKEN || "").trim();
  } catch {
    return "";
  }
}

/**
 * @param {() => import("../../studio/types/rskOntology.js").StudioKernelState} getState
 */
export async function reportSubstrateHealthToGatewayV0(getState) {
  if (!reportEnabled() || typeof fetch === "undefined") {
    return { ok: false, reason: "disabled" };
  }
  const base = gatewayBaseUrl();
  if (!base) return { ok: false, reason: "no_gateway_base" };

  const seal = getState().realitySeal;
  const realityHealth = buildRealityHealthMetricsSnapshotV0(seal);
  const token = gatewayToken();
  const headers = { "Content-Type": "application/json" };
  if (token) headers["X-Castle-Gateway-Token"] = token;

  try {
    const res = await fetch(`${base}/rhizoh/substrate/health`, {
      method: "POST",
      headers,
      body: JSON.stringify({
        schema: SUBSTRATE_HEALTH_REPORT_SCHEMA_V0,
        ts: Date.now(),
        realityHealth
      }),
      keepalive: true
    });
    if (!res.ok) {
      return { ok: false, reason: `http_${res.status}` };
    }
    return { ok: true };
  } catch {
    return { ok: false, reason: "network_error" };
  }
}

/**
 * @param {() => import("../../studio/types/rskOntology.js").StudioKernelState} getState
 * @param {{ intervalMs?: number }} [opts]
 * @returns {() => void}
 */
export function installSubstrateHealthReportV0(getState, opts = {}) {
  if (!reportEnabled() || typeof window === "undefined") {
    return () => {};
  }
  const intervalMs = Number(opts.intervalMs) || SUBSTRATE_HEALTH_REPORT_INTERVAL_MS_V0;
  const tick = () => {
    void reportSubstrateHealthToGatewayV0(getState);
  };
  tick();
  const id = window.setInterval(tick, intervalMs);
  return () => window.clearInterval(id);
}

export function isSubstrateHealthReportEnabledV0() {
  return reportEnabled();
}
