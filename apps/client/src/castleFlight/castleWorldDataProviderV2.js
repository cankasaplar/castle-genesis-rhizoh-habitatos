import { ISTANBUL_GEO } from "./geo.js";

/**
 * CASTLE_WORLD_DATA V2 — No-Fiction Fallback Principle.
 * Overpass = best-effort feed. Cache = temporal memory of real fetches.
 * On miss: empty overlays + degraded representation — never synthetic POI/buildings.
 *
 * @see docs/RHIZOH_WORLD_MESH_MENTAL_MODEL_V1.0.md (2D primary; 3D optional projection)
 */

export const CASTLE_WORLD_DATA_SCHEMA_V2 = "castle.world.data.v2";
export const CASTLE_WORLD_NO_FICTION_POLICY_V2 = "representation_degradation_not_substitution";

const CACHE_KEY_POI_V2 = "castle.world.poi.v2";
const CACHE_KEY_BUILDINGS_V2 = "castle.world.buildings.v2";
const CACHE_TTL_MS = 24 * 60 * 60 * 1000;

/** @type {readonly string[]} */
export const OVERPASS_ENDPOINTS_V2 = Object.freeze([
  "https://overpass-api.de/api/interpreter",
  "https://overpass.kumi.systems/api/interpreter"
]);

/**
 * @typedef {"idle" | "live" | "cached" | "degraded_empty"} WorldRepresentationV2
 * @typedef {"overpass" | "cache" | "unavailable"} WorldDataFeedV2
 */

/** @type {{
 *   schema: string,
 *   policy: string,
 *   feed: WorldDataFeedV2,
 *   representation: WorldRepresentationV2,
 *   synthesis: boolean,
 *   lastSuccessAtMs: number | null,
 *   lastFailAtMs: number | null,
 *   lastError: string | null,
 *   endpoint: string | null,
 *   poiCount: number,
 *   buildingCount: number,
 *   userHint: string | null
 * }} */
let worldDataStateV2 = {
  schema: CASTLE_WORLD_DATA_SCHEMA_V2,
  policy: CASTLE_WORLD_NO_FICTION_POLICY_V2,
  feed: "unavailable",
  representation: "idle",
  synthesis: false,
  lastSuccessAtMs: null,
  lastFailAtMs: null,
  lastError: null,
  endpoint: null,
  poiCount: 0,
  buildingCount: 0,
  userHint: null
};

/**
 * @returns {typeof worldDataStateV2}
 */
export function getCastleWorldDataStateV2() {
  return Object.freeze({ ...worldDataStateV2 });
}

/** @deprecated use getCastleWorldDataStateV2 */
export const getCastleWorldDataStateV0 = getCastleWorldDataStateV2;

/**
 * @param {Partial<typeof worldDataStateV2>} patch
 */
export function publishCastleWorldDataStateV2(patch) {
  worldDataStateV2 = {
    ...worldDataStateV2,
    ...patch,
    schema: CASTLE_WORLD_DATA_SCHEMA_V2,
    policy: CASTLE_WORLD_NO_FICTION_POLICY_V2,
    synthesis: false
  };
  const snap = getCastleWorldDataStateV2();
  if (typeof window !== "undefined") {
    window.__CASTLE_WORLD_DATA__ = Object.freeze({ ...snap, state: snap });
    try {
      window.dispatchEvent(new CustomEvent("castle:world-data-v2", { detail: snap }));
    } catch {
      /* noop */
    }
  }
  return snap;
}

/** @deprecated */
export const publishCastleWorldDataStateV0 = publishCastleWorldDataStateV2;

/**
 * @param {string} key
 * @returns {unknown[] | null}
 */
