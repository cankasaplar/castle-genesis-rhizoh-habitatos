import { describe, expect, it, beforeEach } from "vitest";
import {
  clearInviteOpsForTestV0,
  formatObserverInviteMailDraftV0,
  generateObserverInviteV0,
  mountInviteOpsConsoleV0
} from "../inviteOpsV0.js";

describe("inviteOpsV0", () => {
  beforeEach(() => {
    clearInviteOpsForTestV0();
  });

  it("generates invite URL and token for investor role", () => {
    const inv = generateObserverInviteV0({ role: "investor", cohortId: "demo", seed: 99 });
    expect(inv.inviteUrl).toContain("/invite");
    expect(inv.inviteToken).toMatch(/^rhizoh_inv_/);
    expect(inv.role).toBe("investor");
  });

  it("formats bilingual mail draft", () => {
    const inv = generateObserverInviteV0({ reviewerId: "friday" });
    const draft = formatObserverInviteMailDraftV0(inv, { observerName: "Test", locale: "en" });
    expect(draft.subject).toContain("Rhizoh");
    expect(draft.body).toContain(inv.inviteUrl);
    expect(draft.fromChannel).toBe("observe@rhizoh.com");
  });

  it("mounts console API", () => {
    mountInviteOpsConsoleV0();
    expect(typeof window.__rhizoh?.inviteOps?.generate).toBe("function");
    const inv = window.__rhizoh.inviteOps.generate({ role: "observer", seed: 1 });
    expect(inv.inviteUrl).toContain("/invite");
  });
});
