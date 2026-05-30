import { describe, it, expect } from "vitest";
import {
  buildStorySnapshotForTurnV0,
  scoreStoryContinuityV0,
  storyContinuityGuaranteeFromScoreV0
} from "../rhizohStorySnapshotEngineV0.js";

describe("rhizohStorySnapshotEngineV0", () => {
  it("builds who/where/last/open from recent turns", () => {
    const snap = buildStorySnapshotForTurnV0({
      userMessage: "Devam edelim mi?",
      recentTurns: [{ user: "Dün konuştuk", assistant: "Evet, hatırlıyorum." }],
      narrativeThread: { arcSummary: "intro→trust", lastUserSnippet: "Dün" },
      conversationPhase: "TRUST_BUILD",
      persona: { firstName: "Metehan" }
    });
    expect(snap.who).toBeTruthy();
    expect(snap.whatHappenedLast).toBeTruthy();
    expect(snap.unresolvedThreads.length).toBeGreaterThan(0);
    expect(snap.controlMode).toBe("hard_partial");
  });

  it("scores guarantee at 0.75+", () => {
    const score = scoreStoryContinuityV0({
      who: "Metehan",
      where: "world",
      whatHappenedLast: "last beat",
      unresolvedThreads: ["q1"],
      activeEntities: ["Rhizoh"]
    });
    expect(storyContinuityGuaranteeFromScoreV0(score)).toBe(true);
  });
});
