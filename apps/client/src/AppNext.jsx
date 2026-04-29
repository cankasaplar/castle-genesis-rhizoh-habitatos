import React, { useState, useRef, useEffect, useSyncExternalStore, memo } from "react";
import * as THREE from "three";
import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth, signInAnonymously, onAuthStateChanged, signInWithCustomToken } from "firebase/auth";
import { getFirestore, collection, onSnapshot, query, addDoc, serverTimestamp } from "firebase/firestore";
import { Atom, Zap, Binary, Waves, Mic } from "lucide-react";

const CODEX_VERSION = "vNext-521.Alpha-Production-Solid";
const CODEX_DATE = "2025-07-12";
const GLOBE_RADIUS = 3000;
const MAX_INSTANCES = 50000;
const WS_URL = import.meta.env.VITE_GATEWAY_WS_URL || "ws://localhost:8090";
const YOUTUBE_LIVE_URL = "https://www.youtube.com/@CastleGenesis/live";

const firebaseConfig = typeof __firebase_config !== "undefined" ? JSON.parse(__firebase_config) : null;
const hasFirebaseConfig = Boolean(firebaseConfig && Object.keys(firebaseConfig).length > 0);
const fbApp = hasFirebaseConfig ? (getApps().length === 0 ? initializeApp(firebaseConfig) : getApp()) : null;
const auth = fbApp ? getAuth(fbApp) : null;
const db = fbApp ? getFirestore(fbApp) : null;
const appId = typeof __app_id !== "undefined" ? __app_id : "castle-vnext-core";

class PhysicsCore {
  static MAX = MAX_INSTANCES;
  static posX = new Float32Array(this.MAX);
  static posY = new Float32Array(this.MAX);
  static posZ = new Float32Array(this.MAX);
  static velX = new Float32Array(this.MAX);
  static velY = new Float32Array(this.MAX);
  static velZ = new Float32Array(this.MAX);
  static state = new Uint8Array(this.MAX);
  static isDirty = new Uint8Array(this.MAX);
  static idToIndex = new Map();
  static indexToId = new Array(this.MAX);
  static activeCount = 0;
  static simTime = 0;
  static allocate(id, stateCode = 1) {
    if (this.idToIndex.has(id)) return this.idToIndex.get(id);
    if (this.activeCount >= this.MAX) return -1;
    const idx = this.activeCount++;
    this.idToIndex.set(id, idx);
    this.indexToId[idx] = id;
    this.posX[idx] = (Math.random() - 0.5) * 4000;
    this.posY[idx] = 3500;
    this.posZ[idx] = (Math.random() - 0.5) * 4000;
    this.velX[idx] = (Math.random() - 0.5) * 5;
    this.velY[idx] = (Math.random() - 0.5) * 5;
    this.velZ[idx] = (Math.random() - 0.5) * 5;
    this.state[idx] = stateCode;
    this.isDirty[idx] = 1;
    return idx;
  }
  static tick(dt) {
    const safeDt = Number.isFinite(dt) ? Math.max(0.0001, Math.min(dt, 0.05)) : 0.016;
    const timeScale = safeDt * 60;
    this.simTime += safeDt;
    const targetRadius = GLOBE_RADIUS + 400;
    const k = 0.008;
    const damping = Math.pow(0.99, timeScale);
    for (let i = 0; i < this.activeCount; i++) {
      if (!this.state[i]) continue;
      this.posX[i] += this.velX[i] * timeScale;
      this.posY[i] += this.velY[i] * timeScale;
      this.posZ[i] += this.velZ[i] * timeScale;
      const px = this.posX[i], py = this.posY[i], pz = this.posZ[i];
      const dist = Math.sqrt(px * px + py * py + pz * pz);
      if (dist > 10) {
        const pull = -k * (dist - targetRadius) * timeScale;
        this.velX[i] += (px / dist) * pull;
        this.velY[i] += (py / dist) * pull;
        this.velZ[i] += (pz / dist) * pull;
      }
      this.velX[i] *= damping;
      this.velY[i] *= damping;
      this.velZ[i] *= damping;
      this.isDirty[i] = 1;
    }
  }
}

const createStore = (initialState, reducer) => {
  let state = { ...initialState };
  const listeners = new Set();
  return {
    getState: () => state,
    subscribe: (cb) => {
      listeners.add(cb);
      return () => listeners.delete(cb);
    },
    dispatch: (action) => {
      const next = reducer(state, action);
      if (next !== state) {
        state = next;
        listeners.forEach((l) => l());
      }
    }
  };
};

