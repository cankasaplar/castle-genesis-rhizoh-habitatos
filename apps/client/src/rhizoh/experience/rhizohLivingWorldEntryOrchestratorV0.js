/**
 * CORE-ELIGIBLE — AppRhizoh528 canonical entry orchestrator (single shell model).
 *
 * RCML v1.0 SSOT map: `apps/client/docs/RHIZOH_CANONICAL_MODEL_LAYER_MAP_V1.0.md`
 * (Rhizoh Canonical Model Layer — identity · entropy · drift · mutation · coherence)
 *
 * **Not a component list.** Three fixed zones only:
 * 1. Continuity Strip — dün → bugün değişti → neden buradasın
 * 2. World State (read-only) — collective feeling, castle presence, world instance
 * 3. Action Surface — Observe · Enter Castle · Create Castle (later)
 *
 * Screen model: B (living world entry) + C (castle-first) — never dashboard.
 */

import { formatRelativeVisitTrV0, readLivingWorldPersistenceV0 } from "./livingWorldPersistenceUxV0.js";
import { deriveCollectivePresenceFeelingV0 } from "./livingWorldCollectivePulseV0.js";
import {
  buildWorldMutationFeedbackV0,
  applyMutationToCastlePresenceV0
} from "./worldMutationFeedbackV0.js";
import { readPerceptualEntropyBudgetV0 } from "./worldDriftCalibrationV0.js";
import { readEntropyEconomyStateV0 } from "./perceptualEntropyEconomyV0.js";
import {
  formatSelfSignatureHintV0
} from "./identityDriftBindingV0.js";
import {
  readCrossSessionCoherenceAnchorV0,
  describeCrossSessionCoherenceV0
} from "./crossSessionWorldCoherenceV0.js";
import {
  deriveSpiralMMOAgreementLayerV0,
  mergeAgreementLayerIntoCollectiveFeelingV0
} from "./spiralMMOAgreementLayerV0.js";
import {
  derivePassivePerceptionFieldV0,
  mergePerceptionFieldIntoCollectiveFeelingV0
} from "./passivePerceptionFieldCoherenceV0.js";
import { buildLivingWorldEntryHumanLayerV0 } from "./livingWorldEntryHumanLayerV0.js";

export const RHIZOH_LIVING_WORLD_ENTRY_SCHEMA_V0 = "castle.rhizoh.living_world_entry.v0";

/**
 * @param {{
 *   worldInstance: { instanceId: string, timeZone?: string, locale?: string },
 *   livingFrame?: {
 *     ribbon?: { atmosphereLead?: string, worldEcho?: string },
 *     castle?: { affordanceId?: string, metabolicPulse?: number, surfaceReady?: boolean },
 *     atmosphere?: { state?: { ambient?: { weatherType?: string } } }
 *   } | null,
 *   sessionTouch?: { isReturnVisit?: boolean, visitCount?: number } | null,
 *   mutationFeedback?: ReturnType<typeof buildWorldMutationFeedbackV0> | null,
 *   crossSessionCoherence?: { coherenceLine?: string | null, hydrated?: boolean } | null,
 *   identityBinding?: { selfSignature: string, sessionIdentity: string } | null,
 *   spiralPerceptionBridge?: boolean,
 *   spiralAgreementLayer?: boolean,
 *   lastActionClosure?: { action?: string, feedbackLine?: string } | null
 * }} input
 */
