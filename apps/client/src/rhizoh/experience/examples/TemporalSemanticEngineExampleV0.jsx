import React, { useState, useEffect, useRef } from "react";
import {
  CognitiveNodeTsV0,
  INTENT_DICTIONARY_V0,
  lerpV0,
  resolveTemporalDominantIntentV0,
  resolveTemporalPendingEchoV0
} from "./temporalSemanticEngineExampleV0.js";

/**
 * Temporal semantic thought-space (visual-only example). Isolated — no T0/runtime wiring.
 * Route: /rhizoh/examples/temporal-semantic-v0
 */
export function TemporalSemanticEngineExampleV0() {
  const canvasRef = useRef(null);
  const [inputText, setInputText] = useState("");
  const [phaseUI, setPhaseUI] = useState("DRIFT");

  const engineState = useRef({
    mainNodes: [],
    echoClusters: [],
    rotation: { x: 0, y: 0 },
    phase: "DRIFT",
    phaseTimer: 0,
    field: {
      energy: 0.05,
      targetEnergy: 0.05,
      twist: 0,
      fold: 0,
      entropy: 0,
      dominantColor: [100, 180, 255]
    },
    currentIntent: null,
    pendingEcho: null
  });

  useEffect(() => {
    const nodes = [];
    for (let i = 0; i < 150; i += 1) {
      nodes.push(new CognitiveNodeTsV0(i, 150));
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
      const f = state.field;
      const cw = canvas.width;
      const ch = canvas.height;
      const cx = cw / 2;
      const cy = ch / 2 - 30;
      const time = Date.now();

      ctx.fillStyle = "rgba(2, 3, 5, 0.25)";
      ctx.fillRect(0, 0, cw, ch);

      if (state.phase === "INGESTION") {
        state.phaseTimer += 1;
        f.energy = lerpV0(f.energy, 0.8, 0.05);
        f.fold = lerpV0(f.fold, 0.9, 0.1);
        if (state.phaseTimer > 60) {
          state.phase = "THINKING";
          state.phaseTimer = 0;
          setPhaseUI("THINKING");
        }
      } else if (state.phase === "THINKING") {
        state.phaseTimer += 1;
        f.fold = lerpV0(
          f.fold,
          state.currentIntent?.type === "CLOSURE" ? 0.6 : 0.2,
          0.05
        );
        if (state.currentIntent?.type === "LOOP") {
          f.twist = lerpV0(f.twist, 2.5, 0.05);
        }
        if (state.currentIntent?.type === "DISRUPTION") {
          f.entropy = lerpV0(f.entropy, 2.0, 0.05);
        }
        if (state.phaseTimer > 150) {
          state.phase = "UTTERANCE";
          state.phaseTimer = 0;
          setPhaseUI("UTTERANCE");
        }
      } else if (state.phase === "UTTERANCE") {
        state.phaseTimer += 1;
        f.energy = lerpV0(f.energy, 0.2, 0.05);
        f.twist = lerpV0(f.twist, 0.5, 0.05);
        f.entropy = lerpV0(f.entropy, 0.3, 0.05);

        if (state.phaseTimer === 10 && state.pendingEcho) {
          const echoNodes = [];
          for (let i = 0; i < 50; i += 1) {
            echoNodes.push(new CognitiveNodeTsV0(i, 50, true, 0.3));
          }
          const echoColor =
            INTENT_DICTIONARY_V0[state.pendingEcho.intent]?.color || [255, 255, 255];
          state.echoClusters.push({
            nodes: echoNodes,
            orbitAngle: Math.random() * Math.PI * 2,
            orbitSpeed: 0.003 + Math.random() * 0.005,
            distance: 1.8 + Math.random() * 0.5,
            color: echoColor
          });

          state.mainNodes.forEach((node) => {
            node.baseX = lerpV0(node.baseX, node.x, 0.5);
            node.baseY = lerpV0(node.baseY, node.y, 0.5);
            node.baseZ = lerpV0(node.baseZ, node.z, 0.5);
          });
        }

        if (state.phaseTimer > 100) {
          state.phase = "DRIFT";
          setPhaseUI("DRIFT");
          state.pendingEcho = null;
        }
      } else {
        f.energy = lerpV0(f.energy, 0.05, 0.02);
      }

      const driftPulse = Math.sin(time * 0.001) * 0.02;
      const activeEnergy = Math.max(0.05 + driftPulse, f.energy);

      state.rotation.y += 0.002 + activeEnergy * 0.02;
      state.rotation.x += 0.001 + activeEnergy * 0.01;

      const allProjectedNodes = [];

      state.mainNodes.forEach((node) => {
        let nx = node.baseX;
        let ny = node.baseY;
        let nz = node.baseZ;

        if (f.entropy > 0) {
          const noise = Math.sin(nx * 15 + time * 0.01) * activeEnergy * f.entropy;
          nx += nx * noise;
          ny += ny * noise;
          nz += nz * noise;
        }
        if (f.twist > 0) {
          const angle = activeEnergy * f.twist * ny * Math.PI;
          const tx = nx * Math.cos(angle) - nz * Math.sin(angle);
          const tz = nx * Math.sin(angle) + nz * Math.cos(angle);
          nx = tx;
          nz = tz;
        }
        if (f.fold > 0) {
          const dist = Math.sqrt(nx * nx + ny * ny + nz * nz);
          const foldF = Math.max(0.2, 1 - (activeEnergy * f.fold) / (dist + 0.1));
          nx *= foldF;
          ny *= foldF;
          nz *= foldF;
        }

        const currentRadius = 180 * (1 + activeEnergy * 0.5);
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

        allProjectedNodes.push({
          px: cx + rx * currentRadius * scale,
          py: cy + ry * currentRadius * scale,
          rz,
          scale,
          isEcho: false,
          color: f.dominantColor,
          opacity: activeEnergy
        });
      });

      state.echoClusters.forEach((cluster) => {
        cluster.orbitAngle += cluster.orbitSpeed;
        const orbitX = Math.cos(cluster.orbitAngle) * cluster.distance;
        const orbitZ = Math.sin(cluster.orbitAngle) * cluster.distance;
        const orbitY = Math.sin(time * 0.001 + cluster.orbitAngle) * 0.5;

        cluster.nodes.forEach((node) => {
          let nx = node.baseX + orbitX;
          let ny = node.baseY + orbitY;
          let nz = node.baseZ + orbitZ;

          const pulse = 1 + Math.sin(time * 0.002) * 0.1;
          const currentRadius = 180 * pulse;

          let ry = ny * Math.cos(state.rotation.x) - nz * Math.sin(state.rotation.x);
          let rz = ny * Math.sin(state.rotation.x) + nz * Math.cos(state.rotation.x);
          let rx = nx * Math.cos(state.rotation.y) + rz * Math.sin(state.rotation.y);
          rz = -nx * Math.sin(state.rotation.y) + rz * Math.cos(state.rotation.y);

          const fov = 400;
          const depth = Math.max(1, fov + rz * currentRadius);
          const scale = fov / depth;

          allProjectedNodes.push({
            px: cx + rx * currentRadius * scale,
            py: cy + ry * currentRadius * scale,
            rz,
            scale,
            isEcho: true,
            color: cluster.color,
            opacity: 0.8
          });
        });
      });

      allProjectedNodes.sort((a, b) => b.rz - a.rz);

      ctx.lineWidth = 0.5;

      for (let i = 0; i < allProjectedNodes.length; i += 1) {
        for (let j = i + 1; j < allProjectedNodes.length && j < i + 15; j += 1) {
          const n1 = allProjectedNodes[i];
          const n2 = allProjectedNodes[j];
          const dx = n1.px - n2.px;
          const dy = n1.py - n2.py;
          const distSq = dx * dx + dy * dy;
          const maxDist = n1.isEcho || n2.isEcho ? 6000 : 12000;

          if (distSq < maxDist) {
            const alpha = (1 - distSq / maxDist) * n1.scale;
            const r = n1.color[0];
            const g = n1.color[1];
            const b = n1.color[2];
            const opacityMultiplier =
              n1.isEcho !== n2.isEcho ? 0.2 : 0.4 + activeEnergy;

            ctx.strokeStyle = `rgba(${r}, ${g}, ${b}, ${alpha * opacityMultiplier})`;
            ctx.beginPath();
            ctx.moveTo(n1.px, n1.py);
            ctx.lineTo(n2.px, n2.py);
            ctx.stroke();
          }
        }
      }

      allProjectedNodes.forEach((pn) => {
        ctx.beginPath();
        const nodeSize = pn.isEcho
          ? Math.max(0.5, 1.5 * pn.scale)
          : Math.max(0.5, 2 * pn.scale * (1 + f.entropy));
        ctx.arc(pn.px, pn.py, nodeSize, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255, 255, 255, ${0.4 * pn.scale + (pn.isEcho ? 0.4 : activeEnergy)})`;
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
  }, []);

  const handleInputSubmit = (e) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    const userInput = inputText.trim().toLowerCase();
    setInputText("");
    setPhaseUI("INGESTION");

    const state = engineState.current;
    state.phase = "INGESTION";
    state.phaseTimer = 0;

    const dominantIntent = resolveTemporalDominantIntentV0(userInput);
    state.currentIntent = dominantIntent;
    state.field.dominantColor = dominantIntent.color;
    state.pendingEcho = resolveTemporalPendingEchoV0(userInput);
  };

  return (
    <div
      className="relative flex h-screen w-full flex-col justify-end overflow-hidden bg-[#020204] select-none"
      data-temporal-semantic-example-v0="1"
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
          disabled={phaseUI !== "DRIFT"}
          className="w-full border-0 border-t border-white/10 bg-transparent py-3 text-transparent caret-fuchsia-400/70 outline-none disabled:opacity-0"
          autoComplete="off"
          spellCheck={false}
        />
      </form>
    </div>
  );
}

export default TemporalSemanticEngineExampleV0;
