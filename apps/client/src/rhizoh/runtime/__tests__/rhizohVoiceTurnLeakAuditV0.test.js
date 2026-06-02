import { describe, expect, it, beforeEach } from "vitest";
import {
  beginVoiceTurnLeakAuditV0,
  finishVoiceTurnLeakAuditV0,
  noteVoiceTurnLeakAuditV0,
  patchVoiceTurnLeakAuditV0,
  __resetVoiceTurnLeakAuditForTestV0
} from "../rhizohVoiceTurnLeakAuditV0.js";
import { CMD_EXEC_DECISION_V0 } from "../rhizohCommandExecutionTraceV0.js";

describe("rhizohVoiceTurnLeakAuditV0", () => {
  beforeEach(() => {
    __resetVoiceTurnLeakAuditForTestV0();
  });

  it("flags silent_execute_then_llm when local path leaks to LLM", () => {
    beginVoiceTurnLeakAuditV0({ source: "mic", preview: "haritayı aç" });
    patchVoiceTurnLeakAuditV0({
      inputClass: "COMMAND",
      cmdDecision: CMD_EXEC_DECISION_V0.SILENT_EXECUTE,
      matchKind: "registry_hard"
    });
    noteVoiceTurnLeakAuditV0("local_execute");
    noteVoiceTurnLeakAuditV0("llm_query_started");
    const entry = finishVoiceTurnLeakAuditV0();
    expect(entry.leakRisk).toBe(true);
    expect(entry.leakFlags).toContain("silent_execute_then_llm");
    expect(entry.leakFlags).toContain("silent_execute_and_llm_same_turn");
  });

  it("flags script_reject_but_input_shown", () => {
    beginVoiceTurnLeakAuditV0({ preview: "garbage" });
    noteVoiceTurnLeakAuditV0("stt_script_reject");
    noteVoiceTurnLeakAuditV0("input_box_written");
    const entry = finishVoiceTurnLeakAuditV0();
    expect(entry.leakFlags).toContain("script_reject_but_input_shown");
  });

  it("clean dialogue turn has no leak flags", () => {
    beginVoiceTurnLeakAuditV0({ source: "mic", preview: "nasılsın" });
    patchVoiceTurnLeakAuditV0({
      inputClass: "DIALOGUE",
      cmdDecision: CMD_EXEC_DECISION_V0.LLM
    });
    noteVoiceTurnLeakAuditV0("stt_validated");
    noteVoiceTurnLeakAuditV0("input_box_written");
    noteVoiceTurnLeakAuditV0("llm_query_started");
    const entry = finishVoiceTurnLeakAuditV0();
    expect(entry.leakRisk).toBe(false);
    expect(entry.leakFlags).toHaveLength(0);
  });
});
