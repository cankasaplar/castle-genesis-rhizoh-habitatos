/**
 * Phase 9.4.4b wire — debounced post-hoc trace analysis (replay-only).
 */

import { getEpistemicEventTraceV0, isEpistemicEventBusEnabledV0 } from "./epistemicEventBusV0.js";
import {
  exportReplayFeedbackAnalysisJsonV0,
  runReplayFeedbackAnalysisV0
} from "./replayFeedbackAnalysisV0.js";
import {
  clearReplayFeedbackAnalysisReportV0,
  getReplayFeedbackAnalysisReportV0,
  setReplayFeedbackAnalysisReportV0
} from "./replayFeedbackAnalysisStoreV0.js";

const ANALYSIS_FRAME_INTERVAL_V0 = 45;

let lastAnalyzedTraceLengthV0 = 0;

/**
 * Run analysis on current bus trace; store snapshot only.
 * @returns {import('./replayFeedbackAnalysisV0.js').ReplayFeedbackAnalysisReportV0}
 */
export function runEpistemicReplayFeedbackAnalysisNowV0() {
  const report = runReplayFeedbackAnalysisV0(getEpistemicEventTraceV0());
  setReplayFeedbackAnalysisReportV0(report);
  lastAnalyzedTraceLengthV0 = report.traceLength;
  return report;
}

/**
 * @param {number} frame
 */
export function maybeRefreshReplayFeedbackAnalysisV0(frame) {
  if (!isEpistemicEventBusEnabledV0()) return null;
  const traceLen = getEpistemicEventTraceV0().length;
  if (traceLen === 0) return null;
  if (traceLen === lastAnalyzedTraceLengthV0 && getReplayFeedbackAnalysisReportV0()) {
    return getReplayFeedbackAnalysisReportV0();
  }
  if (Number(frame) % ANALYSIS_FRAME_INTERVAL_V0 !== 0 && traceLen - lastAnalyzedTraceLengthV0 < 5) {
    return getReplayFeedbackAnalysisReportV0();
  }
  return runEpistemicReplayFeedbackAnalysisNowV0();
}

export function teardownEpistemicReplayAnalysisWireV0() {
  lastAnalyzedTraceLengthV0 = 0;
  clearReplayFeedbackAnalysisReportV0();
}

export {
  exportReplayFeedbackAnalysisJsonV0,
  getReplayFeedbackAnalysisReportV0
};
