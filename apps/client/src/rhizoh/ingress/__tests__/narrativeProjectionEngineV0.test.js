import { describe, expect, it, beforeEach } from "vitest";
import { clearObserverTraceForTestV0, observeV0 } from "../observerReadOnlyHookV0.js";
import { lookupPinSemanticV0 } from "../epistemicPinSemanticRegistryV0.js";
import { resolveNarrativeFromObserverTraceV0 } from "../narrativeProjectionEngineV0.js";

describe("narrativeProjectionEngineV0", () => {
  beforeEach(() => {
    clearObserverTraceForTestV0();
  });

  it("resolves pin semantic description from observer trace", () => {
    observeV0({ type: "map_hover", target: "origin_home_serencebey", meta: { surface: "map", focus: 0.5 } });

    const out = resolveNarrativeFromObserverTraceV0({ locale: "en" });
    expect(out.primaryFocus?.entityId).toBe("origin_home_serencebey");
    expect(out.primaryFocus?.grounded).toBe(true);
    expect(out.primaryFocus?.description).toContain("bootstrap");
    expect(out.epistemicResonance).toBe(false);
    expect(out.bidirectionalInfluence).toBe(false);
    expect(out.influencesCausalGraph).toBe(false);
  });

  it("honestly reports unregistered pin without resonance", () => {
    observeV0({ type: "map_hover", target: "pin_42", meta: { surface: "map", focus: 0.4 } });

    const semantic = lookupPinSemanticV0("pin_42", { locale: "en" });
    expect(semantic.grounded).toBe(false);
    expect(semantic.registryHit).toBe("none");

    const out = resolveNarrativeFromObserverTraceV0({ locale: "en" });
    expect(out.primaryFocus?.entityId).toBe("42");
    expect(out.primaryFocus?.grounded).toBe(false);
    expect(out.semanticCoupling).toBe(false);
  });
});
