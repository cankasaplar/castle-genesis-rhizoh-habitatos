import React, { useState, useEffect } from "react";
import { GitBranch, Award, Layers, Cpu, ShieldCheck, Activity, CheckCircle2 } from "lucide-react";

export function RhizohEvolutionHub() {
  const [generations, setGenerations] = useState([]);
  const [promotions, setPromotions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch("/api/evolution/generations").then((r) => r.json()),
      fetch("/api/evolution/promotions").then((r) => r.json())
    ]).then(([genRes, promRes]) => {
      if (genRes.ok) setGenerations(genRes.generations || []);
      if (promRes.ok) setPromotions(promRes.promotions || []);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="border-b border-slate-800 pb-6">
        <div className="flex items-center gap-2 text-xs font-mono text-purple-400 uppercase tracking-wider mb-2">
          <GitBranch className="w-4 h-4" />
          <span>PHASE 7 — ENGINE & MODEL LINEAGE</span>
        </div>
        <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-100">
          Evolution Continuum
        </h2>
        <p className="text-sm text-slate-400 mt-1 max-w-2xl">
          Complete lineage of engine binaries, NNUE evaluation weights, and verified promotions. Every generation is pinned by a Reality Seal.
        </p>
      </div>

      {/* Generations Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {generations.map((gen) => (
          <div
            key={gen.generation_id}
            className={`p-6 rounded-2xl border transition-all ${
              gen.active_in_prod
                ? "border-emerald-500/50 bg-gradient-to-br from-emerald-950/20 via-slate-900 to-slate-950 shadow-xl shadow-emerald-950/20"
                : "border-slate-800 bg-slate-900/60"
            }`}
          >
            <div className="flex items-center justify-between gap-4 mb-3">
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono font-bold text-slate-300 px-2 py-0.5 rounded bg-slate-800 border border-slate-700">
                  {gen.generation_id}
                </span>
                <span className={`text-xs font-mono px-2 py-0.5 rounded border ${
                  gen.active_in_prod
                    ? "bg-emerald-950/60 border-emerald-500/40 text-emerald-400 font-semibold"
                    : "bg-slate-800/40 border-slate-700 text-slate-400"
                }`}>
                  {gen.status}
                </span>
              </div>
              {gen.active_in_prod && (
                <div className="flex items-center gap-1.5 text-xs font-mono text-emerald-400">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>ACTIVE IN PROD</span>
                </div>
              )}
            </div>

            <h3 className="text-lg font-bold text-slate-100 mb-2">{gen.name}</h3>
            <p className="text-xs text-slate-300 leading-relaxed mb-4">{gen.description}</p>

            {gen.engine_sha && (
              <div className="space-y-1.5 text-xs font-mono bg-slate-950/80 p-3 rounded-xl border border-slate-800">
                <div className="text-slate-400">Engine SHA: <span className="text-slate-200">{gen.engine_sha.slice(0, 16)}...</span></div>
                <div className="text-slate-400">NNUE Model: <span className="text-emerald-400 font-semibold">{gen.nnue_model}</span></div>
                <div className="text-slate-400">Chronicle: <span className="text-purple-400">{gen.chronicle_binding}</span></div>
              </div>
            )}

            {gen.candidates && (
              <div className="mt-4 pt-4 border-t border-slate-800/80">
                <div className="text-xs font-mono text-slate-400 uppercase mb-2">Lab Candidates Under Evaluation:</div>
                {gen.candidates.map((c) => (
                  <div key={c.candidate_id} className="p-3 rounded-xl bg-slate-950/50 border border-slate-800 text-xs font-mono space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-sky-400">{c.candidate_id}</span>
                      <span className="text-amber-400">{c.sprt_verdict}</span>
                    </div>
                    <div className="text-slate-400">400ms Anchor: {c.historical_anchor_400ms.games} games, {c.historical_anchor_400ms.elo} Elo</div>
                    <div className="text-slate-400">{c.forensic_autopsy}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Promotion History Table */}
      <div className="p-6 rounded-2xl border border-slate-800 bg-slate-900/60 space-y-4">
        <div className="flex items-center gap-2 text-xs font-mono text-slate-400 uppercase tracking-wider">
          <Award className="w-4 h-4 text-emerald-400" />
          <span>OFFICIAL PROMOTION HISTORY</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400">
                <th className="pb-3">PROMOTION ID</th>
                <th className="pb-3">GENERATION</th>
                <th className="pb-3">PROMOTED MODEL</th>
                <th className="pb-3">BASELINE</th>
                <th className="pb-3">SPRT GAMES</th>
                <th className="pb-3">STATUS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {promotions.map((p) => (
                <tr key={p.promotion_id} className="text-slate-300">
                  <td className="py-3 font-semibold text-emerald-400">{p.promotion_id}</td>
                  <td className="py-3">{p.generation}</td>
                  <td className="py-3 font-bold text-slate-100">{p.promoted_model}</td>
                  <td className="py-3 text-slate-400">{p.baseline}</td>
                  <td className="py-3">{p.sprt_games}</td>
                  <td className="py-3">
                    <span className="px-2 py-0.5 rounded bg-emerald-950/60 border border-emerald-800 text-emerald-400 text-xs">
                      {p.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
