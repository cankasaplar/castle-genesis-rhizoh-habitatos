import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  RHIZOH_ROBOTICS_DEVICE_CHIPS_V1,
  RHIZOH_LIBRARY_ROUTE_V1
} from "../kernel/visual/rhizohCapabilityHaloConfigV1.js";
import {
  resolveHaloHeadlineV0,
  resolveHaloIntroV0,
  resolveHaloNodesV0
} from "../rhizoh/runtime/rhizohProductCopyI18nV0.js";
import { readUiLocaleV0 } from "../rhizoh/runtime/rhizohUiLocaleV0.js";
import { RSBL_SURFACE_ID_V0 } from "../rhizoh/runtime/rhizohSurfaceBindingLayerV0.js";
import { assertReverseOwnershipV0 } from "../rhizoh/runtime/rhizohSurfaceCitizenshipRuntimeV0.js";
import { useSurfaceCitizenProjectionV0 } from "../rhizoh/runtime/useSurfaceCitizenProjectionV0.js";
import { useRhizohStudioProductionOrganismV0 } from "../rhizoh/runtime/useRhizohStudioProductionOrganismV0.js";
import { STUDIO_ORGANISM_SURFACE_ROLE_V0 } from "../rhizoh/runtime/rhizohStudioOrganismSurfaceRolesV0.js";

const RING_R = 118;