class RhizohBrainV9 {
  static process(input) {
    const t = input.trim().toUpperCase();
    if (!t) return null;
    if (/(YARAT|OLUSTUR|SPAWN|EKLE)/.test(t)) return { intent: "SPAWN_ENTITY" };
    if (/(SES|AUDIO)/.test(t)) return { intent: "VOICE_SYNC" };
    if (/(NARRATIVE|GOREV|MISSION)/.test(t)) return { intent: "NARRATIVE_TASK" };
    return null;
  }
}

class NarrativeAgent {
  static roles = ["SCOUT", "BUILDER", "DEFENDER", "BROADCASTER"];
  static assign(agentsMap) {
    const agents = [...agentsMap.values()];
    return {
      mission: "Rhizoh arc: stabilize SpiralMMO shard, secure castles, and prepare broadcast cues.",
      assignments: agents.map((a, i) => ({
        id: a.id,
        role: this.roles[i % this.roles.length],
        task: ["Scout routes", "Build objectives", "Defend nexus", "Sync YouTube cue"][i % 4]
      }))
    };
  }
}

const uiStore = createStore(
  { user: null, logs: [{ ts: CODEX_DATE, type: "SYS", data: "Kernel booted." }], agents: new Map(), mission: "", assignments: [], net: { gateway: "offline" } },
  (state, action) => {
    switch (action.type) {
      case "SET_USER":
        return { ...state, user: action.payload };
      case "AGENT_UPSERT": {
        const n = new Map(state.agents);
        n.set(action.payload.id, action.payload);
        return { ...state, agents: n };
      }
      case "SET_LOG":
        return { ...state, logs: [action.payload, ...state.logs].slice(0, 50) };
      case "SET_NET":
        return { ...state, net: { ...state.net, ...action.payload } };
      case "SET_NARRATIVE":
        return { ...state, mission: action.payload.mission, assignments: action.payload.assignments };
      default:
        return state;
    }
  }
);

const useUISelector = (selector) => useSyncExternalStore(uiStore.subscribe, () => selector(uiStore.getState()), () => selector(uiStore.getState()));

class ApexEngine {
  constructor(container) {
    this.container = container;
    this.active = true;
    this._p = new THREE.Vector3();
    this._q = new THREE.Quaternion();
    this._s = new THREE.Vector3();
    this._m = new THREE.Matrix4();
    this._e = new THREE.Euler();
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(45, container.clientWidth / container.clientHeight, 50, 400000);
    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    this.renderer.setSize(container.clientWidth, container.clientHeight);
    this.container.appendChild(this.renderer.domElement);
    this.scene.add(new THREE.AmbientLight(0xffffff, 1.2));
    const d = new THREE.DirectionalLight(0x00ffff, 4);
    d.position.set(10000, 10000, 10000);
    this.scene.add(d);
    this.globe = new THREE.Mesh(new THREE.SphereGeometry(GLOBE_RADIUS, 64, 64), new THREE.MeshStandardMaterial({ color: 0x051020, emissive: 0x0a1a3f }));
    this.scene.add(this.globe);
    this.instances = new THREE.InstancedMesh(new THREE.IcosahedronGeometry(120, 1), new THREE.MeshStandardMaterial({ roughness: 0, metalness: 1 }), PhysicsCore.MAX);
    this.scene.add(this.instances);
    this.loop = this.loop.bind(this);
    this.loop();
  }
  handleResize() {
    const w = this.container.clientWidth;
    const h = this.container.clientHeight;
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(w, h);
  }
  loop() {
    if (!this.active) return;
    requestAnimationFrame(this.loop);
    for (let i = 0; i < PhysicsCore.activeCount; i++) {
      if (!PhysicsCore.state[i]) continue;
      this._p.set(PhysicsCore.posX[i], PhysicsCore.posY[i], PhysicsCore.posZ[i]);
      this._e.set(PhysicsCore.simTime * 0.8, PhysicsCore.velX[i] * 0.2, PhysicsCore.velZ[i] * 0.2);
      this._q.setFromEuler(this._e);
      this._s.setScalar(1.2);
      this._m.compose(this._p, this._q, this._s);
      this.instances.setMatrixAt(i, this._m);
    }
    this.instances.count = PhysicsCore.activeCount;
    this.instances.instanceMatrix.needsUpdate = true;
    const ang = PhysicsCore.simTime * 0.1;
    this.camera.position.set(Math.cos(ang) * 14000, 5000, Math.sin(ang) * 14000);
    this.camera.lookAt(0, 500, 0);
    this.renderer.render(this.scene, this.camera);
  }
  terminate() {
    this.active = false;
    if (this.container && this.renderer.domElement) this.container.removeChild(this.renderer.domElement);
    this.renderer.dispose();
    this.scene.clear();
  }
}

