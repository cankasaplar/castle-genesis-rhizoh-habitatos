import React, { memo, useEffect, useMemo, useState } from "react";
import { buildRhizohStudioVisibilitySnapshotV0 } from "../rhizoh/runtime/rhizohStudioVisibilitySnapshotV0.js";

const STUDIO_MEMORY_TABS_V0 = Object.freeze([
  { id: "overview", labelTr: "Özet", labelEn: "Overview" },
  { id: "memory", labelTr: "Hafıza", labelEn: "Memory" },
  { id: "habitat", labelTr: "İklim", labelEn: "Climate" },
  { id: "fusion", labelTr: "Füzyon", labelEn: "Fusion" },
  { id: "learning", labelTr: "Öğrenme", labelEn: "Learning" }
]);

function readStudioVisibilitySnapshotV0() {
  if (typeof window !== "undefined" && typeof window.__rhizoh?.studioVisibility === "function") {
    return window.__rhizoh.studioVisibility();
  }
  try {
    return buildRhizohStudioVisibilitySnapshotV0();
  } catch {
    return null;
  }
}

/**
 * Studio V1 Life Memory panel — surfaces World Bridge observation layer in product UI.
 * RESEARCH-ONLY · interpretation only · no execution authority.
 */
export const RhizohStudioLifeMemoryPanelV0 = memo(function RhizohStudioLifeMemoryPanelV0({
  uiLocale = "en",
  compact = false
}) {
  const tr = uiLocale === "tr";
  const [tab, setTab] = useState("overview");
  const [snap, setSnap] = useState(() => readStudioVisibilitySnapshotV0());

  useEffect(() => {
    const tick = () => setSnap(readStudioVisibilitySnapshotV0());
    tick();
    const id = window.setInterval(tick, 4000);
    return () => window.clearInterval(id);
  }, []);

  const statusGlyph = useMemo(() => {
    if (snap?.lifeOsStatus === "ACHIEVED") return "✔";
    return "◐";
  }, [snap?.lifeOsStatus]);

  if (!snap) return null;

  return (
    <section
      className={`rounded-xl border border-violet-400/25 bg-[#0a0f1a]/95 normal-case shadow-inner ${
        compact ? "p-2" : "p-3"
      }`}
      data-testid="rhizoh-studio-life-memory-panel-v0"
    >
      <header className="mb-2 flex flex-wrap items-start justify-between gap-2">
        <div>
          <p className="text-[8px] font-black uppercase tracking-[0.22em] text-violet-200/85">
            {tr ? "Yaşam hafızası · gözlem" : "Life memory · observation"}
          </p>
          <p className="mt-0.5 text-[11px] font-semibold text-white/90">
            {statusGlyph} Life OS v0.1 · {snap.lifeOsStatus}
          </p>
          <p className="mt-1 text-[9px] leading-relaxed text-white/50">{snap.headline}</p>
        </div>
        <span className="rounded-md border border-white/10 px-2 py-0.5 text-[8px] uppercase tracking-wider text-white/40">
          {tr ? "yorum · yürütme yok" : "interpret · no exec"}
        </span>
      </header>

      <nav
        className="mb-2 flex flex-wrap gap-1 rounded-lg border border-white/10 bg-black/30 p-1"
        role="tablist"
        aria-label={tr ? "Yaşam hafızası sekmeleri" : "Life memory tabs"}
      >
        {STUDIO_MEMORY_TABS_V0.map((row) => {
          const label = tr ? row.labelTr : row.labelEn;
          const active = tab === row.id;
          return (
            <button
              key={row.id}
              type="button"
              role="tab"
              aria-selected={active}
              className={`rounded-md px-2 py-1 text-[8px] font-semibold uppercase tracking-wide transition ${
                active
                  ? "border border-violet-400/35 bg-violet-500/15 text-violet-100"
                  : "border border-transparent text-white/45 hover:text-white/75"
              }`}
              onClick={() => setTab(row.id)}
            >
              {label}
            </button>
          );
        })}
      </nav>

      <div className="max-h-[min(42vh,18rem)] overflow-y-auto text-[9px] text-white/75">
        {tab === "overview" ? (
          <div className="space-y-2">
            <Row
              label={tr ? "Takvim / medya / aktivite" : "Calendar / media / activity"}
              value={`${snap.worldBridge.calendarShadowEvents} · ${snap.worldBridge.mediaShadowEvents} · ${snap.lifeOs.worldBridge.userActivityEvents ?? 0}`}
            />
            <Row
              label={tr ? "Hafıza düğümleri" : "Memory nodes"}
              value={String(snap.worldBridge.memoryNodeCount)}
            />
            <Row
              label={tr ? "İklim etiketi" : "Climate label"}
              value={snap.habitatClimate.climateLabel || "—"}
            />
            <Row
              label={tr ? "Füzyon seq" : "Fusion seq"}
              value={String(snap.fusionTimeline.fusionSeq ?? 0)}
            />
            <Row
              label={tr ? "Akademi birliği" : "Academy union"}
              value={`${snap.academyUnion.unionLabel} · ${snap.academyUnion.totalMovesSeen} moves`}
            />
          </div>
        ) : null}

        {tab === "memory" ? (
          <div className="space-y-2">
            <p className="text-[8px] uppercase tracking-wider text-white/40">
              {tr ? "Kaynaklara göre" : "By source"}
            </p>
            <p className="font-mono text-[9px] text-violet-100/80">
              {Object.entries(snap.worldBridge.memoryBySource || {})
                .map(([k, v]) => `${k}:${v}`)
                .join(" · ") || "—"}
            </p>
            <p className="text-[8px] uppercase tracking-wider text-white/40">
              {tr ? "Son düğümler" : "Recent nodes"}
            </p>
            <ul className="space-y-1">
              {(snap.worldBridge.recentNodes || []).slice(0, 6).map((node) => (
                <li
                  key={node.id}
                  className="rounded-md border border-white/8 bg-black/25 px-2 py-1"
                >
                  <span className="text-violet-200/90">{node.source}</span>
                  <span className="text-white/35"> · </span>
                  <span>{node.title || node.branchId || "—"}</span>
                </li>
              ))}
              {(snap.worldBridge.recentNodes || []).length === 0 ? (
                <li className="text-white/40">
                  {tr ? "Henüz düğüm yok — ingest dene" : "No nodes yet — try ingest"}
                </li>
              ) : null}
            </ul>
            <Row
              label={tr ? "Gölge yazma" : "Shadow writeback"}
              value={String(snap.worldBridge.shadowProjectionCount)}
            />
          </div>
        ) : null}

        {tab === "habitat" ? (
          <div className="space-y-2">
            <Row label={tr ? "Ufuk" : "Horizon"} value={snap.habitatClimate.horizon || "—"} />
            <Row label={tr ? "İklim" : "Climate"} value={snap.habitatClimate.climateLabel || "—"} />
            <Row
              label={tr ? "Baskın dal" : "Dominant branch"}
              value={snap.habitatClimate.dominantBranch || "—"}
            />
            <Row
              label={tr ? "Day A payı" : "Day A share"}
              value={
                snap.habitatClimate.dayAShare01 != null
                  ? `${Math.round(snap.habitatClimate.dayAShare01 * 100)}%`
                  : "—"
              }
            />
            <Row
              label={tr ? "Şeritler" : "Lanes"}
              value={`cal ${snap.habitatClimate.calendarLane ? "on" : "off"} · media ${
                snap.habitatClimate.mediaLane ? "on" : "off"
              }`}
            />
          </div>
        ) : null}

        {tab === "fusion" ? (
          <div className="space-y-2">
            <Row label={tr ? "Füzyon seq" : "Fusion seq"} value={String(snap.fusionTimeline.fusionSeq ?? 0)} />
            <Row
              label={tr ? "Şeritler" : "Lanes"}
              value={`cal ${snap.fusionTimeline.calendarPresent ? "on" : "off"} · media ${
                snap.fusionTimeline.mediaPresent ? "on" : "off"
              } · activity ${snap.fusionTimeline.userActivityPresent ? "on" : "off"}`}
            />
            <p className="text-[8px] uppercase tracking-wider text-white/40">
              {tr ? "Son füzyonlar" : "Recent fusions"}
            </p>
            <ul className="space-y-1 font-mono text-[8px] text-white/55">
              {(snap.fusionTimeline.recentFusions || []).slice(0, 4).map((fus, i) => (
                <li key={`${fus.atMs}-${i}`}>
                  #{fus.fusionSeq ?? i} · seq {snap.fusionTimeline.fusionSeq}
                </li>
              ))}
              {(snap.fusionTimeline.recentFusions || []).length === 0 ? (
                <li>{tr ? "Henüz füzyon yok" : "No fusions yet"}</li>
              ) : null}
            </ul>
          </div>
        ) : null}

        {tab === "learning" ? (
          <div className="space-y-2">
            {(["chess", "go", "checkers"]).map((id) => {
              const cam = snap.learningCameras[id];
              return (
                <div
                  key={id}
                  className="rounded-md border border-white/8 bg-black/25 px-2 py-1.5"
                >
                  <p className="text-[8px] font-bold uppercase tracking-wider text-violet-200/90">
                    {id} {cam.armed ? "· live" : ""}
                  </p>
                  <p className="mt-0.5 text-white/70">
                    {tr ? "Hamle" : "Moves"}: {cam.movesSeen} · batch {cam.batchPending} · gate{" "}
                    {cam.gateAccepted}
                  </p>
                  {cam.causalSpaceId ? (
                    <p className="text-white/45">{cam.causalSpaceId}</p>
                  ) : null}
                </div>
              );
            })}
            <Row
              label={tr ? "Akademi" : "Academy"}
              value={`${snap.academyUnion.unionLabel} · ${snap.academyUnion.dominantDiscipline || "—"}`}
            />
          </div>
        ) : null}
      </div>
    </section>
  );
});

/** @param {{ label: string, value: string }} props */
function Row({ label, value }) {
  return (
    <div className="flex items-baseline justify-between gap-2 border-b border-white/5 pb-1">
      <span className="text-white/45">{label}</span>
      <span className="font-mono text-right text-violet-100/85">{value}</span>
    </div>
  );
}
