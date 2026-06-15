import React, { memo, useCallback, useEffect, useRef, useState } from "react";
import {
  formatRhizohNeonCountdownMsV0,
  isRhizohNeonCountdownCompleteV0,
  readRhizohNeonCountdownDeadlineMsV0,
  resolveRhizohNeonCountdownRemainingMsV0
} from "../rhizoh/runtime/rhizohNeonCountdownV0.js";
import {
  RHIZOH_SPIRAL_MMO_AWAKENING_EVENT_V0,
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
import {
  buildSpiralMMOAwakeningBottlePlanV0,
  spiralMMOAwakeningBottleHtmlV0
} from "../rhizoh/runtime/spiralMMOAwakeningBottleV0.js";

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

/**
 * Map overlay — route mesh, calculated cubes, birds, bottles, 06:44 timer.
 */
export const RhizohSpiralMMOMapAwakeningOverlayV0 = memo(function RhizohSpiralMMOMapAwakeningOverlayV0({
  uiLocale = "en"
}) {
  void uiLocale;
  const hostRef = useRef(null);
  const cubeTargetsRef = useRef([]);
  const [deadlineMs, setDeadlineMs] = useState(() => readRhizohNeonCountdownDeadlineMsV0());
  const [tick, setTick] = useState(() => Date.now());
  const [scene, setScene] = useState(null);
  const [collapsing, setCollapsing] = useState(false);
  const [cubeKeyframesCss, setCubeKeyframesCss] = useState("");
  const planRef = useRef(null);
  const collapseHandledRef = useRef(false);

  const remainingMs = resolveRhizohNeonCountdownRemainingMsV0(deadlineMs, tick);
  const complete = isRhizohNeonCountdownCompleteV0(remainingMs);
  const display = complete ? "00:00" : formatRhizohNeonCountdownMsV0(remainingMs);

  const spawnLaunches = useCallback((plan) => {
    planRef.current = plan;
    setDeadlineMs(plan.deadlineMs);
    setCollapsing(false);
    const host = hostRef.current;
    if (!host || !plan?.launches?.length) return;

    const rect = host.getBoundingClientRect();
    const w = rect.width || window.innerWidth;
    const h = rect.height || window.innerHeight;

    const cubes = plan.launches.map((launch) => resolveLaunchGeometry(launch, w, h));
    cubeTargetsRef.current = cubes.map((c) => ({ x: c.p2.x, y: c.p2.y, key: c.key }));

    const birds = buildSpiralMMOAwakeningBirdPlanV0(cubes, plan.cycleSeed);
    const bottles = buildSpiralMMOAwakeningBottlePlanV0(cubes, w, h);

    const kfBlocks = [];
    for (const cube of cubes) {
      if (cube.cubeSpec) {
        const built = spiralMMOAwakeningCubeHtmlV0(cube.cubeSpec);
        kfBlocks.push(built.spinKeyframes);
      }
    }
    setCubeKeyframesCss([...new Set(kfBlocks)].join("\n"));
    setScene({ cubes, birds, bottles, w, h });
  }, []);

  useEffect(() => {
    const onAwaken = (ev) => spawnLaunches(ev?.detail);
    window.addEventListener(RHIZOH_SPIRAL_MMO_AWAKENING_EVENT_V0, onAwaken);
    return () => window.removeEventListener(RHIZOH_SPIRAL_MMO_AWAKENING_EVENT_V0, onAwaken);
  }, [spawnLaunches]);

  useEffect(() => {
    const id = window.setInterval(() => setTick(Date.now()), 250);
    return () => window.clearInterval(id);
  }, []);

  useEffect(() => {
    if (!complete) {
      collapseHandledRef.current = false;
      return;
    }
    if (collapsing || collapseHandledRef.current) return;
    collapseHandledRef.current = true;
    setCollapsing(true);

    const pins = listSpiralMMOContinentMapPinsV0();
    const handoffTo = planRef.current?.collapseHandoff?.toIndex ?? 0;
    const nextPin = pins[handoffTo] || pins[0];
    setScene((prev) => {
      if (!prev) return prev;
      const collapsePct = spiralMMOGeoToPercentV0(nextPin.lat, nextPin.lon);
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
        }))
      };
    });

    const restartTimer = window.setTimeout(() => {
      const fromIdx = planRef.current?.triggerPinIndex ?? 0;
      setCollapsing(false);
      setScene(null);
      spawnLaunches(
        buildSpiralMMOAwakeningLaunchPlanV0(fromIdx, Date.now(), { mode: "collapse", commit: true })
      );
    }, 2800);

    return () => window.clearTimeout(restartTimer);
  }, [complete, collapsing, spawnLaunches]);

  return (
    <div
      ref={hostRef}
      className="pointer-events-none absolute inset-0 z-[12] overflow-hidden"
      data-rhizoh-spiral-mmo-awakening-overlay="1"
      data-rhizoh-spiral-mmo-phase={complete ? "collapse" : collapsing ? "collapsing" : scene ? "active" : "idle"}
      data-rhizoh-spiral-behavior-continent={planRef.current?.behavior?.continent || ""}
      aria-hidden
    >
      {cubeKeyframesCss ? <style>{cubeKeyframesCss}</style> : null}

      {scene ? (
        <>
          <div className="absolute inset-0 z-[5]" data-rhizoh-spiral-bottle-layer="1">
            {scene.bottles.map((bottle) => (
              <SpiralMMOBottleV0 key={bottle.id} bottle={bottle} hostRef={hostRef} />
            ))}
          </div>

          <div className="absolute inset-0 z-[10]" data-rhizoh-spiral-cube-layer="1">
            {scene.cubes.map((cube) => (
              <SpiralMMOFlightCubeV0 key={cube.key} cube={cube} collapsing={cube.collapsing} hostRef={hostRef} />
            ))}
          </div>

          <div className="absolute inset-0 z-[25]" data-rhizoh-spiral-bird-layer="1">
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

      <div
        className="pointer-events-none absolute bottom-5 left-1/2 z-[50] -translate-x-1/2 font-mono text-2xl font-bold tracking-[0.35em] tabular-nums transition-colors duration-500"
        style={{
          color: complete ? "#ff3300" : "#ffffff",
          textShadow: complete
            ? "0 0 15px #ff3300, 0 0 30px #ff3300"
            : "0 0 15px currentColor, 0 0 30px currentColor"
        }}
        data-rhizoh-spiral-mmo-bottom-timer="1"
      >
        {display}
      </div>
    </div>
  );
});

