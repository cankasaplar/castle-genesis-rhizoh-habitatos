/**
 * Local ghost castle anchors — private localStorage until user publishes.
 */

const STORAGE_KEY_V0 = "rhizoh.local.ghost_castle.v0";
export const LOCAL_GHOST_CASTLE_EVENT_V0 = "rhizoh:local-ghost-castle-v0";

/**
 * @returns {Array<{ id: string, lat: number, lon: number, label: string, private: boolean, atMs: number }>}
 */
export function readLocalGhostCastleAnchorsV0() {
  if (typeof localStorage === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY_V0);
    const parsed = raw ? JSON.parse(raw) : [];
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (row) => row && Number.isFinite(row.lat) && Number.isFinite(row.lon) && row.id
    );
  } catch {
    return [];
  }
}

function writeLocalGhostCastleAnchorsV0(rows) {
  if (typeof localStorage === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY_V0, JSON.stringify(rows.slice(-24)));
  } catch {
    /* noop */
  }
}

function publishGhostCastleEventV0(detail) {
  if (typeof window === "undefined") return;
  try {
    window.dispatchEvent(new CustomEvent(LOCAL_GHOST_CASTLE_EVENT_V0, { detail }));
  } catch {
    /* noop */
  }
}

/**
 * @param {{ lat: number, lon: number, label?: string }} input
 */
export function createLocalGhostCastleAnchorV0(input) {
  if (!Number.isFinite(input?.lat) || !Number.isFinite(input?.lon)) return null;
  const row = Object.freeze({
    id: `ghost_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    lat: Number(input.lat),
    lon: Number(input.lon),
    label: String(input.label || "Ghost Castle"),
    private: true,
    atMs: Date.now()
  });
  const next = [...readLocalGhostCastleAnchorsV0(), row];
  writeLocalGhostCastleAnchorsV0(next);
  publishGhostCastleEventV0(Object.freeze({ action: "create", anchor: row }));
  return row;
}

/**
 * @param {string} id
 */
export function removeLocalGhostCastleAnchorV0(id) {
  const key = String(id || "").trim();
  if (!key) return false;
  const prev = readLocalGhostCastleAnchorsV0();
  const next = prev.filter((row) => row.id !== key);
  if (next.length === prev.length) return false;
  writeLocalGhostCastleAnchorsV0(next);
  publishGhostCastleEventV0(Object.freeze({ action: "remove", id: key }));
  return true;
}
