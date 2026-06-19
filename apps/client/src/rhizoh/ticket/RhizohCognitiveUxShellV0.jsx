import React, { memo, useCallback, useEffect, useMemo, useState } from "react";
import {
  COGNITIVE_UX_SPACE_TRAVERSAL_EVENT_V0,
  COGNITIVE_UX_TRAVERSAL_EVENT_V0,
  buildCognitiveUxSnapshotV0,
  isCognitiveUxEnabledV0,
  onUserTraverseSpaceV0,
  onUserTraverseV0
} from "./cognitiveUxLayerV0.js";
import { EPISTEMIC_UI_EVENT_V0 } from "./cognitiveVisualizationBindingV0.js";
import { MUTATION_REASON_CATEGORY_V1 } from "./mutationReasonCodeOntologyV1.js";
import { CAUSAL_SPACE_ID_V0 } from "../runtime/sportsCausalSpaceV0.js";
import { SPORTS_EVENT_V0 } from "../runtime/sportsEventAdapterV0.js";

/**
 * Epistemic UX shell — 4 mandatory panels (CNR-01 / UI-01).
 * gezer · görür · onaylar
 */
export const RhizohCognitiveUxShellV0 = memo(function RhizohCognitiveUxShellV0({
  collapsed: collapsedProp,
  onCollapsedChange
}) {
  const [collapsed, setCollapsed] = useState(collapsedProp ?? false);
  const [tick, setTick] = useState(0);
  const [traversal, setTraversal] = useState(/** @type {object | null} */ (null));
  const [activeSpace, setActiveSpace] = useState(CAUSAL_SPACE_ID_V0.CHESS);

  const bump = useCallback(() => setTick((n) => n + 1), []);

  useEffect(() => {
    const onTraversal = (ev) => {
      setTraversal(ev?.detail || null);
      bump();
    };
    window.addEventListener(COGNITIVE_UX_TRAVERSAL_EVENT_V0, onTraversal);
    window.addEventListener(COGNITIVE_UX_SPACE_TRAVERSAL_EVENT_V0, onTraversal);
    window.addEventListener(EPISTEMIC_UI_EVENT_V0, bump);
    window.addEventListener(SPORTS_EVENT_V0, bump);
    return () => {
      window.removeEventListener(COGNITIVE_UX_TRAVERSAL_EVENT_V0, onTraversal);
      window.removeEventListener(COGNITIVE_UX_SPACE_TRAVERSAL_EVENT_V0, onTraversal);
      window.removeEventListener(EPISTEMIC_UI_EVENT_V0, bump);
      window.removeEventListener(SPORTS_EVENT_V0, bump);
    };
  }, [bump]);

  const snapshot = useMemo(() => {
    void tick;
    try {
      return buildCognitiveUxSnapshotV0();
    } catch {
      return null;
    }
  }, [tick]);

  const cux = snapshot?.cux;
  const binding = cux?.binding;
  const viewport = cux?.viewport;
  const chessViewport = viewport?.chess?.viewport || viewport;
  const sportsViewport = viewport?.sports?.viewport;
  const authority = binding?.pull;

  const handleTraverseSpace = useCallback(
    (spaceId, nodeId) => {
      const packet = onUserTraverseSpaceV0({
        spaceId,
        nodeId,
        matchId: nodeId,
        lineageDepth: 50
      });
      setTraversal(packet);
    },
    []
  );

  const setCollapsedState = (next) => {
    setCollapsed(next);
    onCollapsedChange?.(next);
  };

  if (collapsed) {
    return (
      <button
        type="button"
        className="pointer-events-auto fixed right-2 bottom-[4.5rem] z-[295] rounded-lg border border-violet-400/40 bg-black/85 px-2 py-1 text-[8px] font-bold uppercase tracking-wide text-violet-200/90"
        onClick={() => setCollapsedState(false)}
        data-rhizoh-cux="collapsed"
      >
        CUX
      </button>
    );
  }

  return (
    <div
      className="pointer-events-auto fixed right-2 bottom-[4.5rem] z-[295] w-[min(100vw-1rem,24rem)] max-h-[52vh] overflow-hidden rounded-xl border border-violet-400/35 bg-[#06040f]/95 shadow-xl backdrop-blur-md"
      data-rhizoh-cux="shell"
    >
      <header className="flex items-center justify-between border-b border-violet-400/25 px-2 py-1.5">
        <span className="text-[8px] font-black uppercase tracking-[0.2em] text-violet-200">
          Epistemic UX
        </span>
        <button
          type="button"
          className="text-[8px] text-white/50 hover:text-white"
          onClick={() => setCollapsedState(true)}
        >
          −
        </button>
      </header>

      <div className="max-h-[48vh] overflow-y-auto p-2 space-y-2 text-[9px] normal-case text-white/80 no-scrollbar">
        <div className="flex gap-1 mb-1">
          {[CAUSAL_SPACE_ID_V0.CHESS, CAUSAL_SPACE_ID_V0.SPORTS].map((sid) => (
            <button
              key={sid}
              type="button"
              className={`rounded px-1.5 py-0.5 text-[7px] uppercase tracking-wide border ${
                activeSpace === sid
                  ? "border-violet-300/60 text-violet-100 bg-violet-950/40"
                  : "border-white/15 text-white/50"
              }`}
              onClick={() => {
                setActiveSpace(sid);
                handleTraverseSpace(sid, sid === CAUSAL_SPACE_ID_V0.SPORTS ? "demo_match" : "SC");
              }}
            >
              {sid.split(".")[0]}
            </button>
          ))}
        </div>

        <Panel title="Drift Space" subtitle="görür · suggest-only" tone="drift">
          {activeSpace === CAUSAL_SPACE_ID_V0.SPORTS ? (
            <SportsStochasticPanel
              viewport={sportsViewport}
              onTraverse={(id) => handleTraverseSpace(CAUSAL_SPACE_ID_V0.SPORTS, id)}
            />
          ) : (
            <>
              <DriftFieldPanel
                viewport={chessViewport?.driftField}
                onTraverse={(id) => onUserTraverseV0({ nodeId: id, pipeline: snapshot?.pipeline })}
              />
              <ScSpikePanel
                viewport={chessViewport?.scSpike}
                onTraverse={(id) => onUserTraverseV0({ nodeId: id, pipeline: snapshot?.pipeline })}
              />
            </>
          )}
        </Panel>

        <Panel title="REC Temporal" subtitle="memory waveform" tone="rec">
          <RecWaveformPanel
            viewport={chessViewport?.recWaveform}
            onTraverse={(id) => onUserTraverseV0({ nodeId: id, pipeline: snapshot?.pipeline })}
          />
        </Panel>

        <Panel title="CAL Traversal" subtitle="gezer · space-aware" tone="cal">
          <TraversalPanel
            traversal={traversal}
            activeSpace={activeSpace}
            onTraverseSpace={handleTraverseSpace}
          />
        </Panel>

        <Panel title="Authority Gate" subtitle="onaylar · mutation locked" tone="authority">
          <AuthorityPanel authority={authority} commitStatus={authority?.commitStatus} />
        </Panel>
      </div>
    </div>
  );
});

