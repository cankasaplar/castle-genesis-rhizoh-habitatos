/**
 * Global execution invariant — language commit, local-first routing, TTS from commit only.
 */

import { CASTLE_COMMAND_INVARIANT_V0 } from "./castleCommandInvariantV0.js";
import { CASTLE_LANGUAGE_INVARIANT_V0 } from "./rhizohLanguageInvariantV0.js";
import { FINAL_LANGUAGE_COMMIT_STAGE_V0 } from "./rhizohFinalLanguageCommitV0.js";

import { CASTLE_LATENCY_BUDGET_MS_V0 } from "./rhizohCastleLatencyBudgetV0.js";
import { COMMAND_EXECUTION_GRAPH_SCHEMA_V0 } from "./rhizohCommandExecutionGraphV0.js";

export const CASTLE_EXECUTION_INVARIANT_V0 = Object.freeze({
  schema: "castle.execution_invariant.v0",
  language: "single commit only",
  execution: "local-first, llm-fallback only for reasoning",
  rendering: "tts only from committed output",
  observability: "command execution graph + latency budgets",
  latencyBudgetMs: CASTLE_LATENCY_BUDGET_MS_V0,
  executionGraph: COMMAND_EXECUTION_GRAPH_SCHEMA_V0,
  rule: "no parallel language or command execution paths allowed",
  stages: Object.freeze({
    languageCommit: FINAL_LANGUAGE_COMMIT_STAGE_V0,
    languageInvariant: CASTLE_LANGUAGE_INVARIANT_V0.schema,
    commandInvariant: CASTLE_COMMAND_INVARIANT_V0.schema
  })
});

export function publishCastleExecutionInvariantV0() {
  if (typeof window !== "undefined") {
    window.__CASTLE_EXECUTION_INVARIANT__ = CASTLE_EXECUTION_INVARIANT_V0;
  }
  return CASTLE_EXECUTION_INVARIANT_V0;
}
