/** İstemci ↔ persistContinuityTurn ile uyumlu olay adı */
export const CASTLE_RHIZOH_EPISTEMIC_SURFACE_EVENT = "castle-rhizoh-epistemic-surface";

/**
 * @param {string} hex
 * @param {number} [n]
 */
function shortHex(hex, n = 14) {
  const s = String(hex || "").replace(/^0x/i, "");
  if (!s) return "—";
  return s.length <= n ? s : `${s.slice(0, n)}…`;
}

function classifyResonanceFromWindow(rows) {
  const arr = Array.isArray(rows) ? rows.filter((x) => typeof x?.vectorScore === "number").slice(0, 8) : [];
  if (!arr.length) return "unknown";
  const scores = arr.map((x) => Number(x.vectorScore) || 0);
  const drifts = arr.map((x) => Number(x.driftIndex) || 0);
  const mean = scores.reduce((a, b) => a + b, 0) / scores.length;
  const variance = scores.reduce((a, b) => a + (b - mean) * (b - mean), 0) / scores.length;
  const slope = scores.length > 1 ? (scores[0] - scores[scores.length - 1]) / (scores.length - 1) : 0;
  const driftMean = drifts.reduce((a, b) => a + b, 0) / drifts.length;

  if (mean < 0.56 || slope < -0.035 || driftMean > 0.32) return "fragile";
  if (variance > 0.012 || Math.abs(slope) > 0.02) return "oscillating";
  return "stable";
}

/**
 * @param {{
 *   snapshot: {
 *     epistemic?: Record<string, unknown> | null,
 *     router?: { intent?: string, subIntent?: string } | null,
 *     source?: string | null,
 *     modelRoute?: { provider?: string | null, model?: string | null } | null
 *   } | null,
 *   gatewayPhase?: string | null,
 *   uiEnv: { layerFocus: number, realityMode: string, governanceState: string, mapSurfaceActive: boolean },
 *   firebaseUid?: string | null
 * }} input
 */
