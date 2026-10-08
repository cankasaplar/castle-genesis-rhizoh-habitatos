import React from "react";
import { Shield, BookOpen, Layers, CheckCircle2 } from "lucide-react";

export function RhizohAboutHub() {
  return (
    <div className="space-y-12 max-w-4xl mx-auto">
      <div className="border-b border-slate-800 pb-6">
        <div className="flex items-center gap-2 text-xs font-mono text-emerald-400 uppercase tracking-wider mb-2">
          <Shield className="w-4 h-4" />
          <span>THE SOVEREIGN REALITY ARCHITECTURE</span>
        </div>
        <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-100">
          Philosophy & Invariants
        </h2>
      </div>

      <div className="space-y-8 text-sm text-slate-300 leading-relaxed font-sans">
        <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-3">
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-400" />
            1. Client Intent, Server Reality
          </h3>
          <p>
            The client sends user moves or puzzle attempts as raw intents. Only the server authority verifies legality, executes the move, updates clocks, records the PGN, and writes to the immutable Event Ledger.
          </p>
        </div>

        <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-3">
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-400" />
            2. Observation ≠ Causal Proof
          </h3>
          <p>
            Observational telemetry (such as the 90/200 search horizon signal in R07.4b losses) produces candidate hypotheses ($H_1$). It does not mutate the production champion until validated by controlled search ablation under SPRT.
          </p>
        </div>

        <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-3">
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-400" />
            3. Economy as a Compute Loop, Never Pay-To-Win
          </h3>
          <p>
            Phase 12 Economy directly links sponsors and members to compute hours and research experiments. Sponsoring can fund an ablation gauntlet, but cannot buy Elo or dictate model promotion.
          </p>
        </div>

        <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-3">
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-400" />
            4. Reality Seal & Epistemic Invariants
          </h3>
          <p>
            Generation 1 Champion (Castle Core v1.0.2 E5 + A50 Golden NNUE) and Chronicle #001 remain sealed. The WAC-30 suite remains strictly quarantined from training pipelines.
          </p>
        </div>
      </div>
    </div>
  );
}
