/**
 * Phase 9.4.5 wire — debounced compression after replay analysis (read-only).
 */

import { getEpistemicEventTraceV0, isEpistemicEventBusEnabledV0 } from "./epistemicEventBusV0.js";
import { getEpistemicSimResearchSnapshotV0 } from "./epistemicSimResearchStoreV0.js";
import { getReplayFeedbackAnalysisReportV0 } from "./replayFeedbackAnalysisStoreV0.js";
import {
  buildEpistemicCompressionSignatureV0,
  exportEpistemicCompressionSignatureJsonV0
} from "./epistemicCompressionSignatureV0.js";
import {
  clearEpistemicCompressionSignatureV0,
  getEpistemicCompressionSignatureV0,
  setEpistemicCompressionSignatureV0
} from "./epistemicCompressionSignatureStoreV0.js";

const COMPRESSION_FRAME_INTERVAL_V0 = 90;

let lastCompressedTraceLengthV0 = 0;

export function runEpistemicCompressionSignatureNowV0() {
  const trace = getEpistemicEventTraceV0();
  const report = buildEpistemicCompressionSignatureV0({
    trace,
    analysisReport: getReplayFeedbackAnalysisReportV0(),
    simSnapshot: getEpistemicSimResearchSnapshotV0()
  });
  setEpistemicCompressionSignatureV0(report);
  lastCompressedTraceLengthV0 = trace.length;
  return report;
}

/**
 * @param {number} frame
 */
export function maybeRefreshEpistemicCompressionSignatureV0(frame) {
  if (!isEpistemicEventBusEnabledV0()) return null;
  const traceLen = getEpistemicEventTraceV0().length;
  if (traceLen === 0) return null;
  if (traceLen === lastCompressedTraceLengthV0 && getEpistemicCompressionSignatureV0()) {
    return getEpistemicCompressionSignatureV0();
  }
  if (
    Number(frame) % COMPRESSION_FRAME_INTERVAL_V0 !== 0 &&
    traceLen - lastCompressedTraceLengthV0 < 8
  ) {
    return getEpistemicCompressionSignatureV0();
  }
  return runEpistemicCompressionSignatureNowV0();
}

export function teardownEpistemicCompressionSignatureWireV0() {
  lastCompressedTraceLengthV0 = 0;
  clearEpistemicCompressionSignatureV0();
}

export {
  exportEpistemicCompressionSignatureJsonV0,
  getEpistemicCompressionSignatureV0
};
