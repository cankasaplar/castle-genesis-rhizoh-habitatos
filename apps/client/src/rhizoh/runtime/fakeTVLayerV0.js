/**
 * PR-3.2 — Fake TV: content / execution reflection surface (not a video widget).
 * SPECFLOW: **RESEARCH-ONLY**
 */

/**
 * @param {{ action?: string, payload?: string } | null | undefined} mediaCommand — e.g. router MEDIA output
 */
export function fakeTVLayerV0(mediaCommand) {
  if (!mediaCommand || typeof mediaCommand !== "object") return null;

  const m = /** @type {Record<string, unknown>} */ (mediaCommand);
  const action = typeof m.action === "string" ? m.action : "";
  const payload = typeof m.payload === "string" ? m.payload : "";

  return Object.freeze({
    screenState: "READY",
    intent: action,
    url: payload,
    visualHint: "LIVE_STREAM_PREVIEW"
  });
}
