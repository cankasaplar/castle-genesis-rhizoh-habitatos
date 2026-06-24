import React, { memo, useCallback, useEffect, useRef, useState } from "react";
import {
  formatRhizohNeonCountdownMsV0,
  isRhizohNeonCountdownCompleteV0,
  readRhizohNeonCountdownDeadlineMsV0,
  resolveRhizohNeonCountdownRemainingMsV0
} from "../rhizoh/runtime/rhizohNeonCountdownV0.js";
import {
  RHIZOH_SPIRAL_MMO_AWAKENING_EVENT_V0,
  RHIZOH_SPIRAL_MMO_IMMERSION_END_EVENT_V0,
  buildSpiralMMOAwakeningLaunchPlanV0,
  spiralMMOBezierPointV0,
  spiralMMOGeoToPercentV0
} from "../rhizoh/runtime/spiralMMOAwakeningCycleV0.js";
import { listSpiralMMOContinentMapPinsV0 } from "../rhizoh/runtime/spiralMMOContinentPinsV0.js";
import { spiralMMOAwakeningCubeHtmlV0 } from "../rhizoh/runtime/spiralMMOAwakeningCubeCalcV0.js";
import {
  buildSpiralMMOAwakeningBirdPlanV0,
  spiralMMOAwakeningBirdHtmlV0
} from "../rhizoh/runtime/spiralMMOAwakeningBirdV0.js";
import { sampleSpiralMMOBirdRoutePointV0 } from "../rhizoh/runtime/spiralMMOBirdFlockFlightV0.js";
import {
  sampleSpiralMMOBirdCubeGlideV0,
  shouldTriggerSpiralMMOBirdCubeGlideV0
} from "../rhizoh/runtime/spiralMMOBirdCubeGlideV0.js";
import {
  buildSpiralMMOAwakeningBottlePlanV0,
  spiralMMOAwakeningBottleHtmlV0
} from "../rhizoh/runtime/spiralMMOAwakeningBottleV0.js";
import { PersistentCodexBusV0 } from "../core/PersistentBusV0.js";
import { readCodexStateV0, RHIZOH_SIMULATION_WORLD_REBUILT_EVENT_V0 } from "../core/ReplayEngineV0.js";
import {
  publishOfflineVoidStateV0,
  shouldEnterVoidAtCountdownZeroV0
} from "../core/offlineVoidGateV0.js";
import { listPendingSyncEventsV0 } from "../storage/EventStoreV0.js";
import { canPersistUserTopologyN12V0 } from "../pwa/rhizohPwaPermissionsN12V0.js";
import { handoffSpiralCountdownToWaitingRoomV1 } from "../rhizoh/runtime/spiralMMOCountdownHandoffV1.js";
import {
  isCatchUpSettlingV0,
  isReplayModeActiveV0
} from "../rhizoh/runtime/temporalBridgeV0.js";
import { isRhizohCatchUpReplayActiveV0 } from "../rhizoh/runtime/rhizohCatchUpGuardV0.js";

const SPIRAL_WORLD_RESUME_SOURCES_V0 = new Set(["user_session_resume"]);

function pctToPx(pct, width, height) {
  return { x: (pct.x / 100) * width, y: (pct.y / 100) * height };
}

function resolveLaunchGeometry(launch, w, h) {
  const p0 = pctToPx(launch.srcPct, w, h);
  const p2 = pctToPx(launch.destPct, w, h);
  const mid = { x: (p0.x + p2.x) / 2, y: (p0.y + p2.y) / 2 };
  const dx = p2.x - p0.x;
  const dy = p2.y - p0.y;
  const len = Math.hypot(dx, dy) || 1;
  const nx = -dy / len;
  const ny = dx / len;
  const cp = { x: mid.x + nx * launch.gap, y: mid.y + ny * launch.gap };
  return { ...launch, p0, p2, cp, key: launch.id };
}

function spiralCubeStackTransformV0({ acc, renderScale = 1, travelScale = 1 }) {
  const a = acc || {};
  const scale = travelScale * (a.stackScale ?? 1) * renderScale;
  const rx = a.rotateX ?? -14;
  const ry = a.rotateY ?? 0;
  const z = a.z ?? 0;
  return `translate(-50%,-50%) translate3d(${a.x || 0}px, ${a.y || 0}px, ${z}px) scale(${scale}) rotateX(${rx}deg) rotateY(${ry}deg)`;
}

