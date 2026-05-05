export function scoreHealth(metrics) {
  const m = metrics || {};
  const reasons = [];
  if (Number(m.divergenceTotal || 0) > 0) reasons.push("kernel_divergence");
  if (Number(m.dlqRate || 0) > Number(process.env.WORKER_DLQ_CRIT || 10)) reasons.push("dlq_rate_high");
  if (Number(m.ackDelayMs || 0) > Number(process.env.WORKER_ACK_DELAY_CRIT_MS || 15000)) reasons.push("ack_delay_high");

  if (reasons.includes("kernel_divergence")) return { status: "readonly", score: 0.2, reasons };
  if (reasons.length >= 2) return { status: "critical", score: 0.35, reasons };
  if (reasons.length === 1) return { status: "degraded", score: 0.68, reasons };
  return { status: "healthy", score: 0.95, reasons: [] };
}
