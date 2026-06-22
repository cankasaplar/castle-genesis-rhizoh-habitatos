/**
 * Gateway Event Envelope v0 — shared spine for chess, media, tower, voice, observer.
 * Wraps legacy `{ type, payload, ts }` wire format; does not replace createEnvelope yet.
 * RESEARCH-ONLY until data-plane READY.
 */

export const GATEWAY_EVENT_ENVELOPE_SCHEMA_V0 = "castle.rhizoh.gateway_event_envelope.v0";

export const GATEWAY_EVENT_SOURCE_V0 = Object.freeze({
  CHESS: "chess",
  MEDIA: "media",
  TOWER: "tower",
  VOICE: "voice",
  SCHEDULER: "scheduler",
  OBSERVER: "observer",
  GATEWAY: "gateway"
});

export const GATEWAY_DELIVERY_STATE_V0 = Object.freeze({
  SENT: "sent",
  DELIVERED: "delivered",
  ACKNOWLEDGED: "acknowledged"
});

function stableHash32V0(input) {
  const text = String(input || "");
  let h = 0x811c9dc5;
  for (let i = 0; i < text.length; i += 1) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return (h >>> 0).toString(16).padStart(8, "0");
}

/**
 * @param {{
 *   sessionId?: string,
 *   worldId?: string,
 *   source?: string,
 *   type: string,
 *   seq?: number,
 *   timestamp?: number,
 *   payload?: object,
 *   delivery?: object
 * }} input
 */
export function createGatewayEventEnvelopeV0(input = {}) {
  const sessionId = String(input.sessionId || "").slice(0, 128);
  const worldId = String(input.worldId || sessionId || "world_default").slice(0, 128);
  const source = String(input.source || GATEWAY_EVENT_SOURCE_V0.GATEWAY).slice(0, 32);
  const type = String(input.type || "UNKNOWN").slice(0, 64);
  const seq = Math.max(0, Number(input.seq) || 0);
  const timestamp = Number.isFinite(Number(input.timestamp)) ? Number(input.timestamp) : Date.now();
  const payload = input.payload && typeof input.payload === "object" ? input.payload : {};
  const eventId = `gev_${stableHash32V0(`${worldId}:${sessionId}:${source}:${type}:${seq}:${timestamp}`)}`;

  return Object.freeze({
    schema: GATEWAY_EVENT_ENVELOPE_SCHEMA_V0,
    eventId,
    sessionId: sessionId || undefined,
    worldId,
    source,
    type,
    seq,
    timestamp,
    payload: Object.freeze({ ...payload }),
    delivery: input.delivery ? Object.freeze({ ...input.delivery }) : undefined,
    interpretationOnly: true
  });
}

/**
 * Broadcast delivery meta — sent / delivered / acknowledged counts.
 * @param {{
 *   commitSeq: number,
 *   recipientCount: number,
 *   delivered: number,
 *   ackCount?: number | null,
 *   broadcastSeq?: number
 * }} input
 */
export function createGatewayBroadcastMetaV0(input = {}) {
  const commitSeq = Math.max(0, Number(input.commitSeq) || 0);
  const recipientCount = Math.max(0, Number(input.recipientCount) || 0);
  const delivered = Math.max(0, Number(input.delivered) || 0);
  const ackCount =
    input.ackCount === null || input.ackCount === undefined
      ? null
      : Math.max(0, Number(input.ackCount) || 0);

  return Object.freeze({
    commitSeq,
    broadcastSeq: Math.max(0, Number(input.broadcastSeq) || commitSeq),
    recipientCount,
    delivered,
    ackCount,
    sent: recipientCount,
    deliveryState:
      ackCount !== null && recipientCount > 0 && ackCount >= recipientCount
        ? GATEWAY_DELIVERY_STATE_V0.ACKNOWLEDGED
        : delivered > 0
          ? GATEWAY_DELIVERY_STATE_V0.DELIVERED
          : GATEWAY_DELIVERY_STATE_V0.SENT,
    interpretationOnly: true
  });
}

/**
 * Attach gateway envelope meta to legacy WS envelope without breaking wire shape.
 * @param {object} wireEnvelope - `{ type, payload, ts }`
 * @param {object} gatewayMeta - from createGatewayEventEnvelopeV0
 */
export function attachGatewayEventMetaV0(wireEnvelope, gatewayMeta) {
  if (!wireEnvelope || typeof wireEnvelope !== "object") return wireEnvelope;
  const payload =
    wireEnvelope.payload && typeof wireEnvelope.payload === "object"
      ? { ...wireEnvelope.payload, gatewayEvent: gatewayMeta }
      : { gatewayEvent: gatewayMeta };
  return { ...wireEnvelope, payload };
}
