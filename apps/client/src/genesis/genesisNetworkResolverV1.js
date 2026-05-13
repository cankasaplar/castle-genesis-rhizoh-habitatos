import { getGenesisProtocolGatewayOrigin } from "../castleFlight/castleFlightConfig.js";

/** @public Observability contract id — not an execution engine. */
export const GENESIS_NETWORK_RESOLVER_SCHEMA = "castle.genesis.network_resolver.v1";

const ORIGIN_TTL_MS = 45_000;

/** @type {{ value: string; at: number }} */
let originCache = { value: "", at: 0 };

export function invalidateGenesisGatewayOriginCache() {
  originCache = { value: "", at: 0 };
}

/**
 * Tek giriş: gateway HTTPS origin (Genesis runtime / SSE / checkpoint GET yüzeyleri).
 * UI bileşenleri URL birleştirmez; bu modülden sorar.
 */
export function resolveGenesisGatewayOriginCached() {
  const now = Date.now();
  if (originCache.value && now - originCache.at < ORIGIN_TTL_MS) {
    return originCache.value;
  }
  const v = String(getGenesisProtocolGatewayOrigin() || "").trim();
  originCache = { value: v, at: now };
  return v;
}

/**
 * @param {string} origin
 * @returns {Record<string, string | ((...args: unknown[]) => string)>}
 */
export function buildGenesisEndpointUrls(origin) {
  const o = String(origin || "").trim().replace(/\/+$/, "");
  if (!o) {
    return {
      origin: "",
      runtimeUrl: "",
      streamUrl: "",
      healthLiveUrl: "",
      checkpointLatestUrl: "",
      checkpointBySeqUrl: () => "",
      checkpointRangeUrl: () => "",
      checkpointLineageUrl: () => ""
    };
  }
  return {
    origin: o,
    runtimeUrl: `${o}/rhizoh/genesis/runtime`,
    streamUrl: `${o}/rhizoh/genesis/stream`,
    healthLiveUrl: `${o}/health/live`,
    checkpointLatestUrl: `${o}/rhizoh/genesis/checkpoint/latest`,
    checkpointBySeqUrl: (seq) =>
      `${o}/rhizoh/genesis/checkpoint/by-seq/${encodeURIComponent(String(seq).trim())}`,
    checkpointRangeUrl: (from, to) =>
      `${o}/rhizoh/genesis/checkpoint/range?from=${encodeURIComponent(String(from))}&to=${encodeURIComponent(String(to))}`,
    checkpointLineageUrl: (seq) =>
      `${o}/rhizoh/genesis/checkpoint/lineage?seq=${encodeURIComponent(String(seq).trim())}`
  };
}

export function resolveGenesisNetworkBundle() {
  const origin = resolveGenesisGatewayOriginCached();
  const urls = buildGenesisEndpointUrls(origin);
  return {
    schema: GENESIS_NETWORK_RESOLVER_SCHEMA,
    resolvedAt: Date.now(),
    ...urls
  };
}

/**
 * Hafif canlılık — gateway süreci ayakta mı (CORS: tarayıcıda yalnız izinli origin’ler).
 * @param {{ timeoutMs?: number }} [opts]
 * @returns {Promise<{ ok: boolean; status?: number; phase?: string; error?: string; json?: unknown }>}
 */
export async function probeGenesisGatewayHealth(opts = {}) {
  const timeoutMs = Math.max(800, Number(opts.timeoutMs) || 4000);
  const origin = resolveGenesisGatewayOriginCached();
  if (!origin) return { ok: false, phase: "no_origin" };
  const ctrl = new AbortController();
  const tid = globalThis.setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const res = await fetch(`${origin}/health/live`, { method: "GET", cache: "no-store", signal: ctrl.signal });
    const json = await res.json().catch(() => null);
    return { ok: res.ok, status: res.status, json };
  } catch (e) {
    const err = String(/** @type {any} */ (e)?.name === "AbortError" ? "timeout" : e?.message || e || "network");
    return { ok: false, phase: "network", error: err };
  } finally {
    globalThis.clearTimeout(tid);
  }
}
