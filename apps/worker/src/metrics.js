const consumeLatencies = [];
const LAT_CAP = 512;

function percentile(arr, p) {
  if (!arr.length) return 0;
  const sorted = [...arr].sort((a, b) => a - b);
  const idx = Math.min(sorted.length - 1, Math.max(0, Math.floor((p / 100) * sorted.length)));
  return sorted[idx];
}

export const workerMetrics = {
  consumed: 0,
  retries: 0,
  dlqRate: 0,
  pendingClaimedTotal: 0,
  ackDelayMs: 0,
  consumeLatencyP50: 0,
  consumeLatencyP95: 0,
  kernelTurnMs: 0,
  causalAppendMs: 0,
  replayMs: 0,
  divergenceTotal: 0,
  deterministicHash: "",
  consumeLatencyBuckets: {
    5: 0,
    20: 0,
    50: 0,
    100: 0,
    250: 0,
    500: 0,
    1000: 0,
    2000: 0,
    5000: 0
  },
  kernelTurnLatencyBuckets: {
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

export function recordConsumeLatency(ms) {
  const n = Math.max(0, Number(ms || 0));
  consumeLatencies.push(n);
  if (consumeLatencies.length > LAT_CAP) consumeLatencies.splice(0, consumeLatencies.length - LAT_CAP);
  workerMetrics.consumeLatencyP50 = percentile(consumeLatencies, 50);
  workerMetrics.consumeLatencyP95 = percentile(consumeLatencies, 95);
  for (const k of Object.keys(workerMetrics.consumeLatencyBuckets)) {
    if (n <= Number(k)) workerMetrics.consumeLatencyBuckets[k] += 1;
  }
}

export function recordKernelMetrics(km) {
  if (!km || typeof km !== "object") return;
  workerMetrics.kernelTurnMs = Number(km.kernelTurnMs || 0);
  workerMetrics.causalAppendMs = Number(km.causalAppendMs || 0);
  workerMetrics.replayMs = Number(km.replayMs || 0);
  workerMetrics.divergenceTotal = Number(km.divergenceTotal || 0);
  workerMetrics.deterministicHash = String(km.deterministicHash || "");
  const n = Math.max(0, Number(workerMetrics.kernelTurnMs || 0));
  for (const k of Object.keys(workerMetrics.kernelTurnLatencyBuckets)) {
    if (n <= Number(k)) workerMetrics.kernelTurnLatencyBuckets[k] += 1;
  }
}
