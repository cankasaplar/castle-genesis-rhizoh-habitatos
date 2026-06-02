import { describe, expect, it } from "vitest";
import {
  evaluateSttContaminationV0,
  isPlatformOutroTemplateV0,
  isUiChromeEchoTemplateV0
} from "../voiceSttContaminationGuardV0.js";

describe("voiceSttContaminationGuardV0", () => {
  it("flags YouTube subscribe outro", () => {
    const t =
      "Don't forget to like, comment, and subscribe! Don't forget to like, comment, share and subscribe";
    expect(isPlatformOutroTemplateV0(t)).toBe(true);
    const ev = evaluateSttContaminationV0(t, { strategy: "split_merged" });
    expect(ev.contaminated).toBe(true);
    expect(ev.reason).toBe("platform_template_leak");
  });

  it("flags TR channel subscribe footer", () => {
    const t = "Kanalıma abone olduğunuz için teşekkür ederim";
    expect(isUiChromeEchoTemplateV0(t)).toBe(true);
    const ev = evaluateSttContaminationV0(t);
    expect(ev.reason).toBe("ui_chrome_echo");
  });

  it("does not flag short genuine greeting", () => {
    expect(evaluateSttContaminationV0("merhaba").contaminated).toBe(false);
  });
});
