export async function sendToDLQ(event, reason) {
  console.warn("[DLQ]", reason, event?.eventId);
  // TODO(P3-A2): persist poison messages (Redis/Kafka/NATS DLQ stream).
}
