/**
 * Continuity assessment export — öneri + rapor (salt okunur, yürütme yok).
 *
 * - `buildContinuityReconciliationSuggestions` → drift / confidence’a göre **yalnızca metinsel** öneriler.
 * - `formatContinuityProbeReportMarkdown` → CI / arşiv / dashboard için Markdown.
 *
 * `confidence.band === "high"` **kimlik / ontoloji onayı değildir** — yalnızca operasyonel süreklilik kanıtı sentezi.
 */

/** UI / telemetry için kısa uyarı (İngilizce sabit — log araması kolay). */
export const CONTINUITY_BAND_NOT_ONTOLOGY =
  "confidence.band is operational continuity synthesis only; not identity, entity equivalence, or consciousness restoration.";

/**
 * @typedef {{ id: string, severity: "info" | "warn" | "critical", summary: string, rationale: string }} ContinuitySuggestion
 */

/**
 * @param {Record<string, unknown>} probeResult `runOperationalContinuityProbeV1` çıktısı veya aynı şeklin JSON’u
 */
export function buildContinuityReconciliationSuggestions(probeResult) {
  if (!probeResult || typeof probeResult !== "object") {
    return {
      readOnly: true,
      disclaimer: CONTINUITY_BAND_NOT_ONTOLOGY,
      suggestions: [
        {
          id: "invalid_probe_input",
          severity: "warn",
          summary: "Probe sonucu eksik veya geçersiz.",
          rationale: "Öneri üretimi için runOperationalContinuityProbeV1 çıktısı gerekir."
        }
      ]
    };
  }

  /** @type {ContinuitySuggestion[]} */
  const suggestions = [];
  const classes = new Set(probeResult.driftClasses || []);
  const primary = probeResult.primaryDriftClass;

  const push = (/** @type {ContinuitySuggestion} */ s) => suggestions.push(s);

  if (classes.has("projection_regressed")) {
    push({
      id: "rrhp_projection_regressed",
      severity: "critical",
      summary: "Kalıcı slice ile canlı RRHP projection uyumsuz (regresyon).",
      rationale:
        "Slice’ı tek başına otorite saymayın; kaynak gerçeklik zincirini doğrulayın veya kontrollü reset + yeniden hydrate değerlendirin. Otomatik merge yok."
    });
  }
  if (classes.has("operational_gap")) {
    push({
      id: "operational_gap_live_behind",
      severity: "warn",
      summary: "Canlı runtime, restore edilen toplamların gerisinde görünüyor.",
      rationale:
        "Oturum / drain tamamlanmamış olabilir veya farklı cihaz; önce operasyonel olayların tam drain edildiğini ve auth oturumunu doğrulayın."
    });
  }
  if (classes.has("fingerprint_divergence")) {
    push({
      id: "fingerprint_divergence",
      severity: "warn",
      summary: "Operational-only parmak izi restore anına göre sapmış.",
      rationale:
        "Paralel sekme, ek ingest veya restore öncesi/sonrası zamanlama: `fingerprintAtRestoreOperationalOnly`’ı bilinen bir idle noktasında yeniden yakalayın."
    });
  }
  if (classes.has("tail_reordered")) {
    push({
      id: "tail_reordered",
      severity: "warn",
      summary: "Meta sırası ile canlı operational tail sırası uyumsuz.",
      rationale:
        "Tek yazar / monoton sıra varsayımını gözden geçirin; çok kaynaklı ingest varsa sıra modelini netleştirin."
    });
  }
  if (classes.has("tail_partial_only")) {
    push({
      id: "tail_partial_only",
      severity: "info",
      summary: "Tail örtüşmesi kısmi — sınırlı süreklilik kanıtı.",
      rationale:
        "Persist edilen `appliedMetaTail` uzunluğunu veya probe öncesi bekleme süresini artırmayı değerlendirin; confidence contributions ile birlikte okuyun."
    });
  }
  if (classes.has("non_comparable") && classes.size === 1) {
    push({
      id: "non_comparable_withhold",
      severity: "info",
      summary: "Karşılaştırılabilir sinyal yetersiz — aggregate bilinçli olarak withheld.",
      rationale:
        "Parmak izi ve/veya meta tail sağlayın; bu durum ceza değil belirsizlik (epistemik withhold)."
    });
  }

  if (suggestions.length === 0) {
    push({
      id: "no_actionable_drift",
      severity: "info",
      summary: "Sınıflanmış drift yok veya öneri gerektirmiyor.",
      rationale: primary ? `primaryDriftClass=${primary}` : "Drift taksonu boş; yine de confidence contributions ile okuyun."
    });
  }

  return {
    readOnly: true,
    disclaimer: CONTINUITY_BAND_NOT_ONTOLOGY,
    suggestions
  };
}

