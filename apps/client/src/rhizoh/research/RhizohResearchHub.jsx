import React, { useState, useEffect } from "react";
import { ResearchStatePlaceholder } from "../shared/ResearchStatePlaceholder.jsx";
import { FlaskConical, Activity, Database, Scale, Cpu, Zap, Search, ShieldCheck } from "lucide-react";

export function RhizohResearchHub({ initialSub = "search-forensics" }) {
  const [activeSub, setActiveSub] = useState(initialSub);
  const [autopsyData, setAutopsyData] = useState(null);
  const [tcMatrix, setTcMatrix] = useState(null);

  useEffect(() => {
    fetch("/api/chess/research/forensics/historical-autopsy")
      .then((r) => r.json())
      .then((d) => d.ok && setAutopsyData(d.autopsy))
      .catch(() => {});

    fetch("/api/chess/research/tc-matrix/summary")
      .then((r) => r.json())
      .then((d) => d.ok && setTcMatrix(d))
      .catch(() => {});
  }, []);

  return (
    <div className="space-y-6">
      {/* Sub-navigation */}
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-800 pb-4">
        <button
          onClick={() => setActiveSub("search-forensics")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-mono tracking-wider transition-all ${
            activeSub === "search-forensics"
              ? "bg-sky-500/20 border border-sky-500/40 text-sky-400 font-bold"
              : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50"
          }`}
        >
          <Search className="w-3.5 h-3.5" />
          SEARCH FORENSICS (P5-D)
        </button>

        <button
          onClick={() => setActiveSub("time-controls")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-mono tracking-wider transition-all ${
            activeSub === "time-controls"
              ? "bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 font-bold"
              : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50"
          }`}
        >
          <Scale className="w-3.5 h-3.5" />
          TIME-CONTROL MATRIX (P5-C)
        </button>

        <button
          onClick={() => setActiveSub("engine-council")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-mono tracking-wider transition-all ${
            activeSub === "engine-council"
              ? "bg-purple-500/20 border border-purple-500/40 text-purple-400 font-bold"
              : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50"
          }`}
        >
          <Cpu className="w-3.5 h-3.5" />
          ENGINE COUNCIL (P5-B)
        </button>

        <button
          onClick={() => setActiveSub("datasets")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-mono tracking-wider transition-all ${
            activeSub === "datasets"
              ? "bg-amber-500/20 border border-amber-500/40 text-amber-400 font-bold"
              : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50"
          }`}
        >
          <Database className="w-3.5 h-3.5" />
          DATASETS (P4-E / P5-E)
        </button>

        <button
          onClick={() => setActiveSub("sprt")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-mono tracking-wider transition-all ${
            activeSub === "sprt"
              ? "bg-slate-700/50 border border-slate-600 text-slate-200 font-bold"
              : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50"
          }`}
        >
          <Activity className="w-3.5 h-3.5" />
          SPRT FACTORY (P5-H)
        </button>
      </div>

      {/* Sub-views */}
      {activeSub === "search-forensics" && (
        <div className="space-y-6">
          <div className="p-6 rounded-2xl border border-sky-500/30 bg-gradient-to-br from-sky-950/20 via-slate-900 to-slate-950">
            <div className="flex items-center justify-between gap-4 mb-4">
              <div>
                <span className="text-xs font-mono text-sky-400 uppercase tracking-wider font-semibold">
                  HYPOTHESIS H1 — OBSERVATIONAL CLASSIFIER
                </span>
                <h3 className="text-xl font-bold text-slate-100 mt-1">
                  Full Autopsy of 200 Official R07.4b Losses
                </h3>
              </div>
              <div className="text-xs font-mono text-amber-400 bg-amber-950/60 border border-amber-500/40 px-3 py-1.5 rounded-lg">
                CANDIDATE HYPOTHESIS ONLY
              </div>
            </div>

            <p className="text-sm text-slate-300 leading-relaxed mb-6">
              Autopsy performed over all 200 official losses in the 400-game SPRT anchor. Evidence source is observational; causal proof requires controlled search ablation (SV-1).
            </p>

            {autopsyData && (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
                <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800">
                  <div className="text-xs font-mono text-sky-400 mb-1">SEARCH HORIZON FAILURES</div>
                  <div className="text-2xl font-bold text-slate-100">
                    {autopsyData.failure_mode_breakdown?.SEARCH_HORIZON_FAILURE?.count || 90}
                    <span className="text-xs font-mono text-slate-400 font-normal ml-2">(45.0%)</span>
                  </div>
                  <div className="text-xs text-slate-400 mt-1">Blown lead & shallow collapse</div>
                </div>

                <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800">
                  <div className="text-xs font-mono text-amber-400 mb-1">EVALUATION FAILURES</div>
                  <div className="text-2xl font-bold text-slate-100">
                    {autopsyData.failure_mode_breakdown?.EVALUATION_FAILURE?.count || 71}
                    <span className="text-xs font-mono text-slate-400 font-normal ml-2">(35.5%)</span>
                  </div>
                  <div className="text-xs text-slate-400 mt-1">King safety & static erosion</div>
                </div>

                <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800">
                  <div className="text-xs font-mono text-rose-400 mb-1">TIME ALLOCATION FAILURES</div>
                  <div className="text-2xl font-bold text-slate-100">
                    {autopsyData.failure_mode_breakdown?.TIME_ALLOCATION_FAILURE?.count || 35}
                    <span className="text-xs font-mono text-slate-400 font-normal ml-2">(17.5%)</span>
                  </div>
                  <div className="text-xs text-slate-400 mt-1">Time forfeits at 400ms</div>
                </div>
              </div>
            )}

            <div className="rounded-xl bg-slate-950/90 border border-slate-800 p-4 text-xs font-mono text-slate-400 leading-normal flex items-start gap-3">
              <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <span className="text-emerald-400 font-bold">Epistemic Rule:</span> 90/200 search horizon signal is NOT causal proof. Production engine binary remains locked to E5 Champion (SHA: 00ccc8c4...).
              </div>
            </div>
          </div>
        </div>
      )}

      {activeSub === "time-controls" && (
        <div className="space-y-6">
          <div className="p-6 rounded-2xl border border-emerald-500/30 bg-slate-900/60 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-bold text-slate-100">Time-Control Scaling Matrix</h3>
              <span className="text-xs font-mono text-emerald-400 bg-emerald-950/60 px-3 py-1 rounded border border-emerald-800">
                P5-C ALTYAPISI PASS
              </span>
            </div>
            <p className="text-sm text-slate-300 leading-relaxed">
              Evaluating R07.4b vs E5 across 6 time controls (400ms, 1+0, 3+0, 3+2, 5+3, 10+0). Historical 400ms anchor is authoritatively bound to the official 400-game report.
            </p>
            {tcMatrix && tcMatrix.scaling_curve && (
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-xs font-mono space-y-2">
                <div className="text-slate-300 font-bold">Linear Regression Model:</div>
                <div className="text-slate-400">Slope (β1): {tcMatrix.scaling_curve.beta1_slope_elo_per_ln_sec} Elo/ln(sec)</div>
                <div className="text-slate-400">R²: {tcMatrix.scaling_curve.r_squared}</div>
                <div className="text-amber-400">Scientific Status: {tcMatrix.scaling_curve.scientific_claim}</div>
              </div>
            )}
          </div>
        </div>
      )}

      {activeSub === "engine-council" && (
        <div className="p-6 rounded-2xl border border-slate-800 bg-slate-900/60 space-y-4">
          <h3 className="text-xl font-bold text-slate-100">Engine Council</h3>
          <p className="text-sm text-slate-300 leading-relaxed">
            The multi-agent and human review board governing hypothesis registration, gauntlet parameters, and promotion gates.
          </p>
          <div className="text-xs font-mono text-emerald-400">Registered Experiments: 5 | Veto Power: Active</div>
        </div>
      )}

      {activeSub === "datasets" && (
        <div className="p-6 rounded-2xl border border-slate-800 bg-slate-900/60 space-y-4">
          <h3 className="text-xl font-bold text-slate-100">Research Datasets & Corpora</h3>
          <p className="text-sm text-slate-300 leading-relaxed">
            P4-E Human interaction tactical candidates, WAC-30 holdout suite, and 400-game official SPRT PGN corpus.
          </p>
          <div className="text-xs font-mono text-slate-400">Holdout Leakage Guard: Veto Active (WAC-30 isolated)</div>
        </div>
      )}

      {activeSub === "sprt" && (
        <ResearchStatePlaceholder
          phaseCode="P5-H"
          title="SPRT / Promotion Factory"
          status="PILOT HARNESS READY"
          statusType="info"
          description="Automated sequential probability ratio testing (SPRT) running paired openings with cutechess-cli."
          gates={[
            "Cutechess-cli harness validation",
            "Paired openings anchor (50 openings x 2 colors)",
            "Hardware & scheduling jitter guard (timemargin=200)"
          ]}
          specRef="P5-H-SPRT-FACTORY"
        />
      )}
    </div>
  );
}
