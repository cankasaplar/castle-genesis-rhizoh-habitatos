import { describe, it, expect, beforeEach } from "vitest";
import {
  bindIdentityDriftContextV0,
  resolvePersistentSelfSignatureV0,
  clearSelfSignatureForTestV0
} from "../identityDriftBindingV0.js";

describe("identityDriftBindingV0", () => {
  beforeEach(() => {
    clearSelfSignatureForTestV0();
  });

  it("user identity persists across session identities", () => {
    const a = bindIdentityDriftContextV0({
      worldInstanceId: "wi_session_a",
      timeZone: "Europe/Istanbul",
      locale: "tr"
    });
    const b = bindIdentityDriftContextV0({
      worldInstanceId: "wi_session_b",
      timeZone: "Europe/Istanbul",
      locale: "tr"
    });
    expect(a.selfSignature).toBe(b.selfSignature);
    expect(a.sessionIdentity).not.toBe(b.sessionIdentity);
    expect(a.userIdentity).toMatch(/^self_/);
  });

  it("self signature is stable once minted", () => {
    const first = resolvePersistentSelfSignatureV0({ timeZone: "UTC", locale: "en" });
    const second = resolvePersistentSelfSignatureV0({ timeZone: "UTC", locale: "en" });
    expect(second).toBe(first);
  });
});
