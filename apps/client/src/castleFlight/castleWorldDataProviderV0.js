/**
 * CASTLE_WORLD_DATA — network-fed world layer with cache + seed fallback.
 * Map ≠ UI: Overpass fail must not yield a silent empty world.
 */

import { ISTANBUL_GEO, ISTANBUL_POI } from "./geo.js";

export const CASTLE_WORLD_DATA_SCHEMA_V0 = "castle.world.data.v0";

const CACHE_KEY_POI_V0 = "castle.world.poi.v0";
const CACHE_KEY_BUILDINGS_V0 = "castle.world.buildings.v0";
const CACHE_TTL_MS = 24 * 60 * 60 * 1000;

/** @type {readonly string[]} */
export const OVERPASS_ENDPOINTS_V0 = Object.freeze([
  "https://overpass-api.de/api/interpreter",
  "https://overpass.kumi.systems/api/interpreter"
]);

/** @type {{ provider: string, lastSuccessAtMs: number | null, lastFailAtMs: number | null, lastError: string | null, endpoint: string | null, poiCount: number, buildingCount: number }} */
let worldDataStateV0 = {
  provider: "idle",
  lastSuccessAtMs: null,
  lastFailAtMs: null,
  lastError: null,
  endpoint: null,
  poiCount: 0,
  buildingCount: 0
};

/**
 * @returns {typeof worldDataStateV0}
 */
export function getCastleWorldDataStateV0() {
  return Object.freeze({ ...worldDataStateV0 });
}

/**
 * @param {Partial<typeof worldDataStateV0>} patch
 */
export function publishCastleWorldDataStateV0(patch) {
  worldDataStateV0 = { ...worldDataStateV0, ...patch };
  const snap = getCastleWorldDataStateV0();
  if (typeof window !== "undefined") {
    window.__CASTLE_WORLD_DATA__ = Object.freeze({
      schema: CASTLE_WORLD_DATA_SCHEMA_V0,
      ...snap,
      state: snap
    });
    try {
      window.dispatchEvent(
        new CustomEvent("castle:world-data-v0", { detail: snap })
      );
    } catch {
      /* noop */
    }
  }
  return snap;
}

/**
 * @param {string} key
 * @returns {unknown[] | null}
 */
function readWorldDataCacheV0(key) {
  if (typeof localStorage === "undefined") return null;
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") return null;
    const atMs = Number(parsed.atMs);
    if (!Number.isFinite(atMs) || Date.now() - atMs > CACHE_TTL_MS) return null;
    return Array.isArray(parsed.rows) ? parsed.rows : null;
  } catch {
    return null;
  }
}

/**
 * @param {string} key
 * @param {unknown[]} rows
 */
function writeWorldDataCacheV0(key, rows) {
  if (typeof localStorage === "undefined" || !Array.isArray(rows) || !rows.length) return;
  try {
    localStorage.setItem(
      key,
      JSON.stringify(Object.freeze({ atMs: Date.now(), rows: rows.slice(0, 400) }))
    );
  } catch {
    /* quota */
  }
}

/**
 * @param {string} query
 * @param {{ timeoutMs?: number }} [opts]
 */
async function fetchOverpassV0(query, opts = {}) {
  const timeoutMs = opts.timeoutMs ?? 12_000;
  /** @type {Error | null} */
  let lastErr = null;
  for (const url of OVERPASS_ENDPOINTS_V0) {
    try {
      const controller = new AbortController();
      const t = window.setTimeout(() => controller.abort(), timeoutMs);
      const res = await fetch(url, {
        method: "POST",
        body: query,
        signal: controller.signal,
        headers: { "Content-Type": "text/plain" }
      });
      window.clearTimeout(t);
      if (!res.ok) throw new Error(`Overpass ${res.status}`);
      return Object.freeze({ json: await res.json(), endpoint: url });
    } catch (e) {
      lastErr = e instanceof Error ? e : new Error(String(e));
    }
  }
  throw lastErr || new Error("Overpass unavailable");
}

/** @returns {import("./castleWorldDataProviderV0.js").WorldPlaceRowV0[]} */
export function createFallbackImportantPlacesV0() {
  return Object.entries(ISTANBUL_POI).map(([id, p]) => ({
    id: `fallback-${id}`,
    lat: p.lat,
    lon: p.lon,
    name: p.label,
    tags: { tourism: "attraction", castle_seed: "1" }
  }));
}

/**
 * @param {Record<string, { lat: number, lon: number, label?: string }>} [anchors]
 * @param {number} [maxCount]
 */
export function createFallbackBuildingFootprintsV0(anchors = ISTANBUL_POI, maxCount = 96) {
  /** @type {{ id: string, lat: number, lon: number, levels: number, height: number }[]} */
  const out = [];
  for (const [id, p] of Object.entries(anchors)) {
    for (let k = 0; k < 6 && out.length < maxCount; k++) {
      const angle = (k / 6) * Math.PI * 2;
      const d = 0.0018 + (k % 2) * 0.0008;
      out.push({
        id: `seed-b-${id}-${k}`,
        lat: p.lat + Math.sin(angle) * d,
        lon: p.lon + Math.cos(angle) * d,
        levels: 4 + (k % 4),
        height: 24 + (k % 5) * 10
      });
    }
  }
  return out;
}

/**
 * @typedef {{ id: string, lat: number, lon: number, name: string, tags: Record<string, string> }} WorldPlaceRowV0
 * @typedef {{ id: string, lat: number, lon: number, levels: number, height: number }} WorldBuildingRowV0
 * @typedef {{ rows: WorldPlaceRowV0[], source: "overpass" | "cache" | "seed" }} WorldPlacesLoadResultV0
 */

