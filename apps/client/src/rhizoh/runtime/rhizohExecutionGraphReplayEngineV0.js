/**
 * Execution Graph Replay Engine — simulatable runtime (dry-run voice pipeline).
 * Replays: STT normalize → route → state preview → language commit (no LLM/TTS/events).
 */

import { readCastleLatencyViolationsV0 } from "./rhizohCastleLatencyBudgetV0.js";
import { commitFinalUserVisibleLanguageV0, LANGUAGE_COMMIT_LOCK_KEY_V0 } from "./rhizohFinalLanguageCommitV0.js";
import { readCommandExecutionGraphV0 } from "./rhizohCommandExecutionGraphV0.js";
import {
  buildHybridLocalSnapshotV0,
  buildHybridLlmConfirmDirectiveV0
} from "./rhizohHybridVoiceExecutionV0.js";
import { normalizeSttTranscriptForOlpV0 } from "./normalizeSttTranscriptForOlpV0.js";
import {
  previewCommandStateTransitionV0,
  readCommandStateMachineV0,
  restoreCommandStateSnapshotV0,
  snapshotCommandStateV0
} from "./rhizohCommandStateMachineV0.js";
import { prewarmCommandRoutingV0 } from "./rhizohCommandRoutePreheatV0.js";
import {
  peekLocalCommandReplyTextV0,
  routeVoiceInputV0,
  VOICE_ROUTE_EXECUTION_V0
} from "./rhizohVoiceCommandRouterV0.js";
import {
  closeVoiceExecutionTraceV0,
  openVoiceExecutionTraceV0,
  traceLocalExecPhaseV0,
  traceRoutePhaseV0,
  traceSttNormalizePhaseV0
} from "./rhizohVoiceExecutionKernelV0.js";
import { recordExecutionGraphNodeV0 } from "./rhizohCommandExecutionGraphV0.js";

export const EXECUTION_REPLAY_TAPE_SCHEMA_V0 = "castle.execution_replay_tape.v0";
export const EXECUTION_REPLAY_REPORT_SCHEMA_V0 = "castle.execution_replay_report.v0";

const REPLAY_TAPE_RING_MAX = 12;
/** @type {object[]} */
let replayTapeRing = [];

