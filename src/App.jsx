import React, { useState, useRef, useEffect, useSyncExternalStore, memo } from 'react';
import * as THREE from 'three';
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, signInAnonymously, onAuthStateChanged, signInWithCustomToken } from 'firebase/auth';
import { getFirestore, collection, onSnapshot, query, addDoc, serverTimestamp, orderBy, limit } from 'firebase/firestore';
import { Atom, Zap, ShieldAlert, Mic, RadioTower, Waves, Send, VolumeX, ZapOff, Workflow } from 'lucide-react';

const CODEX_VERSION = 'vNext-509.Alpha-Engine-Hardened';
const CODEX_DATE = '2025-07-12';
const GLOBE_RADIUS = 3000;
const MAX_INSTANCES = 5000;

let firebaseConfig = {};
try {
  firebaseConfig = typeof __firebase_config !== 'undefined' ? JSON.parse(__firebase_config) : {};
} catch {
  firebaseConfig = {};
}
const hasFirebase = Boolean(firebaseConfig?.apiKey);
const fbApp = hasFirebase ? (getApps().length === 0 ? initializeApp(firebaseConfig) : getApp()) : null;
const auth = fbApp ? getAuth(fbApp) : null;
const db = fbApp ? getFirestore(fbApp) : null;
const appId = typeof __app_id !== 'undefined' ? __app_id : 'castle-vnext-acoustic';

class RhizohBrainV7 {
  static levenshtein(s1, s2) {
    const len1 = s1.length;
    const len2 = s2.length;
    const matrix = Array.from({ length: len1 + 1 }, () => new Int32Array(len2 + 1));
    for (let i = 0; i <= len1; i += 1) matrix[i][0] = i;
    for (let j = 0; j <= len2; j += 1) matrix[0][j] = j;
    for (let i = 1; i <= len1; i += 1) {
      for (let j = 1; j <= len2; j += 1) {
        const cost = s1[i - 1] === s2[j - 1] ? 0 : 1;
        matrix[i][j] = Math.min(matrix[i - 1][j] + 1, matrix[i][j - 1] + 1, matrix[i - 1][j - 1] + cost);
      }
    }
    return matrix[len1][len2];
  }

  static intentMap = {
    SPAWN_ENTITY: { keywords: ['YARAT', 'OLUSTUR', 'SPAWN', 'SUMMON', 'AJAN', 'BIRIM', 'EKLE', 'CREATE'], weight: 1.0 },
    VOICE_SYNC: { keywords: ['SES', 'SPATIAL', '3D_SES', 'VOICE', 'AUDIO', 'BAGLAN', 'MIKROFON'], weight: 1.2 },
    MEDIA_KERNEL: { keywords: ['YAYIN', 'LIVE', 'STREAM', 'CAMERA', 'GORUNTU'], weight: 1.0 },
    OS_COMMAND: { keywords: ['TERMINAL', 'SISTEM', 'RESET', 'SIFIRLA', 'REBOOT'], weight: 0.8 }
  };

  static async process(input, userContext) {
    const tokens = input.trim().toUpperCase().split(/\s+/).filter((t) => t.length > 1);
    if (tokens.length === 0) return null;
    let bestIntent = null;
    let maxScore = 0;
    Object.entries(this.intentMap).forEach(([intent, config]) => {
      let intentScore = 0;
      tokens.forEach((token) => {
        config.keywords.forEach((keyword) => {
          const dist = this.levenshtein(token, keyword);
          const similarity = 1 - (dist / Math.max(token.length, keyword.length));
          if (similarity > 0.6) intentScore += similarity;
        });
      });
      const finalScore = (intentScore / tokens.length) * config.weight;
      if (finalScore > maxScore) {
        maxScore = finalScore;
        bestIntent = intent;
      }
    });
    if (maxScore < 0.4) return null;
    return {
      intent: bestIntent,
      score: maxScore,
      timestamp: Date.now(),
      reasoning: [`FUZZY_MATCH: ${Math.round(maxScore * 100)}%`, `INTENT: ${bestIntent}`, `USER: ${(userContext.uid || 'guest').slice(0, 8)}`]
    };
  }
}

const createSecureStore = (initialState, reducer) => {
  let state = { ...initialState, version: 0 };
  const listeners = new Set();
  return {
    getState: () => state,
    subscribe: (cb) => {
      listeners.add(cb);
      return () => listeners.delete(cb);
    },
    dispatch: (action) => {
      const nextState = reducer(state, action);
      if (nextState !== state) {
        state = { ...nextState, version: state.version + 1 };
        listeners.forEach((l) => l());
      }
    }
  };
};

const worldReducer = (state, action) => {
  const ts = Date.now();
  switch (action.type) {
    case 'APPLY_TRUTH': {
      const nextAgents = { ...state.entities.agents };
      Object.entries(action.payload?.agents || {}).forEach(([id, data]) => {
        if (!nextAgents[id] || (data._v || 0) >= (nextAgents[id]._v || 0)) {
          nextAgents[id] = { ...nextAgents[id], ...data, _v: data._v || 0, _lastUpdate: ts };
        }
      });
      return { ...state, entities: { ...state.entities, agents: nextAgents }, sim: { ...state.sim, status: 'SYNCED' } };
    }
    case 'PREDICT': {
      const nextAgents = { ...state.entities.agents };
      Object.entries(action.payload?.agents || {}).forEach(([id, data]) => {
        nextAgents[id] = { ...nextAgents[id], ...data, _predicted: true, _v: (nextAgents[id]?._v || 0) + 1 };
      });
      return { ...state, entities: { ...state.entities, agents: nextAgents }, sim: { ...state.sim, status: 'PREDICTING' } };
    }
    case 'TICK':
      return { ...state, sim: { ...state.sim, frame: state.sim.frame + 1, time: Number((state.sim.time + action.dt).toFixed(3)) } };
    default:
      return state;
  }
};

const uiReducer = (state, action) => {
  switch (action.type) {
    case 'SET_USER': return { ...state, user: action.payload };
    case 'SET_INTENT': return { ...state, activeIntent: action.payload };
    case 'ADD_LOG': return { ...state, logs: [action.payload, ...state.logs].slice(0, 50) };
    case 'TOGGLE_VIEW': return { ...state, viewMode: state.viewMode === 'CITIZEN' ? 'DEVELOPER' : 'CITIZEN' };
    case 'SET_MEDIA': return { ...state, ...action.payload };
    default: return state;
  }
};

const worldStore = createSecureStore({ entities: { agents: {}, castles: {} }, sim: { frame: 0, time: 0, status: 'BOOTING', activeShard: 'ZION-01' } }, worldReducer);
const uiStore = createSecureStore({ user: null, logs: [{ ts: CODEX_DATE, type: 'SYS', data: 'Engine-Hardened v509 Online.' }], viewMode: 'CITIZEN', isMediaActive: false, isSpatialAudioEnabled: false }, uiReducer);

const useStoreSelector = (store, selector) =>
  useSyncExternalStore(store.subscribe, () => selector(store.getState()), () => selector(store.getState()));

