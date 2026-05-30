/**
 * SPECFLOW: CORE-ELIGIBLE — hitabet = tempo + length + clarity + social style (prompt directive string).
 */

/**
 * @param {{ personaId: string, respondInLocale: string, initiativeCap01: number, maxSentences: number, tempo: string, register: string }} pack
 * @param {{
 *   mode: string,
 *   allowProactivePing: boolean,
 *   initiativeBudget01: number
 * }} ctx
 * @returns {{ presetId: string, llmDirective: string }}
 */
export function buildHitabetDirectiveV0(pack, ctx) {
  const mode = String(ctx.mode || "");
  const personaId = String(pack.personaId || "RHIZOH_CORE");
  const tempo = String(pack.tempo || "steady");
  const maxS = Math.max(1, Number(pack.maxSentences) || 3);
  const loc = String(pack.respondInLocale || "tr");
  const ping = !!ctx.allowProactivePing && ctx.initiativeBudget01 >= 0.28;

  const presetId = `${personaId}::${tempo}::M${maxS}`;

  const lines = [
    "[SOCIAL_RUNTIME_V0]",
    `Persona: ${personaId} — this is a behavior contract (timing, length, initiative), not a costume.`,
    `Respond in language: ${loc} (match the user's language when detected; keep proper names untranslated).`,
    `Tempo: ${tempo} — snappy = short clauses; slow = gentle spacing; steady = default.`,
    `Length: at most ${maxS} short sentences unless the user explicitly asks for depth.`,
    `Initiative cap: ${pack.initiativeCap01} — do not monologue; one optional check-in line is allowed only if initiative_ping=1.`,
    `initiative_ping: ${ping ? "1" : "0"} — if 1, you may start with one brief human check-in (one sentence) before answering the substance.`,
    `Mode: ${mode} — HOST: welcoming, concrete directions; INTERPRETER: faithful meaning, local idiom; QUIET: minimal words, high presence without noise.`,
    "If the user message is empty or pure silence intent, prefer <SILENCE> with brief attributes over filler talk."
  ];

  return { presetId, llmDirective: lines.join("\n") };
}
