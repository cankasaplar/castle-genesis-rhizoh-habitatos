import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  RHIZOH_ROBOTICS_DEVICE_CHIPS_V1,
  RHIZOH_LIBRARY_ROUTE_V1
} from "../kernel/visual/rhizohCapabilityHaloConfigV1.js";
import { resolveCapWheelGeometryKindV1 } from "../kernel/visual/capWheelIntentRegistryV1.js";
import { CapWheelGeometryGlyphV1 } from "./CapWheelGeometryGlyphV1.jsx";
import {
  resolveHaloHeadlineV0,
  resolveHaloIntroV0,
  resolveHaloNodesV0
} from "../rhizoh/runtime/rhizohProductCopyI18nV0.js";
import { resolveCapWheelMeaningLadderV0 } from "../rhizoh/runtime/rhizohCapWheelMeaningLadderV0.js";
import {
  bindCapWheelAttentionRuntimeDebugV1,
  createCapWheelAttentionSessionV1,
  recordCapWheelClickExecuteV1,
  recordCapWheelClickPendingV1,
  recordCapWheelHoverDecodeV1,
  recordCapWheelInteractionIdleV1,
  scheduleCapWheelExecuteAfterDecodeV1
} from "../kernel/visual/capWheelAttentionRuntimeV1.js";
import { readUiLocaleV0 } from "../rhizoh/runtime/rhizohUiLocaleV0.js";
import { RSBL_SURFACE_ID_V0 } from "../rhizoh/runtime/rhizohSurfaceBindingLayerV0.js";
import { assertReverseOwnershipV0 } from "../rhizoh/runtime/rhizohSurfaceCitizenshipRuntimeV0.js";
import { useSurfaceCitizenProjectionV0 } from "../rhizoh/runtime/useSurfaceCitizenProjectionV0.js";
import { useRhizohStudioProductionOrganismV0 } from "../rhizoh/runtime/useRhizohStudioProductionOrganismV0.js";
import { STUDIO_ORGANISM_SURFACE_ROLE_V0 } from "../rhizoh/runtime/rhizohStudioOrganismSurfaceRolesV0.js";

const RING_R = 118;
/** Hafif yatay direksiyon eğimi (rotateX). */
const CAP_WHEEL_TILT_DEG_V1 = 16;
const WHISPER_OCCLUDE_SELECTORS_V1 = [
  "[data-rhizoh-reply-text]",
  "[data-octo-conversation-stage]"
];

function rectsOverlapV1(a, b, pad = 0) {
  return (
    a.bottom > b.top - pad &&
    a.top < b.bottom + pad &&
    a.right > b.left - pad &&
    a.left < b.right + pad
  );
}

