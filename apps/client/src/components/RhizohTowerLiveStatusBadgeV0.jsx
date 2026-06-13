import React, { memo, useSyncExternalStore } from "react";
import {
  RHIZOH_TOWER_LIVE_STATUS_EVENT_V0,
  readRhizohTowerLiveStatusV0,
  towerLiveStatusColorV0
} from "../rhizoh/runtime/rhizohTowerLiveStatusV0.js";

function subscribeStatus(cb) {
  if (typeof window === "undefined") return () => {};
  window.addEventListener(RHIZOH_TOWER_LIVE_STATUS_EVENT_V0, cb);
  return () => window.removeEventListener(RHIZOH_TOWER_LIVE_STATUS_EVENT_V0, cb);
}

function readStatusSnapshot() {
  return readRhizohTowerLiveStatusV0().status;
}

export const RhizohTowerLiveStatusBadgeV0 = memo(function RhizohTowerLiveStatusBadgeV0({
  towerId = "default",
  uiLocale = "en",
  compact = false
}) {
  const tr = uiLocale === "tr";
  const status = useSyncExternalStore(subscribeStatus, readStatusSnapshot, () => "OFFLINE");
  const color = towerLiveStatusColorV0(status);
  const label =
    status === "THINKING"
      ? tr
        ? "DÜŞÜNÜYOR"
        : "THINKING"
      : status === "SYNCING"
        ? tr
          ? "SENKRON"
          : "SYNCING"
        : status === "OFFLINE"
          ? tr
            ? "ÇEVRİMDIŞI"
            : "OFFLINE"
          : tr
            ? "ÇEVRİMİÇİ"
            : "ONLINE";

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 font-black uppercase tracking-wider ${
        compact ? "text-[8px]" : "text-[9px]"
      }`}
      style={{ borderColor: `${color}66`, color, background: `${color}14` }}
      data-tower-live-status={status}
      data-tower-id={towerId}
    >
      <span className="inline-block h-1.5 w-1.5 rounded-full" style={{ background: color }} />
      {label}
    </span>
  );
});
