const PROVIDER_DEFAULT_MODEL = {
  openai: "gpt-4o-mini",
  anthropic: "claude-3-5-sonnet-latest",
  gemini: "gemini-2.0-flash",
  xai: "grok-2-1212",
  deepseek: "deepseek-chat",
  mistral: "mistral-small-latest",
  openrouter: "openai/gpt-4o-mini"
};

/** İstemci `options.maxTokens` yoksa OpenAI-uyumlu uçlar için kullanılan varsayılan tamamlama üst sınırı. */
const DEFAULT_MAX_COMPLETION_TOKENS = 400;

/**
 * Açık üretim rejimleri: `options.generationMode` ile seçilir; `options.maxTokens` varsa tavan olarak önceliklidir.
 * @type {Record<string, { maxTokens: number, directive: string }>}
 */
export const RHIZOH_GENERATION_MODES = {
  FAST_DIALOGUE: {
    maxTokens: 120,
    directive:
      "Mode FAST_DIALOGUE: concise=true. Kısa tur; gereksiz derinleşme yok; kullanıcı açıkça istemedikçe uzatma."
  },
  STANDARD: {
    maxTokens: 320,
    directive: "Mode STANDARD: dengeli derinlik. Net cevap; gereksiz uzunluktan kaçın."
  },
  REFLECTIVE: {
    maxTokens: 900,
    directive:
      "Mode REFLECTIVE: introspective=true. Sonuçlar, duygusal çerçeve ve ödünleşimleri düşün; yansıtıcı ton."
  },
  NARRATIVE: {
    maxTokens: 1600,
    directive:
      "Mode NARRATIVE: cinematic=true, elaboration=true. Süreklilik uygunsa sahne ve anlatım zenginleştir; bellekteki olgulara sadık kal."
  },
  DEEP_REASONING: {
    maxTokens: 2600,
    directive:
      "Mode DEEP_REASONING: layered reasoning=true, uncertainty disclosure=true. Adımları ve alternatifleri göster; belirsizlikleri açıkça işaretle."
  }
};

/**
 * İstemci `options` → provider parametreleri + sistem prompt eki (rejim direktifi).
 * @param {Record<string, unknown>} payload
 * @returns {{ maxTokens: number, temperature: number, modeDirective: string, generationModeLabel: string | null }}
 */
function resolveRhizohGenerationOptions(payload) {
  const opts = payload?.options && typeof payload.options === "object" ? payload.options : {};
  const capEnv = Number(process.env.CASTLE_LLM_MAX_TOKENS_CAP);
  const hardCap = Number.isFinite(capEnv) && capEnv > 0 ? Math.min(Math.floor(capEnv), 32768) : 8192;
  const floor = 32;

  const modeKeyRaw = String(opts.generationMode || opts.generation_mode || "")
    .trim()
    .toUpperCase()
    .replace(/-/g, "_");
  const modeDef =
    modeKeyRaw && Object.prototype.hasOwnProperty.call(RHIZOH_GENERATION_MODES, modeKeyRaw)
      ? RHIZOH_GENERATION_MODES[modeKeyRaw]
      : null;

  const maxRaw = opts.maxTokens != null ? Number(opts.maxTokens) : NaN;
  let maxTokens;
  if (Number.isFinite(maxRaw) && maxRaw > 0) {
    maxTokens = Math.floor(maxRaw);
  } else if (modeDef) {
    maxTokens = modeDef.maxTokens;
  } else {
    maxTokens = DEFAULT_MAX_COMPLETION_TOKENS;
  }
  maxTokens = Math.max(floor, Math.min(maxTokens, hardCap));

  const tempRaw = opts.temperature != null ? Number(opts.temperature) : NaN;
  const temperature = Number.isFinite(tempRaw) ? Math.max(0, Math.min(2, tempRaw)) : 0.35;

  const modeDirective = modeDef ? modeDef.directive : "";
  const generationModeLabel = modeDef ? modeKeyRaw : null;

  return { maxTokens, temperature, modeDirective, generationModeLabel };
}

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

const DEFAULT_MEMORY_CONTRACT =
  "continuity.* is authoritative session memory (identity, castleState, ghostPet, recentReality, codex, relationship). Do not invent facts beyond it; answer in the user's language.";

/**
 * @param {Record<string, unknown> | null | undefined} policy
 */
/**
 * @param {Record<string, unknown> | null | undefined} sf
 */
function buildSocialCognitionMemoryLines(sf) {
  if (!sf || typeof sf !== "object") return "";
  const rs = sf.roomState && typeof sf.roomState === "object" ? sf.roomState : {};
  const att = sf.attention && typeof sf.attention === "object" ? sf.attention : {};
  const vh = sf.voiceHint && typeof sf.voiceHint === "object" ? sf.voiceHint : {};
  const energy = Number(rs.energy) > 0.66 ? "high" : Number(rs.energy) < 0.4 ? "low" : "medium";
  const cohesion = Number(rs.cohesion) > 0.75 ? "high" : Number(rs.cohesion) < 0.45 ? "low" : "medium";
  const topic = String(rs.focusTopic || "").slice(0, 64);
  const listeners = Array.isArray(att.listeners) ? att.listeners.join(", ") : "";
  return [
    "Social cognition (sovereign companion — not a generic moderator):",
    `- Room: energy=${energy} tension=${(Number(rs.tension) || 0).toFixed(2)} cohesion=${cohesion} noise=${(Number(rs.noise) || 0).toFixed(2)} topic=${topic || "n/a"}`,
    `- Primary speaker: ${att.primarySpeaker ?? "n/a"} (mode=${att.mode ?? ""})`,
    listeners ? `- Other voices in play: ${listeners}` : "- Other voices: none detected",
    `- Voice route hint: ${vh.type ?? ""} (${vh.rationale ?? ""})${vh.addressee ? ` → @${vh.addressee}` : ""}`,
    "Respond socially: prefer the hinted route; use room-wide language only when route is room_reply; vary tone per participant when bonds differ."
  ].join("\n");
}

/**
 * @param {Record<string, unknown> | null | undefined} reg
 */
