/**
 * UGL ActionSpace — normalized action encoding.
 * RESEARCH-ONLY
 */

import { RHIZOH_UGL_ACTION_TYPE_V0, RHIZOH_UGL_GAME_TYPE_V0 } from "./rhizohUglSchemaV0.js";

export const RHIZOH_UGL_ACTION_SPACE_SCHEMA_V0 = "castle.rhizoh.ugl_action_space.v0";

const CHESS_FILES_V0 = "abcdefgh";

/**
 * @param {string} uci
 */
function parseChessUciV0(uci) {
  const s = String(uci || "").trim().toLowerCase();
  if (s.length < 4) return null;
  return Object.freeze({
    from: s.slice(0, 2),
    to: s.slice(2, 4),
    promotion: s[4] || null,
    uci: s
  });
}

/**
 * @param {string} uci
 * @returns {number}
 */
export function chessUciToActionIndexV0(uci) {
  const row = parseChessUciV0(uci);
  if (!row) return -1;
  const fromFile = CHESS_FILES_V0.indexOf(row.from[0]);
  const fromRank = Number(row.from[1]) - 1;
  const toFile = CHESS_FILES_V0.indexOf(row.to[0]);
  const toRank = Number(row.to[1]) - 1;
  if (fromFile < 0 || toFile < 0 || fromRank < 0 || toRank < 0) return -1;
  return fromFile + fromRank * 8 + (toFile + toRank * 8) * 64;
}

/**
 * @param {number} index
 * @returns {number[]}
 */
export function actionIndexToEmbeddingV0(index, dim = 64) {
  const out = new Array(dim).fill(0);
  const idx = Number(index);
  if (!Number.isFinite(idx) || idx < 0) return Object.freeze(out);
  out[idx % dim] = 1;
  out[(idx * 7) % dim] = 0.5;
  return Object.freeze(out);
}

/**
 * @param {string} gameType
 * @param {{ actorId?: string, uci?: string, san?: string, type?: string, payload?: object }} raw
 */
export function encodeUglActionV0(gameType, raw = {}) {
  const gt = String(gameType || RHIZOH_UGL_GAME_TYPE_V0.CHESS);
  const actorId = String(raw.actorId || "unknown");
  const type = String(raw.type || RHIZOH_UGL_ACTION_TYPE_V0.MOVE);

  if (gt === RHIZOH_UGL_GAME_TYPE_V0.CHESS) {
    const uci = String(raw.uci || raw.payload?.uci || "").trim().toLowerCase();
    const san = String(raw.san || raw.payload?.san || "").trim();
    const parsed = parseChessUciV0(uci);
    const actionIndex = chessUciToActionIndexV0(uci);
    return Object.freeze({
      schema: RHIZOH_UGL_ACTION_SPACE_SCHEMA_V0,
      gameType: gt,
      actorId,
      type,
      payload: Object.freeze({
        uci: parsed?.uci || uci || null,
        san: san || null,
        from: parsed?.from || null,
        to: parsed?.to || null,
        promotion: parsed?.promotion || null
      }),
      actionIndex,
      embedding: actionIndexToEmbeddingV0(actionIndex),
      legalityMask: raw.legalityMask ? Object.freeze([...raw.legalityMask]) : null
    });
  }

  return Object.freeze({
    schema: RHIZOH_UGL_ACTION_SPACE_SCHEMA_V0,
    gameType: gt,
    actorId,
    type,
    payload: Object.freeze(raw.payload || {}),
    actionIndex: -1,
    embedding: actionIndexToEmbeddingV0(-1),
    legalityMask: null
  });
}

export function buildUglActionSpaceReportV0() {
  return Object.freeze({
    schema: `${RHIZOH_UGL_ACTION_SPACE_SCHEMA_V0}.report`,
    chessActionSpaceSize: 64 * 64,
    api: "encodeUglActionV0(gameType, { actorId, uci, san })"
  });
}
