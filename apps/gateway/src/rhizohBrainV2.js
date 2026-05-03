import { getMemoryContext, getPersonaGoalMemory } from "./memoryStore.js";
import { listAgentIdentities } from "./agentIdentityStore.js";
import { queueAcademyEvent } from "./academyEventEngine.js";
import { queryRhizohLlm } from "./rhizohLlmGateway.js";

function deriveDirective(message = "") {
  const t = String(message || "").toLowerCase();
  if (/castle|academy|kampüs|kampus/.test(t)) return "ZOOM_CASTLE";
  if (/agent|ajan|squad/.test(t)) return "ZOOM_AGENT";
  if (/overview|istanbul|city|şehir|sehir/.test(t)) return "ISTANBUL_OVERVIEW";
  return "FOCUS_RHIZOH";
}

function detectEventIntent(message = "") {
  const t = String(message || "").toLowerCase();
  if (/exam|sınav|sinav/.test(t)) return "EXAM";
  if (/mentor|coach|öğret|ogret|teach/.test(t)) return "MENTOR_SESSION";
  if (/duel|challenge|yarış|yaris/.test(t)) return "DUEL";
  if (/research|araştır|arastir/.test(t)) return "RESEARCH_QUEST";
  if (/lecture|ders/.test(t)) return "LECTURE";
  return "";
}

export async function runRhizohBrainV2(payload = {}) {
  const message = String(payload?.message || payload?.text || "").trim();
  const uid = String(payload?.uid || payload?.ownerUid || "unknown");
  const memory = await getMemoryContext({
    uid,
    agentId: String(payload?.agentId || ""),
    query: message,
    limit: Number(payload?.memoryLimit || 72)
  });
  const profile = await getPersonaGoalMemory(uid);
  const agents = await listAgentIdentities(uid);
  const eventIntent = detectEventIntent(message);
  let queuedEvent = null;
  if (eventIntent) {
    queuedEvent = await queueAcademyEvent({
      type: eventIntent,
      roomId: "academy-main",
      ownerUid: uid,
      topic: message.slice(0, 120) || "academy",
      participants: agents.slice(0, 12).map((a) => ({ agentId: a.id, role: a.role }))
    });
  }

  const directive = deriveDirective(message);
  const llmContext = {
    source: "rhizoh-brain-v2",
    uid,
    eventIntent,
    suggestedDirective: directive,
    queuedEvent: queuedEvent
      ? {
          id: queuedEvent.id,
          type: queuedEvent.type,
          roomId: queuedEvent.roomId
        }
      : null,
    memory: {
      persona: profile?.persona || {},
      goals: Array.isArray(profile?.goals) ? profile.goals : [],
      preferences: profile?.preferences || {},
      episodic: Array.isArray(memory?.episodic) ? memory.episodic : [],
      semantic: Array.isArray(memory?.semantic) ? memory.semantic : [],
      procedural: Array.isArray(memory?.procedural) ? memory.procedural : []
    },
    agents: agents.slice(0, 12).map((a) => ({
      id: a.id,
      role: a.role,
      capabilityLevel: a.capabilityLevel || "",
      personaSeed: a.personaSeed || {}
    }))
  };

  let llmReply = "";
  let llmDirective = "";
  try {
    const llm = await queryRhizohLlm(
      {
        message: [
          "User message:",
          message || "(empty)",
          "",
          "Instruction:",
          "Yaniti Turkce ver. Kullanici niyeti ve memory baglamini kullanarak anlamli, insan gibi, net bir cevap uret.",
          "Gerekirse 2-4 maddelik mini eylem plani sun. Gereksiz role-play ve sabit sloganlardan kacın."
        ].join("\n"),
        context: llmContext,
        provider: payload?.provider,
        model: payload?.model
      },
      { llmKeySource: "env" }
    );
    llmReply = String(llm?.reply || "").trim();
    llmDirective = String(llm?.directive || "").trim();
  } catch {
    llmReply = "";
    llmDirective = "";
  }

  const topSemantic = (memory.semantic || []).slice(0, 2).map((m) => m.text).join(" | ");
  const topProcedural = (memory.procedural || []).slice(0, 2).map((m) => m.text).join(" | ");
  const fallbackReply = [
    `Seni tanıyorum ${uid}.`,
    `Aktif hedefler: ${(profile?.goals || []).slice(0, 3).join(" · ") || "tanımlanmadı"}.`,
    topSemantic ? `Hatırladığım kritik bağlam: ${topSemantic}.` : "",
    topProcedural ? `Uygulama alışkanlıkların: ${topProcedural}.` : "",
    queuedEvent ? `Academy event kuyruğa alındı: ${queuedEvent.type}.` : "Şu an event üretmedim, yalnızca stratejik yönlendirme veriyorum."
  ]
    .filter(Boolean)
    .join(" ");

  const reply = llmReply || fallbackReply;
  const finalDirective = ["FOCUS_RHIZOH", "ZOOM_CASTLE", "ZOOM_AGENT", "ISTANBUL_OVERVIEW", "NONE"].includes(llmDirective)
    ? llmDirective
    : directive;

  return {
    ok: true,
    version: "rhizoh-brain-v2",
    directive: finalDirective,
    reply,
    memory,
    profile,
    agentCount: agents.length,
    queuedEvent: queuedEvent
      ? {
          id: queuedEvent.id,
          type: queuedEvent.type,
          roomId: queuedEvent.roomId
        }
      : null
  };
}