function buildCastleSocialIdentityMemoryLines(reg) {
  if (!reg || typeof reg !== "object") return "";
  const entities = reg.entities && typeof reg.entities === "object" ? reg.entities : {};
  const ids = Object.keys(entities).slice(0, 8);
  if (!ids.length) {
    return "Castle Social Identity (CSIL): no resolved entities yet — the room may be occupied; do not assume names or private context.";
  }
  const lines = [
    "Castle Social Identity (CSIL) — registry:",
    "Unknown/guest: no «Merhaba X» until introduction protocol allows; respect permissions.",
    "Tone by class: human_user=personal; human_guest=polite/explanatory; ai_agent=protocol; ghost_pet=playful; ambient=no reply; unknown=cautious."
  ];
  for (const id of ids) {
    const e = entities[id];
    const rel = reg.relationships && typeof reg.relationships === "object" ? reg.relationships[id] : {};
    const intro = reg.introductions && typeof reg.introductions === "object" ? reg.introductions[id] : {};
    const perm = reg.permissions && typeof reg.permissions === "object" ? reg.permissions[id] : {};
    if (!e || typeof e !== "object") continue;
    lines.push(
      `- ${id}: class=${e.class} stage=${rel.stage ?? "?"} intro=${intro.phase ?? "?"} name=${e.displayName || "—"} mem=${perm.accessMemory} priv=${perm.hearPrivateContext} cmd=${perm.issueCommands}`
    );
  }
  const tel = reg.presenceTelemetry && typeof reg.presenceTelemetry === "object" ? reg.presenceTelemetry : null;
  if (tel?.qppLabel) lines.push(`CSIL presence / QPP: ${tel.qppLabel} (${tel.qppMode || "idle"})`);
  return lines.join("\n");
}

/**
 * @param {Record<string, unknown> | null | undefined} sp
 */
function buildSocialPhysicsMemoryLines(sp) {
  if (!sp || typeof sp !== "object") return "";
  const qBias =
    sp.quietStateProbability != null || sp.observationMode != null
      ? ` quietP=${sp.quietStateProbability ?? "n/a"} interactionE=${sp.interactionEnergy ?? "n/a"} observe=${sp.observationMode ?? "n/a"} reconcileMs=${sp.reconcileDurationMs ?? 0}`
      : "";
  return [
    "Social physics (temporal cognition engine):",
    `- Phase=${sp.phase ?? "stable"} trustRegime=${sp.trustRegime ?? "observe-only"} attention=${sp.attentionDirection ?? "self_anchor"}`,
    `- Stability=${sp.stabilityScore ?? 0} drift=${sp.driftScore ?? 0} reconcileNeed=${sp.reconciliationNeed ?? 0}`,
    `- InteractionMomentum=${sp.interactionMomentum ?? 0} coPresenceMomentum=${sp.coPresenceMomentum ?? 0} trustFlux=${sp.trustFlux ?? 0}${qBias}`
  ].join("\n");
}

/**
 * @param {Record<string, unknown> | null | undefined} ft
 */
function buildSocialFieldTheoryMemoryLines(ft) {
  if (!ft || typeof ft !== "object") return "";
  const af = ft.attentionField && typeof ft.attentionField === "object" ? ft.attentionField : {};
  const td = ft.trustDensity && typeof ft.trustDensity === "object" ? ft.trustDensity : {};
  const inf = ft.interference && typeof ft.interference === "object" ? ft.interference : {};
  const waves = Array.isArray(ft.presenceWaves) ? ft.presenceWaves : [];
  return [
    "Social field theory (simulated social continuum — use as metaphor for stance, not literal physics):",
    `- Attention field: vector=(${af.vx ?? 0}, ${af.vy ?? 0}) magnitude=${af.magnitude ?? 0} (${af.directionLabel ?? ""})`,
    `- Trust scalar density: meanρ=${td.meanRho ?? 0} totalMass=${td.totalMass ?? 0}`,
    `- Presence waves: n=${waves.length} interference=${inf.pattern ?? "flat"} contrast=${inf.contrast ?? 0} |Σψ|²/Σ|ψ|²=${inf.rawRatio ?? 0}`
  ].join("\n");
}

function buildRhizohPolicyMemoryLines(policy) {
  if (!policy || typeof policy !== "object") return "";
  const tool = policy.toolMode === "local_only" ? "local_only" : "full_remote_ok";
  const mem = policy.memoryMode === "deferred_commit" ? "deferred_commit" : "normal";
  const ent = policy.initiativeEntropy || "medium";
  const verb = policy.verbosityStyle || "moderate";
  const speech = policy.speechMode === "slow_and_direct" ? "slow_and_direct" : "normal";
  const sil = policy.silenceCapable === false ? "false" : "true";
  return [
    "Current policy (obey — shapes tools, memory claims, and reply shape):",
    `- tool mode: ${tool}`,
    `- memory mode: ${mem}`,
    `- initiative / entropy: ${ent}`,
    `- verbosity: ${verb}`,
    `- speech pacing: ${speech}`,
    `- silence capable: ${sil}`
  ].join("\n");
}

/**
 * Human-readable Castle continuity for system prompt (matches client buildContinuityPayload).
 * @param {Record<string, unknown>} continuity
 */
