/**
 * PR-3.1 — MEDIA_ACTUATOR: detached media / display commands (never drives lighting).
 * SPECFLOW: **RESEARCH-ONLY**
 */

const CASTLE_GENESIS_LIVE =
  "https://www.youtube.com/@CastleGenesis/live";

export const mediaActuatorV0 = {
  /**
   * @param {{ type?: string }} cmd
   * @returns {{ target: string, action: string, payload: string } | null}
   */
  apply(cmd) {
    if (!cmd || typeof cmd !== "object") return null;
    const c = /** @type {Record<string, unknown>} */ (cmd);
    if (c.type !== "OPEN_YOUTUBE_LIVE") return null;

    return {
      target: "SMART_TV",
      action: "OPEN_URL",
      payload: CASTLE_GENESIS_LIVE
    };
  }
};
