import { describe, expect, it } from "vitest";
import {
  RHIZOH_LOCAL_COMMAND_REGISTRY_V0,
  buildLocalCommandAliasIndexV0
} from "../rhizohLocalCommandRegistryV0.js";
import { normalizeVoiceCommandTokenV0 } from "../rhizohVoiceCommandRouterV0.js";

describe("rhizohLocalCommandRegistryV0", () => {
  it("registers all major layers", () => {
    const layers = new Set(Object.values(RHIZOH_LOCAL_COMMAND_REGISTRY_V0).map((r) => r.layer));
    expect(layers.has("media")).toBe(true);
    expect(layers.has("audio")).toBe(true);
    expect(layers.has("map")).toBe(true);
    expect(layers.has("camera")).toBe(true);
    expect(layers.has("system")).toBe(true);
  });

  it("every entry is localOnly with handler binding", () => {
    for (const row of Object.values(RHIZOH_LOCAL_COMMAND_REGISTRY_V0)) {
      expect(row.localOnly).toBe(true);
      expect(row.handler).toMatch(/HandlerV0$/);
      expect(row.aliases.length).toBeGreaterThan(0);
    }
  });

  it("alias index resolves ghost mode and open map", () => {
    const idx = buildLocalCommandAliasIndexV0(normalizeVoiceCommandTokenV0);
    expect(idx.get("enter ghost mode")).toBe("mode_ghost_enter");
    expect(idx.get("open map")).toBe("map_open");
  });
});
