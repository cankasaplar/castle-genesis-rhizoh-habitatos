import { describe, it, expect } from "vitest";
import {
  buildRhizohDialogueThreadSnapshotV1,
  advanceRhizohDialogueThreadV1,
  computeFoxContinuityPressureV1,
  buildRhizohDialogueThreadPromptBlockV1,
  coalesceRhizohDialogueThreadV1
} from "../rhizohDialogueThreadV1.js";

describe("rhizohDialogueThreadV1", () => {
  it("builds snapshot with previous turn and emotional trajectory", () => {
    const snap = buildRhizohDialogueThreadSnapshotV1({
      userTurnCount: 3,
      recentTurns: [
        { user: "Bugün yalnız hissediyorum", assistant: "Buradayım, dinliyorum.", ts: Date.now() - 1000 }
      ],
      emotions: { tension: 0.42, repair: 0.2, care: 0.55, trust: 0.48 },
      narrativeThread: { focusIntent: "REFLECT", intentChain: ["CHAT", "REFLECT", "REFLECT"] },
      narrativeArc: { phase: "deepen", trajectory: "shared_inquiry", bondTrend: 0.08 }
    });
    expect(snap.previousTurn?.user).toContain("yalnız");
    expect(snap.emotionalTrajectory.samples.length).toBeGreaterThan(0);
    expect(snap.narrativeSlope.steepness).toBeGreaterThan(0);
    expect(String(buildRhizohDialogueThreadPromptBlockV1(snap))).toContain("dialogue thread");
  });

  it("advances thread after turn and increases turnIndex", () => {
    const pre = coalesceRhizohDialogueThreadV1({ turnIndex: 2 });
    const next = advanceRhizohDialogueThreadV1(pre, {
      userMessage: "Peki yarın ne yapmalıyım?",
      assistantMessage: "Önce ne istediğini netleştirelim.",
      intent: "REFLECT",
      emotions: { tension: 0.35, repair: 0.3, care: 0.6, trust: 0.5 },
      narrativeThread: { focusIntent: "REFLECT" },
      turnIndex: 3
    });
    expect(next.turnIndex).toBe(3);
    expect(next.previousTurn?.assistant).toContain("netleştirelim");
    expect(next.emotionalTrajectory.samples.length).toBeGreaterThan(pre.emotionalTrajectory.samples.length);
  });

  it("tracks unresolved semantic tension from open questions", () => {
    const next = advanceRhizohDialogueThreadV1(null, {
      userMessage: "Bu konuda ne düşünüyorsun?",
      assistantMessage: "Birlikte bakalım.",
      intent: "ASK",
      emotions: { tension: 0.3, repair: 0.2, care: 0.4, trust: 0.4 }
    });
    expect(next.unresolvedSemanticTension.aggregate).toBeGreaterThan(0);
    expect(next.unresolvedSemanticTension.items.some((it) => it.id === "open_question")).toBe(true);
  });

  it("fox continuity pressure reads dialogue thread without producing dialogue", () => {
    const thread = advanceRhizohDialogueThreadV1(null, {
      userMessage: "20 gündür aynı konuyu taşıyorum",
      assistantMessage: "Devam edelim.",
      intent: "REFLECT",
      emotions: { tension: 0.25, repair: 0.35, care: 0.7, trust: 0.62 },
      narrativeThread: { focusIntent: "REFLECT", intentChain: ["REFLECT", "REFLECT", "REFLECT"] },
      narrativeArc: { phase: "meaning", trajectory: "shared_inquiry", bondTrend: 0.12 }
    });
    const pressure = computeFoxContinuityPressureV1(thread);
    expect(pressure.role).toBe("context_physics_engine");
    expect(pressure.pressure).toBeGreaterThan(0.35);
    expect(pressure.inputs.dialogueContinuity).toBeGreaterThan(0);
  });
});
