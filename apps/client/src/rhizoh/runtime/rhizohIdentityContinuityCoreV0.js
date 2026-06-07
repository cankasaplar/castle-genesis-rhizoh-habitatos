/**
 * Identity Continuity Core v0 — whoAmI loop across turns (not session amnesia).
 * Binds turn sovereignty + continuity kernel into persistent identity snapshot.
 */

import { getContinuityKernelSnapshotV0 } from "./rhizohContinuityKernelV0.js";
import { getLastTurnSovereigntyV0 } from "./behavioralTurnSovereigntyV0.js";
import { logVoiceInfoV0 } from "./rhizohProductionLogNamespacesV0.js";
import { resolveGatewayTransportV0 } from "./rhizohGatewayTransportFallbackV0.js";
import {
  touchIdentityLifecycleV0,
  getIdentityLifecycleSnapshotV0
} from "./rhizohIdentityLifecycleV0.js";
import { getIdentityEventLogSnapshotV0 } from "./rhizohIdentityEventLogV0.js";

export const RHIZOH_IDENTITY_CONTINUITY_SCHEMA_V0 = "rhizoh.identity_continuity_core.v0";

const WHO_AM_I_V0 = "Rhizoh — behavioral OS with self-observation layer";

/** @type {object} */
let identityStateV0 = {
  whoAmI: WHO_AM_I_V0,
  lastIntent: null,
  emotionalTone: "steady",
  activeTask: null,
  userContextSnapshot: null,
  turnCount: 0,
  lastTurnId: null,
  lastAtMs: 0
};

/**
 * @param {object} [opts]
 */
export function bindTurnIdentityV0(opts = {}) {
  const turn = getLastTurnSovereigntyV0();
  const transport = resolveGatewayTransportV0();
  const lifecycle = touchIdentityLifecycleV0({
    type: "turn_bind",
    intent: opts.intent ?? turn?.advisory?.router?.intent ?? identityStateV0.lastIntent,
    emotionalTone:
      opts.emotionalTone ??
      turn?.subReality?.emotionalTone ??
      identityStateV0.emotionalTone,
    activeTask: opts.activeTask ?? opts.preview ?? identityStateV0.activeTask,
    turnId: opts.turnId || turn?.turnId || identityStateV0.lastTurnId,
    carrier: transport.mode,
    preview: opts.preview,
    modality: opts.modality || turn?.input?.modality || "voice",
    presenceKind: opts.presenceKind
  });

  identityStateV0 = {
    whoAmI: WHO_AM_I_V0,
    lastIntent: opts.intent ?? turn?.advisory?.router?.intent ?? identityStateV0.lastIntent,
    emotionalTone: lifecycle.emotionalToneLabel,
    activeTask: lifecycle.activeTask,
    userContextSnapshot: Object.freeze({
      preview: opts.preview ? String(opts.preview).slice(0, 160) : null,
      modality: opts.modality || turn?.input?.modality || null,
      sovereignReality: turn?.sovereignReality || null,
      pathname:
        typeof window !== "undefined" ? String(window.location.pathname || "/") : null,
      carrier: transport.mode,
      atMs: Date.now()
    }),
    turnCount: lifecycle.turnCount,
    lastTurnId: opts.turnId || turn?.turnId || identityStateV0.lastTurnId,
    lastAtMs: Date.now()
  };

  const snap = getIdentityContinuitySnapshotV0();
  logVoiceInfoV0("IDENTITY_TURN_BIND", {
    turnCount: snap.turnCount,
    lastIntent: snap.lastIntent,
    emotionalTone: snap.emotionalTone
  });
  if (typeof window !== "undefined") {
    window.__rhizoh = window.__rhizoh || {};
    window.__rhizoh.identityContinuity = snap;
  }
  return snap;
}

export function getIdentityContinuitySnapshotV0() {
  const continuity = getContinuityKernelSnapshotV0();
  const turn = getLastTurnSovereigntyV0();
  const lifecycle = getIdentityLifecycleSnapshotV0();
  const eventLog = getIdentityEventLogSnapshotV0();
  return Object.freeze({
    schema: RHIZOH_IDENTITY_CONTINUITY_SCHEMA_V0,
    ...identityStateV0,
    continuityState: continuity.state,
    lastSovereignReality: turn?.sovereignReality ?? null,
    loopActive: identityStateV0.turnCount > 0 || continuity.neverNull,
    lifecycle,
    eventLog,
    ssot: "identity_event_log"
  });
}

/** @internal vitest */
export function __resetIdentityContinuityForTestV0() {
  identityStateV0 = {
    whoAmI: WHO_AM_I_V0,
    lastIntent: null,
    emotionalTone: "steady",
    activeTask: null,
    userContextSnapshot: null,
    turnCount: 0,
    lastTurnId: null,
    lastAtMs: 0
  };
}
