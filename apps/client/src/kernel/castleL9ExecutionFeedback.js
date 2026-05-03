/**
 * L9 execution / hold kuyruğu — UI ve telemetri için tek event kanalı (uiStore bağımlılığı yok).
 */
export const CASTLE_L9_EXECUTION_FEEDBACK = "castle-l9-execution-feedback";

export function emitL9ExecutionFeedback(detail) {
  try {
    if (typeof window === "undefined" || !detail) return;
    window.dispatchEvent(new CustomEvent(CASTLE_L9_EXECUTION_FEEDBACK, { detail }));
  } catch {
    /* noop */
  }
}
