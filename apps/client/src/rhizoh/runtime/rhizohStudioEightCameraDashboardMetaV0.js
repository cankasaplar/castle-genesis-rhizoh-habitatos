/**
 * Studio 8-camera dashboard layout + tile copy — read-only presentation layer.
 * RESEARCH-ONLY — no execution authority.
 */

import { STUDIO_EIGHT_CAMERA_IDS_V0 } from "./rhizohStudioVisibilitySnapshotV0.js";

/** 2×4 grid order (left→right, top→bottom). */
export const STUDIO_EIGHT_CAMERA_GRID_ORDER_V0 = Object.freeze([
  "chess_arena",
  "go_arena",
  "checkers_arena",
  "academy",
  "habitat",
  "memory",
  "world_sports",
  "spatial"
]);

const CAMERA_LABELS_V0 = Object.freeze({
  chess_arena: { en: "Chess Arena", tr: "Satranç Arenası" },
  go_arena: { en: "Go Arena", tr: "Go Arenası" },
  checkers_arena: { en: "Checkers", tr: "Dama" },
  academy: { en: "Academy", tr: "Akademi" },
  habitat: { en: "Habitat", tr: "Habitat" },
  memory: { en: "Memory", tr: "Hafıza" },
  world_sports: { en: "WorldSports", tr: "Dünya Sporları" },
  spatial: { en: "Spatial", tr: "Mekânsal" }
});

/**
 * @param {string} id
 * @param {"en"|"tr"} locale
 */
export function resolveStudioEightCameraTitleV0(id, locale = "en") {
  const row = CAMERA_LABELS_V0[id];
  if (!row) return id.replace(/_/g, " ");
  return locale === "tr" ? row.tr : row.en;
}

/**
 * @param {string} id
 * @returns {string|null}
 */
export function resolveStudioEightCameraHrefV0(id) {
  switch (id) {
    case "chess_arena":
      return "/world/space?channel=chess&broadcast=1";
    case "go_arena":
      return "/world/space?channel=go&broadcast=1";
    case "checkers_arena":
      return "/world/space?channel=checkers&broadcast=1";
    case "academy":
      return "/academy/observe";
    case "habitat":
      return "/academy/observe?mode=stream";
    case "memory":
      return "/academy/observe?mode=stream";
    case "world_sports":
      return "/world/space?channel=world_sports";
    case "spatial":
      return null;
    default:
      return null;
  }
}

/**
 * @param {string} id
 * @param {object} cam
 * @param {object} snap
 * @param {"en"|"tr"} locale
 */
export function formatStudioEightCameraTileV0(id, cam, snap, locale = "en") {
  const tr = locale === "tr";
  const learning = snap?.learningCameras || {};
  const academy = snap?.academyUnion || {};
  const habitat = snap?.habitatClimate || {};
  const bridge = snap?.worldBridge || {};

  let status = tr ? "beklemede" : "idle";
  let primary = "—";
  let secondary = tr ? "gözlem katmanı" : "observation layer";

  if (id === "chess_arena") {
    const moves = cam?.movesSeen ?? learning.chess?.movesSeen ?? 0;
    if (cam?.clusterRunning) status = tr ? "canlı" : "live";
    else if (cam?.armed) status = tr ? "aktif" : "active";
    primary = tr ? `${moves} hamle` : `${moves} moves`;
    secondary = academy.unionLabel || "chess_solo";
  } else if (id === "go_arena") {
    const moves = cam?.movesSeen ?? learning.go?.movesSeen ?? 0;
    if (cam?.armed) status = tr ? "aktif" : "active";
    primary = tr ? `${moves} hamle` : `${moves} moves`;
    secondary = learning.go?.causalSpaceId ? "go.causal" : tr ? "KataGo opsiyonel" : "KataGo optional";
  } else if (id === "checkers_arena") {
    const moves = cam?.movesSeen ?? learning.checkers?.movesSeen ?? 0;
    if (cam?.armed) status = tr ? "aktif" : "active";
    primary = tr ? `${moves} hamle` : `${moves} moves`;
    secondary = tr ? "dama gözlemi" : "checkers observe";
  } else if (id === "academy") {
    if (cam?.armed) status = tr ? "birleşik" : "union";
    primary = academy.unionLabel || "—";
    secondary = tr
      ? `${academy.totalMovesSeen ?? 0} toplam hamle`
      : `${academy.totalMovesSeen ?? 0} total moves`;
  } else if (id === "habitat") {
    if (cam?.armed) status = tr ? "iklim" : "climate";
    primary = habitat.climateLabel || cam?.climateLabel || "—";
    secondary = habitat.horizon || "session_v0";
  } else if (id === "memory") {
    const count = cam?.nodeCount ?? bridge.memoryNodeCount ?? 0;
    if (count > 0) status = tr ? "dolu" : "populated";
    primary = tr ? `${count} düğüm` : `${count} nodes`;
    secondary = tr ? "World Bridge graf" : "World Bridge graph";
  } else if (id === "world_sports") {
    const live = cam?.liveMatchCount ?? 0;
    const pins = cam?.pinCount ?? 0;
    if (live > 0 || pins > 0) status = tr ? "besleme" : "feed";
    primary = tr ? `${live} canlı · ${pins} pin` : `${live} live · ${pins} pins`;
    secondary = tr ? "gateway meta" : "gateway meta";
  } else if (id === "spatial") {
    status = tr ? "tutuldu" : "held";
    primary = tr ? "legal hold" : "legal hold";
    secondary = cam?.phase ? String(cam.phase) : tr ? "Cesium kapalı" : "Cesium off";
  }

  const armed = Boolean(cam?.armed);
  const live = Boolean(cam?.clusterRunning || (id === "chess_arena" && armed && status === "live"));
  const held = id === "spatial" && Boolean(cam?.legalHold);

  return Object.freeze({
    id,
    title: resolveStudioEightCameraTitleV0(id, locale),
    status,
    primary,
    secondary,
    armed,
    live,
    held,
    href: resolveStudioEightCameraHrefV0(id)
  });
}

/**
 * @param {object} snap
 * @param {"en"|"tr"} locale
 */
export function buildStudioEightCameraDashboardTilesV0(snap, locale = "en") {
  const cameras = snap?.eightCameras || {};
  return Object.freeze(
    STUDIO_EIGHT_CAMERA_GRID_ORDER_V0.map((id) => {
      const cam = cameras[id] || { id, armed: false };
      return formatStudioEightCameraTileV0(id, cam, snap, locale);
    })
  );
}

export function assertStudioEightCameraGridOrderV0() {
  const missing = STUDIO_EIGHT_CAMERA_GRID_ORDER_V0.filter(
    (id) => !STUDIO_EIGHT_CAMERA_IDS_V0.includes(id)
  );
  if (missing.length > 0) {
    throw new Error(`studio_eight_camera_grid_order_invalid:${missing.join(",")}`);
  }
}
