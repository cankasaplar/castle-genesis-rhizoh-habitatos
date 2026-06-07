/**
 * React hook — hydrate invite URL + subscribe remote event catalog (best-effort).
 */

import { useEffect } from "react";
import {
  hydrateEventCatalogFromJoinV1,
  subscribeRemoteEventCatalogV1
} from "./rhizohEventCatalogSyncV1.js";

/**
 * @param {{ eventId?: string | null, authUid?: string | null, enabled?: boolean }} opts
 */
export function useRhizohEventCatalogSyncV1(opts = {}) {
  const eventId = opts.eventId ? String(opts.eventId) : "";
  const enabled = opts.enabled !== false;

  useEffect(() => {
    if (!enabled || typeof window === "undefined") return undefined;
    hydrateEventCatalogFromJoinV1(window.location.search || "");
    return undefined;
  }, [enabled]);

  useEffect(() => {
    if (!enabled || !eventId) return undefined;
    return subscribeRemoteEventCatalogV1(eventId, () => {
      /* publishEventCatalogSyncV1 inside subscriber */
    });
  }, [enabled, eventId, opts.authUid]);
}