function buildContinuityMemoryBlock(continuity) {
  const c = continuity && typeof continuity === "object" ? continuity : {};
  const lines = [];

  const realm = (c.castleState && typeof c.castleState === "object" && c.castleState.realm) || c.runtime?.realityMode || "";
  if (realm) lines.push(`Castle realm: ${realm}`);

  const gp = c.ghostPet && typeof c.ghostPet === "object" ? c.ghostPet : null;
  if (gp && (gp.mood != null || gp.curiosity != null || gp.confused != null)) {
    lines.push(
      `Ghost pet: mood=${gp.mood ?? "unknown"} curiosity=${gp.curiosity ?? 0} confused=${gp.confused ?? 0} lastRealMapAt=${gp.lastRealMapAt ?? "n/a"}`
    );
  }

  const rr = Array.isArray(c.recentReality) ? c.recentReality : [];
  if (rr.length) {
    lines.push("Recent reality transitions:");
    rr.slice(-8).forEach((line) => lines.push(`- ${line}`));
  }

  const discoveries = c.codex && typeof c.codex === "object" && Array.isArray(c.codex.discoveries) ? c.codex.discoveries : [];
  if (discoveries.length) {
    lines.push("Codex (recent discovery nodes):");
    discoveries.slice(-6).forEach((d) => {
      const kind = d?.kind ?? "node";
      lines.push(`- ${kind} ${d?.from}→${d?.to} source=${d?.source}${d?.success === false ? " (failed)" : ""}`);
    });
  }

  const rel = c.relationship && typeof c.relationship === "object" ? c.relationship : null;
  if (rel && (rel.bondScore != null || rel.trust != null)) {
    lines.push(
      `Relationship: bondScore=${rel.bondScore ?? "n/a"} trust=${rel.trust ?? "n/a"} familiarity=${rel.familiarity ?? "n/a"}`
    );
  }
  if (rel?.emotions && typeof rel.emotions === "object") {
    lines.push(`Rhizoh session emotions: ${JSON.stringify(rel.emotions)}`);
  }
  if (rel?.relationalTone && typeof rel.relationalTone === "object") {
    lines.push(`Relational tone (warmth/directness/patience/depth): ${JSON.stringify(rel.relationalTone)}`);
  }

  const rif = c.rhizohRecallIdentityFeedback && typeof c.rhizohRecallIdentityFeedback === "object" ? c.rhizohRecallIdentityFeedback : null;
  if (rif && (rif.trustDelta != null || rif.familiarityDelta != null)) {
    lines.push(
      `Recall→identity field feedback (bounded, diversity-damped): Δtrust=${rif.trustDelta} Δfamiliarity=${rif.familiarityDelta} diversityPenalty=${rif.diversityPenalty} anchorSkew=${rif.anchorSkew}`
    );
  }

  const recall = Array.isArray(c.rhizohWeightedRecollection) ? c.rhizohWeightedRecollection : [];
  if (recall.length) {
    lines.push(
      "Weighted memory recollection (semantic × physics collapse — field-aligned ranking, not pre-filtered search):"
    );
    recall.slice(0, 16).forEach((row) => {
      const w = row?.retrievalWeight != null ? Number(row.retrievalWeight).toFixed(4) : "?";
      const mf = row?.memoryFieldScores && typeof row.memoryFieldScores === "object" ? row.memoryFieldScores : null;
      const mfStr =
        mf && mf.semantic != null && mf.physicsCollapse != null
          ? ` sem=${Number(mf.semantic).toFixed(3)} phys=${Number(mf.physicsCollapse).toFixed(3)}`
          : "";
      const ph =
        row?.physicsImprint && typeof row.physicsImprint === "object"
          ? ` imprint=${String(row.physicsImprint.phase || "").slice(0, 12)}`
          : "";
      const int = row?.intent ?? "";
      const u = String(row?.user || row?.text || "").slice(0, 120);
      const a = String(row?.assistant || "").slice(0, 160);
      lines.push(
        `- [W=${w}${mfStr}${ph} intent=${int}] user: ${u}${u.length >= 120 ? "…" : ""} | assistant: ${a}${a.length >= 160 ? "…" : ""}`
      );
    });
  }

  const anchor = c.rhizohStabilityAnchor && typeof c.rhizohStabilityAnchor === "object" ? c.rhizohStabilityAnchor : null;
  const constraints = anchor && Array.isArray(anchor.philosophyConstraints) ? anchor.philosophyConstraints : [];
  if (constraints.length) {
    lines.push("Rhizoh identity anchor (stable — stay consistent):");
    constraints.forEach((line) => lines.push(`- ${String(line)}`));
  }

  const nar = c.rhizohNarrativeThread && typeof c.rhizohNarrativeThread === "object" ? c.rhizohNarrativeThread : null;
  if (nar && (nar.arcSummary || (Array.isArray(nar.intentChain) && nar.intentChain.length))) {
    const chain = Array.isArray(nar.intentChain) ? nar.intentChain.slice(-6) : [];
    lines.push(
      `Narrative thread: focus=${nar.focusIntent ?? ""} recentIntents=${JSON.stringify(chain)} arc=${String(nar.arcSummary || "").slice(0, 280)}`
    );
  }

  const arcLong = c.rhizohNarrativeArc && typeof c.rhizohNarrativeArc === "object" ? c.rhizohNarrativeArc : null;
  if (arcLong && (arcLong.phase || arcLong.trajectory || arcLong.direction)) {
    lines.push(
      `Narrative arc (long horizon): phase=${arcLong.phase ?? ""} trajectory=${arcLong.trajectory ?? ""} bondTrend=${arcLong.bondTrend ?? ""} headline=${String(arcLong.arcHeadline || "").slice(0, 200)} direction=${String(arcLong.direction || "").slice(0, 320)}`
    );
  }

  const gcal = c.rhizohGovernorCalibration && typeof c.rhizohGovernorCalibration === "object" ? c.rhizohGovernorCalibration : null;
  if (gcal && (gcal.pullScalePre != null || gcal.memoryMaxTopShare != null)) {
    lines.push(
      `Governor calibration (adaptive): pullPre=${gcal.pullScalePre} pullPost=${gcal.pullScalePost} driftBand=${gcal.driftBandScale} memTopShare=${gcal.memoryMaxTopShare}`
    );
  }

  const eps = Array.isArray(c.rhizohMemoryEpisodes) ? c.rhizohMemoryEpisodes : [];
  if (eps.length) {
    lines.push("Compressed memory episodes (clustered turns):");
    eps.slice(-10).forEach((ep) => {
      const n = ep?.spanCount ?? "?";
      const int = ep?.intent ?? "";
      const u = String(ep?.user || "").slice(0, 100);
      const a = String(ep?.assistant || "").slice(0, 140);
      lines.push(`- [${n} turns · ${int}] ${u}${u.length >= 100 ? "…" : ""} || ${a}${a.length >= 140 ? "…" : ""}`);
    });
  }

  const runt = c.runtime && typeof c.runtime === "object" ? c.runtime : null;
  const tb = runt?.tceeBoot;
  if (tb && typeof tb === "object" && tb.phase) {
    lines.push(
      `TCEE boot (Dual-Phase): phase=${tb.phase} idlePulses=${tb.idlePulseCount ?? 0} wakeSealedAt=${tb.wakeSealedAt ?? "n/a"} memoryClockEpoch=${tb.memoryClockEpoch ?? "n/a"}`
    );
  }
  const ks = runt?.kernelSeal && typeof runt.kernelSeal === "object" ? runt.kernelSeal : null;
  if (ks && ks.version) {
    const locked = Array.isArray(ks.lockedZones) ? ks.lockedZones.join(",") : "";
    lines.push(`Kernel Seal v${ks.version} (${ks.sealedAt || "n/a"}): backbone zones locked [${locked}] — mutable spawn/agents/ui/world per contract.`);
  }
  const cm = runt?.capabilityManifest && typeof runt.capabilityManifest === "object" ? runt.capabilityManifest : null;
  if (cm && cm.era) {
    const sp = cm.zones?.spawn && typeof cm.zones.spawn === "object" ? cm.zones.spawn : null;
    const spCap = sp && Array.isArray(sp.capabilities) ? sp.capabilities.length : 0;
    lines.push(
      `Capability manifest (${cm.manifestVersion || "?"} · ${cm.era}): spawn v${sp?.version ?? "?"} has ${spCap} declared capabilities — expansion surfaces versioned to reduce drift.`
    );
  }
  const hs = runt?.healthState;
  if (hs && typeof hs === "object" && hs.connectivity) {
    lines.push(
      `Cognitive reliability: connectivity=${hs.connectivity} confidence=${hs.confidence ?? ""} recommendedTone=${hs.recommendedTone ?? ""} latencyMs=${hs.latencyMs ?? "n/a"} capabilities=${JSON.stringify(hs.capabilities || {})} symptoms=${JSON.stringify(hs.symptoms || [])}`
    );
  }
  const relSum = String(c.rhizohReliabilitySummary || c.recentReliabilitySummary || "").trim();
  if (relSum) {
    lines.push(`Reliability memory (session): ${relSum.slice(0, 420)}`);
  }

  const pol = runt?.rhizohPolicy;
  const policyBlock = buildRhizohPolicyMemoryLines(pol);
  if (policyBlock) {
    lines.push(policyBlock);
  }

  const soc = runt?.socialField;
  const socialBlock = buildSocialCognitionMemoryLines(soc);
  if (socialBlock) {
    lines.push(socialBlock);
  }

  const csilReg = runt?.socialRegistry;
  const csilBlock = buildCastleSocialIdentityMemoryLines(csilReg);
  if (csilBlock) {
    lines.push(csilBlock);
  }
  const socialPhysics = runt?.socialPhysics;
  const physicsBlock = buildSocialPhysicsMemoryLines(socialPhysics);
  if (physicsBlock) {
    lines.push(physicsBlock);
  }
  const fieldTheory = runt?.socialFieldTheory || csilReg?.socialFieldTheory;
  const fieldBlock = buildSocialFieldTheoryMemoryLines(fieldTheory);
  if (fieldBlock) {
    lines.push(fieldBlock);
  }
  const csilIntro = runt?.csilIntroductionGuidance;
  if (csilIntro && String(csilIntro).trim()) {
    lines.push(String(csilIntro).trim().slice(0, 1200));
  }

  const arb = c.rhizohPerceptionArbitrationV1 && typeof c.rhizohPerceptionArbitrationV1 === "object" ? c.rhizohPerceptionArbitrationV1 : null;
  const arbBlock = arb && String(arb.orderedPromptBlock || "").trim();

  const cogPrompt = String(c.cognitiveSubThreadsPrompt || runt?.cognitiveSubThreadsPrompt || "").trim();
  const ghostPerc = c.rhizohGhostPerceptionV1 && typeof c.rhizohGhostPerceptionV1 === "object" ? c.rhizohGhostPerceptionV1 : null;
  const ghostPb = ghostPerc && String(ghostPerc.promptBlock || "").trim();

  if (arbBlock) {
    lines.push(arbBlock.slice(0, 4800));
  } else {
    if (cogPrompt) {
      lines.push(cogPrompt.slice(0, 1600));
    }
    if (ghostPb) {
      lines.push(ghostPb.slice(0, 3400));
    }
  }

  const ifc = c.rhizohIntentFeedbackClosureV1 && typeof c.rhizohIntentFeedbackClosureV1 === "object" ? c.rhizohIntentFeedbackClosureV1 : null;
  const ifcBlock = ifc && String(ifc.selfAwarenessPromptBlock || "").trim();
  if (ifcBlock) {
    lines.push(ifcBlock.slice(0, 1400));
  }

  const tid = c.rhizohTemporalIntentDriftMemoryV1 && typeof c.rhizohTemporalIntentDriftMemoryV1 === "object" ? c.rhizohTemporalIntentDriftMemoryV1 : null;
  const tidBlock = tid && String(tid.driftSummaryPrompt || "").trim();
  if (tidBlock) {
    lines.push(tidBlock.slice(0, 1600));
  }

  const idNarr = (c.identity && typeof c.identity === "object" && c.identity.narrative) || c.identityNarrative;
  if (idNarr && String(idNarr).trim()) {
    lines.push("Identity narrative (authoritative):");
    lines.push(String(idNarr).trim().slice(0, 2200));
  }

  return lines.length ? ["--- Continuity memory (client) ---", ...lines].join("\n") : "";
}