function esc(s) {
  return String(s ?? "").replace(/\|/g, "\\|").replace(/\n/g, " ");
}

/**
 * @param {Record<string, unknown>} probeResult
 */
export function formatContinuityProbeReportMarkdown(probeResult) {
  const sug = buildContinuityReconciliationSuggestions(probeResult);
  const lines = [];
  lines.push("# Operational continuity probe report");
  lines.push("");
  lines.push("> **Epistemic boundary:** " + CONTINUITY_BAND_NOT_ONTOLOGY);
  lines.push("");

  lines.push("## Probe summary");
  lines.push(`| Field | Value |`);
  lines.push(`| --- | --- |`);
  lines.push(`| continuity | ${esc(probeResult.continuity)} |`);
  lines.push(`| staleRisk | ${esc(probeResult.staleRisk)} |`);
  lines.push(`| note | ${esc(probeResult.note)} |`);
  lines.push(`| primaryDriftClass | ${esc(probeResult.primaryDriftClass)} |`);
  lines.push(`| driftClasses | ${esc(JSON.stringify(probeResult.driftClasses || []))} |`);
  lines.push(`| restoreMetaLength | ${esc(probeResult.restoreMetaLength)} |`);
  lines.push(`| overlapRatio | ${esc(probeResult.overlapRatio)} |`);
  lines.push(`| operationalTailOverlap | ${esc(probeResult.operationalTailOverlap)} |`);
  lines.push("");

  const c = probeResult.confidence;
  if (c && typeof c === "object") {
    lines.push("## Confidence");
    lines.push(`| Field | Value |`);
    lines.push(`| --- | --- |`);
    lines.push(`| band | ${esc(c.band)} |`);
    lines.push(`| aggregate | ${c.aggregate == null ? "*withheld (null)*" : esc(c.aggregate)} |`);
    lines.push(`| regressionPenaltyApplied | ${esc(c.regressionPenaltyApplied)} |`);
    lines.push("");
    if (Array.isArray(c.uncertaintyNotes) && c.uncertaintyNotes.length) {
      lines.push("### uncertaintyNotes");
      for (const n of c.uncertaintyNotes) lines.push(`- ${esc(n)}`);
      lines.push("");
    }
    if (c.multipliers && typeof c.multipliers === "object") {
      lines.push("### multipliers");
      lines.push("```json");
      lines.push(JSON.stringify(c.multipliers, null, 2));
      lines.push("```");
      lines.push("");
    }
    if (Array.isArray(c.contributions)) {
      lines.push("### contributions");
      lines.push(`| key | value | nominalWeight | used | rationale |`);
      lines.push(`| --- | --- | --- | --- | --- |`);
      for (const row of c.contributions) {
        lines.push(
          `| ${esc(row.key)} | ${row.value == null ? "∅" : esc(row.value)} | ${esc(row.nominalWeight)} | ${esc(row.used)} | ${esc(row.rationale)} |`
        );
      }
      lines.push("");
    }
  }

  lines.push("## Reconciliation suggestions (read-only, not executed)");
  for (const s of sug.suggestions) {
    lines.push(`### [${s.severity}] ${esc(s.id)}`);
    lines.push(`- **Summary:** ${esc(s.summary)}`);
    lines.push(`- **Rationale:** ${esc(s.rationale)}`);
    lines.push("");
  }

  lines.push("---");
  lines.push("*Generated by continuityAssessmentExportV1 — no runtime mutation.*");
  return lines.join("\n");
}
