import React from "react";
import { ResearchStatePlaceholder } from "../shared/ResearchStatePlaceholder.jsx";
import { Trophy, Globe, Award, ShieldCheck } from "lucide-react";

export function RhizohCompetitionHub() {
  return (
    <div className="space-y-6">
      <div className="border-b border-slate-800 pb-6">
        <div className="flex items-center gap-2 text-xs font-mono text-amber-400 uppercase tracking-wider mb-2">
          <Trophy className="w-4 h-4" />
          <span>PHASES 8–10 — EXTERNAL COMPETITIONS & AI CHAMPIONSHIPS</span>
        </div>
        <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-100">
          Competition Arena
        </h2>
        <p className="text-sm text-slate-400 mt-1 max-w-2xl">
          External rating calibration, AI championships (TCEC/CCC participation), and official human vs AI matches.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <ResearchStatePlaceholder
          phaseCode="P8"
          title="External Competition & Lichess/Chess.com Bot Gateway"
          status="LAB PIPELINE"
          statusType="info"
          description="Direct bridge allowing Rhizoh E5 to compete in external rated arenas with verified PGN archiving and zero latency tampering."
          gates={[
            "UCI compliance validation",
            "Fair play reality auditor",
            "Continuous live PGN streaming"
          ]}
          specRef="P8-EXTERNAL-CHESS"
        />

        <ResearchStatePlaceholder
          phaseCode="P10"
          title="AI Championships Engine"
          status="PLANNED"
          statusType="locked"
          description="Formal participation in open computer chess leagues with full hardware specs and opening book neutrality."
          gates={[
            "Opening book neutrality certificate",
            "Standardized hardware anchor",
            "Engine Council formal submission"
          ]}
          specRef="P10-AI-CHAMPIONSHIPS"
        />
      </div>
    </div>
  );
}