const FloatingWindow = memo(({ title, children, className = "" }) => (
  <div className={`pointer-events-auto bg-[#0a0f2a]/90 backdrop-blur-3xl border border-cyan-400/30 rounded-[1.5rem] p-4 shadow-[0_0_50px_rgba(0,255,255,0.12)] ${className}`}>
    <div className="text-[10px] text-cyan-300 tracking-[0.35em] mb-3 uppercase font-black">{title}</div>
    {children}
  </div>
));

export default function AppNext() {
  const [booted, setBooted] = useState(false);
  const [cmd, setCmd] = useState("");
  const [entityCount, setEntityCount] = useState(0);
  const containerRef = useRef(null);
  const engineRef = useRef(null);
  const mission = useUISelector((s) => s.mission);
  const assignments = useUISelector((s) => s.assignments);
  const logs = useUISelector((s) => s.logs);
  const net = useUISelector((s) => s.net);

  useEffect(() => {
    const ws = new WebSocket(WS_URL);
    ws.onopen = () => uiStore.dispatch({ type: "SET_NET", payload: { gateway: "live" } });
    ws.onclose = () => uiStore.dispatch({ type: "SET_NET", payload: { gateway: "offline" } });
    ws.onerror = () => uiStore.dispatch({ type: "SET_NET", payload: { gateway: "error" } });
    ws.onmessage = (e) => {
      try {
        const msg = JSON.parse(e.data);
        if (msg.type === "WORLD_SNAPSHOT") for (const a of msg.payload?.agents || []) uiStore.dispatch({ type: "AGENT_UPSERT", payload: { id: a.id, state: "ACTIVE" } });
      } catch {}
    };
    const ro = new ResizeObserver(() => engineRef.current?.handleResize());
    (async () => {
      if (auth && db) {
        try {
          if (typeof __initial_auth_token !== "undefined" && __initial_auth_token) await signInWithCustomToken(auth, __initial_auth_token);
          else await signInAnonymously(auth);
        } catch {}
        onAuthStateChanged(auth, (u) => u && uiStore.dispatch({ type: "SET_USER", payload: u }));
        onSnapshot(query(collection(db, "artifacts", appId, "public", "data", "agents")), (snap) => {
          snap.docChanges().forEach((chg) => {
            if (chg.type === "added" || chg.type === "modified") {
              const d = chg.doc.data();
              PhysicsCore.allocate(d.id, 1);
              uiStore.dispatch({ type: "AGENT_UPSERT", payload: { id: d.id, state: "ACTIVE" } });
            }
          });
        });
      } else {
        uiStore.dispatch({ type: "SET_LOG", payload: { ts: new Date().toLocaleTimeString(), type: "WARN", data: "Firebase config missing. Running local-only mode." } });
      }
      for (let i = 0; i < 24; i++) PhysicsCore.allocate(`REP-SEED-${i}`, 1);
      if (containerRef.current && !engineRef.current) {
        engineRef.current = new ApexEngine(containerRef.current);
        ro.observe(containerRef.current);
      }
      setBooted(true);
    })();
    let raf;
    let last = performance.now();
    let acc = 0;
    const fixed = 1 / 60;
    const loop = (now) => {
      let dt = (now - last) / 1000;
      last = now;
      if (dt > 0.25) dt = 0.25;
      acc += dt;
      while (acc >= fixed) {
        PhysicsCore.tick(fixed);
        acc -= fixed;
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    const countTimer = setInterval(() => setEntityCount(PhysicsCore.activeCount), 500);
    return () => {
      clearInterval(countTimer);
      cancelAnimationFrame(raf);
      ro.disconnect();
      ws.close();
      engineRef.current?.terminate();
      engineRef.current = null;
    };
  }, []);

  const execute = async () => {
    const parsed = RhizohBrainV9.process(cmd);
    if (!parsed) return setCmd("");
    if (parsed.intent === "SPAWN_ENTITY") {
      const id = `AGT-${Date.now().toString(36)}`;
      PhysicsCore.allocate(id, 2);
      uiStore.dispatch({ type: "AGENT_UPSERT", payload: { id, state: "PENDING" } });
      if (db) {
        try {
          await addDoc(collection(db, "artifacts", appId, "public", "data", "commands"), { intent: parsed.intent, id, timestamp: serverTimestamp() });
        } catch {}
      }
    }
    if (parsed.intent === "NARRATIVE_TASK") uiStore.dispatch({ type: "SET_NARRATIVE", payload: NarrativeAgent.assign(uiStore.getState().agents) });
    setCmd("");
  };

  const open = (path) => window.open(path, "_blank", "noopener");

  return (
    <div className="h-screen w-full bg-[#010103] text-white font-mono overflow-hidden relative select-none uppercase font-black">
      <div ref={containerRef} className="absolute inset-0 z-0 bg-black" />
      <div className="absolute inset-0 z-20 pointer-events-none p-6">
        <div className="flex justify-between">
          <FloatingWindow title="Kernel Status" className="w-[360px]">
            <div className="text-[11px] text-white/70 space-y-2">
              <div className="flex justify-between"><span>Version</span><span className="text-cyan-300">{CODEX_VERSION}</span></div>
              <div className="flex justify-between"><span>Gateway</span><span className="text-cyan-300">{net.gateway}</span></div>
              <div className="flex justify-between"><span>Rendered Agents</span><span className="text-emerald-300">{entityCount}</span></div>
            </div>
            <div className="mt-3 grid grid-cols-2 gap-2">
              <button className="px-3 py-2 rounded-xl bg-cyan-400 text-black text-xs font-bold" onClick={() => open("/greenroom-ultimate.html")}>Studio</button>
              <button className="px-3 py-2 rounded-xl bg-purple-400 text-black text-xs font-bold" onClick={() => open("/octoai-studio.html")}>OCTO</button>
              <button className="px-3 py-2 rounded-xl bg-emerald-400 text-black text-xs font-bold" onClick={() => open("/spiralmmo-castlebyck.html")}>SpiralMMO</button>
              <button className="px-3 py-2 rounded-xl bg-rose-400 text-black text-xs font-bold" onClick={() => open(YOUTUBE_LIVE_URL)}>YouTube</button>
            </div>
          </FloatingWindow>
          <FloatingWindow title="Narrative Mission Board" className="w-[420px]">
            <div className="text-[11px] text-white/80 mb-2">{mission || "Run command: NARRATIVE GOREV DAGIT"}</div>
            <div className="max-h-40 overflow-auto space-y-2">
              {assignments.map((a) => <div key={a.id} className="text-[10px] border border-white/10 rounded-xl p-2"><div className="text-cyan-300">{a.id} · {a.role}</div><div className="text-white/60">{a.task}</div></div>)}
            </div>
          </FloatingWindow>
        </div>
        <div className="absolute left-6 bottom-24">
          <FloatingWindow title="Kernel Logs" className="w-[420px]">
            <div className="max-h-56 overflow-auto space-y-2">{logs.map((l, i) => <div key={i} className="text-[10px] text-white/65 border-b border-white/5 pb-1">{l.ts} · {l.type} · {l.data}</div>)}</div>
          </FloatingWindow>
        </div>
        <div className="absolute left-1/2 -translate-x-1/2 bottom-6 w-full max-w-5xl pointer-events-auto">
          <div className="bg-[#0a1b3a]/95 border border-cyan-400/40 p-3 rounded-[2.5rem] flex items-center gap-3 shadow-[0_0_80px_rgba(0,255,255,0.15)]">
            <button className="p-3 rounded-full bg-white/10"><Mic size={20} /></button>
            <div className="flex-1 relative">
              <input value={cmd} onChange={(e) => setCmd(e.target.value)} onKeyDown={(e) => e.key === "Enter" && execute()} placeholder="YARAT | SES | NARRATIVE GOREV DAGIT" className="w-full bg-transparent outline-none text-sm tracking-[0.25em] placeholder:text-white/20" />
              <Waves size={18} className="absolute right-2 top-1/2 -translate-y-1/2 text-cyan-300/60" />
            </div>
            <button onClick={execute} className="p-4 rounded-2xl bg-cyan-400 text-black"><Zap size={22} /></button>
          </div>
        </div>
      </div>
      {!booted && (
        <div className="absolute inset-0 z-[5000] bg-[#010103] flex flex-col items-center justify-center">
          <div className="relative mb-10 scale-[1.6]">
            <Atom size={100} className="text-cyan-400 animate-spin opacity-30" />
            <div className="absolute inset-0 flex items-center justify-center"><Binary size={34} className="text-white animate-pulse" /></div>
          </div>
          <div className="text-2xl font-black tracking-[0.8em] text-cyan-400/50 ml-[0.8em] animate-pulse uppercase italic">Production_Solid_Boot</div>
        </div>
      )}
    </div>
  );
}
