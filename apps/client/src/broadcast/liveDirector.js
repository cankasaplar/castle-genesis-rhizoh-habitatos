/**
 * vNext-542 — Otonom yayın yönetmeni: kare → anlatım kuyruğu (Rhizoh Habitat Live).
 */

import { buildFieldStoryBeats } from "./fieldStoryEngine.js";
import { narrateConstitutionalField } from "./constitutionalNarrator.js";
import { mergeNarrationToneWithPresence } from "../ghost/userPresenceLoopV548.js";

/**
 * @typedef {object} LiveDirectorOptions
 * @property {(line: string, beats: import("./fieldStoryEngine.js").FieldStoryBeats) => void} [onNarration]
 * @property {"tr" | "en"} [locale]
 * @property {(frame: import("../bridge/CastleFieldBridge.js").CastleFieldBridgeFrame) => void} [onFrame]
 * @property {ReturnType<import("./narrationMemory.js").createNarrationMemory>} [narrationMemory]
 * @property {import("../ghost/ghostIntentLayerV547.js").GhostIntent} [ghostIntent] varsayılan intent (ctx ile override)
 * @property {import("../ghost/userPresenceLoopV548.js").UserPresenceSnapshot | null} [userPresence]
 */

/**
 * @param {LiveDirectorOptions} [options]
 */
export function createLiveDirector(options = {}) {
  const locale = options.locale ?? "tr";
  const narrationMemory = options.narrationMemory;
  let lastFingerprint = /** @type {string | null} */ (null);
  let lastLine = "";

  return {
    /**
     * @param {import("../bridge/CastleFieldBridge.js").CastleFieldBridgeFrame} frame
     * @param {{ ghostIntent?: import("../ghost/ghostIntentLayerV547.js").GhostIntent, userPresence?: import("../ghost/userPresenceLoopV548.js").UserPresenceSnapshot | null }} [ctx]
     */
    onBridgeFrame(frame, ctx = {}) {
      options.onFrame?.(frame);
      if (!frame?.frameFingerprint) return;
      if (frame.frameFingerprint === lastFingerprint) return;
      lastFingerprint = frame.frameFingerprint;

      const beats = buildFieldStoryBeats(frame);
      const memoryHints = narrationMemory ? narrationMemory.buildHints(frame, Date.now()) : null;
      if (narrationMemory) narrationMemory.record(frame);
      const ghostIntent = ctx.ghostIntent ?? options.ghostIntent;
      const userPresence = ctx.userPresence ?? options.userPresence ?? null;
      const res = ghostIntent?.ghostResistance01 ?? 0;
      const narrationTone = mergeNarrationToneWithPresence(ghostIntent?.narrationTone ?? "calm", userPresence, res);
      const line = narrateConstitutionalField(beats, locale, memoryHints, {
        narrationTone
      });
      if (line !== lastLine) {
        lastLine = line;
        options.onNarration?.(line, beats);
      }
    },

    invalidate() {
      lastFingerprint = null;
    }
  };
}