export function buildRhizohLivingWorldEntryModelV0(input) {
  const wi = input.worldInstance;
  const frame = input.livingFrame;
  const stored = readLivingWorldPersistenceV0(wi.instanceId);
  const returning = Boolean(input.sessionTouch?.isReturnVisit || (stored?.visitCount ?? 0) > 1);
  const lastEndMs = stored?.lastSessionEndAtMs || 0;
  const lastVisitHuman = lastEndMs > 0 ? formatRelativeVisitTrV0(lastEndMs) : null;

  const weatherNow = frame?.atmosphere?.state?.ambient?.weatherType || "unknown";
  const weatherWas = stored?.lastWeatherType || null;
  const atmosphereNow = frame?.ribbon?.atmosphereLead || "";
  const atmosphereWas = stored?.lastAtmosphereLead || "";
  const castleNow = frame?.castle?.affordanceId?.replace("castle.interact.", "") || null;
  const castleWas = stored?.lastCastleAffordance?.replace("castle.interact.", "") || null;

  const weatherChanged = weatherWas && weatherNow !== weatherWas;
  const atmosphereChanged = atmosphereWas && atmosphereNow && atmosphereNow !== atmosphereWas;
  const castleChanged = castleWas && castleNow && castleNow !== castleWas;
  const somethingChanged = weatherChanged || atmosphereChanged || castleChanged;

  const mutation =
    input.mutationFeedback ||
    buildWorldMutationFeedbackV0({ worldInstanceId: wi.instanceId, returning });
  const mutationChanged = Boolean(mutation.delta?.hasDelta || mutation.ledger.mutationGeneration > 0);
  const crossAnchor = readCrossSessionCoherenceAnchorV0(wi.instanceId);
  const crossLine =
    input.crossSessionCoherence?.coherenceLine ||
    describeCrossSessionCoherenceV0({
      anchor: crossAnchor,
      gapMs: lastEndMs > 0 ? Date.now() - lastEndMs : 0,
      hydrated: input.crossSessionCoherence?.hydrated
    });
  const entropyBudget = input.identityBinding
    ? readEntropyEconomyStateV0({
        selfSignature: input.identityBinding.selfSignature,
        sessionIdentity: input.identityBinding.sessionIdentity
      })
    : readPerceptualEntropyBudgetV0(wi.instanceId);

  const selfHint = input.identityBinding
    ? formatSelfSignatureHintV0(input.identityBinding.selfSignature)
    : null;

  /** Human layer (HEL) — built after technical continuity for return paths */
  let yesterday =
    lastEndMs > 0 && atmosphereWas
      ? `Son ziyaretin ${lastVisitHuman || "önce"} — o gün ${atmosphereWas}`
      : lastEndMs > 0
        ? `Son ziyaretin ${lastVisitHuman || "önce"} — dünya o ritimde kalmış olabilir.`
        : "İlk kez açılıyorsun; dün için iz yok — bugün iz bırakılacak.";

  let todayChanged;
  if (!returning) {
    todayChanged = atmosphereNow || "Dünya nabzı şimdi seninle birlikte ölçülüyor.";
  } else if (somethingChanged || mutationChanged) {
    const parts = [];
    if (weatherChanged) parts.push(`hava ${weatherWas} → ${weatherNow}`);
    if (castleChanged) parts.push(`Castle ${castleWas} → ${castleNow}`);
    if (atmosphereChanged && !weatherChanged) parts.push("atmosfer ritmi kaydı");
    if (crossLine && returning) parts.push(crossLine);
    if (mutation.returnDeltaLine && returning) parts.push(mutation.returnDeltaLine.replace(/^Geri döndüğünde /, ""));
    else if (mutation.recentActionLine) parts.push(mutation.recentActionLine);
    todayChanged = parts.length > 0 ? `Burada bir şey değişti: ${parts.join(" · ")}.` : mutation.returnDeltaLine || "Küçük farklar var.";
  } else {
    todayChanged = mutation.recentActionLine || "Ritim tanıdık — ama dünya durmadı; nefes almaya devam ediyor.";
  }

  const memoryEcho =
    returning && lastEndMs > 0
      ? `Sen yokken dünya aktı. Son ziyaret: ${lastVisitHuman || "önce"}.`
      : null;

  const humanLayer = buildLivingWorldEntryHumanLayerV0({
    returning,
    locale: wi.locale,
    timeZone: wi.timeZone,
    atmosphereLead: atmosphereNow,
    lastActionClosure: input.lastActionClosure,
    yesterdayTechnical: yesterday,
    todayTechnical: todayChanged
  });

  const continuityStrip = Object.freeze({
    yesterday: humanLayer.continuityHuman.yesterday,
    todayChanged: humanLayer.continuityHuman.todayChanged,
    whyHere: humanLayer.continuityHuman.whyHere,
    memoryEcho,
    orientationLead: humanLayer.continuityHuman.whyHere,
    mutationEcho: mutation.returnDeltaLine || mutation.recentActionLine,
    crossSessionEcho: crossLine
  });

  /** 2 — World State (read-only) */
  const spiralBridge = Boolean(input.spiralPerceptionBridge);
  const agreementEnabled = Boolean(input.spiralAgreementLayer);
  const agreement = deriveSpiralMMOAgreementLayerV0({
    worldInstanceId: wi.instanceId,
    selfSignature: input.identityBinding?.selfSignature,
    agreementLayerEnabled: agreementEnabled
  });

  let collectiveFeeling = deriveCollectivePresenceFeelingV0(wi.instanceId, {
    returning,
    somethingChanged
  });

  if (agreement.agreementLayer) {
    collectiveFeeling = mergeAgreementLayerIntoCollectiveFeelingV0(collectiveFeeling, agreement);
  } else {
    const perceptionField =
      agreement.perceptionField ||
      derivePassivePerceptionFieldV0({
        worldInstanceId: wi.instanceId,
        spiralBridgeEnabled: spiralBridge
      });
    collectiveFeeling = mergePerceptionFieldIntoCollectiveFeelingV0(collectiveFeeling, perceptionField);
  }

  const perceptionField =
    agreement.protoMesh != null
      ? agreement.perceptionField
      : agreement.perceptionField ||
        derivePassivePerceptionFieldV0({
          worldInstanceId: wi.instanceId,
          spiralBridgeEnabled: spiralBridge
        });

  const basePulse = frame?.castle?.metabolicPulse ?? 0.4;
  const presenceShift = applyMutationToCastlePresenceV0({
    basePulse,
    ledger: mutation.ledger
  });
  const effectivePulse = presenceShift.pulse01;

  const castlePresence = Object.freeze({
    mode: castleNow || "bekleniyor",
    pulse01: effectivePulse,
    ready: Boolean(frame?.castle?.surfaceReady),
    mutationBias: presenceShift.atmosphereBias,
    label:
      mutation.ledger.castleAffinity > 0.4
        ? "Castle senin izinle daha sıcak."
        : castleNow === "focus"
          ? "Castle odak bandında — yüzey hazır."
          : castleNow === "observe"
            ? "Castle dinleme modunda."
            : castleNow === "rest"
              ? "Castle sakin — hafif nabız."
              : returning
                ? "Castle nabzı tanıdık."
                : "Castle nefes alıyor — yaklaşabilirsin."
  });

  const worldInstanceView = Object.freeze({
    instanceId: wi.instanceId,
    timeZone: wi.timeZone || "UTC",
    locale: wi.locale || "und",
    echo: frame?.ribbon?.worldEcho || `${wi.timeZone} · ${wi.locale}`,
    weight: mutation.worldInstanceWeight
  });

  const worldState = Object.freeze({
    collectiveFeeling,
    castlePresence,
    worldInstance: worldInstanceView,
    mutationFeedback: Object.freeze({
      recentActionLine: mutation.recentActionLine,
      returnDeltaLine: mutation.returnDeltaLine,
      generation: mutation.ledger.mutationGeneration
    }),
    perceptionField: Object.freeze({
      phase: perceptionField?.resonancePhase ?? agreement.agreementPhase ?? "baseline",
      sharedState: false,
      bridge: agreement.agreementLayer
        ? "agreement_layer"
        : perceptionField?.spiralBridge?.mode ?? "closed"
    }),
    spiralAgreement: agreement.agreementLayer
      ? Object.freeze({
          phase: agreement.phase,
          meshPhase: agreement.agreementPhase,
          agreementLayer: true,
          sharedState: false
        })
      : null,
    driftCalibration: Object.freeze({
      entropyRemaining: entropyBudget.remaining,
      driftCapped: (entropyBudget.remaining ?? 1) < 0.15,
      fatigueTier: entropyBudget.fatigueTier ?? null,
      attention01: entropyBudget.attention01 ?? null
    })
  });

  const humanActions = humanLayer.actionCopy;
  const actionSurface = Object.freeze({
    observe: Object.freeze({
      id: "observe",
      label: humanActions.observe.label,
      hint: humanActions.observe.hint,
      meaning: humanActions.observe.meaning,
      href: "/academy/observe"
    }),
    enterCastle: Object.freeze({
      id: "enter_castle",
      label: humanActions.enterCastle.label,
      hint: humanActions.enterCastle.hint,
      meaning: humanActions.enterCastle.meaning,
      anchor: "#rhizoh-castle-presence"
    }),
    createCastle: Object.freeze({
      id: "create_castle",
      label: humanActions.createCastle.label,
      hint: humanActions.createCastle.hint,
      disabled: true,
      laterTrack: "spiral_mmo"
    })
  });

  return Object.freeze({
    schema: RHIZOH_LIVING_WORLD_ENTRY_SCHEMA_V0,
    screenMode: "living_world_entry_castle_first",
    returning,
    continuityStrip,
    worldState,
    actionSurface,
    humanLayer,
    mutationFeedback: mutation,
    crossSessionCoherence: Object.freeze({
      hasAnchor: Boolean(crossAnchor),
      line: crossLine
    }),
    identityBinding: input.identityBinding
      ? Object.freeze({
          selfHint,
          sessionIdentity: input.identityBinding.sessionIdentity
        })
      : null
  });
}
