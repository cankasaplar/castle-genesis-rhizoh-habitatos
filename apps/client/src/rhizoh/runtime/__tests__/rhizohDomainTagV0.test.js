import { describe, expect, it } from "vitest";
import {
  applyRhizohDomainTagsToElementV0,
  resolveRhizohDomainTagsV0
} from "../rhizohDomainTagV0.js";

describe("rhizohDomainTagV0", () => {
  it("resolves world space tags with overlay federation node", () => {
    const tags = resolveRhizohDomainTagsV0({
      pathname: "/world/space",
      surfaceId: "studio",
      drawerId: "studio",
      overlayNode: "studio"
    });
    expect(tags.hostDomain).toBe("world");
    expect(tags.overlayNode).toBe("studio");
    expect(tags.tags).toContain("overlay:studio");
    expect(tags.tags).toContain("host:world");
  });

  it("applyRhizohDomainTagsToElementV0 sets host and overlay attributes", () => {
    const el = document.createElement("div");
    const tags = resolveRhizohDomainTagsV0({
      pathname: "/world/space",
      surfaceId: "world",
      overlayNode: null
    });
    applyRhizohDomainTagsToElementV0(el, tags);
    expect(el.getAttribute("data-rhizoh-host-domain")).toBe("world");
    expect(el.hasAttribute("data-rhizoh-overlay-domain")).toBe(false);
  });
});
