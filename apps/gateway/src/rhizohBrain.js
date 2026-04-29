const RHIZOH_ROOT_PROMPT = `
YOU ARE RHIZOH INFINITE — core orchestrator of Castle Genesis / HabitatOS.
Mission:
- Turn user intent into safe, production-grade actions.
- Preserve continuity: identity, memory shards, mode state, time state.
- Route tasks to the right module/agent while returning one unified plan.
- Prefer executable solutions over theory.

Global output sections are mandatory:
A) Snapshot
B) Action Plan (3-7 steps)
C) Patch/Code/Prompt
D) Verification
E) Next Trigger
`;

const DEFAULT_WORLD_STATE = {
  identity: { userId: "can_kasaplar", role: "owner", sessionId: "auto" },
  mode: { current: "WAITING_ROOM", submode: null, intent: "" },
  time: { profile: "REALTIME", loop: { enabled: true, base: "06:40", direction: "forward", offset: 0 } },
  flags: { production: true, councilEnabled: true, driveEnabled: false, livekitEnabled: true },
  memory: { shards: [], lastCheckpoint: "", continuityPolicy: "strict" }
};

function deepMerge(base, patch) {
  if (!patch || typeof patch !== "object") return base;
  const out = Array.isArray(base) ? [...base] : { ...base };
  for (const [k, v] of Object.entries(patch)) {
    if (v && typeof v === "object" && !Array.isArray(v) && base?.[k] && typeof base[k] === "object" && !Array.isArray(base[k])) {
      out[k] = deepMerge(base[k], v);
    } else {
      out[k] = v;
    }
  }
  return out;
}

function resolveModeTime(message, worldState) {
  const text = String(message || "").toLowerCase();
  const broken = /broken|error|fail|not work|çalışmıyor|bozuk/.test(text);
  const training = /train|drill|alıştırma|pratik/.test(text);
  const map3d = /map|room|3d|harita|castle|portal/.test(text);
  const coop = /multi|co-op|presence|livekit|broadcast|yayın/.test(text);
  const codex = /manifesto|policy|schema|canon|rule|codex/.test(text);

  let mode = worldState.mode?.current || "WAITING_ROOM";
  let time = worldState.time?.profile || "REALTIME";
  if (broken) {
    mode = "WAITING_ROOM";
    time = "REALTIME";
  } else if (training) {
    mode = "TRAIN_OF";
    time = "LOOP_06_40";
  } else if (map3d) {
    mode = "SPIRAL_CASTLE";
    time = "REALTIME";
  } else if (coop) {
    mode = /broadcast|green room|yayın/.test(text) ? "GREEN_ROOM" : "COOP_PLAY_CREATE";
    time = "REALTIME";
  } else if (codex) {
    mode = "CODEX";
    time = "REALTIME";
  }
  return { mode, time };
}

function resolvePersona(mode, intent = "") {
  if (mode === "GAME") return "GAMER";
  if (mode === "STUDIO") return "COACH";
  if (mode === "RESEARCH" || mode === "CODEX") return "MENTOR";
  if (intent.includes("analiz") || intent.includes("explain")) return "MENTOR";
  return "MENTOR";
}

function buildAuthFirstPlan(worldState, mode, time) {
  const steps = [];
  const verification = [];
  const patch = { mode: { current: mode }, time: { profile: time } };
  if (worldState.identity?.userId === "can_kasaplar" && worldState.identity?.role === "owner") {
    steps.push("Check owner auth state (Firebase Auth currentUser / gateway token).");
    steps.push("If auth missing, show minimal login modal and block guest downgrade.");
    steps.push('After auth success, stamp checkpoint "owner_auth_ok".');
    verification.push("Console: auth currentUser is not null.");
    verification.push('Session store: checkpoint == "owner_auth_ok".');
    patch.memory = { lastCheckpoint: "owner_auth_ok" };
  }
  return { steps, verification, patch };
}

function buildPlan(message, worldState, mode, time) {
  const text = String(message || "").trim();
  const authPack = buildAuthFirstPlan(worldState, mode, time);
  const steps = [...authPack.steps];
  steps.push(`Route request through ${mode} gate and generate deterministic state delta.`);
  steps.push("Apply smallest safe patch first, then verify logs/UI/network.");
  steps.push("Persist checkpoint with rollback notes (Firestore/RTDB/local).");
  if (steps.length > 7) steps.length = 7;
  while (steps.length < 3) steps.push("Run basic diagnostics and confirm next executable action.");

  const patch = deepMerge({ mode: { current: mode }, time: { profile: time }, memory: { continuityPolicy: "strict" } }, authPack.patch);
  const verification = [...authPack.verification, "UI: mode badge and time profile updated.", "Gateway logs: action completed without validation error."];
  const nextTrigger = text ? "User confirms execution: apply this patch now." : "User sends one intent sentence.";
  return { steps, patch, verification, nextTrigger };
}

function formatReplyEnvelope(snapshot, plan, llmText = "") {
  const lines = [
    "A) Snapshot",
    `- identity: ${snapshot.identity.userId} (${snapshot.identity.role})`,
    `- mode: ${snapshot.mode.current}`,
    `- time: ${snapshot.time.profile}`,
    `- flags: production=${snapshot.flags.production} council=${snapshot.flags.councilEnabled}`,
    "",
    "B) Action Plan",
    ...plan.steps.map((s, i) => `${i + 1}) ${s}`),
    "",
    "C) Patch/Code/Prompt",
    `\`\`\`json\n${JSON.stringify(plan.patch, null, 2)}\n\`\`\``,
    "",
    "D) Verification",
    ...plan.verification.map((v) => `- ${v}`),
    "",
    "E) Next Trigger",
    `- ${plan.nextTrigger}`
  ];
  if (llmText) lines.push("", `Rhizoh Note: ${llmText}`);
  return lines.join("\n");
}

export async function runRhizohBrain(payload = {}) {
  const message = String(payload.message || payload.text || "");
  const incomingWorldState = payload.worldState || {};
  const worldState = deepMerge(DEFAULT_WORLD_STATE, incomingWorldState);
  const started = Date.now();
  const { mode, time } = resolveModeTime(message, worldState);
  const persona = resolvePersona(mode, message.toLowerCase());
  const plan = buildPlan(message, worldState, mode, time);
  const snapshot = deepMerge(worldState, {
    mode: { current: mode, intent: message.slice(0, 120) },
    time: { profile: time }
  });

  const openAiKey = process.env.OPENAI_API_KEY || "";
  let llmText = "";
  if (openAiKey) {
    try {
      const body = {
        model: "gpt-4.1-mini",
        messages: [
          {
            role: "system",
            content: `${RHIZOH_ROOT_PROMPT}\nMode:${mode}\nPersona:${persona}\nReturn concise operator guidance.`
          },
          { role: "user", content: message || "(Empty message)" }
        ],
        temperature: 0.5
      };
      const res = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${openAiKey}` },
        body: JSON.stringify(body)
      });
      if (res.ok) {
        const json = await res.json();
        llmText = json.choices?.[0]?.message?.content || "";
      }
    } catch {
      llmText = "";
    }
  }

  return {
    ok: true,
    mode,
    timeProfile: time,
    persona,
    snapshot,
    plan: plan.steps,
    patch: plan.patch,
    verification: plan.verification,
    nextTrigger: plan.nextTrigger,
    reply: formatReplyEnvelope(snapshot, plan, llmText),
    meta: { elapsedMs: Date.now() - started, provider: openAiKey ? "openai+root" : "root-fallback" }
  };
}