function buildSystemPrompt(layerContext) {
  const cognitiveInvoke = Boolean(layerContext?.cognitiveInvoke);
  const persona = layerContext?.memory?.persona || {};
  const goals = Array.isArray(layerContext?.memory?.goals) ? layerContext.memory.goals : [];
  const preferences = layerContext?.memory?.preferences || {};
  const episodic = Array.isArray(layerContext?.memory?.episodic) ? layerContext.memory.episodic : [];
  const semantic = Array.isArray(layerContext?.memory?.semantic) ? layerContext.memory.semantic : [];
  const procedural = Array.isArray(layerContext?.memory?.procedural) ? layerContext.memory.procedural : [];
  const continuity = layerContext?.continuity && typeof layerContext.continuity === "object" ? layerContext.continuity : {};
  const identityNarrative = String(continuity.identityNarrative || "").trim();
  const nestedNarrative =
    continuity.identity && typeof continuity.identity === "object" && continuity.identity.narrative
      ? String(continuity.identity.narrative || "").trim()
      : "";
  const memoryContract = String(layerContext?.rhizohMemoryContract || "").trim() || DEFAULT_MEMORY_CONTRACT;
  const rhizohRouter =
    layerContext?.rhizohRouter && typeof layerContext.rhizohRouter === "object" ? layerContext.rhizohRouter : null;

  const layerForPrompt = { ...layerContext, memory: undefined, rhizohRouter: undefined };
  if (layerForPrompt.continuity && typeof layerForPrompt.continuity === "object") {
    const slimIdentity =
      layerForPrompt.continuity.identity && typeof layerForPrompt.continuity.identity === "object"
        ? { ...layerForPrompt.continuity.identity, narrative: nestedNarrative || identityNarrative ? "[see Continuity memory section]" : "" }
        : layerForPrompt.continuity.identity;
    const recallN = Array.isArray(layerForPrompt.continuity.rhizohWeightedRecollection)
      ? layerForPrompt.continuity.rhizohWeightedRecollection.length
      : 0;
    const rtCont = layerForPrompt.continuity.runtime;
    const slimRuntime =
      rtCont && typeof rtCont === "object"
        ? {
            ...rtCont,
            ...(rtCont.healthState
              ? { healthState: "[see Cognitive reliability above]" }
              : {}),
            ...(rtCont.rhizohPolicy ? { rhizohPolicy: "[see Current policy above]" } : {}),
            ...(rtCont.socialField ? { socialField: "[see Social cognition above]" } : {}),
            ...(rtCont.socialRegistry ? { socialRegistry: "[see Castle Social Identity above]" } : {}),
            ...(rtCont.socialPhysics ? { socialPhysics: "[see Social physics above]" } : {}),
            ...(rtCont.socialFieldTheory ? { socialFieldTheory: "[see Social field theory above]" } : {}),
            ...(rtCont.csilIntroductionGuidance
              ? { csilIntroductionGuidance: "[see CSIL introduction protocol above]" }
              : {}),
            ...(rtCont.tceeBoot ? { tceeBoot: "[see TCEE boot line above]" } : {})
          }
        : layerForPrompt.continuity.runtime;
    const relEpN = Array.isArray(layerForPrompt.continuity.rhizohReliabilityEpisodes)
      ? layerForPrompt.continuity.rhizohReliabilityEpisodes.length
      : 0;
    const metaIn = layerForPrompt.continuity.meta;
    const metaSlimmed =
      relEpN > 0 && metaIn && typeof metaIn === "object"
        ? { ...metaIn, rhizohReliabilityEpisodes: "[see Reliability memory above]" }
        : metaIn;
    layerForPrompt.continuity = {
      ...layerForPrompt.continuity,
      runtime: slimRuntime,
      meta: metaSlimmed,
      identity: slimIdentity,
      identityNarrative: identityNarrative ? "[see Continuity memory section]" : "",
      rhizohWeightedRecollection:
        recallN > 0 ? `[${recallN} items — see Weighted memory recollection above]` : layerForPrompt.continuity.rhizohWeightedRecollection,
      rhizohStabilityAnchor: layerForPrompt.continuity.rhizohStabilityAnchor ? "[see Identity anchor above]" : undefined,
      rhizohNarrativeThread: layerForPrompt.continuity.rhizohNarrativeThread ? "[see Narrative thread above]" : undefined,
      rhizohNarrativeArc: layerForPrompt.continuity.rhizohNarrativeArc ? "[see Narrative arc above]" : undefined,
      rhizohGovernorCalibration: layerForPrompt.continuity.rhizohGovernorCalibration ? "[see Governor calibration above]" : undefined,
      rhizohReliabilitySummary: layerForPrompt.continuity.rhizohReliabilitySummary ? "[see Reliability memory above]" : undefined,
      rhizohReliabilityEpisodes:
        relEpN > 0 ? `[${relEpN} episodes — see Reliability memory above]` : layerForPrompt.continuity.rhizohReliabilityEpisodes,
      rhizohMemoryEpisodes: Array.isArray(layerForPrompt.continuity.rhizohMemoryEpisodes)
        ? `[${layerForPrompt.continuity.rhizohMemoryEpisodes.length} episodes — see Compressed memory above]`
        : layerForPrompt.continuity.rhizohMemoryEpisodes
    };
  }
  if (layerForPrompt.rhizohMemoryContract) {
    layerForPrompt.rhizohMemoryContract = "[see Memory contract line above]";
  }

  const intentRoutingLine = rhizohRouter
    ? [
        "Intent routing (client engine):",
        JSON.stringify({
          intent: rhizohRouter.intent,
          subIntent: rhizohRouter.subIntent,
          confidence: rhizohRouter.confidence,
          urgency: rhizohRouter.urgency,
          emotionalSignal: rhizohRouter.emotionalSignal,
          toolHint: rhizohRouter.toolHint,
          silenceMode: rhizohRouter.silenceMode,
          reliabilityIntentProfile: rhizohRouter.reliabilityIntentProfile
        }),
        "Adjust reply tone: CRISIS = calm, focused repair; BUILD = productive; PLAY = exploratory; REFLECT = thoughtful; CHAT = conversational; SILENCE = brief acknowledgment only."
      ].join(" ")
    : "";

  const continuityBlock = buildContinuityMemoryBlock(continuity);
  const identityBlock = [
    "Identity graph (client continuity): treat as authoritative for user-specific facts; do not invent details absent from it.",
    "Match the user's language (e.g. Turkish when they write Turkish). Speak as one persistent Rhizoh entity, not a generic assistant.",
    continuityBlock ? "" : "No structured continuity in this request yet; stay generic on personal history until it arrives."
  ]
    .filter(Boolean)
    .join("\n");

  const jsonShape = cognitiveInvoke
    ? [
        "Return strict JSON with keys: reply, directive, intents.",
        "intents: array (may be empty) of { toolId, kernelAction?, payload, confidence, rationale?, attentionFocus? }.",
        "confidence must be 0..1. attentionFocus optional: world | room | social | broadcast | memory.",
        "Use intents only for kernel-safe tool actions the client can execute (e.g. presence.avatar.move); omit when unsure."
      ].join(" ")
    : "Return strict JSON with keys: reply, directive.";

  return [
    "You are Rhizoh, command intelligence for Castle Genesis.",
    "Keep answers concise, actionable, and cinematic. Maintain continuity with the user.",
    jsonShape,
    "directive must be one of: FOCUS_RHIZOH, ZOOM_CASTLE, ZOOM_AGENT, ISTANBUL_OVERVIEW, NONE.",
    `Memory contract: ${memoryContract}`,
    intentRoutingLine,
    continuityBlock,
    identityBlock,
    `Persona memory: ${JSON.stringify(persona)}`,
    `Goal memory: ${JSON.stringify(goals)}`,
    `User preferences: ${JSON.stringify(preferences)}`,
    `Episodic memory: ${JSON.stringify(episodic)}`,
    `Semantic memory: ${JSON.stringify(semantic)}`,
    `Procedural memory: ${JSON.stringify(procedural)}`,
    `Layer context: ${JSON.stringify(layerForPrompt || {})}`
  ]
    .filter(Boolean)
    .join("\n");
}

