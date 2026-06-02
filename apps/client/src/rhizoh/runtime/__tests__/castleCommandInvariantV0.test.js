import { describe, expect, it } from "vitest";
import {
  CASTLE_COMMAND_INVARIANT_V0,
  assertCommandNeverUsesLlmV0,
  validateLocalCommandPostSttV0
} from "../castleCommandInvariantV0.js";

describe("castleCommandInvariantV0", () => {
  it("local route passes post-STT validation", () => {
    const v = validateLocalCommandPostSttV0({
      execution: "local",
      canonical: "mute_voice"
    });
    expect(v.ok).toBe(true);
    expect(v.invariant.rule).toBe(CASTLE_COMMAND_INVARIANT_V0.rule);
  });

  it("assertCommandNeverUsesLlmV0 marks local bypass", () => {
    expect(assertCommandNeverUsesLlmV0("local").llmBypass).toBe(true);
    expect(assertCommandNeverUsesLlmV0("llm").llmBypass).toBe(false);
  });
});
