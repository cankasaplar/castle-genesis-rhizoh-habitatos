import { describe, expect, it } from "vitest";
import {
  resolveMapViewportFitNodesV0,
  resolveMapViewportHomeV0,
  resolveWorldSpaceMapRecenterHomeV0,
  RHIZOH_WORLD_SPACE_NEUTRAL_VIEW_V0
} from "../worldMapViewportBootstrapV0.js";
import { listSovereignWorldMapNodesForViewV0 } from "../sovereignWorldMapNodesV0.js";

describe("worldMapViewportBootstrapV0", () => {
  it("excludes spiral continent pins from initial fitBounds", () => {
    const all = listSovereignWorldMapNodesForViewV0();
    const fit = resolveMapViewportFitNodesV0(all);
    expect(fit.some((n) => n.type === "spiralmmo")).toBe(false);
    expect(fit.length).toBeGreaterThanOrEqual(2);
  });

  it("prefers user castle geo for home", () => {
    const home = resolveMapViewportHomeV0({ lat: 41.02, lon: 28.98 });
    expect(home.lat).toBe(41.02);
    expect(home.zoom).toBe(15);
  });

  it("world space recenter avoids demo Istanbul cluster without anchor", () => {
    const home = resolveWorldSpaceMapRecenterHomeV0();
    expect(home.lat).toBe(RHIZOH_WORLD_SPACE_NEUTRAL_VIEW_V0.lat);
    expect(home.lon).toBe(RHIZOH_WORLD_SPACE_NEUTRAL_VIEW_V0.lon);
  });

  it("world space neutral fit skips Istanbul regional cluster", () => {
    const all = listSovereignWorldMapNodesForViewV0();
    const fit = resolveMapViewportFitNodesV0(all, { worldSpaceNeutral: true });
    expect(fit.some((n) => n.type === "spiralmmo")).toBe(false);
    expect(fit.length).toBe(0);
  });
});
