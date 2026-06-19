/**
 * Ticket Tombstone Layer V0 — expired/consumed tickets leave active graph, stay in history.
 *
 * interpretationOnly · nonExecutive
 * @see docs/RHIZOH_REALITY_TRANSITION_ENGINE_V1.md §5
 */

export const TICKET_TOMBSTONE_SCHEMA_V0 = "castle.rhizoh.ticket_tombstone.v0";

export const TOMBSTONE_REASON_V0 = Object.freeze({
  EXPIRED: "expired",
  CONSUMED: "consumed",
  REC_CLOSEOUT: "rec_closeout",
  ADMISSION_REJECT: "admission_reject",
  MANUAL_ARCHIVE: "manual_archive"
});

/** @type {Map<string, object>} */
const tombstonesV0 = new Map();

/** @type {Set<string>} */
const activeTicketIdsV0 = new Set();

/**
 * @param {string} ticketId
 */
export function registerActiveTicketV0(ticketId) {
  const id = String(ticketId || "").trim();
  if (!id || tombstonesV0.has(id)) return false;
  activeTicketIdsV0.add(id);
  return true;
}

/**
 * @param {{
 *   ticketId: string,
 *   reason: string,
 *   epochId?: string,
 *   traceGraphLink?: string,
 *   tombstonedAtMs?: number
 * }} input
 */
export function tombstoneTicketV0(input) {
  const ticketId = String(input.ticketId || "").trim();
  if (!ticketId) {
    throw new Error("ticket_tombstone: ticketId required");
  }
  const record = Object.freeze({
    schema: TICKET_TOMBSTONE_SCHEMA_V0,
    ticketId,
    reason: String(input.reason || TOMBSTONE_REASON_V0.EXPIRED),
    epochId: String(input.epochId || "rec_soft"),
    traceGraphLink: input.traceGraphLink ? String(input.traceGraphLink) : undefined,
    tombstonedAt: new Date(input.tombstonedAtMs ?? Date.now()).toISOString(),
    interpretationOnly: true,
    nonExecutive: true
  });
  tombstonesV0.set(ticketId, record);
  activeTicketIdsV0.delete(ticketId);
  return record;
}

/**
 * @param {string} ticketId
 */
export function isTombstonedTicketV0(ticketId) {
  return tombstonesV0.has(String(ticketId || ""));
}

/**
 * @param {string} ticketId
 */
export function isActiveTicketV0(ticketId) {
  const id = String(ticketId || "");
  return activeTicketIdsV0.has(id) && !tombstonesV0.has(id);
}

/**
 * @param {string} ticketId
 */
export function getTicketTombstoneV0(ticketId) {
  return tombstonesV0.get(String(ticketId || "")) ?? null;
}

export function listActiveTicketIdsV0() {
  return [...activeTicketIdsV0].filter((id) => !tombstonesV0.has(id));
}

export function listTombstonedTicketsV0(limit = 100) {
  return [...tombstonesV0.values()].slice(-limit);
}

/** Test only. */
export function clearTicketTombstonesForTestV0() {
  tombstonesV0.clear();
  activeTicketIdsV0.clear();
}
