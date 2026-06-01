/**
 * L1-alpha life store — append/read only (no summaries, projection, recall, or WAL).
 * @see docs/RHIZOH_L1_LIFE_CONTINUITY_V0.md
 * @see docs/schemas/life-continuity-v0.schema.json
 * SPECFLOW: FUTURE-PROOF-ONLY — product continuity; must not write execution core / seal graph.
 */

export const LIFE_CONTINUITY_CONTRACT_V0 = "life-continuity-v0";
export const LIFE_STORE_CLASS_V0 = "life_store";

const MAX_TURN_TEXT = 16384;
const MAX_NOTE_BODY = 16384;
const MAX_URL = 2048;
const MAX_TITLE = 280;
const DEFAULT_RECENT_LIMIT = 50;
const MAX_RECENT_LIMIT = 256;

/**
 * @param {unknown} value
 * @param {number} max
 */
function clampString(value, max) {
  return String(value ?? "").slice(0, max);
}

function isoNow() {
  return new Date().toISOString();
}

/**
 * @param {string} prefix
 */
function newEntityId(prefix) {
  const tail =
    typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
      ? crypto.randomUUID().replace(/-/g, "").slice(0, 12)
      : `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;
  return `${prefix}_${tail}`;
}

/**
 * @param {Record<string, unknown>} row
 * @returns {{ ok: true, row: Record<string, unknown> } | { ok: false, code: string, detail?: string }}
 */
function requireUserId(row) {
  const user_id = clampString(row.user_id, 128);
  if (user_id.length < 8) return { ok: false, code: "invalid_user_id" };
  return { ok: true, row: { ...row, user_id } };
}

/**
 * @returns {import('./lifeContinuityStoreV0.js').LifeContinuityStoreV0}
 */
export function createLifeContinuityStoreV0() {
  /** @type {Map<string, Record<string, unknown>>} */
  const threads = new Map();
  /** @type {Map<string, Record<string, unknown>[]>} */
  const turnsByThread = new Map();
  /** @type {Map<string, Record<string, unknown>>} */
  const notes = new Map();
  /** @type {Map<string, Record<string, unknown>>} */
  const links = new Map();

  /**
   * @param {string} thread_id
   * @param {string} [user_id]
   */
  function threadVisible(thread_id, user_id) {
    const t = threads.get(thread_id);
    if (!t || t.status === "erased") return null;
    if (user_id && t.user_id !== user_id) return null;
    return t;
  }

  return {
    contract_version: LIFE_CONTINUITY_CONTRACT_V0,

    /**
     * Append a Castle chat turn. Creates thread on first write when `thread_id` omitted.
     * @param {Record<string, unknown>} input
     */
    appendTurn(input) {
      const uid = requireUserId(input);
      if (!uid.ok) return uid;

      const role = clampString(input.role, 16);
      if (!["user", "assistant", "system"].includes(role)) {
        return { ok: false, code: "invalid_role" };
      }

      const text = clampString(input.text, MAX_TURN_TEXT);
      const at = clampString(input.at, 40) || isoNow();
      let thread_id = clampString(input.thread_id, 128);

      let thread = thread_id ? threads.get(thread_id) : null;
      if (thread_id && (!thread || thread.status === "erased")) {
        return { ok: false, code: "thread_not_found" };
      }
      if (thread && thread.user_id !== uid.row.user_id) {
        return { ok: false, code: "thread_user_mismatch" };
      }

      if (!thread) {
        thread_id = newEntityId("thr");
        const title =
          role === "user" && text.trim()
            ? clampString(text.trim().split(/\s+/).slice(0, 8).join(" "), MAX_TITLE)
            : "Sohbet";
        thread = Object.freeze({
          contract_version: LIFE_CONTINUITY_CONTRACT_V0,
          life_store_class: LIFE_STORE_CLASS_V0,
          thread_id,
          user_id: uid.row.user_id,
          title: title || "Sohbet",
          status: "active",
          created_at: at,
          updated_at: at,
          last_turn_at: at,
          source_surface: "castle_chat"
        });
        threads.set(thread_id, thread);
        turnsByThread.set(thread_id, []);
      }

      const turn_id = clampString(input.turn_id, 128) || newEntityId("trn");
      const turn = Object.freeze({
        contract_version: LIFE_CONTINUITY_CONTRACT_V0,
        life_store_class: LIFE_STORE_CLASS_V0,
        turn_id,
        thread_id,
        user_id: uid.row.user_id,
        role,
        text,
        at,
        correlation_id: clampString(input.correlation_id, 200) || undefined,
        gateway_trace_id: clampString(input.gateway_trace_id, 200) || undefined,
        reply_schema_version: clampString(input.reply_schema_version, 32) || undefined,
        status: "active"
      });

      const list = turnsByThread.get(thread_id) || [];
      list.push(turn);
      list.sort((a, b) => String(a.at).localeCompare(String(b.at)));
      turnsByThread.set(thread_id, list);

      const updated = Object.freeze({
        ...thread,
        updated_at: at,
        last_turn_at: at,
        title:
          thread.title === "Sohbet" && role === "user" && text.trim()
            ? clampString(text.trim().split(/\s+/).slice(0, 8).join(" "), MAX_TITLE)
            : thread.title
      });
      threads.set(thread_id, updated);

      return { ok: true, thread: updated, turn };
    },

    /**
     * @param {Record<string, unknown>} input
     */
    appendNote(input) {
      const uid = requireUserId(input);
      if (!uid.ok) return uid;

      const body = clampString(input.body, MAX_NOTE_BODY);
      if (!body.trim()) return { ok: false, code: "empty_note" };

      const thread_id = clampString(input.thread_id, 128);
      if (thread_id && !threadVisible(thread_id, uid.row.user_id)) {
        return { ok: false, code: "thread_not_found" };
      }

      const at = clampString(input.at, 40) || isoNow();
      const note_id = clampString(input.note_id, 128) || newEntityId("note");
      const note = Object.freeze({
        contract_version: LIFE_CONTINUITY_CONTRACT_V0,
        life_store_class: LIFE_STORE_CLASS_V0,
        note_id,
        user_id: uid.row.user_id,
        body,
        at,
        thread_id: thread_id || undefined,
        status: "active"
      });
      notes.set(note_id, note);
      return { ok: true, note };
    },

    /**
     * @param {Record<string, unknown>} input
     */
    appendLink(input) {
      const uid = requireUserId(input);
      if (!uid.ok) return uid;

      const url = clampString(input.url, MAX_URL);
      if (url.length < 8) return { ok: false, code: "invalid_url" };

      const thread_id = clampString(input.thread_id, 128);
      if (thread_id && !threadVisible(thread_id, uid.row.user_id)) {
        return { ok: false, code: "thread_not_found" };
      }

      const at = clampString(input.at, 40) || isoNow();
      const link_id = clampString(input.link_id, 128) || newEntityId("lnk");
      const link = Object.freeze({
        contract_version: LIFE_CONTINUITY_CONTRACT_V0,
        life_store_class: LIFE_STORE_CLASS_V0,
        link_id,
        user_id: uid.row.user_id,
        url,
        title: clampString(input.title, MAX_TITLE) || undefined,
        at,
        thread_id: thread_id || undefined,
        status: "active"
      });
      links.set(link_id, link);
      return { ok: true, link };
    },

    /**
     * @param {string} threadId
     * @param {{ user_id?: string }} [opts]
     */
    getThread(threadId, opts = {}) {
      const thread_id = clampString(threadId, 128);
      const user_id = opts.user_id ? clampString(opts.user_id, 128) : undefined;
      const t = threadVisible(thread_id, user_id);
      return t ? { ok: true, thread: t } : { ok: false, code: "thread_not_found" };
    },

    /**
     * @param {string} threadId
     * @param {{ limit?: number, user_id?: string }} [opts]
     */
    getRecentTurns(threadId, opts = {}) {
      const thread_id = clampString(threadId, 128);
      const user_id = opts.user_id ? clampString(opts.user_id, 128) : undefined;
      if (!threadVisible(thread_id, user_id)) {
        return { ok: false, code: "thread_not_found", turns: [] };
      }

      const limit = Math.min(
        MAX_RECENT_LIMIT,
        Math.max(1, Math.floor(Number(opts.limit) || DEFAULT_RECENT_LIMIT))
      );
      const all = turnsByThread.get(thread_id) || [];
      const active = all.filter((t) => t.status !== "erased");
      const turns = active.slice(-limit).reverse();
      return { ok: true, thread_id, turns };
    },

    /**
     * Threads for user, newest `updated_at` first (recall / active thread resolution).
     * @param {string} userId
     * @param {{ limit?: number }} [opts]
     */
    listThreadsForUser(userId, opts = {}) {
      const user_id = clampString(userId, 128);
      if (user_id.length < 8) return { ok: false, code: "invalid_user_id", threads: [] };
      const limit = Math.min(64, Math.max(1, Math.floor(Number(opts.limit) || 32)));
      const rows = [];
      for (const t of threads.values()) {
        if (t.user_id === user_id && t.status !== "erased") rows.push(t);
      }
      rows.sort((a, b) => String(b.updated_at).localeCompare(String(a.updated_at)));
      return { ok: true, threads: rows.slice(0, limit) };
    },

    /**
     * Flat turn scan for deterministic recall (newest first).
     * @param {string} userId
     * @param {{ maxTurns?: number }} [opts]
     */
    getTurnsForUser(userId, opts = {}) {
      const user_id = clampString(userId, 128);
      if (user_id.length < 8) return { ok: false, code: "invalid_user_id", rows: [] };
      const maxTurns = Math.min(2000, Math.max(1, Math.floor(Number(opts.maxTurns) || 500)));
      /** @type {{ turn: Record<string, unknown>, thread: Record<string, unknown> }[]} */
      const rows = [];
      for (const [thread_id, list] of turnsByThread) {
        const thread = threadVisible(thread_id, user_id);
        if (!thread) continue;
        for (const turn of list) {
          if (turn.status !== "erased") rows.push({ turn, thread });
        }
      }
      rows.sort((a, b) => String(b.turn.at).localeCompare(String(a.turn.at)));
      return { ok: true, rows: rows.slice(0, maxTurns) };
    },

    /** Test / ops introspection — not for production UI. */
    _stats() {
      return {
        threads: threads.size,
        notes: notes.size,
        links: links.size,
        turn_rows: [...turnsByThread.values()].reduce((n, a) => n + a.length, 0)
      };
    },

    /** Test isolation — clears in-memory maps. */
    _reset() {
      threads.clear();
      turnsByThread.clear();
      notes.clear();
      links.clear();
    }
  };
}

/** @type {ReturnType<typeof createLifeContinuityStoreV0> | null} */
let storeSingleton = null;

export function getLifeContinuityStoreV0() {
  if (!storeSingleton) storeSingleton = createLifeContinuityStoreV0();
  return storeSingleton;
}

export function resetLifeContinuityStoreV0() {
  storeSingleton = null;
}

/**
 * @typedef {ReturnType<typeof createLifeContinuityStoreV0>} LifeContinuityStoreV0
 */
