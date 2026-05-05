import { kernelMetrics, updateKernelMetrics } from "./metrics.js";

export async function consume(event: any) {
  const t0 = Date.now();
  try {
    const res = await runKernel(event);
    updateKernelMetrics(event, Date.now() - t0);
    return { ...res, kernelMetrics };
  } catch (e) {
    kernelMetrics.divergenceTotal += 1;
    throw e;
  }
}

async function runKernel(event: any) {
  // P3-A baseline: kernel abstraction seam; real consumer worker binds here in A-2.
  return { ok: true, eventId: event?.eventId ?? null };
}
