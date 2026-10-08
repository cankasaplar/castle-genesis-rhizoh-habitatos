import React from "react";
import { ResearchStatePlaceholder } from "../shared/ResearchStatePlaceholder.jsx";
import { Film, Youtube, Share2, Sparkles } from "lucide-react";

export function RhizohStoryHub() {
  return (
    <div className="space-y-6">
      <div className="border-b border-slate-800 pb-6">
        <div className="flex items-center gap-2 text-xs font-mono text-purple-400 uppercase tracking-wider mb-2">
          <Film className="w-4 h-4" />
          <span>PHASE 11 — AUTONOMOUS STORYTELLING ENGINE</span>
        </div>
        <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-100">
          Rhizoh Story Studio
        </h2>
        <p className="text-sm text-slate-400 mt-1 max-w-2xl">
          Transforming remarkable tactical swings, tournament triumphs, and forensic autopsies into engaging video episodes, YouTube broadcasts, and educational shorts.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <ResearchStatePlaceholder
          phaseCode="P11-A"
          title="Tactical Swing Episode Generator"
          status="LAB PIPELINE"
          statusType="info"
          description="Automated narrative extraction: discovers key blunders, brilliancies, and dramatic evaluation swings from official games."
          gates={[
            "Tactical swing threshold detector",
            "Evaluation graph curve generator",
            "Automated narration transcript writer"
          ]}
          specRef="P11-STORY-ENGINE"
        />

        <ResearchStatePlaceholder
          phaseCode="P11-B"
          title="YouTube & Shorts Auto-Publisher"
          status="PLANNED"
          statusType="locked"
          description="Direct publisher bridge to YouTube Channel with verified game provenance in description and chapter markers."
          gates={[
            "Video render pipeline validation",
            "YouTube API publisher authorization",
            "Chronicle reference binding"
          ]}
          specRef="P11-YOUTUBE-BRIDGE"
        />
      </div>
    </div>
  );
}
