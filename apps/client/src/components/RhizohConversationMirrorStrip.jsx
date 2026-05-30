import React, { useEffect, useState } from "react";
import {
  buildConversationBehaviorMirrorSnapshotV0,
  isConversationMirrorInspectVisibleV0
} from "../rhizoh/runtime/rhizohConversationBehaviorMirrorV0.js";

const HEAT_LANGS = ["tr", "en", "es"];

/**
 * Read-only conversation behavior mirror — no learning, no weight updates.
 * Visible when DEV, ?mirror=1, or VITE_RHIZOH_CONVERSATION_MIRROR_UI=1.
 */
export function RhizohConversationMirrorStrip() {
  const [snap, setSnap] = useState(() => buildConversationBehaviorMirrorSnapshotV0());

  useEffect(() => {
    if (!isConversationMirrorInspectVisibleV0()) return undefined;
    const tick = () => {
      const next =
        typeof window !== "undefined" && typeof window.__CASTLE_RHIZOH_CONVERSATION_MIRROR__ === "function"
          ? window.__CASTLE_RHIZOH_CONVERSATION_MIRROR__()
          : buildConversationBehaviorMirrorSnapshotV0();
      setSnap(next);
    };
    tick();
    const id = window.setInterval(tick, 2000);
    return () => window.clearInterval(id);
  }, []);

  if (!isConversationMirrorInspectVisibleV0()) return null;

  const heat = snap.languageHeatmap || {};
  const hist = snap.ackReplyLatency || {};
  const drift = snap.companionToneDrift || {};
  const speakLog = (snap.speakSilenceLog || []).slice(-6);

  return (
    <div className="mx-1 mb-2 rounded-xl border border-cyan-400/25 bg-cyan-950/20 px-3 py-2 normal-case text-[9px] text-cyan-100/90">
      <div className="mb-2 font-bold tracking-[0.12em] uppercase text-cyan-200">
        Conversation mirror · measurement only
      </div>

      <div className="mb-2">
        <div className="text-[8px] text-white/45 mb-1">Language heatmap (TR / EN / ES)</div>
        <div className="grid grid-cols-3 gap-1">
          {HEAT_LANGS.map((lang) => {
            const c = heat[lang] || { turns: 0, fastPath: 0, voiceTurns: 0 };
            const intensity = Math.min(1, (c.turns || 0) / 8);
            return (
              <div
                key={lang}
                className="rounded border border-white/10 px-1 py-1 text-center"
                style={{ backgroundColor: `rgba(34,211,238,${0.08 + intensity * 0.35})` }}
              >
                <div className="uppercase text-[8px] text-white/70">{lang}</div>
                <div className="text-white/90">{c.turns} turn</div>
                <div className="text-[7px] text-white/50">
                  fast {c.fastPath} · voice {c.voiceTurns}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="mb-2 flex flex-wrap gap-3">
        <div>
          <div className="text-[8px] text-white/45">Ack→reply (p50)</div>
          <div className="font-mono text-emerald-200/90">
            {hist.p50Ms != null ? `${Math.round(hist.p50Ms)} ms` : "—"}
          </div>
        </div>
        <div>
          <div className="text-[8px] text-white/45">Tone drift index</div>
          <div className="font-mono text-amber-200/90">
            {drift.driftIndex01 != null ? drift.driftIndex01.toFixed(2) : "0.00"}
          </div>
        </div>
        <div>
          <div className="text-[8px] text-white/45">Events</div>
          <div className="font-mono text-white/80">{snap.eventCount}</div>
        </div>
      </div>

      {speakLog.length ? (
        <div className="rounded border border-white/10 bg-black/25 p-2">
          <div className="text-[8px] text-white/45 mb-1">Silence vs speak (son)</div>
          {speakLog.map((row, i) => (
            <div key={`${row.atMs}-${i}`} className="text-[8px] text-white/70">
              <span className={row.decision === "speak" ? "text-emerald-300" : "text-rose-300/90"}>
                {row.decision}
              </span>
              {row.reason ? ` · ${row.reason}` : null}
            </div>
          ))}
        </div>
      ) : null}

      <p className="mt-2 text-[7px] text-white/40">
        Console: <code className="text-cyan-200/80">__CASTLE_RHIZOH_CONVERSATION_MIRROR__()</code>
      </p>
    </div>
  );
}
