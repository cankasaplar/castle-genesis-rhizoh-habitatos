/**
 * DevTools wire — Chess Observation Short #001 capture.
 * RESEARCH-ONLY
 */

import {
  buildRhizohChessObservationShortCaptureV0,
  formatChessObservationShortBriefV0
} from "./rhizohChessObservationShortCaptureV0.js";
import { copyTextSafeV0 } from "./rhizohClipboardSafeV0.js";

/**
 * @param {object} opts
 */
export async function copyRhizohChessObservationBriefV0(opts = {}) {
  const capture = buildRhizohChessObservationShortCaptureV0(opts);
  const brief = formatChessObservationShortBriefV0(capture);
  const locale = opts.locale === "tr" ? "tr" : "en";
  const copy = await copyTextSafeV0(brief, {
    filename: "rhizoh-chess-observation-001.txt",
    logOnFallback: true
  });

  return Object.freeze({
    copied: copy.ok,
    method: copy.method,
    hint:
      copy.hint ||
      (copy.ok
        ? locale === "tr"
          ? "Brief panoya kopyalandı."
          : "Brief copied to clipboard."
        : null),
    capture,
    brief
  });
}

export function printRhizohChessObservationBriefV0(opts = {}) {
  const capture = buildRhizohChessObservationShortCaptureV0(opts);
  const brief = formatChessObservationShortBriefV0(capture);
  if (typeof console !== "undefined") {
    console.log(brief);
  }
  return Object.freeze({ printed: true, capture, brief });
}

export function ensureRhizohChessObservationShortDevToolsV0() {
  if (typeof window === "undefined") return null;
  window.__rhizoh = window.__rhizoh || {};

  window.__rhizoh.chessObservationShort001 = (opts = {}) =>
    buildRhizohChessObservationShortCaptureV0(opts);

  window.__rhizoh.copyChessObservationBrief = (opts = {}) =>
    copyRhizohChessObservationBriefV0(opts);

  window.__rhizoh.printChessObservationBrief = (opts = {}) =>
    printRhizohChessObservationBriefV0(opts);

  return window.__rhizoh.chessObservationShort001;
}
