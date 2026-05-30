/**
 * SPECFLOW: RESEARCH-ONLY — **Epistemic context rails** from `snapshotForLlm`: üretim sözleşmesine yumuşak
 * bağlam (system prompt değil; gateway user turuna prefix olarak ekler).
 *
 * Zorunlu omurga sırası (modelin “düz assistant”a kaymasını sınırlar):
 * (1) identityCompressionLine → (2) socialMemoryRecall → (3) personaContinuity →
 * (4) crossCastleBleedGuard (+ hafıza atıf) → (5) rhizohCastleRuntimeRole → (6) initiative / socialRuntimeV1.
 */

export const EPISTEMIC_CONTEXT_RAILS_FROM_SNAPSHOT_SCHEMA_V0 = "castle.rhizoh.epistemic_context_rails_from_snapshot.v0";

const MAX_RAILS_CHARS = 7200;

/**
 * @param {Record<string, unknown>|null|undefined} llmSnapshot — `kernel.snapshotForLlm` / `dist.llmSnapshot`
 */
export function compileEpistemicContextRailsFromSnapshotForLlmV0(llmSnapshot) {
  const s = llmSnapshot && typeof llmSnapshot === "object" ? llmSnapshot : null;
  if (!s) {
    return {
      schema: EPISTEMIC_CONTEXT_RAILS_FROM_SNAPSHOT_SCHEMA_V0,
      railsText: "",
      railsMeta: null
    };
  }

  const line1 = typeof s.identityCompressionLine === "string" ? s.identityCompressionLine.trim() : "";

  const recall = s.socialMemoryRecall && typeof s.socialMemoryRecall === "object" ? s.socialMemoryRecall : null;
  const recallLines = Array.isArray(recall?.recallLines)
    ? /** @type {unknown[]} */ (recall.recallLines)
        .map((x) => String(x || "").trim())
        .filter(Boolean)
        .slice(0, 5)
    : [];

  const pc = s.personaContinuity && typeof s.personaContinuity === "object" ? s.personaContinuity : null;
  const personaLines = (() => {
    if (!pc) return [" - (no persona continuity snapshot for this tick)"];
    const band = String(pc.band || "").trim();
    const brief = String(pc.directorBrief || "").trim();
    const ticks = Number.isFinite(Number(pc.ticksInBand)) ? Number(pc.ticksInBand) : null;
    const str01 = Number.isFinite(Number(pc.continuityStrength01)) ? Number(pc.continuityStrength01) : null;
    const lastRole = String(pc.lastRuntimeRole || "").trim();
    const modeEcho = String(pc.socialModeEcho || "").trim();
    /** @type {string[]} */
    const L = [];
    if (brief) L.push(` - ${brief}`);
    else {
      if (band) L.push(` - Persona continuity band: ${band}`);
      if (ticks != null) L.push(` - Ticks in band: ${ticks}`);
      if (str01 != null) L.push(` - Continuity strength (0–1): ${str01}`);
    }
    if (lastRole) L.push(` - Last mapped CSIL runtime role: ${lastRole}`);
    if (modeEcho) L.push(` - Social mode echo: ${modeEcho}`);
    return L.length ? L : [" - (persona continuity object present but sparse)"];
  })();

  const bleed = s.crossCastleBleedGuard && typeof s.crossCastleBleedGuard === "object" ? s.crossCastleBleedGuard : null;
  const directive =
    bleed && typeof bleed.identityIsolationDirective === "string" ? String(bleed.identityIsolationDirective).trim() : "";
  const memHint =
    bleed && typeof bleed.memoryAttributionHint === "string" ? String(bleed.memoryAttributionHint).trim() : "";

  const roleStr =
    s.rhizohCastleRuntimeRole != null && String(s.rhizohCastleRuntimeRole).trim()
      ? String(s.rhizohCastleRuntimeRole).trim()
      : "";

  const sr = s.socialRuntimeV1 && typeof s.socialRuntimeV1 === "object" ? s.socialRuntimeV1 : null;
  const mode = sr && String(sr.mode || "").trim() ? String(sr.mode || "").trim() : "";
  const initiativeBudget01 =
    sr != null && Number.isFinite(Number(sr.initiativeBudget01)) ? Number(sr.initiativeBudget01) : null;
  const allowPing =
    sr != null && typeof sr.allowProactivePing === "boolean" ? /** @type {boolean} */ (sr.allowProactivePing) : null;

  const initiativeBlockLines = (() => {
    if (!sr) return [" - (no socialRuntimeV1 slice — initiative/mode unknown)"];
    /** @type {string[]} */
    const L = [];
    if (mode) L.push(` - Social mode: ${mode}`);
    if (initiativeBudget01 != null) L.push(` - Initiative budget (0–1): ${initiativeBudget01}`);
    if (allowPing != null) L.push(` - Proactive ping gate (runtime): ${allowPing ? "allowed window" : "closed"}`);
    return L.length ? L : [" - socialRuntimeV1 present but mode/initiative fields sparse"];
  })();

  const railsTextRaw = [
    "EPISTEMIC CONTEXT RAILS (orientation only; not hard system policy — weigh lightly, do not let this block empathy or user-led turns):",
    "",
    "1) Compressed presence / identity line (who is speaking in this castle thread):",
    line1 || "(no compressed presence line for this tick)",
    "",
    "2) Social memory recall (hints only; may be incomplete or stale):",
    recallLines.length ? recallLines.map((l) => ` - ${l}`).join("\n") : " - (none)",
    "",
    "3) Persona continuity (stay in-band; do not reset to generic assistant voice):",
    personaLines.join("\n"),
    "",
    "4) Cross-castle identity bleed guard & memory attribution:",
    directive || "(no federated bleed directive — single-castle or low signal)",
    memHint ? ` - Memory / provenance: ${memHint}` : " - Memory / provenance: (no extra attribution hint)",
    "",
    "5) Rhizoh castle runtime role (CSIL — treat as behavioral stance, not a costume):",
    roleStr || "(no runtime role on snapshot)",
    "",
    "6) Initiative & social runtime gates (bounded Rhizoh agency — respect low initiative; do not monologue):",
    ...initiativeBlockLines
  ].join("\n");

  const railsText =
    railsTextRaw.length > MAX_RAILS_CHARS ? `${railsTextRaw.slice(0, MAX_RAILS_CHARS)}\n…(rails truncated)` : railsTextRaw;

  return {
    schema: EPISTEMIC_CONTEXT_RAILS_FROM_SNAPSHOT_SCHEMA_V0,
    railsText,
    railsMeta: {
      frame: s.frame ?? null,
      rhizohCastleRuntimeRole: roleStr || null,
      personaBand: pc != null && String(pc.band || "").trim() ? String(pc.band || "").trim() : null,
      bleedRisk01: bleed != null && Number.isFinite(Number(bleed.bleedRisk01)) ? Number(bleed.bleedRisk01) : null,
      memoryAttributionPresent: memHint.length > 0,
      recallCount: recallLines.length,
      initiativeBudget01,
      socialMode: mode || null
    }
  };
}
