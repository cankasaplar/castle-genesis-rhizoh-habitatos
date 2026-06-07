import { describe, expect, it } from "vitest";
import {
  mapFieldStateToOctoEmotionV1,
  getOctoEmotionParamsV1,
  deriveOctoMotionDriveV1,
  isOctoConversationLiveV1,
  OCTO_CONVERSATION_TARGET_SIZE_V1
} from "../octoConversationMotionV1.js";

describe("octoConversationMotionV1", () => {
  it("maps speaking field to speaking emotion", () => {
    expect(mapFieldStateToOctoEmotionV1("SPEAKING")).toBe("speaking");
  });

  it("maps listening to listening emotion", () => {
    expect(mapFieldStateToOctoEmotionV1("listening")).toBe("listening");
  });

  it("provides frequency and color for thinking", () => {
    const p = getOctoEmotionParamsV1("thinking");
    expect(p.frequency).toBeGreaterThan(0);
    expect(p.color).toBeTruthy();
  });

  it("raises reach and activation when reply text is long", () => {
    const idle = deriveOctoMotionDriveV1({ fieldState: "idle", replyText: "" });
    const withReply = deriveOctoMotionDriveV1({
      fieldState: "speaking",
      replyText: "Bu uzun bir Rhizoh yanıtıdır ve tentacle uzanmasını tetiklemelidir. ".repeat(4)
    });
    expect(withReply.reach).toBeGreaterThan(idle.reach);
    expect(withReply.activation).toBeGreaterThan(idle.activation);
  });

  it("increases coil while thinking without reply", () => {
    const thinking = deriveOctoMotionDriveV1({ fieldState: "thinking", busy: true });
    expect(thinking.coil).toBeGreaterThan(0.4);
  });

  it("uses compact target size constant for conversation strip", () => {
    expect(OCTO_CONVERSATION_TARGET_SIZE_V1).toBe(0.42);
  });

  it("is idle until user types draft text", () => {
    expect(isOctoConversationLiveV1({ fieldState: "idle" })).toBe(false);
    expect(isOctoConversationLiveV1({ fieldState: "listening" })).toBe(false);
    expect(isOctoConversationLiveV1({ fieldState: "idle", draftText: "merhaba" })).toBe(true);
    const idleDrive = deriveOctoMotionDriveV1({ fieldState: "idle" });
    expect(idleDrive.live).toBe(false);
    expect(idleDrive.speed).toBe(0);
  });

  it("ramps swim speed when draft text grows", () => {
    const short = deriveOctoMotionDriveV1({ fieldState: "idle", draftText: "a" });
    const longer = deriveOctoMotionDriveV1({
      fieldState: "idle",
      draftText: "merhaba rhizoh dünya yüzme"
    });
    expect(short.live).toBe(true);
    expect(longer.speed).toBeGreaterThan(short.speed);
    expect(longer.activation).toBeGreaterThan(short.activation);
  });

  it("keeps reach minimal while typing draft only", () => {
    const typing = deriveOctoMotionDriveV1({
      fieldState: "idle",
      draftText: "cümle bitene kadar serbest yüzüş"
    });
    const speaking = deriveOctoMotionDriveV1({
      fieldState: "speaking",
      replyText: "uzun yanıt metni ".repeat(6)
    });
    expect(typing.draftOnly).toBe(true);
    expect(typing.swimMode).toBe("typing");
    expect(typing.reach).toBeLessThan(0.1);
    expect(speaking.reach).toBeGreaterThan(typing.reach);
  });

  it("switches to slower coast swim after send", () => {
    const coast = deriveOctoMotionDriveV1({
      fieldState: "speaking",
      replyText: "yanıt geldi"
    });
    const typing = deriveOctoMotionDriveV1({
      fieldState: "idle",
      draftText: "yazıyorum"
    });
    expect(coast.swimMode).toBe("coast");
    expect(coast.speed).toBeLessThan(typing.speed);
  });
});