class ApexEngine {
  constructor(container) {
    this.container = container;
    this.active = true;
    this.hashCache = new Map();
    this.renderCache = new Map();
    this.reusableColor = new THREE.Color();
    this.dummy = new THREE.Object3D();
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(45, container.clientWidth / container.clientHeight, 10, 200000);
    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
    this.renderer.setSize(container.clientWidth, container.clientHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.container.appendChild(this.renderer.domElement);
    this.setupWorld();
    this.setupInstancing();
    this.renderLoop = this.renderLoop.bind(this);
    this.renderLoop();
  }

  setupWorld() {
    this.globe = new THREE.Mesh(new THREE.SphereGeometry(GLOBE_RADIUS, 48, 48), new THREE.MeshStandardMaterial({ color: 0x01050a, emissive: 0x051122, roughness: 0.3, metalness: 0.7, transparent: true, opacity: 0.75 }));
    this.scene.add(this.globe);
    this.shieldRing = new THREE.Mesh(new THREE.RingGeometry(GLOBE_RADIUS + 300, GLOBE_RADIUS + 310, 48), new THREE.MeshBasicMaterial({ color: 0x22d3ee, side: THREE.DoubleSide, transparent: true, opacity: 0.15 }));
    this.shieldRing.rotation.x = Math.PI / 2;
    this.scene.add(this.shieldRing);
    this.scene.add(new THREE.AmbientLight(0xffffff, 0.4));
    const pLight = new THREE.PointLight(0x22d3ee, 2, 20000);
    pLight.position.set(5000, 5000, 5000);
    this.scene.add(pLight);
  }

  setupInstancing() {
    this.agentInstances = new THREE.InstancedMesh(new THREE.IcosahedronGeometry(75, 1), new THREE.MeshPhongMaterial({ shininess: 80, vertexColors: true }), MAX_INSTANCES);
    this.agentInstances.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    this.scene.add(this.agentInstances);
  }

  getAgentHash(id) {
    if (!this.hashCache.has(id)) this.hashCache.set(id, id.split('').reduce((a, b) => a + b.charCodeAt(0), 0));
    return this.hashCache.get(id);
  }

  handleResize() {
    if (!this.container) return;
    const width = this.container.clientWidth;
    const height = this.container.clientHeight;
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
  }

  renderLoop() {
    if (!this.active) return;
    requestAnimationFrame(this.renderLoop);
    const state = worldStore.getState();
    const agents = Object.values(state.entities.agents || {});
    const time = performance.now() * 0.001;
    const activeCount = Math.min(agents.length, MAX_INSTANCES);
    const dirtyColorIndices = [];

    for (let i = 0; i < activeCount; i += 1) {
      const agent = agents[i];
      const h = this.getAgentHash(agent.id);
      this.dummy.position.set(Math.cos(h + time * 0.1) * (GLOBE_RADIUS + 400), Math.sin(h * 0.4) * 1500, Math.sin(h + time * 0.1) * (GLOBE_RADIUS + 400));
      this.dummy.rotation.set(time * 0.2, time * 0.1, 0);
      this.dummy.updateMatrix();
      this.agentInstances.setMatrixAt(i, this.dummy.matrix);
      const cached = this.renderCache.get(agent.id);
      if (!cached || cached.state !== agent.state || cached._v !== agent._v) {
        this.renderCache.set(agent.id, { state: agent.state, _v: agent._v });
        dirtyColorIndices.push(i);
      }
    }

    if (activeCount > 0) {
      this.agentInstances.count = activeCount;
      this.agentInstances.instanceMatrix.needsUpdate = true;
      if (dirtyColorIndices.length > 0) {
        dirtyColorIndices.forEach((idx) => {
          const agent = agents[idx];
          this.reusableColor.set(agent.state === 'OFFLINE' ? 0x440000 : 0x22d3ee);
          this.agentInstances.setColorAt(idx, this.reusableColor);
        });
        this.agentInstances.instanceColor.needsUpdate = true;
      }
    }

    this.camera.position.set(Math.cos(time * 0.04) * 9000, 3000, Math.sin(time * 0.04) * 9000);
    this.camera.lookAt(0, 0, 0);
    this.shieldRing.rotation.z += 0.0003;
    this.renderer.render(this.scene, this.camera);
  }

  terminate() {
    this.active = false;
    this.scene.traverse((obj) => {
      if (obj.geometry) obj.geometry.dispose();
      if (obj.material) {
        if (Array.isArray(obj.material)) obj.material.forEach((m) => m.dispose());
        else obj.material.dispose();
      }
    });
    if (this.container && this.renderer.domElement && this.renderer.domElement.parentNode === this.container) {
      this.container.removeChild(this.renderer.domElement);
    }
    this.renderer.dispose();
    this.scene.clear();
    this.renderCache.clear();
    this.hashCache.clear();
  }
}

class MediaKernel {
  constructor() { this.stream = null; }
  async activate() {
    try {
      this.stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      return true;
    } catch {
      return false;
    }
  }
  stop() {
    this.stream?.getTracks().forEach((t) => t.stop());
    this.stream = null;
  }
}

class CommandBus {
  static userThrottles = new Map();
  static userBursts = new Map();
  static async dispatch(command, refs) {
    const { uiStore, worldStore, db, appId, mediaRef } = refs;
    const userId = uiStore.getState().user?.uid || 'guest';
    const now = Date.now();
    const throttleKey = `${userId}_${command.intent}`;
    const lastTime = this.userThrottles.get(throttleKey) || 0;
    if (now - lastTime < 1000) return;
    this.userThrottles.set(throttleKey, now);
    const prev = this.userBursts.get(userId) || { t: now, n: 0 };
    const next = now - prev.t > 5000 ? { t: now, n: 1 } : { t: prev.t, n: prev.n + 1 };
    this.userBursts.set(userId, next);
    if (next.n > 12) return;

    uiStore.dispatch({ type: 'SET_INTENT', payload: command });
    const nonce = Math.random().toString(36).substring(7).toUpperCase();
    if (command.intent === 'SPAWN_ENTITY') {
      const id = `AGT-${nonce}`;
      worldStore.dispatch({ type: 'PREDICT', payload: { agents: { [id]: { id, state: 'ACTIVE' } } } });
      if (db) await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'commands'), { intent: command.intent, id, clientTs: now, nonce, userId, timestamp: serverTimestamp() });
    } else if (command.intent === 'VOICE_SYNC') {
      const success = await mediaRef.current.activate();
      uiStore.dispatch({ type: 'SET_MEDIA', payload: { isSpatialAudioEnabled: success, isMediaActive: success } });
    } else if (command.intent === 'OS_COMMAND') {
      uiStore.dispatch({ type: 'ADD_LOG', payload: { ts: new Date().toLocaleTimeString(), type: 'SYS', data: 'Secure Kernel Reset Requested.' } });
    }
  }
}

const LogList = memo(() => {
  const logs = useStoreSelector(uiStore, (s) => s.logs);
  return logs.map((l, i) => (
    <div key={i} className="text-[9px] text-white/40 font-mono flex gap-2">
      <span className="text-cyan-500">›</span> {l.data}
    </div>
  ));
});

const VoiceList = memo(() => {
  const isAudio = useStoreSelector(uiStore, (s) => s.isSpatialAudioEnabled);
  return isAudio ? (
    <div className="text-[10px] text-cyan-400 animate-pulse">SHARD_ACOUSTIC_MESH_CONNECTED</div>
  ) : (
    <div className="text-[10px] text-rose-500/50 flex items-center gap-2"><ZapOff size={14} /> ACOUSTIC_OFF</div>
  );
});

const SovereignHud = memo(() => {
  const viewMode = useStoreSelector(uiStore, (s) => s.viewMode);
  const isSpatialAudioEnabled = useStoreSelector(uiStore, (s) => s.isSpatialAudioEnabled);
  const activeShard = useStoreSelector(worldStore, (s) => s.sim.activeShard);
  return (
    <div className="flex flex-col gap-6 pointer-events-auto">
      <div className="bg-[#050508]/90 backdrop-blur-3xl border border-white/10 p-6 rounded-[2.5rem] flex items-center gap-6 shadow-4xl animate-in ring-1 ring-white/5">
        <div onClick={() => uiStore.dispatch({ type: 'TOGGLE_VIEW' })} className={`p-5 rounded-3xl cursor-pointer transition-all duration-700 ${viewMode === 'DEVELOPER' ? 'bg-rose-500' : 'bg-emerald-500 shadow-[0_0_20px_#10b981]'}`}>
          {viewMode === 'DEVELOPER' ? <ShieldAlert size={28} className="text-black" /> : <Waves size={28} className="text-black animate-pulse" />}
        </div>
        <div className="text-left">
          <div className="flex items-center gap-3 mb-1">
            <h1 className="text-xl font-black tracking-widest text-white uppercase">{viewMode}</h1>
            <div className={`px-2 py-0.5 rounded-full text-[8px] font-black ${isSpatialAudioEnabled ? 'bg-cyan-500/20 text-cyan-400' : 'bg-white/10'}`}>
              {isSpatialAudioEnabled ? 'AUDIO_ON' : 'AUDIO_OFF'}
            </div>
          </div>
          <div className="text-[8px] font-black text-white/20 uppercase tracking-[0.3em]">SHARD: {activeShard} • BUILD: {CODEX_VERSION}</div>
        </div>
      </div>
      <div className="bg-black/80 backdrop-blur-3xl border border-white/10 p-8 rounded-[3rem] w-[420px] text-left shadow-4xl border-t-white/5">
        <div className="text-[10px] text-white/20 tracking-[0.4em] mb-6 flex items-center gap-2 uppercase font-black">
          <Send size={14} className="text-cyan-400" /> Hardened_System_Logs
        </div>
        <div className="space-y-3 max-h-60 overflow-y-auto no-scrollbar">
          <LogList />
        </div>
      </div>
    </div>
  );
});

