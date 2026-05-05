/**
 * Agent bridge — LLM response text → RhizohAgentToolIntentV0[] (parse only).
 * Execution (KernelGuard + appendCausalNode) lives in a runner slice, not here.
 */
import type { RhizohAgentToolIntentV0, RhizohAttentionFocusV0 } from "../types/rskOntology";

const ATTENTION: readonly RhizohAttentionFocusV0[] = ["world", "room", "social", "broadcast", "memory"];

export type AgentBridgeParseResult =
  | { ok: true; intents: RhizohAgentToolIntentV0[] }
  | { ok: false; error: string };

function stripCodeFence(raw: string): string {
  let t = raw.trim();
  const fence = /^```(?:json)?\s*([\s\S]*?)```$/im.exec(t);
  if (fence) return fence[1].trim();
  return t;
}

function isIntentObj(x: unknown): x is Record<string, unknown> {
  return x != null && typeof x === "object" && !Array.isArray(x);
}

function coerceIntent(x: unknown, i: number): RhizohAgentToolIntentV0 | null {
  if (!isIntentObj(x)) return null;
  const toolId = x.toolId;
  if (typeof toolId !== "string" || !toolId.trim()) {
    return null;
  }
  const payload = x.payload;
  if (payload == null || typeof payload !== "object" || Array.isArray(payload)) {
    return null;
  }
  const kernelAction = x.kernelAction;
  const confidence = x.confidence;
  const rationale = x.rationale;
  const attentionFocus = x.attentionFocus;
  const focusOk =
    typeof attentionFocus === "string" && (ATTENTION as readonly string[]).includes(attentionFocus)
      ? (attentionFocus as RhizohAttentionFocusV0)
      : undefined;
  return {
    toolId: toolId.trim(),
    ...(typeof kernelAction === "string" && kernelAction.trim() ? { kernelAction: kernelAction.trim() } : {}),
    payload: payload as Record<string, unknown>,
    ...(typeof confidence === "number" && Number.isFinite(confidence) ? { confidence } : {}),
    ...(typeof rationale === "string" ? { rationale: rationale.slice(0, 512) } : {}),
    ...(focusOk ? { attentionFocus: focusOk } : {})
  };
}

/**
 * Parse model output: expects `{ "intents": [ ... ] }` or a bare array of intents.
 */
export function parseAgentBridgeResponse(raw: string): AgentBridgeParseResult {
  const text = stripCodeFence(raw);
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    return { ok: false, error: "agent_bridge_json_invalid" };
  }

  let arr: unknown[];
  if (Array.isArray(parsed)) {
    arr = parsed;
  } else if (isIntentObj(parsed) && Array.isArray(parsed.intents)) {
    arr = parsed.intents;
  } else {
    return { ok: false, error: "agent_bridge_shape_invalid" };
  }

  const intents: RhizohAgentToolIntentV0[] = [];
  for (let i = 0; i < arr.length; i++) {
    const one = coerceIntent(arr[i], i);
    if (one) intents.push(one);
  }

  return { ok: true, intents };
}
