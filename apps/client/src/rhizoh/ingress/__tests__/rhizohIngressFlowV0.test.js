import { describe, expect, it, beforeEach } from "vitest";
import {
  clearClosedAdmissionSessionForTestV0,
  clearLegalPreambleAckForTestV0,
  deriveIngressPhaseV0,
  isClosedAdmissionCohortStepRequiredV0,
  normalizeIngressPhaseV0,
  resolveIngressRouteV0
} from "../ingress_router.js";
describe("rhizoh ingress flow", () => {
  beforeEach(() => {
    clearLegalPreambleAckForTestV0();
    clearClosedAdmissionSessionForTestV0();
  });

  it("resolveIngressRoute exposes closedAdmission block", () => {
    const r = resolveIngressRouteV0();
    expect(r.schema).toBe("castle.rhizoh.ingress_router.v0");
    expect(r.closedAdmission).toBeDefined();
  });

  it("deriveIngressPhase returns legal_preamble when required and not acked", () => {
    const orig = import.meta.env.VITE_RHIZOH_LEGAL_PREAMBLE;
    import.meta.env.VITE_RHIZOH_LEGAL_PREAMBLE = "1";
    try {
      expect(deriveIngressPhaseV0()).toBe("legal_preamble");
    } finally {
      import.meta.env.VITE_RHIZOH_LEGAL_PREAMBLE = orig;
    }
  });

  it("normalizeIngressPhase never returns invalid phase string", () => {
    const p = normalizeIngressPhaseV0("__invalid__");
    expect(["legal_preamble", "app", "cohort", "hold", "error"]).toContain(p);
  });

  it("cohort step required only when closed admission enabled", () => {
    const orig = import.meta.env.VITE_RHIZOH_CLOSED_ADMISSION;
    import.meta.env.VITE_RHIZOH_CLOSED_ADMISSION = "0";
    expect(isClosedAdmissionCohortStepRequiredV0()).toBe(false);
    import.meta.env.VITE_RHIZOH_CLOSED_ADMISSION = orig;
  });
});
