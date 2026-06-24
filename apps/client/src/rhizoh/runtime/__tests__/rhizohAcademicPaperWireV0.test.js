import { describe, expect, it } from "vitest";
import {
  buildRhizohAcademicPaperPackV0,
  RHIZOH_ACADEMIC_PAPER_PUBLIC_MD_V0,
  ensureRhizohAcademicPaperWireV0
} from "../rhizohAcademicPaperWireV0.js";

describe("rhizohAcademicPaperWireV0", () => {
  it("builds paper pack with public markdown url", () => {
    const pack = buildRhizohAcademicPaperPackV0({ locale: "tr" });
    expect(pack.markdownUrl).toBe(RHIZOH_ACADEMIC_PAPER_PUBLIC_MD_V0);
    expect(pack.interpretationOnly).toBe(true);
    expect(pack.readInBrowser).toContain("paper-v0.1.md");
  });

  it("mounts console download API", () => {
    ensureRhizohAcademicPaperWireV0();
    expect(typeof window.__rhizoh?.downloadPaperV01).toBe("function");
    expect(typeof window.__rhizoh?.paperV01).toBe("function");
  });
});