/**
 * Üretimde hassas içerik loglamadan Rhizoh LLM bağlam özetini döner.
 * `CASTLE_RHIZOH_LLM_DIAG=1` ile sunucu konsolunda kullanılır.
 * @param {object|null} artifactStats — `countArtifactLayerDocuments` çıktısı (opsiyonel)
 */
export function diagnoseRhizohLlmContext(layerContext, artifactStats = null) {
  const systemPrompt = buildSystemPrompt(layerContext);
  const memory = layerContext?.memory || {};
  const episodic = Array.isArray(memory.episodic) ? memory.episodic : [];
  const semantic = Array.isArray(memory.semantic) ? memory.semantic : [];
  const procedural = Array.isArray(memory.procedural) ? memory.procedural : [];
  const goals = Array.isArray(memory.goals) ? memory.goals : [];
  const persona = memory.persona && typeof memory.persona === "object" ? memory.persona : {};
  const preferences = memory.preferences && typeof memory.preferences === "object" ? memory.preferences : {};
  const mergedForIntensity = [...episodic, ...semantic, ...procedural];
  let relationshipIntensity = 0;
  if (mergedForIntensity.length) {
    const sum = mergedForIntensity.reduce((a, m) => a + (Number(m?.importance) || 0), 0);
    relationshipIntensity = Math.round((sum / mergedForIntensity.length) * 1000) / 1000;
  }
  const preferenceKeys = Object.keys(preferences);
  const continuity = layerContext?.continuity && typeof layerContext.continuity === "object" ? layerContext.continuity : {};
  const recentReality = Array.isArray(continuity.recentReality) ? continuity.recentReality : [];
  const discoveries = continuity.codex && typeof continuity.codex === "object" && Array.isArray(continuity.codex.discoveries) ? continuity.codex.discoveries : [];
  return {
    identityNarrativeChars: String(continuity.identityNarrative || "").length,
    recentRealityLines: recentReality.length,
    codexDiscoveryNodes: discoveries.length,
    ghostPetMood: continuity.ghostPet && typeof continuity.ghostPet === "object" ? continuity.ghostPet.mood : null,
    castleRealm: (continuity.castleState && continuity.castleState.realm) || continuity.runtime?.realityMode || null,
    memoryCount: mergedForIntensity.length,
    memoryEpisodic: episodic.length,
    memorySemantic: semantic.length,
    memoryProcedural: procedural.length,
    goalsCount: goals.length,
    personaKeys: Object.keys(persona).length,
    preferencesKeyCount: preferenceKeys.length,
    /** İstemci şemasıyla uyum için anahtar adları (değerler loglanmaz) */
    preferenceKeys: preferenceKeys.slice(0, 24),
    relationshipIntensity,
    promptChars: systemPrompt.length,
    activeArtifacts: artifactStats?.total ?? 0,
    artifactAgents: artifactStats?.agents ?? 0,
    artifactCommands: artifactStats?.commands ?? 0,
    artifactRealityEvents: artifactStats?.realityEvents ?? 0,
    artifactCountCapped: Boolean(artifactStats?.capped),
    layerContextKeys: Object.keys(layerContext || {}).filter((k) => k !== "memory")
  };
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

/** @type {Readonly<Record<string, number>>} */
export const RHIZOH_REPLY_PARSE_CONFIDENCE_V0 = Object.freeze({
  "json.reply": 1.0,
  "json.alt_field": 0.7,
  plain_text_fallback: 0.5,
  "json.nested_response": 0.3,
  empty_raw: 0,
  json_missing_reply: 0
});

/**
 * @param {string} extractPath
 * @returns {number}
 */
export const RHIZOH_PROVIDER_EXPECTED_REPLY_FORMAT_V0 = "json.reply";

/**
 * @param {number} confidence 0..1
 * @returns {number} 0..1 — higher = more format drift from provider contract
 */
export function replyFormatDriftScoreFromConfidenceV0(confidence) {
  const c = Number(confidence);
  const conf = Number.isFinite(c) ? Math.max(0, Math.min(1, c)) : 0;
  return Math.round((1 - conf) * 1000) / 1000;
}

/**
 * @param {string} extractPath
 * @returns {{
 *   providerExpectedFormat: string,
 *   observedFormat: string,
 *   replyParsingConfidence: number,
 *   replyFormatDriftScore: number
 * }}
 */
export function computeReplyFormatDriftV0(extractPath) {
  const observedFormat = String(extractPath || "");
  const replyParsingConfidence = replyParsingConfidenceForExtractPathV0(observedFormat);
  return {
    providerExpectedFormat: RHIZOH_PROVIDER_EXPECTED_REPLY_FORMAT_V0,
    observedFormat,
    replyParsingConfidence,
    replyFormatDriftScore: replyFormatDriftScoreFromConfidenceV0(replyParsingConfidence)
  };
}

export function replyParsingConfidenceForExtractPathV0(extractPath) {
  const key = String(extractPath || "");
  if (Object.prototype.hasOwnProperty.call(RHIZOH_REPLY_PARSE_CONFIDENCE_V0, key)) {
    return RHIZOH_REPLY_PARSE_CONFIDENCE_V0[key];
  }
  return 0.25;
}

/**
 * @param {string} extractPath
 * @param {string} reply
 * @param {Record<string, unknown>} parsed
 */
function rhizohReplyExtractResultV0(extractPath, reply, parsed) {
  const format = computeReplyFormatDriftV0(extractPath);
  return {
    reply,
    extractPath,
    parsed,
    ...format
  };
}

/**
 * Provider text → user-visible reply (schema-first, plain-text fallback).
 * @param {string} rawText
 * @returns {{ reply: string, extractPath: string, parsed: Record<string, unknown>, replyParsingConfidence: number }}
 */
export function extractRhizohLlmReplyFromProviderText(rawText) {
  const trimmed = String(rawText || "").trim();
  if (!trimmed) {
    return rhizohReplyExtractResultV0("empty_raw", "", {});
  }

  const parsed = safeParseJsonObject(trimmed) || {};
  const pick = (...keys) => {
    for (const k of keys) {
      const v = parsed[k];
      if (v != null && String(v).trim()) return String(v).trim();
    }
    return "";
  };

  const fromReply = pick("reply");
  if (fromReply) return rhizohReplyExtractResultV0("json.reply", fromReply, parsed);

  const fromAlt = pick("message", "content", "text", "answer", "output");
  if (fromAlt) return rhizohReplyExtractResultV0("json.alt_field", fromAlt, parsed);

  const nested = parsed.response && typeof parsed.response === "object" ? parsed.response : null;
  if (nested) {
    const nestedReply = String(
      nested.reply ?? nested.message ?? nested.content ?? nested.text ?? ""
    ).trim();
    if (nestedReply) return rhizohReplyExtractResultV0("json.nested_response", nestedReply, parsed);
  }

  const hasJsonEnvelope = trimmed.startsWith("{") && Object.keys(parsed).length > 0;
  if (!hasJsonEnvelope) {
    const stripped = trimmed
      .replace(/^```(?:json|markdown)?\s*/i, "")
      .replace(/```\s*$/i, "")
      .trim();
    if (stripped) {
      return rhizohReplyExtractResultV0("plain_text_fallback", stripped, {});
    }
  }

  return rhizohReplyExtractResultV0("json_missing_reply", "", parsed);
}

/**
 * @param {string} endpoint
 * @param {string} key
 * @param {string} model
 * @param {string} systemPrompt
 * @param {string} userMessage
 * @param {Record<string, string>} [extraHeaders]
 * @param {{ maxTokens?: number, temperature?: number }} [gen]
 */
async function callOpenAiLike(endpoint, key, model, systemPrompt, userMessage, extraHeaders = {}, gen = {}) {
  const temperature = gen.temperature != null ? gen.temperature : 0.35;
  const max_tokens = gen.maxTokens != null ? gen.maxTokens : DEFAULT_MAX_COMPLETION_TOKENS;
  const res = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${key}`,
      ...extraHeaders
    },
    body: JSON.stringify({
      model,
      temperature,
      max_tokens,
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

/**
 * @param {{ maxTokens?: number, temperature?: number }} [gen]
 */
async function callAnthropic(key, model, systemPrompt, userMessage, gen = {}) {
  const max_tokens = gen.maxTokens != null ? gen.maxTokens : 420;
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": key,
      "anthropic-version": "2023-06-01"
    },
    body: JSON.stringify({
      model,
      max_tokens,
      system: systemPrompt,
      messages: [{ role: "user", content: userMessage }]
    })
  });
  if (!res.ok) throw new Error(`provider_http_${res.status}`);
  const json = await res.json();
  const content = json?.content?.[0]?.text || "";
  return String(content);
}

/**
 * @param {{ maxTokens?: number, temperature?: number }} [gen]
 */
async function callGemini(key, model, systemPrompt, userMessage, gen = {}) {
  const temperature = gen.temperature != null ? gen.temperature : 0.35;
  const maxOutputTokens = gen.maxTokens != null ? gen.maxTokens : DEFAULT_MAX_COMPLETION_TOKENS;
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(key)}`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      generationConfig: { temperature, maxOutputTokens, responseMimeType: "application/json" },
      contents: [{ role: "user", parts: [{ text: `${systemPrompt}\n\nUser: ${userMessage}` }] }]
    })
  });
  if (!res.ok) throw new Error(`provider_http_${res.status}`);
  const json = await res.json();
  const content = json?.candidates?.[0]?.content?.parts?.[0]?.text || "";
  return String(content);
}

