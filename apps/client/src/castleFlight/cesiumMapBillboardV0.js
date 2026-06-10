/**
 * Canvas map pins for Cesium billboards (archive visual-pin → Cesium Entity).
 * @see docs/archive/map-demos/rhizoh-hyper-kernel-v4-0-visual-pin/
 */

import { getCesiumMapPinSpecV0 } from "./cesiumMapPinCatalogV0.js";

const _pinImageCache = new Map();

/**
 * @param {CanvasRenderingContext2D} ctx
 * @param {string} pathD
 * @param {number} cx
 * @param {number} cy
 * @param {number} iconSize
 * @param {string} color
 */
function strokeSvgPathV0(ctx, pathD, cx, cy, iconSize, color) {
  const scale = iconSize / 24;
  ctx.save();
  ctx.translate(cx - 12 * scale, cy - 12 * scale);
  ctx.scale(scale, scale);
  try {
    const p = new Path2D(pathD);
    ctx.strokeStyle = color;
    ctx.lineWidth = 2.2 / scale;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.stroke(p);
  } catch {
    /* Path2D unsupported — skip icon stroke */
  }
  ctx.restore();
}

/**
 * @param {{ color?: string, glyph?: string, pinType?: string, size?: number, pulse?: boolean }} [opts]
 * @returns {string} data URL
 */
export function createCesiumMapPinCanvasV0(opts = {}) {
  const spec = opts.pinType ? getCesiumMapPinSpecV0(opts.pinType) : null;
  const color = String(opts.color || spec?.color || "#06b6d4");
  const size = Math.max(36, Math.min(80, Number(opts.size) || 52));
  const pulse = opts.pulse === true || spec?.pulse === true;
  const pathD = spec?.pathD || null;

  const cacheKey = `${opts.pinType || opts.glyph || "pin"}|${color}|${size}|${pulse ? 1 : 0}`;
  if (_pinImageCache.has(cacheKey)) return _pinImageCache.get(cacheKey);

  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size + (pulse ? 6 : 0);
  const ctx = canvas.getContext("2d");
  if (!ctx) return "";

  const cx = size / 2;
  const cy = size / 2;
  const r = size / 2 - 4;

  if (pulse) {
    ctx.beginPath();
    ctx.arc(cx, cy, r + 5, 0, Math.PI * 2);
    ctx.strokeStyle = `${color}33`;
    ctx.lineWidth = 2;
    ctx.stroke();
  }

  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.fillStyle = `${color}2e`;
  ctx.fill();
  ctx.strokeStyle = color;
  ctx.lineWidth = 2.5;
  ctx.stroke();

  ctx.shadowColor = color;
  ctx.shadowBlur = pulse ? 14 : 8;

  if (pathD) {
    strokeSvgPathV0(ctx, pathD, cx, cy, size * 0.52, color);
  } else {
    const glyphKey = String(opts.glyph || "pin");
    const glyph =
      glyphKey === "castle"
        ? "\u26EB"
        : glyphKey === "rhizoh"
          ? "\u25C9"
          : glyphKey === "poi"
            ? "\u25CF"
            : glyphKey;
    ctx.shadowBlur = 0;
    ctx.font = `bold ${Math.round(size * 0.38)}px sans-serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillStyle = color;
    ctx.fillText(glyph, cx, cy + 1);
  }

  const url = canvas.toDataURL("image/png");
  if (_pinImageCache.size > 48) _pinImageCache.clear();
  _pinImageCache.set(cacheKey, url);
  return url;
}

export function clearCesiumMapPinCanvasCacheForTestsV0() {
  _pinImageCache.clear();
}
