/**
 * Domain path coherence — pathname, domainCore.activeDomain, controlPlane.domain must align.
 */

import {
  resolveDomainIdFromPathV0,
  bootstrapRhizohDomainGateV0
} from "./rhizohDomainGateV0.js";
import {
  getRhizohDomainCoreSnapshotV0,
  syncRhizohDomainCoreStoreV0
} from "./rhizohDomainCoreStoreV0.js";
import { getControlPlaneSnapshotV0 } from "./rhizohControlPlaneV0.js";
import { resolveWorldDomainFromPathV0 } from "./rhizohWorldDomainRoutesV0.js";

export const RHIZOH_DOMAIN_COHERENCE_SCHEMA_V0 = "rhizoh.domain_coherence.v0";

/**
 * Force domain core + control plane to match pathname resolution.
 * @param {string} pathname
 */
export function reconcileDomainPathCoherenceV0(pathname = "/") {
  const p = String(pathname || "/").trim();
  const expected = resolveDomainIdFromPathV0(p);
  const worldDomain = resolveWorldDomainFromPathV0(p);
  const before = getRhizohDomainCoreSnapshotV0();
  const mismatches = [];

  if (before.pathname !== p) mismatches.push("pathname");
  if (before.activeDomain !== expected) mismatches.push("activeDomain");

  const cpBefore = getControlPlaneSnapshotV0(expected);
  if (cpBefore && cpBefore.domain !== expected) mismatches.push("control_plane_domain");

  if (!mismatches.length) {
    return Object.freeze({
      reconciled: false,
      pass: true,
      expected,
      pathname: p,
      core: before,
      controlPlane: cpBefore
    });
  }

  syncRhizohDomainCoreStoreV0({
    pathname: p,
    activeDomain: expected,
    worldDomain
  });

  const gate = bootstrapRhizohDomainGateV0(expected, { pathname: p, worldDomain });
  const after = getRhizohDomainCoreSnapshotV0();
  const cpAfter = getControlPlaneSnapshotV0(expected);

  return Object.freeze({
    reconciled: true,
    pass: after.activeDomain === expected && after.pathname === p && cpAfter?.domain === expected,
    expected,
    pathname: p,
    mismatches: Object.freeze(mismatches),
    core: after,
    controlPlane: cpAfter,
    gate
  });
}

/**
 * @param {string} pathname
 */
export function auditDomainCoherenceV0(pathname = "/") {
  const p = String(pathname || "/").trim();
  const expected = resolveDomainIdFromPathV0(p);
  const core = getRhizohDomainCoreSnapshotV0();
  const cp = getControlPlaneSnapshotV0(expected) || getControlPlaneSnapshotV0();
  const issues = [];

  if (core.pathname !== p) issues.push("core_pathname_mismatch");
  if (core.activeDomain !== expected) issues.push("core_active_domain_path_mismatch");
  if (cp && cp.domain !== expected) issues.push("control_plane_path_mismatch");
  if (cp && cp.domain !== core.activeDomain) issues.push("control_plane_core_mismatch");

  return Object.freeze({
    schema: RHIZOH_DOMAIN_COHERENCE_SCHEMA_V0,
    pathname: p,
    expectedDomain: expected,
    coreDomain: core.activeDomain,
    corePathname: core.pathname,
    controlPlaneDomain: cp?.domain ?? null,
    pass: issues.length === 0,
    issues: Object.freeze(issues)
  });
}
