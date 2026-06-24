/**
 * WorldSports observation short + studio feed poll wire.
 * RESEARCH-ONLY
 */

import { wireWorldSportsMediaTubeV0 } from "./worldSportsMediaTubeWireV0.js";
import {
  buildRhizohWorldSportsObservationShortCaptureV0,
  formatWorldSportsObservationShortBriefV0
} from "./rhizohWorldSportsObservationShortCaptureV0.js";
import { copyTextSafeV0 } from "./rhizohClipboardSafeV0.js";

let studioPollArmedV0 = false;

export async function ensureRhizohStudioWorldSportsFeedPollV0(opts = {}) {
  if (typeof window === "undefined") return null;
  try {
    return await wireWorldSportsMediaTubeV0({
      locale: opts.locale || "tr",
      force: opts.force === true
    });
  } catch {
    return null;
  }
}

export function startRhizohStudioWorldSportsFeedPollV0(opts = {}) {
  if (typeof window === "undefined" || studioPollArmedV0) return;
  studioPollArmedV0 = true;
  const intervalMs = Math.max(30_000, Number(opts.intervalMs) || 60_000);
  void ensureRhizohStudioWorldSportsFeedPollV0({ locale: opts.locale, force: true });
  window.setInterval(() => {
    void ensureRhizohStudioWorldSportsFeedPollV0({ locale: opts.locale });
  }, intervalMs);
}

export function ensureRhizohWorldSportsObservationShortDevToolsV0() {
  if (typeof window === "undefined") return null;
  window.__rhizoh = window.__rhizoh || {};

  window.__rhizoh.worldSportsObservationShort001 = (opts = {}) =>
    buildRhizohWorldSportsObservationShortCaptureV0(opts);

  window.__rhizoh.printWorldSportsObservationBrief = (opts = {}) => {
    const capture = buildRhizohWorldSportsObservationShortCaptureV0(opts);
    const brief = formatWorldSportsObservationShortBriefV0(capture);
    console.log(brief);
    return Object.freeze({ printed: true, capture, brief });
  };

  window.__rhizoh.copyWorldSportsObservationBrief = async (opts = {}) => {
    const capture = buildRhizohWorldSportsObservationShortCaptureV0(opts);
    const brief = formatWorldSportsObservationShortBriefV0(capture);
    const copy = await copyTextSafeV0(brief, {
      filename: "rhizoh-worldsports-observation-001.txt"
    });
    return Object.freeze({ copied: copy.ok, method: copy.method, hint: copy.hint, capture, brief });
  };

  return window.__rhizoh.worldSportsObservationShort001;
}

/** @internal vitest */
export function resetStudioWorldSportsPollForTestV0() {
  studioPollArmedV0 = false;
}
