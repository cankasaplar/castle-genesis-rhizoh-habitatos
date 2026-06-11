import { describe, expect, it, beforeEach } from "vitest";
import {
  clearClosedAdmissionSessionForTestV0,
  clearLegalPreambleAckForTestV0,
  deriveIngressPhaseV0,
  isClosedAdmissionCohortStepRequiredV0,
  isLanguagePickerRequiredV0,
  normalizeIngressPhaseV0,
  resolveIngressRouteV0
} from "../ingress_router.js";
import { clearUiLocalePickedForTestV0, writeUiLocaleV0 } from "../../runtime/rhizohUiLocaleV0.js";
describe("rhizoh ingress flow", () => {
  beforeEach(() => {
    clearLegalPreambleAckForTestV0();
    clearClosedAdmissionSessionForTestV0();
    clearUiLocalePickedForTestV0();
  });

  it("resolveIngressRoute exposes closedAdmission block", () => {
    const r = resolveIngressRouteV0();
    expect(r.schema).toBe("castle.rhizoh.ingress_router.v0");
    expect(r.closedAdmission).toBeDefined();
  });

  it("deriveIngressPhase returns language when locale not picked", () => {
    expect(isLanguagePickerRequiredV0()).toBe(true);
    expect(deriveIngressPhaseV0()).toBe("language");
  });

  it("deriveIngressPhase keeps unified entry in language phase when language profile is missing", () => {
    writeUiLocaleV0("en");
    const orig = import.meta.env.VITE_RHIZOH_LEGAL_PREAMBLE;
    import.meta.env.VITE_RHIZOH_LEGAL_PREAMBLE = "1";
    try {
      expect(deriveIngressPhaseV0()).toBe("language");
    } finally {
      import.meta.env.VITE_RHIZOH_LEGAL_PREAMBLE = orig;
    }
  });

  it("normalizeIngressPhase never returns invalid phase string", () => {
    const p = normalizeIngressPhaseV0("__invalid__");
    expect(["language", "legal_preamble", "app", "cohort", "hold", "error"]).toContain(p);
  });

  it("cohort step required only when closed admission enabled", () => {
    const orig = import.meta.env.VITE_RHIZOH_CLOSED_ADMISSION;
    import.meta.env.VITE_RHIZOH_CLOSED_ADMISSION = "0";
    expect(isClosedAdmissionCohortStepRequiredV0()).toBe(false);
    import.meta.env.VITE_RHIZOH_CLOSED_ADMISSION = orig;
  });
});
