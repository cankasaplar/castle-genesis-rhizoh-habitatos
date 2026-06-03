import { describe, expect, it, beforeEach } from "vitest";
import {
  evaluateInternalRepetitionRiskV0,
  evaluateSttContaminationV0,
  isPlatformOutroTemplateV0,
  isUiChromeEchoTemplateV0
} from "../voiceSttContaminationGuardV0.js";
import {
  __resetSttQuarantineBufferForTestV0,
  pushSttQuarantineEntryV0
} from "../rhizohSttQuarantineBufferV0.js";

describe("voiceSttContaminationGuardV0", () => {
  beforeEach(() => {
    __resetSttQuarantineBufferForTestV0();
  });

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

  it("allows stutter repetition without platform signature", () => {
    const stutter = "yani yani yani bugün biraz yorgunum dostum";
    expect(evaluateInternalRepetitionRiskV0(stutter).risky).toBe(false);
    expect(evaluateSttContaminationV0(stutter).contaminated).toBe(false);
  });

  it("drops repetition when platform signature present", () => {
    const t =
      "Don't forget to like, comment, and subscribe! Don't forget to like, comment, share and subscribe";
    expect(evaluateInternalRepetitionRiskV0(t).risky).toBe(true);
  });

  it("quarantine buffer retains suspicious transcript", () => {
    const row = pushSttQuarantineEntryV0({
      text: "فنحن نحن نحن",
      reasons: ["high_entropy_rtl"],
      originHash: "hdeadbeef"
    });
    expect(row.id).toMatch(/^stq_/);
    expect(row.channel).toBe("quarantine");
  });
});
