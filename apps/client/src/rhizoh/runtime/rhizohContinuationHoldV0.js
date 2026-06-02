/**
 * Continuation hold — user mid-thought; defer LLM until utterance completes.
 */

const HOLD_KEY_V0 = "rhizoh.continuation_hold.v0";
const HOLD_TTL_MS_V0 = 45_000;

/**
 * @param {string} fragment
 */
export function pushContinuationFragmentV0(fragment) {
  if (typeof window === "undefined") return;
  const piece = String(fragment || "").trim();
  if (!piece) return;
  try {
    const prev = JSON.parse(window.sessionStorage.getItem(HOLD_KEY_V0) || "null");
    const buffer = prev?.buffer ? `${prev.buffer} ${piece}`.trim() : piece;
    window.sessionStorage.setItem(
      HOLD_KEY_V0,
      JSON.stringify({ buffer, atMs: Date.now() })
    );
  } catch {
    /* noop */
  }
}

export function peekContinuationHoldV0() {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.sessionStorage.getItem(HOLD_KEY_V0);
    if (!raw) return null;
    const row = JSON.parse(raw);
    if (!row?.buffer) return null;
    if (Date.now() - Number(row.atMs || 0) > HOLD_TTL_MS_V0) {
      clearContinuationHoldV0();
      return null;
    }
    return String(row.buffer);
  } catch {
    return null;
  }
}

export function clearContinuationHoldV0() {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.removeItem(HOLD_KEY_V0);
  } catch {
    /* noop */
  }
}

/** @internal test */
export function clearContinuationHoldForTestV0() {
  clearContinuationHoldV0();
}
