/**
 * CASTLE world anchors — empty-safe; studio event source (no synthetic geography).
 */

export const CASTLE_WORLD_ANCHOR_SCHEMA_V0 = "castle.world.anchor.v0";
export const CASTLE_WORLD_ANCHOR_EVENT_V0 = "castle:world-anchor-v0";

/** @type {import("./castleWorldAnchorV0.js").CastleWorldAnchorV0[]} */
const anchors = [];
const MAX_ANCHORS = 48;

/**
 * @typedef {{
 *   id: string,
 *   lat: number,
 *   lon: number,
 *   label: string,
 *   source: "map_pick" | "user" | "studio",
 *   atMs: number,
 *   feed: string | null
 * }} CastleWorldAnchorV0
 */

/**
 * @returns {readonly CastleWorldAnchorV0[]}
 */
export function listCastleWorldAnchorsV0() {
  return Object.freeze(anchors.slice());
}

/**
 * @param {Omit<CastleWorldAnchorV0, "id" | "atMs"> & { id?: string }} input
 * @returns {CastleWorldAnchorV0 | null}
 */
export function createCastleWorldAnchorV0(input) {
  if (!Number.isFinite(input?.lat) || !Number.isFinite(input?.lon)) return null;
  const row = Object.freeze({
    id: String(input.id || `anchor_${Date.now()}_${anchors.length}`),
    lat: Number(input.lat),
    lon: Number(input.lon),
    label: String(input.label || "Anchor"),
    source: input.source || "map_pick",
    atMs: Date.now(),
    feed: input.feed != null ? String(input.feed) : null
  });
  anchors.push(row);
  while (anchors.length > MAX_ANCHORS) anchors.shift();
  if (typeof window !== "undefined") {
    window.__CASTLE_WORLD_ANCHORS__ = Object.freeze({
      schema: CASTLE_WORLD_ANCHOR_SCHEMA_V0,
      count: anchors.length,
      list: listCastleWorldAnchorsV0
    });
    try {
      window.dispatchEvent(new CustomEvent(CASTLE_WORLD_ANCHOR_EVENT_V0, { detail: row }));
    } catch {
      /* noop */
    }
  }
  return row;
}
