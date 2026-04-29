/**
 * GPU yokken minimal deterministik adım — aynı seed + aynı adım sayısı → aynı state hash.
 */

function mulberry32(a) {
  let t = a >>> 0;
  return function next() {
    t += 0x6d2b79f5;
    let r = Math.imul(t ^ (t >>> 15), 1 | t);
    r ^= r + Math.imul(r ^ (r >>> 7), 61 | r);
    return (r ^ (r >>> 14)) >>> 0;
  };
}

function hashStateU32(pos, vel, frame, seed) {
  let h = (2166136261 ^ seed ^ frame) >>> 0;
  const mix = (x) => {
    h ^= x >>> 0;
    h = Math.imul(h, 16777619) >>> 0;
  };
  for (let i = 0; i < pos.length; i++) {
    mix(pos[i] | 0);
    mix(vel[i] | 0);
  }
  return h >>> 0;
}

/**
 * @param {number} n parçacık sayısı
 * @param {number} seed
 */
export function createCpuDeterministicSwarmState(n, seed) {
  const nn = Math.max(1, Math.floor(n));
  const s = seed >>> 0;
  const rnd = mulberry32(s);
  const pos = new Int32Array(nn);
  const vel = new Int32Array(nn);
  for (let i = 0; i < nn; i++) {
    pos[i] = (rnd() & 0xffff) - 0x8000;
    vel[i] = ((rnd() & 0xff) - 128) << 4;
  }
  return { n: nn, seed: s, pos, vel, frame: 0 };
}

/** @param {{ pos: Int32Array, vel: Int32Array, frame: number, seed: number, n: number }} state */
export function cpuDeterministicSwarmStep(state) {
  const rnd = mulberry32((state.seed ^ state.frame) >>> 0);
  for (let i = 0; i < state.n; i++) {
    const jitter = (rnd() & 0x1f) - 15;
    state.pos[i] = (state.pos[i] + state.vel[i] + jitter) | 0;
    state.vel[i] = (((state.vel[i] * 999) >> 10) + ((rnd() & 7) - 3)) | 0;
  }
  state.frame++;
}

export function hashCpuDeterministicSwarmState(state) {
  return hashStateU32(state.pos, state.vel, state.frame, state.seed);
}

/** İki kez aynı yol — hash eşleşmeli. */
export function verifyCpuDeterministicKernelSelfTest(n = 64, seed = 0xdeadbeef, steps = 8) {
  const a = createCpuDeterministicSwarmState(n, seed);
  const b = createCpuDeterministicSwarmState(n, seed);
  for (let s = 0; s < steps; s++) {
    cpuDeterministicSwarmStep(a);
    cpuDeterministicSwarmStep(b);
  }
  const ha = hashCpuDeterministicSwarmState(a);
  const hb = hashCpuDeterministicSwarmState(b);
  return ha === hb && ha !== 0;
}