/**
 * Map overlay — route mesh, calculated cubes, birds, bottles, 06:44 timer.
 */
export const RhizohSpiralMMOMapAwakeningOverlayV0 = memo(function RhizohSpiralMMOMapAwakeningOverlayV0({
  uiLocale = "en",
  calmVisual = false
}) {
  const tr = uiLocale === "tr";
  const hostRef = useRef(null);
  const cubeTargetsRef = useRef([]);
  const [deadlineMs, setDeadlineMs] = useState(() => readRhizohNeonCountdownDeadlineMsV0());
  const [tick, setTick] = useState(() => Date.now());
  const [scene, setScene] = useState(null);
  const [collapsing, setCollapsing] = useState(false);
  const [cubeKeyframesCss, setCubeKeyframesCss] = useState("");
  const planRef = useRef(null);
  const collapseHandledRef = useRef(false);
  const userDismissedRef = useRef(false);

  const remainingMs = resolveRhizohNeonCountdownRemainingMsV0(deadlineMs, tick);
  const complete = isRhizohNeonCountdownCompleteV0(remainingMs);

  const spawnLaunches = useCallback((plan) => {
    planRef.current = plan;
    setDeadlineMs(plan?.deadlineMs ?? readRhizohNeonCountdownDeadlineMsV0());
    setCollapsing(false);
    const host = hostRef.current;
    if (!host || !plan?.launches?.length) return;

    const rect = host.getBoundingClientRect();
    const w = rect.width || window.innerWidth;
    const h = rect.height || window.innerHeight;

    const cubes = plan.launches.map((launch) => resolveLaunchGeometry(launch, w, h));
    cubeTargetsRef.current = cubes.map((c) => ({ x: c.p2.x, y: c.p2.y, key: c.key }));

    const triggerPin = listSpiralMMOContinentMapPinsV0()[plan.triggerPinIndex ?? 0];
    const triggerPct = triggerPin
      ? spiralMMOGeoToPercentV0(triggerPin.lat, triggerPin.lon)
      : cubes[0]?.srcPct;
    const triggerPx = triggerPct ? pctToPx(triggerPct, w, h) : { x: w / 2, y: h / 2 };

    const birds = buildSpiralMMOAwakeningBirdPlanV0(cubes, plan.cycleSeed, {
      triggerX: triggerPx.x,
      triggerY: triggerPx.y,
      hostW: w,
      hostH: h
    });
    const bottles = buildSpiralMMOAwakeningBottlePlanV0(cubes, w, h);

    const kfBlocks = [];
    for (const cube of cubes) {
      if (cube.cubeSpec) {
        const built = spiralMMOAwakeningCubeHtmlV0(cube.cubeSpec);
        kfBlocks.push(built.spinKeyframes);
      }
    }
    setCubeKeyframesCss((prev) => {
      const merged = [...new Set([...(plan.sessionReset ? [] : prev.split("\n").filter(Boolean)), ...kfBlocks])];
      return merged.join("\n");
    });
    setScene((prev) => ({
      cubes,
      stackedCubes: plan.sessionReset ? [] : prev?.stackedCubes ?? [],
      birds,
      bottles,
      w,
      h
    }));

    // AWAKEN + per-cube GHOST_SPAWN already emitted in dispatchSpiralMMOAwakeningV0 — avoid codex spam here.
  }, []);

  const onCubeLandedV0 = useCallback((landedCube) => {
    setScene((prev) => {
      if (!prev) return prev;
      const stacked = [...(prev.stackedCubes ?? []), { ...landedCube, landed: true }].slice(-6);
      return {
        ...prev,
        stackedCubes: stacked,
        cubes: prev.cubes.filter((c) => c.key !== landedCube.key)
      };
    });
  }, []);

  useEffect(() => {
    const onAwaken = (ev) => {
      userDismissedRef.current = false;
      spawnLaunches(ev?.detail);
    };
    const onImmersionEnd = () => {
      userDismissedRef.current = true;
      planRef.current = null;
      collapseHandledRef.current = false;
      setCollapsing(false);
      setScene(null);
      setCubeKeyframesCss("");
      publishOfflineVoidStateV0(false);
    };
    window.addEventListener(RHIZOH_SPIRAL_MMO_AWAKENING_EVENT_V0, onAwaken);
    window.addEventListener(RHIZOH_SPIRAL_MMO_IMMERSION_END_EVENT_V0, onImmersionEnd);
    return () => {
      window.removeEventListener(RHIZOH_SPIRAL_MMO_AWAKENING_EVENT_V0, onAwaken);
      window.removeEventListener(RHIZOH_SPIRAL_MMO_IMMERSION_END_EVENT_V0, onImmersionEnd);
    };
  }, [spawnLaunches]);

  useEffect(() => {
    const id = window.setInterval(() => setTick(Date.now()), 250);
    return () => window.clearInterval(id);
  }, []);

  useEffect(() => {
    if (!complete) {
      collapseHandledRef.current = false;
      publishOfflineVoidStateV0(false);
      return;
    }
    if (collapsing || collapseHandledRef.current) return;
    if (isReplayModeActiveV0() || isRhizohCatchUpReplayActiveV0() || isCatchUpSettlingV0()) return;

    void (async () => {
      const pendingOut = await listPendingSyncEventsV0(0);
      const pendingCount = pendingOut.ok ? pendingOut.events.length : 0;
      if (shouldEnterVoidAtCountdownZeroV0({ pendingSyncCount: pendingCount })) {
        collapseHandledRef.current = true;
        publishOfflineVoidStateV0(true);
        return;
      }

      collapseHandledRef.current = true;
      setCollapsing(true);

      const codex = readCodexStateV0();
      const nextSeed = Math.floor((Date.now() ^ (planRef.current?.cycleSeed || 0)) % 999999);
      if (canPersistUserTopologyN12V0()) {
        void PersistentCodexBusV0.DIMENSIONAL_COLLAPSE({
          layer: (codex.cycleLayer || 0) + 1,
          seed: nextSeed
        });
      }

      const pins = listSpiralMMOContinentMapPinsV0();
      const triggerIdx = planRef.current?.triggerPinIndex ?? 0;
      const collapsePin = pins[triggerIdx] || pins[0];
      const collapsePct = spiralMMOGeoToPercentV0(collapsePin.lat, collapsePin.lon);
      setScene((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          birds: prev.birds.map((b, idx) => ({
            ...b,
            diveTarget: cubeTargetsRef.current[(idx * 3) % Math.max(1, cubeTargetsRef.current.length)]
          })),
          cubes: prev.cubes.map((cube) => ({
            ...cube,
            collapsePct,
            collapsing: true
          })),
          stackedCubes: (prev.stackedCubes ?? []).map((cube) => ({
            ...cube,
            collapsePct,
            collapsing: true
          }))
        };
      });

      window.setTimeout(() => {
        setCollapsing(false);
        publishOfflineVoidStateV0(false);
        setScene(null);
        planRef.current = null;
        cubeTargetsRef.current = [];
        setCubeKeyframesCss("");
        handoffSpiralCountdownToWaitingRoomV1({
          source: "spiral_countdown_collapse",
          uiLocale
        });
      }, 4200);
    })();
  }, [complete, collapsing, spawnLaunches]);

  useEffect(() => {
    const onWorldRebuilt = (ev) => {
      const source = String(ev?.detail?.source || "");
      if (!SPIRAL_WORLD_RESUME_SOURCES_V0.has(source) || ev?.detail?.resumeSpiral !== true) return;
      if (isReplayModeActiveV0() || isRhizohCatchUpReplayActiveV0() || isCatchUpSettlingV0()) return;
      if (userDismissedRef.current) return;
      const world = ev?.detail?.world;
      if (!world?.shouldResume && !(world?.activeGhosts?.length > 0)) return;
      if (scene || planRef.current) return;
      const pins = listSpiralMMOContinentMapPinsV0();
      const idx = Math.max(0, Math.min(pins.length - 1, (world.cycleLayer || 0) % Math.max(1, pins.length)));
      spawnLaunches(
        buildSpiralMMOAwakeningLaunchPlanV0(idx, Date.now(), {
          mode: "click",
          commit: false,
          resetSession: true
        })
      );
    };
    window.addEventListener(RHIZOH_SIMULATION_WORLD_REBUILT_EVENT_V0, onWorldRebuilt);
    return () => window.removeEventListener(RHIZOH_SIMULATION_WORLD_REBUILT_EVENT_V0, onWorldRebuilt);
  }, [scene, spawnLaunches]);

  return (
    <div
      ref={hostRef}
      className="pointer-events-none absolute inset-0 z-[12] overflow-hidden"
      data-rhizoh-spiral-mmo-awakening-overlay="1"
      data-rhizoh-spiral-mmo-phase={complete ? "collapse" : collapsing ? "collapsing" : scene ? "active" : "idle"}
      data-rhizoh-spiral-countdown-ms={String(remainingMs)}
      data-rhizoh-spiral-behavior-continent={planRef.current?.behavior?.continent || ""}
      data-rhizoh-spiral-build-rev={planRef.current?.buildRev || ""}
      aria-hidden
    >
      {cubeKeyframesCss ? <style>{cubeKeyframesCss}</style> : null}

      {scene ? (
        <>
          {!calmVisual ? (
            <div
              className="pointer-events-none absolute inset-0 z-[5]"
              data-rhizoh-spiral-bottle-layer="1"
            >
              {scene.bottles.map((bottle) => (
                <SpiralMMOBottleV0 key={bottle.id} bottle={bottle} hostRef={hostRef} />
              ))}
            </div>
          ) : null}

          <div
            className="pointer-events-none absolute inset-0 z-[8]"
            data-rhizoh-spiral-stacked-cube-layer="1"
            style={{ perspective: "900px", transformStyle: "preserve-3d" }}
          >
            {(scene.stackedCubes ?? []).map((cube) =>
              cube.collapsing ? (
                <SpiralMMOFlightCubeV0
                  key={`stacked-collapse-${cube.key}`}
                  cube={cube}
                  collapsing
                  hostRef={hostRef}
                />
              ) : (
                <SpiralMMOStackedCubeV0 key={`stacked-${cube.key}`} cube={cube} />
              )
            )}
          </div>

          <div
            className="pointer-events-none absolute inset-0 z-[10]"
            data-rhizoh-spiral-cube-layer="1"
            style={{ perspective: "900px", transformStyle: "preserve-3d" }}
          >
            {scene.cubes.map((cube) => (
              <SpiralMMOFlightCubeV0
                key={cube.key}
                cube={cube}
                collapsing={cube.collapsing}
                hostRef={hostRef}
                onLanded={onCubeLandedV0}
              />
            ))}
          </div>

          <div
            className="pointer-events-none absolute inset-0 z-[25]"
            data-rhizoh-spiral-bird-layer="1"
            style={{ perspective: "920px", transformStyle: "preserve-3d" }}
          >
            {scene.birds.map((bird) => (
              <SpiralMMOBirdV0
                key={bird.id}
                bird={bird}
                hostRef={hostRef}
                cubeTargets={cubeTargetsRef.current}
                collapsing={collapsing}
              />
            ))}
          </div>
        </>
      ) : null}

      {calmVisual && scene && !complete ? (
        <div
          className="pointer-events-none absolute inset-x-0 top-[22%] z-[30] flex justify-center px-16 sm:top-[18%] sm:px-24"
          data-rhizoh-spiral-calm-timer="1"
        >
          <div
            className="rounded-2xl border border-cyan-400/25 bg-black/55 px-4 py-2 font-mono text-2xl font-bold tracking-[0.2em] text-cyan-100/90 tabular-nums shadow-lg backdrop-blur-sm"
            style={{ textShadow: "0 0 18px rgba(34,211,238,0.35)" }}
          >
            {formatRhizohNeonCountdownMsV0(remainingMs)}
          </div>
        </div>
      ) : null}
    </div>
  );
});

