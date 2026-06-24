/**
 * Boot wire — exposes studio observation adapter registry on window.__rhizoh.
 * RESEARCH-ONLY
 */

import { getStudioObservationAdapterRegistrySnapshotV0 } from "./rhizohStudioObservationAdapterRegistryV0.js";

export function ensureRhizohStudioObservationAdapterDevToolsV0() {
  if (typeof window === "undefined") return null;
  window.__rhizoh = window.__rhizoh || {};
  window.__rhizoh.studioAdapters = () => getStudioObservationAdapterRegistrySnapshotV0();
  return window.__rhizoh.studioAdapters;
}