export function buildEpistemicOrbSurface(input) {
  const { snapshot, gatewayPhase, uiEnv, firebaseUid } = input;
  const ep = snapshot?.epistemic && typeof snapshot.epistemic === "object" ? snapshot.epistemic : null;
  const routing = ep?.routing && typeof ep.routing === "object" ? ep.routing : {};
  const intent = ep?.intent && typeof ep.intent === "object" ? ep.intent : {};
  const runtime = ep?.runtime && typeof ep.runtime === "object" ? ep.runtime : {};
  const clientBindings =
    ep?.clientBindings && typeof ep.clientBindings === "object" ? ep.clientBindings : {};
  const ledger = snapshot?.ledger && typeof snapshot.ledger === "object" ? snapshot.ledger : null;
  const ledgerTimeline = Array.isArray(snapshot?.ledgerTimeline) ? snapshot.ledgerTimeline : [];
  const resonance = classifyResonanceFromWindow(ledgerTimeline);

  const primaryLayer = String(routing.primaryLayer || "—");
  const modeIntent = String(snapshot?.router?.intent || intent.intent || "—").toUpperCase();
  const source = String(snapshot?.source || runtime.llmPath || "—");
  const gw = String(gatewayPhase ?? runtime.gatewayPhase ?? "").toLowerCase();

  const hash = ep?.hash != null ? String(ep.hash) : "";
  const sig = ep?.signature != null ? String(ep.signature) : "";
  const sealErr = ep?.sealError != null ? String(ep.sealError) : "";

  let sealLabel = "IDLE";
  let sealTone = "muted";
  if (!ep) {
    sealLabel = "NO_TURN_YET";
  } else if (hash && sig) {
    sealLabel = "VERIFIED";
    sealTone = "ok";
  } else if (sealErr) {
    sealLabel = "DEGRADED";
    sealTone = "warn";
  } else if (gw === "offline" || gw === "offline_dns" || gw === "unconfigured") {
    sealLabel = "UNSIGNED";
    sealTone = "muted";
  } else {
    sealLabel = "PENDING";
  }

  const modelFromSnap = snapshot?.modelRoute;
  const modelLine =
    modelFromSnap?.provider || modelFromSnap?.model
      ? `${String(modelFromSnap.provider || "—")}/${String(modelFromSnap.model || "—")}`
      : "—";

  const worldHash = clientBindings.worldSnapshotHash ? shortHex(clientBindings.worldSnapshotHash, 16) : "—";

  let attachment = "—";
  if (!ep) attachment = "AWAITING_TRACE";
  else if (hash && sig) attachment = firebaseUid ? "CLOUD_ATTESTED" : "ATTESTED";
  else if (source === "remote-llm" && (gw === "connected" || gw === "uncertain"))
    attachment = firebaseUid ? "REMOTE_SIGNED_PENDING" : "REMOTE_UNSIGNED";
  else if (source === "local-stub" || source === "fallback") attachment = "LOCAL_ONLY";
  else attachment = "LOCAL";

  let worldSync = "—";
  if ((gw === "connected" || gw === "uncertain") && uiEnv.mapSurfaceActive) worldSync = "MAP_LIVE";
  else if (gw === "connected" || gw === "uncertain") worldSync = "MAP_IDLE";
  else if (gw === "offline" || gw === "offline_dns") worldSync = "UNSYNCHRONIZED";
  else worldSync = "LINK_UNKNOWN";

  let memoryLine = "—";
  if (!ep) memoryLine = "—";
  else if (sealLabel === "VERIFIED") memoryLine = "ATTESTED";
  else if (sealErr === "no_gateway_base" || sealErr === "epistemic_seal_disabled") memoryLine = "LOCAL_ONLY";
  else if (clientBindings.memoryDigest) memoryLine = "DIGEST_OK";
  else memoryLine = "UNKNOWN";

  const proof = Array.isArray(routing.proofObligations) && routing.proofObligations[0]
    ? String(routing.proofObligations[0]).slice(0, 120)
    : "";

  const truthRegime =
    !ep || primaryLayer === "—"
      ? "—"
      : primaryLayer === "L12"
        ? "VALIDATION_FIRST"
        : primaryLayer === "L11"
          ? "CONTINUITY"
          : primaryLayer === "L9"
            ? "CONSTRUCTIVE"
            : "ORCHESTRATION";

  return {
    rows: [
      { k: "PRIMARY LAYER", v: primaryLayer, tone: "accent" },
      { k: "SURFACE", v: `L${uiEnv.layerFocus}`, tone: "dim" },
      { k: "REALITY", v: String(uiEnv.realityMode || "—").toUpperCase(), tone: "dim" },
      { k: "GOVERNANCE", v: String(uiEnv.governanceState || "—").toUpperCase(), tone: "dim" },
      { k: "MODE", v: modeIntent, tone: "accent" },
      { k: "TRUTH REGIME", v: truthRegime, tone: "dim" },
      { k: "SEAL", v: sealLabel, tone: sealTone },
      ...(sealErr ? [{ k: "SEAL NOTE", v: sealErr.slice(0, 48), tone: "warn" }] : []),
      { k: "MODEL", v: modelLine, tone: "dim" },
      { k: "WORLD HASH", v: worldHash, tone: "dim" },
      { k: "WORLD LINK", v: worldSync, tone: gw === "connected" ? "ok" : "warn" },
      { k: "MEMORY", v: memoryLine, tone: memoryLine === "ATTESTED" ? "ok" : "dim" },
      ...(typeof ledger?.vectorScore === "number"
        ? [{ k: "EP SCORE", v: Number(ledger.vectorScore).toFixed(2), tone: ledger.vectorScore >= 0.75 ? "ok" : "warn" }]
        : []),
      ...(typeof ledger?.driftIndex === "number"
        ? [{ k: "DRIFT", v: Number(ledger.driftIndex).toFixed(3), tone: ledger.driftIndex <= 0.2 ? "ok" : "warn" }]
        : []),
      {
        k: "ATTACHMENT",
        v: attachment,
        tone:
          attachment.includes("LOCAL_ONLY") || attachment === "AWAITING_TRACE" ? "warn" : "dim"
      },
      ...(proof ? [{ k: "PROOF SKETCH", v: proof, tone: "dim" }] : [])
    ],
    sealTone,
    primaryLayer,
    sealLabel,
    driftIndex: typeof ledger?.driftIndex === "number" ? ledger.driftIndex : null,
    vectorScore: typeof ledger?.vectorScore === "number" ? ledger.vectorScore : null,
    timeline: ledgerTimeline.map((x) => ({ ...x, resonanceTag: classifyResonanceFromWindow([x, ...ledgerTimeline.slice(1, 8)]) })),
    resonance
  };
}
