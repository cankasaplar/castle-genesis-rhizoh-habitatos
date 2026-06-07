import { describe, expect, it } from "vitest";
import {
  isFoxLocomotionClipV1,
  pickFoxAnimationClipV1,
  resolveFoxMotionStateV1,
  shouldLoopFoxClipV1
} from "../foxConversationMotionV1.js";

const FOX_CLIPS = [
  { name: "Attack" },
  { name: "Idle" },
  { name: "Idle_2" },
  { name: "Idle_2_HeadLow" },
  { name: "Walk" },
  { name: "Gallop" },
  { name: "Jump_ToIdle" },
  { name: "Idle_HitReact_Left" }
];

describe("foxConversationMotionV1", () => {
  it("maps field states to motion buckets", () => {
    expect(resolveFoxMotionStateV1({ emotion: "listening", activation: 0.4 })).toBe("listening");
    expect(resolveFoxMotionStateV1({ emotion: "thinking", activation: 0.5 })).toBe("thinking");
    expect(resolveFoxMotionStateV1({ emotion: "speaking", activation: 0.8 })).toBe("trot");
    expect(resolveFoxMotionStateV1({ emotion: "neutral", live: true, activation: 0.65 })).toBe("walk");
  });

  it("picks idle and locomotion clips by name", () => {
    expect(pickFoxAnimationClipV1(FOX_CLIPS, "idle")?.name).toBe("Idle_2");
    expect(pickFoxAnimationClipV1(FOX_CLIPS, "listening")?.name).toBe("Idle_2_HeadLow");
    expect(pickFoxAnimationClipV1(FOX_CLIPS, "walk")?.name).toBe("Walk");
    expect(isFoxLocomotionClipV1(pickFoxAnimationClipV1(FOX_CLIPS, "trot"))).toBe(true);
    expect(shouldLoopFoxClipV1(pickFoxAnimationClipV1(FOX_CLIPS, "settle"))).toBe(false);
  });
});
