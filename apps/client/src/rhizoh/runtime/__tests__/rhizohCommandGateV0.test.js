import { describe, expect, it } from "vitest";
import {
  COMMAND_EXECUTE_CONFIDENCE_MIN_V0,
  COMMAND_MATCH_KIND_V0,
  resolveCommandGateV0,
  routeVoiceInputWithCommandGateV0
} from "../rhizohCommandGateV0.js";
import { VOICE_ROUTE_EXECUTION_V0 } from "../rhizohVoiceCommandRouterV0.js";
import { isHardSilentCommandRouteV0 } from "../rhizohCommandGateV0.js";

describe("rhizohCommandGateV0", () => {
  it("registry hard hit silent-executes above threshold", () => {
    const gate = resolveCommandGateV0("haritayı aç");
    expect(gate.matchKind).toBe(COMMAND_MATCH_KIND_V0.REGISTRY_HARD);
    expect(gate.commandConfidence).toBeGreaterThan(COMMAND_EXECUTE_CONFIDENCE_MIN_V0);
    expect(gate.silentExecute).toBe(true);
    const route = routeVoiceInputWithCommandGateV0("haritayı aç");
    expect(isHardSilentCommandRouteV0(route)).toBe(true);
    expect(route.execution).toBe(VOICE_ROUTE_EXECUTION_V0.LOCAL);
  });

  it("fuzzy hybrid does not silent-execute", () => {
    const gate = resolveCommandGateV0("what is my current state");
    expect(gate.matchKind).toBe(COMMAND_MATCH_KIND_V0.FUZZY);
    expect(gate.silentExecute).toBe(false);
    const route = routeVoiceInputWithCommandGateV0("what is my current state");
    expect(route.execution).not.toBe(VOICE_ROUTE_EXECUTION_V0.LOCAL);
  });

  it("long natural language falls through to LLM", () => {
    const route = routeVoiceInputWithCommandGateV0("explain quantum physics briefly");
    expect(isHardSilentCommandRouteV0(route)).toBe(false);
    expect(route.execution).toBe(VOICE_ROUTE_EXECUTION_V0.LLM);
  });
});