export default function App() {
  const [booted, setBooted] = useState(false);
  const [cmd, setCmd] = useState('');
  const containerRef = useRef(null);
  const engineRef = useRef(null);
  const mediaRef = useRef(new MediaKernel());
  const unsubAuthRef = useRef(null);
  const unsubRealityRef = useRef(null);

  useEffect(() => {
    let isMounted = true;
    const resizeObserver = new ResizeObserver(() => engineRef.current?.handleResize());
    const init = async () => {
      try {
        if (!auth) {
          uiStore.dispatch({ type: 'SET_USER', payload: { uid: 'guest' } });
        } else if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) {
          await signInWithCustomToken(auth, __initial_auth_token);
        } else {
          await signInAnonymously(auth);
        }
        if (auth) {
          unsubAuthRef.current = onAuthStateChanged(auth, (user) => {
            if (!user || !isMounted) return;
            uiStore.dispatch({ type: 'SET_USER', payload: user });
            if (!db) return;
            unsubRealityRef.current?.();
            const realityRef = collection(db, 'artifacts', appId, 'public', 'data', 'reality_events');
            unsubRealityRef.current = onSnapshot(query(realityRef, orderBy('createdAt', 'desc'), limit(1)), (snap) => {
              if (!snap.empty && isMounted) worldStore.dispatch({ type: 'APPLY_TRUTH', payload: snap.docs[0].data().entities });
            });
          });
        }
      } catch {
        uiStore.dispatch({ type: 'ADD_LOG', payload: { ts: new Date().toLocaleTimeString(), type: 'ERR', data: 'INIT_SYNC_FAIL' } });
      }

      worldStore.dispatch({ type: 'APPLY_TRUTH', payload: { agents: Array.from({ length: 25 }).reduce((acc, _, i) => {
        acc[`AGENT-${i}`] = { id: `AGENT-${i}`, state: 'ACTIVE', _v: 0 };
        return acc;
      }, {}) } });

      if (containerRef.current && !engineRef.current) {
        engineRef.current = new ApexEngine(containerRef.current);
        resizeObserver.observe(containerRef.current);
        if (isMounted) setBooted(true);
      }
    };

    const tickId = window.setInterval(() => worldStore.dispatch({ type: 'TICK', dt: 1 / 20 }), 50);
    init();
    return () => {
      isMounted = false;
      window.clearInterval(tickId);
      unsubAuthRef.current?.();
      unsubRealityRef.current?.();
      resizeObserver.disconnect();
      if (engineRef.current) engineRef.current.terminate();
      engineRef.current = null;
      mediaRef.current.stop();
    };
  }, []);

  const handleExecute = async () => {
    if (!cmd.trim()) return;
    const user = uiStore.getState().user || { uid: 'guest' };
    const interpretation = await RhizohBrainV7.process(cmd, user);
    if (interpretation) await CommandBus.dispatch(interpretation, { uiStore, worldStore, db, appId, mediaRef });
    setCmd('');
  };

  const isMediaActive = useStoreSelector(uiStore, (s) => s.isMediaActive);

  return (
    <div className="h-screen w-full bg-[#010103] text-white font-mono overflow-hidden relative select-none uppercase font-black selection:bg-cyan-500/30">
      <div ref={containerRef} className="absolute inset-0 z-0 bg-black" />
      <div className="absolute inset-0 z-10 pointer-events-none p-12 flex flex-col justify-between">
        <div className="flex justify-between items-start">
          <SovereignHud />
          <div className="flex flex-col gap-6 pointer-events-auto w-80 text-left">
            <div className="bg-black/80 backdrop-blur-3xl border border-white/10 p-8 rounded-[3rem] shadow-4xl border-t-white/5">
              <div className="text-[10px] text-white/20 tracking-[0.4em] mb-8 flex items-center gap-2 uppercase font-black">
                <RadioTower size={14} className="text-emerald-400" /> Shard_Acoustics
              </div>
              <VoiceList />
            </div>
            {isMediaActive && <div className="w-80 aspect-video bg-black rounded-[2.5rem] border border-emerald-500/20 overflow-hidden relative shadow-4xl animate-in" />}
          </div>
        </div>
        <div className="flex justify-center mb-6">
          <div className="w-full max-w-5xl bg-[#0a0a10]/98 border border-white/10 p-3 rounded-[4rem] flex items-center shadow-4xl backdrop-blur-4xl ring-1 ring-white/10 pointer-events-auto">
            <button className="ml-5 p-5 hover:bg-white/5 rounded-full text-white/30 transition-all active:scale-90">
              <Mic size={26} />
            </button>
            <div className="flex-1 px-8 relative">
              <input value={cmd} onChange={(e) => setCmd(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleExecute()} placeholder="COMMAND AUTHORIZED. RHIZOH OS LISTENING..." className="w-full bg-transparent border-none outline-none text-sm font-black tracking-[0.4em] text-white uppercase placeholder:text-white/5" />
              <Waves size={18} className="absolute right-0 top-1/2 -translate-y-1/2 text-cyan-400 opacity-20" />
            </div>
            <button onClick={handleExecute} className="p-6 bg-white rounded-[2.8rem] hover:bg-emerald-400 transition-all text-black shadow-2xl active:scale-95 group">
              <Zap size={32} className="group-hover:scale-110 transition-transform" />
            </button>
          </div>
        </div>
      </div>
      {!booted && (
        <div className="absolute inset-0 z-[5000] bg-black flex flex-col items-center justify-center">
          <Atom size={100} className="text-cyan-400 animate-spin opacity-20 mb-16" />
          <div className="text-2xl font-black tracking-[2.5em] text-white/30 ml-[2.5em] animate-pulse uppercase">Hardening_Sovereign_OS</div>
        </div>
      )}
      <style>{`
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .shadow-4xl { box-shadow: 0 60px 180px rgba(0,0,0,0.95), 0 0 60px rgba(34, 211, 238, 0.04); }
        .animate-in { animation: pIn 1s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
        @keyframes pIn { from { opacity: 0; transform: translateY(30px); } to { opacity: 1; transform: translateY(0); } }
        input::placeholder { font-size: 10px; letter-spacing: 0.6em; opacity: 0.3; }
      `}</style>
    </div>
  );
}
import React, { useState, useRef, useEffect, useSyncExternalStore, memo } from 'react';
import * as THREE from 'three';
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, signInAnonymously, onAuthStateChanged, signInWithCustomToken } from 'firebase/auth';
import { getFirestore, collection, onSnapshot, query, addDoc, serverTimestamp, orderBy, limit } from 'firebase/firestore';
import { Atom, Zap, ShieldAlert, Mic, RadioTower, Waves, Send, VolumeX, ZapOff, Workflow } from 'lucide-react';

const CODEX_VERSION = 'vNext-509.Alpha-Engine-Hardened';
const CODEX_DATE = '2025-07-12';
const GLOBE_RADIUS = 3000;
const MAX_INSTANCES = 5000;

let firebaseConfig = {};
try {
  firebaseConfig = typeof __firebase_config !== 'undefined' ? JSON.parse(__firebase_config) : {};
} catch {
  firebaseConfig = {};
}
const hasFirebase = Boolean(firebaseConfig?.apiKey);
const fbApp = hasFirebase ? (getApps().length === 0 ? initializeApp(firebaseConfig) : getApp()) : null;
const auth = fbApp ? getAuth(fbApp) : null;
const db = fbApp ? getFirestore(fbApp) : null;
const appId = typeof __app_id !== 'undefined' ? __app_id : 'castle-vnext-acoustic';

class RhizohBrainV7 {
  static levenshtein(s1, s2) {
    const len1 = s1.length;
    const len2 = s2.length;
    const matrix = Array.from({ length: len1 + 1 }, () => new Int32Array(len2 + 1));
    for (let i = 0; i <= len1; i += 1) matrix[i][0] = i;
    for (let j = 0; j <= len2; j += 1) matrix[0][j] = j;
    for (let i = 1; i <= len1; i += 1) {
      for (let j = 1; j <= len2; j += 1) {
        const cost = s1[i - 1] === s2[j - 1] ? 0 : 1;
        matrix[i][j] = Math.min(matrix[i - 1][j] + 1, matrix[i][j - 1] + 1, matrix[i - 1][j - 1] + cost);
      }
    }
    return matrix[len1][len2];
  }

  static intentMap = {
    SPAWN_ENTITY: { keywords: ['YARAT', 'OLUSTUR', 'SPAWN', 'SUMMON', 'AJAN', 'BIRIM', 'EKLE', 'CREATE'], weight: 1.0 },
    VOICE_SYNC: { keywords: ['SES', 'SPATIAL', '3D_SES', 'VOICE', 'AUDIO', 'BAGLAN', 'MIKROFON'], weight: 1.2 },
    MEDIA_KERNEL: { keywords: ['YAYIN', 'LIVE', 'STREAM', 'CAMERA', 'GORUNTU'], weight: 1.0 },
    OS_COMMAND: { keywords: ['TERMINAL', 'SISTEM', 'RESET', 'SIFIRLA', 'REBOOT'], weight: 0.8 }
  };

