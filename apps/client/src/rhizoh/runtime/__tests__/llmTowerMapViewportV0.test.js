import { describe, expect, it } from "vitest";
import {
  buildLlmTowerMapRegistrySnapshotV0,
  resolveLlmTowerMarkerCoordsV0,
  resolveLlmTowerViewportFitNodesV0,
  tryExecuteLlmTowerFitFromTextV0
} from "../llmTowerMapViewportV0.js";
import { SOVEREIGN_TOWERS_V0 } from "../sovereignWorldMapNodesV0.js";

describe("llmTowerMapViewportV0", () => {
  it("lists all 7 LLM towers for viewport fit", () => {
    const nodes = resolveLlmTowerViewportFitNodesV0();
    expect(nodes.length).toBe(8);
    expect(nodes.some((n) => n.id === "gemini_tower")).toBe(true);
    expect(nodes.some((n) => n.id === "sora_tower")).toBe(true);
    expect(nodes.some((n) => n.id === "rhizoh_portal")).toBe(true);
  });

  it("buildLlmTowerMapRegistrySnapshotV0 covers provider registry", () => {
    const snap = buildLlmTowerMapRegistrySnapshotV0();
    expect(snap.count).toBe(7);
    expect(snap.towers.map((t) => t.id)).toContain("mistral_tower");
    expect(snap.towers.find((t) => t.id === "claude_tower")?.provider).toBe("anthropic");
  });

  it("resolveLlmTowerMarkerCoordsV0 fans SF cluster at low zoom", () => {
    const gemini = SOVEREIGN_TOWERS_V0.find((t) => t.id === "gemini_tower");
    const claude = SOVEREIGN_TOWERS_V0.find((t) => t.id === "claude_tower");
    const gLow = resolveLlmTowerMarkerCoordsV0(gemini, 3);
    const cLow = resolveLlmTowerMarkerCoordsV0(claude, 3);
    expect(gLow.lat).not.toBe(cLow.lat);
    const gHigh = resolveLlmTowerMarkerCoordsV0(gemini, 8);
    expect(gHigh.lat).toBe(gemini.lat);
  });

  it("tryExecuteLlmTowerFitFromTextV0 matches tower-fit phrases", () => {
    expect(tryExecuteLlmTowerFitFromTextV0("tüm kuleleri göster")?.kind).toBe("LLM_TOWER_FIT");
    expect(tryExecuteLlmTowerFitFromTextV0("show all towers")?.kind).toBe("LLM_TOWER_FIT");
    expect(tryExecuteLlmTowerFitFromTextV0("paris git")).toBeNull();
  });

  it("tryExecuteLlmTowerFitFromTextV0 matches spiral satellite phrases", () => {
    expect(tryExecuteLlmTowerFitFromTextV0("uydu haritası")?.kind).toBe("SPIRAL_SATELLITE_FIT");
  });
});
