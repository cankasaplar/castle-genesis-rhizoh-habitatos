import { describe, expect, it, beforeEach } from "vitest";
import {
  acknowledgeLegalAccessV0,
  acknowledgeLegalPreambleV0,
  clearClosedAdmissionSessionForTestV0,
  clearLegalPreambleAckForTestV0,
  getLegalAcceptanceAuditV0,
  getCookieConsentV0,
  setCookieConsentV0,
  COHORT_GATE_DECISION_V0,
  completeCohortGateNoOpV0,
  deriveIngressPhaseV0,
  getCohortGateDecisionV0,
  getIngressEnvFlagsV0,
  getLegalPreambleCopyV0,
  hardResetIngressToEntryPhaseV0,
  INGRESS_ROUTE_V0,
  isCohortGateAcceptedV0,
  isLegalPreambleRequiredV0,
  normalizeIngressPhaseV0,
  resolveIngressRouteV0
} from "../ingress_router.js";
import { clearClosedAdmissionForTestV0 as clearEngine } from "../closedUserAdmissionEngineV0.js";

describe("ingress_router v0.1", () => {
  beforeEach(() => {
    clearLegalPreambleAckForTestV0();
    clearClosedAdmissionSessionForTestV0();
    clearEngine();
  });

  it("resolveIngressRoute returns legal_preamble when required and not acked", () => {
    const required = isLegalPreambleRequiredV0();
    const route = resolveIngressRouteV0();
    expect(route.fallbackRoute).toBeDefined();
    if (required) {
      expect(route.route).toBe(INGRESS_ROUTE_V0.LEGAL_PREAMBLE);
      expect(route.fallbackRoute).toBe(INGRESS_ROUTE_V0.LEGAL_PREAMBLE);
    } else {
      expect(route.route).toBe(INGRESS_ROUTE_V0.APP);
    }
  });

  it("after full ack routes to app and writes audit", () => {
    acknowledgeLegalAccessV0({
      specSha256: "test",
      acceptances: { terms: true, kvkkAydinlatma: true, aiCrossBorderConsent: true }
    });
    const route = resolveIngressRouteV0();
    expect(route.acked).toBe(true);
    expect(route.route).toBe(INGRESS_ROUTE_V0.APP);
    const audit = getLegalAcceptanceAuditV0();
    expect(audit.length).toBeGreaterThan(0);
    expect(audit[audit.length - 1].acceptances.aiCrossBorderConsent).toBe(true);
  });

  it("partial ack does not pass gate", () => {
    acknowledgeLegalAccessV0({
      acceptances: { terms: true, kvkkAydinlatma: true, aiCrossBorderConsent: false }
    });
    const route = resolveIngressRouteV0();
    expect(route.acked).toBe(false);
  });

  it("normalizeIngressPhase hard-resets unknown without carrying cohort state", () => {
    completeCohortGateNoOpV0({ decision: COHORT_GATE_DECISION_V0.ACCEPTED });
    expect(getCohortGateDecisionV0()).toBe(COHORT_GATE_DECISION_V0.ACCEPTED);
    normalizeIngressPhaseV0("not_a_real_phase");
    expect(getCohortGateDecisionV0()).toBe(null);
  });

  it("completeCohortGateNoOp does not require admission engine", () => {
    completeCohortGateNoOpV0({ decision: COHORT_GATE_DECISION_V0.ACCEPTED });
    expect(isCohortGateAcceptedV0()).toBe(true);
  });

  it("resolveIngressRoute declares fallbackCarriesState false", () => {
    expect(resolveIngressRouteV0().fallbackCarriesState).toBe(false);
  });

  it("hardResetIngressToEntryPhase clears transient only", () => {
    acknowledgeLegalPreambleV0({});
    completeCohortGateNoOpV0({ decision: COHORT_GATE_DECISION_V0.ACCEPTED });
    hardResetIngressToEntryPhaseV0();
    expect(getCohortGateDecisionV0()).toBe(null);
  });

  it("legal copy uses access gate framing + separate checkboxes", () => {
    const copy = getLegalPreambleCopyV0();
    expect(copy.kicker).toMatch(/GEÇİT/);
    expect(copy.checkboxes.terms).toMatch(/Kullanım Şartları/i);
    expect(copy.checkboxes.kvkk).toMatch(/KVKK/i);
    expect(copy.checkboxes.ai).toMatch(/yurtdışı/i);
    expect(copy.acceptLabel).toMatch(/devam/i);
  });

  it("cookie consent defaults analytics off", () => {
    setCookieConsentV0({ analytics: false });
    expect(getCookieConsentV0().analytics).toBe(false);
    expect(getCookieConsentV0().decided).toBe(true);
  });

  it("getIngressEnvFlags returns snapshot without behavior", () => {
    const flags = getIngressEnvFlagsV0();
    expect(flags).toHaveProperty("prod");
  });

  it("deriveIngressPhase matches route when legal required", () => {
    const orig = import.meta.env.VITE_RHIZOH_LEGAL_PREAMBLE;
    import.meta.env.VITE_RHIZOH_LEGAL_PREAMBLE = "1";
    try {
      expect(deriveIngressPhaseV0()).toBe(INGRESS_ROUTE_V0.LEGAL_PREAMBLE);
    } finally {
      import.meta.env.VITE_RHIZOH_LEGAL_PREAMBLE = orig;
    }
  });
});
