import React from "react";
import { CastleAccountBadge } from "../../auth/CastleAuthOverlay";

/** Phase P1 shell destination — Phase P2 expands: avatar, pet, companion, inventory, vault. */
export function ProductProfilePanel({ auth = null }) {
  return (
    <div className="space-y-4 rounded-xl border border-indigo-400/25 bg-indigo-950/20 p-3">
      <div className="text-[9px] font-black tracking-[0.28em] text-indigo-200/90">PROFILE</div>
      <p className="text-[10px] leading-relaxed text-white/70 normal-case">
        Identity layer (Phase P2): avatar creator, pet creator, Rhizoh companion profile, inventory, memory vault.
      </p>
      <div className="rounded-lg border border-white/10 bg-black/25 p-2">
        <CastleAccountBadge auth={auth} />
      </div>
    </div>
  );
}
