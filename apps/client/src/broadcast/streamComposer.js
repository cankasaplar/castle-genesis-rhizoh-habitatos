/**
 * vNext-544 — Canlı kanal paketi: sahne referansı + alt bant + ses kuyruğu + program (YouTube / RTMP üstüne).
 * vNext-545 — `ghostStateSummary` / `ghostLowerThird` (City Spirit genome).
 */

import { buildGhostStreamLowerThirdLines } from "../ghost/ghostNarrator.js";

/**
 * @typedef {object} StreamLowerThirdLine
 * @property {string} key
 * @property {string} label
 * @property {string} display
 */

/**
 * @typedef {object} StreamAudioCue
 * @property {string} id
 * @property {string} text
 * @property {number} atMs
 * @property {"normal" | "urgent"} priority
 */

/**
 * @typedef {object} HabitatStreamPackage
 * @property {string} sceneFrameRef
 * @property {string} caption
 * @property {StreamLowerThirdLine[]} lowerThird
 * @property {StreamAudioCue[]} audioQueue
 * @property {object} schedule
 * @property {number | null} schedule.nextNetworkSampleAtMs
 * @property {number | null} schedule.nextNarrationAtMs
 * @property {string} channelTitle
 * @property {import("../ghost/ghostNarrator.js").GhostStateSummary | null} ghostStateSummary
 * @property {StreamLowerThirdLine[]} ghostLowerThird
 */

/**
 * @param {import("./fieldStoryEngine.js").FieldStoryBeats} beats
 */
export function buildLowerThirdFromBeats(beats) {
  const truthTrend =
    beats.meanTruth >= 0.52 ? "up" : beats.meanTruth <= 0.45 ? "down" : "stable";
  const contraTrend = beats.meanTurbulence >= 0.55 ? "up" : "down";
  const mem =
    beats.peakMemory > 0.55 ? "high" : beats.peakMemory > 0.4 ? "medium" : "low";
  const legRaw = beats.sovereign?.legitimacyResonance;
  const leg = typeof legRaw === "number" && legRaw > 0.65 ? "stable" : "watch";

  return [
    {
      key: "truth",
      label: "truth",
      display: truthTrend === "up" ? "truth ↑" : truthTrend === "down" ? "truth ↓" : "truth →"
    },
    {
      key: "contradiction",
      label: "contradiction",
      display: contraTrend === "up" ? "contradiction ↑" : "contradiction ↓"
    },
    { key: "memory", label: "memory echo", display: mem },
    { key: "legitimacy", label: "legitimacy", display: leg }
  ];
}

/**
 * @param {import("../bridge/CastleFieldBridge.js").CastleFieldBridgeFrame} frame
 * @param {import("./fieldStoryEngine.js").FieldStoryBeats} beats
 * @param {object} [opts]
 * @param {string} [opts.narrationLine]
 * @param {number | null} [opts.nextNetworkSampleAtMs]
 * @param {number | null} [opts.nextNarrationAtMs]
 * @param {import("../ghost/ghostNarrator.js").GhostStateSummary | null} [opts.ghostStateSummary]
 */
export function composeHabitatStreamPackage(frame, beats, opts = {}) {
  const narration = opts.narrationLine ?? "";
  const lowerThird = buildLowerThirdFromBeats(beats);
  const ghostSummary = opts.ghostStateSummary ?? null;
  const ghostLowerThird = ghostSummary ? buildGhostStreamLowerThirdLines(ghostSummary) : [];
  /** @type {StreamAudioCue[]} */
  const audioQueue = [];
  if (narration) {
    audioQueue.push({
      id: `cue-${frame.frameFingerprint}-${narration.length}`,
      text: narration,
      atMs: 0,
      priority: "normal"
    });
  }

  return {
    sceneFrameRef: frame.frameFingerprint,
    caption: narration,
    lowerThird,
    audioQueue,
    schedule: {
      nextNetworkSampleAtMs: opts.nextNetworkSampleAtMs ?? null,
      nextNarrationAtMs: opts.nextNarrationAtMs ?? null
    },
    channelTitle: opts.channelTitle ?? "Rhizoh Habitat Live — Istanbul Constitutional Weather",
    ghostStateSummary: ghostSummary,
    ghostLowerThird
  };
}
