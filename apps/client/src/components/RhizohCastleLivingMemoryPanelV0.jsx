import React, { memo, useCallback, useMemo, useState, useSyncExternalStore } from "react";
import {
  CASTLE_CHRONICLE_EVENT_V0,
  listCastleChronicleV0
} from "../rhizoh/runtime/castleChronicleV0.js";
import {
  CASTLE_IDENTITY_EVENT_V0,
  readCastleIdentityV0
} from "../rhizoh/runtime/castleIdentityV0.js";
import {
  GHOST_MEMORY_EVENT_V0,
  readGhostMemoryV0
} from "../rhizoh/runtime/ghostMemoryPersistenceV0.js";
import { listRhizohKnowledgeV0 } from "../rhizoh/runtime/rhizohKnowledgeStoreV0.js";
import { readMediaCivilizationV0 } from "../rhizoh/runtime/mediaCivilizationV0.js";
import {
  FER1_MEMORY_VAULT_EVENT_V0,
  FER1_PROTECTED_BUCKETS_V0,
  getFer1VaultStatusV0,
  sealFer1MemoryVaultV0,
  unsealFer1MemoryVaultV0
} from "../rhizoh/runtime/fer1MemoryVaultV0.js";
import {
  RHIZOH_MAP_OVERLAY_PANEL_CLASS_V0,
  RHIZOH_MAP_OVERLAY_PANEL_INSET_CLASS_V0
} from "../rhizoh/runtime/rhizohWorldMapPanelSurfaceV0.js";

function subscribeIdentity(cb) {
  if (typeof window === "undefined") return () => {};
  window.addEventListener(CASTLE_IDENTITY_EVENT_V0, cb);
  return () => window.removeEventListener(CASTLE_IDENTITY_EVENT_V0, cb);
}

function subscribeChronicle(cb) {
  if (typeof window === "undefined") return () => {};
  window.addEventListener(CASTLE_CHRONICLE_EVENT_V0, cb);
  return () => window.removeEventListener(CASTLE_CHRONICLE_EVENT_V0, cb);
}

function subscribeGhost(cb) {
  if (typeof window === "undefined") return () => {};
  window.addEventListener(GHOST_MEMORY_EVENT_V0, cb);
  return () => window.removeEventListener(GHOST_MEMORY_EVENT_V0, cb);
}

function readIdentityTick() {
  return readCastleIdentityV0()?.updatedAt || "";
}

function readChronicleTick() {
  return listCastleChronicleV0()[0]?.id || "";
}

function readGhostTick() {
  return readGhostMemoryV0()?.updatedAt || "";
}

function subscribeVault(cb) {
  if (typeof window === "undefined") return () => {};
  window.addEventListener(FER1_MEMORY_VAULT_EVENT_V0, cb);
  return () => window.removeEventListener(FER1_MEMORY_VAULT_EVENT_V0, cb);
}

function readVaultTick() {
  return getFer1VaultStatusV0().sealedAt || String(getFer1VaultStatusV0().sealed);
}

/**
 * Living Castle Memory panel — identity, chronicle timeline, ghost memory summary.
 */
