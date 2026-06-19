/**
 * UGL StateEncoder — canonical state tensor from domain raw state.
 * RESEARCH-ONLY
 */

import {
  RHIZOH_UGL_EMBEDDING_DIM_V0,
  RHIZOH_UGL_GAME_TYPE_V0,
  RHIZOH_UGL_SCHEMA_V0
} from "./rhizohUglSchemaV0.js";

export const RHIZOH_UGL_STATE_ENCODER_SCHEMA_V0 = "castle.rhizoh.ugl_state_encoder.v0";

const CHESS_PIECE_TO_CHANNEL_V0 = Object.freeze({
  P: 1,
  N: 2,
  B: 3,
  R: 4,
  Q: 5,
  K: 6,
  p: 7,
  n: 8,
  b: 9,
  r: 10,
  q: 11,
  k: 12
});

const CHESS_RULESET_ID_V0 = "chess.standard.fen.v0";

/**
 * @param {string} fen
 * @returns {{ rank: number, file: number, channels: number, data: number[] }}
 */
export function encodeChessFenTensorV0(fen) {
  const parts = String(fen || "").trim().split(/\s+/);
  const board = parts[0] || "";
  const turn = parts[1] === "b" ? 1 : 0;
  const rank = 8;
  const file = 8;
  const channels = 13;
  const data = new Array(rank * file * channels).fill(0);

  let row = 0;
  let col = 0;
  for (const ch of board) {
    if (ch === "/") {
      row += 1;
      col = 0;
      continue;
    }
    if (ch >= "1" && ch <= "8") {
      col += Number(ch);
      continue;
    }
    const channel = CHESS_PIECE_TO_CHANNEL_V0[ch];
    if (!channel) continue;
    const idx = (row * file + col) * channels + channel;
    if (idx >= 0 && idx < data.length) data[idx] = 1;
    col += 1;
  }

  for (let r = 0; r < rank * file; r += 1) {
    data[r * channels + 0] = turn;
  }

  return Object.freeze({ rank, file, channels, data: Object.freeze(data) });
}

/**
 * @param {string} fen
 * @returns {number[]}
 */
export function flattenChessStateEmbeddingV0(fen) {
  const tensor = encodeChessFenTensorV0(fen);
  const out = new Array(RHIZOH_UGL_EMBEDDING_DIM_V0).fill(0);
  const src = tensor.data;
  for (let i = 0; i < out.length; i += 1) {
    out[i] = src[i % src.length] || 0;
  }
  let h = 0;
  for (let i = 0; i < String(fen || "").length; i += 1) {
    h = (h * 31 + String(fen).charCodeAt(i)) >>> 0;
  }
  out[0] = (out[0] + (h % 997) / 997) % 1;
  return Object.freeze(out);
}

/**
 * @param {string} gameType
 * @param {{ fen?: string, turn?: string, meta?: object }} raw
 */
export function encodeUglStateV0(gameType, raw = {}) {
  const gt = String(gameType || RHIZOH_UGL_GAME_TYPE_V0.CHESS);
  if (gt === RHIZOH_UGL_GAME_TYPE_V0.CHESS) {
    const fen = String(raw.fen || "").trim();
    const tensor = encodeChessFenTensorV0(fen);
    const embedding = flattenChessStateEmbeddingV0(fen);
    const turnToken = fen.split(/\s+/)[1] === "b" ? 1 : 0;
    return Object.freeze({
      schema: RHIZOH_UGL_STATE_ENCODER_SCHEMA_V0,
      gameType: gt,
      space: Object.freeze({
        kind: "tensor",
        rank: tensor.rank,
        file: tensor.file,
        channels: tensor.channels,
        data: tensor.data
      }),
      players: Object.freeze([
        Object.freeze({ id: "w", active: turnToken === 0 }),
        Object.freeze({ id: "b", active: turnToken === 1 })
      ]),
      turn: turnToken,
      embedding,
      meta: Object.freeze({
        gameType: gt,
        rulesetId: raw.rulesetId || CHESS_RULESET_ID_V0,
        fen: fen.slice(0, 80)
      })
    });
  }

  return Object.freeze({
    schema: RHIZOH_UGL_STATE_ENCODER_SCHEMA_V0,
    gameType: gt,
    space: Object.freeze({ kind: "unknown", data: [] }),
    players: Object.freeze([]),
    turn: 0,
    embedding: Object.freeze(new Array(RHIZOH_UGL_EMBEDDING_DIM_V0).fill(0)),
    meta: Object.freeze({ gameType: gt, rulesetId: raw.rulesetId || "unknown" })
  });
}

export function buildUglStateEncoderReportV0() {
  return Object.freeze({
    schema: `${RHIZOH_UGL_SCHEMA_V0}.state_encoder_report`,
    embeddingDim: RHIZOH_UGL_EMBEDDING_DIM_V0,
    adapters: Object.freeze([RHIZOH_UGL_GAME_TYPE_V0.CHESS]),
    chessRulesetId: CHESS_RULESET_ID_V0,
    api: "encodeUglStateV0(gameType, { fen })"
  });
}
