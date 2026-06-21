import { describe, expect, it } from "vitest";
import {
  getMeaningLayerSurfacesV0,
  getWhyAmIHerePanelV0
} from "../observerInviteMeaningLayerV0.js";

describe("observerInviteMeaningLayerV0", () => {
  it("exposes why am I here panel in EN", () => {
    const panel = getWhyAmIHerePanelV0("en");
    expect(panel.title).toMatch(/Why am I here/i);
    expect(panel.body).toMatch(/not interacting with an agent|causal system/i);
  });

  it("lists map chess castle meanings", () => {
    const layer = getMeaningLayerSurfacesV0("tr");
    expect(layer.surfaces.map((s) => s.id)).toEqual(["map", "chess", "castle"]);
    expect(layer.surfaces[1].role).toMatch(/Zamansal akıl yürütme|Temporal reasoning/i);
  });
});
