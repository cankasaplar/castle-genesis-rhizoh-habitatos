import { describe, expect, it } from "vitest";
import {
  applyRhizohDomainTagsToElementV0,
  resolveRhizohDomainTagsV0
} from "../rhizohDomainTagV0.js";

describe("rhizohDomainTagV0", () => {
  it("resolves world space tags with drawer", () => {
    const tags = resolveRhizohDomainTagsV0({
      pathname: "/world/space",
      surfaceId: "studio",
      drawerId: "studio"
    });
    expect(tags.domainId).toBe("world");
    expect(tags.worldDomain).toBe("space");
    expect(tags.tags).toContain("surface:studio");
    expect(tags.tags).toContain("drawer:studio");
  });

  it("applyRhizohDomainTagsToElementV0 sets data attributes", () => {
    const el = document.createElement("div");
    const tags = resolveRhizohDomainTagsV0({
      pathname: "/world/space",
      surfaceId: "world",
      drawerId: null
    });
    applyRhizohDomainTagsToElementV0(el, tags);
    expect(el.getAttribute("data-rhizoh-domain-id")).toBe("world");
    expect(el.getAttribute("data-rhizoh-world-domain")).toBe("space");
    expect(el.hasAttribute("data-rhizoh-drawer-open")).toBe(false);
  });
});
