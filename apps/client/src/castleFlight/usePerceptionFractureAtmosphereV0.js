/**
 * Subscribe to alignment snapshot → fracture atmosphere tokens (read-only).
 * @see docs/PERCEPTUAL_ALIGNMENT_RENDERING_V1.md Step 3.1
 */

import { useMemo } from "react";
import { buildPerceptionFractureAtmosphereV0 } from "./perceptionFractureAtmosphereV0.js";
import { usePerceptionAlignmentSnapshotV0 } from "./usePerceptionAlignmentSnapshotV0.js";

/**
 * @param {Parameters<typeof usePerceptionAlignmentSnapshotV0>[0]} runtime
 * @param {{ pollMs?: number, enabled?: boolean, snapshot?: object | null }} [opts]
 */
export function usePerceptionFractureAtmosphereV0(runtime, opts = {}) {
  const enabled = opts.enabled !== false && Boolean(runtime);
  const polledSnapshot = usePerceptionAlignmentSnapshotV0(runtime, {
    pollMs: opts.pollMs,
    enabled: opts.snapshot === undefined && enabled
  });
  const snapshot = opts.snapshot !== undefined ? opts.snapshot : polledSnapshot;

  return useMemo(() => buildPerceptionFractureAtmosphereV0(snapshot), [snapshot]);
}