/**
 * Hangi anahtarın kullanılacağı — otomatik env→conn sırası yalnızca `auto` modunda.
 * @param {"env"|"user_connection"|"auto"} mode
 * @param {string} envKey
 * @param {string} connectionKey — yalnızca sunucunun `resolveConnection` ile yüklediği anahtar
 * @param {boolean} allowExternalApiKey
 * @param {string} externalKey — yalnızca bağlantı testi
 */
function resolveLlmSecretKey({ mode, envKey, connectionKey, allowExternalApiKey, externalKey, provider }) {
  const env = String(envKey || "").trim();
  const conn = String(connectionKey || "").trim();
  const ext = String(externalKey || "").trim();

  if (allowExternalApiKey && ext) {
    return { key: ext, llmKeyBillingOwner: "connection_test", llmKeyOrigin: "connection_test" };
  }

  if (mode === "env") {
    if (!env) {
      const e = new Error("server_llm_key_missing");
      e.code = "server_llm_key_missing";
      throw e;
    }
    return { key: env, llmKeyBillingOwner: "server", llmKeyOrigin: "env" };
  }

  if (mode === "user_connection") {
    if (!conn) {
      const e = new Error("user_llm_connection_required");
      e.code = "user_llm_connection_required";
      throw e;
    }
    return { key: conn, llmKeyBillingOwner: "user", llmKeyOrigin: "user_connection" };
  }

  if (env) return { key: env, llmKeyBillingOwner: "server", llmKeyOrigin: "env" };
  if (conn) return { key: conn, llmKeyBillingOwner: "user", llmKeyOrigin: "user_connection" };
  const e = new Error(`missing_api_key_for_${String(provider || "unknown")}`);
  e.code = "missing_api_key";
  throw e;
}