  static async process(input, userContext) {
    const tokens = input.trim().toUpperCase().split(/\s+/).filter((t) => t.length > 1);
    if (tokens.length === 0) return null;
    let bestIntent = null;
    let maxScore = 0;

    Object.entries(this.intentMap).forEach(([intent, config]) => {
      let intentScore = 0;
      tokens.forEach((token) => {
        config.keywords.forEach((keyword) => {
          const dist = this.levenshtein(token, keyword);
          const similarity = 1 - (dist / Math.max(token.length, keyword.length));
          if (similarity > 0.6) intentScore += similarity;
        });
      });
      const finalScore = (intentScore / tokens.length) * config.weight;
      if (finalScore > maxScore) {
        maxScore = finalScore;
        bestIntent = intent;
      }
    });

    if (maxScore < 0.4) return null;
    return {
      intent: bestIntent,
      score: maxScore,
      timestamp: Date.now(),
      reasoning: [`FUZZY_MATCH: ${Math.round(maxScore * 100)}%`, `INTENT: ${bestIntent}`, `USER: ${(userContext.uid || 'guest').slice(0, 8)}`]
    };
  }
}

const createSecureStore = (initialState, reducer) => {
  let state = { ...initialState, version: 0 };
  const listeners = new Set();
  return {
    getState: () => state,
    subscribe: (cb) => {
      listeners.add(cb);
      return () => listeners.delete(cb);
    },
    dispatch: (action) => {
      const nextState = reducer(state, action);
      if (nextState !== state) {
        state = { ...nextState, version: state.version + 1 };
        listeners.forEach((l) => l());
      }
    }
  };
};

const worldReducer = (state, action) => {
  const ts = Date.now();
  switch (action.type) {
    case 'APPLY_TRUTH': {
      const nextAgents = { ...state.entities.agents };
      Object.entries(action.payload?.agents || {}).forEach(([id, data]) => {
        if (!nextAgents[id] || (data._v || 0) >= (nextAgents[id]._v || 0)) {
          nextAgents[id] = { ...nextAgents[id], ...data, _v: data._v || 0, _lastUpdate: ts };
        }
      });
      return { ...state, entities: { ...state.entities, agents: nextAgents }, sim: { ...state.sim, status: 'SYNCED' } };
    }
    case 'PREDICT': {
      const nextAgents = { ...state.entities.agents };
      Object.entries(action.payload?.agents || {}).forEach(([id, data]) => {
        nextAgents[id] = { ...nextAgents[id], ...data, _predicted: true, _v: (nextAgents[id]?._v || 0) + 1 };
      });
      return { ...state, entities: { ...state.entities, agents: nextAgents }, sim: { ...state.sim, status: 'PREDICTING' } };
    }
    case 'TICK':
      return { ...state, sim: { ...state.sim, frame: state.sim.frame + 1, time: Number((state.sim.time + action.dt).toFixed(3)) } };
    default:
      return state;
  }
};

const uiReducer = (state, action) => {
  switch (action.type) {
    case 'SET_USER':
      return { ...state, user: action.payload };
    case 'SET_INTENT':
      return { ...state, activeIntent: action.payload };
    case 'ADD_LOG':
      return { ...state, logs: [action.payload, ...state.logs].slice(0, 50) };
    case 'TOGGLE_VIEW':
      return { ...state, viewMode: state.viewMode === 'CITIZEN' ? 'DEVELOPER' : 'CITIZEN' };
    case 'SET_MEDIA':
      return { ...state, ...action.payload };
    default:
      return state;
  }
};

const worldStore = createSecureStore(
  { entities: { agents: {}, castles: {} }, sim: { frame: 0, time: 0, status: 'BOOTING', activeShard: 'ZION-01' } },
  worldReducer
);
const uiStore = createSecureStore(
  { user: null, logs: [{ ts: CODEX_DATE, type: 'SYS', data: 'Engine-Hardened v509 Online.' }], viewMode: 'CITIZEN', isMediaActive: false, isSpatialAudioEnabled: false },
  uiReducer
);

const useStoreSelector = (store, selector) =>
  useSyncExternalStore(
    store.subscribe,
    () => selector(store.getState()),
    () => selector(store.getState())
  );

class ApexEngine {
  constructor(container) {
    this.container = container;
    this.active = true;
    this.hashCache = new Map();
    this.renderCache = new Map();
    this.reusableColor = new THREE.Color();
    this.dummy = new THREE.Object3D();

    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(45, container.clientWidth / container.clientHeight, 10, 200000);
    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
    this.renderer.setSize(container.clientWidth, container.clientHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.container.appendChild(this.renderer.domElement);

    this.setupWorld();
    this.setupInstancing();
    this.renderLoop = this.renderLoop.bind(this);
    this.renderLoop();
  }

  setupWorld() {
    this.globe = new THREE.Mesh(
      new THREE.SphereGeometry(GLOBE_RADIUS, 48, 48),
      new THREE.MeshStandardMaterial({ color: 0x01050a, emissive: 0x051122, roughness: 0.3, metalness: 0.7, transparent: true, opacity: 0.75 })
    );
    this.scene.add(this.globe);
    this.shieldRing = new THREE.Mesh(
      new THREE.RingGeometry(GLOBE_RADIUS + 300, GLOBE_RADIUS + 310, 48),
      new THREE.MeshBasicMaterial({ color: 0x22d3ee, side: THREE.DoubleSide, transparent: true, opacity: 0.15 })
    );
    this.shieldRing.rotation.x = Math.PI / 2;
    this.scene.add(this.shieldRing);
    this.scene.add(new THREE.AmbientLight(0xffffff, 0.4));
    const pLight = new THREE.PointLight(0x22d3ee, 2, 20000);
    pLight.position.set(5000, 5000, 5000);
    this.scene.add(pLight);
  }

  setupInstancing() {
    this.agentInstances = new THREE.InstancedMesh(
      new THREE.IcosahedronGeometry(75, 1),
      new THREE.MeshPhongMaterial({ shininess: 80, vertexColors: true }),
      MAX_INSTANCES
    );
    this.agentInstances.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    this.scene.add(this.agentInstances);
  }

  getAgentHash(id) {
    if (!this.hashCache.has(id)) {
      this.hashCache.set(id, id.split('').reduce((a, b) => a + b.charCodeAt(0), 0));
    }
    return this.hashCache.get(id);
  }

  handleResize() {
    if (!this.container) return;
    const width = this.container.clientWidth;
    const height = this.container.clientHeight;
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
  }

  renderLoop() {
    if (!this.active) return;
    requestAnimationFrame(this.renderLoop);

    const state = worldStore.getState();
    const agents = Object.values(state.entities.agents || {});
    const time = performance.now() * 0.001;
    const activeCount = Math.min(agents.length, MAX_INSTANCES);
    const dirtyColorIndices = [];

    for (let i = 0; i < activeCount; i += 1) {
      const agent = agents[i];
      const h = this.getAgentHash(agent.id);
      const posX = Math.cos(h + time * 0.1) * (GLOBE_RADIUS + 400);
      const posY = Math.sin(h * 0.4) * 1500;
      const posZ = Math.sin(h + time * 0.1) * (GLOBE_RADIUS + 400);

      this.dummy.position.set(posX, posY, posZ);
      this.dummy.rotation.set(time * 0.2, time * 0.1, 0);
      this.dummy.updateMatrix();
      this.agentInstances.setMatrixAt(i, this.dummy.matrix);

      const cached = this.renderCache.get(agent.id);
      if (!cached || cached.state !== agent.state || cached._v !== agent._v) {
        this.renderCache.set(agent.id, { state: agent.state, _v: agent._v });
        dirtyColorIndices.push(i);
      }
    }

    if (activeCount > 0) {
      this.agentInstances.count = activeCount;
      this.agentInstances.instanceMatrix.needsUpdate = true;
      if (dirtyColorIndices.length > 0) {
        dirtyColorIndices.forEach((idx) => {
          const agent = agents[idx];
          this.reusableColor.set(agent.state === 'OFFLINE' ? 0x440000 : 0x22d3ee);
          this.agentInstances.setColorAt(idx, this.reusableColor);
        });
        this.agentInstances.instanceColor.needsUpdate = true;
      }
    }

    this.camera.position.set(Math.cos(time * 0.04) * 9000, 3000, Math.sin(time * 0.04) * 9000);
    this.camera.lookAt(0, 0, 0);
    this.shieldRing.rotation.z += 0.0003;
    this.renderer.render(this.scene, this.camera);
  }

  terminate() {
    this.active = false;
    this.scene.traverse((obj) => {
      if (obj.geometry) obj.geometry.dispose();
      if (obj.material) {
        if (Array.isArray(obj.material)) obj.material.forEach((m) => m.dispose());
        else obj.material.dispose();
      }
    });
    if (this.container && this.renderer.domElement && this.renderer.domElement.parentNode === this.container) {
      this.container.removeChild(this.renderer.domElement);
    }
    this.renderer.dispose();
    this.scene.clear();
    this.renderCache.clear();
    this.hashCache.clear();
  }
}

class MediaKernel {
  constructor() {
    this.stream = null;
  }
  async activate() {
    try {
      this.stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      return true;
    } catch {
      return false;
    }
  }
  stop() {
    this.stream?.getTracks().forEach((t) => t.stop());
    this.stream = null;
  }
}

class CommandBus {
  static userThrottles = new Map();
  static userBursts = new Map();

