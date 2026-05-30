import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  SOVEREIGN_ANCHOR_BARCELONA_V0,
  SOVEREIGN_DEFAULT_ANCHOR_KADIKOY_V0,
  SOVEREIGN_NODE_STATE_V0,
  SOVEREIGN_ONBOARDING_STEP_V0
} from "../../runtime/sovereign/sovereignNodeOnboardingContractV0.js";
import { getSovereignCesiumPickFacadeV0 } from "../../runtime/sovereign/cesiumSovereignGeographicPickV0.js";
import {
  deriveSovereignNodePreviewV0,
  getEphemeralGeographicAnchorV0,
  getSovereignNodeSealPreviewV0,
  getSovereignOnboardingStepV0,
  isSovereignNodeOnboardingEnabledV0,
  setEphemeralGeographicAnchorV0,
  startSovereignNodeWizardV0
} from "../../runtime/sovereign/sovereignNodeOnboardingWizardV0.js";

const STEP_LABELS = {
  [SOVEREIGN_ONBOARDING_STEP_V0.WORLD_ENTRY]: "Kalen",
  [SOVEREIGN_ONBOARDING_STEP_V0.GEOGRAPHIC_ANCHOR]: "Konum",
  [SOVEREIGN_ONBOARDING_STEP_V0.EPISTEMIC_DERIVATION]: "Hazırlık",
  [SOVEREIGN_ONBOARDING_STEP_V0.SEAL_PREVIEW]: "Önizleme",
  [SOVEREIGN_ONBOARDING_STEP_V0.SOFT_ACTIVATION]: "Mühür",
  [SOVEREIGN_ONBOARDING_STEP_V0.EVENT_PLANE_ENTRY]: "Tamam"
};

/**
 * Friend-first sovereign onboarding — dynamic WGS84 pick on Cesium globe.
 */
