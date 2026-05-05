import { describe, expect, it } from "vitest";
import { clearKernelAuditTrail, getKernelAuditTail, KernelGuardRun } from "../runtime/kernelGuard";
import type { IdentityState } from "../types/rskOntology";

const ownerIdentity = (perms: Record<string, boolean>): IdentityState => ({
  ownerId: "audit-owner",
  actor: { id: "audit-owner", kind: "human" },
  session: null,
  permissions: perms,
  delegates: [],
  sharedOwnerIds: []
});

describe("KernelGuard audit trail", () => {
  it("appends audit rows for allowed and denied runs", () => {
    clearKernelAuditTrail();

    KernelGuardRun({
      identity: ownerIdentity({ "registry.*": true }),
      action: "registry.mind.tick",
      payload: { instanceId: "mind-x" }
    });

    KernelGuardRun({
      identity: ownerIdentity({}),
      action: "registry.mind.tick",
      payload: { instanceId: "mind-x" }
    });

    const tail = getKernelAuditTail(10);
    expect(tail.length).toBeGreaterThanOrEqual(2);
    const tickRows = tail.filter((r) => r.action === "registry.mind.tick");
    expect(tickRows.some((r) => r.allowed)).toBe(true);
    expect(tickRows.some((r) => !r.allowed)).toBe(true);
  });
});
