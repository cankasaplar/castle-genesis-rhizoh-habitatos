/**
 * Chess voice move parser v0 — Turkish + English SAN fragments.
 */

export const CHESS_VOICE_MOVE_PARSER_SCHEMA_V0 = "castle.chess_voice_move_parser.v0";

const FILE_MAP_V0 = Object.freeze({
  a: "a",
  alpha: "a",
  alfa: "a",
  b: "b",
  bravo: "b",
  c: "c",
  charlie: "c",
  ç: "c",
  d: "d",
  delta: "d",
  e: "e",
  echo: "e",
  f: "f",
  foxtrot: "f",
  g: "g",
  golf: "g",
  h: "h",
  hotel: "h"
});

const RANK_MAP_V0 = Object.freeze({
  "1": "1",
  bir: "1",
  one: "1",
  "2": "2",
  iki: "2",
  two: "2",
  "3": "3",
  uc: "3",
  üç: "3",
  three: "3",
  "4": "4",
  dort: "4",
  dört: "4",
  four: "4",
  "5": "5",
  bes: "5",
  beş: "5",
  five: "5",
  "6": "6",
  alti: "6",
  altı: "6",
  six: "6",
  "7": "7",
  yedi: "7",
  seven: "7",
  "8": "8",
  sekiz: "8",
  eight: "8"
});

function normalizeToken(s) {
  return String(s || "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{M}/gu, "");
}

/**
 * @param {string} utterance
 * @returns {{ move: string | null, confidence: number }}
 */
export function parseChessVoiceMoveV0(utterance) {
  const raw = String(utterance || "").trim();
  if (!raw) return Object.freeze({ move: null, confidence: 0 });

  const lowered = normalizeToken(raw);

  const sanDirect = lowered.match(/\b([nbrqk]?[a-h]?x?[a-h][1-8](?:=[nbrqk])?[+#]?|o-o-o|o-o)\b/i);
  if (sanDirect) {
    return Object.freeze({ move: sanDirect[1].replace("o-o-o", "O-O-O").replace("o-o", "O-O"), confidence: 0.92 });
  }

  const e4 = lowered.match(/\b(?:e\s*4|e4|e\s*dort|e\s*dörd|at\s*e\s*4)\b/);
  if (e4) return Object.freeze({ move: "e4", confidence: 0.85 });

  const nf3 = lowered.match(/\b(?:at\s*f3|n\s*f3|nf3|at\s*f\s*3)\b/);
  if (nf3) return Object.freeze({ move: "Nf3", confidence: 0.82 });

  const castleK = lowered.match(/\b(?:k[iı]s[aı]?\s*rok|short\s*castle|o-o)\b/);
  if (castleK) return Object.freeze({ move: "O-O", confidence: 0.8 });

  const castleQ = lowered.match(/\b(?:uzun\s*rok|long\s*castle|o-o-o)\b/);
  if (castleQ) return Object.freeze({ move: "O-O-O", confidence: 0.8 });

  const tokens = lowered.split(/\s+/).filter(Boolean);
  if (tokens.length >= 2) {
    const file = FILE_MAP_V0[tokens[0]];
    const rank = RANK_MAP_V0[tokens[1]];
    if (file && rank) {
      return Object.freeze({ move: `${file}${rank}`, confidence: 0.7 });
    }
  }

  const uci = lowered.match(/\b([a-h][1-8][a-h][1-8])\b/);
  if (uci) return Object.freeze({ move: uci[1], confidence: 0.88 });

  return Object.freeze({ move: null, confidence: 0 });
}