  static async dispatch(command, refs) {
    const { uiStore, worldStore, db, appId, mediaRef } = refs;
    const userId = uiStore.getState().user?.uid || 'guest';
    const now = Date.now();
    const throttleKey = `${userId}_${command.intent}`;
    const lastTime = this.userThrottles.get(throttleKey) || 0;
    if (now - lastTime < 1000) return;
    this.userThrottles.set(throttleKey, now);

    const burstKey = userId;
    const prev = this.userBursts.get(burstKey) || { t: now, n: 0 };
    const next = now - prev.t > 5000 ? { t: now, n: 1 } : { t: prev.t, n: prev.n + 1 };
    this.userBursts.set(burstKey, next);
    if (next.n > 12) return;

    uiStore.dispatch({ type: 'SET_INTENT', payload: command });
    const nonce = Math.random().toString(36).substring(7).toUpperCase();
    const envelope = { intent: command.intent, clientTs: now, nonce, userId };

    switch (command.intent) {
      case 'SPAWN_ENTITY': {
        const id = `AGT-${nonce}`;
        worldStore.dispatch({ type: 'PREDICT', payload: { agents: { [id]: { id, state: 'ACTIVE' } } } });
        if (db) {
          await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'commands'), { ...envelope, id, timestamp: serverTimestamp() });
        }
        break;
      }
      case 'VOICE_SYNC': {
        const success = await mediaRef.current.activate();
        uiStore.dispatch({ type: 'SET_MEDIA', payload: { isSpatialAudioEnabled: success, isMediaActive: success } });
        break;
      }
      case 'OS_COMMAND':
        uiStore.dispatch({ type: 'ADD_LOG', payload: { ts: new Date().toLocaleTimeString(), type: 'SYS', data: 'Secure Kernel Reset Requested.' } });
        break;
      default:
        break;
    }
  }
}

const LogList = memo(() => {
  const logs = useStoreSelector(uiStore, (s) => s.logs);
  return logs.map((l, i) => (
    <div key={i} className="text-[9px] text-white/40 font-mono flex gap-2">
      <span className="text-cyan-500">›</span> {l.data}
    </div>
  ));
});

const VoiceList = memo(() => {
  const isAudio = useStoreSelector(uiStore, (s) => s.isSpatialAudioEnabled);
  return isAudio ? (
    <div className="text-[10px] text-cyan-400 animate-pulse">SHARD_ACOUSTIC_MESH_CONNECTED</div>
  ) : (
    <div className="text-[10px] text-rose-500/50 flex items-center gap-2"><ZapOff size={14} /> ACOUSTIC_OFF</div>
  );
});

const SovereignHud = memo(() => {
  const viewMode = useStoreSelector(uiStore, (s) => s.viewMode);
  const isSpatialAudioEnabled = useStoreSelector(uiStore, (s) => s.isSpatialAudioEnabled);
  const activeShard = useStoreSelector(worldStore, (s) => s.sim.activeShard);

  return (
    <div className="flex flex-col gap-6 pointer-events-auto">
      <div className="bg-[#050508]/90 backdrop-blur-3xl border border-white/10 p-6 rounded-[2.5rem] flex items-center gap-6 shadow-4xl animate-in ring-1 ring-white/5">
        <div onClick={() => uiStore.dispatch({ type: 'TOGGLE_VIEW' })} className={`p-5 rounded-3xl cursor-pointer transition-all duration-700 ${viewMode === 'DEVELOPER' ? 'bg-rose-500' : 'bg-emerald-500 shadow-[0_0_20px_#10b981]'}`}>
          {viewMode === 'DEVELOPER' ? <ShieldAlert size={28} className="text-black" /> : <Waves size={28} className="text-black animate-pulse" />}
        </div>
        <div className="text-left">
          <div className="flex items-center gap-3 mb-1">
            <h1 className="text-xl font-black tracking-widest text-white uppercase">{viewMode}</h1>
            <div className={`px-2 py-0.5 rounded-full text-[8px] font-black ${isSpatialAudioEnabled ? 'bg-cyan-500/20 text-cyan-400' : 'bg-white/10'}`}>
              {isSpatialAudioEnabled ? 'AUDIO_ON' : 'AUDIO_OFF'}
            </div>
          </div>
          <div className="text-[8px] font-black text-white/20 uppercase tracking-[0.3em]">SHARD: {activeShard} • BUILD: {CODEX_VERSION}</div>
        </div>
      </div>

      <div className="bg-black/80 backdrop-blur-3xl border border-white/10 p-8 rounded-[3rem] w-[420px] text-left shadow-4xl border-t-white/5">
        <div className="text-[10px] text-white/20 tracking-[0.4em] mb-6 flex items-center gap-2 uppercase font-black">
          <Send size={14} className="text-cyan-400" /> Hardened_System_Logs
        </div>
        <div className="space-y-3 max-h-60 overflow-y-auto no-scrollbar">
          <LogList />
        </div>
      </div>
    </div>
  );
});

