/**
 * Gateway hook — append Castle turns to life store after LLM response.
 * Opt-in: CASTLE_LIFE_CONTINUITY_APPEND=1
 * @see docs/RHIZOH_L1_LIFE_CONTINUITY_V0.md
 */

import { getLifeContinuityStoreV0 } from "./lifeContinuityStoreV0.js";
import { isLikelyRecallQueryV0, recallCitationsV0 } from "./lifeRecallEngineV0.js";
import {
  isLifeEntityResolverEnabledV0,
  resolveAndProjectLifeContinuityV0
} from "./lifeContinuityResolverV0.js";

export function isLifeContinuityAppendEnabledV0() {
  return String(process.env.CASTLE_LIFE_CONTINUITY_APPEND || "").trim() === "1";
}

export function isLifeContinuityRecallAttachEnabledV0() {
  return String(process.env.CASTLE_LIFE_CONTINUITY_RECALL || "").trim() === "1";
}

/**
 * @param {Record<string, unknown>} safePayload
 * @param {import('./lifeContinuityStoreV0.js').LifeContinuityStoreV0} [store]
 */
export function resolveLifeThreadIdFromPayloadV0(safePayload, store = getLifeContinuityStoreV0()) {
  const ctx = safePayload?.context && typeof safePayload.context === "object" ? safePayload.context : {};
  const life =
    ctx.life_continuity && typeof ctx.life_continuity === "object" ? ctx.life_continuity : {};
  const fromLife = String(life.thread_id || life.threadId || "").trim();
  if (fromLife) return fromLife;

  const cont = ctx.continuity && typeof ctx.continuity === "object" ? ctx.continuity : {};
  const meta = cont.meta && typeof cont.meta === "object" ? cont.meta : {};
  const fromMeta = String(meta.life_thread_id || meta.lifeThreadId || "").trim();
  if (fromMeta) return fromMeta;

  return "";
}

/**
 * After gateway turn: persist user + assistant turns; optional deterministic recall attach.
 * @param {{
 *   auth: { ok: boolean, uid?: string },
 *   safePayload: Record<string, unknown>,
 *   result: Record<string, unknown>,
 *   traceId: string,
 *   store?: import('./lifeContinuityStoreV0.js').LifeContinuityStoreV0
 * }} input
 */
export function appendLifeContinuityAfterGatewayTurnV0(input) {
  if (!isLifeContinuityAppendEnabledV0()) {
    return { ok: true, skipped: true, reason: "append_disabled" };
  }
  const { auth, safePayload, result, traceId } = input;
  if (!auth?.ok || !auth.uid) {
    return { ok: true, skipped: true, reason: "anon" };
  }

  const store = input.store || getLifeContinuityStoreV0();
  const user_id = String(auth.uid);
  const message = String(safePayload?.message || "").trim();
  const reply = String(result?.reply || "").trim();
  if (!message && !reply) {
    return { ok: true, skipped: true, reason: "empty_turn" };
  }

  let thread_id = resolveLifeThreadIdFromPayloadV0(safePayload, store);
  const correlation_id = String(traceId || safePayload?.traceId || "").trim() || undefined;
  const at = new Date().toISOString();

  /** @type {Record<string, unknown>[]} */
  const appended = [];

  if (message) {
    const userRow = store.appendTurn({
      user_id,
      thread_id: thread_id || undefined,
      role: "user",
      text: message,
      at,
      correlation_id,
      gateway_trace_id: traceId
    });
    if (!userRow.ok) return { ok: false, code: userRow.code, phase: "user_turn" };
    thread_id = String(userRow.thread.thread_id);
    appended.push(userRow.turn);
  }

  if (reply && thread_id) {
    const asstRow = store.appendTurn({
      user_id,
      thread_id,
      role: "assistant",
      text: reply,
      at,
      correlation_id,
      gateway_trace_id: traceId,
      reply_schema_version: String(result?.replySchemaVersion || result?.reply_schema_version || "")
    });
    if (!asstRow.ok) return { ok: false, code: asstRow.code, phase: "assistant_turn" };
    appended.push(asstRow.turn);
  }

  const out = {
    ok: true,
    thread_id,
    turns_appended: appended.length,
    turn_ids: appended.map((t) => t.turn_id)
  };

  if (isLifeContinuityRecallAttachEnabledV0() && message && isLikelyRecallQueryV0(message)) {
    const recall = recallCitationsV0({ user_id, query: message, store });
    if (recall.ok && recall.recall) {
      Object.assign(result, {
        lifeContinuityRecall: recall.recall,
        lifeContinuityRecallMeta: Object.freeze({
          mode: recall.recall.recall_mode,
          citation_count: recall.recall.citations.length,
          tokens_matched: recall.tokens_matched
        })
      });
      return { ...out, recall_attached: true };
    }
  }

  Object.assign(result, {
    lifeContinuity: Object.freeze({
      thread_id,
      turns_appended: appended.length
    })
  });

  if (isLifeEntityResolverEnabledV0() && thread_id) {
    const resolved = resolveAndProjectLifeContinuityV0({
      user_id,
      thread_id,
      turn_ids: appended.map((t) => String(t.turn_id)),
      safePayload,
      attach_projection: true
    });
    if (resolved.ok && resolved.projection) {
      Object.assign(result, {
        lifeEntityProjection: resolved.projection,
        lifeEntityResolver: Object.freeze({
          mode: resolved.mode,
          castle_id: resolved.castle_id,
          edges_created: resolved.edges_created
        })
      });
    } else if (resolved.ok && resolved.skipped_graph) {
      Object.assign(result, {
        lifeEntityResolver: Object.freeze({ skipped: true, reason: resolved.reason })
      });
    }
  }

  return out;
}
