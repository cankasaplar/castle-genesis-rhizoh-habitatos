import { describe, expect, it } from "vitest";
import {
  resolveDominantIntentV0,
  resolvePendingEchoV0
} from "../physicalCognitionEngineExampleV0.js";

describe("physicalCognitionEngineExampleV0", () => {
  it("maps neden to REASONING", () => {
    expect(resolveDominantIntentV0("neden böyle").name).toBe("REASONING");
  });

  it("maps teşekkür echo intent to MEMORY", () => {
    expect(resolvePendingEchoV0("çok teşekkürler").intent).toBe("MEMORY");
  });
});
