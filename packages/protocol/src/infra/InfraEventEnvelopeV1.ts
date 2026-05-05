export type InfraEventEnvelopeV1<T = any> = {
  eventId: string;
  sessionId: string;
  causalBranchId: string;
  timestamp: number;
  idempotencyKey: string;
  attempt: number;
  lastError?: string;
  nextRetryAt?: number;
  type: string;
  payload: T;
  meta?: {
    source: "gateway" | "direct";
    traceId?: string;
    spanId?: string;
    parentSpanId?: string;
  };
};