/**
 * @param {[string, string][]} tagPairs
 * @param {number} limit
 * @returns {Promise<WorldPlacesLoadResultV0>}
 */
export async function loadCastleWorldImportantPlacesV0(tagPairs, limit = 220) {
  const bbox = `${ISTANBUL_GEO.latMin},${ISTANBUL_GEO.lonMin},${ISTANBUL_GEO.latMax},${ISTANBUL_GEO.lonMax}`;
  const queryParts = tagPairs.map(([k, v]) => `node["${k}"="${v}"](${bbox});`).join("\n");
  const q = `
[out:json][timeout:25];
(
${queryParts}
);
out body;
`;

  try {
    const { json, endpoint } = await fetchOverpassV0(q, { timeoutMs: 14_000 });
    const rows = (Array.isArray(json?.elements) ? json.elements : [])
      .filter((r) => Number.isFinite(r?.lat) && Number.isFinite(r?.lon))
      .slice(0, limit)
      .map((r, i) => ({
        id: String(r.id ?? `n-${i}`),
        lat: Number(r.lat),
        lon: Number(r.lon),
        name: String(r?.tags?.name || r?.tags?.name_en || r?.tags?.operator || "Unnamed place"),
        tags: r.tags || {}
      }));
    writeWorldDataCacheV0(CACHE_KEY_POI_V0, rows);
    publishCastleWorldDataStateV0({
      provider: "overpass",
      lastSuccessAtMs: Date.now(),
      lastError: null,
      endpoint,
      poiCount: rows.length
    });
    if (typeof console !== "undefined" && console.info) {
      console.info("[CASTLE_WORLD_DATA] poi", { source: "overpass", count: rows.length, endpoint });
    }
    return Object.freeze({ rows, source: "overpass" });
  } catch (err) {
    const msg = String(err?.message || err);
    const cached = readWorldDataCacheV0(CACHE_KEY_POI_V0);
    if (cached?.length) {
      const rows = /** @type {WorldPlaceRowV0[]} */ (cached.slice(0, limit));
      publishCastleWorldDataStateV0({
        provider: "cache",
        lastFailAtMs: Date.now(),
        lastError: msg,
        endpoint: null,
        poiCount: rows.length
      });
      console.warn("[CASTLE_WORLD_DATA] poi", { source: "cache", count: rows.length, reason: msg });
      return Object.freeze({ rows, source: "cache" });
    }
    const rows = createFallbackImportantPlacesV0();
    publishCastleWorldDataStateV0({
      provider: "seed",
      lastFailAtMs: Date.now(),
      lastError: msg,
      endpoint: null,
      poiCount: rows.length
    });
    console.warn("[CASTLE_WORLD_DATA] poi", { source: "seed", count: rows.length, reason: msg });
    return Object.freeze({ rows, source: "seed" });
  }
}

/**
 * @param {number} limit
 * @returns {Promise<{ rows: WorldBuildingRowV0[], source: "overpass" | "cache" | "seed" }>}
 */
export async function loadCastleWorldBuildingFootprintsV0(limit = 280) {
  const bbox = `${ISTANBUL_GEO.latMin},${ISTANBUL_GEO.lonMin},${ISTANBUL_GEO.latMax},${ISTANBUL_GEO.lonMax}`;
  const q = `
[out:json][timeout:25];
(
  way["building"](${bbox});
);
out center tags;
`;

  try {
    const { json, endpoint } = await fetchOverpassV0(q, { timeoutMs: 10_000 });
    const rows = (Array.isArray(json?.elements) ? json.elements : [])
      .filter((r) => Number.isFinite(r?.center?.lat) && Number.isFinite(r?.center?.lon))
      .slice(0, limit)
      .map((r, i) => ({
        id: String(r.id ?? `b-${i}`),
        lat: Number(r.center.lat),
        lon: Number(r.center.lon),
        levels: Number(r?.tags?.["building:levels"] || 0),
        height: Number(r?.tags?.height || 0)
      }));
    writeWorldDataCacheV0(CACHE_KEY_BUILDINGS_V0, rows);
    publishCastleWorldDataStateV0({
      provider: "overpass",
      lastSuccessAtMs: Date.now(),
      lastError: null,
      endpoint,
      buildingCount: rows.length
    });
    console.info("[CASTLE_WORLD_DATA] buildings", { source: "overpass", count: rows.length, endpoint });
    return Object.freeze({ rows, source: "overpass" });
  } catch (err) {
    const msg = String(err?.message || err);
    const cached = readWorldDataCacheV0(CACHE_KEY_BUILDINGS_V0);
    if (cached?.length) {
      const rows = /** @type {WorldBuildingRowV0[]} */ (cached.slice(0, limit));
      publishCastleWorldDataStateV0({
        provider: "cache",
        lastFailAtMs: Date.now(),
        lastError: msg,
        buildingCount: rows.length
      });
      console.warn("[CASTLE_WORLD_DATA] buildings", { source: "cache", count: rows.length, reason: msg });
      return Object.freeze({ rows, source: "cache" });
    }
    const rows = createFallbackBuildingFootprintsV0();
    publishCastleWorldDataStateV0({
      provider: "seed",
      lastFailAtMs: Date.now(),
      lastError: msg,
      buildingCount: rows.length
    });
    console.warn("[CASTLE_WORLD_DATA] buildings", { source: "seed", count: rows.length, reason: msg });
    return Object.freeze({ rows, source: "seed" });
  }
}
