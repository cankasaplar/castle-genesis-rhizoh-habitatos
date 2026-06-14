import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  hydrateWorldSpaceCastleAnchorV0,
  persistWorldSpaceCastleAnchorV0
} from "../castleWorldSpaceContinuityV0.js";

describe("castleWorldSpaceContinuityV0", () => {
  beforeEach(() => {
    localStorage.clear();
    delete window.__CASTLE_NEXUS_GEO__;
    delete window.__CASTLE_CLIENT_CASTLE_STATE__;
  });

  afterEach(() => {
    localStorage.clear();
    delete window.__CASTLE_NEXUS_GEO__;
    delete window.__CASTLE_CLIENT_CASTLE_STATE__;
  });

  it("persistWorldSpaceCastleAnchorV0 writes continuity and session geo", () => {
    persistWorldSpaceCastleAnchorV0(41.01, 28.98, { owner: "u1", source: "test" });
    expect(window.__CASTLE_NEXUS_GEO__?.lat).toBe(41.01);
    expect(window.__CASTLE_CLIENT_CASTLE_STATE__).toBe("ACTIVE");
    const disk = JSON.parse(localStorage.getItem("rhizoh.continuity.v1") || "{}");
    expect(disk.meta?.castleState?.phase).toBe("SEED");
    expect(disk.meta?.castleState?.anchorLat).toBe(41.01);
  });

  it("hydrateWorldSpaceCastleAnchorV0 restores geo after refresh", () => {
    persistWorldSpaceCastleAnchorV0(40.5, 29.1, { owner: "u1" });
    delete window.__CASTLE_NEXUS_GEO__;
    delete window.__CASTLE_CLIENT_CASTLE_STATE__;
    expect(hydrateWorldSpaceCastleAnchorV0()).toBe(true);
    expect(window.__CASTLE_NEXUS_GEO__?.lat).toBe(40.5);
    expect(window.__CASTLE_CLIENT_CASTLE_STATE__).toBe("ACTIVE");
  });

  it("skips hydrate when castle was purged", () => {
    persistWorldSpaceCastleAnchorV0(40.5, 29.1, { owner: "u1" });
    const disk = JSON.parse(localStorage.getItem("rhizoh.continuity.v1") || "{}");
    disk.meta.castleState.phase = "PURGED";
    localStorage.setItem("rhizoh.continuity.v1", JSON.stringify(disk));
    delete window.__CASTLE_NEXUS_GEO__;
    expect(hydrateWorldSpaceCastleAnchorV0()).toBe(false);
  });
});
