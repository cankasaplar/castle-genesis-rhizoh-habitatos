/**
 * Hook — STT heard UI + conversation continuity strip (presentation only).
 */

import { useCallback, useEffect, useRef, useState } from "react";
import { loadRhizohProductSession } from "../product/rhizohProductSessionPersistenceV1.js";
import {
  RHIZOH_STT_HEARD_EVENT_V1,
  RHIZOH_CONVERSATION_CONTINUITY_EVENT_V1,
  buildConversationContinuitySnapshotV1,
  publishConversationContinuitySurfaceV1,
  emitRhizohSttHeardSurfaceV1
} from "./rhizohLivingConversationSurfaceV1.js";

/**
 * @param {{
 *   uiLocaleTr?: boolean,
 *   productSessionId?: string | null,
 *   experienceSessionId?: string | null,
 *   setRhizohMainHudReply: (v: object | null) => void,
 *   setCommandLog: (fn: (prev: object[]) => object[]) => void,
 *   setCmd?: (v: string) => void
 * }} opts
 */
export function useRhizohLivingConversationSurfaceV1(opts) {
  const tr = opts.uiLocaleTr === true;
  const optsRef = useRef(opts);
  optsRef.current = opts;

  const [continuitySnap, setContinuitySnap] = useState(() =>
    buildConversationContinuitySnapshotV1({
      productSessionId: opts.productSessionId,
      experienceSessionId: opts.experienceSessionId,
      userTurnCount: readTurnCountSafe()
    })
  );

  const refreshContinuity = useCallback(() => {
    const snap = buildConversationContinuitySnapshotV1({
      productSessionId: optsRef.current.productSessionId,
      experienceSessionId: optsRef.current.experienceSessionId,
      userTurnCount: readTurnCountSafe(),
      lastHeardAtMs: typeof window !== "undefined" ? window.__RHIZOH_STT_HEARD_SURFACE__?.last?.atMs : null
    });
    publishConversationContinuitySurfaceV1(snap);
    setContinuitySnap(snap);
  }, []);

  useEffect(() => {
    refreshContinuity();
  }, [opts.productSessionId, opts.experienceSessionId, refreshContinuity]);

  useEffect(() => {
    const onHeard = (event) => {
      const detail = event?.detail;
      if (!detail?.hudCopy) return;
      optsRef.current.setRhizohMainHudReply({
        text: detail.hudCopy,
        source: "stt-heard-v1",
        at: Date.now()
      });
      optsRef.current.setCommandLog((prev) =>
        [
          {
            ts: Date.now(),
            raw: detail.showTranscript ? detail.text : `[${detail.reason}]`,
            source: "stt-heard",
            reason: detail.reason
          },
          ...prev
        ].slice(0, 24)
      );
      if (detail.showTranscript !== false && detail.text && typeof optsRef.current.setCmd === "function") {
        optsRef.current.setCmd(detail.text);
      }
      refreshContinuity();
    };
    const onContinuity = (e) => {
      if (e?.detail) setContinuitySnap(e.detail);
    };
    window.addEventListener(RHIZOH_STT_HEARD_EVENT_V1, onHeard);
    window.addEventListener(RHIZOH_CONVERSATION_CONTINUITY_EVENT_V1, onContinuity);
    return () => {
      window.removeEventListener(RHIZOH_STT_HEARD_EVENT_V1, onHeard);
      window.removeEventListener(RHIZOH_CONVERSATION_CONTINUITY_EVENT_V1, onContinuity);
    };
  }, [refreshContinuity]);

  const surfaceSttHeardV1 = useCallback(
    (text, meta = {}) => {
      return emitRhizohSttHeardSurfaceV1({
        text,
        tr,
        ...meta
      });
    },
    [tr]
  );

  return { continuitySnap, surfaceSttHeardV1, refreshContinuity };
}

function readTurnCountSafe() {
  try {
    return loadRhizohProductSession().userTurnCount || 0;
  } catch {
    return 0;
  }
}
