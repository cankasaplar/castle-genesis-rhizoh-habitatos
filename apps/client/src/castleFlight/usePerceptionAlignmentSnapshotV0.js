/**
 * T0 shell observation hook — read-only alignment mirror (no control, no influence).
 * @see docs/CAMERA_UNIFICATION_SPEC_V1.md Step 2.2
 */

import { useEffect, useMemo, useRef, useSyncExternalStore } from "react";
import {
  publishPerceptionAlignmentSnapshotV0,
  readPerceptionAlignmentFromRuntimeV0
} from "./perceptionAlignmentSnapshotV0.js";

const DEFAULT_POLL_MS_V0 = 1000;

/** @type {Set<() => void>} */
const listeners = new Set();

/** @type {ReturnType<typeof readPerceptionAlignmentFromRuntimeV0> | null} */
let cachedSnapshot = null;

/** @type {string} */
let cachedDigest = "";

/**
 * @param {object} runtime
 */
export function digestPerceptionAlignmentRuntimeV0(runtime) {
  return JSON.stringify({
    fieldState: runtime?.fieldState,
    replyText: String(runtime?.replyText || "").slice(0, 80),
    draftText: String(runtime?.draftText || "").slice(0, 80),
    busy: runtime?.busy,
    mountId: runtime?.mountId,
    productSurface: runtime?.productSurface,
    realityMode: runtime?.realityMode,
    worldMapTool: runtime?.worldMapTool,
    voiceListening: runtime?.voiceListening,
    mapSurfaceActive: runtime?.mapSurfaceActive
  });
}

/**
 * @param {object} runtime
 */
function refreshAlignmentSnapshotV0(runtime) {
  const snap = readPerceptionAlignmentFromRuntimeV0(runtime);
  publishPerceptionAlignmentSnapshotV0(snap);
  const digest = JSON.stringify({
    atMs: snap.contract?.atMs,
    risk: snap.contract?.alignment?.semanticDriftRisk,
    ex: snap.contract?.alignment?.explanations?.length,
    mount: snap.contract?.perception?.mountId
  });
  if (digest !== cachedDigest) {
    cachedDigest = digest;
    cachedSnapshot = snap;
    for (const fn of listeners) {
      try {
        fn();
      } catch {
        /* noop */
      }
    }
  }
  return snap;
}

function subscribeAlignmentSnapshotV0(onChange) {
  listeners.add(onChange);
  return () => listeners.delete(onChange);
}

function getAlignmentSnapshotV0() {
  return cachedSnapshot;
}

/**
 * Read-only alignment mirror for T0 shell observation strip.
 * @param {{
 *   fieldState?: string,
 *   replyText?: string,
 *   draftText?: string,
 *   busy?: boolean,
 *   mountId?: string,
 *   productSurface?: string,
 *   realityMode?: string,
 *   worldMapTool?: string,
 *   voiceListening?: boolean,
 *   mapSurfaceActive?: boolean,
 *   atMs?: number
 * } | null | undefined} runtime
 * @param {{ pollMs?: number, enabled?: boolean }} [opts]
 */
export function usePerceptionAlignmentSnapshotV0(runtime, opts = {}) {
  const enabled = opts.enabled !== false;
  const pollMs = Number(opts.pollMs) > 0 ? Number(opts.pollMs) : DEFAULT_POLL_MS_V0;
  const runtimeRef = useRef(runtime || {});
  runtimeRef.current = runtime || {};

  const runtimeDigest = useMemo(
    () => digestPerceptionAlignmentRuntimeV0(runtime || {}),
    [runtime]
  );

  useEffect(() => {
    if (!enabled) return undefined;
    const tick = () => {
      const r = runtimeRef.current;
      refreshAlignmentSnapshotV0({
        ...r,
        atMs: r.atMs ?? Date.now()
      });
    };
    tick();
    const id = window.setInterval(tick, pollMs);
    return () => window.clearInterval(id);
  }, [enabled, pollMs, runtimeDigest]);

  return useSyncExternalStore(
    enabled ? subscribeAlignmentSnapshotV0 : () => () => {},
    enabled ? getAlignmentSnapshotV0 : () => null,
    () => null
  );
}

/** @internal vitest */
export function __resetAlignmentSnapshotHookForTestV0() {
  listeners.clear();
  cachedSnapshot = null;
  cachedDigest = "";
}
