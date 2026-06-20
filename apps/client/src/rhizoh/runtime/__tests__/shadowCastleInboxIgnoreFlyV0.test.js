import { describe, expect, it, beforeEach } from "vitest";
import {
  __resetShadowCastleInboxForTestV0,
  appendShadowCastleInboxItemV0,
  ignoreShadowCastleInboxItemV0,
  listShadowCastleInboxItemsV0
} from "../shadowCastleInboxV0.js";
import { resolveMapPinGeoByIdV0 } from "../shadowCastleInboxFlyV0.js";

describe("shadowCastleInbox ignore + fly", () => {
  beforeEach(() => {
    __resetShadowCastleInboxForTestV0();
  });

  it("ignoreShadowCastleInboxItemV0 removes item from list", () => {
    const item = appendShadowCastleInboxItemV0({ bodyTr: "test" });
    expect(listShadowCastleInboxItemsV0().length).toBe(1);
    ignoreShadowCastleInboxItemV0(item.id);
    expect(listShadowCastleInboxItemsV0().length).toBe(0);
  });

  it("resolveMapPinGeoByIdV0 finds corporate tower pins", () => {
    const geo = resolveMapPinGeoByIdV0("gemini_tower");
    expect(geo?.ok !== false && geo?.lat).toBeTruthy();
    expect(Number.isFinite(geo?.lat)).toBe(true);
    expect(Number.isFinite(geo?.lon)).toBe(true);
    expect(geo?.nodeType).toBe("tower");
  });
});
