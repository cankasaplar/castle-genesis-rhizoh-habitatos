#!/usr/bin/env node
/**
 * CI gate — tenant A/B narratives must not cross-leak; no global derived state.
 */
import { buildUnifiedStateNarrativeV0 } from "./unifiedStateNarrativeV0.js";
import {
  assertNarrativeTenantIsolationV0,
  assertTenantScopedDerivedInvariantV0
} from "./narrativeTenantIsolationV0.js";

const tenantA = "org-tenant-a-ci";
const tenantB = "org-tenant-b-ci";

const exportA = await buildUnifiedStateNarrativeV0({
  tenantId: tenantA,
  tenantIsolationProbe: "PROBE_TENANT_A_CI_ONLY"
});
const exportB = await buildUnifiedStateNarrativeV0({
  tenantId: tenantB,
  tenantIsolationProbe: "PROBE_TENANT_B_CI_ONLY"
});

assertTenantScopedDerivedInvariantV0(exportA);
assertTenantScopedDerivedInvariantV0(exportB);
assertNarrativeTenantIsolationV0(exportA, exportB);

const payload = {
  gate: "rhizoh.tenant_narrative_isolation_gate.v0",
  ranAt: new Date().toISOString(),
  tenantA,
  tenantB,
  fingerprintA: exportA.narrativeFingerprint?.shortCode,
  fingerprintB: exportB.narrativeFingerprint?.shortCode,
  fingerprintsDistinct: exportA.narrativeFingerprint?.digest !== exportB.narrativeFingerprint?.digest,
  globalDerivedDisabled: true,
  passed: true
};

console.log(JSON.stringify(payload, null, 2));
process.exit(0);
