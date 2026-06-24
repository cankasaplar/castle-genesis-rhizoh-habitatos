/**
 * DevTools wire — Chess Observation Short #001 capture.
 * RESEARCH-ONLY
 */

import {
  buildRhizohChessObservationShortCaptureV0,
  formatChessObservationShortBriefV0
} from "./rhizohChessObservationShortCaptureV0.js";

export function ensureRhizohChessObservationShortDevToolsV0() {
  if (typeof window === "undefined") return null;
  window.__rhizoh = window.__rhizoh || {};

  window.__rhizoh.chessObservationShort001 = (opts = {}) =>
    buildRhizohChessObservationShortCaptureV0(opts);

  window.__rhizoh.copyChessObservationBrief = async (opts = {}) => {
    const capture = buildRhizohChessObservationShortCaptureV0(opts);
    const text = formatChessObservationShortBriefV0(capture);
    if (typeof navigator?.clipboard?.writeText === "function") {
      await navigator.clipboard.writeText(text);
    }
    return Object.freeze({ copied: true, capture, brief: text });
  };

  return window.__rhizoh.chessObservationShort001;
}
