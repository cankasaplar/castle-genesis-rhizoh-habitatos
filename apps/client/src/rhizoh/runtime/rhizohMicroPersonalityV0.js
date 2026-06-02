/**
 * Micro personality layer — tone shaping without LLM (short / warm / minimal).
 */

const PERSONALITY_KEY_V0 = "rhizoh.micro_personality.v0";

/** @readonly */
export const MICRO_PERSONALITY_TONE_V0 = Object.freeze({
  SHORT: "short",
  WARM: "warm",
  MINIMAL: "minimal"
});

function readProfile() {
  if (typeof window === "undefined") {
    return { tone: MICRO_PERSONALITY_TONE_V0.WARM, turnCount: 0 };
  }
  try {
    const raw = window.localStorage.getItem(PERSONALITY_KEY_V0);
    if (!raw) return { tone: MICRO_PERSONALITY_TONE_V0.WARM, turnCount: 0 };
    return JSON.parse(raw);
  } catch {
    return { tone: MICRO_PERSONALITY_TONE_V0.WARM, turnCount: 0 };
  }
}

function writeProfile(p) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(PERSONALITY_KEY_V0, JSON.stringify(p));
  } catch {
    /* noop */
  }
}

/**
 * @param {string} userReaction
 */
export function adaptMicroPersonalityFromReactionV0(userReaction) {
  const p = readProfile();
  p.turnCount = Number(p.turnCount || 0) + 1;
  if (userReaction === "stop") p.tone = MICRO_PERSONALITY_TONE_V0.MINIMAL;
  else if (userReaction === "continue" && p.turnCount > 8) p.tone = MICRO_PERSONALITY_TONE_V0.WARM;
  else if (userReaction === "override") p.tone = MICRO_PERSONALITY_TONE_V0.SHORT;
  writeProfile(p);
  return p.tone;
}

/**
 * @param {string} baseReply
 * @param {string} [tone]
 */
export function applyMicroPersonalityToReplyV0(baseReply, tone) {
  const t = String(tone || readProfile().tone || MICRO_PERSONALITY_TONE_V0.WARM);
  const r = String(baseReply || "").trim();
  if (!r) return r;
  if (t === MICRO_PERSONALITY_TONE_V0.MINIMAL) {
    const first = r.split(/[.!?]/)[0]?.trim();
    return first ? `${first}.` : r;
  }
  if (t === MICRO_PERSONALITY_TONE_V0.SHORT) {
    return r.length > 48 ? `${r.slice(0, 45).trim()}…` : r;
  }
  if (t === MICRO_PERSONALITY_TONE_V0.WARM && !/sen|you|buraday/i.test(r)) {
    return r.endsWith("?") ? r : `${r}`;
  }
  return r;
}

/** @internal test */
export function clearMicroPersonalityForTestV0() {
  if (typeof window !== "undefined") {
    try {
      window.localStorage.removeItem(PERSONALITY_KEY_V0);
    } catch {
      /* noop */
    }
  }
}
