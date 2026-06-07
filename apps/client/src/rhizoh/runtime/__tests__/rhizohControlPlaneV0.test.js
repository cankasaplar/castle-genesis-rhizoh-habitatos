import { describe, expect, it, beforeEach } from "vitest";
import {
  evaluateControlPlaneHealthV0,
  runControlPlaneForDomainV0,
  validateTensorSafetyV0,
  applyCascadeIsolationV0,
  clearCascadeIsolationV0,
  getTensorAuditLogV0,
  PROPAGATION_V0,
  FALLBACK_V0,
  __resetControlPlaneForTestV0
} from "../rhizohControlPlaneV0.js";
import { bootstrapRhizohDomainGateV0, RHIZOH_DOMAIN_ID_V0 } from "../rhizohDomainGateV0.js";
import { __resetRhizohDomainCoreStoreForTestV0 } from "../rhizohDomainCoreStoreV0.js";
import { __resetDomainAdapterRegistryForTestV0 } from "../domainAdapterRegistryV0.js";
import { __resetDomainHealthForTestV0 } from "../rhizohDomainHealthContractV0.js";
import { __resetNervousSystemEventGraphForTestV0 } from "../rhizohNervousSystemEventGraphV0.js";
import { __resetSpatialEventEmitterForTestV0 } from "../rhizohSpatialEventEmitterV0.js";
import { emitSpatialEventFromDomainV0 } from "../rhizohSpatialEventEmitterV0.js";
import { mapIntentToActionV0 } from "../rhizohTensorBridgeV0.js";

describe("rhizohControlPlaneV0", () => {
  beforeEach(() => {
    __resetRhizohDomainCoreStoreForTestV0();
    __resetDomainAdapterRegistryForTestV0();
    __resetDomainHealthForTestV0();
    __resetNervousSystemEventGraphForTestV0();
    __resetControlPlaneForTestV0();
    __resetSpatialEventEmitterForTestV0();
  });

  it("extends health with propagation isolation fallback", () => {
    bootstrapRhizohDomainGateV0(RHIZOH_DOMAIN_ID_V0.CASTLE, { pathname: "/greenroom/main" });
    const cp = runControlPlaneForDomainV0(RHIZOH_DOMAIN_ID_V0.CASTLE, {
      tensorResult: { ok: true }
    });
    expect(cp.health.propagation).toBe(PROPAGATION_V0.SAFE);
    expect(cp.health.isolation).toBeTruthy();
    expect(cp.health.fallback).toBe(FALLBACK_V0.IDLE);
  });

  it("downgrades castle on adapter failure — voice blocked", () => {
    applyCascadeIsolationV0(RHIZOH_DOMAIN_ID_V0.CASTLE);
    const health = evaluateControlPlaneHealthV0(RHIZOH_DOMAIN_ID_V0.CASTLE, { tensorOk: false });
    expect(health.safeUiMode).toBe(true);
    expect(health.downgrade.voiceEnabled).toBe(false);
    expect(health.downgrade.chatSafeMode).toBe(true);
    expect(health.propagation).toBe(PROPAGATION_V0.BLOCKED);
  });

  it("tensor pipeline applies safety filter and audit", () => {
    bootstrapRhizohDomainGateV0(RHIZOH_DOMAIN_ID_V0.OBSERVER, { pathname: "/academy/observe" });
    runControlPlaneForDomainV0(RHIZOH_DOMAIN_ID_V0.OBSERVER, { tensorResult: { ok: true } });
    const blocked = mapIntentToActionV0(RHIZOH_DOMAIN_ID_V0.OBSERVER, {
      intent: "observe_system",
      mutate: true
    });
    expect(blocked.ok).toBe(false);
    expect(getTensorAuditLogV0().length).toBeGreaterThan(0);
  });

  it("blocks spatial cascade from isolated domain", () => {
    applyCascadeIsolationV0(RHIZOH_DOMAIN_ID_V0.WORLD);
    const out = emitSpatialEventFromDomainV0(RHIZOH_DOMAIN_ID_V0.WORLD, {
      nodeId: "pin_1",
      kind: "pin",
      tier: "static"
    });
    expect(out.ok).toBe(false);
    clearCascadeIsolationV0(RHIZOH_DOMAIN_ID_V0.WORLD);
    const out2 = emitSpatialEventFromDomainV0(RHIZOH_DOMAIN_ID_V0.WORLD, {
      nodeId: "pin_2",
      kind: "pin",
      tier: "static"
    });
    expect(out2.ok).toBe(true);
  });

  it("studio export blocked when degraded", () => {
    runControlPlaneForDomainV0(RHIZOH_DOMAIN_ID_V0.STUDIO, { tensorResult: { ok: false } });
    const safety = validateTensorSafetyV0(
      RHIZOH_DOMAIN_ID_V0.STUDIO,
      { action: "persist_artifact" },
      {}
    );
    expect(safety.allowed).toBe(false);
  });
});
