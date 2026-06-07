/**
 * React hook — sync T0 snapshot into continuous experience session memory.
 * @see docs/RHIZOH_SOFT_OPEN_PROD_PLAN_V1.md
 */

import { useEffect, useMemo, useRef, useState } from "react";
import {
  digestExperienceSessionSnapshotV0,
  loadRhizohExperienceSessionContextV0,
  patchRhizohExperienceSessionContextV0,
  publishRhizohExperienceSessionContextV0,
  RHIZOH_PRODUCT_BINDING_EVENT_V0,
  saveRhizohExperienceSessionContextV0
} from "./rhizohExperienceSessionContextV0.js";
import { maybeEmitEventJoinMomentV1 } from "./rhizohEventJoinMomentV1.js";

/**
 * @param {Parameters<typeof digestExperienceSessionSnapshotV0>[0]} snapshot
 * @param {{ enabled?: boolean }} [opts]
 */
export function useRhizohExperienceSessionContextV0(snapshot, opts = {}) {
  const enabled = opts.enabled !== false;
  const snapshotRef = useRef(snapshot || {});
  snapshotRef.current = snapshot || {};

  const digest = useMemo(
    () => digestExperienceSessionSnapshotV0(snapshot || {}),
    [snapshot]
  );

  const [context, setContext] = useState(() =>
    enabled ? loadRhizohExperienceSessionContextV0() : null
  );

  useEffect(() => {
    if (!enabled) return undefined;
    const persisted = loadRhizohExperienceSessionContextV0();
    const next = patchRhizohExperienceSessionContextV0(persisted, snapshotRef.current);
    const saved = saveRhizohExperienceSessionContextV0(next);
    publishRhizohExperienceSessionContextV0(saved);
    maybeEmitEventJoinMomentV1(saved);
    setContext(saved);
  }, [enabled, digest]);

  useEffect(() => {
    if (!enabled || typeof window === "undefined") return undefined;
    const onBinding = (event) => {
      const detail = event?.detail;
      if (!detail || detail.source !== "cap_wheel") return;
      const prev = loadRhizohExperienceSessionContextV0();
      const next = patchRhizohExperienceSessionContextV0(prev, {
        ...snapshotRef.current,
        lastCapWheelAction: String(detail.action || ""),
        lastCapWheelNode: String(detail.payload?.node || detail.action || "")
      });
      const saved = saveRhizohExperienceSessionContextV0(next);
      publishRhizohExperienceSessionContextV0(saved);
      setContext(saved);
    };
    window.addEventListener(RHIZOH_PRODUCT_BINDING_EVENT_V0, onBinding);
    return () => window.removeEventListener(RHIZOH_PRODUCT_BINDING_EVENT_V0, onBinding);
  }, [enabled]);

  return context;
}
