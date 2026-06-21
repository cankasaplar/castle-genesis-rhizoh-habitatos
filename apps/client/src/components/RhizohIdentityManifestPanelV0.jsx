import React, { memo, useMemo } from "react";
import { projectIdentityManifestV0 } from "../rhizoh/runtime/identityManifestProjectionV0.js";

/**
 * Read-only identity manifest projection (Phase 1) — Salon observation drawer.
 * @param {{ tick?: number }} props
 */
export const RhizohIdentityManifestPanelV0 = memo(function RhizohIdentityManifestPanelV0({
  tick = 0
}) {
  void tick;
  const manifest = useMemo(() => {
    try {
      return projectIdentityManifestV0();
    } catch {
      return null;
    }
  }, [tick]);

  if (!manifest) return null;

  const causal = manifest.causalSummary || {};
  const pipeline = manifest.identityPipeline || {};
  const subject = manifest.epistemicSubject;

  return (
    <div
      className="space-y-2 rounded-xl border border-violet-400/25 bg-violet-950/15 p-3"
      data-rhizoh-identity-manifest-panel="1"
    >
      <div className="flex items-center justify-between gap-2">
        <p className="text-[9px] font-black tracking-[0.22em] text-violet-200/95">
          IDENTITY MANIFEST
        </p>
        <span className="rounded-full border border-violet-300/30 px-2 py-0.5 text-[7px] uppercase tracking-wide text-violet-100/80">
          read-only
        </span>
      </div>
      <p className="text-[8px] text-violet-100/65 normal-case">
        Derived projection · Observation ≠ Execution · no event SSOT writes
      </p>
      <div className="grid grid-cols-2 gap-1.5 text-[9px] normal-case">
        <Metric label="Subject" value={manifest.subjectId || "unbound"} />
        <Metric label="Phase" value={manifest.phase || "—"} />
        <Metric label="Causal nodes" value={String(causal.nodeCount ?? "—")} />
        <Metric label="Causal edges" value={String(causal.edgeCount ?? "—")} />
        <Metric label="Chess anchors" value={String(causal.chessAnchors?.length ?? 0)} />
        <Metric label="Event log" value={String(pipeline.eventLogCount ?? 0)} />
        <Metric label="Turn count" value={String(pipeline.lifecycleTurnCount ?? 0)} />
        <Metric
          label="Pipeline"
          value={pipeline.eventPipelineWired ? "voice/turn" : "not wired"}
        />
      </div>
      {subject?.epistemicIdentityId ? (
        <p className="text-[8px] text-white/45 normal-case font-mono truncate">
          {subject.epistemicIdentityId} · repro={subject.reproConsistent ? "ok" : "drift"}
        </p>
      ) : (
        <p className="text-[8px] text-white/40 normal-case">
          Run{" "}
          <code className="text-violet-200/80">await __rhizoh.epistemicAuditBundle.run()</code> for
          epi_id handle.
        </p>
      )}
      <p className="text-[8px] text-white/35 normal-case">{pipeline.pipelineNote}</p>
    </div>
  );
});

/** @param {{ label: string, value: string }} props */
function Metric({ label, value }) {
  return (
    <div className="rounded-md border border-white/10 bg-black/25 px-2 py-1.5">
      <div className="text-[8px] text-white/45">{label}</div>
      <div className="text-[9px] text-white/85 truncate">{value}</div>
    </div>
  );
}
