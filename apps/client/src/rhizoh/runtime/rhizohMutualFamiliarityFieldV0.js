/**
 * Mutual Familiarity Field V0 — RESEARCH-ONLY habit memory (observation ring, not durable user memory).
 * Same route / time window / audio environment → familiarity score rises.
 */

import { logVoiceInfoV0 } from "./rhizohProductionLogNamespacesV0.js";

export const RHIZOH_MUTUAL_FAMILIARITY_SCHEMA = "castle.rhizoh.mutual_familiarity_field.v0";

const LS_KEY = "rhizoh.mutual_familiarity.habit.v0";
const HABIT_RING_MAX = 48;

/** @type {Map<string, { count: number, lastAtMs: number }>} */
const habitCounts = new Map();

/** @type {string[]} */
const recentHabitKeys = [];

function timeBucketV0(atMs) {
  const d = new Date(atMs);
  const hour = d.getHours();
  const quarter = Math.floor(d.getMinutes() / 15);
  const day = d.getDay();
  return `d${day}_h${hour}_q${quarter}`;
}

/**
 * @param {{ band?: string, strategy?: string, maxRms?: number }} meta
 */
function audioEnvSignatureV0(meta = {}) {
  const band = String(meta.band || "unknown");
  const strategy = String(meta.strategy || "na");
  const rms = Number.isFinite(Number(meta.maxRms))
    ? `r${Math.round(Number(meta.maxRms) * 1000)}`
    : "rna";
  return `audio:${band}|${strategy}|${rms}`;
}

/**
 * ~1.1 km grid — optional; no GPS required for v0.
 * @param {{ lat?: number, lon?: number }} meta
 */
function routeBucketV0(meta = {}) {
  const lat = Number(meta.lat);
  const lon = Number(meta.lon);
  if (!Number.isFinite(lat) || !Number.isFinite(lon)) return "route:unknown";
  return `route:${lat.toFixed(2)}_${lon.toFixed(2)}`;
}

function compositeHabitKeyV0(parts) {
  return [parts.time, parts.audio, parts.route].join("::");
}

function loadHabitsFromStorageV0() {
  if (typeof localStorage === "undefined") return;
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) return;
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed?.habits)) return;
    for (const row of parsed.habits) {
      if (row?.key) habitCounts.set(String(row.key), { count: Number(row.count) || 1, lastAtMs: Number(row.lastAtMs) || 0 });
    }
  } catch {
    /* noop */
  }
}

function persistHabitsToStorageV0() {
  if (typeof localStorage === "undefined") return;
  try {
    const habits = [...habitCounts.entries()]
      .sort((a, b) => b[1].lastAtMs - a[1].lastAtMs)
      .slice(0, HABIT_RING_MAX)
      .map(([key, v]) => ({ key, count: v.count, lastAtMs: v.lastAtMs }));
    localStorage.setItem(LS_KEY, JSON.stringify({ schema: RHIZOH_MUTUAL_FAMILIARITY_SCHEMA, habits, atMs: Date.now() }));
  } catch {
    /* noop */
  }
}

loadHabitsFromStorageV0();

/**
 * @param {{
 *   atMs?: number,
 *   band?: string,
 *   strategy?: string,
 *   maxRms?: number,
 *   lat?: number,
 *   lon?: number
 * }} meta
 */
export function observeMutualFamiliarityV0(meta = {}) {
  const atMs = Number(meta.atMs) > 0 ? Number(meta.atMs) : Date.now();
  const parts = Object.freeze({
    time: timeBucketV0(atMs),
    audio: audioEnvSignatureV0(meta),
    route: routeBucketV0(meta)
  });
  const key = compositeHabitKeyV0(parts);

  const prev = habitCounts.get(key) || { count: 0, lastAtMs: 0 };
  const next = { count: prev.count + 1, lastAtMs: atMs };
  habitCounts.set(key, next);

  recentHabitKeys.push(key);
  if (recentHabitKeys.length > HABIT_RING_MAX) recentHabitKeys.shift();

  persistHabitsToStorageV0();

  const familiarityScore = clampFamiliarityV0(next.count);
  const habitMemory = Object.freeze({
    key,
    parts,
    visitCount: next.count,
    lastAtMs: next.lastAtMs,
    recentKeys: Object.freeze([...recentHabitKeys.slice(-8)])
  });

  const field = Object.freeze({
    schema: RHIZOH_MUTUAL_FAMILIARITY_SCHEMA,
    familiarityScore,
    habitMemory,
    totalHabitKeys: habitCounts.size,
    policyAuthority: "observation_only",
    atMs
  });

  publishFamiliarityWindowV0(field);
  return field;
}

function clampFamiliarityV0(count) {
  const c = Math.max(0, Number(count) || 0);
  if (c <= 1) return 0.15;
  if (c === 2) return 0.35;
  if (c === 3) return 0.55;
  if (c <= 6) return 0.72;
  return 0.88;
}

function publishFamiliarityWindowV0(field) {
  if (typeof window === "undefined") return;
  window.__rhizoh = window.__rhizoh || {};
  window.__rhizoh.mutualFamiliarityField = Object.freeze({ ...field, atMs: Date.now() });
}

export function publishMutualFamiliarityObservationV0(field, detail = {}) {
  logVoiceInfoV0("MUTUAL_FAMILIARITY", {
    familiarityScore: field.familiarityScore,
    visitCount: field.habitMemory.visitCount,
    timeBucket: field.habitMemory.parts.time,
    audio: field.habitMemory.parts.audio,
    route: field.habitMemory.parts.route,
    ...detail
  });
  return field;
}

export function resetMutualFamiliarityFieldForTestV0() {
  habitCounts.clear();
  recentHabitKeys.length = 0;
  if (typeof localStorage !== "undefined") {
    try {
      localStorage.removeItem(LS_KEY);
    } catch {
      /* noop */
    }
  }
}

export function getMutualFamiliarityFieldSnapshotV0() {
  return Object.freeze({
    schema: RHIZOH_MUTUAL_FAMILIARITY_SCHEMA,
    habitCount: habitCounts.size,
    recentKeys: Object.freeze([...recentHabitKeys])
  });
}
