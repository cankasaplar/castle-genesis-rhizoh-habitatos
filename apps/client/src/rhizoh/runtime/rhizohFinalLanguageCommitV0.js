/**
 * FINAL_LANGUAGE_COMMIT_STAGE — single writer with lock + idempotent cache.
 * Pipeline: LLM → guard → repair → FINAL_COMMIT → TTS/UI (no re-entrant double repair).
 */

import { guardLlmOutputLanguageV0 } from "./rhizohLlmOutputLanguageGuardV0.js";
import { resolveOutputLanguageCodeV0 } from "./rhizohOutputLanguagePolicyV0.js";

export const FINAL_LANGUAGE_COMMIT_STAGE_V0 = "castle.final_language_commit.v0";
export const LANGUAGE_COMMIT_LOCK_KEY_V0 = "language_commit_lock";

let lastCommitId = 0;
/** @type {string | null} */
let activeLockKey = null;
let commitReentryDepth = 0;
/** @type {string | null} */
let reentryIdempotencyKey = null;
/** @type {object | null} */
let reentryCommit = null;

/** @type {Map<string, object>} */
const commitCacheByKey = new Map();

function simpleTextHashV0(s) {
  let h = 0;
  const t = String(s || "");
  for (let i = 0; i < t.length; i += 1) {
    h = (h * 31 + t.charCodeAt(i)) | 0;
  }
  return `h${Math.abs(h)}`;
}

/**
 * @param {string} key
 */
export function alreadyCommittedLanguageV0(key) {
  return Boolean(key && commitCacheByKey.has(key));
}

/**
 * @param {string} key
 */
export function readCachedLanguageCommitV0(key) {
  return key ? commitCacheByKey.get(key) || null : null;
}

/**
 * @param {string} text
 * @param {{
 *   source?: string,
 *   hardRewrite?: boolean,
 *   lockKey?: string,
 *   idempotencyKey?: string,
 *   traceId?: string
 * }} [opts]
 */
export function commitFinalUserVisibleLanguageV0(text, opts = {}) {
  const lockKey = String(opts.lockKey || LANGUAGE_COMMIT_LOCK_KEY_V0);
  const idempotencyKey = String(
    opts.idempotencyKey || opts.traceId || `${opts.source || "llm"}:${simpleTextHashV0(text)}`
  ).trim();

  if (alreadyCommittedLanguageV0(idempotencyKey)) {
    const cached = readCachedLanguageCommitV0(idempotencyKey);
    return Object.freeze({ ...cached, fromCache: true });
  }

  if (commitReentryDepth > 0 && reentryIdempotencyKey === idempotencyKey && reentryCommit) {
    return Object.freeze({ ...reentryCommit, fromCache: true, reentrant: true });
  }

  activeLockKey = lockKey;
  commitReentryDepth += 1;
  reentryIdempotencyKey = idempotencyKey;

  try {
    const raw = String(text || "").trim();
    const expectedLocale = resolveOutputLanguageCodeV0();
    const guard = guardLlmOutputLanguageV0(raw, {
      source: String(opts.source || "llm"),
      hardRewrite: opts.hardRewrite
    });

    const commit = Object.freeze({
      schema: FINAL_LANGUAGE_COMMIT_STAGE_V0,
      stage: FINAL_LANGUAGE_COMMIT_STAGE_V0,
      commitId: ++lastCommitId,
      lockKey,
      idempotencyKey,
      traceId: opts.traceId ? String(opts.traceId) : null,
      text: guard.text,
      expectedLocale,
      ok: guard.step === "pass" || guard.repaired,
      repaired: guard.repaired === true,
      guardStep: String(guard.step || "pass"),
      violation: guard.violation || null,
      fromCache: false,
      reentrant: false
    });

    commitCacheByKey.set(idempotencyKey, commit);
    if (commitCacheByKey.size > 64) {
      const first = commitCacheByKey.keys().next().value;
      if (first) commitCacheByKey.delete(first);
    }

    reentryCommit = commit;
    if (typeof window !== "undefined") {
      window.__CASTLE_LANGUAGE_LAST_COMMIT__ = commit;
    }
    return commit;
  } finally {
    commitReentryDepth -= 1;
    if (commitReentryDepth <= 0) {
      activeLockKey = null;
      reentryIdempotencyKey = null;
      reentryCommit = null;
    }
  }
}

/** @internal vitest */
export function __resetFinalLanguageCommitForTestV0() {
  lastCommitId = 0;
  activeLockKey = null;
  commitReentryDepth = 0;
  reentryIdempotencyKey = null;
  reentryCommit = null;
  commitCacheByKey.clear();
  if (typeof window !== "undefined") {
    try {
      delete window.__CASTLE_LANGUAGE_LAST_COMMIT__;
    } catch {
      /* noop */
    }
  }
}
