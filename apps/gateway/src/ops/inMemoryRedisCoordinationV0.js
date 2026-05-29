/**
 * In-memory Redis coordination simulation v0 — Docker-free distributed truth layer.
 * Map + ZSET + TTL purge + optional latency (chaos). Single-process; no real races.
 * @see docs/ops/FAKE_VS_REAL_REDIS_BEHAVIOR_MAP_V1.0.md
 */

import { applyChaosDelayV0 } from "./loadTestChaosV0.js";

export const COORDINATION_SIM_SCHEMA_V0 = "rhizoh.in_memory_redis_coordination.v0";

export function readCoordinationSimConfigV0() {
  return Object.freeze({
    schema: COORDINATION_SIM_SCHEMA_V0,
    enabled: process.env.CASTLE_COORDINATION_SIM === "1",
    label: "coordination_sim",
    note: "Redis protocol simulated — lifecycle/ZSET/TTL without external Redis"
  });
}

export function isCoordinationSimEnabledV0() {
  return process.env.CASTLE_COORDINATION_SIM === "1";
}

/** @type {InMemoryRedisCoordinationV0 | null} */
let simSingleton = null;

export function getCoordinationSimRedisClientV0() {
  if (!simSingleton) simSingleton = new InMemoryRedisCoordinationV0();
  return simSingleton;
}

export function resetCoordinationSimV0() {
  if (simSingleton) simSingleton.reset();
  simSingleton = null;
}

class InMemoryRedisCoordinationV0 {
  constructor() {
    /** @type {Map<string, string>} */
    this.store = new Map();
    /** @type {Map<string, Map<string, number>>} */
    this.zsets = new Map();
    this._connected = false;
    /** @type {Promise<void>} */
    this._mutex = Promise.resolve();
  }

  reset() {
    this.store.clear();
    this.zsets.clear();
    this._connected = false;
    this._mutex = Promise.resolve();
  }

  async connect() {
    await applyChaosDelayV0("redis");
    this._connected = true;
    return this;
  }

  /**
   * @template T
   * @param {() => Promise<T> | T} fn
   */
  async _locked(fn) {
    const prev = this._mutex;
    let unlock = () => {};
    this._mutex = new Promise((r) => {
      unlock = r;
    });
    await prev;
    try {
      await applyChaosDelayV0("redis");
      return await fn();
    } finally {
      unlock();
    }
  }

  async get(key) {
    return this._locked(() => this.store.get(key) ?? null);
  }

  async set(key, value) {
    return this._locked(() => {
      this.store.set(key, String(value));
      return "OK";
    });
  }

  async zCard(key) {
    return this._locked(() => {
      const z = this.zsets.get(key);
      return z ? z.size : 0;
    });
  }

  /**
   * Tagged scripts — avoids Lua-string matching errors.
   */
  async evalScript(name, { keys = [], arguments: args = [] } = {}) {
    return this._locked(() => {
      switch (name) {
        case "purge_expired_leases":
          return this._purgeExpired(keys[0], keys[1], args[0]);
        case "reserve_with_lease":
          return this._reserveWithLease(keys[0], keys[1], args[0], args[1], args[2], args[3]);
        case "release_lease":
          return this._releaseLease(keys[0], keys[1], args[0]);
        case "release_legacy":
          return this._releaseLegacy(keys[0]);
        default:
          return 0;
      }
    });
  }

  async eval(script, { keys = [], arguments: args = [] } = {}) {
    return this._locked(() => {
      const s = String(script || "");
      if (s.includes("ZRANGEBYSCORE") && keys.length >= 2) {
        if (s.includes("ZADD") && args.length >= 4) {
          return this._reserveWithLease(keys[0], keys[1], args[0], args[1], args[2], args[3]);
        }
        if (args.length >= 1) {
          return this._purgeExpired(keys[0], keys[1], args[0]);
        }
      }
      if (!s.includes("ZRANGEBYSCORE") && !s.includes("ZADD") && s.includes("ZREM") && keys.length >= 2) {
        return this._releaseLease(keys[0], keys[1], args[0]);
      }
      if (s.includes("DECR") && keys.length === 1) {
        return this._releaseLegacy(keys[0]);
      }
      return 0;
    });
  }

  _zset(key) {
    let z = this.zsets.get(key);
    if (!z) {
      z = new Map();
      this.zsets.set(key, z);
    }
    return z;
  }

  _purgeExpired(leasesKey, counterKey, nowStr) {
    const now = Number(nowStr);
    const z = this._zset(leasesKey);
    let purged = 0;
    for (const [member, score] of [...z.entries()]) {
      if (score <= now && z.delete(member)) {
        purged += 1;
      }
    }
    if (purged > 0) {
      let cur = Number(this.store.get(counterKey) || "0");
      cur = Math.max(0, cur - purged);
      this.store.set(counterKey, String(cur));
    }
    return purged;
  }

  _reserveWithLease(leasesKey, counterKey, limStr, lease, expireAtStr, nowStr) {
    const purged = this._purgeExpired(leasesKey, counterKey, nowStr);
    const lim = Number(limStr);
    let cur = Number(this.store.get(counterKey) || "0");
    if (cur >= lim) return -1;
    cur += 1;
    this.store.set(counterKey, String(cur));
    this._zset(leasesKey).set(lease, Number(expireAtStr));
    return cur;
  }

  _releaseLease(leasesKey, counterKey, lease) {
    const z = this._zset(leasesKey);
    if (!z.delete(lease)) {
      return Number(this.store.get(counterKey) || "0");
    }
    let cur = Number(this.store.get(counterKey) || "0");
    if (cur > 0) {
      cur -= 1;
      this.store.set(counterKey, String(cur));
    }
    return cur;
  }

  _releaseLegacy(counterKey) {
    let cur = Number(this.store.get(counterKey) || "0");
    if (cur <= 0) return 0;
    cur -= 1;
    this.store.set(counterKey, String(cur));
    return cur;
  }
}
