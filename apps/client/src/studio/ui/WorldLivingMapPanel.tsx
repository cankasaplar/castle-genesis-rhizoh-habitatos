import { useEffect, useMemo } from "react";
import type { RegionChunkRuntime, WorldPortalEdge, WorldRegion } from "../types/rskOntology";
import { useStudioKernel } from "../hooks/useStudioKernel";
import { ensureCastleWorldTopology } from "../lib/bootstrapWorldTopology";

const SVG_W = 360;
const SVG_H = 220;
const PAD = 22;

function ecologyFill(health: number): string {
  const h = Math.max(0, Math.min(1, health));
  const t = 1 - h;
  const r = Math.round(18 + t * 140);
  const g = Math.round(90 + h * 110);
  const b = Math.round(55 + t * 40);
  return `rgb(${r},${g},${b})`;
}

function globalBounds(regions: WorldRegion[]): { minX: number; maxX: number; minZ: number; maxZ: number } {
  let minX = Infinity;
  let maxX = -Infinity;
  let minZ = Infinity;
  let maxZ = -Infinity;
  for (const r of regions) {
    const b = r.bounds;
    minX = Math.min(minX, b.minX);
    maxX = Math.max(maxX, b.maxX);
    minZ = Math.min(minZ, b.minZ);
    maxZ = Math.max(maxZ, b.maxZ);
  }
  if (!Number.isFinite(minX)) return { minX: -1, maxX: 1, minZ: -1, maxZ: 1 };
  const mx = (maxX - minX) * 0.04 || 1;
  const mz = (maxZ - minZ) * 0.04 || 1;
  return { minX: minX - mx, maxX: maxX + mx, minZ: minZ - mz, maxZ: maxZ + mz };
}

function layout(
  g: { minX: number; maxX: number; minZ: number; maxZ: number },
  x: number,
  z: number
): { sx: number; sy: number } {
  const spanX = g.maxX - g.minX || 1;
  const spanZ = g.maxZ - g.minZ || 1;
  const innerW = SVG_W - 2 * PAD;
  const innerH = SVG_H - 2 * PAD;
  const sx = PAD + ((x - g.minX) / spanX) * innerW;
  const sy = PAD + (1 - (z - g.minZ) / spanZ) * innerH;
  return { sx, sy };
}

