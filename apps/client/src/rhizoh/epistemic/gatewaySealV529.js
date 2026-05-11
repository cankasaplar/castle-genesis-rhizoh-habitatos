import { getCastleFlightConfig } from "../../castleFlight/castleFlightConfig.js";
import { getOrCreateCastleDevUid, getRhizohGatewayHealthBase } from "../useRhizohGatewayMonitor.js";
import {
  getEpistemicGatewayRoutesReachable,
  markEpistemicGatewayRoutesMissing,
  markEpistemicGatewayRoutesOk
} from "./epistemicGatewayCapability.js";
import { enqueueEpistemicLedgerEntry } from "./epistemicLedgerStreamV529.js";

/**
 * @param {string} text
 * @returns {Promise<string>}
 */
export async function sha256HexUtf8(text) {
  const buf = new TextEncoder().encode(String(text ?? ""));
  const digest = await crypto.subtle.digest("SHA-256", buf);
  return Array.from(new Uint8Array(digest), (b) => b.toString(16).padStart(2, "0")).join("");
}

/**
 * Gateway POST /rhizoh/epistemic/seal — HMAC ile attestable artifact.
 * @param {object} body
 * @param {string} [idToken]
 * @returns {Promise<{ ok: boolean, hash?: string, signature?: string, attestation?: object, error?: string }>}
 */
export async function requestEpistemicSealFromGateway(body, idToken = "") {
  const base = getRhizohGatewayHealthBase();
  if (!base) return { ok: false, error: "no_gateway_base" };
  if (getEpistemicGatewayRoutesReachable() === false) {
    return { ok: false, error: "epistemic_remote_routes_missing" };
  }
  const cfg = getCastleFlightConfig();
  const headers = {
    "Content-Type": "application/json",
    "X-Castle-Dev-Uid": getOrCreateCastleDevUid()
  };
  const gt = String(cfg.gatewayToken || "").trim();
  if (gt) headers["X-Castle-Gateway-Token"] = gt;
  const tok = String(idToken || "").trim();
  if (tok) headers.Authorization = `Bearer ${tok}`;
  try {
    const fetchOpts = {
      method: "POST",
      headers,
      body: JSON.stringify(body)
    };
    if (typeof AbortSignal !== "undefined" && typeof AbortSignal.timeout === "function") {
      fetchOpts.signal = AbortSignal.timeout(14_000);
    }
    const res = await fetch(`${String(base).replace(/\/+$/, "")}/rhizoh/epistemic/seal`, fetchOpts);
    const j = await res.json().catch(() => ({}));
    if (res.status === 404) {
      markEpistemicGatewayRoutesMissing("seal", base);
      return { ok: false, error: j.error || "http_404" };
    }
    if (!res.ok || !j.ok) {
      return { ok: false, error: j.error || `http_${res.status}` };
    }
    markEpistemicGatewayRoutesOk();
    return {
      ok: true,
      hash: j.hash,
      signature: j.signature,
      attestation: j.attestation
    };
  } catch (e) {
    return { ok: false, error: String(e?.message || e || "seal_fetch_failed") };
  }
}

/**
 * @param {object} trace rhizohPersistTraceFromOut çıktısı
 * @param {{
 *   runtimeHash: string,
 *   modelRoute: { provider?: string | null, model?: string | null },
 *   memoryDigest: string,
 *   worldSnapshotHash: string,
 *   realityMode?: string | null,
 *   governanceState?: string | null,
 *   idToken?: string
 * }} input
 */
export async function sealRhizohEpistemicTrace(trace, input) {
  if (!trace?.epistemic) return trace;
  const body = {
    truth_contract: trace.epistemic,
    runtime_hash: input.runtimeHash,
    model_route: input.modelRoute || { provider: null, model: null },
    memory_digest: input.memoryDigest,
    world_snapshot_hash: input.worldSnapshotHash,
    timestamp: trace.epistemic.at || Date.now()
  };
  const r = await requestEpistemicSealFromGateway(body, input.idToken);
  if (r.ok && r.hash) {
    trace.epistemic.hash = r.hash;
    trace.epistemic.signature = r.signature;
    trace.epistemic.attestation = r.attestation;
  } else {
    trace.epistemic.sealError = r.error || "seal_failed";
  }
  try {
    const primaryLayer = String(trace.epistemic?.routing?.primaryLayer || "L10");
    const sealState = r.ok && r.hash ? "VERIFIED" : trace.epistemic?.sealError ? "DEGRADED" : "UNSIGNED";
    enqueueEpistemicLedgerEntry(
      {
        timestamp: Number(trace.epistemic?.at || Date.now()),
        traceId: String(trace.traceId || ""),
        turnId: String(trace.turnId || ""),
        primaryLayer,
        sealState,
        signature: r.signature || "",
        modelRoute: input.modelRoute || { provider: null, model: null },
        runtimeHash: input.runtimeHash,
        memoryDigest: input.memoryDigest,
        worldSnapshotHash: input.worldSnapshotHash,
        realityMode: String(input.realityMode || "UNKNOWN"),
        governanceState: String(input.governanceState || "NORMAL"),
        source: String(trace.source || "client")
      },
      input.idToken || ""
    );
  } catch {
    /* noop */
  }
  return trace;
}
