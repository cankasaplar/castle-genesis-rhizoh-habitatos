import React, { memo, useState } from "react";
import { ASSETS, STUDIO_ASSET_MANIFEST_V1 } from "./assetRegistryV1.js";
import { COMPANION_PRESENCE_STATE_LABELS_TR_V0 } from "../castleFlight/companionPresenceStateV0.js";
import { getStudioCameraModeLabelV1 } from "./studioLiveRoomCameraV1.js";

const TABS = Object.freeze(["voice", "presence", "assets"]);

/**
 * Layer 4 — minimal drawer shell (voice · presence · assets debug).
 */
export const StudioLiveRoomDrawerV1 = memo(function StudioLiveRoomDrawerV1({
  open,
  onToggle,
  tab,
  onTab,
  voice,
  presence,
  cameraMode,
  loadReport,
  transcript,
  rhizohReply
}) {
  const [assetsDebug, setAssetsDebug] = useState(false);

  return (
    <div className="pointer-events-none absolute bottom-0 left-0 right-0 z-20 flex flex-col">
      <button
        type="button"
        className="pointer-events-auto mx-auto mb-2 rounded-full border border-cyan-400/40 bg-black/60 px-4 py-1 text-[10px] uppercase tracking-wide text-cyan-100 hover:bg-cyan-950/50"
        onClick={onToggle}
      >
        {open ? "Drawer kapat" : "Drawer aç"}
      </button>

      {open ? (
        <div className="pointer-events-auto border-t border-white/15 bg-black/75 backdrop-blur-md">
          <div className="flex gap-1 px-2 pt-2">
            {TABS.map((id) => (
              <button
                key={id}
                type="button"
                className={`rounded-t px-2 py-1 text-[9px] uppercase ${
                  tab === id ? "bg-cyan-900/60 text-cyan-100" : "text-white/50 hover:text-white/80"
                }`}
                onClick={() => onTab(id)}
              >
                {id}
              </button>
            ))}
          </div>

          <div className="max-h-36 overflow-y-auto px-3 py-2 text-[10px] text-white/80">
            {tab === "voice" ? (
              <div className="space-y-1">
                <p>
                  Mic / STT:{" "}
                  <span className="font-mono text-emerald-300/90">
                    {voice?.listening ? "dinliyor" : voice?.ok === false ? "yok" : "hazır"}
                  </span>
                </p>
                <p className="text-white/55">Transcript:</p>
                <p className="font-mono text-[9px] text-cyan-100/90 break-words">
                  {transcript || "—"}
                </p>
                <p className="text-white/55">Rhizoh:</p>
                <p className="font-mono text-[9px] text-violet-200/90 break-words">{rhizohReply || "—"}</p>
              </div>
            ) : null}

            {tab === "presence" ? (
              <div className="space-y-1">
                <p>
                  Studio visual: <span className="font-mono text-cyan-200">{presence?.studio || "—"}</span>
                </p>
                <p>
                  PWE state:{" "}
                  <span className="font-mono">
                    {COMPANION_PRESENCE_STATE_LABELS_TR_V0[presence?.pwe] || presence?.pwe || "—"}
                  </span>
                </p>
                <p>
                  Thought field: <span className="font-mono">{presence?.field || "IDLE"}</span>
                </p>
                <p>
                  Camera: <span className="font-mono">{getStudioCameraModeLabelV1(cameraMode)}</span>
                </p>
              </div>
            ) : null}

            {tab === "assets" ? (
              <div className="space-y-1">
                <button
                  type="button"
                  className="text-[9px] text-amber-300/90 underline"
                  onClick={() => setAssetsDebug((v) => !v)}
                >
                  {assetsDebug ? "debug gizle" : "debug göster"}
                </button>
                <ul className="space-y-0.5 font-mono text-[8px]">
                  {(loadReport || []).map((r) => (
                    <li key={r.key} className={r.ok ? "text-emerald-300/80" : "text-red-300/80"}>
                      {r.ok ? "✓" : "✗"} {r.key} {assetsDebug ? r.url : ""}
                    </li>
                  ))}
                </ul>
                {assetsDebug ? (
                  <pre className="mt-1 text-[7px] text-white/40 overflow-x-auto">
                    {JSON.stringify({ ASSETS, manifest: STUDIO_ASSET_MANIFEST_V1 }, null, 0)}
                  </pre>
                ) : null}
              </div>
            ) : null}
          </div>
        </div>
      ) : null}
    </div>
  );
});