export default function App() {
  const [booted, setBooted] = useState(false);
  const [cmd, setCmd] = useState('');
  const containerRef = useRef(null);
  const engineRef = useRef(null);
  const mediaRef = useRef(new MediaKernel());
  const unsubAuthRef = useRef(null);
  const unsubRealityRef = useRef(null);
  const ui = useStoreSelector(uiStore, (s) => s);

  useEffect(() => {
    let isMounted = true;
    const resizeObserver = new ResizeObserver(() => {
      if (engineRef.current) engineRef.current.handleResize();
    });

    const init = async () => {
      try {
        if (!auth) {
          uiStore.dispatch({ type: 'SET_USER', payload: { uid: 'guest' } });
        } else if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) {
          await signInWithCustomToken(auth, __initial_auth_token);
        } else {
          await signInAnonymously(auth);
        }

        if (auth) {
          unsubAuthRef.current = onAuthStateChanged(auth, (user) => {
            if (!user || !isMounted) return;
            uiStore.dispatch({ type: 'SET_USER', payload: user });

            if (!db) return;
            unsubRealityRef.current?.();
            const realityRef = collection(db, 'artifacts', appId, 'public', 'data', 'reality_events');
            unsubRealityRef.current = onSnapshot(query(realityRef, orderBy('createdAt', 'desc'), limit(1)), (snap) => {
              if (!snap.empty && isMounted) {
                worldStore.dispatch({ type: 'APPLY_TRUTH', payload: snap.docs[0].data().entities });
              }
            });
          });
        }
      } catch {
        uiStore.dispatch({ type: 'ADD_LOG', payload: { ts: new Date().toLocaleTimeString(), type: 'ERR', data: 'INIT_SYNC_FAIL' } });
      }

      worldStore.dispatch({
        type: 'APPLY_TRUTH',
        payload: {
          agents: Array.from({ length: 25 }).reduce((acc, _, i) => {
            acc[`AGENT-${i}`] = { id: `AGENT-${i}`, state: 'ACTIVE', _v: 0 };
            return acc;
          }, {})
        }
      });

      if (containerRef.current && !engineRef.current) {
        engineRef.current = new ApexEngine(containerRef.current);
        resizeObserver.observe(containerRef.current);
        if (isMounted) setBooted(true);
      }
    };

    const tickId = window.setInterval(() => {
      worldStore.dispatch({ type: 'TICK', dt: 1 / 20 });
    }, 50);

    init();
    return () => {
      isMounted = false;
      window.clearInterval(tickId);
      unsubAuthRef.current?.();
      unsubRealityRef.current?.();
      resizeObserver.disconnect();
      if (engineRef.current) {
        engineRef.current.terminate();
        engineRef.current = null;
      }
      mediaRef.current.stop();
    };
  }, []);

  const handleExecute = async () => {
    if (!cmd.trim()) return;
    const user = uiStore.getState().user || { uid: 'guest' };
    const interpretation = await RhizohBrainV7.process(cmd, user);
    if (interpretation) {
      await CommandBus.dispatch(interpretation, { uiStore, worldStore, db, appId, mediaRef, engineRef });
    }
    setCmd('');
  };

  return (
    <div className="h-screen w-full bg-[#010103] text-white font-mono overflow-hidden relative select-none uppercase font-black selection:bg-cyan-500/30">
      <div ref={containerRef} className="absolute inset-0 z-0 bg-black" />
      <div className="absolute inset-0 z-10 pointer-events-none p-12 flex flex-col justify-between">
        <div className="flex justify-between items-start">
          <SovereignHud />
          <div className="flex flex-col gap-6 pointer-events-auto w-80 text-left">
            <div className="bg-black/80 backdrop-blur-3xl border border-white/10 p-8 rounded-[3rem] shadow-4xl border-t-white/5">
              <div className="text-[10px] text-white/20 tracking-[0.4em] mb-8 flex items-center gap-2 uppercase font-black">
                <RadioTower size={14} className="text-emerald-400" /> Shard_Acoustics
              </div>
              <div className="space-y-3">
                <VoiceList />
              </div>
            </div>
          </div>
        </div>
        <div className="flex justify-center mb-6">
          <div className="w-full max-w-5xl bg-[#0a0a10]/98 border border-white/10 p-3 rounded-[4rem] flex items-center shadow-4xl backdrop-blur-4xl ring-1 ring-white/10 pointer-events-auto">
            <button className="ml-5 p-5 hover:bg-white/5 rounded-full text-white/30 transition-all active:scale-90">
              <Mic size={26} />
            </button>
            <div className="flex-1 px-8 relative">
              <input value={cmd} onChange={(e) => setCmd(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleExecute()} placeholder="COMMAND AUTHORIZED. RHIZOH OS LISTENING..." className="w-full bg-transparent border-none outline-none text-sm font-black tracking-[0.4em] text-white uppercase placeholder:text-white/5" />
              <Waves size={18} className="absolute right-0 top-1/2 -translate-y-1/2 text-cyan-400 opacity-20" />
            </div>
            <button onClick={handleExecute} className="p-6 bg-white rounded-[2.8rem] hover:bg-emerald-400 transition-all text-black shadow-2xl active:scale-95 group">
              <Zap size={32} className="group-hover:scale-110 transition-transform" />
            </button>
          </div>
        </div>
      </div>

      {!booted && (
        <div className="absolute inset-0 z-[5000] bg-black flex flex-col items-center justify-center">
          <Atom size={100} className="text-cyan-400 animate-spin opacity-20 mb-16" />
          <div className="text-2xl font-black tracking-[2.5em] text-white/30 ml-[2.5em] animate-pulse uppercase">Hardening_Sovereign_OS</div>
        </div>
      )}

      <style>{`
        .animate-spin-slow { animation: spin 25s linear infinite; }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .shadow-4xl { box-shadow: 0 60px 180px rgba(0,0,0,0.95), 0 0 60px rgba(34, 211, 238, 0.04); }
        .animate-in { animation: pIn 1s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
        @keyframes pIn { from { opacity: 0; transform: translateY(30px); } to { opacity: 1; transform: translateY(0); } }
        input::placeholder { font-size: 10px; letter-spacing: 0.6em; opacity: 0.3; }
      `}</style>
    </div>
  );
}
import React, { useState, useRef, useEffect, useSyncExternalStore, useCallback, useMemo, memo, Component } from 'react';
import * as THREE from 'three';
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, signInAnonymously, onAuthStateChanged, signInWithCustomToken } from 'firebase/auth';
import { getFirestore, doc, setDoc, getDoc, collection, onSnapshot, query, updateDoc, addDoc, serverTimestamp, orderBy, limit, where } from 'firebase/firestore';
import {
  Globe as GlobeIcon, Atom, Zap, Brain, Network, Monitor, Activity as SignalIcon,
  Shield, Eye, Cpu, Terminal as CliIcon, Command, Wifi, Binary, Activity, Sparkles,
  Ghost, ShieldAlert, Camera, Satellite, Heart, Target, UserCheck,
  BoxSelect, Trophy, Coins, Star, Link2, Video, Music, Mic, Mic2 as MicIcon, Boxes,
  Aperture, Cpu as Processor, Battery, User, Server, RadioTower, Flame,
  Languages, Database, Share2, Layers, Key, Lock, Fingerprint, EyeOff, Layout,
  ShieldCheck, Smartphone, HardDrive, Unplug, Workflow, ClipboardList, ShieldAlert as AlertIcon,
  Volume2, VolumeX, Radio, Waves, Send
} from 'lucide-react';

// ============================================================================
// 1. CASTLE NEXT-GEN - YAPILANDIRMA (CODEX v506.Alpha-Command-Bus)
// ============================================================================
const CODEX_VERSION = "vNext-506.Alpha-Command-Bus";
const CODEX_DATE = "2025-07-12";
const GLOBE_RADIUS = 3000;
const MAX_INSTANCES = 5000;

let firebaseConfig = {};
try {
  firebaseConfig = typeof __firebase_config !== 'undefined' ? JSON.parse(__firebase_config) : {};
} catch {
  firebaseConfig = {};
}
const hasFirebase = Boolean(firebaseConfig?.apiKey);
const fbApp = hasFirebase ? (getApps().length === 0 ? initializeApp(firebaseConfig) : getApp()) : null;
const auth = fbApp ? getAuth(fbApp) : null;
const db = fbApp ? getFirestore(fbApp) : null;
const appId = typeof __app_id !== 'undefined' ? __app_id : 'castle-vnext-acoustic';

// ============================================================================
// 2. RHIZOH BRAIN V5 - TOKENIZED INTENT & REASONING
// ============================================================================
class RhizohBrainV5 {
  static tokenize(input) {
    return input.trim().toUpperCase().split(/\s+/).filter(t => t.length > 0);
  }

  static async process(input, userContext, worldState) {
    const tokens = this.tokenize(input);
    if (tokens.length === 0) return null;

    const intent = this.detectIntent(tokens);
    if (!intent) return null;

    return {
      intent,
      tokens,
      confidence: 0.99,
      reasoning: [
        `TOKEN_ANALYSIS: [${tokens.join(', ')}]`,
        `AUTH_SCOPE: ${(userContext.uid || "guest").substring(0,8)}`,
        `COMMAND_ROUTING: Dispatching to Bus.`
      ],
      plan: this.generateExecutionDAG(intent),
      timestamp: Date.now()
    };
  }

  static detectIntent(tokens) {
    const semanticClusters = {
      SPAWN_ENTITY: ['YARAT', 'OLUSTUR', 'SPAWN', 'SUMMON', 'AJAN', 'BIRIM', 'EKLE'],
      VOICE_SYNC: ['SES_AC', 'SPATIAL', '3D_SES', 'VOICE_SHARD', 'DINLE', 'KONUS'],
      MEDIA_KERNEL: ['YAYIN', 'LIVE', 'STREAM', 'CAMERA', 'SES'],
      OS_COMMAND: ['TERMINAL', 'SISTEM', 'RESET']
    };
    for (const [key, cluster] of Object.entries(semanticClusters)) {
      if (tokens.some(t => cluster.includes(t))) return key;
    }
    return null;
  }

  static generateExecutionDAG(intent) {
    const dags = {
      VOICE_SYNC: ["BUS_INIT_AUDIO", "ATTACH_SPATIAL", "BROADCAST_SYNC"],
      SPAWN_ENTITY: ["PREDICTIVE_STATE_BUMP", "CLOUD_AUTHORITY_COMMIT"]
    };
    return dags[intent] || ["GENERIC_ACTION"];
  }
}

// ============================================================================
// 3. WORLD AUTHORITY STORE (DEEP RECONCILIATION)
// ============================================================================
const createStore = (initialState) => {
  let state = { ...initialState, version: 0 };
  const listeners = new Set();
  return {
    getState: () => state,
    subscribe: (cb) => { listeners.add(cb); return () => listeners.delete(cb); },
    // applyTruth: Entity bazlı derin birleştirme (Deep-merge replacement)
    applyTruth: (realityEntities) => {
      if (!realityEntities) return;
      const nextAgents = { ...state.entities.agents };
      Object.keys(realityEntities.agents || {}).forEach(id => {
        nextAgents[id] = { ...nextAgents[id], ...realityEntities.agents[id], lastTruth: Date.now() };
      });
      state = { ...state, entities: { ...state.entities, agents: nextAgents }, sim: { ...state.sim, status: 'SYNCED' }, version: state.version + 1 };
      listeners.forEach(l => l());
    },
    predict: (mutation) => {
      const nextAgents = { ...state.entities.agents };
      Object.keys(mutation.agents || {}).forEach(id => {
        nextAgents[id] = { ...nextAgents[id], ...mutation.agents[id], predicted: true };
      });
      state = { ...state, entities: { ...state.entities, agents: nextAgents }, sim: { ...state.sim, status: 'PREDICTING' } };
      listeners.forEach(l => l());
    },
    commit: (nextData) => {
      state = { ...state, ...nextData, version: state.version + 1 };
      listeners.forEach(l => l());
    }
  };
};

