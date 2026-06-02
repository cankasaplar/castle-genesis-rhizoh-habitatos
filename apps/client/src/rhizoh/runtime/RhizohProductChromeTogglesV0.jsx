import React, { useSyncExternalStore } from "react";
import {
  getRhizohChromePanelsSnapshotV0,
  setRhizohProductChromePanelOpenV0,
  subscribeRhizohChromePanelsV0
} from "./rhizohProductChromePanelsV0.js";
import { RHIZOH_PRODUCT_SHELL_BAR_H_REM_V0 } from "./rhizohT0FirstMatchIdentityV0.js";

/**
 * Slim toggle strip — panels default closed; user opens what they need.
 */
export function RhizohProductChromeTogglesV0({ className = "" }) {
  const panels = useSyncExternalStore(
    subscribeRhizohChromePanelsV0,
    getRhizohChromePanelsSnapshotV0,
    getRhizohChromePanelsSnapshotV0
  );

  return (
    <div
      className={`pointer-events-auto fixed inset-x-0 z-[59] border-t border-white/8 bg-[#030711]/90 backdrop-blur-md ${className}`}
      style={{ bottom: `${RHIZOH_PRODUCT_SHELL_BAR_H_REM_V0}rem` }}
      data-rhizoh-chrome-toggles="1"
      role="toolbar"
      aria-label="Rhizoh panelleri"
    >
      <div className="mx-auto flex max-w-lg items-center justify-center gap-2 px-3 py-1.5">
        <ChromeToggle
          label="Tekerlek"
          pressed={panels.wheel}
          onClick={() => setRhizohProductChromePanelOpenV0("wheel")}
        />
        <ChromeToggle
          label="Süreklilik"
          pressed={panels.continuity}
          onClick={() => setRhizohProductChromePanelOpenV0("continuity")}
        />
      </div>
    </div>
  );
}

/** @param {{ label: string, pressed: boolean, onClick: () => void }} props */
function ChromeToggle({ label, pressed, onClick }) {
  return (
    <button
      type="button"
      aria-pressed={pressed}
      onClick={onClick}
      className={`touch-manipulation rounded-lg border px-3 py-1.5 text-[10px] font-semibold normal-case tracking-normal transition-colors ${
        pressed
          ? "border-cyan-400/50 bg-cyan-500/20 text-cyan-100"
          : "border-white/12 bg-black/40 text-white/55 hover:border-white/25 hover:text-white/85"
      }`}
    >
      {label}
    </button>
  );
}