/** Capability Wheel — SCR citizen; steering-ring rotation + dock occlusion. */
export function RhizohCapabilityHaloV1({
  onSeedIntent,
  onFocusLayer,
  /** @param {{ id: string, seedIntent?: string, layerFocus?: number }} node */
  onCapNodeIntent,
  /** @deprecated SCR reverse ownership — ignored; records violation if set */
  collectivePulse,
  /** @type {"center" | "corner"} */
  anchor = "center",
  suppressWhisper = false,
  /** Context wheel registry override — mod-isolated node set */
  nodes: nodesOverride = null,
  headline: headlineOverride = null,
  intro: introOverride = null,
  hideLibrary = false,
  className = "",
  style,
  uiLocale
}) {
  const cornerAnchor = anchor === "corner";
  const locale = uiLocale || readUiLocaleV0();
  const capProjection = useSurfaceCitizenProjectionV0(RSBL_SURFACE_ID_V0.CAP_WHEEL);
  const organism = useRhizohStudioProductionOrganismV0();
  const gesture = organism?.gesture_field;
  const defaultNodes = useMemo(() => resolveHaloNodesV0(locale), [locale]);
  const haloNodes = nodesOverride ?? defaultNodes;
  const haloHeadline = headlineOverride ?? resolveHaloHeadlineV0(locale);
  const haloIntro = introOverride ?? resolveHaloIntroV0(locale);
  const safeNodes = Array.isArray(haloNodes) ? haloNodes : [];
  const nodeCount = Math.max(1, safeNodes.length);

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
  const [wheelRot, setWheelRot] = useState(0);
  const [whisperOccluded, setWhisperOccluded] = useState(false);
  const wheelRef = useRef(null);
  const copyRef = useRef(null);
  const dragRef = useRef({ active: false, startAngle: 0, startRot: 0, pointerId: null });
  const whisperOccludedRef = useRef(false);
  const capWheelSessionRef = useRef(createCapWheelAttentionSessionV1());
  const capWheelExecuteCancelRef = useRef(() => {});

  useEffect(() => {
    bindCapWheelAttentionRuntimeDebugV1(() => capWheelSessionRef.current);
    return () => {
      capWheelExecuteCancelRef.current?.();
    };
  }, []);

  useEffect(() => {
    setHoverId(null);
    setRoboticsOpen(false);
    setDeviceHoverId(null);
  }, [nodesOverride, locale]);

  useEffect(() => {
    let raf = 0;
    let dead = false;
    const measure = () => {
      if (dead) return;
      try {
        const copyRect = copyRef.current?.getBoundingClientRect();
        if (!copyRect || copyRect.height < 2) {
          if (whisperOccludedRef.current) {
            whisperOccludedRef.current = false;
            setWhisperOccluded(false);
          }
        } else {
          const targets = WHISPER_OCCLUDE_SELECTORS_V1.flatMap((sel) =>
            Array.from(document.querySelectorAll(sel))
          );
          let occluded = false;
          for (const el of targets) {
            const tr = el.getBoundingClientRect();
            if (tr.height > 2 && rectsOverlapV1(copyRect, tr, 4)) {
              occluded = true;
              break;
            }
          }
          if (whisperOccludedRef.current !== occluded) {
            whisperOccludedRef.current = occluded;
            setWhisperOccluded(occluded);
          }
        }
      } catch {
        /* dock measure — non-fatal */
      }
      raf = requestAnimationFrame(measure);
    };
    raf = requestAnimationFrame(measure);
    return () => {
      dead = true;
      cancelAnimationFrame(raf);
    };
  }, []);

  const whisper = useMemo(() => {
    if (deviceHoverId) {
      const d = RHIZOH_ROBOTICS_DEVICE_CHIPS_V1.find((x) => x.id === deviceHoverId);
      return d?.whisper || haloIntro;
    }
    if (hoverId === "library") return RHIZOH_LIBRARY_ROUTE_V1.whisper;
    if (!hoverId) return haloIntro;
    const n = safeNodes.find((x) => x.id === hoverId);
    return n?.whisper || haloIntro;
  }, [hoverId, deviceHoverId, safeNodes, haloIntro]);

  const hoverNode = useMemo(() => {
    if (deviceHoverId || hoverId === "library") return null;
    if (!hoverId) return null;
    return safeNodes.find((x) => x.id === hoverId) || null;
  }, [hoverId, deviceHoverId, safeNodes]);

  const meaningLadder = useMemo(
    () =>
      resolveCapWheelMeaningLadderV0({
        locale,
        intro: haloIntro,
        hoverNode,
        hoverKind: hoverId === "library" ? "library" : null,
        whisper
      }),
    [locale, haloIntro, hoverNode, hoverId, whisper]
  );

  const handleNodeEnter = useCallback((node) => {
    capWheelSessionRef.current = recordCapWheelHoverDecodeV1(capWheelSessionRef.current, {
      nodeId: node.id
    });
    setHoverId(node.id);
    if (node.isRoboticsHub) setRoboticsOpen(true);
    else setRoboticsOpen(false);
    setDeviceHoverId(null);
  }, []);

  const handleLibraryEnter = useCallback(() => {
    capWheelSessionRef.current = recordCapWheelHoverDecodeV1(capWheelSessionRef.current, {
      nodeId: "library"
    });
    setHoverId("library");
    setRoboticsOpen(false);
    setDeviceHoverId(null);
  }, []);

  const runCapWheelExecuteV1 = useCallback(
    (nodeId, executeFn) => {
      capWheelExecuteCancelRef.current?.();
      capWheelSessionRef.current = recordCapWheelClickPendingV1(capWheelSessionRef.current, { nodeId });
      capWheelExecuteCancelRef.current = scheduleCapWheelExecuteAfterDecodeV1(() => {
        capWheelSessionRef.current = recordCapWheelClickExecuteV1(capWheelSessionRef.current, { nodeId });
        executeFn();
        capWheelSessionRef.current = recordCapWheelInteractionIdleV1(capWheelSessionRef.current);
      });
    },
    []
  );

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

  const wheelCenterV1 = useCallback(() => {
    const rect = wheelRef.current?.getBoundingClientRect();
    if (!rect) return { cx: 0, cy: 0 };
    return { cx: rect.left + rect.width / 2, cy: rect.top + rect.height / 2 };
  }, []);

  const onWheelPointerDown = useCallback(
    (e) => {
      if (e.target.closest("button")) return;
      const { cx, cy } = wheelCenterV1();
      dragRef.current = {
        active: true,
        startAngle: Math.atan2(e.clientY - cy, e.clientX - cx),
        startRot: wheelRot,
        pointerId: e.pointerId
      };
      e.currentTarget.setPointerCapture?.(e.pointerId);
    },
    [wheelCenterV1, wheelRot]
  );

  const onWheelPointerMove = useCallback(
    (e) => {
      if (!dragRef.current.active || dragRef.current.pointerId !== e.pointerId) return;
      const { cx, cy } = wheelCenterV1();
      const angle = Math.atan2(e.clientY - cy, e.clientX - cx);
      let delta = ((angle - dragRef.current.startAngle) * 180) / Math.PI;
      if (delta > 180) delta -= 360;
      if (delta < -180) delta += 360;
      setWheelRot(dragRef.current.startRot + delta);
    },
    [wheelCenterV1]
  );

  const onWheelPointerUp = useCallback((e) => {
    if (dragRef.current.pointerId === e.pointerId) {
      dragRef.current.active = false;
      dragRef.current.pointerId = null;
    }
    try {
      e.currentTarget?.releasePointerCapture?.(e.pointerId);
    } catch {
      /* ignore */
    }
  }, []);

  const scaleBreath = 0.94 + (Number(capProjection?.breathe01) || 0) * 0.08;
  const whisperHidden = suppressWhisper || whisperOccluded;

  return (
    <div
      className={`relative flex flex-col ${
        cornerAnchor ? "items-end !mx-0" : "mx-auto items-center"
      } ${className}`}
      style={style}
      data-rhizoh-capability-halo="1"
      data-rhizoh-scr-surface={RSBL_SURFACE_ID_V0.CAP_WHEEL}
      data-rhizoh-ssl-surface={RSBL_SURFACE_ID_V0.CAP_WHEEL}
      data-rhizoh-studio-organ-role={STUDIO_ORGANISM_SURFACE_ROLE_V0.CAP_WHEEL}
      data-rhizoh-coherence-id={organism?.coherence_id || capProjection?.coherence_id || ""}
      data-rhizoh-episode-seq={organism?.episode_seq ?? ""}
      data-rhizoh-pet-inhabited={organism?.pet_actor?.inhabited ? "1" : "0"}
      data-rhizoh-gesture-bound={gesture?.bound ? "1" : "0"}
      data-rhizoh-cap-whisper-occluded={whisperHidden ? "1" : "0"}
    >
      <div
        className="pointer-events-none absolute -inset-8 rounded-full opacity-[0.14] blur-2xl transition-transform duration-[2.8s] ease-in-out"
        style={{
          background: "radial-gradient(circle at 50% 45%, rgba(34,211,238,0.5) 0%, transparent 62%)",
          transform: `scale(${scaleBreath})`
        }}
      />

      <div
        ref={copyRef}
        className={`relative mb-2 rounded-2xl border border-cyan-400/25 bg-black/55 px-3 py-1.5 backdrop-blur-md pointer-events-none transition-all duration-300 ease-out ${
          cornerAnchor
            ? "ml-auto mr-0 max-w-[min(16rem,42vw)] text-right"
            : "max-w-[min(36rem,92vw)] text-center"
        } ${
          whisperHidden
            ? "max-h-0 min-h-0 overflow-hidden border-transparent py-0 opacity-0"
            : hoverId || deviceHoverId
              ? "min-h-[3.25rem] opacity-100 scale-[1.03]"
              : "min-h-[2rem] opacity-90"
        }`}
        style={{ boxShadow: whisperHidden ? "none" : "0 0 32px rgba(34,211,238,0.08)" }}
        data-rhizoh-cap-wheel-copy="1"
        data-rhizoh-cap-intent-level={meaningLadder.level}
        data-rhizoh-cap-geometry={meaningLadder.geometryKind || ""}
        data-rhizoh-cap-intent-class={meaningLadder.intentClass || ""}
        aria-hidden={whisperHidden}
      >
        <div className="flex items-center gap-1.5 mb-0.5 justify-center">
          {meaningLadder.geometryKind ? (
            <CapWheelGeometryGlyphV1
              kind={meaningLadder.geometryKind}
              size={12}
              className="shrink-0 text-cyan-200/90"
            />
          ) : null}
          <div className="text-[8px] font-semibold tracking-wide text-cyan-200/80 normal-case">
            {hoverId || deviceHoverId ? meaningLadder.headline : haloHeadline}
          </div>
        </div>
        <div className="text-[9px] font-medium normal-case leading-snug text-cyan-50/90">
          {meaningLadder.body}
        </div>
        {meaningLadder.executeHint ? (
          <div className="mt-1 text-[8px] font-semibold uppercase tracking-[0.14em] text-cyan-300/75">
            {meaningLadder.executeHint}
          </div>
        ) : null}
      </div>

      <div
        ref={wheelRef}
        className={`relative touch-none select-none ${
          cornerAnchor ? "h-[200px] w-[min(100%,280px)]" : "h-[256px] w-[min(100%,400px)]"
        }`}
        style={{ perspective: "920px", perspectiveOrigin: "50% 44%" }}
        data-rhizoh-cap-steering-wheel="1"
        onMouseLeave={() => {
          handleNodeLeave();
          setRoboticsOpen(false);
        }}
        onPointerDown={onWheelPointerDown}
        onPointerMove={onWheelPointerMove}
        onPointerUp={onWheelPointerUp}
        onPointerCancel={onWheelPointerUp}
      >
        <div
          className="relative h-full w-full"
          style={{
            transform: `rotateX(${CAP_WHEEL_TILT_DEG_V1}deg)`,
            transformStyle: "preserve-3d"
          }}
        >
          <div
            className="pointer-events-none absolute left-1/2 top-1/2 z-20 flex h-5 w-5 items-center justify-center rounded-full border-2 border-cyan-300/70 bg-[#0a1420] text-cyan-200/90 shadow-[0_0_20px_rgba(34,211,238,0.55)]"
            style={{
              transform: `translate(-50%, -50%) rotateX(${-CAP_WHEEL_TILT_DEG_V1}deg)`,
              transformStyle: "preserve-3d"
            }}
            data-rhizoh-cap-wheel-hub="1"
          >
            <CapWheelGeometryGlyphV1 kind="cube" size={10} />
          </div>

          <div
            className="absolute inset-0 transition-transform duration-75 ease-out will-change-transform"
            style={{ transform: `rotateZ(${wheelRot}deg)`, transformStyle: "preserve-3d" }}
          >
          <svg
            className="pointer-events-none absolute inset-0 h-full w-full"
            viewBox="0 0 400 256"
            aria-hidden
          >
            <circle
              cx="200"
              cy="128"
              r={RING_R}
              fill="none"
              stroke="rgba(34,211,238,0.35)"
              strokeWidth="10"
              strokeLinecap="round"
            />
            <circle
              cx="200"
              cy="128"
              r={RING_R - 14}
              fill="none"
              stroke="rgba(255,255,255,0.08)"
              strokeWidth="2"
            />
            {Array.from({ length: 12 }).map((_, i) => {
              const deg = (360 / 12) * i - 90;
              const rad = (deg * Math.PI) / 180;
              const x1 = 200 + Math.cos(rad) * (RING_R - 6);
              const y1 = 128 + Math.sin(rad) * (RING_R - 6);
              const x2 = 200 + Math.cos(rad) * (RING_R + 4);
              const y2 = 128 + Math.sin(rad) * (RING_R + 4);
              return (
                <line
                  key={i}
                  x1={x1}
                  y1={y1}
                  x2={x2}
                  y2={y2}
                  stroke="rgba(34,211,238,0.45)"
                  strokeWidth="3"
                  strokeLinecap="round"
                />
              );
            })}
          </svg>

          {safeNodes.map((node, i) => {
            const deg = (360 / nodeCount) * i - 90;
            const rad = (deg * Math.PI) / 180;
            const x = Math.cos(rad) * RING_R;
            const y = Math.sin(rad) * RING_R;
            const active = hoverId === node.id;
            const geometryKind = resolveCapWheelGeometryKindV1(node);
            return (
              <button
                key={node.id}
                type="button"
                className={`group absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full border font-black tracking-[0.1em] transition-all duration-200 normal-case pointer-events-auto ${
                  active
                    ? "z-10 h-11 w-[4.6rem] border-cyan-300/80 bg-cyan-400/22 px-1.5 py-1 text-[7px] text-white shadow-[0_0_24px_rgba(34,211,238,0.38)] scale-110"
                    : "h-8 w-8 border-white/25 bg-black/50 p-0 text-cyan-200/85 hover:h-10 hover:w-[4rem] hover:rounded-2xl hover:border-cyan-400/50 hover:bg-cyan-400/12 hover:px-1 hover:py-1 hover:text-white hover:shadow-[0_0_16px_rgba(34,211,238,0.22)]"
                }`}
                style={{
                  transform: `translate(calc(-50% + ${x}px), calc(-50% + ${y}px)) rotateZ(${-wheelRot}deg)`
                }}
                onMouseEnter={() => handleNodeEnter(node)}
                onFocus={() => handleNodeEnter(node)}
                onBlur={handleNodeLeave}
                onClick={() => runCapWheelExecuteV1(node.id, () => applyNode(node))}
                aria-label={node.label}
                title={node.label}
                data-rhizoh-cap-node={node.id}
                data-rhizoh-cap-geometry={geometryKind}
              >
                {!active ? (
                  <span className="flex h-full w-full items-center justify-center group-hover:hidden" aria-hidden>
                    <CapWheelGeometryGlyphV1 kind={geometryKind} size={14} />
                  </span>
                ) : null}
                <span
                  className={`inline-flex items-center justify-center gap-0.5 ${
                    active ? "text-[7px] opacity-100" : "hidden text-[6px] group-hover:inline-flex"
                  }`}
                >
                  <CapWheelGeometryGlyphV1 kind={geometryKind} size={10} />
                  {node.label}
                </span>
              </button>
            );
          })}

          {!hideLibrary ? (
          <button
            type="button"
            className="group absolute left-1/2 top-[82%] flex h-8 w-8 -translate-x-1/2 items-center justify-center rounded-full border border-amber-300/40 bg-amber-400/15 font-black tracking-[0.08em] text-amber-100/95 normal-case pointer-events-auto transition-all duration-200 hover:h-9 hover:w-[4.2rem] hover:rounded-2xl hover:bg-amber-400/25 hover:px-1 hover:py-1"
            style={{ transform: `translate(-50%, 0) rotateZ(${-wheelRot}deg)` }}
            onMouseEnter={handleLibraryEnter}
            onFocus={handleLibraryEnter}
            onBlur={handleNodeLeave}
            onClick={() =>
              runCapWheelExecuteV1("library", () => {
                if (onSeedIntent) onSeedIntent(RHIZOH_LIBRARY_ROUTE_V1.seedIntent);
              })
            }
            aria-label="Library"
            data-rhizoh-cap-node="library"
            data-rhizoh-cap-geometry="archive"
          >
            <span className="flex h-full w-full items-center justify-center group-hover:hidden" aria-hidden>
              <CapWheelGeometryGlyphV1 kind="archive" size={14} className="text-amber-100/95" />
            </span>
            <span className="hidden items-center gap-0.5 text-[6px] group-hover:inline-flex">
              <CapWheelGeometryGlyphV1 kind="archive" size={10} className="text-amber-50" />
              Library
            </span>
          </button>
          ) : null}
          </div>
        </div>
      </div>

      {roboticsOpen ? (
        <div
          className={`mt-1 flex flex-wrap gap-1.5 pointer-events-auto ${
            cornerAnchor
              ? "ml-auto mr-0 max-w-[min(16rem,42vw)] justify-end"
              : "max-w-[min(36rem,94vw)] justify-center"
          }`}
        >
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
                capWheelSessionRef.current = recordCapWheelHoverDecodeV1(capWheelSessionRef.current, {
                  nodeId: `robotics:${d.id}`
                });
                setDeviceHoverId(d.id);
                setHoverId("robotics");
              }}
              onClick={() =>
                runCapWheelExecuteV1(`robotics:${d.id}`, () => {
                  if (onFocusLayer) onFocusLayer(13);
                  if (onSeedIntent) onSeedIntent(d.seedIntent);
                })
              }
            >
              {d.label}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
