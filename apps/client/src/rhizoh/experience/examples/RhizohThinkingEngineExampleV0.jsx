import React, { useState, useEffect, useRef } from "react";
import {
  AnchorNodeV0,
  lerpV0,
  resolveMorphTargetsV0,
  resolveStabilizedTargetsV0
} from "./rhizohThinkingEngineExampleV0.js";

const THINK_CYCLE_MS_V0 = 5000;

/**
 * Visible thinking morph engine (visual-only). Isolated example.
 * Route: /rhizoh/examples/thinking-engine-v0
 */
export function RhizohThinkingEngineExampleV0() {
  const canvasRef = useRef(null);
  const [inputText, setInputText] = useState("");
  const [phase, setPhase] = useState("IDLE");

  const engineState = useRef({
    nodes: [],
    numNodes: 180,
    rotation: { x: 0, y: 0 },
    thoughtState: { tension: 0, twist: 0, fold: 0, entropy: 0, clarity: 1 },
    targetState: { tension: 0, twist: 0, fold: 0, entropy: 0, clarity: 1 },
    thinkTimeoutId: null
  });

  useEffect(() => {
    const nodes = [];
    for (let i = 0; i < engineState.current.numNodes; i += 1) {
      nodes.push(new AnchorNodeV0(i, engineState.current.numNodes));
    }
    engineState.current.nodes = nodes;
    return () => {
      const tid = engineState.current.thinkTimeoutId;
      if (tid) window.clearTimeout(tid);
    };
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return undefined;
    const ctx = canvas.getContext("2d");
    if (!ctx) return undefined;

    let animationFrameId;

    const render = () => {
      const state = engineState.current;
      const cw = canvas.width;
      const ch = canvas.height;
      const cx = cw / 2;
      const cy = ch / 2 - 50;
      const baseRadius = 200;
      const time = Date.now();

      ctx.fillStyle = "rgba(2, 3, 5, 0.3)";
      ctx.fillRect(0, 0, cw, ch);

      const ts = state.thoughtState;
      const tar = state.targetState;
      const speed = phase === "THINKING" ? 0.02 : 0.05;

      ts.tension = lerpV0(ts.tension, tar.tension, speed);
      ts.twist = lerpV0(ts.twist, tar.twist, speed);
      ts.fold = lerpV0(ts.fold, tar.fold, speed);
      ts.entropy = lerpV0(ts.entropy, tar.entropy, speed);
      ts.clarity = lerpV0(ts.clarity, tar.clarity, speed);

      state.rotation.y += 0.003 + ts.entropy * 0.01;
      state.rotation.x += 0.001 + ts.tension * 0.005;

      const projectedNodes = [];

      state.nodes.forEach((node) => {
        let nx = node.baseX;
        let ny = node.baseY;
        let nz = node.baseZ;

        if (ts.entropy > 0) {
          const noise =
            Math.sin(nx * 10 + time * 0.005) * Math.cos(ny * 10) * ts.entropy;
          nx += nx * noise;
          ny += ny * noise;
          nz += nz * noise;
        }

        if (ts.twist > 0) {
          const twistAngle = ts.twist * ny * Math.PI;
          const tx = nx * Math.cos(twistAngle) - nz * Math.sin(twistAngle);
          const tz = nx * Math.sin(twistAngle) + nz * Math.cos(twistAngle);
          nx = tx;
          nz = tz;
        }

        if (ts.fold > 0) {
          const dist = Math.sqrt(nx * nx + ny * ny + nz * nz);
          const foldFactor = Math.max(0.1, 1 - ts.fold / (dist + 0.5));
          nx *= foldFactor;
          ny *= foldFactor;
          nz *= foldFactor;
        }

        const currentRadius = baseRadius * (1 + ts.tension);
        node.x = nx;
        node.y = ny;
        node.z = nz;

        let ry = ny * Math.cos(state.rotation.x) - nz * Math.sin(state.rotation.x);
        let rz = ny * Math.sin(state.rotation.x) + nz * Math.cos(state.rotation.x);
        let rx = nx * Math.cos(state.rotation.y) + rz * Math.sin(state.rotation.y);
        rz = -nx * Math.sin(state.rotation.y) + rz * Math.cos(state.rotation.y);

        const fov = 400;
        const depth = Math.max(1, fov + rz * currentRadius);
        const scale = fov / depth;
        const px = cx + rx * currentRadius * scale;
        const py = cy + ry * currentRadius * scale;

        projectedNodes.push({ px, py, rz, scale, origRef: node });
      });

      projectedNodes.sort((a, b) => b.rz - a.rz);

      ctx.lineWidth = 0.5;
      for (let i = 0; i < projectedNodes.length; i += 1) {
        for (let j = i + 1; j < projectedNodes.length; j += 1) {
          const dx = projectedNodes[i].px - projectedNodes[j].px;
          const dy = projectedNodes[i].py - projectedNodes[j].py;
          const distSq = dx * dx + dy * dy;
          const connectDist = 10000 * ts.clarity;

          if (distSq < connectDist) {
            const alpha = (1 - distSq / connectDist) * projectedNodes[i].scale;
            let r = 100;
            let g = 180;
            let b = 255;
            if (ts.twist > 0.2) {
              r = 200;
              g = 100;
              b = 255;
            }
            if (ts.entropy > 0.2) {
              r = 255;
              g = 80;
              b = 80;
            }
            if (ts.fold > 0.2) {
              r = 100;
              g = 255;
              b = 150;
            }

            const brightness = phase === "THINKING" ? 1.5 : 0.8;
            ctx.strokeStyle = `rgba(${r * brightness}, ${g * brightness}, ${b * brightness}, ${alpha * 0.4})`;
            ctx.beginPath();
            ctx.moveTo(projectedNodes[i].px, projectedNodes[i].py);
            ctx.lineTo(projectedNodes[j].px, projectedNodes[j].py);
            ctx.stroke();
          }
        }
      }

      projectedNodes.forEach((pn) => {
        ctx.beginPath();
        const nodeSize = Math.max(0.5, 2 * pn.scale * (1 + ts.entropy));
        ctx.arc(pn.px, pn.py, nodeSize, 0, Math.PI * 2);
        const alpha = phase === "THINKING" ? 0.9 : 0.4;
        ctx.fillStyle = `rgba(255, 255, 255, ${alpha * pn.scale})`;
        ctx.fill();
      });

      animationFrameId = requestAnimationFrame(render);
    };

    const handleResize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    window.addEventListener("resize", handleResize);
    handleResize();
    animationFrameId = requestAnimationFrame(render);

    return () => {
      window.removeEventListener("resize", handleResize);
      cancelAnimationFrame(animationFrameId);
    };
  }, [phase]);

  const handleInputSubmit = (e) => {
    e.preventDefault();
    if (!inputText.trim() || phase === "THINKING") return;

    const userInput = inputText.trim().toLowerCase();
    setInputText("");
    setPhase("THINKING");

    const state = engineState.current;
    const morph = resolveMorphTargetsV0(userInput);
    state.targetState = { ...morph };

    if (state.thinkTimeoutId) window.clearTimeout(state.thinkTimeoutId);

    state.thinkTimeoutId = window.setTimeout(() => {
      const stabilized = resolveStabilizedTargetsV0(state.thoughtState);
      state.targetState = { ...stabilized };
      state.nodes.forEach((node) => {
        node.baseX = node.x;
        node.baseY = node.y;
        node.baseZ = node.z;
      });
      setPhase("STABILIZED");
      state.thinkTimeoutId = null;
    }, THINK_CYCLE_MS_V0);
  };

  return (
    <div
      className="relative flex h-screen w-full flex-col justify-end overflow-hidden bg-[#020204] select-none"
      data-rhizoh-thinking-engine-example-v0="1"
      data-phase={phase}
    >
      <canvas ref={canvasRef} className="pointer-events-none absolute inset-0 z-0" aria-hidden />

      <form
        onSubmit={handleInputSubmit}
        className="relative z-10 mx-auto w-full max-w-4xl px-6 pb-12 pt-4"
        aria-label="Thought vector"
      >
        <input
          type="text"
          value={inputText}
          onChange={(ev) => setInputText(ev.target.value)}
          disabled={phase === "THINKING"}
          className="w-full border-0 border-t border-white/10 bg-transparent py-3 text-transparent caret-cyan-400/75 outline-none disabled:opacity-0"
          autoComplete="off"
          spellCheck={false}
        />
      </form>
    </div>
  );
}

export default RhizohThinkingEngineExampleV0;