const SpiralMMOStackedCubeV0 = memo(function SpiralMMOStackedCubeV0({ cube }) {
  const acc = cube.accumulationOffset || { x: 0, y: 0 };
  const renderScale = cube.renderScale ?? cube.cubeSpec?.renderScaleFactor ?? 1;
  const destX = (cube.p2?.x ?? 0) + acc.x;
  const destY = (cube.p2?.y ?? 0) + acc.y;
  const cubeHtml = cube.cubeSpec ? spiralMMOAwakeningCubeHtmlV0(cube.cubeSpec).html : "";

  return (
    <div
      className="absolute"
      style={{
        left: `${destX}px`,
        top: `${destY}px`,
        width: 0,
        height: 0,
        zIndex: cube.depthZIndex ?? 10,
        transform: spiralCubeStackTransformV0({ acc: { x: 0, y: 0, z: acc.z, rotateX: acc.rotateX, rotateY: acc.rotateY, stackScale: acc.stackScale }, renderScale, travelScale: 1 }),
        transformStyle: "preserve-3d",
        pointerEvents: "none"
      }}
      data-rhizoh-spiral-cube-stacked="1"
      dangerouslySetInnerHTML={{ __html: cubeHtml }}
    />
  );
});

const SpiralMMOFlightCubeV0 = memo(function SpiralMMOFlightCubeV0({ cube, collapsing, hostRef, onLanded }) {
  const elRef = useRef(null);
  const holdAnimRef = useRef(null);
  const cubeHtml = cube.cubeSpec ? spiralMMOAwakeningCubeHtmlV0(cube.cubeSpec).html : "";

  useEffect(() => {
    const el = elRef.current;
    const host = hostRef.current;
    if (!el || !host) return undefined;

    const rect = host.getBoundingClientRect();
    const w = rect.width || window.innerWidth;
    const h = rect.height || window.innerHeight;

    if (collapsing && cube.collapsePct) {
      holdAnimRef.current?.cancel?.();
      holdAnimRef.current = null;
      const target = pctToPx(cube.collapsePct, w, h);
      const anim = el.animate(
        [
          { left: el.style.left, top: el.style.top, transform: "translate(-50%,-50%) scale(1) rotate(0deg)", opacity: 1 },
          {
            left: `${target.x}px`,
            top: `${target.y}px`,
            transform: "translate(-50%,-50%) scale(0) rotate(720deg)",
            opacity: 0.15
          }
        ],
        { duration: 1100, easing: "ease-in", fill: "forwards" }
      );
      return () => anim.cancel();
    }

    const acc = cube.accumulationOffset || { x: 0, y: 0 };
    const renderScale = cube.renderScale ?? cube.cubeSpec?.renderScaleFactor ?? 1;
    const steps = 48;
    const keyframes = [];
    for (let i = 0; i <= steps; i += 1) {
      const t = i / steps;
      const eased = t < 0.5 ? 2 * t * t : 1 - (-2 * t + 2) ** 2 / 2;
      let pos = spiralMMOBezierPointV0(eased, cube.p0, cube.cp, cube.p2);
      const dx = cube.p2.x - cube.p0.x;
      const dy = cube.p2.y - cube.p0.y;
      const len = Math.hypot(dx, dy) || 1;
      const waveT = eased * Math.PI * 4 + (cube.groupIndex ?? cube.sequenceIndex ?? 0);
      if (cube.isOrder || cube.kind === "order") {
        const waveAmp = cube.waveAmplitude ?? 4;
        const wave = Math.sin(waveT) * waveAmp;
        pos = { x: pos.x + (-dy / len) * wave, y: pos.y + (dx / len) * wave };
      } else if (cube.kind === "chaos") {
        const waveAmp = (cube.waveAmplitude ?? 4) * 0.5;
        const wave = Math.sin(waveT) * waveAmp;
        const scatterX = cube.scatterX ?? 0;
        const scatterY = cube.scatterY ?? 0;
        pos = {
          x: pos.x + (-dy / len) * wave + scatterX * eased,
          y: pos.y + (dx / len) * wave + scatterY * eased
        };
      }
      const destX = cube.p2.x + acc.x;
      const destY = cube.p2.y + acc.y;
      const travelScale =
        renderScale <= 1.01 ? 1 : i === 0 ? 0.38 : renderScale * (0.82 + eased * 0.32);
      const atDest = i === steps;
      keyframes.push({
        left: `${atDest ? destX : pos.x}px`,
        top: `${atDest ? destY : pos.y}px`,
        transform: spiralCubeStackTransformV0({ acc, renderScale, travelScale }),
        opacity: 0.45 + eased * 0.5,
        filter: `drop-shadow(${cube.cubeSpec?.shadowX ?? 2}px ${cube.cubeSpec?.shadowY ?? 3}px ${cube.cubeSpec?.shadowBlur ?? 6}px rgba(0,0,0,0.5))`
      });
    }

    const anim = el.animate(keyframes, {
      duration: cube.durationMs,
      delay: cube.delayMs,
      fill: "forwards",
      easing: cube.transitionEase || "cubic-bezier(0.42, 0, 0.22, 1)"
    });

    if (cube.holdAtDest) {
      anim.onfinish = () => {
        onLanded?.(cube);
      };
    }

    return () => {
      anim.cancel();
      holdAnimRef.current?.cancel?.();
      holdAnimRef.current = null;
    };
  }, [cube, collapsing, hostRef, onLanded]);

  return (
    <div
      ref={elRef}
      className="pointer-events-none absolute"
      style={{
        left: `${cube.p0?.x || 0}px`,
        top: `${cube.p0?.y || 0}px`,
        width: 0,
        height: 0,
        zIndex: cube.depthZIndex ?? 10,
        transformStyle: "preserve-3d",
        perspective: "420px"
      }}
      data-rhizoh-spiral-cube-seq={cube.sequenceIndex ?? 0}
      data-rhizoh-spiral-cube-depth={cube.depthLayer ?? 0}
      data-rhizoh-spiral-cube-direction={cube.direction || "forward"}
      dangerouslySetInnerHTML={{ __html: cubeHtml }}
    />
  );
});

