import { describe, expect, it, beforeEach } from "vitest";
import { clearRhizohSpeechProfileForTestV0 } from "../../runtime/rhizohSpeechProfileV0.js";
import { clearUiLocalePickedForTestV0, writeUiLocaleV0 } from "../../runtime/rhizohUiLocaleV0.js";
import {
  __resetOlpStateForTestV0,
  clearRhizohOutputLanguagePreferenceV0,
  resolveOutputLanguageCodeV0,
  writeRhizohOutputLanguagePreferenceV0
} from "../../runtime/rhizohOutputLanguagePolicyV0.js";
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
  completeCohortGateV0,
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
    clearUiLocalePickedForTestV0();
    clearRhizohSpeechProfileForTestV0();
    clearRhizohOutputLanguagePreferenceV0();
    __resetOlpStateForTestV0();
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

  it("completeCohortGateV0 uses engine when enforce on", () => {
    const origAdmission = import.meta.env.VITE_RHIZOH_CLOSED_ADMISSION;
    const origEnforce = import.meta.env.VITE_RHIZOH_CLOSED_ADMISSION_ENFORCE;
    import.meta.env.VITE_RHIZOH_CLOSED_ADMISSION = "1";
    import.meta.env.VITE_RHIZOH_CLOSED_ADMISSION_ENFORCE = "1";
    try {
      const result = completeCohortGateV0({ decision: COHORT_GATE_DECISION_V0.ACCEPTED });
      expect(result.hook).toBe("engine_evaluation");
      expect(result.engineOutputIgnored).toBe(false);
      expect(result.ok).toBe(true);
      expect(result.verdict).toBe("admit");
      expect(window.__rhizoh?.closedAdmission?.verdict).toBe("admit");
    } finally {
      import.meta.env.VITE_RHIZOH_CLOSED_ADMISSION = origAdmission;
      import.meta.env.VITE_RHIZOH_CLOSED_ADMISSION_ENFORCE = origEnforce;
    }
  });

  it("completeCohortGateV0 stays no-op when enforce off", () => {
    const origAdmission = import.meta.env.VITE_RHIZOH_CLOSED_ADMISSION;
    const origEnforce = import.meta.env.VITE_RHIZOH_CLOSED_ADMISSION_ENFORCE;
    import.meta.env.VITE_RHIZOH_CLOSED_ADMISSION = "1";
    import.meta.env.VITE_RHIZOH_CLOSED_ADMISSION_ENFORCE = "0";
    try {
      const result = completeCohortGateV0({ decision: COHORT_GATE_DECISION_V0.ACCEPTED });
      expect(result.hook).toBe("no_op_evaluation");
      expect(result.engineOutputIgnored).toBe(true);
      expect(result.ok).toBe(true);
    } finally {
      import.meta.env.VITE_RHIZOH_CLOSED_ADMISSION = origAdmission;
      import.meta.env.VITE_RHIZOH_CLOSED_ADMISSION_ENFORCE = origEnforce;
    }
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
    writeUiLocaleV0("tr");
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

  it("deriveIngressPhase shows language before legal when speech profile missing", () => {
    const orig = import.meta.env.VITE_RHIZOH_LEGAL_PREAMBLE;
    import.meta.env.VITE_RHIZOH_LEGAL_PREAMBLE = "1";
    try {
      expect(deriveIngressPhaseV0()).toBe(INGRESS_ROUTE_V0.LANGUAGE);
    } finally {
      import.meta.env.VITE_RHIZOH_LEGAL_PREAMBLE = orig;
    }
  });

  it("UI language does not force Rhizoh response language", () => {
    writeUiLocaleV0("tr");
    expect(resolveOutputLanguageCodeV0("en")).toBe("en");
  });

  it("Rhizoh response language can be locked independently from UI language", () => {
    writeUiLocaleV0("en");
    writeRhizohOutputLanguagePreferenceV0("tr", "test_manual");
    expect(resolveOutputLanguageCodeV0("en")).toBe("tr");
  });
});
