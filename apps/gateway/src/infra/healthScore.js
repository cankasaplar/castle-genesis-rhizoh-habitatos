export function scoreHealth(metrics, opts = {}) {
  const m = metrics || {};
  const divergence = Number(opts.divergenceTotal ?? 0);
  const reasons = [];
  if (divergence > 0) reasons.push("kernel_divergence");
  if (Number(m.queueLag || 0) > Number(process.env.HEALTH_QUEUE_LAG_CRIT_MS || 15000)) reasons.push("queue_lag_high");
  if (Number(m.errors || 0) > Number(process.env.HEALTH_ERRORS_CRIT || 10)) reasons.push("errors_high");

  if (reasons.includes("kernel_divergence")) {
    return { status: "readonly", score: 0.21, reasons };
  }
  if (reasons.length >= 2) {
    return { status: "critical", score: 0.35, reasons };
  }
  if (reasons.length === 1) {
    return { status: "degraded", score: 0.68, reasons };
  }
  return { status: "healthy", score: 0.95, reasons: [] };
}
