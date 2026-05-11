/**
 * FER-1 minimal event router — deploy için iskelet.
 * Üretimde: Firestore onCreate trigger veya HTTPS validate + projection.
 */
const { onDocumentCreated } = require("firebase-functions/v2/firestore");
const logger = require("firebase-functions/logger");
const { validateRhizohEventEnvelope } = require("./validateRhizohEvent");

exports.onRhizohEventCreated = onDocumentCreated(
  "rhizoh_events/{stream}/items/{eventId}",
  (event) => {
    const snap = event.data;
    if (!snap) return;
    const stream = event.params.stream;
    const doc = snap.data();
    const v = validateRhizohEventEnvelope({ stream, doc });
    if (!v.ok) {
      logger.error("rhizoh_event_validate_reject", {
        stream,
        eventId: event.params.eventId,
        reason: v.reason
      });
      return Promise.resolve();
    }
    logger.info("rhizoh_event_ingested", {
      stream,
      eventId: event.params.eventId,
      type: snap.get("type")
    });
    return Promise.resolve();
  }
);
