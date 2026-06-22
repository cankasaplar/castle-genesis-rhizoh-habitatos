import { beforeEach, describe, expect, it } from "vitest";
import { getAcademyLandingCopyV0, getFounderCircleCopyV0 } from "../academyFounderLandingCopyV0.js";
import {
  listFounderCircleInterestV0,
  mountFounderCircleConsoleV0,
  recordFounderCircleInterestV0,
  resetFounderCircleInterestConsoleV0
} from "../founderCircleInterestV0.js";

describe("academyFounderLandingCopyV0", () => {
  it("returns bilingual academy landing copy with paper href", () => {
    const en = getAcademyLandingCopyV0("en");
    const tr = getAcademyLandingCopyV0("tr");
    expect(en.paperHref).toBe("/rhizoh/academic/paper-v0.1.pdf");
    expect(tr.whatIs.length).toBeGreaterThan(2);
    expect(tr.roadmap.some((row) => row.item.includes("Founder Circle"))).toBe(true);
  });

  it("returns founder circle copy with honest not-buying list", () => {
    const copy = getFounderCircleCopyV0("en");
    expect(copy.price).toBe("$25");
    expect(copy.notBuying.some((line) => line.toLowerCase().includes("chess"))).toBe(true);
  });
});

describe("founderCircleInterestV0", () => {
  beforeEach(() => {
    localStorage.clear();
    resetFounderCircleInterestConsoleV0();
  });

  it("records and lists interest locally", () => {
    const row = recordFounderCircleInterestV0({ email: "witness@example.com", note: "hi" });
    expect(row.email).toBe("witness@example.com");
    expect(listFounderCircleInterestV0()).toHaveLength(1);
  });

  it("mounts console API", () => {
    mountFounderCircleConsoleV0();
    expect(typeof window.__rhizoh?.founderCircle?.interest).toBe("function");
  });
});
