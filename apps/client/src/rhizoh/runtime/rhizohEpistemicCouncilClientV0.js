/**
 * Epistemic Council client v0 — gateway anomaly reasoning wire.
 * RESEARCH-ONLY
 */

import { resolveGenesisGatewayHttpBaseV0 } from "../../castleFlight/castleFlightConfig.js";

export const RHIZOH_COUNCIL_CLIENT_SCHEMA_V0 = "castle.rhizoh.epistemic_council_client.v0";

const COUNCIL_FETCH_TIMEOUT_MS_V0 = 4_500;

/**
 * @param {object} payload
 */
export async function fetchCouncilAnomalyReasoningV0(payload = {}) {
  const base = String(resolveGenesisGatewayHttpBaseV0() || "").replace(/\/+$/, "");
  if (!base) {
    return Object.freeze({
      schema: RHIZOH_COUNCIL_CLIENT_SCHEMA_V0,
      ok: false,
      reason: "gateway_base_unresolved"
    });
  }

  const url = `${base}/rhizoh/council/anomaly-reasoning`;
  const controller = typeof AbortController !== "undefined" ? new AbortController() : null;
  const timer =
    controller &&
    setTimeout(() => {
      try {
        controller.abort();
      } catch {
        /* noop */
      }
    }, COUNCIL_FETCH_TIMEOUT_MS_V0);

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: Object.freeze({ "Content-Type": "application/json" }),
      body: JSON.stringify({
        matchId: payload.matchId || null,
        slotId: payload.slotId ?? null,
        fen: payload.fen || null,
        triggers: payload.triggers || [],
        sessionId: payload.sessionId || null,
        stressRunId: payload.stressRunId || null,
        conflictGraph: payload.conflictGraph || null,
        memoryGraph: payload.memoryGraph || null
      }),
      signal: controller?.signal
    });

    if (!res.ok) {
      return Object.freeze({
        schema: RHIZOH_COUNCIL_CLIENT_SCHEMA_V0,
        ok: false,
        reason: `gateway_http_${res.status}`,
        status: res.status
      });
    }

    const body = await res.json();
    return Object.freeze({
      schema: RHIZOH_COUNCIL_CLIENT_SCHEMA_V0,
      ok: Boolean(body?.ok),
      gateway: body,
      anomalyScore: body?.anomalyScore ?? null,
      reasoningChain: body?.reasoningChain || null,
      synthesis: body?.synthesis || null,
      lenses: body?.lenses || null
    });
  } catch (err) {
    return Object.freeze({
      schema: RHIZOH_COUNCIL_CLIENT_SCHEMA_V0,
      ok: false,
      reason: String(err?.name || err?.message || "fetch_failed")
    });
  } finally {
    if (timer) clearTimeout(timer);
  }
}
