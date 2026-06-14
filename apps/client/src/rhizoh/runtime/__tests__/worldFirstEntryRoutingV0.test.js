import { describe, expect, it } from "vitest";
import { RHIZOH_WORLD_DRAWER_DOMAIN_V0 } from "../rhizohWorldDrawerDomainV0.js";
import { resolveWorldDomainFromPathV0 } from "../rhizohWorldDomainRoutesV0.js";

describe("world first entry routing", () => {
  it("space path resolves to space domain", () => {
    expect(resolveWorldDomainFromPathV0("/world/space")).toBe(RHIZOH_WORLD_DRAWER_DOMAIN_V0.SPACE);
  });

  it("social path resolves to social domain", () => {
    expect(resolveWorldDomainFromPathV0("/world/social")).toBe(RHIZOH_WORLD_DRAWER_DOMAIN_V0.SOCIAL);
  });

  it("world hub redirects target is space path", () => {
    expect(resolveWorldDomainFromPathV0("/world")).toBe(RHIZOH_WORLD_DRAWER_DOMAIN_V0.SPACE);
  });
});