/** Capability Wheel — SCR citizen; T0 projection only (reverse ownership). */
export function RhizohCapabilityHaloV1({
  onSeedIntent,
  onFocusLayer,
  /** @param {{ id: string, seedIntent?: string, layerFocus?: number }} node */
  onCapNodeIntent,
  /** @deprecated SCR reverse ownership — ignored; records violation if set */
  collectivePulse,
  className = "",
  uiLocale
}) {
  const locale = uiLocale || readUiLocaleV0();
  const capProjection = useSurfaceCitizenProjectionV0(RSBL_SURFACE_ID_V0.CAP_WHEEL);
  const organism = useRhizohStudioProductionOrganismV0();
  const gesture = organism?.gesture_field;
  const haloNodes = useMemo(() => resolveHaloNodesV0(locale), [locale]);
  const haloHeadline = useMemo(() => resolveHaloHeadlineV0(locale), [locale]);
  const haloIntro = useMemo(() => resolveHaloIntroV0(locale), [locale]);
  const nodeCount = haloNodes.length;

  useEffect(() => {
    if (collectivePulse != null) {
      assertReverseOwnershipV0(RSBL_SURFACE_ID_V0.CAP_WHEEL, {
        externalPulse: collectivePulse
      });
    }
  }, [collectivePulse]);

  const [hoverId, setHoverId] = useState(null);
  const [roboticsOpen, setRoboticsOpen] = useState(false);
  const [deviceHoverId, setDeviceHoverId] = useState(null);

  const whisper = useMemo(() => {
    if (deviceHoverId) {
      const d = RHIZOH_ROBOTICS_DEVICE_CHIPS_V1.find((x) => x.id === deviceHoverId);
      return d?.whisper || haloIntro;
    }
    if (hoverId === "library") return RHIZOH_LIBRARY_ROUTE_V1.whisper;
    if (!hoverId) return haloIntro;
    const n = haloNodes.find((x) => x.id === hoverId);
    return n?.whisper || haloIntro;
  }, [hoverId, deviceHoverId, haloNodes, haloIntro]);

  const handleNodeEnter = useCallback((node) => {
    setHoverId(node.id);
    if (node.isRoboticsHub) setRoboticsOpen(true);
    else setRoboticsOpen(false);
    setDeviceHoverId(null);
  }, []);

  const handleNodeLeave = useCallback(() => {
    setHoverId(null);
    setDeviceHoverId(null);
  }, []);

  const applyNode = useCallback(
    (node) => {
      if (onCapNodeIntent) {
        onCapNodeIntent(node);
      }
      if (node.layerFocus != null && onFocusLayer) {
        onFocusLayer(node.layerFocus);
      }
      if (node.seedIntent && onSeedIntent) {
        onSeedIntent(node.seedIntent);
      }
      if (node.isRoboticsHub) {
        setRoboticsOpen(true);
        if (onFocusLayer) onFocusLayer(13);
      }
    },
    [onCapNodeIntent, onFocusLayer, onSeedIntent]
  );

  const scaleBreath = 0.94 + (Number(capProjection?.breathe01) || 0) * 0.08;

  return (
    <div
      className={`relative mx-auto flex flex-col items-center ${className}`}
      data-rhizoh-capability-halo="1"
      data-rhizoh-scr-surface={RSBL_SURFACE_ID_V0.CAP_WHEEL}
      data-rhizoh-ssl-surface={RSBL_SURFACE_ID_V0.CAP_WHEEL}
      data-rhizoh-studio-organ-role={STUDIO_ORGANISM_SURFACE_ROLE_V0.CAP_WHEEL}
      data-rhizoh-coherence-id={organism?.coherence_id || capProjection?.coherence_id || ""}
      data-rhizoh-episode-seq={organism?.episode_seq ?? ""}
      data-rhizoh-pet-inhabited={organism?.pet_actor?.inhabited ? "1" : "0"}
      data-rhizoh-gesture-bound={gesture?.bound ? "1" : "0"}
    >
      <div
        className="pointer-events-none absolute -inset-8 rounded-full opacity-[0.14] blur-2xl transition-transform duration-[2.8s] ease-in-out"
        style={{
          background: `radial-gradient(circle at 50% 45%, rgba(34,211,238,0.5) 0%, transparent 62%)`,
          transform: `scale(${scaleBreath})`
        }}
      />
      <div
        className="relative mb-2 min-h-[3.25rem] max-w-[min(36rem,92vw)] rounded-2xl border border-cyan-400/25 bg-black/55 px-4 py-2.5 text-center backdrop-blur-md pointer-events-none"
        style={{ boxShadow: "0 0 40px rgba(34,211,238,0.08)" }}
      >
        <div className="text-[10px] font-semibold tracking-wide text-cyan-200/90 mb-1 normal-case">
          {haloHeadline}
        </div>
        <div className="text-[11px] font-medium normal-case leading-snug text-cyan-50/95">{whisper}</div>
      </div>

      <div
        className="relative h-[256px] w-[min(100%,400px)]"
        onMouseLeave={() => {
          handleNodeLeave();
          setRoboticsOpen(false);
        }}
      >
        <div className="absolute left-1/2 top-1/2 h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full bg-cyan-400/80 shadow-[0_0_24px_rgba(34,211,238,0.7)]" />
        {haloNodes.map((node, i) => {
          const deg = (360 / nodeCount) * i - 90;
          const rad = (deg * Math.PI) / 180;
          const x = Math.cos(rad) * RING_R;
          const y = Math.sin(rad) * RING_R;
          const active = hoverId === node.id;
          return (
            <button
              key={node.id}
              type="button"
              className={`absolute left-1/2 top-1/2 w-[4.5rem] -translate-x-1/2 -translate-y-1/2 rounded-2xl border px-1.5 py-2 text-[8px] font-black tracking-[0.12em] transition-all normal-case pointer-events-auto ${
                active
                  ? "border-cyan-300/80 bg-cyan-400/20 text-white shadow-[0_0_28px_rgba(34,211,238,0.35)] scale-105 z-10"
                  : "border-white/20 bg-black/40 text-white/80 hover:border-cyan-400/45 hover:bg-cyan-400/10"
              }`}
              style={{ transform: `translate(calc(-50% + ${x}px), calc(-50% + ${y}px))` }}
              onMouseEnter={() => handleNodeEnter(node)}
              onFocus={() => handleNodeEnter(node)}
              onBlur={handleNodeLeave}
              onClick={() => applyNode(node)}
            >
              {node.label}
            </button>
          );
        })}

        <button
          type="button"
          className="absolute left-1/2 top-[82%] w-[4.8rem] -translate-x-1/2 rounded-2xl border border-amber-300/40 bg-amber-400/15 px-1.5 py-1.5 text-[7px] font-black tracking-[0.1em] text-amber-100/95 normal-case pointer-events-auto hover:bg-amber-400/25"
          onMouseEnter={() => {
            setHoverId("library");
            setRoboticsOpen(false);
            setDeviceHoverId(null);
          }}
          onClick={() => {
            if (onSeedIntent) onSeedIntent(RHIZOH_LIBRARY_ROUTE_V1.seedIntent);
          }}
        >
          Library
        </button>
      </div>

      {roboticsOpen ? (
        <div className="mt-1 flex max-w-[min(36rem,94vw)] flex-wrap justify-center gap-1.5 pointer-events-auto">
          {RHIZOH_ROBOTICS_DEVICE_CHIPS_V1.map((d) => (
            <button
              key={d.id}
              type="button"
              className={`rounded-full border px-2.5 py-1 text-[8px] font-bold tracking-wide normal-case transition-colors ${
                deviceHoverId === d.id
                  ? "border-fuchsia-300/70 bg-fuchsia-500/25 text-fuchsia-50"
                  : "border-white/20 bg-black/35 text-white/75 hover:border-fuchsia-400/50"
              }`}
              onMouseEnter={() => {
                setDeviceHoverId(d.id);
                setHoverId("robotics");
              }}
              onClick={() => {
                if (onFocusLayer) onFocusLayer(13);
                if (onSeedIntent) onSeedIntent(d.seedIntent);
              }}
            >
              {d.label}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
