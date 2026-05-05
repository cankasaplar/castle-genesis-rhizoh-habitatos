import React, { useMemo, useState } from "react";
import { CastleAccountBadge } from "../../auth/CastleAuthOverlay";
import { defaultIdentityGraph } from "../store/initialState";

/** Phase P1 shell destination — Phase P2 expands: avatar, pet, companion, inventory, vault. */
export function ProductProfilePanel({ auth = null }) {
  const [tab, setTab] = useState("identity");
  const owner = String(auth?.user?.uid || "guest");
  const graph = useMemo(() => defaultIdentityGraph(owner), [owner]);
  const tabs = [
    { id: "identity", label: "Identity" },
    { id: "avatar", label: "Avatar" },
    { id: "companion", label: "Companion" },
    { id: "pet", label: "Ghost Pet" },
    { id: "inventory", label: "Inventory" },
    { id: "vault", label: "Vault" },
    { id: "journal", label: "Journal" }
  ];
  return (
    <div className="space-y-4 rounded-xl border border-indigo-400/25 bg-indigo-950/20 p-3">
      <div className="text-[9px] font-black tracking-[0.28em] text-indigo-200/90">PROFILE</div>
      <p className="text-[10px] leading-relaxed text-white/70 normal-case">
        Phase P2 scaffold: Identity OS with one graph registry for avatar, companion, ghost pet, inventory, vault, journal.
      </p>
      <div className="grid grid-cols-3 gap-1">
        {tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={`rounded-md border px-2 py-1 text-[9px] normal-case ${
              tab === t.id ? "border-cyan-300/50 bg-cyan-400/15 text-cyan-100" : "border-white/10 text-white/55"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>
      {tab === "identity" ? (
        <div className="rounded-lg border border-white/10 bg-black/20 p-2 text-[10px] text-white/75 normal-case">
          <div>User: {graph.root.userUid}</div>
          <div>Avatar: {graph.root.avatarUid}</div>
          <div>Companion: {graph.root.companionUid}</div>
          <div>Ghost Pet: {graph.root.ghostPetUid}</div>
          <div>Signature: {graph.signature.publicCard}</div>
        </div>
      ) : null}
      {tab === "avatar" ? <div className="text-[10px] text-white/75 normal-case">Body {graph.avatar.bodyArchetype} · Motion {graph.avatar.motionStyle} · Aura {graph.avatar.aura}</div> : null}
      {tab === "companion" ? <div className="text-[10px] text-white/75 normal-case">{graph.companion.name} · {graph.companion.archetype} · {graph.companion.tone}</div> : null}
      {tab === "pet" ? <div className="text-[10px] text-white/75 normal-case">{graph.ghostPet.species} · {graph.ghostPet.temperament} · bond {graph.ghostPet.bondLevel.toFixed(2)}</div> : null}
      {tab === "inventory" ? <div className="text-[10px] text-white/75 normal-case">Tools {graph.inventory.tools.length} · Artifacts {graph.inventory.artifacts.length} · Keys {graph.inventory.keys.length}</div> : null}
      {tab === "vault" ? <div className="text-[10px] text-white/75 normal-case">Unlocks {graph.vault.permanentUnlocks.length} · Licenses {graph.vault.creatorLicenses.length}</div> : null}
      {tab === "journal" ? <div className="text-[10px] text-white/75 normal-case">Milestones {graph.journal.milestones.join(", ") || "—"}</div> : null}
      <div className="rounded-lg border border-white/10 bg-black/25 p-2">
        <CastleAccountBadge auth={auth} />
      </div>
    </div>
  );
}