const worldStore = createStore({
  entities: { agents: {}, castles: {} },
  sim: { frame: 0, time: 0, status: 'BOOTING', activeShard: 'ZION-01' }
});

const uiStore = createStore({
  user: null,
  logs: [{ ts: CODEX_DATE, type: 'SYS', data: "CASTLE v506 Bus Cekirdegi Hazir." }],
  viewMode: 'CITIZEN',
  activePlan: null,
  isMediaActive: false,
  isSpatialAudioEnabled: false
});

const useWorldSelector = (selector) => useSyncExternalStore(worldStore.subscribe, useCallback(() => selector(worldStore.getState()), [selector]));

// ============================================================================
// 4. APEX ENGINE (DIRTY-FLAG OPTIMIZED)
// ============================================================================
class ApexEngine {
  constructor(container) {
    this.container = container;
    this.active = true;
    this.hashCache = new Map();
    this.dirtyFlags = new Set(); // Sadece degisenleri guncellemek icin

    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(45, container.clientWidth / container.clientHeight, 10, 200000);
    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
    this.renderer.setSize(container.clientWidth, container.clientHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.container.appendChild(this.renderer.domElement);

    this.audioListener = new THREE.AudioListener();
    this.camera.add(this.audioListener);
    this.positionalAudios = new Map();

    this.setupWorld();
    this.setupInstancing();
    this.renderLoop = this.renderLoop.bind(this);
    this.renderLoop();
  }

  setupWorld() {
    this.globe = new THREE.Mesh(
      new THREE.SphereGeometry(GLOBE_RADIUS, 48, 48),
      new THREE.MeshStandardMaterial({ color: 0x01050a, emissive: 0x051122, roughness: 0.3, metalness: 0.7, transparent: true, opacity: 0.75 })
    );
    this.scene.add(this.globe);

    this.shieldRing = new THREE.Mesh(
      new THREE.RingGeometry(GLOBE_RADIUS + 300, GLOBE_RADIUS + 310, 48),
      new THREE.MeshBasicMaterial({ color: 0x22d3ee, side: THREE.DoubleSide, transparent: true, opacity: 0.15 })
    );
    this.shieldRing.rotation.x = Math.PI / 2;
    this.scene.add(this.shieldRing);

    this.scene.add(new THREE.AmbientLight(0xffffff, 0.4));
    const pLight = new THREE.PointLight(0x22d3ee, 2, 20000);
    pLight.position.set(5000, 5000, 5000);
    this.scene.add(pLight);
  }

  setupInstancing() {
    this.agentInstances = new THREE.InstancedMesh(new THREE.IcosahedronGeometry(75, 1), new THREE.MeshPhongMaterial({ shininess: 80, vertexColors: true }), MAX_INSTANCES);
    this.agentInstances.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    this.scene.add(this.agentInstances);
    this.dummy = new THREE.Object3D();
  }

  getAgentHash(id) {
    if (!this.hashCache.has(id)) {
      this.hashCache.set(id, id.split('').reduce((a, b) => a + b.charCodeAt(0), 0));
    }
    return this.hashCache.get(id);
  }

  addSpatialSource(agentId, stream) {
    if (this.positionalAudios.has(agentId)) return;
    const audio = new THREE.PositionalAudio(this.audioListener);
    if (stream) {
      const source = audio.context.createMediaStreamSource(stream);
      audio.setNodeSource(source);
    }
    audio.setRefDistance(800);
    this.positionalAudios.set(agentId, audio);
  }

  handleResize() {
    if (!this.container) return;
    const width = this.container.clientWidth;
    const height = this.container.clientHeight;
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
  }

  renderLoop() {
    if (!this.active) return;
    requestAnimationFrame(this.renderLoop);

    const state = worldStore.getState();
    const agents = Object.values(state.entities.agents || {});
    const time = performance.now() * 0.001;
    const activeCount = Math.min(agents.length, MAX_INSTANCES);

    let needsMatrixUpdate = false;

    for (let i = 0; i < activeCount; i++) {
      const agent = agents[i];
      const h = this.getAgentHash(agent.id);

      const posX = Math.cos(h + time * 0.1) * (GLOBE_RADIUS + 400);
      const posY = Math.sin(h * 0.4) * 1500;
      const posZ = Math.sin(h + time * 0.1) * (GLOBE_RADIUS + 400);

      this.dummy.position.set(posX, posY, posZ);
      this.dummy.rotation.set(time * 0.2, time * 0.1, 0);
      this.dummy.updateMatrix();

      this.agentInstances.setMatrixAt(i, this.dummy.matrix);
      this.agentInstances.setColorAt(i, new THREE.Color(agent.state === 'OFFLINE' ? 0x440000 : 0x22d3ee));

      if (this.positionalAudios.has(agent.id)) {
        this.positionalAudios.get(agent.id).position.set(posX, posY, posZ);
      }
      needsMatrixUpdate = true;
    }

    if (needsMatrixUpdate) {
      this.agentInstances.count = activeCount;
      this.agentInstances.instanceMatrix.needsUpdate = true;
      if (this.agentInstances.instanceColor) this.agentInstances.instanceColor.needsUpdate = true;
    }

    this.camera.position.set(Math.cos(time * 0.04) * 9000, 3000, Math.sin(time * 0.04) * 9000);
    this.camera.lookAt(0, 0, 0);
    this.shieldRing.rotation.z += 0.0003;
    this.renderer.render(this.scene, this.camera);
  }

  terminate() {
    this.active = false;
    this.renderer.dispose();
    this.scene.clear();
    this.positionalAudios.forEach(a => { if (a.parent) a.parent.remove(a); });
    this.positionalAudios.clear();
  }
}

// ============================================================================
// 5. COMMAND BUS - CENTRAL ROUTER
// ============================================================================
class CommandBus {
  static async dispatch(command, refs) {
    const { uiStore, worldStore, db, appId, mediaRef, engineRef } = refs;
    const { intent, reasoning } = command;

    uiStore.commit({ activePlan: command });

    switch (intent) {
      case 'SPAWN_ENTITY': {
        const id = `AGT-${Math.random().toString(36).substring(7).toUpperCase()}`;
        // Optimistic UI Prediction
        worldStore.predict({ agents: { [id]: { id, state: 'ACTIVE' } } });
        // Authority Commit
        if (db) {
          await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'commands'), {
            intent, id, timestamp: serverTimestamp()
          });
        }
        break;
      }

      case 'VOICE_SYNC': {
        const success = await mediaRef.current.activate();
        uiStore.commit({ isSpatialAudioEnabled: success, isMediaActive: success });
        if (success && engineRef.current) {
          Object.keys(worldStore.getState().entities.agents).forEach(aid => {
            engineRef.current.addSpatialSource(aid, mediaRef.current.stream);
          });
        }
        break;
      }

      case 'OS_COMMAND':
        uiStore.commit({ logs: [{ ts: new Date().toLocaleTimeString(), type: 'SYS', data: "Sistem Sifirlaniyor..." }, ...uiStore.getState().logs] });
        break;

      default:
        console.warn("Bilinmeyen Niyet:", intent);
    }
  }
}

// ============================================================================
// 6. MEDYA CEKIRDEGI
// ============================================================================
class MediaKernel {
  constructor() { this.stream = null; }
  async activate() {
    try {
      this.stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      return true;
    } catch (e) { return false; }
  }
  stop() {
    this.stream?.getTracks().forEach(t => t.stop());
    this.stream = null;
  }
}

// ============================================================================
// 7. UI BILESENLERI
// ============================================================================

