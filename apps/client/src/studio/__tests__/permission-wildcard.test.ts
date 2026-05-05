import { describe, expect, it } from "vitest";
import { identityAllowsAction, permissionKeyAllowsAction } from "../runtime/permissionResolver";

describe("permission wildcard cascade", () => {
  it("registry.* matches nested mind actions", () => {
    expect(permissionKeyAllowsAction("registry.*", "registry.mind.register")).toBe(true);
    expect(identityAllowsAction({ "registry.*": true }, "registry.mind.register")).toBe(true);
  });

  it("registry.mind.* matches register without matching unrelated keys", () => {
    expect(permissionKeyAllowsAction("registry.mind.*", "registry.mind.register")).toBe(true);
    expect(permissionKeyAllowsAction("registry.mind.*", "registry.soul.register")).toBe(false);
    expect(identityAllowsAction({ "registry.mind.*": true }, "registry.mind.register")).toBe(true);
  });

  it("exact key matches only that action", () => {
    expect(permissionKeyAllowsAction("registry.mind.register", "registry.mind.register")).toBe(true);
    expect(permissionKeyAllowsAction("registry.mind.register", "registry.mind.tick")).toBe(false);
  });
});
