import { useEffect, useState } from "react";
import {
  readLastT0PresenceFrameV0,
  RHIZOH_T0_PRESENCE_FRAME_EVENT_V0,
  sampleT0PresenceFrameV0,
  subscribeT0PresenceFrameSamplerV0
} from "./rhizohT0UnifiedPresenceFrameV0.js";

/**
 * React hook — unified temporal frame (strip + orb + field same phase).
 */
export function useRhizohT0PresenceFrameV0() {
  const [frame, setFrame] = useState(() => sampleT0PresenceFrameV0() || readLastT0PresenceFrameV0());

  useEffect(() => {
    const apply = (f) => {
      const next = f || sampleT0PresenceFrameV0();
      if (next) setFrame(next);
    };
    apply(readLastT0PresenceFrameV0());
    const onEvent = (ev) => apply(ev?.detail?.frame);
    window.addEventListener(RHIZOH_T0_PRESENCE_FRAME_EVENT_V0, onEvent);
    const unsub = subscribeT0PresenceFrameSamplerV0(apply);
    return () => {
      window.removeEventListener(RHIZOH_T0_PRESENCE_FRAME_EVENT_V0, onEvent);
      unsub();
    };
  }, []);

  return frame;
}
