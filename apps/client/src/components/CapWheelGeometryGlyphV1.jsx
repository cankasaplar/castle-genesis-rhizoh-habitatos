import React, { memo } from "react";
import { CAP_WHEEL_GEOMETRY_KIND_V1 } from "../kernel/visual/capWheelIntentRegistryV1.js";

/** Inline cap-wheel geometry glyph — latent intent (icon level). */
export const CapWheelGeometryGlyphV1 = memo(function CapWheelGeometryGlyphV1({
  kind = CAP_WHEEL_GEOMETRY_KIND_V1.CUBE,
  className = "",
  size = 14
}) {
  const s = Number(size) || 14;
  const stroke = "currentColor";
  const common = { fill: "none", stroke, strokeWidth: 1.4, strokeLinecap: "round", strokeLinejoin: "round" };

  let body = null;
  if (kind === CAP_WHEEL_GEOMETRY_KIND_V1.SPIRAL) {
    body = (
      <path
        {...common}
        d="M7 2.5a4.5 4.5 0 1 1-3.2 7.6M7 5a2 2 0 1 0 1.4 3.4"
      />
    );
  } else if (kind === CAP_WHEEL_GEOMETRY_KIND_V1.RING) {
    body = (
      <>
        <circle {...common} cx="7" cy="7" r="4.2" />
        <circle {...common} cx="7" cy="7" r="1.6" opacity="0.85" />
      </>
    );
  } else if (kind === CAP_WHEEL_GEOMETRY_KIND_V1.ARCHIVE) {
    body = (
      <>
        <rect {...common} x="3.5" y="4" width="7" height="8" rx="0.8" />
        <path {...common} d="M5 4V3a2 2 0 0 1 4 0v1" />
        <path {...common} d="M5.5 8h3M5.5 10h3" opacity="0.8" />
      </>
    );
  } else {
    body = (
      <path
        {...common}
        d="M4.2 5.2 7 3.5 9.8 5.2v3.6L7 10.5 4.2 8.8V5.2z"
      />
    );
  }

  return (
    <svg
      className={className}
      width={s}
      height={s}
      viewBox="0 0 14 14"
      aria-hidden
      data-cap-wheel-geometry={kind}
    >
      {body}
    </svg>
  );
});