const SovereignHud = memo(() => {
  const ui = useSyncExternalStore(uiStore.subscribe, () => uiStore.getState());
  const world = useWorldSelector(s => s.sim);

  return (
    <div className="flex flex-col gap-6 pointer-events-auto">
      <div className="bg-[#050508]/90 backdrop-blur-3xl border border-white/10 p-6 rounded-[2.5rem] flex items-center gap-6 shadow-4xl animate-in ring-1 ring-white/5">
         <div className={`p-5 rounded-3xl transition-all duration-700 ${ui.viewMode === 'DEVELOPER' ? 'bg-rose-500' : 'bg-emerald-500 shadow-[0_0_20px_#10b981]'}`}>
            {ui.viewMode === 'DEVELOPER' ? <Workflow size={28} className="text-black" /> : <Waves size={28} className="text-black animate-pulse" />}
         </div>
         <div className="text-left">
            <div className="flex items-center gap-3 mb-1">
               <h1 className="text-xl font-black tracking-widest text-white uppercase">{ui.viewMode}</h1>
               <div className={`px-2 py-0.5 rounded-full text-[8px] font-black ${ui.isSpatialAudioEnabled ? 'bg-cyan-500/20 text-cyan-400' : 'bg-white/10'}`}>
                 {ui.isSpatialAudioEnabled ? '3D_AUDIO_ON' : 'AUDIO_OFF'}
               </div>
            </div>
            <div className="text-[8px] font-black text-white/20 uppercase tracking-[0.3em]">SHARD: {world.activeShard} • VER: {CODEX_VERSION}</div>
         </div>
      </div>

      <div className="bg-black/80 backdrop-blur-3xl border border-white/10 p-8 rounded-[3rem] w-[420px] text-left shadow-4xl border-t-white/5">
         <div className="text-[10px] text-white/20 tracking-[0.4em] mb-6 flex items-center gap-2 uppercase font-black">
            <Send size={14} className="text-cyan-400" /> Command_Bus_Stack
         </div>
         <div className="space-y-3 max-h-60 overflow-y-auto no-scrollbar">
            {ui.activePlan ? ui.activePlan.reasoning.map((r, i) => (
              <div key={i} className="text-[9px] text-white/40 font-mono flex gap-2">
                <span className="text-cyan-500">›</span> {r}
              </div>
            )) : <div className="text-[10px] text-white/5 italic">Komut Bekleniyor...</div>}
         </div>
      </div>
    </div>
  );
});

// ============================================================================
// 8. ANA ORKESTRATOR (HABITAT OS)
// ============================================================================
export default function App() {
  const [booted, setBooted] = useState(false);
  const [cmd, setCmd] = useState("");
  const containerRef = useRef(null);
  const engineRef = useRef(null);
  const mediaRef = useRef(new MediaKernel());
  const ui = useSyncExternalStore(uiStore.subscribe, () => uiStore.getState());

  useEffect(() => {
    let isMounted = true;
    let unsubAuth = null;
    let unsubReality = null;

    const resizeObserver = new ResizeObserver(() => engineRef.current?.handleResize());

    const init = async () => {
      try {
        if (!auth) {
          uiStore.commit({ user: { uid: "guest" } });
        } else if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) {
          await signInWithCustomToken(auth, __initial_auth_token);
        } else {
          await signInAnonymously(auth);
        }

        if (auth) {
          unsubAuth = onAuthStateChanged(auth, (user) => {
            if (!user || !isMounted) return;
            uiStore.commit({ user });

            if (!db) return;
            const realityRef = collection(db, 'artifacts', appId, 'public', 'data', 'reality_events');
            unsubReality = onSnapshot(query(realityRef, orderBy('createdAt', 'desc'), limit(1)), (snap) => {
              if (!snap.empty && isMounted) {
                worldStore.applyTruth(snap.docs[0].data().entities);
              }
            });
          });
        }
      } catch (e) { console.warn("SYNC_FAIL", e); }

      worldStore.applyTruth({
        agents: Array.from({ length: 30 }).reduce((acc, _, i) => {
          acc[`AGENT-${i}`] = { id: `AGENT-${i}`, state: 'ACTIVE' };
          return acc;
        }, {})
      });

      if (containerRef.current && !engineRef.current) {
        engineRef.current = new ApexEngine(containerRef.current);
        resizeObserver.observe(containerRef.current);
        if (isMounted) setBooted(true);
      }
    };

    init();
    return () => {
      isMounted = false;
      unsubAuth?.();
      unsubReality?.();
      resizeObserver.disconnect();
      engineRef.current?.terminate();
      engineRef.current = null;
      mediaRef.current.stop();
    };
  }, []);

  const handleExecute = async () => {
    if (!cmd.trim()) return;
    const interpretation = await RhizohBrainV5.process(cmd, ui.user || { uid: 'guest' }, worldStore.getState());
    if (interpretation) {
      await CommandBus.dispatch(interpretation, { uiStore, worldStore, db, appId, mediaRef, engineRef });
    }
    setCmd("");
  };

  return (
    <div className="h-screen w-full bg-[#010103] text-white font-mono overflow-hidden relative select-none uppercase font-black selection:bg-cyan-500/30">
      <div ref={containerRef} className="absolute inset-0 z-0 bg-black" />
      <div className="absolute inset-0 z-10 pointer-events-none p-12 flex flex-col justify-between">
        <div className="flex justify-between items-start">
           <SovereignHud />
           <div className="flex flex-col gap-6 pointer-events-auto w-80 text-left">
              <div className="bg-black/80 backdrop-blur-3xl border border-white/10 p-8 rounded-[3rem] shadow-4xl border-t-white/5">
                 <div className="text-[10px] text-white/20 tracking-[0.4em] mb-8 flex items-center gap-2 uppercase font-black">
                   <RadioTower size={14} className="text-emerald-400" /> Voice_Shards
                 </div>
                 <div className="space-y-3">
                    {ui.isSpatialAudioEnabled ? Object.keys(worldStore.getState().entities.agents).slice(0, 5).map(id => (
                        <div key={id} className="flex items-center justify-between text-[10px]">
                           <span className="text-white/40">{id}</span>
                           <div className="flex gap-1 h-3 items-end">
                              {[1,2,3].map(i => <div key={i} className="w-1 bg-cyan-500 animate-pulse" style={{ height: `${Math.sin(performance.now()*0.01 + i)*50+50}%` }} />)}
                           </div>
                        </div>
                    )) : <div className="text-[10px] text-rose-500/50 flex items-center gap-2"><VolumeX size={14} /> AUDIO_LINK_OFF</div>}
                 </div>
              </div>
              {ui.isMediaActive && (
                <div className="w-80 aspect-video bg-black rounded-[2.5rem] border border-emerald-500/20 overflow-hidden relative shadow-4xl animate-in">
                   <video ref={el => { if (el && mediaRef.current.stream) el.srcObject = mediaRef.current.stream; }} autoPlay playsInline muted className="w-full h-full object-cover grayscale opacity-40" />
                </div>
              )}
           </div>
        </div>
        <div className="flex justify-center mb-6">
           <div className="w-full max-w-5xl bg-[#0a0a10]/98 border border-white/10 p-3 rounded-[4rem] flex items-center shadow-4xl backdrop-blur-4xl ring-1 ring-white/10 pointer-events-auto">
              <button onClick={() => uiStore.commit({ viewMode: ui.viewMode === 'CITIZEN' ? 'DEVELOPER' : 'CITIZEN' })} className="ml-5 p-5 hover:bg-white/5 rounded-full text-white/30 transition-all active:scale-90">
                <Mic size={26} className={ui.isSpatialAudioEnabled ? "text-cyan-400" : "text-white/20"} />
              </button>
              <div className="flex-1 px-8 relative">
                 <input value={cmd} onChange={e => setCmd(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleExecute()} placeholder="COMMAND AUTHORIZED. RHIZOH OS LISTENING..." className="w-full bg-transparent border-none outline-none text-sm font-black tracking-[0.4em] text-white uppercase placeholder:text-white/5" />
                 <Waves size={18} className={`absolute right-0 top-1/2 -translate-y-1/2 text-cyan-400 transition-opacity ${ui.isSpatialAudioEnabled ? 'opacity-100' : 'opacity-0'}`} />
              </div>
              <button onClick={handleExecute} className="p-6 bg-white rounded-[2.8rem] hover:bg-emerald-400 transition-all text-black shadow-2xl active:scale-95 group">
                 <Zap size={32} className="group-hover:scale-110 transition-transform" />
              </button>
           </div>
        </div>
      </div>

      {!booted && (
        <div className="absolute inset-0 z-[5000] bg-black flex flex-col items-center justify-center">
          <Atom size={100} className="text-cyan-400 animate-spin opacity-20 mb-16" />
          <div className="text-2xl font-black tracking-[2.5em] text-white/30 ml-[2.5em] animate-pulse uppercase">Refining_OS_Core</div>
        </div>
      )}

      <style>{`
        .animate-spin-slow { animation: spin 25s linear infinite; }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .shadow-4xl { box-shadow: 0 60px 180px rgba(0,0,0,0.95), 0 0 60px rgba(34, 211, 238, 0.04); }
        .animate-in { animation: pIn 1s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
        @keyframes pIn { from { opacity: 0; transform: translateY(30px); } to { opacity: 1; transform: translateY(0); } }
        input::placeholder { font-size: 10px; letter-spacing: 0.6em; opacity: 0.3; }
      `}</style>
    </div>
  );
}
