import { memo, useEffect, useId, useRef, useState } from "react";

/**
 * layerFocus değişince tek seferlik ~120–180ms alignment pulse (sürekli çizgi yok).
 * Orb bandı proxy: sağ-alt → katman yönüne ince çizgi afterimage.
 */
export const RhizohEpistemicAttentionTether = memo(function RhizohEpistemicAttentionTether({
  layerFocus = 10
}) {
  const blurId = useId().replace(/:/g, "");
  const prevRef = useRef(null);
  const [opacity, setOpacity] = useState(0);
  const timersRef = useRef([]);

  useEffect(() => {
    let skipPulse = false;
    try {
      skipPulse = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    } catch {
      skipPulse = false;
    }
    if (prevRef.current === null) {
      prevRef.current = layerFocus;
      return;
    }
    if (prevRef.current === layerFocus) return;
    prevRef.current = layerFocus;

    timersRef.current.forEach((t) => window.clearTimeout(t));
    timersRef.current = [];

    if (skipPulse) return;

    setOpacity(0.26);
    timersRef.current.push(
      window.setTimeout(() => setOpacity(0.12), 52),
      window.setTimeout(() => setOpacity(0.04), 105),
      window.setTimeout(() => setOpacity(0), 168)
    );

    return () => {
      timersRef.current.forEach((t) => window.clearTimeout(t));
    };
  }, [layerFocus]);

  const lf = Number(layerFocus);
  const n = Number.isFinite(lf) ? lf : 10;
  const θ = (n / 13) * Math.PI * 0.92 - Math.PI * 0.38;
  const len = 6.2;
  const x1 = 82;
  const y1 = 74;
  const x2 = x1 + Math.cos(θ) * len;
  const y2 = y1 - Math.sin(θ) * len;

  return (
    <svg
      className="pointer-events-none absolute inset-0 z-[4] h-full w-full"
      viewBox="0 0 100 100"
      preserveAspectRatio="none"
      aria-hidden
    >
      <defs>
        <filter id={`rhizoh-tether-soft-${blurId}`} x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur in="SourceGraphic" stdDeviation="0.35" />
        </filter>
      </defs>
      {opacity > 0.001 ? (
        <line
          x1={x1}
          y1={y1}
          x2={x2}
          y2={y2}
          stroke="rgba(186, 250, 255, 0.55)"
          strokeWidth={0.09}
          strokeLinecap="round"
          opacity={opacity}
          filter={`url(#rhizoh-tether-soft-${blurId})`}
        />
      ) : null}
    </svg>
  );
});

RhizohEpistemicAttentionTether.displayName = "RhizohEpistemicAttentionTether";
