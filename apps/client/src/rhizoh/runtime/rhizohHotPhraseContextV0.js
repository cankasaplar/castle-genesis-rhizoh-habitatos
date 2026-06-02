/**
 * Hot phrase context binding — prevents semantic drift (e.g. "tamam" as ack vs closure).
 */

const CONTEXT_KEY_V0 = "rhizoh.hot_phrase_context.v0";

/** @readonly */
export const HOT_PHRASE_CONTEXT_TAG_V0 = Object.freeze({
  ACK: "ack",
  CLOSURE: "closure",
  CONTINUATION: "continuation",
  COMMAND_ACK: "command_ack",
  GREETING: "greeting"
});

/**
 * @param {string} intent
 * @param {string} [routeClass]
 */
export function resolveHotPhraseContextTagV0(intent, routeClass = "") {
  const i = String(intent || "").toLowerCase();
  const r = String(routeClass || "").toLowerCase();
  if (r === "continuation" || i === "continuation") return HOT_PHRASE_CONTEXT_TAG_V0.CONTINUATION;
  if (r === "command" || i === "command") return HOT_PHRASE_CONTEXT_TAG_V0.COMMAND_ACK;
  if (i === "ack" || i === "yes" || i === "no") return HOT_PHRASE_CONTEXT_TAG_V0.ACK;
  if (i === "greeting" || i === "wellbeing") return HOT_PHRASE_CONTEXT_TAG_V0.GREETING;
  return HOT_PHRASE_CONTEXT_TAG_V0.ACK;
}

export function readHotPhraseContextWindowV0() {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.sessionStorage.getItem(CONTEXT_KEY_V0);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

/**
 * @param {{ tag: string, routeClass?: string, intent?: string }} ctx
 */
export function publishHotPhraseContextWindowV0(ctx) {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.setItem(
      CONTEXT_KEY_V0,
      JSON.stringify({
        tag: String(ctx.tag || HOT_PHRASE_CONTEXT_TAG_V0.ACK),
        routeClass: String(ctx.routeClass || ""),
        intent: String(ctx.intent || ""),
        atMs: Date.now()
      })
    );
  } catch {
    /* noop */
  }
}

/**
 * @param {string} phraseIntent
 * @param {{ tag?: string, routeClass?: string }} [required]
 */
export function hotPhraseContextMatchesV0(phraseIntent, required = {}) {
  const win = readHotPhraseContextWindowV0();
  if (!win || Date.now() - Number(win.atMs || 0) > 90_000) return true;
  const needTag = required.tag ? String(required.tag) : "";
  if (needTag && win.tag !== needTag) return false;
  const phraseTag = resolveHotPhraseContextTagV0(phraseIntent, required.routeClass || win.routeClass);
  if (phraseIntent === "ack" && win.tag === HOT_PHRASE_CONTEXT_TAG_V0.CLOSURE) return false;
  if (phraseIntent === "ack" && win.tag === HOT_PHRASE_CONTEXT_TAG_V0.CONTINUATION) return true;
  return phraseTag === win.tag || win.intent === phraseIntent;
}