/**
 * @param {object} input
 * @param {{ allowExternalApiKey?: boolean, llmKeySource?: "env"|"user_connection"|"auto" }} [meta]
 */
export async function queryRhizohLlm(input, meta = {}) {
  const allowExternalApiKey = meta.allowExternalApiKey === true;
  const keyMode = meta.llmKeySource || "auto";
  const payload = input || {};
  const context = payload?.context || {};
  const cognitiveInvoke = Boolean(context?.cognitiveInvoke);
  const message = String(payload?.message || "").slice(0, cognitiveInvoke ? 24000 : 1600);
  if (!message) throw new Error("message_required");
  const { provider, model } = getProviderConfig(payload?.provider, payload?.model);
  const envKey = getProviderKey(provider);
  const connectionKey = String(payload?.apiKey || "").trim();
  const externalKey = allowExternalApiKey ? connectionKey : "";

  const { key, llmKeyBillingOwner, llmKeyOrigin } = resolveLlmSecretKey({
    mode: keyMode,
    envKey,
    connectionKey: allowExternalApiKey ? "" : connectionKey,
    allowExternalApiKey,
    externalKey: allowExternalApiKey ? externalKey : "",
    provider
  });

  const gen = resolveRhizohGenerationOptions(payload);
  const systemPromptBase = buildSystemPrompt(context);
  const systemPrompt =
    gen.modeDirective && gen.generationModeLabel
      ? `${systemPromptBase}\n\n## Rhizoh generation: ${gen.generationModeLabel}\n${gen.modeDirective}`
      : systemPromptBase;
  let rawText = "";

  if (provider === "anthropic") {
    rawText = await callAnthropic(key, model, systemPrompt, message, gen);
  } else if (provider === "gemini") {
    rawText = await callGemini(key, model, systemPrompt, message, gen);
  } else if (provider === "xai") {
    rawText = await callOpenAiLike("https://api.x.ai/v1/chat/completions", key, model, systemPrompt, message, {}, gen);
  } else if (provider === "deepseek") {
    rawText = await callOpenAiLike("https://api.deepseek.com/chat/completions", key, model, systemPrompt, message, {}, gen);
  } else if (provider === "mistral") {
    rawText = await callOpenAiLike("https://api.mistral.ai/v1/chat/completions", key, model, systemPrompt, message, {}, gen);
  } else if (provider === "openrouter") {
    rawText = await callOpenAiLike(
      "https://openrouter.ai/api/v1/chat/completions",
      key,
      model,
      systemPrompt,
      message,
      { "HTTP-Referer": "https://castle.local", "X-Title": "Castle Rhizoh Gateway" },
      gen
    );
  } else {
    rawText = await callOpenAiLike("https://api.openai.com/v1/chat/completions", key, model, systemPrompt, message, {}, gen);
  }

  const extracted = extractRhizohLlmReplyFromProviderText(rawText);
  const parsed = extracted.parsed;
  const rawReplyFromSchema = String(extracted.reply || "").trim();

  /** @type {"ok"|"empty_reply"|"semantic_silence"|"unstructured_reply"} */
  let rhizohDeliveryKind = "ok";
  let reply;
  if (!rawReplyFromSchema) {
    rhizohDeliveryKind = "empty_reply";
    reply = "Rhizoh yanıt üretti fakat içerik boş döndü.";
  } else if (/^<SILENCE\b/i.test(rawReplyFromSchema) || rawReplyFromSchema === "<SILENCE>") {
    rhizohDeliveryKind = "semantic_silence";
    reply = rawReplyFromSchema;
  } else if (extracted.extractPath === "plain_text_fallback" || extracted.extractPath === "json.alt_field") {
    rhizohDeliveryKind = "unstructured_reply";
    reply = rawReplyFromSchema;
  } else {
    reply = rawReplyFromSchema;
  }

  const directiveRaw = String(parsed.directive || "NONE").toUpperCase();
  const directive = ["FOCUS_RHIZOH", "ZOOM_CASTLE", "ZOOM_AGENT", "ISTANBUL_OVERVIEW", "NONE"].includes(directiveRaw)
    ? directiveRaw
    : "NONE";
  const intents = Array.isArray(parsed.intents) ? parsed.intents : [];

  const rhizohCompressionLedger = {
    prePromptChars: systemPrompt.length,
    rawProviderChars: rawText.length,
    parsedReplyChars: rawReplyFromSchema.length,
    replyExtractPath: extracted.extractPath,
    replyParsingConfidence: extracted.replyParsingConfidence,
    replyFormatDriftScore: extracted.replyFormatDriftScore,
    providerExpectedFormat: extracted.providerExpectedFormat,
    observedFormat: extracted.observedFormat,
    generationMode: gen.generationModeLabel,
    maxTokensApplied: gen.maxTokens
  };

  return {
    ok: true,
    provider,
    model,
    reply,
    directive,
    intents,
    cognitiveInvoke,
    llmKeyBillingOwner,
    llmKeyOrigin,
    rhizohDeliveryKind,
    replyParsingConfidence: extracted.replyParsingConfidence,
    replyFormatDriftScore: extracted.replyFormatDriftScore,
    providerExpectedFormat: extracted.providerExpectedFormat,
    observedFormat: extracted.observedFormat,
    rhizohCompressionLedger
  };
}
