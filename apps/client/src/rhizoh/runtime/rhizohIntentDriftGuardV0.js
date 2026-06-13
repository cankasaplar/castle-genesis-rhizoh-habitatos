/**
 * Intent drift guard v0 — detect intent vs runtime context mismatch (long sessions).
 * RESEARCH-ONLY (Sprint 39).
 */

import { getRhizohDomainCoreSnapshotV0 } from "./rhizohDomainCoreStoreV0.js";
import {
  getActiveFederationOverlayNodeV0,
  setActiveFederationOverlayNodeV0,
  RHIZOH_FEDERATION_NODE_V0
} from "./rhizohDomainGraphV0.js";
import { resolveOpenProductSurfaceDrawerIdV0 } from "./rhizohProductChromePanelsV0.js";
import { getLatestContextIntentSnapshotV0 } from "./rhizohContextIntentSnapshotV0.js";
import { resolveDomainIdFromPathV0 } from "./rhizohDomainGateV0.js";
import { clearFederationOverlayContextV0 } from "./rhizohDomainContextShiftV0.js";

export const RHIZOH_INTENT_DRIFT_SCHEMA_V0 = "rhizoh.intent_drift.v0";

export const INTENT_DRIFT_SEVERITY_V0 = Object.freeze({
  NONE: "none",
  LOW: "low",
  HIGH: "high"
});

/**
 * Compare latest intent contract vs live federation + drawer state.
 */
export function evaluateIntentDriftV0() {
  const intent = getLatestContextIntentSnapshotV0();
  const activeOverlay = getActiveFederationOverlayNodeV0();
  const openDrawerId = resolveOpenProductSurfaceDrawerIdV0();
  const core = getRhizohDomainCoreSnapshotV0();
  const pathDomain = resolveDomainIdFromPathV0(core.pathname || "/");

  /** @type {string[]} */
  const mismatches = [];

  if (!intent) {
    if (activeOverlay) mismatches.push("orphan_overlay");
    return Object.freeze({
      schema: RHIZOH_INTENT_DRIFT_SCHEMA_V0,
      drifted: mismatches.length > 0,
      severity: mismatches.length ? INTENT_DRIFT_SEVERITY_V0.LOW : INTENT_DRIFT_SEVERITY_V0.NONE,
      mismatches: Object.freeze([...mismatches]),
      intent: null,
      activeOverlay,
      openDrawerId
    });
  }

  const intentOverlay = intent.overlayNode || null;
  const intentDrawer = intent.drawer?.drawerId || null;

  if (intentOverlay !== activeOverlay) mismatches.push("overlay_node");
  if (intentDrawer !== openDrawerId) mismatches.push("drawer_state");
  if (intent.hostNode === "world" && pathDomain !== "world" && intent.migrate) {
    mismatches.push("host_path_domain");
  }

  const severity =
    mismatches.includes("overlay_node") || mismatches.includes("orphan_overlay")
      ? INTENT_DRIFT_SEVERITY_V0.HIGH
      : mismatches.length
        ? INTENT_DRIFT_SEVERITY_V0.LOW
        : INTENT_DRIFT_SEVERITY_V0.NONE;

  return Object.freeze({
    schema: RHIZOH_INTENT_DRIFT_SCHEMA_V0,
    drifted: mismatches.length > 0,
    severity,
    mismatches: Object.freeze([...mismatches]),
    intentId: intent.intentId,
    intentOverlay,
    activeOverlay,
    intentDrawer,
    openDrawerId,
    pathDomain,
    atMs: Date.now()
  });
}

/**
 * Soft reconcile — align federation overlay to latest intent when drawer still matches.
 * Does not force route changes.
 */
export function reconcileIntentDriftV0() {
  const drift = evaluateIntentDriftV0();
  const intent = getLatestContextIntentSnapshotV0();
  const openDrawerId = resolveOpenProductSurfaceDrawerIdV0();

  if (!drift.drifted) {
    return Object.freeze({ ok: true, reconciled: false, drift });
  }

  if (!intent) {
    if (drift.mismatches.includes("orphan_overlay") && !openDrawerId) {
      clearFederationOverlayContextV0(RHIZOH_FEDERATION_NODE_V0.WORLD);
      return Object.freeze({
        ok: true,
        reconciled: true,
        action: "clear_orphan_overlay",
        drift: evaluateIntentDriftV0()
      });
    }
    return Object.freeze({ ok: true, reconciled: false, drift });
  }

  const drawerMatches = (intent.drawer?.drawerId || null) === openDrawerId;

  if (drift.mismatches.includes("overlay_node") && drawerMatches && intent.overlayNode) {
    setActiveFederationOverlayNodeV0(intent.overlayNode);
    return Object.freeze({
      ok: true,
      reconciled: true,
      action: "resync_overlay_from_intent",
      drift: evaluateIntentDriftV0()
    });
  }

  if (drift.mismatches.includes("orphan_overlay") && !openDrawerId) {
    clearFederationOverlayContextV0(RHIZOH_FEDERATION_NODE_V0.WORLD);
    return Object.freeze({
      ok: true,
      reconciled: true,
      action: "clear_orphan_overlay",
      drift: evaluateIntentDriftV0()
    });
  }

  return Object.freeze({ ok: true, reconciled: false, drift });
}