const SpiralMMOBirdV0 = memo(function SpiralMMOBirdV0({ bird, hostRef, cubeTargets, collapsing }) {
  const elRef = useRef(null);
  const rafRef = useRef(0);

  useEffect(() => {
    const el = elRef.current;
    const host = hostRef.current;
    if (!el || !host) return undefined;

    const routePoints = bird.routePoints;
    const hasSpiralRoute = bird.routeMode === "spiral_flock" && routePoints?.length > 1;

    if (hasSpiralRoute) {
      const loopMs = bird.loopDurationMs || 12000;
      const pathOffset = Number.isFinite(bird.pathOffset) ? bird.pathOffset : 0;
      const startAt = performance.now() + (bird.birdIndex || 0) * 220;
      const inner = el.firstElementChild;
      let loopIndex = 0;
      let glideActive = false;
      let glideStartAt = 0;
      let glideFrom = { x: bird.startX, y: bird.startY, z: 0 };
      let glideTo = null;
      const glideMs = 1600;

      const applySample = (sample, opacityMul = 1) => {
        const bank = sample.bank ?? 0;
        const heading = sample.headingDeg ?? 0;
        const z = sample.z ?? 0;
        const pitch = sample.pitchDeg ?? -12;
        const scaleMul = sample.depthScaleMul ?? 1;
        const scale = bird.depthScale * scaleMul;
        const opacity = Math.max(
          0.35,
          Math.min(1, bird.depthOpacity * (0.82 + scaleMul * 0.22) * opacityMul)
        );
        el.style.transform = `translate3d(${sample.x}px, ${sample.y}px, ${z}px)`;
        el.style.zIndex = String(20 + Math.round(z + 40));
        if (inner) {
          inner.style.transform = `scale(${scale}) rotateX(${pitch}deg) rotateZ(${heading + bank * 0.4}deg)`;
          inner.style.opacity = String(opacity);
        }
      };

      const tick = (now) => {
        if (glideActive && glideTo) {
          const glideT = Math.min(1, (now - glideStartAt) / glideMs);
          applySample(sampleSpiralMMOBirdCubeGlideV0(glideFrom, glideTo, glideT));
          if (glideT >= 1) {
            glideActive = false;
            glideTo = null;
            loopIndex += 1;
          }
          rafRef.current = requestAnimationFrame(tick);
          return;
        }

        const elapsed = Math.max(0, now - startAt);
        const loopElapsed = elapsed % loopMs;
        const progress = loopElapsed / loopMs;
        const sample = sampleSpiralMMOBirdRoutePointV0(routePoints, pathOffset + progress);
        const bob = 1 + Math.sin(progress * Math.PI * 2) * 0.06;
        applySample({ ...sample, depthScaleMul: (sample.depthScaleMul ?? 1) * bob });

        if (
          !glideActive &&
          cubeTargets.length > 0 &&
          shouldTriggerSpiralMMOBirdCubeGlideV0(progress, loopIndex, bird.birdIndex || 0)
        ) {
          glideActive = true;
          glideStartAt = now;
          glideFrom = { x: sample.x, y: sample.y, z: sample.z ?? 0 };
          const target = cubeTargets[(bird.birdIndex || 0) % cubeTargets.length];
          glideTo = { x: target.x, y: target.y };
        }

        rafRef.current = requestAnimationFrame(tick);
      };
      rafRef.current = requestAnimationFrame(tick);

      return () => {
        cancelAnimationFrame(rafRef.current);
      };
    }

    let currentX = bird.startX;
    let currentY = bird.startY;
    let activeAnim = null;

    const flyTo = (targetX, targetY, duration) => {
      activeAnim?.cancel?.();
      activeAnim = el.animate(
        [
          { transform: `translate(${currentX}px, ${currentY}px) scale(${bird.depthScale})` },
          { transform: `translate(${targetX}px, ${targetY}px) scale(${bird.depthScale})` }
        ],
        { duration, fill: "forwards", easing: "ease-in-out" }
      );
      activeAnim.onfinish = () => {
        currentX = targetX;
        currentY = targetY;
        const landing = 1800 + Math.random() * 3200;
        window.setTimeout(() => {
          if (collapsing && bird.diveTarget) return;
          let tx = Math.random() * (host.clientWidth || window.innerWidth);
          let ty = Math.random() * (host.clientHeight || window.innerHeight);
          if (cubeTargets.length > 0 && Math.random() > 0.55) {
            const target = cubeTargets[Math.floor(Math.random() * cubeTargets.length)];
            tx = target.x;
            ty = target.y;
          }
          flyTo(tx, ty, 3600 + Math.random() * 3600);
        }, landing);
      };
    };

    const startDelay = window.setTimeout(() => {
      const firstTarget =
        bird.arcTarget && Number.isFinite(bird.arcTarget.x)
          ? { x: bird.arcTarget.x, y: bird.arcTarget.y }
          : cubeTargets.length > 0
            ? cubeTargets[Math.floor(Math.random() * cubeTargets.length)]
            : null;
      if (firstTarget) {
        flyTo(firstTarget.x, firstTarget.y, 2800 + Math.random() * 2200);
      } else {
        flyTo(
          Math.random() * (host.clientWidth || window.innerWidth),
          Math.random() * (host.clientHeight || window.innerHeight),
          3600 + Math.random() * 2800
        );
      }
    }, 400 + Math.random() * 1400);

    return () => {
      window.clearTimeout(startDelay);
      activeAnim?.cancel?.();
      cancelAnimationFrame(rafRef.current);
    };
  }, [bird, hostRef, cubeTargets, collapsing]);

  useEffect(() => {
    if (!collapsing || !bird.diveTarget || !elRef.current) return undefined;
    const el = elRef.current;
    const matrix = new DOMMatrixReadOnly(getComputedStyle(el).transform);
    const anim = el.animate(
      [
        { transform: `translate(${matrix.m41}px, ${matrix.m42}px) scale(${bird.depthScale})`, opacity: bird.depthOpacity },
        {
          transform: `translate(${bird.diveTarget.x}px, ${bird.diveTarget.y}px) scale(0)`,
          opacity: 0
        }
      ],
      { duration: 1200, easing: "ease-in", fill: "forwards" }
    );
    return () => anim.cancel();
  }, [collapsing, bird]);

  return (
    <div
      ref={elRef}
      className="pointer-events-none absolute left-0 top-0"
      style={{ width: 0, height: 0, transformStyle: "preserve-3d" }}
      dangerouslySetInnerHTML={{ __html: spiralMMOAwakeningBirdHtmlV0(bird) }}
    />
  );
});

const SpiralMMOBottleV0 = memo(function SpiralMMOBottleV0({ bottle, hostRef }) {
  const elRef = useRef(null);

  useEffect(() => {
    const el = elRef.current;
    if (!el) return undefined;
    const anim = el.animate(
      [
        {
          left: `${bottle.startX}px`,
          top: `${bottle.startY}px`,
          transform: "translate(-50%,-50%) scale(0.5) rotate(-10deg)"
        },
        {
          left: `${bottle.targetX}px`,
          top: `${bottle.targetY}px`,
          transform: "translate(-50%,-50%) scale(1) rotate(10deg)"
        }
      ],
      { duration: 5000, delay: bottle.delayMs, fill: "forwards", easing: "ease-out" }
    );
    return () => anim.cancel();
  }, [bottle]);

  return (
    <div
      ref={elRef}
      className="pointer-events-none absolute"
      style={{ left: `${bottle.startX}px`, top: `${bottle.startY}px`, width: 0, height: 0 }}
      dangerouslySetInnerHTML={{ __html: spiralMMOAwakeningBottleHtmlV0(bottle.colorClass) }}
    />
  );
});
