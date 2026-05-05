import type { IdentityCausalEventV0 } from "../types/rskOntology";

export interface InfluenceTraceEntry {
  timestamp: number;
  eventType: IdentityCausalEventV0["type"];
  actorUid: string;
  targetUid: string;
  rule: string;
  handler: string;
  patch: Record<string, unknown>;
}

const trace: InfluenceTraceEntry[] = [];
const TRACE_CAP = 512;

export function appendInfluenceTrace(entry: InfluenceTraceEntry): void {
  trace.push(entry);
  if (trace.length > TRACE_CAP) {
    trace.splice(0, trace.length - TRACE_CAP);
  }
}

export function getInfluenceTrace(): InfluenceTraceEntry[] {
  return [...trace];
}

export function resetInfluenceTrace(): void {
  trace.length = 0;
}
