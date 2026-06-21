/**
 * Invite ops v0 — founder-facing token + URL + mail draft (read-only generation).
 */

import {
  buildObserverInviteUrlV0,
  parseObserverInviteTokenV0
} from "./observerInviteLandingV0.js";
import { OBSERVER_INVITE_ROLE_V0 } from "./observerInviteRolesV0.js";
import {
  getInviteExpectationFramingV0,
  resolveInvitePerceptionLensV0
} from "./observerInvitePerceptionLensV0.js";
import {
  EPISTEMIC_STRESS_CLASS_V0,
  generateInvitePayloadV0
} from "./closedUserAdmissionEngineV0.js";

export const INVITE_OPS_SCHEMA_V0 = "castle.rhizoh.invite_ops.v0";

let inviteOpsConsoleMountedV0 = false;

const ROLE_TO_STRESS_V0 = Object.freeze({
  [OBSERVER_INVITE_ROLE_V0.OBSERVER]: EPISTEMIC_STRESS_CLASS_V0.SYSTEMS_ENGINEER,
  [OBSERVER_INVITE_ROLE_V0.REVIEWER]: EPISTEMIC_STRESS_CLASS_V0.HUMAN_EXPLORER,
  [OBSERVER_INVITE_ROLE_V0.INVESTOR]: EPISTEMIC_STRESS_CLASS_V0.INVARIANT_KEEPER
});

/**
 * @param {{
 *   cohortId?: string,
 *   role?: string,
 *   reviewerId?: string,
 *   stressClassTarget?: string,
 *   seed?: number,
 *   label?: string
 * }} [opts]
 */
export function generateObserverInviteV0(opts = {}) {
  const reviewerId = opts.reviewerId ? String(opts.reviewerId).trim().toLowerCase() : null;
  const role = String(
    opts.role || (reviewerId ? OBSERVER_INVITE_ROLE_V0.REVIEWER : OBSERVER_INVITE_ROLE_V0.OBSERVER)
  ).toLowerCase();

  let inviteUrl;
  let payload = null;

  if (reviewerId) {
    inviteUrl = buildObserverInviteUrlV0({ reviewerId, role });
  } else {
    const stressClassTarget =
      opts.stressClassTarget || ROLE_TO_STRESS_V0[role] || EPISTEMIC_STRESS_CLASS_V0.SYSTEMS_ENGINEER;
    payload = generateInvitePayloadV0({
      cohortId: opts.cohortId || "observer",
      stressClassTarget,
      seed: opts.seed ?? Date.now() % 100000
    });
    inviteUrl = buildObserverInviteUrlV0({
      cohortId: opts.cohortId,
      stressClassTarget,
      seed: opts.seed,
      role
    });
  }

  const token =
    payload?.inviteToken ||
    parseObserverInviteTokenV0(new URL(inviteUrl).searchParams.get("invite") || reviewerId)?.inviteToken;

  return Object.freeze({
    schema: INVITE_OPS_SCHEMA_V0,
    generatedAtMs: Date.now(),
    role,
    label: opts.label ? String(opts.label).slice(0, 120) : null,
    inviteToken: token,
    inviteUrl,
    payload,
    interpretationOnly: true,
    nonExecutive: true
  });
}

/**
 * @param {ReturnType<typeof generateObserverInviteV0>} invite
 * @param {{ observerName?: string, locale?: string }} [opts]
 */
export function formatObserverInviteMailDraftV0(invite, opts = {}) {
  const tr = opts.locale === "tr";
  const name = opts.observerName || (tr ? "Gözlemci" : "Observer");
  const lens = resolveInvitePerceptionLensV0(invite.role, tr ? "tr" : "en");
  const expectation = lens.copy.expectation;

  const subjectByMode = Object.freeze({
    explorer: tr ? "Rhizoh — keşif daveti" : "Rhizoh — exploration invite",
    research: tr ? "Rhizoh — araştırma gözlemi" : "Rhizoh — research observation",
    signal: tr ? "Rhizoh — altyapı gözlemi" : "Rhizoh — infrastructure observation"
  });
  const subject = subjectByMode[lens.mode] || (tr ? "Rhizoh — kontrollü gözlem daveti" : "Rhizoh — controlled observation invite");

  const bodyTr = `Merhaba ${name},

${expectation}

Bu bağlantı yalnızca okuma ve gözlem içindir; execution yetkisi vermez.

Davet bağlantısı:
${invite.inviteUrl}

Observation ≠ Execution
— Rhizoh`;

  const bodyEn = `Hello ${name},

${expectation}

This link is read-only observation — no execution authority.

Invite link:
${invite.inviteUrl}

Observation ≠ Execution
— Rhizoh`;

  return Object.freeze({
    schema: INVITE_OPS_SCHEMA_V0,
    subject,
    body: tr ? bodyTr : bodyEn,
    bodyTr,
    bodyEn,
    inviteUrl: invite.inviteUrl,
    perceptionMode: lens.mode,
    expectationFraming: expectation,
    fromChannel: "observe@rhizoh.com",
    interpretationOnly: true
  });
}

/** @type {ReturnType<typeof generateObserverInviteV0> | null} */
let lastGeneratedInviteV0 = null;

/**
 * @param {Parameters<typeof generateObserverInviteV0>[0]} [opts]
 */
export function runInviteOpsGenerateV0(opts = {}) {
  lastGeneratedInviteV0 = generateObserverInviteV0(opts);
  syncInviteOpsWindowV0();
  return lastGeneratedInviteV0;
}

export function getLastGeneratedInviteV0() {
  return lastGeneratedInviteV0;
}

/** Test-only */
export function clearInviteOpsForTestV0() {
  lastGeneratedInviteV0 = null;
  inviteOpsConsoleMountedV0 = false;
  if (typeof window !== "undefined" && window.__rhizoh) {
    delete window.__rhizoh.inviteOps;
  }
}

export function mountInviteOpsConsoleV0() {
  if (typeof window === "undefined" || inviteOpsConsoleMountedV0) return;
  inviteOpsConsoleMountedV0 = true;
  syncInviteOpsWindowV0();
}

function syncInviteOpsWindowV0() {
  if (typeof window === "undefined") return;
  window.__rhizoh = window.__rhizoh || {};
  window.__rhizoh.inviteOps = Object.freeze({
    generate: runInviteOpsGenerateV0,
    last: () => lastGeneratedInviteV0,
    mailDraft: (opts) =>
      formatObserverInviteMailDraftV0(
        lastGeneratedInviteV0 || runInviteOpsGenerateV0(opts),
        opts
      ),
    copyUrl: async () => {
      const inv = lastGeneratedInviteV0 || runInviteOpsGenerateV0();
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(inv.inviteUrl);
        return Object.freeze({ ok: true, url: inv.inviteUrl });
      }
      return Object.freeze({ ok: false, url: inv.inviteUrl });
    }
  });
}