/** @param {{ children?: React.ReactNode }} props */
export function RhizohCognitiveUxMountV0({ children }) {
  const [enabled, setEnabled] = useState(() => isCognitiveUxEnabledV0());

  useEffect(() => {
    const id = window.setInterval(() => setEnabled(isCognitiveUxEnabledV0()), 2000);
    return () => window.clearInterval(id);
  }, []);

  if (!enabled) return children ?? null;
  return (
    <>
      {children}
      <RhizohCognitiveUxShellV0 />
    </>
  );
}

/** @param {{ title: string, subtitle: string, tone: string, children: React.ReactNode }} props */
function Panel({ title, subtitle, tone, children }) {
  const border =
    tone === "authority"
      ? "border-cyan-400/30"
      : tone === "cal"
        ? "border-fuchsia-400/30"
        : tone === "rec"
          ? "border-violet-400/30"
          : "border-amber-400/30";

  return (
    <section className={`rounded-lg border ${border} bg-black/30 p-2`} data-rhizoh-cux-panel={tone}>
      <div className="mb-1.5">
        <div className="text-[8px] font-black uppercase tracking-[0.15em] text-white/90">{title}</div>
        <div className="text-[7px] text-white/45">{subtitle}</div>
      </div>
      {children}
    </section>
  );
}

/** @param {{ viewport?: object, onTraverse: (id: string) => void }} props */
function DriftFieldPanel({ viewport, onTraverse }) {
  const layers = viewport?.layers || [];
  if (!layers.length) {
    return <p className="text-[8px] text-white/40">No drift field layers</p>;
  }

  return (
    <div className="space-y-1">
      {layers.map((layer) => (
        <button
          key={layer.category}
          type="button"
          className="flex w-full items-center gap-2 rounded border border-white/10 bg-black/20 px-1.5 py-1 hover:border-amber-400/35"
          onClick={() => onTraverse(`category:${layer.category}`)}
        >
          <SvgGlyph projected={layer} size={36} />
          <span className="text-[8px] text-white/70 truncate">
            {layer.category} · {(layer.intensity01 * 100).toFixed(0)}%
          </span>
        </button>
      ))}
    </div>
  );
}

/** @param {{ viewport?: object, onTraverse: (id: string) => void }} props */
function ScSpikePanel({ viewport, onTraverse }) {
  if (viewport?.empty) return null;
  return (
    <button
      type="button"
      className="mt-1 flex w-full items-center gap-2 rounded border border-amber-400/25 bg-amber-950/20 px-1.5 py-1"
      onClick={() => onTraverse(`category:${MUTATION_REASON_CATEGORY_V1.SC}`)}
    >
      <SvgGlyph projected={viewport?.layer} size={32} />
      <span className="text-[8px] text-amber-100/80">SC field distortion</span>
    </button>
  );
}

