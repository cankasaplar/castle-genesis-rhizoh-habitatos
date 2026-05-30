import { describe, expect, it } from "vitest";
import {
  getCompanionArchetypeDefinitionV1,
  isValidCompanionArchetypeV1,
  listCompanionArchetypeDefinitionsV1,
  resolveCompanionArchetypeFromInvokeV1,
  stableCompanionUidV1,
  stubCompanionNarrativeOutputV1,
  stubCompanionResponseSummaryV1
} from "../runtime/companionAgentRegistryV1.js";

describe("companionAgentRegistryV1", () => {
  it("lists rhizoh, atlas, ghost with non-executive flags", () => {
    const defs = listCompanionArchetypeDefinitionsV1();
    expect(defs.map((d) => d.archetype).sort()).toEqual(["atlas", "ghost", "rhizoh"]);
    for (const d of defs) {
      expect(d.executive).toBe(false);
      expect(d.witnessWrite).toBe(false);
      expect(d.suggestionOnly).toBe(true);
    }
  });

  it("resolves invoke by agentUid substring", () => {
    expect(resolveCompanionArchetypeFromInvokeV1("sidekick-atlas-1")).toBe("atlas");
    expect(resolveCompanionArchetypeFromInvokeV1("ghost-guide")).toBe("ghost");
    expect(resolveCompanionArchetypeFromInvokeV1("rhizoh-prime")).toBe("rhizoh");
  });

  it("resolves invoke by intent mention", () => {
    expect(resolveCompanionArchetypeFromInvokeV1("agent:1", "@Atlas map the hall")).toBe("atlas");
    expect(resolveCompanionArchetypeFromInvokeV1("x", "@Ghost sense the room")).toBe("ghost");
    expect(resolveCompanionArchetypeFromInvokeV1("x", "@Rhizoh mood?")).toBe("rhizoh");
  });

  it("stableCompanionUidV1 uses archetype prefix", () => {
    expect(stableCompanionUidV1("atlas", "avatar:a")).toBe("atlas:companion:avatar:a");
    expect(stableCompanionUidV1("ghost", "avatar:b")).toBe("ghost:companion:avatar:b");
  });

  it("stubCompanionResponseSummaryV1 prefixes by archetype", () => {
    expect(stubCompanionResponseSummaryV1("atlas", "scan nodes")).toContain("Atlas");
    expect(stubCompanionResponseSummaryV1("ghost", undefined)).toContain("Ghost");
  });

  it("stubCompanionNarrativeOutputV1 attaches source provenance", () => {
    const out = stubCompanionNarrativeOutputV1("atlas", "scan", [
      "lab.observation.snapshot",
      "weather.api",
      "computeViscosity.v2"
    ]);
    expect(out.provenance.source_chain).toHaveLength(3);
    expect(out.provenance.trust_class).toBe("mixed_origin");
    expect(out.provenance.derivation_depth).toBe(3);
    expect(out.provenance.provenance_summary.dominant_source).toBe("computeViscosity.v2");
    expect(out.provenance.provenance_summary.confidence_shape).toBe("drifting");
  });

  it("isValidCompanionArchetypeV1 rejects unknown", () => {
    expect(isValidCompanionArchetypeV1("atlas")).toBe(true);
    expect(isValidCompanionArchetypeV1("nope")).toBe(false);
    expect(getCompanionArchetypeDefinitionV1("atlas")?.displayName).toBe("Atlas");
  });
});
