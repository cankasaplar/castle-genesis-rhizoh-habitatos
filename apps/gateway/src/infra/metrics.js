export const metrics = {
  eventsProcessed: 0,
  duplicateRejects: 0,
  enqueueLatencyMs: 0,
  queueLag: 0,
  queueDepth: 0,
  errors: 0,
  enqueueLatencyBuckets: {
    5: 0,
    20: 0,
    50: 0,
    100: 0,
    250: 0,
    500: 0,
    1000: 0,
    2000: 0,
    5000: 0
  }
};

export function observeGatewayEnqueueLatency(ms) {
  const n = Math.max(0, Number(ms || 0));
  metrics.enqueueLatencyMs = n;
  for (const k of Object.keys(metrics.enqueueLatencyBuckets)) {
    if (n <= Number(k)) metrics.enqueueLatencyBuckets[k] += 1;
  }
}
