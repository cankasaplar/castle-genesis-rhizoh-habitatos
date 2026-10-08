import React from "react";
import {
  Play,
  Globe,
  GitBranch,
  FlaskConical,
  Coins,
  ShieldCheck,
  Activity,
  ArrowRight,
  Cpu,
  Binary,
  Sparkles,
  Zap,
  Clock,
  Layers,
  Award
} from "lucide-react";

export function RhizohHomeScreen({ onNavigate }) {
  return (
    <div className="space-y-16 max-w-6xl mx-auto px-4 py-8">
      {/* 1. HERO SECTION */}
      <section className="relative text-center py-16 sm:py-24 rounded-3xl overflow-hidden border border-slate-800/80 bg-gradient-to-b from-slate-900/90 via-slate-950 to-slate-950 shadow-2xl backdrop-blur-2xl">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_var(--tw-gradient-stops))] from-emerald-500/10 via-transparent to-transparent pointer-events-none" />
        
        {/* Live Badge */}
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-950/80 border border-emerald-500/30 text-emerald-400 text-xs font-mono mb-8 tracking-wider shadow-lg shadow-emerald-950/40">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
          <span>ONLINE</span>
          <span className="text-slate-600">|</span>
          <span className="text-slate-300 font-semibold">Generation 1 (E5 / A50)</span>
        </div>

        {/* Title & Slogan */}
        <h1 className="text-5xl sm:text-7xl font-extrabold tracking-tight text-white mb-4">
          RHIZOH
        </h1>
        <p className="text-lg sm:text-2xl font-mono tracking-widest text-emerald-400 uppercase font-medium mb-10">
          CONTINUITY IN MOTION
        </p>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center justify-center gap-4">
          <button
            onClick={() => onNavigate("play")}
            className="flex items-center gap-2.5 px-8 py-3.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-sm tracking-wide transition-all shadow-lg shadow-emerald-500/20 hover:shadow-emerald-500/30 hover:scale-[1.02] active:scale-[0.98]"
          >
            <Play className="w-4 h-4 fill-current" />
            PLAY RHIZOH
          </button>
          <button
            onClick={() => onNavigate("world")}
            className="flex items-center gap-2.5 px-8 py-3.5 rounded-xl bg-slate-800/90 hover:bg-slate-700/90 text-slate-100 font-semibold text-sm border border-slate-700/80 transition-all hover:scale-[1.02] active:scale-[0.98]"
          >
            <Globe className="w-4 h-4 text-sky-400" />
            WATCH LIVE
          </button>
        </div>
      </section>

      {/* 2. RHIZOH NOW (LIVE TICKER) */}
      <section className="space-y-4">
        <div className="flex items-center gap-2 text-xs font-mono text-emerald-400 uppercase tracking-widest font-semibold px-1">
          <Activity className="w-4 h-4" />
          RHIZOH NOW
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Current Game */}
          <div className="p-6 rounded-2xl border border-slate-800 bg-slate-900/60 backdrop-blur-md hover:border-slate-700/80 transition-all">
            <div className="text-xs font-mono text-slate-400 mb-2">CURRENT GAME</div>
            <div className="text-lg font-bold text-slate-100 mb-1">Human Challenge Arena</div>
            <div className="text-xs text-slate-400 leading-relaxed">
              Open public rooms with verified Move Authority and sovereign rating updates.
            </div>
            <button
              onClick={() => onNavigate("play")}
              className="mt-4 flex items-center gap-1.5 text-xs font-mono text-emerald-400 hover:text-emerald-300 font-semibold"
            >
              Open Play Room <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Current Experiment */}
          <div className="p-6 rounded-2xl border border-slate-800 bg-slate-900/60 backdrop-blur-md hover:border-slate-700/80 transition-all">
            <div className="text-xs font-mono text-sky-400 mb-2">CURRENT EXPERIMENT</div>
            <div className="text-lg font-bold text-slate-100 mb-1">M2 Diagnostic Battery</div>
            <div className="text-xs text-slate-400 leading-relaxed">
              Eval calibration & symmetry audit complete. E5 Champion A50 verified with 0.00 cp drift.
            </div>
            <button
              onClick={() => onNavigate("research")}
              className="mt-4 flex items-center gap-1.5 text-xs font-mono text-sky-400 hover:text-sky-300 font-semibold"
            >
              Inspect Research Lab <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Current Generation */}
          <div className="p-6 rounded-2xl border border-slate-800 bg-slate-900/60 backdrop-blur-md hover:border-slate-700/80 transition-all">
            <div className="text-xs font-mono text-purple-400 mb-2">CURRENT GENERATION</div>
            <div className="text-lg font-bold text-slate-100 mb-1">Gen 1: Castle Core E5</div>
            <div className="text-xs text-slate-400 leading-relaxed">
              Champion binary with A50 Golden NNUE weights. Protected by Chronicle #001.
            </div>
            <button
              onClick={() => onNavigate("evolution")}
              className="mt-4 flex items-center gap-1.5 text-xs font-mono text-purple-400 hover:text-purple-300 font-semibold"
            >
              View Lineage <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </section>

      {/* 3. CORE PILLARS GRID */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* EVOLUTION CARD */}
        <div className="p-8 rounded-3xl border border-slate-800/90 bg-gradient-to-br from-slate-900/80 to-slate-950 p-8 shadow-xl">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 rounded-xl bg-purple-950/60 border border-purple-800/50 text-purple-400">
              <GitBranch className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs font-mono text-purple-400 uppercase tracking-wider">LINEAGE & PROMOTIONS</div>
              <h3 className="text-xl font-bold text-slate-100">Evolution Continuum</h3>
            </div>
          </div>
          <p className="text-sm text-slate-300 leading-relaxed mb-6">
            E5 → R07 → Gen 2 → ... Models advance strictly via empirical SPRT gauntlets and holdout benchmarks. No subjective promotions.
          </p>
          <div className="flex items-center gap-3 text-xs font-mono text-slate-400 bg-slate-950/70 p-3 rounded-xl border border-slate-800 mb-6">
            <Award className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>Active: E5 Champion (SHA: 00ccc8c4... / A50 NNUE: 39d3d9ce...)</span>
          </div>
          <button
            onClick={() => onNavigate("evolution")}
            className="flex items-center gap-2 text-xs font-mono text-slate-200 hover:text-white font-semibold transition-colors"
          >
            Explore Evolution Graph <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* RESEARCH CARD */}
        <div className="p-8 rounded-3xl border border-slate-800/90 bg-gradient-to-br from-slate-900/80 to-slate-950 p-8 shadow-xl">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 rounded-xl bg-sky-950/60 border border-sky-800/50 text-sky-400">
              <FlaskConical className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs font-mono text-sky-400 uppercase tracking-wider">LABORATORY & PROTOCOLS</div>
              <h3 className="text-xl font-bold text-slate-100">Autonomous Research</h3>
            </div>
          </div>
          <p className="text-sm text-slate-300 leading-relaxed mb-6">
            Time-Control scaling curves, search forensics autopsies, Engine Council deliberation, and tactical puzzle candidate mining.
          </p>
          <div className="flex items-center gap-3 text-xs font-mono text-slate-400 bg-slate-950/70 p-3 rounded-xl border border-slate-800 mb-6">
            <Zap className="w-4 h-4 text-amber-400 shrink-0" />
            <span>Hypothesis H1 Under Investigation (Search Horizon vs Pruning)</span>
          </div>
          <button
            onClick={() => onNavigate("research")}
            className="flex items-center gap-2 text-xs font-mono text-slate-200 hover:text-white font-semibold transition-colors"
          >
            Enter Research Lab <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </section>

      {/* 4. SUPPORT THE CONTINUITY (P12 ECONOMY) */}
      <section className="p-8 sm:p-12 rounded-3xl border border-emerald-500/20 bg-gradient-to-b from-slate-900/90 via-slate-950 to-slate-950 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />
        
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-950/60 border border-emerald-500/30 text-emerald-400 text-xs font-mono mb-3 tracking-wider">
              <Coins className="w-3.5 h-3.5" />
              <span>PHASE 12 SOVEREIGN ECONOMY</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-100">
              Support The Continuity
            </h2>
            <p className="text-sm text-slate-400 mt-1 max-w-xl">
              An economic loop fueling compute and research. Not a generic donation button: every contribution is cryptographically bound to compute credits and research experiments.
            </p>
          </div>
          <button
            onClick={() => onNavigate("economy")}
            className="self-start md:self-center px-6 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs font-mono tracking-wider transition-all shadow-lg shadow-emerald-500/20"
          >
            EXPLORE TIERS & LEDGER
          </button>
        </div>

        {/* The Lifecycle Diagram */}
        <div className="p-5 rounded-2xl bg-slate-950/80 border border-slate-800/80">
          <div className="text-xs font-mono text-slate-400 uppercase tracking-wider mb-3">
            The Sovereign Economic Feedback Loop:
          </div>
          <div className="text-xs font-mono text-emerald-400/90 leading-relaxed overflow-x-auto whitespace-nowrap pb-2">
            SPONSOR / MEMBER → COMPUTE CREDITS → RESEARCH EXPERIMENTS → STRONGER RHIZOH → AUDIENCE → MORE COMPUTE ↺
          </div>
          <div className="text-xs text-slate-400 mt-2">
            Epistemic Axiom: Funds provide computational resources, but NEVER buy rating or dictate promotion.
          </div>
        </div>
      </section>

      {/* 5. CLOSING ETHOS */}
      <section className="text-center py-12 border-t border-slate-800/60">
        <blockquote className="text-2xl sm:text-3xl font-serif italic text-slate-300 tracking-wide mb-3">
          “Bana inanma. İzle.”
        </blockquote>
        <div className="text-xs font-mono text-slate-400 tracking-widest uppercase">
          Don't believe me. Watch. — Rhizoh Reality Axiom
        </div>
      </section>
    </div>
  );
}
