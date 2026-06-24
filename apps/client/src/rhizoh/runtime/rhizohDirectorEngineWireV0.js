/**
 * DevTools wire — Director Engine + Sora prompt compiler.
 * RESEARCH-ONLY
 */

import { buildRhizohDirectorTimelineV0 } from "./rhizohDirectorEngineV0.js";
import { compileRhizohSoraPromptPackV0 } from "./rhizohSoraPromptCompilerV0.js";

export function ensureRhizohDirectorEngineDevToolsV0() {
  if (typeof window === "undefined") return null;
  window.__rhizoh = window.__rhizoh || {};

  window.__rhizoh.directorTimeline = (opts = {}) => buildRhizohDirectorTimelineV0(opts);

  window.__rhizoh.soraPromptPack = (opts = {}) => {
    const timeline = buildRhizohDirectorTimelineV0(opts);
    return compileRhizohSoraPromptPackV0(timeline, opts);
  };

  return window.__rhizoh.directorTimeline;
}
