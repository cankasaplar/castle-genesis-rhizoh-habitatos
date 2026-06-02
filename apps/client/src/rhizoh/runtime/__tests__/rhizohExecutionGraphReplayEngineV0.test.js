import { describe, expect, it, beforeEach } from "vitest";
import {
  __resetExecutionReplayEngineForTestV0,
  buildExecutionReplayTapeFromTraceV0,
  diffExecutionReplayTapesV0,
  replayVoiceExecutionV0,
  simulateVoiceExecutionReplayV0
} from "../rhizohExecutionGraphReplayEngineV0.js";
import { __resetCommandExecutionGraphForTestV0 } from "../rhizohCommandExecutionGraphV0.js";
import { __resetFinalLanguageCommitForTestV0 } from "../rhizohFinalLanguageCommitV0.js";
import {
  __resetOlpStateForTestV0,
  hydrateOlpFromPersistedPreferenceV0
} from "../rhizohOutputLanguagePolicyV0.js";
import {
  COMMAND_LISTENING_STATE_V0,
  __resetCommandStateMachineForTestV0,
  readCommandStateMachineV0
} from "../rhizohCommandStateMachineV0.js";
import { __resetCommandRoutePreheatForTestV0 } from "../rhizohCommandRoutePreheatV0.js";

describe("rhizohExecutionGraphReplayEngineV0", () => {
  beforeEach(() => {
    __resetExecutionReplayEngineForTestV0();
    __resetCommandExecutionGraphForTestV0();
    __resetCommandStateMachineForTestV0();
    __resetFinalLanguageCommitForTestV0();
    __resetCommandRoutePreheatForTestV0();
    __resetOlpStateForTestV0();
    localStorage.setItem("rhizoh.user.language.v0", "en");
    hydrateOlpFromPersistedPreferenceV0();
  });

  it("simulates local command without live side effects", () => {
    const report = simulateVoiceExecutionReplayV0("enter ghost mode", { restoreState: true });
    expect(report.simulated).toBe(true);
    expect(report.branchResult.execution).toBe("local");
    expect(report.graph?.summary?.execution).toBe("local");
    expect(report.languageCommit?.text).toMatch(/ghost/i);
    expect(report.tape.phaseIds).toContain("route");
    expect(report.tape.phaseIds).toContain("language_commit");
  });

  it("replays state transition in sandbox then restores session state", () => {
    const before = readCommandStateMachineV0().perception;
    simulateVoiceExecutionReplayV0("mode_ghost_enter", { restoreState: true });
    expect(readCommandStateMachineV0().perception).toBe(before);
  });

  it("deterministic replay matches baseline tape phase sequence", () => {
    const first = simulateVoiceExecutionReplayV0("tamam dur", { restoreState: true });
    const second = replayVoiceExecutionV0("tamam dur", {
      baselineTape: first.tape,
      restoreState: true
    });
    expect(second.diff?.deterministic).toBe(true);
    expect(second.diff?.executionMatch).toBe(true);
    expect(second.branchResult.execution).toBe("local");
  });

  it("simulates stop_listening state preview", () => {
    const report = simulateVoiceExecutionReplayV0("stop listening", { restoreState: false });
    expect(report.branchResult.statePreview?.state?.listening).toBe(
      COMMAND_LISTENING_STATE_V0.OFF
    );
    __resetCommandStateMachineForTestV0();
  });

  it("diff detects execution mismatch", () => {
    const a = simulateVoiceExecutionReplayV0("mute voice", { restoreState: true }).tape;
    const b = simulateVoiceExecutionReplayV0("explain quantum physics", {
      restoreState: true,
      mockLlmReply: "Simulated explanation."
    }).tape;
    const diff = diffExecutionReplayTapesV0(a, b);
    expect(diff.executionMatch).toBe(false);
    expect(diff.deterministic).toBe(false);
  });
});
