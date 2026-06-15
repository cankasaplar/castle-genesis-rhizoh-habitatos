/**
 * Octo media tulle stage — 2D procedural octo + veil (no cube, v0 visual).
 * OctoDance intent atlas — head↔tentacle wave, speed-linked hue.
 */

import {
  deriveOctoMediaAudioDriveV0,
  sampleOctoMediaAudioBandsV0,
  stepOctoMediaFloatV0
} from "./octoMediaCompanionMotionV0.js";
import {
  deriveOctoMediaTulleDriveV0,
  lerpOctoMediaTulleBehaviorV0,
  resolveOctoMediaTulleBehaviorV0
} from "./octoMediaTulleBehaviorsV0.js";

const TAU = Math.PI * 2;
const NUM_TENTACLES = 8;
const SEGS = 22;

/**
 * @param {HTMLElement} container
 * @param {{ mediaStream?: MediaStream | null }} [opts]
 */
export function mountOctoMediaTulleStageV0(container, opts = {}) {
  let disposed = false;
  let raf = 0;
  let w = Math.max(120, container.clientWidth || 320);
  let h = Math.max(120, container.clientHeight || 240);

  const canvas = document.createElement("canvas");
  canvas.style.cssText = "position:absolute;inset:0;width:100%;height:100%;pointer-events:none";
  container.appendChild(canvas);
  const ctx = canvas.getContext("2d");

  const floatState = { x: 0.5, y: 0.52, vx: 0, vy: 0, targetX: 0.58, targetY: 0.4 };
  let globalPhase = 0;
  let lastTs = 0;

  const currentBehavior = { ...resolveOctoMediaTulleBehaviorV0("IDLE") };
  let behaviorName = "IDLE";

  const tentacles = Array.from({ length: NUM_TENTACLES }, (_, i) => ({
    baseAngle: (i / NUM_TENTACLES) * TAU,
    phase: (i / NUM_TENTACLES) * TAU * 1.3,
    phaseSpeed: 0.8 + (i % 5) * 0.08,
    lengthFactor: 0.85 + (i % 3) * 0.1,
    thicknessFactor: 0.9 + (i % 2) * 0.08,
    colorOffset: (i / NUM_TENTACLES) * 60 - 30,
    personalFreq: 0.9 + (i % 4) * 0.05,
    personalAmp: 0.9 + (i % 3) * 0.06
  }));

  let audioCtx = null;
  let analyser = null;
  /** @type {Uint8Array | null} */
  let freqData = null;

  const bindMotionStream = (mediaStream) => {
    if (disposed) return;
    if (audioCtx) {
      void audioCtx.close();
      audioCtx = null;
      analyser = null;
      freqData = null;
    }
    if (mediaStream?.getAudioTracks?.().length) {
      try {
        audioCtx = new AudioContext();
        void audioCtx.resume().catch(() => {});
        const src = audioCtx.createMediaStreamSource(mediaStream);
        analyser = audioCtx.createAnalyser();
        analyser.fftSize = 256;
        src.connect(analyser);
        freqData = new Uint8Array(analyser.frequencyBinCount);
      } catch {
        /* noop */
      }
    }
  };

  bindMotionStream(opts.mediaStream || null);

  const resize = () => {
    if (disposed || !ctx) return;
    w = Math.max(120, container.clientWidth || w);
    h = Math.max(120, container.clientHeight || h);
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.floor(w * dpr);
    canvas.height = Math.floor(h * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  };

  const ro = typeof ResizeObserver !== "undefined" ? new ResizeObserver(() => resize()) : null;
  ro?.observe(container);
  resize();

  function nestRadius() {
    return Math.min(w, h) * 0.22;
  }

  function calcTentaclePoints(cx, cy, nestR, b, dt, tulleDrive) {
    globalPhase += dt * b.freq;
    const flow = tulleDrive.waveFlow;

    return tentacles.map((tent, ti) => {
      const pts = [];
      const baseLen = nestR * 0.95 * tent.lengthFactor;
      const flowDelay =
        flow === "head_to_tip" ? ti * 0.22 : flow === "tip_to_head" ? (NUM_TENTACLES - ti) * 0.22 : ti * 0.1;
      const angleWave =
        Math.sin(globalPhase * tent.phaseSpeed + tent.phase + flowDelay) * 0.4 * b.spread;
      const angle = tent.baseAngle + angleWave;

      const mantleR = nestR * 0.28 + Math.sin(globalPhase * 2 + ti) * nestR * 0.03;
      const rootX = cx + Math.cos(angle) * mantleR;
      const rootY = cy + Math.sin(angle) * mantleR;
      pts.push({ x: rootX, y: rootY });

      let px = rootX;
      let py = rootY;
      let dir = angle;

      for (let s = 1; s <= SEGS; s += 1) {
        const tRatio = s / SEGS;
        const segLen = (baseLen / SEGS) * (1 - tRatio * 0.55);
        const wavePhase =
          globalPhase * tent.phaseSpeed * tent.personalFreq +
          tent.phase +
          tRatio * Math.PI * 4 +
          flowDelay;

        const wave1 = Math.sin(wavePhase) * b.amplitude * tent.personalAmp * 0.6;
        const wave2 = Math.sin(globalPhase * 0.7 + ti * 0.8 + tRatio * Math.PI * 2.5) * b.curl * 0.3;
        const tipCurl =
          tRatio > 0.75
            ? Math.sin(globalPhase * 3 + ti * 1.2 + flowDelay) *
              b.curl *
              0.8 *
              ((tRatio - 0.75) / 0.25)
            : 0;

        dir += (wave1 + wave2 + tipCurl) * 0.18;
        px += Math.cos(dir) * segLen;
        py += Math.sin(dir) * segLen;
        pts.push({ x: px, y: py });
      }
      return pts;
    });
  }

  function buildTullePoints(tentaclePoints) {
    const pts = [];
    tentaclePoints.forEach((tp, ti) => {
      for (let s = SEGS * 0.3; s < SEGS; s += 3) {
        const idx = Math.floor(s);
        if (tp[idx]) pts.push({ x: tp[idx].x, y: tp[idx].y, t: ti, s: s / SEGS });
      }
    });
    return pts;
  }

  function drawTulle(cx, cy, pts, b, nestR) {
    if (pts.length < 3) return;
    const hue = b.colorH;
    const sorted = pts
      .map((p) => ({ ...p, angle: Math.atan2(p.y - cy, p.x - cx) }))
      .sort((a, c) => a.angle - c.angle);

    ctx.beginPath();
    ctx.moveTo(sorted[0].x, sorted[0].y);
    for (let i = 1; i < sorted.length; i += 1) {
      const prev = sorted[i - 1];
      const curr = sorted[i];
      const cpx = (prev.x + curr.x) / 2;
      const cpy = (prev.y + curr.y) / 2;
      ctx.quadraticCurveTo(prev.x, prev.y, cpx, cpy);
    }
    ctx.closePath();
    const shimmer = (Math.sin(globalPhase * 3) * 0.5 + 0.5) * 0.05;
    ctx.fillStyle = `hsla(${hue + 20}, 70%, 72%, ${0.035 + shimmer})`;
    ctx.fill();
    ctx.strokeStyle = `hsla(${hue}, 75%, 78%, 0.09)`;
    ctx.lineWidth = 0.6;
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(cx, cy, nestR * 0.42 + Math.sin(globalPhase) * nestR * 0.04, 0, TAU);
    ctx.fillStyle = `hsla(${hue + 180}, 55%, 88%, ${0.018 + shimmer * 0.4})`;
    ctx.fill();
  }

  function drawTentacle(pts, ti, b) {
    if (pts.length < 2) return;
    const hue = b.colorH + tentacles[ti].colorOffset + Math.sin(globalPhase * 0.5 + ti) * 22;
    const sat = 58 + b.amplitude * 28;

    for (let s = 1; s < pts.length; s += 1) {
      const tRatio = s / pts.length;
      const thickness = (1 - tRatio) * nestRadius() * 0.09 * tentacles[ti].thicknessFactor;
      const alpha = 0.55 + tRatio * 0.2;
      const tulleAlpha = 0.1 + Math.sin(globalPhase * 2 + ti + s * 0.3) * 0.05;

      ctx.beginPath();
      ctx.moveTo(pts[s - 1].x, pts[s - 1].y);
      ctx.lineTo(pts[s].x, pts[s].y);
      ctx.strokeStyle = `hsla(${hue}, ${sat}%, 62%, ${alpha})`;
      ctx.lineWidth = Math.max(0.4, thickness);
      ctx.lineCap = "round";
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(pts[s - 1].x, pts[s - 1].y);
      ctx.lineTo(pts[s].x, pts[s].y);
      ctx.strokeStyle = `hsla(${hue + 38}, 88%, 84%, ${tulleAlpha})`;
      ctx.lineWidth = Math.max(0.25, thickness * 0.55);
      ctx.stroke();
    }

    const tip = pts[pts.length - 1];
    ctx.beginPath();
    ctx.arc(tip.x, tip.y, 2, 0, TAU);
    ctx.fillStyle = `hsla(${hue}, 95%, 78%, 0.65)`;
    ctx.fill();
  }

  function drawMantle(cx, cy, b, nestR) {
    const hue = b.colorH;
    const pulse = Math.sin(globalPhase * b.freq * 0.6) * nestR * 0.04;
    const rx = nestR * 0.3 + pulse;
    const ry = nestR * 0.34 + pulse * 0.7;

    ctx.beginPath();
    ctx.ellipse(cx, cy - nestR * 0.05, rx, ry, Math.sin(globalPhase * 0.3) * 0.1, 0, TAU);
    ctx.fillStyle = `hsla(${hue - 18}, 48%, 13%, 0.78)`;
    ctx.fill();
    ctx.strokeStyle = `hsla(${hue}, 68%, 52%, 0.42)`;
    ctx.lineWidth = 1;
    ctx.stroke();

    for (let i = 0; i < 10; i += 1) {
      const ch = hue + i * 14 + Math.sin(globalPhase + i) * 28;
      const px = cx + Math.cos(i * TAU / 10 + globalPhase * 0.1) * rx * 0.55;
      const py = cy - nestR * 0.05 + Math.sin(i * TAU / 10 + globalPhase * 0.1) * ry * 0.55;
      ctx.beginPath();
      ctx.arc(px, py, 1.8 + Math.sin(globalPhase * 2 + i) * 1.2, 0, TAU);
      ctx.fillStyle = `hsla(${ch}, 78%, 58%, ${0.32 + Math.sin(globalPhase * 3 + i) * 0.2})`;
      ctx.fill();
    }

    ctx.beginPath();
    ctx.ellipse(cx - rx * 0.22, cy - nestR * 0.14, rx * 0.45, ry * 0.28, -0.3, 0, TAU);
    ctx.fillStyle = `hsla(${hue + 42}, 75%, 82%, 0.06)`;
    ctx.fill();
  }

  function drawEyes(cx, cy, b, nestR) {
    const hue = b.colorH;
    const eyeWave = Math.sin(globalPhase * 0.4) * nestR * 0.02;
    [[-0.14, 0], [0.14, 0]].forEach(([ex]) => {
      const eyeX = cx + ex * nestR;
      const eyeY = cy - nestR * 0.12 + eyeWave;
      ctx.beginPath();
      ctx.ellipse(eyeX, eyeY, nestR * 0.07, nestR * 0.05, 0, 0, TAU);
      ctx.fillStyle = `hsla(${hue + 35}, 28%, 88%, 0.8)`;
      ctx.fill();
      ctx.beginPath();
      ctx.ellipse(eyeX, eyeY, nestR * 0.025, nestR * 0.04, 0, 0, TAU);
      ctx.fillStyle = `hsla(${hue - 55}, 55%, 10%, 0.92)`;
      ctx.fill();
      if (behaviorName === "SPEAK") {
        ctx.beginPath();
        ctx.ellipse(eyeX, eyeY, nestR * 0.08, nestR * 0.06, 0, 0, TAU);
        ctx.strokeStyle = `hsla(${hue}, 100%, 68%, ${0.25 + Math.sin(globalPhase * 4) * 0.15})`;
        ctx.lineWidth = 0.8;
        ctx.stroke();
      }
    });
  }

  function drawNestRings(cx, cy, nestR) {
    ctx.beginPath();
    ctx.arc(cx, cy, nestR, 0, TAU);
    ctx.strokeStyle = "rgba(80,200,255,0.12)";
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(cx, cy, nestR * 0.88, 0, TAU);
    ctx.strokeStyle = "rgba(80,200,255,0.06)";
    ctx.lineWidth = 0.8;
    ctx.stroke();
  }

  function frame(ts) {
    if (disposed) return;
    const dt = Math.min(0.05, lastTs ? (ts - lastTs) / 1000 : 0.016);
    lastTs = ts;

    if (analyser && freqData) analyser.getByteFrequencyData(freqData);
    const bands = sampleOctoMediaAudioBandsV0(freqData);
    const idleMotion = 0.16 + Math.sin(ts * 0.0016) * 0.05;
    const audioMotion = freqData ? bands.motion : idleMotion;

    const nextFloat = stepOctoMediaFloatV0(floatState, {
      motion: audioMotion,
      centroid: bands.centroid,
      dt
    });
    Object.assign(floatState, nextFloat);

    const tulleDrive = deriveOctoMediaTulleDriveV0({
      audioMotion,
      centroid: bands.centroid,
      vx: floatState.vx,
      vy: floatState.vy
    });
    behaviorName = tulleDrive.mode;
    const target = resolveOctoMediaTulleBehaviorV0(tulleDrive.mode);
    target.colorH += tulleDrive.hueBias;
    lerpOctoMediaTulleBehaviorV0(currentBehavior, target, dt, tulleDrive.colorLerpSpeed);

    const cx = floatState.x * w;
    const cy = floatState.y * h;
    const nestR = nestRadius();

    ctx.clearRect(0, 0, w, h);
    drawNestRings(cx, cy, nestR);

    const tentaclePts = calcTentaclePoints(cx, cy, nestR, currentBehavior, dt, tulleDrive);
    drawTulle(cx, cy, buildTullePoints(tentaclePts), currentBehavior, nestR);
    tentaclePts.forEach((pts, ti) => drawTentacle(pts, ti, currentBehavior));
    drawMantle(cx, cy, currentBehavior, nestR);
    drawEyes(cx, cy, currentBehavior, nestR);

    container.dataset.rhizohOctoTulleMode = behaviorName;
    container.dataset.rhizohOctoWaveFlow = tulleDrive.waveFlow;

    raf = requestAnimationFrame(frame);
  }

  raf = requestAnimationFrame(frame);

  return Object.freeze({
    isDisposed() {
      return disposed;
    },
    setMotionStream(stream) {
      bindMotionStream(stream);
    },
    dispose() {
      if (disposed) return;
      disposed = true;
      ro?.disconnect();
      cancelAnimationFrame(raf);
      raf = 0;
      if (audioCtx) void audioCtx.close();
      audioCtx = null;
      analyser = null;
      freqData = null;
      container.replaceChildren();
    }
  });
}

/** @deprecated use mountOctoMediaTulleStageV0 */
export const mountOctoMediaCompanionV0 = mountOctoMediaTulleStageV0;
