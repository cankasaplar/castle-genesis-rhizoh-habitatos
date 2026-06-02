import { describe, expect, it, beforeEach } from "vitest";
import { exportCohortRuntimeSnapshotV0 } from "../rhizohCohortRuntimeSnapshotV0.js";
import { simulateVoiceExecutionReplayV0 } from "../rhizohExecutionGraphReplayEngineV0.js";
import {
  __resetOlpStateForTestV0,
  hydrateOlpFromPersistedPreferenceV0
} from "../rhizohOutputLanguagePolicyV0.js";
import { __resetCommandStateMachineForTestV0 } from "../rhizohCommandStateMachineV0.js";
import { __resetFinalLanguageCommitForTestV0 } from "../rhizohFinalLanguageCommitV0.js";

describe("rhizohCohortRuntimeSnapshotV0", () => {
  beforeEach(() => {
    __resetOlpStateForTestV0();
    __resetCommandStateMachineForTestV0();
    __resetFinalLanguageCommitForTestV0();
    localStorage.setItem("rhizoh.user.language.v0", "en");
    hydrateOlpFromPersistedPreferenceV0();
  });

  it("exports core + stability + replay sections", () => {
    simulateVoiceExecutionReplayV0("mute voice", { restoreState: true });
    const snap = exportCohortRuntimeSnapshotV0({ runAttackSuite: true, maxReplayTapes: 5 });
    expect(snap.schema).toContain("cohort_runtime_snapshot");
    expect(snap.core.commandState).toBeTruthy();
    expect(snap.stability.hybridLeakageAttackReport?.passCount).toBeGreaterThan(0);
    expect(snap.replay.tapes.length).toBeGreaterThanOrEqual(1);
    expect(snap.replay.traceIds.length).toBeGreaterThanOrEqual(1);
  });
});
