import React, { useState, useEffect, useRef } from "react";
import {
  INTENT_PHYSICS_V0,
  PhysicalNodeV0,
  randomRangeV0,
  resolveDominantIntentV0,
  resolvePendingEchoV0
} from "./physicalCognitionEngineExampleV0.js";

/**
 * Visual-only physical cognition field (example). No on-canvas or overlay copy.
 * Route: /rhizoh/examples/physical-cognition-v0
 * SPECFLOW: RESEARCH-ONLY
 */
export function PhysicalCognitionEngineExampleV0() {
  const canvasRef = useRef(null);
  const [inputText, setInputText] = useState("");
  const [phaseUI, setPhaseUI] = useState("CRYSTAL_IDLE");

  const engineState = useRef({
    mainNodes: [],
    echoClusters: [],
    rotation: { x: 0, y: 0 },
    phase: "CRYSTAL_IDLE",
    phaseTimer: 0,
    currentIntent: null,
    pendingEcho: null,
    globalEnergy: 0.05,
    shadows: { split: false, resonance: false, collapse: false, stabilize: false }
  });

  useEffect(() => {
    const nodes = [];
    for (let i = 0; i < 140; i += 1) {
      nodes.push(new PhysicalNodeV0(i, 140, false, 200));
    }
    engineState.current.mainNodes = nodes;
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
      const cy = ch / 2 - 30;
      const time = Date.now() * 0.001;

      const intentDef =
        state.currentIntent && INTENT_PHYSICS_V0[state.currentIntent.name];
      if (
        intentDef?.lightMode === "flash_burst" &&
        state.phase === "CRYSTAL_RESONANCE"
      ) {
        ctx.fillStyle = `rgba(20, 5, 5, ${randomRangeV0(0.1, 0.4)})`;
      } else {
        ctx.fillStyle = "rgba(2, 3, 5, 0.25)";
      }
      ctx.fillRect(0, 0, cw, ch);

      let forceMultiplier = 0;

      if (state.phase === "CRYSTAL_SPLIT") {
        state.phaseTimer += 1;
        forceMultiplier = 3.0;
        if (!state.shadows.split) state.shadows.split = true;
        if (state.phaseTimer > 20) {
          state.phase = "CRYSTAL_RESONANCE";
          state.phaseTimer = 0;
          setPhaseUI("CRYSTAL_RESONANCE");
        }
      } else if (state.phase === "CRYSTAL_RESONANCE") {
        state.phaseTimer += 1;
        forceMultiplier = 1.0;
        if (!state.shadows.resonance) state.shadows.resonance = true;
        if (state.phaseTimer > 120) {
          state.phase = "CRYSTAL_COLLAPSE";
          state.phaseTimer = 0;
          setPhaseUI("CRYSTAL_COLLAPSE");
        }
      } else if (state.phase === "CRYSTAL_COLLAPSE") {
        state.phaseTimer += 1;
        forceMultiplier = -2.0;
        if (!state.shadows.collapse) state.shadows.collapse = true;
        if (state.phaseTimer > 30) {
          state.phase = "CRYSTAL_STABILIZE";
          state.phaseTimer = 0;
          setPhaseUI("CRYSTAL_STABILIZE");

          if (state.pendingEcho) {
            const echoNodes = [];
            for (let i = 0; i < state.mainNodes.length; i += 3) {
              const sourceNode = state.mainNodes[i];
              echoNodes.push(
                new PhysicalNodeV0(
                  i,
                  state.mainNodes.length / 3,
                  true,
                  0.4,
                  sourceNode
                )
              );
            }
            const echoIntent =
              INTENT_PHYSICS_V0[state.pendingEcho.intent] ||
              INTENT_PHYSICS_V0.OBSERVATION;
            state.echoClusters.push({
              nodes: echoNodes,
              orbitAngle: Math.random() * Math.PI * 2,
              orbitSpeed: 0.003 + Math.random() * 0.005,
              distance: 1.2 + Math.random() * 0.8,
              color: echoIntent.color
            });
            state.pendingEcho = null;
          }

          state.mainNodes.forEach((node) => {
            node.baseX = node.x;
            node.baseY = node.y;
            node.baseZ = node.z;
          });
        }
      } else if (state.phase === "CRYSTAL_STABILIZE") {
        state.phaseTimer += 1;
        forceMultiplier = 0;
        if (!state.shadows.stabilize) state.shadows.stabilize = true;
        if (state.phaseTimer > 60) {
          state.phase = "CRYSTAL_IDLE";
          setPhaseUI("CRYSTAL_IDLE");
        }
      }

      state.rotation.y += 0.002;
      state.rotation.x += 0.001;

      const activeIntent = intentDef;
      const scalar = (activeIntent?.forceScalar || 0.5) * forceMultiplier;
      const allProjectedNodes = [];

      state.mainNodes.forEach((node) => {
        let fx = 0;
        let fy = 0;
        let fz = 0;

        if (state.phase !== "CRYSTAL_IDLE" && activeIntent) {
          if (activeIntent.type === "VORTEX") {
            fx = -node.z * scalar;
            fz = node.x * scalar;
            fy = Math.sin(node.x * 0.01 + time) * scalar * 20;
          } else if (activeIntent.type === "GRAVITY") {
            fx = -node.x * scalar * 0.05;
            fy = -node.y * scalar * 0.05;
            fz = -node.z * scalar * 0.05;
          } else if (activeIntent.type === "SHOCKWAVE") {
            fx = (Math.random() - 0.5) * scalar * 100;
            fy = (Math.random() - 0.5) * scalar * 100;
            fz = (Math.random() - 0.5) * scalar * 100;
          } else if (activeIntent.type === "EXPANSION") {
            fx = node.x * scalar * 0.02;
            fy = node.y * scalar * 0.02;
            fz = node.z * scalar * 0.02;
          }
        }

        fx += (node.baseX - node.x) * node.elasticity * 10;
        fy += (node.baseY - node.y) * node.elasticity * 10;
        fz += (node.baseZ - node.z) * node.elasticity * 10;

        node.vx = (node.vx + fx / node.mass) * node.inertia;
        node.vy = (node.vy + fy / node.mass) * node.inertia;
        node.vz = (node.vz + fz / node.mass) * node.inertia;

        node.x += node.vx;
        node.y += node.vy;
        node.z += node.vz;

        let ry = node.y * Math.cos(state.rotation.x) - node.z * Math.sin(state.rotation.x);
        let rz = node.y * Math.sin(state.rotation.x) + node.z * Math.cos(state.rotation.x);
        let rx = node.x * Math.cos(state.rotation.y) + rz * Math.sin(state.rotation.y);
        rz = -node.x * Math.sin(state.rotation.y) + rz * Math.cos(state.rotation.y);

        const fov = 400;
        const depth = Math.max(1, fov + rz);
        const scale = fov / depth;

        allProjectedNodes.push({
          px: cx + rx * scale,
          py: cy + ry * scale,
          rz,
          scale,
          isEcho: false,
          color: activeIntent?.color || [100, 180, 255]
        });
      });

      state.echoClusters.forEach((cluster) => {
        cluster.orbitAngle += cluster.orbitSpeed;
        const orbitX = Math.cos(cluster.orbitAngle) * cluster.distance;
        const orbitZ = Math.sin(cluster.orbitAngle) * cluster.distance;
        const orbitY = Math.sin(time + cluster.orbitAngle) * 0.5;

        cluster.nodes.forEach((node) => {
          const nx = node.x * 0.3 + orbitX * 200;
          const ny = node.y * 0.3 + orbitY * 200;
          const nz = node.z * 0.3 + orbitZ * 200;

          let ry = ny * Math.cos(state.rotation.x) - nz * Math.sin(state.rotation.x);
          let rz = ny * Math.sin(state.rotation.x) + nz * Math.cos(state.rotation.x);
          let rx = nx * Math.cos(state.rotation.y) + rz * Math.sin(state.rotation.y);
          rz = -nx * Math.sin(state.rotation.y) + rz * Math.cos(state.rotation.y);

          const fov = 400;
          const depth = Math.max(1, fov + rz);
          const scale = fov / depth;
          const px = cx + rx * scale;
          const py = cy + ry * scale;

          allProjectedNodes.push({
            px,
            py,
            rz,
            scale,
            isEcho: true,
            color: cluster.color
          });
        });
      });

      allProjectedNodes.sort((a, b) => b.rz - a.rz);

      const lightMode = activeIntent?.lightMode || "soft_global";

      if (lightMode === "laser_line") {
        ctx.globalCompositeOperation = "screen";
        ctx.lineWidth = 1.5;
      } else if (lightMode === "volumetric_fog") {
        ctx.globalCompositeOperation = "source-over";
        ctx.lineWidth = 0.5;
      } else if (lightMode === "flash_burst") {
        ctx.globalCompositeOperation = "color-dodge";
        ctx.lineWidth = Math.random() > 0.8 ? 3 : 0.5;
      } else {
        ctx.globalCompositeOperation = "source-over";
        ctx.lineWidth = 0.5;
      }

      for (let i = 0; i < allProjectedNodes.length; i += 1) {
        for (let j = i + 1; j < allProjectedNodes.length && j < i + 15; j += 1) {
          const n1 = allProjectedNodes[i];
          const n2 = allProjectedNodes[j];
          const distSq = (n1.px - n2.px) ** 2 + (n1.py - n2.py) ** 2;
          const maxDist = n1.isEcho ? 2000 : 15000;

          if (distSq < maxDist) {
            const alpha = (1 - distSq / maxDist) * n1.scale;
            ctx.strokeStyle = `rgba(${n1.color[0]}, ${n1.color[1]}, ${n1.color[2]}, ${alpha * (lightMode === "volumetric_fog" ? 0.1 : 0.4)})`;
            ctx.beginPath();
            ctx.moveTo(n1.px, n1.py);
            if (lightMode === "flash_burst" && Math.random() > 0.5) {
              ctx.lineTo(
                n1.px + (Math.random() - 0.5) * 20,
                n1.py + (Math.random() - 0.5) * 20
              );
            }
            ctx.lineTo(n2.px, n2.py);
            ctx.stroke();
          }
        }
      }

      allProjectedNodes.forEach((pn) => {
        ctx.beginPath();
        let nodeSize = Math.max(0.5, 2 * pn.scale);
        let alpha = 0.5;

        if (lightMode === "volumetric_fog" && !pn.isEcho) {
          nodeSize *= 4;
          alpha = 0.1;
        }

        ctx.arc(pn.px, pn.py, nodeSize, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${pn.color[0]}, ${pn.color[1]}, ${pn.color[2]}, ${alpha * pn.scale})`;
        ctx.fill();
      });

      ctx.globalCompositeOperation = "source-over";
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
  }, []);

  const handleInputSubmit = (e) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    const userInput = inputText.trim().toLowerCase();
    setInputText("");

    const state = engineState.current;
    state.phase = "CRYSTAL_SPLIT";
    state.phaseTimer = 0;
    setPhaseUI("CRYSTAL_SPLIT");
    state.shadows = { split: false, resonance: false, collapse: false, stabilize: false };

    state.currentIntent = resolveDominantIntentV0(userInput);
    state.pendingEcho = resolvePendingEchoV0(userInput);
  };

  return (
    <div
      className="relative flex h-screen w-full flex-col justify-end overflow-hidden bg-[#020203] select-none"
      data-physical-cognition-example-v0="1"
      data-phase={phaseUI}
    >
      <canvas ref={canvasRef} className="pointer-events-none absolute inset-0 z-0" aria-hidden />

      <form
        onSubmit={handleInputSubmit}
        className="relative z-10 mx-auto w-full max-w-4xl px-6 pb-12 pt-4"
        aria-label="Intent injection"
      >
        <input
          type="text"
          value={inputText}
          onChange={(ev) => setInputText(ev.target.value)}
          disabled={phaseUI !== "CRYSTAL_IDLE"}
          className="w-full border-0 border-t border-white/10 bg-transparent py-3 text-transparent caret-cyan-500/80 outline-none disabled:opacity-0"
          autoComplete="off"
          spellCheck={false}
        />
      </form>
    </div>
  );
}

export default PhysicalCognitionEngineExampleV0;
