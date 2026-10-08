import React, { useState } from "react";
import { RhizohPlayRoom } from "../ingress/RhizohPlayRoom.jsx";
import { RhizohPuzzleLab } from "../ingress/RhizohPuzzleLab.jsx";
import { ResearchStatePlaceholder } from "../shared/ResearchStatePlaceholder.jsx";
import { Play, Puzzle, Trophy, Users, Cpu, ShieldCheck } from "lucide-react";

export function RhizohPlayHub({ initialSub = "human-vs-rhizoh" }) {
  const [activeSub, setActiveSub] = useState(initialSub);

  return (
    <div className="space-y-6">
      {/* Sub-navigation bar */}
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-800 pb-4">
        <button
          onClick={() => setActiveSub("human-vs-rhizoh")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-mono tracking-wider transition-all ${
            activeSub === "human-vs-rhizoh"
              ? "bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 font-bold"
              : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50"
          }`}
        >
          <Cpu className="w-3.5 h-3.5" />
          HUMAN VS RHIZOH
        </button>

        <button
          onClick={() => setActiveSub("puzzles")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-mono tracking-wider transition-all ${
            activeSub === "puzzles"
              ? "bg-purple-500/20 border border-purple-500/40 text-purple-400 font-bold"
              : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50"
          }`}
        >
          <Puzzle className="w-3.5 h-3.5" />
          PUZZLES (P4 WORLD)
        </button>

        <button
          onClick={() => setActiveSub("human-vs-human")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-mono tracking-wider transition-all ${
            activeSub === "human-vs-human"
              ? "bg-sky-500/20 border border-sky-500/40 text-sky-400 font-bold"
              : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50"
          }`}
        >
          <Users className="w-3.5 h-3.5" />
          HUMAN VS HUMAN
        </button>

        <button
          onClick={() => setActiveSub("rhizoh-vs-rhizoh")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-mono tracking-wider transition-all ${
            activeSub === "rhizoh-vs-rhizoh"
              ? "bg-amber-500/20 border border-amber-500/40 text-amber-400 font-bold"
              : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50"
          }`}
        >
          <Play className="w-3.5 h-3.5" />
          RHIZOH VS RHIZOH
        </button>

        <button
          onClick={() => setActiveSub("tournaments")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-mono tracking-wider transition-all ${
            activeSub === "tournaments"
              ? "bg-slate-700/50 border border-slate-600 text-slate-200 font-bold"
              : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50"
          }`}
        >
          <Trophy className="w-3.5 h-3.5" />
          TOURNAMENTS
        </button>
      </div>

      {/* Sub-content */}
      {activeSub === "human-vs-rhizoh" && (
        <div>
          <RhizohPlayRoom />
        </div>
      )}

      {activeSub === "puzzles" && (
        <div>
          <RhizohPuzzleLab />
        </div>
      )}

      {activeSub === "human-vs-human" && (
        <div className="p-8 rounded-2xl border border-slate-800 bg-slate-900/60 text-center space-y-4">
          <Users className="w-12 h-12 text-sky-400 mx-auto" />
          <h3 className="text-xl font-bold text-slate-100">Human vs Human Rooms</h3>
          <p className="text-sm text-slate-300 max-w-lg mx-auto">
            Challenge players across the sovereign peer network with server-authoritative move validation and ledger-backed ratings.
          </p>
          <div className="text-xs font-mono text-emerald-400">P3-A, P3-B, P3-C, P3-D Active on Gateway</div>
        </div>
      )}

      {activeSub === "rhizoh-vs-rhizoh" && (
        <ResearchStatePlaceholder
          phaseCode="P3-E"
          title="Autonomous Self-Play Arena"
          status="LAB BENCHMARK"
          statusType="info"
          description="Autonomous engine self-play matches streaming in real time. Used for empirical parameter tuning and forensic data mining."
          gates={[
            "Real-time move telemetry stream",
            "Continuous PGN recording to archive",
            "Zero influence on production authority"
          ]}
          specRef="P3-E-SELFPLAY"
        />
      )}

      {activeSub === "tournaments" && (
        <ResearchStatePlaceholder
          phaseCode="P3-F"
          title="Sovereign Tournament Engine"
          status="LAB PIPELINE"
          statusType="locked"
          description="Swiss and round-robin tournament brackets with verified pairing authority and provisional rating isolation."
          gates={[
            "Pairing authority gate",
            "Provisional rating isolation",
            "Anti-collusion replay auditor"
          ]}
          specRef="P3-F-TOURNAMENTS"
        />
      )}
    </div>
  );
}