export function WorldLivingMapPanel() {
  const worldTopology = useStudioKernel((s) => s.worldTopology);
  const worldLocomotion = useStudioKernel((s) => s.worldLocomotion);
  const worldChunks = useStudioKernel((s) => s.worldChunks);
  const worldEcology = useStudioKernel((s) => s.worldEcology);
  const societyEconomy = useStudioKernel((s) => s.societyEconomy);

  useEffect(() => {
    ensureCastleWorldTopology();
  }, []);

  const regions = useMemo(() => Object.values(worldTopology?.regions ?? {}), [worldTopology?.regions]);
  const edges = useMemo(() => Object.values(worldTopology?.edges ?? {}), [worldTopology?.edges]);
  const g = useMemo(() => globalBounds(regions), [regions]);

  const maxOcc = useMemo(() => {
    let m = 1;
    for (const c of Object.values(worldChunks?.chunks ?? {})) {
      m = Math.max(m, c?.occupancy ?? 0);
    }
    return m;
  }, [worldChunks?.chunks]);

  const maxHeat = useMemo(() => {
    let m = 0.01;
    for (const v of Object.values(societyEconomy?.marketHeatByRegionUid ?? {})) {
      m = Math.max(m, v);
    }
    return m;
  }, [societyEconomy?.marketHeatByRegionUid]);

  const activeUid = worldLocomotion?.activeRegionUid;
  const avatarRegions = worldLocomotion?.avatarRegionUid ?? {};
  const chunks = worldChunks?.chunks ?? {};
  const health = worldEcology?.healthByRegionUid ?? {};
  const heatMap = societyEconomy?.marketHeatByRegionUid ?? {};
  const civic = societyEconomy?.civicCohesion ?? 0.5;

  const regionCenters = useMemo(() => {
    const m: Record<string, { cx: number; cz: number }> = {};
    for (const r of regions) {
      const b = r.bounds;
      m[r.uid] = { cx: (b.minX + b.maxX) / 2, cz: (b.minZ + b.maxZ) / 2 };
    }
    return m;
  }, [regions]);

  const regionRects = useMemo(() => {
    return regions.map((r) => {
      const b = r.bounds;
      const p0 = layout(g, b.minX, b.minZ);
      const p1 = layout(g, b.maxX, b.maxZ);
      const x = Math.min(p0.sx, p1.sx);
      const y = Math.min(p0.sy, p1.sy);
      const w = Math.abs(p1.sx - p0.sx);
      const h = Math.abs(p1.sy - p0.sy);
      return { r, x, y, w: Math.max(w, 6), h: Math.max(h, 6) };
    });
  }, [regions, g]);

  const portalLines = useMemo(() => {
    const lines: { key: string; x1: number; y1: number; x2: number; y2: number; e: WorldPortalEdge }[] = [];
    for (const e of edges) {
      const a = regionCenters[e.fromRegionUid];
      const b = regionCenters[e.toRegionUid];
      if (!a || !b) continue;
      const p1 = layout(g, a.cx, a.cz);
      const p2 = layout(g, b.cx, b.cz);
      lines.push({ key: e.uid, x1: p1.sx, y1: p1.sy, x2: p2.sx, y2: p2.sy, e });
    }
    return lines;
  }, [edges, regionCenters, g]);

  return (
    <div className="mt-4 rounded-xl border border-cyan-500/25 bg-[#050a12]/95 overflow-hidden">
      <div className="flex items-center justify-between border-b border-white/10 px-3 py-2">
        <div className="text-[9px] font-black tracking-[0.2em] text-cyan-200/90">LIVING MAP</div>
        <div className="text-[8px] text-white/45">topology → chunks · ecology · society</div>
      </div>
      <div className="px-2 pt-2">
        <svg
          width="100%"
          height={SVG_H}
          viewBox={`0 0 ${SVG_W} ${SVG_H}`}
          className="mx-auto block max-w-full"
          role="img"
          aria-label="World regions and portals"
        >
          <defs>
            <pattern id="rsk-unloaded-hatch" width="8" height="8" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
              <line x1="0" y1="0" x2="0" y2="8" stroke="rgba(148,163,184,0.35)" strokeWidth="2" />
            </pattern>
            <filter id="rsk-active-glow" x="-40%" y="-40%" width="180%" height="180%">
              <feGaussianBlur stdDeviation="3" result="b" />
              <feMerge>
                <feMergeNode in="b" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>
          <rect x="0" y="0" width={SVG_W} height={SVG_H} fill="#020617" rx="6" />
          {regionRects.map(({ r, x, y, w, h }) => {
            const ch: RegionChunkRuntime | undefined = chunks[r.uid];
            const occ = ch?.occupancy ?? 0;
            const occN = maxOcc > 0 ? occ / maxOcc : 0;
            const loaded = ch?.loaded !== false;
            const hlt = health[r.uid] ?? r.ecologyHealth ?? 0.72;
            const mh = heatMap[r.uid] ?? 0;
            const heatN = Math.max(0, Math.min(1, mh / maxHeat));
            const isActive = r.uid === activeUid;
            const hasAvatar = Object.values(avatarRegions).includes(r.uid);
            const fill = ecologyFill(hlt);
            const label = (r.title ?? r.uid).slice(0, 18);
            return (
              <g key={r.uid}>
                <rect
                  x={x}
                  y={y}
                  width={w}
                  height={h}
                  rx={5}
                  fill={fill}
                  stroke={
                    isActive
                      ? "rgba(34,211,238,0.95)"
                      : `rgba(251,191,36,${0.25 + 0.65 * heatN})`
                  }
                  strokeWidth={isActive ? 2.4 : 0.6 + 2.2 * heatN}
                  opacity={loaded ? 1 : 0.72}
                  filter={isActive ? "url(#rsk-active-glow)" : undefined}
                />
                {!loaded ? <rect x={x} y={y} width={w} height={h} rx={5} fill="url(#rsk-unloaded-hatch)" opacity={0.55} /> : null}
                <rect
                  x={x}
                  y={y}
                  width={w}
                  height={h}
                  rx={5}
                  fill={`rgba(255,90,40,${0.08 + 0.38 * occN})`}
                  stroke="none"
                  pointerEvents="none"
                />
                {hasAvatar && !isActive ? (
                  <rect
                    x={x - 1}
                    y={y - 1}
                    width={w + 2}
                    height={h + 2}
                    rx={6}
                    fill="none"
                    stroke="rgba(52,211,153,0.45)"
                    strokeWidth={1}
                  />
                ) : null}
                <text
                  x={x + 5}
                  y={y + 13}
                  fill="rgba(255,255,255,0.88)"
                  fontSize="9"
                  fontFamily="ui-monospace, monospace"
                >
                  {label}
                </text>
                <title>
                  {r.uid}
                  {`\nloaded: ${loaded ? "yes" : "no"}`}
                  {`\noccupancy: ${occ}`}
                  {`\necology: ${hlt.toFixed(2)}`}
                  {`\nmarket heat: ${mh.toFixed(3)}`}
                </title>
              </g>
            );
          })}
          {portalLines.map(({ key, x1, y1, x2, y2 }) => (
            <line
              key={key}
              x1={x1}
              y1={y1}
              x2={x2}
              y2={y2}
              stroke="rgba(167,139,250,0.92)"
              strokeWidth={1.75}
              strokeDasharray="5 4"
              pointerEvents="none"
            />
          ))}
        </svg>
      </div>
      <div className="px-3 pb-2 space-y-1.5">
        <div className="flex items-center gap-2 text-[8px] text-white/55">
          <span className="text-cyan-300/90">civic cohesion</span>
          <div className="flex-1 h-1.5 rounded-full bg-white/10 overflow-hidden">
            <div
              className="h-full rounded-full bg-emerald-400/85"
              style={{ width: `${Math.round(Math.max(0, Math.min(1, civic)) * 100)}%` }}
            />
          </div>
          <span className="tabular-nums text-white/70">{civic.toFixed(2)}</span>
        </div>
        <div className="flex flex-wrap gap-x-3 gap-y-0.5 text-[7px] text-white/40">
          <span>
            <span className="text-cyan-300/80">cyan</span> active
          </span>
          <span>
            <span className="text-violet-300/80">violet dash</span> portals
          </span>
          <span>
            <span className="text-amber-200/80">amber</span> market heat
          </span>
          <span>
            <span className="text-orange-300/80">orange wash</span> occupancy
          </span>
          <span>
            <span className="text-emerald-300/80">green stroke</span> avatar present
          </span>
          <span>
            <span className="text-slate-400/90">hatch</span> chunk unloaded
          </span>
        </div>
      </div>
    </div>
  );
}
