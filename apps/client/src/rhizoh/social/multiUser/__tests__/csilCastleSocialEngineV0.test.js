import { describe, expect, it } from "vitest";
import { createInitialSocialRegistry } from "../../csil/socialRegistry.js";
import { runCsilCastleSocialEngineStepV0 } from "../csilCastleSocialEngineV0.js";

describe("runCsilCastleSocialEngineStepV0", () => {
  it("merges overlap focus + CSIL registry advance", () => {
    const reg = createInitialSocialRegistry();
    const out = runCsilCastleSocialEngineStepV0({
      registry: reg,
      input: {
        message: "",
        operatorId: "op1",
        operatorLabel: "Alice",
        sessionKey: "op1",
        hasFirebaseUser: true,
        firebaseUid: "u1",
        trust: 0.5,
        familiarity: 0.5,
        roomTension: 0.2,
        routerIntent: "CHAT",
        castlePeers: [
          { id: "peer-b", label: "B", bridged: false },
          { id: "peer-c", label: "C", bridged: false }
        ],
        countUserMessage: false,
        browserPresence: {}
      },
      speechEvents: [
        { userId: "a", ts: 10 },
        { userId: "b", ts: 20 }
      ],
      silenceMs: 100,
      distinctLangCount: 1
    });
    expect(out.focus?.userId).toBe("a");
    expect(out.shadowListeners).toHaveLength(1);
    expect(out.registry).toBeTruthy();
    expect(out.rhizohRuntimeRole).toBe("MEDIATOR");
  });
});
