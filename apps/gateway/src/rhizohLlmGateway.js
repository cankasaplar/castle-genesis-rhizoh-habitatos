const PROVIDER_DEFAULT_MODEL = {
  openai: "gpt-4o-mini",
  anthropic: "claude-3-5-sonnet-latest",
  gemini: "gemini-2.0-flash",
  xai: "grok-2-1212",
  deepseek: "deepseek-chat",
  mistral: "mistral-small-latest",
  openrouter: "openai/gpt-4o-mini"
};

function getProviderConfig(overrideProvider = "", overrideModel = "") {
  const provider = String(overrideProvider || process.env.CASTLE_LLM_PROVIDER || "openai").toLowerCase();
  const model = String(overrideModel || process.env.CASTLE_LLM_MODEL || PROVIDER_DEFAULT_MODEL[provider] || PROVIDER_DEFAULT_MODEL.openai);
  return { provider, model };
}

function getProviderKey(provider) {
  if (provider === "openai") return process.env.OPENAI_API_KEY || "";
  if (provider === "anthropic") return process.env.ANTHROPIC_API_KEY || "";
  if (provider === "gemini") return process.env.GOOGLE_API_KEY || process.env.GEMINI_API_KEY || "";
  if (provider === "xai") return process.env.XAI_API_KEY || "";
  if (provider === "deepseek") return process.env.DEEPSEEK_API_KEY || "";
  if (provider === "mistral") return process.env.MISTRAL_API_KEY || "";
  if (provider === "openrouter") return process.env.OPENROUTER_API_KEY || "";
  return "";
}

function buildSystemPrompt(layerContext) {
  const persona = layerContext?.memory?.persona || {};
  const goals = Array.isArray(layerContext?.memory?.goals) ? layerContext.memory.goals : [];
  const preferences = layerContext?.memory?.preferences || {};
  const episodic = Array.isArray(layerContext?.memory?.episodic) ? layerContext.memory.episodic : [];
  const semantic = Array.isArray(layerContext?.memory?.semantic) ? layerContext.memory.semantic : [];
  const procedural = Array.isArray(layerContext?.memory?.procedural) ? layerContext.memory.procedural : [];
  return [
    "You are Rhizoh, command intelligence for Castle Genesis.",
    "Keep answers concise, actionable, and cinematic. Maintain continuity with the user.",
    "Return strict JSON with keys: reply, directive.",
    "directive must be one of: FOCUS_RHIZOH, ZOOM_CASTLE, ZOOM_AGENT, ISTANBUL_OVERVIEW, NONE.",
    `Persona memory: ${JSON.stringify(persona)}`,
    `Goal memory: ${JSON.stringify(goals)}`,
    `User preferences: ${JSON.stringify(preferences)}`,
    `Episodic memory: ${JSON.stringify(episodic)}`,
    `Semantic memory: ${JSON.stringify(semantic)}`,
    `Procedural memory: ${JSON.stringify(procedural)}`,
    `Layer context: ${JSON.stringify({ ...layerContext, memory: undefined } || {})}`
  ].join("\n");
}

function safeParseJsonObject(text) {
  if (!text || typeof text !== "string") return null;
  const trimmed = text.trim();
  try {
    return JSON.parse(trimmed);
  } catch {
    const first = trimmed.indexOf("{");
    const last = trimmed.lastIndexOf("}");
    if (first >= 0 && last > first) {
      const candidate = trimmed.slice(first, last + 1);
      try {
        return JSON.parse(candidate);
      } catch {
        return null;
      }
    }
    return null;
  }
}

async function callOpenAiLike(endpoint, key, model, systemPrompt, userMessage, extraHeaders = {}) {
  const res = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${key}`,
      ...extraHeaders
    },
    body: JSON.stringify({
      model,
      temperature: 0.35,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userMessage }
      ]
    })
  });
  if (!res.ok) throw new Error(`provider_http_${res.status}`);
  const json = await res.json();
  const content = json?.choices?.[0]?.message?.content || "";
  return String(content);
}

async function callAnthropic(key, model, systemPrompt, userMessage) {
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": key,
      "anthropic-version": "2023-06-01"
    },
    body: JSON.stringify({
      model,
      max_tokens: 420,
      system: systemPrompt,
      messages: [{ role: "user", content: userMessage }]
    })
  });
  if (!res.ok) throw new Error(`provider_http_${res.status}`);
  const json = await res.json();
  const content = json?.content?.[0]?.text || "";
  return String(content);
}

async function callGemini(key, model, systemPrompt, userMessage) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(key)}`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      generationConfig: { temperature: 0.35, responseMimeType: "application/json" },
      contents: [{ role: "user", parts: [{ text: `${systemPrompt}\n\nUser: ${userMessage}` }] }]
    })
  });
  if (!res.ok) throw new Error(`provider_http_${res.status}`);
  const json = await res.json();
  const content = json?.candidates?.[0]?.content?.parts?.[0]?.text || "";
  return String(content);
}

export async function queryRhizohLlm(input) {
  const payload = input || {};
  const message = String(payload?.message || "").slice(0, 1600);
  if (!message) throw new Error("message_required");
  const context = payload?.context || {};
  const { provider, model } = getProviderConfig(payload?.provider, payload?.model);
  const key = String(payload?.apiKey || getProviderKey(provider));
  if (!key) throw new Error(`missing_api_key_for_${provider}`);

  const systemPrompt = buildSystemPrompt(context);
  let rawText = "";

  if (provider === "anthropic") {
    rawText = await callAnthropic(key, model, systemPrompt, message);
  } else if (provider === "gemini") {
    rawText = await callGemini(key, model, systemPrompt, message);
  } else if (provider === "xai") {
    rawText = await callOpenAiLike("https://api.x.ai/v1/chat/completions", key, model, systemPrompt, message);
  } else if (provider === "deepseek") {
    rawText = await callOpenAiLike("https://api.deepseek.com/chat/completions", key, model, systemPrompt, message);
  } else if (provider === "mistral") {
    rawText = await callOpenAiLike("https://api.mistral.ai/v1/chat/completions", key, model, systemPrompt, message);
  } else if (provider === "openrouter") {
    rawText = await callOpenAiLike(
      "https://openrouter.ai/api/v1/chat/completions",
      key,
      model,
      systemPrompt,
      message,
      { "HTTP-Referer": "https://castle.local", "X-Title": "Castle Rhizoh Gateway" }
    );
  } else {
    rawText = await callOpenAiLike("https://api.openai.com/v1/chat/completions", key, model, systemPrompt, message);
  }

  const parsed = safeParseJsonObject(rawText) || {};
  const reply = String(parsed.reply || "").trim() || "Rhizoh yanıt üretti fakat içerik boş döndü.";
  const directiveRaw = String(parsed.directive || "NONE").toUpperCase();
  const directive = ["FOCUS_RHIZOH", "ZOOM_CASTLE", "ZOOM_AGENT", "ISTANBUL_OVERVIEW", "NONE"].includes(directiveRaw)
    ? directiveRaw
    : "NONE";

  return {
    ok: true,
    provider,
    model,
    reply,
    directive
  };
}
