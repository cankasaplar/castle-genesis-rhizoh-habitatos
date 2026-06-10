import { describe, expect, it } from "vitest";
import {
  CASTLE_ECOSYSTEM_REGISTRY_V0,
  getCastleEcosystemNodeByIdV0,
  listCastleEcosystemNodesV0
} from "../castleEcosystemRegistryV0.js";

describe("castleEcosystemRegistryV0", () => {
  it("lists curated Istanbul ecosystem nodes", () => {
    const nodes = listCastleEcosystemNodesV0();
    expect(nodes.length).toBeGreaterThanOrEqual(3);
    expect(nodes.some((n) => n.id === "academy-node-1")).toBe(true);
    expect(nodes.some((n) => n.id === "culture-node-1")).toBe(true);
  });

  it("preserves BAU coordinates and amber color", () => {
    const bau = getCastleEcosystemNodeByIdV0("academy-node-1");
    expect(bau?.name).toMatch(/BAU/i);
    expect(bau?.coordinates.latitude).toBeCloseTo(41.0428, 3);
    expect(bau?.color).toBe("#FFB300");
  });

  it("registry is frozen SSOT object", () => {
    expect(Object.isFrozen(CASTLE_ECOSYSTEM_REGISTRY_V0)).toBe(true);
  });
});
