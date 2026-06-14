import React, { memo } from "react";
import { resolveSpiralMMOContinentCubeV0 } from "../rhizoh/runtime/spiralMMOContinentCubeV0.js";

const CUBE_SIZE_V0 = 120;
const HALF_V0 = CUBE_SIZE_V0 / 2;

/**
 * Continent-scoped neon CSS cube (SpiralMMO portal — visual only).
 */
export const RhizohSpiralMMOCubeV0 = memo(function RhizohSpiralMMOCubeV0({
  continentId,
  accent = "#ff8800",
  autoRotate = true
}) {
  const cube = resolveSpiralMMOContinentCubeV0(continentId);
  const edge = accent || cube.accent;

  const faceStyle = {
    position: "absolute",
    width: CUBE_SIZE_V0,
    height: CUBE_SIZE_V0,
    background: "rgba(10, 10, 10, 0.92)",
    border: `2px solid ${edge}`,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "column",
    gap: 4,
    color: edge,
    fontSize: 22,
    textShadow: `0 0 6px ${edge}`,
    boxShadow: `0 0 18px ${edge}88`,
    backfaceVisibility: "hidden"
  };

  return (
    <div
      className="mx-auto flex items-center justify-center py-2"
      data-rhizoh-spiral-mmo-cube="1"
      data-rhizoh-spiral-mmo-continent={cube.id}
      style={{ perspective: 640 }}
    >
      <div
        className={autoRotate ? "animate-[spiralmmo-cube-spin_20s_linear_infinite]" : ""}
        style={{
          position: "relative",
          width: CUBE_SIZE_V0,
          height: CUBE_SIZE_V0,
          transformStyle: "preserve-3d",
          transform: "rotateX(-20deg) rotateY(-30deg)"
        }}
      >
        <div style={{ ...faceStyle, transform: `translateZ(${HALF_V0}px)` }}>
          <span className="font-mono text-[11px] opacity-80">{cube.code}</span>
          <span>{cube.glyph}</span>
        </div>
        <div style={{ ...faceStyle, transform: `rotateY(180deg) translateZ(${HALF_V0}px)` }}>
          <span className="font-mono text-[10px] tracking-widest">SPIRAL</span>
        </div>
        <div style={{ ...faceStyle, transform: `rotateY(90deg) translateZ(${HALF_V0}px)` }}>
          <svg width="72" height="48" viewBox="0 0 72 48" aria-hidden="true">
            <path
              d="M4,38 C18,24 30,30 46,18 C56,10 62,14 68,8"
              fill="none"
              stroke={edge}
              strokeWidth="2"
            />
            <path
              d="M2,42 C20,30 36,36 54,24 C62,18 66,22 70,16"
              fill="none"
              stroke={edge}
              strokeWidth="1.2"
              opacity="0.75"
            />
          </svg>
        </div>
        <div style={{ ...faceStyle, transform: `rotateY(-90deg) translateZ(${HALF_V0}px)` }}>
          <span className="text-2xl">◎</span>
          <span className="font-mono text-[9px] opacity-75">θ→π</span>
        </div>
        <div style={{ ...faceStyle, transform: `rotateX(90deg) translateZ(${HALF_V0}px)` }}>
          <span className="font-mono text-lg font-bold tracking-wider">0644</span>
        </div>
        <div style={{ ...faceStyle, transform: `rotateX(-90deg) translateZ(${HALF_V0}px)` }}>
          <span className="font-mono text-lg font-bold tracking-wider">1844</span>
        </div>
      </div>
      <style>{`
        @keyframes spiralmmo-cube-spin {
          from { transform: rotateX(-20deg) rotateY(0deg); }
          to { transform: rotateX(-20deg) rotateY(360deg); }
        }
      `}</style>
    </div>
  );
});
