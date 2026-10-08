import React from "react";
import { Lock, AlertTriangle, ShieldCheck, Cpu, ArrowRight, Activity, Beaker } from "lucide-react";

export function ResearchStatePlaceholder({
  phaseCode = "P-LAB",
  title = "Research Pipeline",
  status = "LAB PIPELINE",
  statusType = "warning", // 'warning' | 'locked' | 'info'
  description = "This capability is under active research validation in the Rhizoh Continuum.",
  gates = [],
  specRef = null
}) {
  const getBadgeStyle = () => {
    switch (statusType) {
      case "locked":
        return "bg-rose-950/60 border-rose-500/40 text-rose-400";
      case "info":
        return "bg-sky-950/60 border-sky-500/40 text-sky-400";
      default:
        return "bg-amber-950/60 border-amber-500/40 text-amber-400";
    }
  };

  const getIcon = () => {
    switch (statusType) {
      case "locked":
        return <Lock className="w-5 h-5 text-rose-400" />;
      case "info":
        return <Beaker className="w-5 h-5 text-sky-400" />;
      default:
        return <AlertTriangle className="w-5 h-5 text-amber-400" />;
    }
  };

  return (
    <div className="relative rounded-2xl border border-slate-800 bg-gradient-to-b from-slate-900/80 to-slate-950/90 p-8 shadow-2xl backdrop-blur-xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-6 border-b border-slate-800/80">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-xl bg-slate-800/80 border border-slate-700/60">
            {getIcon()}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono tracking-wider uppercase text-emerald-400 font-semibold px-2 py-0.5 rounded bg-emerald-950/50 border border-emerald-800/50">
                {phaseCode}
              </span>
              <span className={`text-xs font-mono uppercase px-2 py-0.5 rounded border ${getBadgeStyle()}`}>
                {status}
              </span>
            </div>
            <h3 className="text-xl font-bold text-slate-100 mt-1">{title}</h3>
          </div>
        </div>
        {specRef && (
          <div className="text-xs font-mono text-slate-400 bg-slate-800/60 px-3 py-1.5 rounded-lg border border-slate-700/40">
            REF: {specRef}
          </div>
        )}
      </div>

      <p className="text-sm text-slate-300 leading-relaxed mb-6">
        {description}
      </p>

      {gates && gates.length > 0 && (
        <div className="mb-6 space-y-2">
          <div className="text-xs font-mono text-slate-400 uppercase tracking-wider">Required Gates For Production Activation:</div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {gates.map((g, idx) => (
              <div key={idx} className="flex items-center gap-2 text-xs font-mono text-slate-300 p-2.5 rounded-lg bg-slate-800/40 border border-slate-800">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span>
                <span>{g}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="rounded-xl bg-slate-950/80 border border-slate-800/90 p-4 flex items-start gap-3">
        <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
        <div className="text-xs text-slate-400 leading-normal">
          <span className="text-emerald-400 font-semibold">Epistemic Invariant:</span> Zero mock data, zero synthetic ratings. This module displays authentic telemetry once verified by the Engine Council.
        </div>
      </div>
    </div>
  );
}
