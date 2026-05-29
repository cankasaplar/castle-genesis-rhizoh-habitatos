/**
 * Latest replay-only analysis snapshot (read-only; no runtime mutation).
 */

/** @type {import('./replayFeedbackAnalysisV0.js').ReplayFeedbackAnalysisReportV0 | null} */
let latestReportV0 = null;

/**
 * @param {import('./replayFeedbackAnalysisV0.js').ReplayFeedbackAnalysisReportV0} report
 */
export function setReplayFeedbackAnalysisReportV0(report) {
  latestReportV0 = report;
  if (typeof window !== "undefined") {
    window.__rhizoh_epistemic_replay_analysis = report;
  }
}

/**
 * @returns {import('./replayFeedbackAnalysisV0.js').ReplayFeedbackAnalysisReportV0 | null}
 */
export function getReplayFeedbackAnalysisReportV0() {
  return latestReportV0;
}

export function clearReplayFeedbackAnalysisReportV0() {
  latestReportV0 = null;
  if (typeof window !== "undefined") {
    try {
      delete window.__rhizoh_epistemic_replay_analysis;
    } catch {
      /* noop */
    }
  }
}

export function resetReplayFeedbackAnalysisStoreForTestsV0() {
  clearReplayFeedbackAnalysisReportV0();
}