function readWorldDataCacheV2(key) {
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
function writeWorldDataCacheV2(key, rows) {
  if (typeof localStorage === "undefined" || !Array.isArray(rows) || !rows.length) return;
  try {
    localStorage.setItem(
      key,
      JSON.stringify(Object.freeze({ atMs: Date.now(), rows: rows.slice(0, 400), source: "overpass" }))
    );
  } catch {
    /* quota */
  }
}

/**
 * @param {string} query
 * @param {{ timeoutMs?: number }} [opts]
 */
async function fetchOverpassV2(query, opts = {}) {
  const timeoutMs = opts.timeoutMs ?? 12_000;
  /** @type {Error | null} */
  let lastErr = null;
  for (const url of OVERPASS_ENDPOINTS_V2) {
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

const DEGRADED_EMPTY_HINT_TR_V2 =
  "Dünya verisi geçici olarak yok — harita katmanı (2D) görünür; POI/bina katmanı boş (uydurma veri yok).";

/**
 * @param {[string, string][]} tagPairs
 * @param {number} limit
 */
export async function loadCastleWorldImportantPlacesV2(tagPairs, limit = 220) {
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
    const { json, endpoint } = await fetchOverpassV2(q, { timeoutMs: 14_000 });
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
    writeWorldDataCacheV2(CACHE_KEY_POI_V2, rows);
    publishCastleWorldDataStateV2({
      feed: "overpass",
      representation: rows.length ? "live" : "degraded_empty",
      lastSuccessAtMs: Date.now(),
      lastError: null,
      endpoint,
      poiCount: rows.length,
      userHint: rows.length ? null : DEGRADED_EMPTY_HINT_TR_V2
    });
    console.info("[CASTLE_WORLD_DATA_V2] poi", { feed: "overpass", count: rows.length, endpoint });
    return Object.freeze({ rows, feed: "overpass", representation: rows.length ? "live" : "degraded_empty" });
  } catch (err) {
    const msg = String(err?.message || err);
    const cached = readWorldDataCacheV2(CACHE_KEY_POI_V2);
    if (cached?.length) {
      const rows = cached.slice(0, limit);
      publishCastleWorldDataStateV2({
        feed: "cache",
        representation: "cached",
        lastFailAtMs: Date.now(),
        lastError: msg,
        endpoint: null,
        poiCount: rows.length,
        userHint: null
      });
      console.warn("[CASTLE_WORLD_DATA_V2] poi", { feed: "cache", count: rows.length, reason: msg });
      return Object.freeze({ rows, feed: "cache", representation: "cached" });
    }
    publishCastleWorldDataStateV2({
      feed: "unavailable",
      representation: "degraded_empty",
      lastFailAtMs: Date.now(),
      lastError: msg,
      endpoint: null,
      poiCount: 0,
      userHint: DEGRADED_EMPTY_HINT_TR_V2
    });
    console.warn("[CASTLE_WORLD_DATA_V2] poi", { feed: "unavailable", count: 0, reason: msg, noFiction: true });
    return Object.freeze({ rows: [], feed: "unavailable", representation: "degraded_empty" });
  }
}

/** @deprecated */
export const loadCastleWorldImportantPlacesV0 = loadCastleWorldImportantPlacesV2;

/**
 * @param {number} limit
 */
export async function loadCastleWorldBuildingFootprintsV2(limit = 280) {
  const bbox = `${ISTANBUL_GEO.latMin},${ISTANBUL_GEO.lonMin},${ISTANBUL_GEO.latMax},${ISTANBUL_GEO.lonMax}`;
  const q = `
[out:json][timeout:25];
(
  way["building"](${bbox});
);
out center tags;
`;

  try {
    const { json, endpoint } = await fetchOverpassV2(q, { timeoutMs: 10_000 });
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
    writeWorldDataCacheV2(CACHE_KEY_BUILDINGS_V2, rows);
    publishCastleWorldDataStateV2({
      feed: "overpass",
      representation: rows.length ? worldDataStateV2.representation : "degraded_empty",
      lastSuccessAtMs: Date.now(),
      lastError: null,
      endpoint,
      buildingCount: rows.length
    });
    console.info("[CASTLE_WORLD_DATA_V2] buildings", { feed: "overpass", count: rows.length, endpoint });
    return Object.freeze({ rows, feed: "overpass", representation: rows.length ? "live" : "degraded_empty" });
  } catch (err) {
    const msg = String(err?.message || err);
    const cached = readWorldDataCacheV2(CACHE_KEY_BUILDINGS_V2);
    if (cached?.length) {
      const rows = cached.slice(0, limit);
      publishCastleWorldDataStateV2({
        feed: "cache",
        lastFailAtMs: Date.now(),
        lastError: msg,
        buildingCount: rows.length
      });
      console.warn("[CASTLE_WORLD_DATA_V2] buildings", { feed: "cache", count: rows.length, reason: msg });
      return Object.freeze({ rows, feed: "cache", representation: "cached" });
    }
    publishCastleWorldDataStateV2({
      feed: "unavailable",
      representation: worldDataStateV2.poiCount > 0 ? worldDataStateV2.representation : "degraded_empty",
      lastFailAtMs: Date.now(),
      lastError: msg,
      buildingCount: 0,
      userHint: worldDataStateV2.userHint || DEGRADED_EMPTY_HINT_TR_V2
    });
    console.warn("[CASTLE_WORLD_DATA_V2] buildings", { feed: "unavailable", count: 0, reason: msg, noFiction: true });
    return Object.freeze({ rows: [], feed: "unavailable", representation: "degraded_empty" });
  }
}

/** @deprecated */
export const loadCastleWorldBuildingFootprintsV0 = loadCastleWorldBuildingFootprintsV2;