export function SovereignNodeOnboardingWizard({ onComplete, onDismiss }) {
  const enabled = isSovereignNodeOnboardingEnabledV0();
  const [step, setStep] = useState(SOVEREIGN_ONBOARDING_STEP_V0.WORLD_ENTRY);
  const [anchor, setAnchor] = useState(null);
  const [preview, setPreview] = useState(null);
  const [busy, setBusy] = useState(false);
  const [confirmed, setConfirmed] = useState(/** @type {object | null} */ (null));

  const cesiumPick = useMemo(() => getSovereignCesiumPickFacadeV0(), [enabled]);

  const wizardApi = useMemo(() => {
    if (!enabled) return null;
    return startSovereignNodeWizardV0(cesiumPick, null);
  }, [enabled, cesiumPick]);

  useEffect(() => {
    if (!wizardApi) return undefined;
    return () => wizardApi.teardown();
  }, [wizardApi]);

  const syncFromWizard = useCallback(() => {
    setStep(getSovereignOnboardingStepV0());
    setAnchor(getEphemeralGeographicAnchorV0());
    setPreview(getSovereignNodeSealPreviewV0());
  }, []);

  const pickAnchor = useCallback(
    async (coords) => {
      setEphemeralGeographicAnchorV0(coords);
      syncFromWizard();
      setBusy(true);
      try {
        const p = await deriveSovereignNodePreviewV0(getEphemeralGeographicAnchorV0() || coords);
        setPreview(p);
        syncFromWizard();
      } finally {
        setBusy(false);
      }
    },
    [syncFromWizard]
  );

  useEffect(() => {
    if (!wizardApi || !cesiumPick) return undefined;
    cesiumPick.setInteractionMode?.(SOVEREIGN_NODE_STATE_V0.OBSERVATION_ONLY);
    const off = cesiumPick.on("click", (ev) => {
      void pickAnchor({
        lat: ev.lat,
        lon: ev.lon,
        label: ev.label,
        zoom: 14
      });
    });
    return () => off?.();
  }, [wizardApi, cesiumPick, pickAnchor]);

  const confirm = useCallback(async () => {
    if (!wizardApi) return;
    setBusy(true);
    try {
      const node = await wizardApi.confirmNode();
      setConfirmed(node);
      syncFromWizard();
      onComplete?.(node);
    } finally {
      setBusy(false);
    }
  }, [wizardApi, onComplete, syncFromWizard]);

  if (!enabled) return null;

  const placeLabel = preview?.anchor?.label
    ? String(preview.anchor.label)
    : anchor?.label
      ? String(anchor.label)
      : null;

  const coordsLine =
    preview?.anchor || anchor
      ? `${(preview?.anchor || anchor).lat.toFixed(4)}, ${(preview?.anchor || anchor).lon.toFixed(4)}`
      : null;

  return (
    <div
      className="pointer-events-auto fixed inset-0 z-[210] flex items-end justify-center sm:items-center bg-black/50 p-4"
      role="dialog"
      aria-label="Castle Genesis — kalen"
    >
      <div className="max-w-md w-full rounded-xl border border-emerald-500/30 bg-zinc-950/95 p-5 font-sans text-sm text-emerald-50/90 shadow-xl pointer-events-auto">
        <div className="mb-2 text-[10px] uppercase tracking-widest text-emerald-400/90 font-mono">
          Castle Genesis
        </div>
        <h2 className="mb-2 text-lg font-medium text-emerald-50 normal-case">Dünyada kalen nerede?</h2>

        <p className="mb-4 text-zinc-300/90 leading-relaxed normal-case text-[13px]">
          Küreyi kaydır — evini, mahalleni veya bulunduğun şehri seçmek için haritaya bir kez
          dokun. İstersen aşağıdaki kısayollar da var.
        </p>

        <div className="mb-3 rounded-lg border border-zinc-700/50 bg-black/30 px-3 py-2 text-[12px] text-zinc-400 normal-case">
          Haritaya tıkla → konum algılanır → <span className="text-emerald-300">Kaleni mühürle</span>
        </div>

        <div className="mb-3 text-[10px] text-zinc-500 font-mono">{STEP_LABELS[step] || step}</div>

        <div className="mb-4 flex flex-wrap gap-2">
          <button
            type="button"
            disabled={busy}
            className="rounded-lg border border-zinc-600/80 px-3 py-1.5 text-[12px] text-zinc-400 hover:bg-zinc-800 disabled:opacity-40"
            onClick={() => void pickAnchor({ ...SOVEREIGN_DEFAULT_ANCHOR_KADIKOY_V0 })}
          >
            Kadıköy
          </button>
          <button
            type="button"
            disabled={busy}
            className="rounded-lg border border-zinc-600/80 px-3 py-1.5 text-[12px] text-zinc-400 hover:bg-zinc-800 disabled:opacity-40"
            onClick={() => void pickAnchor({ ...SOVEREIGN_ANCHOR_BARCELONA_V0 })}
          >
            Barcelona
          </button>
        </div>

        {preview ? (
          <div className="mb-4 rounded-lg border border-amber-500/30 bg-amber-950/25 px-3 py-3 normal-case">
            <div className="text-amber-100 font-medium">{placeLabel || "Seçilen konum"}</div>
            {coordsLine ? (
              <div className="mt-1 font-mono text-[11px] text-amber-300/70">{coordsLine}</div>
            ) : null}
            {preview.nodeId ? (
              <div className="mt-1 font-mono text-[10px] text-amber-400/50">{preview.nodeId}</div>
            ) : null}
            <div className="mt-2 text-[12px] text-amber-300/60">
              Mühürleyince bu koordinata özel imzan belirir.
            </div>
          </div>
        ) : null}

        {confirmed ? (
          <div className="mb-3 text-emerald-300/90 normal-case text-[13px]">Tamam — kutlama ekranı geliyor…</div>
        ) : null}

        <div className="flex flex-wrap gap-2">
          {preview && !confirmed ? (
            <button
              type="button"
              disabled={busy}
              className="rounded-lg bg-emerald-500 px-5 py-2.5 font-medium text-black hover:bg-emerald-400 disabled:opacity-40"
              onClick={() => void confirm()}
            >
              Kaleni mühürle
            </button>
          ) : null}
          <button
            type="button"
            className="rounded-lg border border-zinc-600 px-4 py-2 text-zinc-400 hover:bg-zinc-800"
            onClick={onDismiss}
          >
            Sonra
          </button>
        </div>
      </div>
    </div>
  );
}

