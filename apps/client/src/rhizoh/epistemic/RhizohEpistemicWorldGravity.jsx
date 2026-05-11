import { memo, useEffect, useRef } from "react";

/**
 * Arka plan dünyasına (Three + Cesium) çok düşük genlikli perspektif eğimi.
 * Merkez stabil; algı çoğunlukla periferde — HUD üst katmanda, etkilenmez.
 */
export const RhizohEpistemicWorldGravity = memo(function RhizohEpistemicWorldGravity({
  layerFocus = 10,
  governanceStress = false,
  children
}) {
  const wrapRef = useRef(null);
  const cur = useRef({ x: 0, y: 0 });
  const target = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const n = Number(layerFocus);
    const lf = Number.isFinite(n) ? n : 10;
    /** Eşik altı genlik (~0.03° mertebesi) */
    target.current = {
      x: Math.sin(lf * 0.19) * 0.028,
      y: Math.cos(lf * 0.15) * 0.024
    };
  }, [layerFocus]);

  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    let reduceMotion = false;
    try {
      reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    } catch {
      reduceMotion = false;
    }
    if (reduceMotion) {
      el.style.transform = "";
      return;
    }
    const lerp = governanceStress ? 0.072 : 0.034;
    let id = 0;
    const tick = () => {
      cur.current.x += (target.current.x - cur.current.x) * lerp;
      cur.current.y += (target.current.y - cur.current.y) * lerp;
      const { x, y } = cur.current;
      el.style.transform = `perspective(5200px) rotateX(${x}deg) rotateY(${y}deg)`;
      el.style.transformOrigin = "50% 48%";
      id = requestAnimationFrame(tick);
    };
    id = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(id);
  }, [governanceStress]);

  return (
    <div ref={wrapRef} className="absolute inset-0 will-change-transform">
      {children}
    </div>
  );
});

RhizohEpistemicWorldGravity.displayName = "RhizohEpistemicWorldGravity";
