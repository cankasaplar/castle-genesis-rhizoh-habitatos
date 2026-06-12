/**
 * Routes gateway mesh deltas through WAL geometry ingress when opt-in env is set.
 */
import type { PresenceMeshDeltaEvent } from "../runtime/presenceMeshClient";
import type { StudioResult } from "../types/rskOntology.js";
import { ingestPresenceMeshDeltaWithWalAuthorityV0 } from "../../rhizoh/runtime/walPresenceMeshBridgeV0.js";
import { isWalGeometryIngressEnabledV0 } from "../../rhizoh/runtime/walWorldAuthorityGateV0.js";
import { getStudioKernelState, setStudioKernelState } from "./internalStore";
import { ingestPresenceMeshDelta } from "./presenceMeshIngestSlice";

export function ingestPresenceMeshDeltaMaybeWalV0(
  ev: PresenceMeshDeltaEvent
): StudioResult<{ duplicate?: boolean }> & { wal?: unknown } {
  if (!isWalGeometryIngressEnabledV0()) {
    return ingestPresenceMeshDelta(ev);
  }
  const out = ingestPresenceMeshDeltaWithWalAuthorityV0(getStudioKernelState, setStudioKernelState, ev, {
    walGeometry: true
  });
  const causal = out.causal;
  if (!causal?.ok) {
    return causal ?? { ok: false, error: "mesh_wal_causal_failed" };
  }
  return { ...causal, wal: out.wal };
}
