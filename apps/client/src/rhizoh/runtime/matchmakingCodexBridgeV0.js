/**
 * Matchmaking CODEX Bridge v0 — match_finished → lightweight event snapshot.
 * NOT full memory write · interpretation layer only.
 * @see docs/RHIZOH_MATCHMAKING_CORE_SPEC_V1.md
 */

import { emitCodexBusV0 } from "../../core/CodexBusV0.js";
import { MATCH_SESSION_STATE_V0 } from "./matchSessionLifecycleV0.js";

export const MATCH_CODEX_SNAPSHOT_SCHEMA_V0 = "castle.rhizoh.match_codex_snapshot.v0";
export const MATCH_FINISHED_CODEX_EVENT_V0 = "match_finished_event";

/**
 * @param {object} session
 */
export function buildMatchCodexSnapshotV0(session) {
  const started = session?.createdAtMs ?? Date.now();
  const finished = session?.finishedAtMs ?? Date.now();
  return Object.freeze({
    schema: MATCH_CODEX_SNAPSHOT_SCHEMA_V0,
    sessionId: session?.sessionId ?? null,
    mode: session?.mode ?? "KINETIC",
    result: session?.result ?? "unknown",
    moveCount: session?.moveCount ?? 0,
    durationMs: Math.max(0, finished - started),
    opponentKind: session?.opponentKind ?? "human",
    playerCount: session?.players?.length ?? 0,
    influencesExecution: false,
    influencesIdentity: false,
    interpretationOnly: true
  });
}

/**
 * @param {object} session
 */
export function publishMatchFinishedToCodexV0(session) {
  if (!session || session.state !== MATCH_SESSION_STATE_V0.SESSION_FINISHED) {
    return Object.freeze({ ok: false, reason: "session_not_finished" });
  }

  const snapshot = buildMatchCodexSnapshotV0(session);
  const bus = emitCodexBusV0(MATCH_FINISHED_CODEX_EVENT_V0, snapshot, {
    source: "matchmaking_codex_bridge_v0",
    shadowRehearsal: true
  });

  return Object.freeze({ ok: bus.ok === true, snapshot, bus });
}

export function mountMatchmakingCodexBridgeConsoleV0() {
  if (typeof window === "undefined") return;
  window.__rhizoh = window.__rhizoh || {};
  window.__rhizoh.matchmaking = window.__rhizoh.matchmaking || {};
  window.__rhizoh.matchmaking.codex = Object.freeze({
    snapshot: buildMatchCodexSnapshotV0,
    publishFinished: publishMatchFinishedToCodexV0
  });
}
