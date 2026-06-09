/**
 * Recent Rhizoh TTS echo guard — drop STT that matches assistant speech picked up by the mic.
 */

export const VOICE_TTS_ECHO_GUARD_SCHEMA_V0 = "castle.voice_tts_echo_guard.v0";

const TTL_MS = 14_000;
const MAX_RECENT = 6;

/** @type {{ norm: string, atMs: number }[]} */
let _recent = [];

function normalizeEchoTextV0(text) {
  return String(text || "")
    .toLowerCase()
    .replace(/[.,!?;:]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function resetVoiceTtsEchoGuardForTestsV0() {
  _recent = [];
}

/**
 * @param {string} text spoken TTS text
 */
export function noteRecentRhizohTtsEchoV0(text) {
  const norm = normalizeEchoTextV0(text);
  if (!norm || norm.length < 4) return;
  const now = Date.now();
  _recent = _recent.filter((row) => now - row.atMs < TTL_MS);
  _recent.push({ norm, atMs: now });
  if (_recent.length > MAX_RECENT) _recent = _recent.slice(-MAX_RECENT);
}

/**
 * @param {string} sttText
 * @returns {{ echo: boolean, matched?: string }}
 */
export function matchesRecentRhizohTtsEchoV0(sttText) {
  const norm = normalizeEchoTextV0(sttText);
  if (!norm) return Object.freeze({ echo: false });
  const now = Date.now();
  for (const row of _recent) {
    if (now - row.atMs > TTL_MS) continue;
    if (row.norm === norm) {
      return Object.freeze({ echo: true, matched: row.norm });
    }
    const shorter = norm.length < row.norm.length ? norm : row.norm;
    const longer = norm.length < row.norm.length ? row.norm : norm;
    if (shorter.length >= 12 && longer.includes(shorter)) {
      return Object.freeze({ echo: true, matched: row.norm });
    }
    const a = new Set(norm.split(" ").filter((w) => w.length > 2));
    const b = new Set(row.norm.split(" ").filter((w) => w.length > 2));
    if (!a.size || !b.size) continue;
    let overlap = 0;
    for (const w of a) if (b.has(w)) overlap += 1;
    const ratio = overlap / Math.min(a.size, b.size);
    if (ratio >= 0.72 && overlap >= 3) {
      return Object.freeze({ echo: true, matched: row.norm });
    }
  }
  return Object.freeze({ echo: false });
}
