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
  spiralMMOEmptyCubeHtmlV0,
  spiralMMOGeoToPercentV0
} from "../rhizoh/runtime/spiralMMOAwakeningCycleV0.js";
import { listSpiralMMOContinentMapPinsV0 } from "../rhizoh/runtime/spiralMMOContinentPinsV0.js";

function pctToPx(pct, width, height) {
  return { x: (pct.x / 100) * width, y: (pct.y / 100) * height };
}

/**
 * Map overlay — empty cubes on bezier paths + bottom 06:44 timer.
 */
export const RhizohSpiralMMOMapAwakeningOverlayV0 = memo(function RhizohSpiralMMOMapAwakeningOverlayV0({
  uiLocale = "en"
}) {
  void uiLocale;
  const hostRef = useRef(null);
  const [deadlineMs, setDeadlineMs] = useState(() => readRhizohNeonCountdownDeadlineMsV0());
  const [tick, setTick] = useState(() => Date.now());
  const [activeCubes, setActiveCubes] = useState([]);
  const [collapsing, setCollapsing] = useState(false);
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

    const cubes = plan.launches.map((launch) => {
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
    });
    setActiveCubes(cubes);
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
    const host = hostRef.current;
    const rect = host?.getBoundingClientRect?.() || { width: window.innerWidth, height: window.innerHeight };
    const w = rect.width || window.innerWidth;
    const h = rect.height || window.innerHeight;

    setActiveCubes((prev) =>
      prev.map((cube, idx) => {
        const pin = pins[idx % pins.length];
        const pct = spiralMMOGeoToPercentV0(pin.lat, pin.lon);
        return { ...cube, collapsePct: pct, collapsing: true };
      })
    );

    const restartTimer = window.setTimeout(() => {
      const triggerIdx = planRef.current?.triggerPinIndex ?? 0;
      setCollapsing(false);
      setActiveCubes([]);
      spawnLaunches(buildSpiralMMOAwakeningLaunchPlanV0(triggerIdx));
    }, 2600);

    return () => window.clearTimeout(restartTimer);
  }, [complete, collapsing, spawnLaunches]);

  return (
    <div
      ref={hostRef}
      className="pointer-events-none absolute inset-0 z-[12] overflow-hidden"
      data-rhizoh-spiral-mmo-awakening-overlay="1"
      data-rhizoh-spiral-mmo-phase={complete ? "collapse" : collapsing ? "collapsing" : "active"}
      aria-hidden
    >
      {activeCubes.map((cube) => (
        <SpiralMMOFlightCubeV0 key={cube.key} cube={cube} collapsing={cube.collapsing} hostRef={hostRef} />
      ))}

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

  useEffect(() => {
    const el = elRef.current;
    const host = hostRef.current;
    if (!el || !host) return undefined;

    const rect = host.getBoundingClientRect();
    const w = rect.width || window.innerWidth;
    const h = rect.height || window.innerHeight;

    if (collapsing && cube.collapsePct) {
      const target = pctToPx(cube.collapsePct, w, h);
      const anim = el.animate(
        [
          { left: el.style.left, top: el.style.top, transform: "translate(-50%,-50%) scale(1) rotate(0deg)", opacity: 1 },
          {
            left: `${target.x}px`,
            top: `${target.y}px`,
            transform: "translate(-50%,-50%) scale(0) rotate(720deg)",
            opacity: 0.2
          }
        ],
        { duration: 1100, easing: "ease-in", fill: "forwards" }
      );
      return () => anim.cancel();
    }

    const steps = 28;
    const keyframes = [];
    for (let i = 0; i <= steps; i += 1) {
      const t = i / steps;
      let pos = spiralMMOBezierPointV0(t, cube.p0, cube.cp, cube.p2);
      if (cube.isOrder) {
        const wave = Math.sin(t * Math.PI * 4) * 8;
        const dx = cube.p2.x - cube.p0.x;
        const dy = cube.p2.y - cube.p0.y;
        const len = Math.hypot(dx, dy) || 1;
        pos = {
          x: pos.x + (-dy / len) * wave,
          y: pos.y + (dx / len) * wave
        };
      }
      keyframes.push({
        left: `${pos.x}px`,
        top: `${pos.y}px`,
        transform: `translate(-50%,-50%) scale(${i === 0 ? 0 : 1})`,
        opacity: 0.92
      });
    }

    const anim = el.animate(keyframes, {
      duration: cube.durationMs,
      delay: cube.delayMs,
      fill: "forwards",
      easing: "linear"
    });
    return () => anim.cancel();
  }, [cube, collapsing, hostRef]);

  return (
    <div
      ref={elRef}
      className="absolute"
      style={{ left: `${cube.p0?.x || 0}px`, top: `${cube.p0?.y || 0}px`, width: 0, height: 0 }}
      dangerouslySetInnerHTML={{ __html: spiralMMOEmptyCubeHtmlV0(cube.colorClass) }}
    />
  );
});
