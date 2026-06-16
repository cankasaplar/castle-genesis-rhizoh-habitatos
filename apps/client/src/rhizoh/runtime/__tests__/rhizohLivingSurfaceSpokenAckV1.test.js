import { describe, expect, it } from "vitest";
import {
  isLivingSurfaceSpokenBridgeEnabledV1,
  resolveLivingSurfaceSpokenAckCopyV1
} from "../../experience/rhizohLivingConversationSurfaceV1.js";
import { selectInstantAckV0 } from "../rhizohInstantAckSelectV0.js";

describe("living surface spoken ack", () => {
  it("spoken bridge is off by default", () => {
    expect(isLivingSurfaceSpokenBridgeEnabledV1()).toBe(false);
  });

  it("resolveLivingSurfaceSpokenAckCopyV1 is short", () => {
    expect(resolveLivingSurfaceSpokenAckCopyV1(true)).toBe("Tamam.");
    expect(resolveLivingSurfaceSpokenAckCopyV1(false)).toBe("Okay.");
  });

  it("selectInstantAckV0 uses short ack when living surface bridge off", () => {
    const ack = selectInstantAckV0({ locale: "tr", intent: "acknowledge" });
    expect(ack.text).toBe("Tamam.");
    expect(ack.text).not.toMatch(/hazırlıyorum/i);
  });
});
