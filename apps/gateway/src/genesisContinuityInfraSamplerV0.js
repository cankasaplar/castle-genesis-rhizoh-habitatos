import { publishGenesisContinuityEvent, genesisContinuityStreamSubscriberCount } from "./genesisContinuityStreamHubV0.js";

/**
 * Diff infra / replay / presence / spiral + gateway capability / replay fingerprint slices.
 * @param {() => Promise<Record<string, unknown>>} getPayloadAsync
 * @param {number} [periodMs]
 * @returns {() => void} stop
 */
export function startGenesisContinuityInfraSampler(getPayloadAsync, periodMs = 2000) {
  /** @type {Record<string, unknown> | null} */
  let last = null;

  const tick = async () => {
    if (genesisContinuityStreamSubscriberCount() === 0) return;
    let next;
    try {
      next = await getPayloadAsync();
    } catch {
      return;
    }
    if (!last) {
      last = next;
      if (next.gatewayCapabilities && typeof next.gatewayCapabilities === "object") {
        publishGenesisContinuityEvent({
          type: "RuntimeCapabilityEvent",
          id: "cap:gateway",
          payload: /** @type {Record<string, unknown>} */ (next.gatewayCapabilities)
        });
      }
      if (next.replayFingerprint && typeof next.replayFingerprint === "object") {
        const fp = /** @type {Record<string, unknown>} */ (next.replayFingerprint);
        const short = String(fp.short || "");
        publishGenesisContinuityEvent({
          type: "ReplayFingerprint",
          id: `fp:${short.replace(/:/g, "").slice(0, 20)}`,
          payload: fp
        });
      }
      return;
    }

    const lr = last.replay && typeof last.replay === "object" ? /** @type {Record<string, unknown>} */ (last.replay) : {};
    const nr = next.replay && typeof next.replay === "object" ? /** @type {Record<string, unknown>} */ (next.replay) : {};
    if (JSON.stringify(lr) !== JSON.stringify(nr)) {
      publishGenesisContinuityEvent({
        type: "ReplayState",
        id: `replay:${String(nr.alignment || "unknown")}:${nr.divergenceTotal ?? "na"}`,
        payload: nr
      });
    }

    const lm = last.presenceMesh && typeof last.presenceMesh === "object" ? last.presenceMesh : {};
    const nm = next.presenceMesh && typeof next.presenceMesh === "object" ? next.presenceMesh : {};
    if (JSON.stringify(lm) !== JSON.stringify(nm)) {
      publishGenesisContinuityEvent({
        type: "PresenceMesh",
        id: `mesh:uids:${nm.uniqueClientUids ?? "na"}:seq:${nm.maxSeqAcrossRooms ?? 0}`,
        payload: nm
      });
    }

    const li = last.infra && typeof last.infra === "object" ? last.infra : {};
    const ni = next.infra && typeof next.infra === "object" ? next.infra : {};
    const liPick = { status: li.status, errors: li.errors, queueDepth: li.queueDepth, score: li.score };
    const niPick = { status: ni.status, errors: ni.errors, queueDepth: ni.queueDepth, score: ni.score };
    if (JSON.stringify(liPick) !== JSON.stringify(niPick)) {
      publishGenesisContinuityEvent({
        type: "InfraHealth",
        id: `infra:${String(ni.status || "unknown")}:err:${ni.errors ?? 0}`,
        payload: niPick
      });
    }

    const ls = last.spiralWebSocket && typeof last.spiralWebSocket === "object" ? last.spiralWebSocket : null;
    const ns = next.spiralWebSocket && typeof next.spiralWebSocket === "object" ? next.spiralWebSocket : null;
    if (JSON.stringify(ls) !== JSON.stringify(ns)) {
      publishGenesisContinuityEvent({
        type: "SpiralWebSocket",
        id: `spiral:ws:${ns?.clientsActive ?? 0}`,
        payload: ns || {}
      });
    }

    const lfp =
      last.replayFingerprint && typeof last.replayFingerprint === "object"
        ? String(/** @type {Record<string, unknown>} */ (last.replayFingerprint).short || "")
        : "";
    const nfp =
      next.replayFingerprint && typeof next.replayFingerprint === "object"
        ? String(/** @type {Record<string, unknown>} */ (next.replayFingerprint).short || "")
        : "";
    if (nfp && nfp !== lfp) {
      publishGenesisContinuityEvent({
        type: "ReplayFingerprint",
        id: `fp:${nfp.replace(/:/g, "").slice(0, 20)}`,
        payload: /** @type {Record<string, unknown>} */ (next.replayFingerprint)
      });
    }

    const lcap = last.gatewayCapabilities && typeof last.gatewayCapabilities === "object" ? last.gatewayCapabilities : null;
    const ncap = next.gatewayCapabilities && typeof next.gatewayCapabilities === "object" ? next.gatewayCapabilities : null;
    if (JSON.stringify(lcap) !== JSON.stringify(ncap) && ncap) {
      publishGenesisContinuityEvent({
        type: "RuntimeCapabilityEvent",
        id: "cap:gateway",
        payload: /** @type {Record<string, unknown>} */ (ncap)
      });
    }

    last = next;
  };

  const id = setInterval(() => {
    void tick();
  }, periodMs);
  return () => clearInterval(id);
}
