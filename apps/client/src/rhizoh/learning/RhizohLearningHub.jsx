import React from "react";
import { ResearchStatePlaceholder } from "../shared/ResearchStatePlaceholder.jsx";
import { GraduationCap, ShieldCheck, Database, Filter, Cpu } from "lucide-react";

export function RhizohLearningHub() {
  return (
    <div className="space-y-6">
      <div className="border-b border-slate-800 pb-6">
        <div className="flex items-center gap-2 text-xs font-mono text-emerald-400 uppercase tracking-wider mb-2">
          <GraduationCap className="w-4 h-4" />
          <span>PHASE 6 — COMMUNITY CONTRIBUTIONS & BOUNDED LEARNING</span>
        </div>
        <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-100">
          Learning Continuum
        </h2>
        <p className="text-sm text-slate-400 mt-1 max-w-2xl">
          Community games, puzzle attempts, and submitted tactical lines are mined for learning candidates. Production model weights remain protected by strict quality filters.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="p-6 rounded-2xl border border-slate-800 bg-slate-900/60 space-y-4">
          <div className="flex items-center gap-2 text-xs font-mono text-emerald-400 uppercase">
            <Filter className="w-4 h-4" />
            <span>QUALITY FILTERING PIPELINE</span>
          </div>
          <h3 className="text-lg font-bold text-slate-100">Candidate Mining</h3>
          <p className="text-xs text-slate-300 leading-relaxed">
            Every human game or puzzle attempt is evaluated. Only positions exhibiting severe tactical swings (&ge;150 cp) and verified single-solution lines are admitted as research candidates.
          </p>
          <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs font-mono text-slate-400">
            Epistemic Axiom: Premium users cannot pay to inject data into the model. All data must pass P4-E/P5 quality filters.
          </div>
        </div>

        <ResearchStatePlaceholder
          phaseCode="P6-TRAIN"
          title="Bounded Delta Training"
          status="LAB PIPELINE"
          statusType="info"
          description="Constrained HalfKP NNUE training on candidate tactical corpora with strict weight clamping to prevent catastrophic forgetting."
          gates={[
            "Holdout leakage verification (WAC-30 = 0)",
            "Search-control eval drift <= 10.0 cp",
            "SPRT Stage A (50 games) & Stage B (200 games)"
          ]}
          specRef="P6-BOUNDED-LEARNING"
        />
      </div>
    </div>
  );
}