const SpiralMMOFlightCubeV0 = memo(function SpiralMMOFlightCubeV0({ cube, collapsing, hostRef }) {
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
    const depthScale = cube.depthScale ?? 0.9 + (cube.cubeSpec?.depth ?? 0.5) * 0.2;
    const steps = 48;
    const keyframes = [];
    for (let i = 0; i <= steps; i += 1) {
      const t = i / steps;
      const eased = t < 0.5 ? 2 * t * t : 1 - (-2 * t + 2) ** 2 / 2;
      let pos = spiralMMOBezierPointV0(eased, cube.p0, cube.cp, cube.p2);
      if (cube.isOrder) {
        const waveAmp = cube.waveAmplitude ?? 4;
        const wave = Math.sin(eased * Math.PI * 2 + (cube.sequenceIndex || 0) * 0.35) * waveAmp;
        const dx = cube.p2.x - cube.p0.x;
        const dy = cube.p2.y - cube.p0.y;
        const len = Math.hypot(dx, dy) || 1;
        pos = { x: pos.x + (-dy / len) * wave, y: pos.y + (dx / len) * wave };
      }
      const destX = cube.p2.x + acc.x;
      const destY = cube.p2.y + acc.y;
      const travelScale = i === 0 ? 0.15 : depthScale * (0.72 + eased * 0.28);
      const atDest = i === steps;
      keyframes.push({
        left: `${atDest ? destX : pos.x}px`,
        top: `${atDest ? destY : pos.y}px`,
        transform: `translate(-50%,-50%) scale(${travelScale})`,
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
        const destX = cube.p2.x + acc.x;
        const destY = cube.p2.y + acc.y;
        holdAnimRef.current = el.animate(
          [
            {
              left: `${destX}px`,
              top: `${destY}px`,
              transform: `translate(-50%,-50%) scale(${depthScale})`,
              opacity: 0.92
            },
            {
              left: `${destX}px`,
              top: `${destY}px`,
              transform: `translate(-50%,-50%) scale(${depthScale * 1.06})`,
              opacity: 1
            },
            {
              left: `${destX}px`,
              top: `${destY}px`,
              transform: `translate(-50%,-50%) scale(${depthScale})`,
              opacity: 0.94
            }
          ],
          { duration: 1800, iterations: Infinity, easing: "ease-in-out" }
        );
      };
    }

    return () => {
      anim.cancel();
      holdAnimRef.current?.cancel?.();
      holdAnimRef.current = null;
    };
  }, [cube, collapsing, hostRef]);

  return (
    <div
      ref={elRef}
      className="absolute"
      style={{
        left: `${cube.p0?.x || 0}px`,
        top: `${cube.p0?.y || 0}px`,
        width: 0,
        height: 0,
        zIndex: cube.depthZIndex ?? 10
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
        const landing = 1000 + Math.random() * 2000;
        window.setTimeout(() => {
          if (collapsing && bird.diveTarget) return;
          let tx = Math.random() * (host.clientWidth || window.innerWidth);
          let ty = Math.random() * (host.clientHeight || window.innerHeight);
          if (cubeTargets.length > 0 && Math.random() > 0.55) {
            const target = cubeTargets[Math.floor(Math.random() * cubeTargets.length)];
            tx = target.x;
            ty = target.y;
          }
          flyTo(tx, ty, 2000 + Math.random() * 4000);
        }, landing);
      };
    };

    const startDelay = window.setTimeout(() => {
      flyTo(
        Math.random() * (host.clientWidth || window.innerWidth),
        Math.random() * (host.clientHeight || window.innerHeight),
        2200 + Math.random() * 2000
      );
    }, 120 + Math.random() * 800);

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
      { duration: 800, easing: "ease-in", fill: "forwards" }
    );
    return () => anim.cancel();
  }, [collapsing, bird]);

  return (
    <div
      ref={elRef}
      className="absolute left-0 top-0"
      style={{ width: 0, height: 0 }}
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
      className="absolute"
      style={{ left: `${bottle.startX}px`, top: `${bottle.startY}px`, width: 0, height: 0 }}
      dangerouslySetInnerHTML={{ __html: spiralMMOAwakeningBottleHtmlV0(bottle.colorClass) }}
    />
  );
});
