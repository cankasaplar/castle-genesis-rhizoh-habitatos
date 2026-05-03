import { useEffect, useRef } from "react";

/** Deterministik gürültü — hash benzeri, sinüs bileşimi */
function noise01(t) {
  return Math.sin(t * 3.9898) * Math.sin(t * 7.1234) * 0.5 + Math.sin(t * 1.234) * 0.25;
}

/**
 * rAF ile aura değişkenlerini hedef elemana yazar; React re-render tetiklemez.
 * @param {React.RefObject<HTMLElement | null>} containerRef
 * @param {{ enabled?: boolean, kineticsRef?: React.MutableRefObject<Record<string, number>> | null }} [opts]
 * @returns {{ breath: React.MutableRefObject<number>, shimmer: React.MutableRefObject<number>, pulse: React.MutableRefObject<number>, glow: React.MutableRefObject<number> }}
 */
export function useRhizohPresenceAnimation(containerRef, { enabled = true, kineticsRef = null } = {}) {
  const breath = useRef(0);
  const shimmer = useRef(0);
  const pulse = useRef(0);
  const glow = useRef(0);
  const rafRef = useRef(0);

  useEffect(() => {
    const el = containerRef?.current;
    if (!el || !enabled) return;

    let t = Math.random() * 2;
    const tick = () => {
      const k = kineticsRef?.current && typeof kineticsRef.current === "object" ? kineticsRef.current : {};
      const slowBreath = Math.max(0.75, Math.min(3.4, Number(k.slowBreath) || 1));
      const blurExtraPx = Math.max(0, Math.min(16, Number(k.blurExtraPx) || 0));
      t += 0.016 / slowBreath;
      const base = 0.5;
      const v =
        base + Math.sin(t * 0.8) * 0.6 + Math.sin(t * 1.7) * 0.22 + noise01(t * 0.15) * 0.18;
      const norm = Math.tanh(v * 0.35);
      breath.current = 0.985 + (norm * 0.5 + 0.5) * 0.03;
      shimmer.current = 0.12 + (Math.sin(t * 0.55) * 0.5 + 0.5) * 0.14;
      pulse.current = (Math.sin(t * 1.1) * 0.5 + 0.5) * 0.08;
      glow.current = 0.35 + (Math.sin(t * 0.43 + 0.8) * 0.5 + 0.5) * 0.25;

      el.style.setProperty("--qpp-scale", String(breath.current));
      el.style.setProperty("--qpp-opacity", String(Math.max(0.14, Math.min(0.3, 0.18 + shimmer.current * 0.55))));
      el.style.setProperty("--qpp-blur", `${14 + (norm * 0.5 + 0.5) * 4 + blurExtraPx}px`);
      el.style.setProperty("--qpp-shimmer", String(shimmer.current));
      el.style.setProperty("--qpp-glow", String(glow.current));

      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [containerRef, enabled, kineticsRef]);

  return { breath, shimmer, pulse, glow };
}
