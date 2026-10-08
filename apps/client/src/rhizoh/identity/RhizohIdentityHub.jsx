import React from "react";
import RhizohPlayerProfile from "../ingress/RhizohPlayerProfile.jsx";
import { User, ShieldCheck } from "lucide-react";

export function RhizohIdentityHub() {
  return (
    <div className="space-y-6">
      <div className="border-b border-slate-800 pb-6">
        <div className="flex items-center gap-2 text-xs font-mono text-emerald-400 uppercase tracking-wider mb-2">
          <User className="w-4 h-4" />
          <span>PHASES 0–2 — PLAYER IDENTITY & PRIVACY CONTROLS</span>
        </div>
        <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-100">
          Player Profile & Authority
        </h2>
        <p className="text-sm text-slate-400 mt-1 max-w-2xl">
          Manage your pseudonym, established rating, and privacy preferences. Rating is computed deterministically from the Event Ledger.
        </p>
      </div>

      <div>
        <RhizohPlayerProfile />
      </div>
    </div>
  );
}
