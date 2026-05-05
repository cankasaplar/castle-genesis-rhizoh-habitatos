import { describe, expect, it } from "vitest";
import { bootstrapKernelRootIfNeeded } from "../lib/bootstrapKernelRoot";
import { getStudioKernelState, resetRhizohStudioKernelStore, patchIdentity } from "../store/studioStore";

describe("bootstrap root soul", () => {
  it("creates root soul and seed mind on first login-shaped identity", () => {
    resetRhizohStudioKernelStore();
    patchIdentity({
      ownerId: "login-user-99",
      actor: { id: "login-user-99", kind: "human" },
      session: null,
      permissions: { "registry.*": true, "sim.*": true },
      delegates: [],
      sharedOwnerIds: []
    });

    bootstrapKernelRootIfNeeded("login-user-99", { environment: "default" });

    const s = getStudioKernelState();
    const soul = s.registry.soul["soul:login-user-99:root"];
    const mind = s.registry.mind.instance["mind:login-user-99:seed"];
    expect(soul).toBeDefined();
    expect(soul?.ownerId).toBe("login-user-99");
    expect(String(soul?.continuityHash).length).toBeGreaterThan(4);
    expect(mind).toBeDefined();
    expect(mind?.soulUid).toBe("soul:login-user-99:root");
  });
});
