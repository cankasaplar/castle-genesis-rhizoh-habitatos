/**
 * Castle Conversation Thread v1.2 — parallel thread memory (not global flat memory).
 * @see apps/client/docs/RHIZOH_CASTLE_OS_V1_2.md
 */

export const CASTLE_CONVERSATION_THREAD_SCHEMA_V1_2 = "castle.conversation_thread.v1.2";

/** @type {Map<string, object>} */
const threadsV1_2 = new Map();
/** @type {Map<string, object[]>} threadId → anchors */
const threadMemoryV1_2 = new Map();
let threadSequenceV1_2 = 0;

const THREAD_MAX_V1_2 = 32;
const THREAD_MEMORY_MAX_V1_2 = 24;

/**
 * @param {object} input
 */
export function createConversationThreadV1_2(input = {}) {
  threadSequenceV1_2 += 1;
  const threadId = input.threadId || `thread_${threadSequenceV1_2.toString(36)}`;
  const thread = Object.freeze({
    schema: CASTLE_CONVERSATION_THREAD_SCHEMA_V1_2,
    threadId,
    ownerId: String(input.ownerId || "user_local"),
    topicLabel: input.topicLabel ? String(input.topicLabel).slice(0, 64) : "general",
    priority: Number(input.priority) || 50,
    lastActivityMs: Number(input.atMs) || Date.now(),
    active: input.active !== false
  });
  threadsV1_2.set(threadId, thread);
  if (threadsV1_2.size > THREAD_MAX_V1_2) {
    const oldest = [...threadsV1_2.values()].sort((a, b) => a.lastActivityMs - b.lastActivityMs)[0];
    if (oldest) threadsV1_2.delete(oldest.threadId);
  }
  publishThreadsV1_2();
  return thread;
}

/**
 * Assign identity event to thread — auto-create or match topic.
 * @param {object} identityEvent
 * @param {object} [hint]
 */
export function assignEventToThreadV1_2(identityEvent, hint = {}) {
  const ownerId = identityEvent.ownerId;
  const preview = String(identityEvent.preview || "").toLowerCase();

  let thread = hint.threadId ? threadsV1_2.get(hint.threadId) : null;

  if (!thread) {
    for (const t of threadsV1_2.values()) {
      if (t.ownerId !== ownerId || !t.active) continue;
      if (preview && t.topicLabel !== "general" && preview.includes(t.topicLabel.slice(0, 8))) {
        thread = t;
        break;
      }
    }
  }

  if (!thread) {
    const topicLabel = hint.topicLabel || inferTopicLabelV1_2(preview);
    thread = createConversationThreadV1_2({
      ownerId,
      topicLabel,
      priority: identityEvent.type === "emergency" ? 95 : identityEvent.type === "intent" ? 70 : 40,
      atMs: identityEvent.timestamp
    });
  }

  const updated = Object.freeze({
    ...thread,
    lastActivityMs: identityEvent.timestamp,
    priority: Math.max(thread.priority, identityEvent.type === "intent" ? 65 : thread.priority)
  });
  threadsV1_2.set(thread.threadId, updated);
  publishThreadsV1_2();

  return Object.freeze({
    ...identityEvent,
    threadId: updated.threadId,
    threadPriority: updated.priority
  });
}

function inferTopicLabelV1_2(preview) {
  if (/pozisyon|hamle|maç|match|goal/.test(preview)) return "co_watch_sports";
  if (/audiobook|chapter|bölüm/.test(preview)) return "audiobook";
  if (/teknik|api|kod|bug/.test(preview)) return "technical";
  return "general";
}

/**
 * Thread-scoped memory write — not global flat storage.
 * @param {object} anchor
 */
export function writeThreadMemoryV1_2(anchor = {}) {
  const threadId = String(anchor.threadId || "");
  if (!threadId) return null;

  if (!threadMemoryV1_2.has(threadId)) threadMemoryV1_2.set(threadId, []);
  const list = threadMemoryV1_2.get(threadId);
  const row = Object.freeze({
    anchorId: `tmem_${Date.now().toString(36)}_${list.length}`,
    threadId,
    ownerId: anchor.ownerId || null,
    preview: anchor.preview ? String(anchor.preview).slice(0, 160) : null,
    mediaPositionMs: anchor.mediaPositionMs ?? null,
    atMs: Number(anchor.atMs) || Date.now()
  });
  list.push(row);
  if (list.length > THREAD_MEMORY_MAX_V1_2) list.shift();
  publishThreadsV1_2();
  return row;
}

export function getThreadMemoryV1_2(threadId) {
  return Object.freeze([...(threadMemoryV1_2.get(threadId) || [])]);
}

export function getConversationThreadPriorityV1_2(threadId) {
  return threadsV1_2.get(threadId)?.priority ?? 0;
}

export function getActiveThreadsV1_2(ownerId) {
  return Object.freeze(
    [...threadsV1_2.values()]
      .filter((t) => !ownerId || t.ownerId === ownerId)
      .sort((a, b) => b.lastActivityMs - a.lastActivityMs)
  );
}

export function setPrimaryThreadV1_2(threadId) {
  const thread = threadsV1_2.get(threadId);
  if (!thread) return null;
  publishThreadsV1_2();
  return thread;
}

function publishThreadsV1_2() {
  if (typeof window === "undefined") return;
  window.__castle = window.__castle || {};
  window.__castle.conversationThreads = Object.freeze({
    threads: Object.freeze([...threadsV1_2.values()]),
    memoryThreadIds: Object.freeze([...threadMemoryV1_2.keys()])
  });
}

/** @internal vitest */
export function __resetConversationThreadsForTestV1_2() {
  threadsV1_2.clear();
  threadMemoryV1_2.clear();
  threadSequenceV1_2 = 0;
}
