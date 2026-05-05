/**
 * Rhizoh gateway turn — ince orchestrator.
 * Yeni LLM motoru değil; mevcut memoryStore + rhizohLlmGateway + persist/transcript
 * adımlarını tek giriş noktasında sıraya koyar (trace / test / genişleme için).
 */
import { randomUUID } from "node:crypto";
import { diagnoseRhizohLlmContext, queryRhizohLlm } from "./rhizohLlmGateway.js";
import { logLlmAccess } from "./castleLlmAudit.js";
import { countArtifactLayerDocuments } from "./artifactCounts.js";
import { getFirebasePersistence } from "./firebasePersistence.js";
import { appendMemory, autoCompactMemories, getMemoryContext, getPersonaGoalMemory } from "./memoryStore.js";
import { addTranscript } from "./studioOpsStore.js";

function maskOpaqueId(value) {
  const t = String(value || "");
  if (!t) return "(empty)";
  if (t.length <= 8) return "****";
  return `${t.slice(0, 4)}…${t.slice(-2)}`;
}

/**
 * @typedef {"env"|"user_connection"|"auto"} RhizohLlmKeyMode
 */

/**
 * @param {object} input
 * @param {Record<string, unknown>} input.safePayload
 * @param {{ ok: boolean, uid?: string, mode?: string }} input.auth
 * @param {RhizohLlmKeyMode} input.keyMode
 * @param {{ id?: string, provider?: string, model?: string, apiKey?: string } | null} input.conn
 * @param {unknown} input.resolvedProvider
 * @param {unknown} input.resolvedModel
 * @param {string} input.connApiKey
 */
export async function rhizohGatewayTurn(input) {
  const { safePayload, auth, keyMode, conn, resolvedProvider, resolvedModel, connApiKey } = input;
  const traceId = randomUUID();
  const t0 = Date.now();
  /** @type {{ name: string, ms: number }[]} */
  const spinePhases = [];
  const mark = (name) => {
    spinePhases.push({ name, ms: Date.now() - t0 });
  };

  mark("memory_context");
  const memory = await getMemoryContext({
    uid: auth.ok ? auth.uid : "anon",
    agentId: String(safePayload?.context?.agentId || ""),
    query: String(safePayload?.message || ""),
    limit: Number(safePayload?.memoryLimit || 30)
  });

  mark("full_context");
  const fullContext = {
    ...(safePayload?.context || {}),
    memory
  };

  if (process.env.CASTLE_RHIZOH_LLM_IDENTITY_LOG === "1") {
    const cont = fullContext?.continuity && typeof fullContext.continuity === "object" ? fullContext.continuity : {};
    const memoryBlk = fullContext?.memory && typeof fullContext.memory === "object" ? fullContext.memory : {};
    const goals = Array.isArray(memoryBlk.goals) ? memoryBlk.goals.length : 0;
    const episodic = Array.isArray(memoryBlk.episodic) ? memoryBlk.episodic.length : 0;
    const semantic = Array.isArray(memoryBlk.semantic) ? memoryBlk.semantic.length : 0;
    console.info(
      "[rhizoh.llm.identity]",
      JSON.stringify({
        traceId,
        identityNarrativeChars: String(cont.identityNarrative || "").length,
        recentTurns: Array.isArray(cont.recentTurns) ? cont.recentTurns.length : 0,
        profileGoals: Array.isArray(cont.persona?.goals) ? cont.persona.goals.length : 0,
        memoryGoals: goals,
        memoryEpisodic: episodic,
        memorySemantic: semantic
      })
    );
  }

  if (process.env.CASTLE_RHIZOH_LLM_DIAG === "1") {
    const { db } = getFirebasePersistence();
    const artifactAppId = String(process.env.CASTLE_ARTIFACT_APP_ID || "castle-vnext-core").trim();
    const artifactStats = db ? await countArtifactLayerDocuments(db, artifactAppId) : null;
    const diag = diagnoseRhizohLlmContext(fullContext, artifactStats);
    const persistenceMode = getFirebasePersistence().mode;
    console.info(
      "[rhizoh.llm.diag]",
      JSON.stringify({
        traceId,
        authOk: auth.ok,
        authMode: auth.ok ? auth.mode : "none",
        uidMask: auth.ok ? maskOpaqueId(auth.uid) : "anon",
        agentIdMask: maskOpaqueId(safePayload?.context?.agentId),
        persistenceMode,
        artifactAppId,
        llmKeyMode: keyMode,
        ...(artifactStats?.error ? { artifactCountError: artifactStats.error } : {}),
        ...diag
      })
    );
  }

  mark("llm_query");
  const result = await queryRhizohLlm(
    {
      ...safePayload,
      provider: resolvedProvider,
      model: resolvedModel,
      apiKey: connApiKey,
      context: fullContext
    },
    { llmKeySource: keyMode }
  );

  mark("audit");
  logLlmAccess({
    route: "/rhizoh/llm",
    uid: auth.ok ? auth.uid : null,
    llmKeyBillingOwner: result.llmKeyBillingOwner,
    llmKeyOrigin: result.llmKeyOrigin,
    provider: result.provider,
    model: result.model,
    connectionId: keyMode === "user_connection" ? conn?.id : null
  });

  mark("persist");
  if (auth.ok) {
    const profile = await getPersonaGoalMemory(auth.uid);
    const importanceUp =
      Array.isArray(profile?.goals) &&
      profile.goals.some((g) => String(safePayload?.message || "").toLowerCase().includes(String(g).toLowerCase()))
        ? 0.7
        : 0.5;
    await appendMemory({
      scope: "users",
      id: auth.uid,
      text: `USER:${String(safePayload?.message || "").slice(0, 1000)}`,
      tags: ["dialog", "user"],
      importance: importanceUp,
      kind: "episodic",
      meta: { source: "rhizoh.llm", traceId }
    });
    await appendMemory({
      scope: "users",
      id: auth.uid,
      text: `RHIZOH:${String(result?.reply || "").slice(0, 1200)}`,
      tags: ["dialog", "rhizoh", String(result?.directive || "none").toLowerCase()],
      importance: 0.6,
      kind: "episodic",
      meta: { source: "rhizoh.llm", provider: result?.provider, model: result?.model, traceId }
    });
    await addTranscript(auth.uid, {
      source: "rhizoh",
      eventType: "dialog",
      text: `${String(safePayload?.message || "").slice(0, 240)} => ${String(result?.reply || "").slice(0, 360)}`,
      roomId: "studio-main",
      meta: { directive: result?.directive, provider: result?.provider, llmKeyBillingOwner: result.llmKeyBillingOwner, traceId }
    });
    await autoCompactMemories({ scope: "users", id: auth.uid });
  }

  mark("done");
  const turnLatencyMs = Date.now() - t0;

  const forcePhases = process.env.CASTLE_RHIZOH_SPINE_TRACE === "1";
  const sampleStr = String(process.env.CASTLE_RHIZOH_TRACE_SAMPLE ?? "").trim();
  const sampleRate = sampleStr === "" ? 0 : Math.min(1, Math.max(0, Number(sampleStr)));
  const sampled = sampleRate > 0 && Number.isFinite(sampleRate) && Math.random() < sampleRate;
  const spinePhasesOut = forcePhases || sampled ? spinePhases : undefined;
  /** İstemci: spinePhases yalnızca örneklemede mi, tam trace’de mi — netlik için */
  const sampledTrace = spinePhasesOut ? !forcePhases && sampled : undefined;

  return {
    result,
    traceId,
    turnLatencyMs,
    spinePhases: spinePhasesOut,
    sampledTrace
  };
}
