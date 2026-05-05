/**
 * End-to-end cognitive invoke: kernel pack → prompt → POST /rhizoh/llm (cognitiveInvoke) → parse intents → runRhizohAgentTurn → mesh publish hook.
 */
import { getCastleFlightConfig } from "../../castleFlight/castleFlightConfig";
import { getOrCreateCastleDevUid } from "../../rhizoh/useRhizohGatewayMonitor";
import { buildRhizohMemoryContextPackWithSalience } from "./salienceScorer";
import { composeRhizohLlmPrompt } from "./promptComposer";
import { parseAgentBridgeResponse } from "./agentBridge";
import { runRhizohAgentTurn, type RhizohTurnRunnerOptions, type RhizohTurnRunnerResult } from "./rhizohTurnRunner";
import { scheduleGreenRoomMeshCausalPublish } from "./greenRoomPresenceMesh";
import type { RhizohAgentToolIntentV0 } from "../types/rskOntology";
import { getStudioKernelState } from "../store/internalStore";
import type { BuildRhizohMemoryContextPackOptions } from "./contextBuilder";

export type RhizohCognitiveInvokeResult =
  | {
      ok: true;
      assistantReply: string;
      directive: string;
      intentsRaw: unknown[];
      turn: RhizohTurnRunnerResult;
    }
  | { ok: false; error: string; assistantReply?: string; directive?: string; turn?: RhizohTurnRunnerResult };

export type RhizohCognitiveInvokeOptions = {
  userGoal: string;
  idToken?: string;
  provider?: string;
  llmKeySource?: string;
  fetchImpl?: typeof fetch;
  packOpts?: BuildRhizohMemoryContextPackOptions;
  turnRunnerOpts?: RhizohTurnRunnerOptions;
};

function coerceIntentsFromGateway(raw: unknown[]): RhizohAgentToolIntentV0[] {
  const wrapped = JSON.stringify({ intents: raw });
  const p = parseAgentBridgeResponse(wrapped);
  if (p.ok) return p.intents;
  return [];
}

/**
 * `GatewayComplete` equivalent on the client: one round-trip to `/rhizoh/llm` with `context.cognitiveInvoke`, then runner + mesh schedule.
 */
export async function invokeRhizohCognitiveTurn(opts: RhizohCognitiveInvokeOptions): Promise<RhizohCognitiveInvokeResult> {
  const fetchFn = opts.fetchImpl ?? fetch;
  const cfg = getCastleFlightConfig();
  const endpoint = cfg.rhizohLlmHttp;
  if (!endpoint) {
    return { ok: false, error: "rhizoh_llm_http_unconfigured" };
  }

  const s = getStudioKernelState();
  const pack = buildRhizohMemoryContextPackWithSalience(s, opts.packOpts);
  const { system, user } = composeRhizohLlmPrompt(pack, opts.userGoal);
  const message = [
    "[COGNITIVE_INVOKE — Studio kernel pack + user goal]",
    "Follow system JSON shape (reply, directive, intents).",
    "---",
    user
  ].join("\n");

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    "X-Castle-Dev-Uid": getOrCreateCastleDevUid()
  };
  if (opts.idToken && String(opts.idToken).trim()) {
    headers.Authorization = `Bearer ${String(opts.idToken).trim()}`;
  } else if (cfg.rhizohLlmToken) {
    headers.Authorization = `Bearer ${cfg.rhizohLlmToken}`;
  }

  try {
    const res = await fetchFn(endpoint, {
      method: "POST",
      headers,
      body: JSON.stringify({
        message,
        provider: opts.provider ?? "openai",
        llmKeySource: opts.llmKeySource ?? "auto",
        connectionId: "",
        context: {
          agentId: "",
          cognitiveInvoke: true,
          rhizohCognitivePack: pack,
          cognitivePromptSystem: system,
          layerId: 10,
          layerCode: "COG",
          layerName: "Cognitive",
          mission: "Kernel agent bridge",
          detail: "",
          reality: "",
          camera: "",
          continuity: {
            runtime: {
              cognitiveInvoke: true,
              userGoal: opts.userGoal.slice(0, 800)
            }
          },
          rhizohMemoryContract:
            "Return strict JSON only. intents must be valid tool calls the client can execute via KernelGuard."
        },
        options: { maxTokens: 512, language: "tr-TR" }
      }),
      signal: typeof AbortSignal !== "undefined" && typeof AbortSignal.timeout === "function" ? AbortSignal.timeout(55_000) : undefined
    });

    if (!res.ok) {
      return { ok: false, error: `rhizoh_llm_http_${res.status}` };
    }

    const data = (await res.json()) as {
      reply?: string;
      directive?: string;
      intents?: unknown[];
    };

    const assistantReply = String(data.reply ?? "");
    const directive = String(data.directive ?? "NONE");
    const intentsRaw = Array.isArray(data.intents) ? data.intents : [];
    const intents = coerceIntentsFromGateway(intentsRaw);
    const turn = runRhizohAgentTurn(intents, opts.turnRunnerOpts);

    scheduleGreenRoomMeshCausalPublish();

    return { ok: true, assistantReply, directive, intentsRaw, turn };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return { ok: false, error: msg || "cognitive_invoke_failed" };
  }
}
