import React, { memo, useMemo, useSyncExternalStore } from "react";
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

/**
 * Living Castle Memory panel — identity, chronicle timeline, ghost memory summary.
 */
export const RhizohCastleLivingMemoryPanelV0 = memo(function RhizohCastleLivingMemoryPanelV0({
  open,
  onClose,
  uiLocale = "en"
}) {
  const tr = uiLocale === "tr";
  useSyncExternalStore(subscribeIdentity, readIdentityTick, () => "");
  const chronicleTick = useSyncExternalStore(subscribeChronicle, readChronicleTick, () => "");
  useSyncExternalStore(subscribeGhost, readGhostTick, () => "");
  const identity = readCastleIdentityV0();
  const chronicle = useMemo(() => listCastleChronicleV0({ limit: 24 }), [chronicleTick, open]);
  const ghost = readGhostMemoryV0();
  const knowledgeCount = listRhizohKnowledgeV0().length;

  if (!open) return null;

  return (
    <div className="pointer-events-none fixed inset-x-0 top-24 z-[29] flex justify-center px-4">
      <div
        className="pointer-events-auto w-full max-w-lg rounded-2xl border border-cyan-400/30 bg-black/88 p-4 text-white shadow-2xl backdrop-blur-md"
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
              <p className="mt-1 text-[10px] italic text-white/50">"{identity.motto}"</p>
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
                className="rounded-lg border border-white/10 bg-white/[0.03] px-2 py-2 text-center"
              >
                <p className="text-[8px] uppercase tracking-wider text-white/40">{label}</p>
                <p className="text-sm font-black text-cyan-200">{value ?? 0}</p>
              </div>
            ))}
          </div>
        ) : null}

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
                  className="rounded-lg border border-white/8 bg-white/[0.02] px-2 py-1.5"
                >
                  <p className="text-[9px] text-white/35">{row.date}</p>
                  <p className="text-[11px] font-bold text-white/85">{row.title}</p>
                  {row.body ? <p className="text-[10px] text-white/50">{row.body}</p> : null}
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
