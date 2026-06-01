import { describe, expect, it } from "vitest";
import {
  resolveTemporalDominantIntentV0,
  resolveTemporalPendingEchoV0
} from "../temporalSemanticEngineExampleV0.js";

describe("temporalSemanticEngineExampleV0", () => {
  it("maps memory words to CLOSURE intent", () => {
    expect(resolveTemporalDominantIntentV0("teşekkür ederim").type).toBe("CLOSURE");
  });

  it("maps korku echo to ACTION", () => {
    expect(resolveTemporalPendingEchoV0("korkuyorum").intent).toBe("ACTION");
  });
});