/** @param {{ viewport?: object, onTraverse: (id: string) => void }} props */
function RecWaveformPanel({ viewport, onTraverse }) {
  const wf = viewport?.waveform;
  const epochId = viewport?.epochId || "rec_soft";
  return (
    <button
      type="button"
      className="w-full rounded border border-violet-400/25 bg-violet-950/20 p-1"
      onClick={() => onTraverse(`rec:${epochId}`)}
    >
      <SvgGlyph projected={wf} size={80} className="w-full" />
      <div className="mt-1 flex justify-between text-[7px] text-violet-100/70">
        <span>{epochId}</span>
        <span>{viewport?.localTimeAnchor || "—"}</span>
        <span>pending {viewport?.pendingCompressionCount ?? 0}</span>
      </div>
    </button>
  );
}

/** @param {{ viewport?: object, onTraverse: (id: string) => void }} props */
function SportsStochasticPanel({ viewport, onTraverse }) {
  const layers = viewport?.layers || [];
  if (!layers.length) {
    return (
      <button
        type="button"
        className="text-[8px] text-violet-200/80 underline"
        onClick={() => onTraverse("demo_match")}
      >
        Open sports.causal.space (demo_match)
      </button>
    );
  }
  return (
    <div className="space-y-1">
      {layers.map((layer) => (
        <button
          key={layer.category}
          type="button"
          className="flex w-full items-center gap-2 rounded border border-violet-400/25 bg-violet-950/20 px-1.5 py-1"
          onClick={() => onTraverse(`category:${layer.category}`)}
        >
          <SvgGlyph projected={layer} size={32} />
          <span className="text-[8px] text-violet-100/80 truncate">
            {layer.category} · stochastic
          </span>
        </button>
      ))}
    </div>
  );
}

/** @param {{ traversal?: object | null, activeSpace: string, onTraverseSpace: (spaceId: string, nodeId: string) => void }} props */
function TraversalPanel({ traversal, activeSpace, onTraverseSpace }) {
  const ex = traversal?.exploration;
  const lineage = ex?.ticketLineage || ex?.sportsEventLineage || [];

  return (
    <div className="space-y-1">
      <button
        type="button"
        className="text-[8px] text-fuchsia-200/90 underline"
        onClick={() =>
          onTraverseSpace(
            activeSpace,
            activeSpace === CAUSAL_SPACE_ID_V0.SPORTS ? "demo_match" : "category:SC"
          )
        }
      >
        Walk {activeSpace}
      </button>
      {ex ? (
        <ul className="max-h-16 overflow-y-auto space-y-0.5">
          {lineage.slice(0, 6).map((row, i) => (
            <li
              key={row.mutationId || row.ticketId || row.eventType || i}
              className="text-[7px] font-mono text-white/55 truncate"
            >
              {row.eventType || row.ticketId || "—"}
              {row.mutationId ? ` → ${row.mutationId.slice(0, 12)}` : ""}
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-[8px] text-white/40">Select a causal space to traverse</p>
      )}
      {ex?.sportsDriftCategories ? (
        <p className="text-[7px] text-violet-200/60">
          sports drift: {JSON.stringify(ex.sportsDriftCategories)}
        </p>
      ) : null}
      {ex?.stateProposal?.summary ? (
        <p className="text-[7px] text-white/45 italic">{ex.stateProposal.summary}</p>
      ) : null}
    </div>
  );
}

/** @param {{ authority?: object, commitStatus?: string }} props */
function AuthorityPanel({ authority, commitStatus }) {
  return (
    <div className="rounded border border-cyan-400/20 bg-cyan-950/15 px-2 py-1.5">
      <div className="flex justify-between text-[8px]">
        <span className="text-white/45">commit</span>
        <span className="font-mono text-cyan-100/90">{commitStatus || "pending"}</span>
      </div>
      <div className="flex justify-between text-[8px] mt-0.5">
        <span className="text-white/45">admission</span>
        <span className="font-mono text-cyan-100/90">{authority?.admissionVerdict || "—"}</span>
      </div>
      <p className="mt-1 text-[7px] text-white/40">Mutation locked — explicit gate only</p>
    </div>
  );
}

/** @param {{ projected?: object, size?: number, className?: string }} props */
function SvgGlyph({ projected, size = 40, className = "" }) {
  const paths = projected?.paths || [];
  const hue = projected?.hueDeg ?? 200;
  const stroke = `hsl(${hue} 70% 65%)`;
  const fill = projected?.fillOpacity
    ? `hsla(${hue} 65% 50% / ${projected.fillOpacity})`
    : "none";

  return (
    <svg
      viewBox="0 0 100 100"
      width={size}
      height={size}
      className={className}
      aria-hidden
      data-rhizoh-cux-glyph={projected?.geometry}
    >
      {paths.map((d, i) => (
        <path
          key={i}
          d={d}
          fill={fill}
          stroke={stroke}
          strokeWidth={projected?.strokeWidth ?? 1}
          vectorEffect="non-scaling-stroke"
        />
      ))}
    </svg>
  );
}
