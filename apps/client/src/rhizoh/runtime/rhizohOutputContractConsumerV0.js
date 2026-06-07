/**
 * Output Contract Consumer v0 — UI must be contract-aware, not style-aware.
 * Validates presence_chip ≠ chat_message at consumption boundary.
 */

import { RHIZOH_OUTPUT_CONTRACT_SCHEMA_V0, RENDER_AS_V0 } from "./rhizohOutputContractRouterV0.js";
import { logVoiceInfoV0 } from "./rhizohProductionLogNamespacesV0.js";

export const RHIZOH_OUTPUT_CONTRACT_CONSUMER_SCHEMA_V0 =
  "rhizoh.output_contract_consumer.v0";

/** @type {boolean} */
let mountedV0 = false;
/** @type {number} */
let consumedCountV0 = 0;
/** @type {number} */
let violationCountV0 = 0;
/** @type {number} */
let lastConsumedAtMsV0 = 0;

function validateContractEnvelopeV0(detail) {
  const violations = [];
  if (!detail) violations.push("missing_detail");
  if (detail?.schema !== RHIZOH_OUTPUT_CONTRACT_SCHEMA_V0) {
    violations.push("schema_mismatch");
  }
  if (detail?.isChatBubble === true) violations.push("chat_bubble_forbidden");
  if (detail?.isMessage === true) violations.push("message_semantics_forbidden");
  if (detail?.renderAs === RENDER_AS_V0.CHAT_MESSAGE) {
    violations.push("chat_render_forbidden");
  }
  if (detail?.isPresenceEvent !== true) violations.push("presence_flag_missing");
  return violations;
}

function onOutputContractV0(ev) {
  const detail = ev?.detail;
  const violations = validateContractEnvelopeV0(detail);
  if (violations.length) {
    violationCountV0 += 1;
    logVoiceInfoV0("OUTPUT_CONTRACT_VIOLATION", { violations, detail: detail?.channel });
    return;
  }
  consumedCountV0 += 1;
  lastConsumedAtMsV0 = Date.now();
  if (typeof window !== "undefined") {
    window.__rhizoh = window.__rhizoh || {};
    window.__rhizoh.outputContractConsumer = getOutputContractConsumerSnapshotV0();
  }
}

export function mountOutputContractConsumerV0() {
  if (typeof window === "undefined" || mountedV0) return;
  mountedV0 = true;
  window.addEventListener("rhizoh:output-contract-v0", onOutputContractV0);
  window.__rhizoh = window.__rhizoh || {};
  window.__rhizoh.outputContractConsumer = getOutputContractConsumerSnapshotV0();
  logVoiceInfoV0("OUTPUT_CONTRACT_CONSUMER_MOUNT", getOutputContractConsumerSnapshotV0());
}

export function getOutputContractConsumerSnapshotV0() {
  return Object.freeze({
    schema: RHIZOH_OUTPUT_CONTRACT_CONSUMER_SCHEMA_V0,
    mounted: mountedV0,
    contractAware: mountedV0 && violationCountV0 === 0,
    consumedCount: consumedCountV0,
    violationCount: violationCountV0,
    lastConsumedAtMs: lastConsumedAtMsV0 || null,
    allowedRenderAs: Object.freeze([RENDER_AS_V0.PRESENCE_CHIP, RENDER_AS_V0.PRESENCE_PULSE]),
    forbiddenRenderAs: Object.freeze([RENDER_AS_V0.CHAT_MESSAGE])
  });
}

/** @internal vitest */
export function __resetOutputContractConsumerForTestV0() {
  if (mountedV0 && typeof window !== "undefined") {
    window.removeEventListener("rhizoh:output-contract-v0", onOutputContractV0);
  }
  mountedV0 = false;
  consumedCountV0 = 0;
  violationCountV0 = 0;
  lastConsumedAtMsV0 = 0;
}
