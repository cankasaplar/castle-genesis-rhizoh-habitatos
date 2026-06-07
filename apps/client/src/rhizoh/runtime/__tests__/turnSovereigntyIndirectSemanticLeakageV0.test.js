import { describe, expect, it } from "vitest";
import {
  scanIndirectSemanticLeakageV0,
  sanitizeExecutionPayloadV0,
  guardExecutionSurfaceAgainstObservationLeakageV0
} from "../turnSovereigntyIndirectSemanticLeakageV0.js";
import { applyTurnSovereigntyPromptScopeToContextV0 } from "../turnSovereigntyWireV0.js";
import { lockTurnSovereigntyV0 } from "../behavioralTurnSovereigntyV0.js";
import {
  buildCalibrationGovernorStateV0,
  commitCalibrationProposalV0
} from "../rhizohCalibrationGovernorV0.js";

describe("turnSovereigntyIndirectSemanticLeakageV0", () => {
  it("detects forbidden keys and semantic markers", () => {
    const scan = scanIndirectSemanticLeakageV0({
      behavioralDrift: { selfExplanation: "identity coherence low" },
      rhizohMemoryContract: "consistency hint: elevated_silent_observe"
    });
    expect(scan.clean).toBe(false);
    expect(scan.hits.some((h) => h.includes("behavioralDrift"))).toBe(true);
    expect(scan.hits.some((h) => h.includes("marker"))).toBe(true);
  });

  it("sanitizes observation payload before execution surface", () => {
    const raw = {
      message: "hello",
      behavioralDrift: { rates: { silentObserve: 0.9 } },
      rhizohMemoryContract: "driftSignals elevated_silent_observe detected"
    };
    const out = sanitizeExecutionPayloadV0(raw);
    expect(out.behavioralDrift).toBeUndefined();
    expect(out.rhizohMemoryContract).not.toContain("elevated_silent_observe");
    expect(out.rhizohMemoryContract).toContain("[OBSERVATION_STRIPPED]");
  });

  it("applyTurnSovereigntyPromptScope strips leaked observation from LLM context", () => {
    const lock = lockTurnSovereigntyV0({
      turnId: "SEM-1",
      input: { text: "nasılsın", modality: "text" },
      router: { intent: "conversation" }
    });
    const scoped = applyTurnSovereigntyPromptScopeToContextV0(
      {
        continuity: { behavioralDrift: { selfExplanation: "identity coherence" } },
        rhizohMemoryContract: "consistency hint appended"
      },
      lock
    );
    const scan = scanIndirectSemanticLeakageV0(scoped);
    expect(scan.clean).toBe(true);
    expect(scoped.continuity?.behavioralDrift).toBeUndefined();
  });

  it("guard logs semantic leak but returns sanitized payload", () => {
    const guarded = guardExecutionSurfaceAgainstObservationLeakageV0({
      surface: "llm_input",
      payload: { consistencyHint: "elevated_silent_observe" },
      moduleId: "test"
    });
    expect(guarded.scan.clean).toBe(false);
    expect(guarded.sanitized.consistencyHint).toBeUndefined();
  });
});

describe("rhizohCalibrationGovernorV0", () => {
  it("produces observation-only proposals without execution influence", () => {
    for (let i = 0; i < 10; i++) {
      lockTurnSovereigntyV0({
        turnId: `gov_${i}`,
        input: { text: i % 2 ? "sessiz kal" : "beni duyuyor musun", modality: "voice" },
        router: { intent: i % 2 ? "silence" : "presence" },
        runtime: { voiceGateOpen: true }
      });
    }
    const state = buildCalibrationGovernorStateV0();
    expect(state.influencesAuthority).toBe(false);
    expect(state.influencesExecution).toBe(false);
    expect(state.autoApply).toBe(false);
    if (state.proposals.length) {
      expect(state.proposals[0].founderQuestion).toContain("onaylıyor musun");
    }
  });

  it("commit is audit-only and does not auto-apply", () => {
    const state = buildCalibrationGovernorStateV0();
    const id = state.proposals[0]?.id || "cal_test_manual";
    const result = commitCalibrationProposalV0(id, { note: "founder ack" });
    expect(result.ok).toBe(true);
    expect(result.autoApplied).toBe(false);
  });
});
