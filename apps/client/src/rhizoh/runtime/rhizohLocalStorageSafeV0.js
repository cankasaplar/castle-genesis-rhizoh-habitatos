/**
 * Safe localStorage writes — never throw QuotaExceededError to callers.
 * RESEARCH-ONLY persistence guard.
 */

export const RHIZOH_LOCAL_STORAGE_SAFE_SCHEMA_V0 = "castle.rhizoh.local_storage_safe.v0";

/** Regenerable / non-authoritative keys freed before a hard write retry. */
export const RHIZOH_OPTIONAL_LS_EVICTION_KEYS_V0 = Object.freeze([
  "rhizoh.chess.learning_report.v0",
  "rhizoh.chess.learning_checkpoint_history.v0",
  "rhizoh.chess.batch_trainer.v0"
]);

/**
 * @param {unknown} err
 */
export function isRhizohStorageQuotaErrorV0(err) {
  if (!err) return false;
  const name = String(err.name || "");
  const msg = String(err.message || "");
  return name === "QuotaExceededError" || msg.includes("exceeded the quota");
}

/**
 * @param {string} key
 * @returns {number}
 */
export function estimateRhizohLocalStorageEntryBytesV0(key) {
  if (typeof localStorage === "undefined") return 0;
  try {
    const raw = localStorage.getItem(key);
    return raw ? raw.length * 2 : 0;
  } catch {
    return 0;
  }
}

/**
 * @param {string} [exceptKey]
 */
export function evictRhizohOptionalLocalStorageV0(exceptKey = "") {
  if (typeof localStorage === "undefined") return 0;
  let freed = 0;
  for (const key of RHIZOH_OPTIONAL_LS_EVICTION_KEYS_V0) {
    if (key === exceptKey) continue;
    try {
      const bytes = estimateRhizohLocalStorageEntryBytesV0(key);
      if (bytes > 0) {
        localStorage.removeItem(key);
        freed += bytes;
      }
    } catch {
      /* noop */
    }
  }
  return freed;
}

/**
 * @param {string} key
 * @param {unknown} value
 * @param {{ compactLevels?: ReadonlyArray<unknown>, minimalOnQuota?: () => unknown, evictOptional?: boolean }} [opts]
 */
export function setRhizohLocalStorageJsonV0(key, value, opts = {}) {
  if (typeof localStorage === "undefined") {
    return Object.freeze({ ok: false, reason: "no_storage" });
  }

  const levels = opts.compactLevels?.length ? opts.compactLevels : [value];
  let lastErr = null;

  for (let i = 0; i < levels.length; i += 1) {
    const payload = levels[i];
    try {
      localStorage.setItem(key, JSON.stringify(payload));
      return Object.freeze({ ok: true, compacted: i > 0, level: i });
    } catch (err) {
      lastErr = err;
      if (!isRhizohStorageQuotaErrorV0(err)) {
        return Object.freeze({ ok: false, reason: "error", error: String(err?.message || err) });
      }
    }
  }

  if (opts.evictOptional !== false) {
    evictRhizohOptionalLocalStorageV0(key);
    const lastPayload = levels[levels.length - 1];
    try {
      localStorage.setItem(key, JSON.stringify(lastPayload));
      return Object.freeze({ ok: true, compacted: true, evicted: true });
    } catch (err) {
      lastErr = err;
    }
  }

  try {
    localStorage.removeItem(key);
    const minimal = typeof opts.minimalOnQuota === "function" ? opts.minimalOnQuota() : levels[levels.length - 1];
    localStorage.setItem(key, JSON.stringify(minimal));
    return Object.freeze({ ok: true, compacted: true, reset: true });
  } catch (err) {
    lastErr = err;
  }

  if (typeof console !== "undefined" && console.warn) {
    console.warn("[CASTLE_storage_quota]", {
      key,
      message: "localStorage write skipped — quota exceeded",
      error: String(lastErr?.message || lastErr || "quota")
    });
  }

  return Object.freeze({ ok: false, reason: "quota" });
}

/**
 * Boot-time hygiene — compact hot stores before chess cluster writes.
 */
export function pruneRhizohLocalStorageOnBootV0() {
  if (typeof localStorage === "undefined") {
    return Object.freeze({ ok: false, reason: "no_storage" });
  }

  const knowledgeBytes = estimateRhizohLocalStorageEntryBytesV0("rhizoh_knowledge_store_v0");
  const openingBytes = estimateRhizohLocalStorageEntryBytesV0("rhizoh_opening_book_v0");
  let evictedBytes = 0;

  if (knowledgeBytes > 900_000 || openingBytes > 120_000) {
    evictedBytes += evictRhizohOptionalLocalStorageV0();
  }

  return Object.freeze({
    ok: true,
    knowledgeBytes,
    openingBytes,
    evictedBytes
  });
}
