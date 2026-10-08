import React, { useState, useEffect } from "react";
import { RhizohChronicleViewer } from "../ingress/RhizohChronicleViewer.jsx";
import { ResearchStatePlaceholder } from "../shared/ResearchStatePlaceholder.jsx";
import { Globe, BookOpen, Radio, Calendar, Newspaper, Compass, ShieldCheck } from "lucide-react";

export function RhizohWorldHub({ initialSub = "chronicle" }) {
  const [activeSub, setActiveSub] = useState(initialSub);
  const [eventsData, setEventsData] = useState([]);
  const [summaryData, setSummaryData] = useState(null);

  useEffect(() => {
    fetch("/api/world/events")
      .then((r) => r.json())
      .then((d) => d.ok && setEventsData(d.events || []))
      .catch(() => {});

    fetch("/api/world/summary")
      .then((r) => r.json())
      .then((d) => d.ok && setSummaryData(d))
      .catch(() => {});
  }, []);

  return (
    <div className="space-y-6">
      {/* Sub-nav */}
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-800 pb-4">
        <button
          onClick={() => setActiveSub("chronicle")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-mono tracking-wider transition-all ${
            activeSub === "chronicle"
              ? "bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 font-bold"
              : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50"
          }`}
        >
          <BookOpen className="w-3.5 h-3.5" />
          CHRONICLE (#001 SEALED)
        </button>

        <button
          onClick={() => setActiveSub("events")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-mono tracking-wider transition-all ${
            activeSub === "events"
              ? "bg-sky-500/20 border border-sky-500/40 text-sky-400 font-bold"
              : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50"
          }`}
        >
          <Calendar className="w-3.5 h-3.5" />
          WORLD EVENTS
        </button>

        <button
          onClick={() => setActiveSub("perspective")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-mono tracking-wider transition-all ${
            activeSub === "perspective"
              ? "bg-purple-500/20 border border-purple-500/40 text-purple-400 font-bold"
              : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50"
          }`}
        >
          <Compass className="w-3.5 h-3.5" />
          RHIZOH PERSPECTIVE
        </button>

        <button
          onClick={() => setActiveSub("news")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-mono tracking-wider transition-all ${
            activeSub === "news"
              ? "bg-slate-700/50 border border-slate-600 text-slate-200 font-bold"
              : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50"
          }`}
        >
          <Newspaper className="w-3.5 h-3.5" />
          NEWS
        </button>
      </div>

      {activeSub === "chronicle" && (
        <div>
          <RhizohChronicleViewer />
        </div>
      )}

      {activeSub === "events" && (
        <div className="space-y-4">
          <div className="text-xs font-mono text-slate-400 uppercase tracking-wider mb-2">Verified World Events Feed:</div>
          <div className="space-y-3">
            {eventsData.map((ev) => (
              <div key={ev.event_id} className="p-5 rounded-2xl border border-slate-800 bg-slate-900/60 backdrop-blur-md">
                <div className="flex items-center justify-between gap-4 mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono px-2 py-0.5 rounded bg-emerald-950/60 border border-emerald-800/40 text-emerald-400">
                      {ev.date}
                    </span>
                    <span className="text-xs font-mono text-slate-400 uppercase">{ev.category}</span>
                  </div>
                  <span className="text-xs font-mono text-slate-400">{ev.event_id}</span>
                </div>
                <h4 className="text-base font-bold text-slate-100 mb-1">{ev.title}</h4>
                <p className="text-xs text-slate-300 leading-relaxed">{ev.description}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeSub === "perspective" && (
        <div className="p-8 rounded-3xl border border-slate-800 bg-slate-900/60 space-y-6">
          <div className="flex items-center gap-3">
            <Compass className="w-6 h-6 text-purple-400" />
            <h3 className="text-xl font-bold text-slate-100">The Rhizoh Perspective</h3>
          </div>
          <div className="space-y-4 text-sm text-slate-300 leading-relaxed font-sans">
            <p>
              Rhizoh is not an LLM hallucinating chess moves, nor is it a proprietary black box claiming unverified strength.
            </p>
            <p>
              Every game is recorded. Every candidate is evaluated by the Engine Council under strict statistical SPRT gates. If a model does not prove superior Elo with statistical confidence, it is rejected — regardless of the hype or compute poured into it.
            </p>
            <p className="font-serif italic text-emerald-400 text-lg">
              “Bana inanma. İzle.”
            </p>
          </div>
        </div>
      )}

      {activeSub === "news" && (
        <ResearchStatePlaceholder
          phaseCode="P9-NEWS"
          title="World Chess Syndication & News Feed"
          status="LAB PIPELINE"
          statusType="info"
          description="Autonomous ingestion and tactical summary of global chess tournaments and championship games."
          gates={[
            "Ground-truth PGN ingest gateway",
            "Automated tactical swing summarizer",
            "Zero clickbait / strictly factual annotations"
          ]}
          specRef="P9-CHESS-WORLD"
        />
      )}
    </div>
  );
}