export const RhizohCastleLivingMemoryPanelV0 = memo(function RhizohCastleLivingMemoryPanelV0({
  open,
  onClose,
  uiLocale = "en"
}) {
  const tr = uiLocale === "tr";
  const [passphrase, setPassphrase] = useState("");
  const [vaultStatus, setVaultStatus] = useState("");
  useSyncExternalStore(subscribeIdentity, readIdentityTick, () => "");
  const chronicleTick = useSyncExternalStore(subscribeChronicle, readChronicleTick, () => "");
  useSyncExternalStore(subscribeGhost, readGhostTick, () => "");
  const vaultTick = useSyncExternalStore(subscribeVault, readVaultTick, () => "");
  const identity = readCastleIdentityV0();
  const chronicle = useMemo(() => listCastleChronicleV0({ limit: 24 }), [chronicleTick, open, vaultTick]);
  const ghost = readGhostMemoryV0();
  const knowledgeCount = listRhizohKnowledgeV0().length;
  const mediaCiv = readMediaCivilizationV0();
  const fer1 = useMemo(() => getFer1VaultStatusV0(), [vaultTick, open]);

  const onSealVault = useCallback(async () => {
    const out = await sealFer1MemoryVaultV0(passphrase);
    setVaultStatus(
      out.ok
        ? tr
          ? "FER-1: hafıza mühürlendi (AES-GCM)."
          : "FER-1: memory sealed (AES-GCM)."
        : String(out.reason || "seal_failed")
    );
    if (out.ok) setPassphrase("");
  }, [passphrase, tr]);

  const onUnsealVault = useCallback(async () => {
    const out = await unsealFer1MemoryVaultV0(passphrase);
    setVaultStatus(
      out.ok
        ? tr
          ? `FER-1: ${out.restored} kova açıldı.`
          : `FER-1: unsealed ${out.restored} buckets.`
        : out.reason === "wrong_passphrase"
          ? tr
            ? "Parola hatalı."
            : "Wrong passphrase."
          : String(out.reason || "unseal_failed")
    );
    if (out.ok) setPassphrase("");
  }, [passphrase, tr]);

  if (!open) return null;

  return (
    <div className="pointer-events-none fixed inset-x-0 top-24 z-[29] flex justify-center px-4">
      <div
        className={`pointer-events-auto w-full max-w-lg border-cyan-400/35 p-4 ${RHIZOH_MAP_OVERLAY_PANEL_CLASS_V0}`}
        data-rhizoh-living-memory="1"
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-[9px] font-black uppercase tracking-[0.22em] text-cyan-300/70">
              {tr ? "Yaşayan Kale Hafızası" : "Living Castle Memory"}
            </p>
            <h2 className="mt-1 text-sm font-black text-cyan-100">
              {identity?.founder || (tr ? "Kale" : "Castle")}
            </h2>
            {identity?.motto ? (
              <p className="mt-1 text-[10px] italic text-white/72">"{identity.motto}"</p>
            ) : null}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-white/15 px-2 py-1 text-[10px] text-white/60 hover:text-white"
          >
            ×
          </button>
        </div>

        {identity ? (
          <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
            {[
              [tr ? "Ziyaretçi" : "Visitors", identity.visitors],
              [tr ? "Maç" : "Matches", identity.matchesPlayed],
              [tr ? "Kütüphane" : "Library", identity.libraryWingsOpened],
              [tr ? "İlk Temas" : "Contacts", identity.firstContacts]
            ].map(([label, value]) => (
              <div
                key={label}
                className={`px-2 py-2 text-center ${RHIZOH_MAP_OVERLAY_PANEL_INSET_CLASS_V0}`}
              >
                <p className="text-[8px] uppercase tracking-wider text-white/40">{label}</p>
                <p className="text-sm font-black text-cyan-200">{value ?? 0}</p>
              </div>
            ))}
          </div>
        ) : null}

        {mediaCiv ? (
          <div className="mt-3 rounded-lg border border-amber-400/20 bg-amber-500/5 px-3 py-2">
            <p className="text-[9px] font-black uppercase tracking-[0.18em] text-amber-200/80">
              {tr ? "Medya Medeniyeti" : "Media Civilization"}
            </p>
            <p className="mt-1 text-[10px] text-white/55">
              {mediaCiv.itemsArchived} {tr ? "arşiv" : "archived"} · {mediaCiv.notesWritten}{" "}
              {tr ? "not" : "notes"} · {mediaCiv.bookmarks} {tr ? "yer imi" : "bookmarks"}
            </p>
          </div>
        ) : null}

        <div className="mt-3 rounded-lg border border-emerald-400/25 bg-emerald-500/5 px-3 py-2">
          <p className="text-[9px] font-black uppercase tracking-[0.18em] text-emerald-200/85">
            FER-1 {tr ? "Hafıza Kasası" : "Memory Vault"}
          </p>
          <p className="mt-1 text-[10px] text-white/55">
            {fer1.sealed
              ? tr
                ? `Mühürlü · ${fer1.populatedBuckets} kova · ${fer1.sealedAt?.slice(0, 10) || "—"}`
                : `Sealed · ${fer1.populatedBuckets} buckets · ${fer1.sealedAt?.slice(0, 10) || "—"}`
              : tr
                ? `Açık · ${fer1.populatedBuckets}/${fer1.bucketCount} kova düz JSON`
                : `Open · ${fer1.populatedBuckets}/${fer1.bucketCount} buckets plain JSON`}
          </p>
          <p className="mt-1 text-[9px] text-white/40">
            {FER1_PROTECTED_BUCKETS_V0.map((b) => b.label).join(" · ")}
          </p>
          <input
            type="password"
            value={passphrase}
            onChange={(e) => setPassphrase(e.target.value)}
            placeholder={tr ? "Kasa parolası" : "Vault passphrase"}
            className="mt-2 w-full rounded border border-white/10 bg-black/40 px-2 py-1.5 text-[10px] text-white"
          />
          <div className="mt-2 flex gap-2">
            <button
              type="button"
              onClick={() => void onSealVault()}
              disabled={fer1.sealed}
              className="flex-1 rounded border border-emerald-400/40 px-2 py-1 text-[9px] text-emerald-100 disabled:opacity-40"
            >
              {tr ? "Mühürle" : "Seal"}
            </button>
            <button
              type="button"
              onClick={() => void onUnsealVault()}
              disabled={!fer1.sealed}
              className="flex-1 rounded border border-cyan-400/40 px-2 py-1 text-[9px] text-cyan-100 disabled:opacity-40"
            >
              {tr ? "Aç" : "Unseal"}
            </button>
          </div>
          {vaultStatus ? <p className="mt-1 text-[9px] text-white/45">{vaultStatus}</p> : null}
        </div>

        <div className="mt-4">
          <p className="text-[9px] font-black uppercase tracking-[0.18em] text-white/40">
            {tr ? "Kale Vakayiname" : "Castle Chronicle"}
          </p>
          <div className="mt-2 max-h-40 space-y-2 overflow-y-auto">
            {chronicle.length === 0 ? (
              <p className="text-[10px] text-white/45">
                {tr ? "Henüz kayıt yok." : "No chronicle entries yet."}
              </p>
            ) : (
              chronicle.map((row) => (
                <div
                  key={row.id}
                  className={`px-2 py-1.5 ${RHIZOH_MAP_OVERLAY_PANEL_INSET_CLASS_V0}`}
                >
                  <p className="text-[9px] text-white/35">{row.date}</p>
                  <p className="text-[11px] font-bold text-white/85">{row.title}</p>
                  {row.body ? <p className="text-[10px] text-white/75">{row.body}</p> : null}
                </div>
              ))
            )}
          </div>
        </div>

        {ghost ? (
          <div className="mt-4 rounded-lg border border-purple-400/20 bg-purple-500/5 px-3 py-2">
            <p className="text-[9px] font-black uppercase tracking-[0.18em] text-purple-300/70">
              Ghost · {ghost.ghostId}
            </p>
            <p className="mt-1 text-[10px] text-white/55">
              {ghost.memories?.length || 0} {tr ? "anı" : "memories"} ·{" "}
              {ghost.relationships?.length || 0} {tr ? "ilişki" : "relationships"} · {knowledgeCount}{" "}
              {tr ? "bilgi" : "knowledge"}
            </p>
          </div>
        ) : null}

        {identity?.createdAt ? (
          <p className="mt-3 text-[9px] text-white/30">
            {tr ? "Kuruluş" : "Founded"} {identity.createdAt.slice(0, 10)}
          </p>
        ) : null}
      </div>
    </div>
  );
});