function makeReplayTraceIdV0() {
  return `REPLAY-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
}

function isHybridExecutionV0(execution) {
  return (
    execution === VOICE_ROUTE_EXECUTION_V0.HYBRID_LOCAL_FIRST ||
    execution === VOICE_ROUTE_EXECUTION_V0.HYBRID ||
    execution === "hybrid"
  );
}

/**
 * @param {string} traceId
 */
export function buildExecutionReplayTapeFromTraceV0(traceId) {
  const graph = readCommandExecutionGraphV0(traceId);
  const tape = Object.freeze({
    schema: EXECUTION_REPLAY_TAPE_SCHEMA_V0,
    traceId: String(traceId || ""),
    input: String(graph?.meta?.input || ""),
    capturedAtMs: Date.now(),
    graph,
    commandState: readCommandStateMachineV0(),
    latencyViolations: readCastleLatencyViolationsV0(),
    languageCommit:
      typeof window !== "undefined" ? window.__CASTLE_LANGUAGE_LAST_COMMIT__ || null : null,
    phaseIds: Object.freeze((graph?.nodes || []).map((n) => n.id)),
    summary: graph?.summary || null
  });
  replayTapeRing = [...replayTapeRing, tape].slice(-REPLAY_TAPE_RING_MAX);
  publishReplayArtifactsV0(tape, null);
  return tape;
}

/**
 * @param {ReadonlyArray<string>} a
 * @param {ReadonlyArray<string>} b
 */
function sequenceEqualV0(a, b) {
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i += 1) {
    if (a[i] !== b[i]) return false;
  }
  return true;
}

/**
 * @param {ReturnType<typeof buildExecutionReplayTapeFromTraceV0>} baseline
 * @param {ReturnType<typeof buildExecutionReplayTapeFromTraceV0>} simulated
 */
export function diffExecutionReplayTapesV0(baseline, simulated) {
  const basePhases = baseline?.phaseIds || [];
  const simPhases = simulated?.phaseIds || [];
  return Object.freeze({
    schema: EXECUTION_REPLAY_REPORT_SCHEMA_V0,
    atMs: Date.now(),
    deterministic: sequenceEqualV0(basePhases, simPhases),
    executionMatch: baseline?.summary?.execution === simulated?.summary?.execution,
    phaseIdsBaseline: basePhases,
    phaseIdsSimulated: simPhases,
    canonicalMatch:
      String(baseline?.summary?.canonical || "") === String(simulated?.summary?.canonical || ""),
    stateDiff: Object.freeze({
      baselineSystem: baseline?.commandState?.system,
      simulatedSystem: simulated?.commandState?.system,
      baselineListening: baseline?.commandState?.listening,
      simulatedListening: simulated?.commandState?.listening,
      baselinePerception: baseline?.commandState?.perception,
      simulatedPerception: simulated?.commandState?.perception
    }),
    commitDiff: Object.freeze({
      baselineText: baseline?.languageCommit?.text || "",
      simulatedText: simulated?.languageCommit?.text || "",
      textMatch: baseline?.languageCommit?.text === simulated?.languageCommit?.text
    })
  });
}

/**
 * Dry-run voice pipeline — no LLM gateway, TTS, or DOM command events.
 * @param {string} input
 * @param {{
 *   traceId?: string,
 *   mockLlmReply?: string,
 *   restoreState?: boolean,
 *   baselineTape?: ReturnType<typeof buildExecutionReplayTapeFromTraceV0>
 * }} [opts]
 */
export function simulateVoiceExecutionReplayV0(input, opts = {}) {
  prewarmCommandRoutingV0();
  const raw = String(input || "").trim();
  const traceId = String(opts.traceId || makeReplayTraceIdV0());
  const stateBefore = snapshotCommandStateV0();
  const restoreState = opts.restoreState !== false;

  openVoiceExecutionTraceV0(traceId, { input: raw, source: "replay_simulation" });

  const sttNorm = traceSttNormalizePhaseV0(traceId, () => normalizeSttTranscriptForOlpV0(raw));
  const msg = sttNorm.text || raw;
  const route = traceRoutePhaseV0(traceId, () =>
    routeVoiceInputV0(msg, { sttInferred: sttNorm.inferredInputLocale })
  );

  /** @type {object} */
  let branchResult = { execution: route.execution };
  /** @type {ReturnType<typeof commitFinalUserVisibleLanguageV0> | null} */
  let languageCommit = null;
  /** @type {ReturnType<typeof previewCommandStateTransitionV0> | null} */
  let statePreview = null;

  if (route.execution === VOICE_ROUTE_EXECUTION_V0.LOCAL) {
    const canonical = String(route.canonical || route.grammarLocal?.kind || "");
    traceLocalExecPhaseV0(traceId, canonical, 0.5);
    statePreview = previewCommandStateTransitionV0(canonical);
    if (statePreview.ok) {
      restoreCommandStateSnapshotV0(statePreview.state);
    }
    const replyText = route.grammarLocal
      ? String(route.grammarLocal.user_reply_tr || "")
      : peekLocalCommandReplyTextV0(canonical);
    languageCommit = commitFinalUserVisibleLanguageV0(replyText, {
      source: route.grammarLocal ? "ui_helpers" : "ui_helpers",
      traceId,
      idempotencyKey: `replay:${traceId}`,
      lockKey: LANGUAGE_COMMIT_LOCK_KEY_V0
    });
    recordExecutionGraphNodeV0(traceId, {
      id: "language_commit",
      phase: "language_commit",
      trigger: languageCommit.text.slice(0, 80),
      localAction: true,
      llmFallback: false,
      sideEffects: Object.freeze([`commit:${languageCommit.guardStep}`]),
      edgeFrom: `local:${canonical}`,
      edgeLabel: "commit"
    });
    branchResult = Object.freeze({
      execution: "local",
      canonical,
      reply: languageCommit.text,
      statePreview,
      simulatedSideEffects: false
    });
  } else if (isHybridExecutionV0(route.execution)) {
    const hybrid = buildHybridLocalSnapshotV0(route);
    recordExecutionGraphNodeV0(traceId, {
      id: "hybrid_local_first",
      phase: "hybrid_local_first",
      trigger: msg.slice(0, 96),
      localAction: true,
      llmFallback: false,
      sideEffects: Object.freeze(["hybrid:snapshot"]),
      edgeFrom: "route",
      edgeLabel: "hybrid_local"
    });
    languageCommit = commitFinalUserVisibleLanguageV0(hybrid.localReply, {
      source: "ui_helpers",
      traceId,
      idempotencyKey: `replay-hybrid-local:${traceId}`,
      lockKey: LANGUAGE_COMMIT_LOCK_KEY_V0
    });
    const mockLlm = String(
      opts.mockLlmReply || `[SIM] ${buildHybridLlmConfirmDirectiveV0(hybrid.snapshot, msg).slice(0, 120)}`
    );
    const llmCommit = commitFinalUserVisibleLanguageV0(mockLlm, {
      source: "llm",
      traceId,
      idempotencyKey: `replay-hybrid-llm:${traceId}`,
      lockKey: LANGUAGE_COMMIT_LOCK_KEY_V0
    });
    recordExecutionGraphNodeV0(traceId, {
      id: "hybrid_llm_confirm",
      phase: "hybrid_llm_confirm",
      trigger: msg.slice(0, 96),
      localAction: false,
      llmFallback: true,
      sideEffects: Object.freeze(["llm:explain_only", "simulated:true"]),
      edgeFrom: "hybrid_local_first",
      edgeLabel: "llm_confirm"
    });
    branchResult = Object.freeze({
      execution: "hybrid",
      snapshot: hybrid.snapshot,
      localReply: languageCommit.text,
      llmReply: llmCommit.text,
      simulatedLlm: true
    });
    languageCommit = llmCommit;
  } else {
    const mockLlm = String(opts.mockLlmReply || `[SIM-LLM] ${msg.slice(0, 160)}`);
    recordExecutionGraphNodeV0(traceId, {
      id: "llm_turn",
      phase: "llm",
      trigger: msg.slice(0, 96),
      localAction: false,
      llmFallback: true,
      sideEffects: Object.freeze(["llm:reasoning", "simulated:true"]),
      edgeFrom: "route",
      edgeLabel: "llm"
    });
    languageCommit = commitFinalUserVisibleLanguageV0(mockLlm, {
      source: "llm",
      traceId,
      idempotencyKey: traceId,
      lockKey: LANGUAGE_COMMIT_LOCK_KEY_V0
    });
    recordExecutionGraphNodeV0(traceId, {
      id: "language_commit",
      phase: "language_commit",
      trigger: languageCommit.text.slice(0, 80),
      localAction: false,
      llmFallback: false,
      sideEffects: Object.freeze([`commit:${languageCommit.guardStep}`]),
      edgeFrom: "llm_turn",
      edgeLabel: "commit"
    });
    branchResult = Object.freeze({
      execution: "llm",
      reply: languageCommit.text,
      simulatedLlm: true
    });
  }

  const graph = closeVoiceExecutionTraceV0(traceId, {
    ok: true,
    execution: branchResult.execution,
    canonical: branchResult.canonical || null
  });

  const tape = buildExecutionReplayTapeFromTraceV0(traceId);
  const diff = opts.baselineTape ? diffExecutionReplayTapesV0(opts.baselineTape, tape) : null;

  if (restoreState) {
    restoreCommandStateSnapshotV0(stateBefore);
  }

  const report = Object.freeze({
    schema: EXECUTION_REPLAY_REPORT_SCHEMA_V0,
    simulated: true,
    traceId,
    input: raw,
    normalizedText: msg,
    route,
    branchResult,
    languageCommit,
    graph,
    tape,
    diff,
    restoredState: restoreState
  });

  publishReplayArtifactsV0(tape, report);
  return report;
}

/**
 * Re-run historical input and compare to baseline tape (if provided).
 * @param {string} input
 * @param {{
 *   baselineTraceId?: string,
 *   baselineTape?: ReturnType<typeof buildExecutionReplayTapeFromTraceV0>,
 *   mockLlmReply?: string
 * }} [opts]
 */
export function replayVoiceExecutionV0(input, opts = {}) {
  const baselineTape =
    opts.baselineTape ||
    (opts.baselineTraceId ? buildExecutionReplayTapeFromTraceV0(opts.baselineTraceId) : null);
  return simulateVoiceExecutionReplayV0(input, {
    ...opts,
    baselineTape,
    restoreState: true
  });
}

export function listExecutionReplayTapesV0() {
  return Object.freeze([...replayTapeRing]);
}

function publishReplayArtifactsV0(tape, report) {
  if (typeof window === "undefined") return;
  window.__CASTLE_EXECUTION_REPLAY_TAPE__ = tape;
  window.__CASTLE_EXECUTION_REPLAY_LAST__ = report;
  window.__CASTLE_EXECUTION_REPLAY_TAPES__ = Object.freeze([...replayTapeRing]);
}

/** @internal vitest */
export function __resetExecutionReplayEngineForTestV0() {
  replayTapeRing = [];
  if (typeof window !== "undefined") {
    try {
      delete window.__CASTLE_EXECUTION_REPLAY_TAPE__;
      delete window.__CASTLE_EXECUTION_REPLAY_LAST__;
      delete window.__CASTLE_EXECUTION_REPLAY_TAPES__;
    } catch {
      /* noop */
    }
  }
}
