import React, { useEffect, useState } from "react";
import { getWeatherAtmosphereProvenanceV0 } from "./worldPresenceStoreV0.js";
import { getObservationEnvelopeForUiV0 } from "./atmosphereRuntimeSnapshotV0.js";
import { isCastleDebugGranularFlagEnabled } from "./castleDebugGateV0.js";

const ATM_DEBUG = isCastleDebugGranularFlagEnabled("VITE_RHIZOH_ATMOSPHERE_DEBUG");

/**
 * PR-2.5 — UI only: **envelope** (`lane` + `runtimeFrameId` + `provenance`) + `payload` içindeki türetilmiş alanlar.
 * Kimlik çıkarımı yalnızca `envelope.lane` meta verisinden; `payload` içi user/session SSOT değildir.
 */
export function RhizohAtmosphereRenderer() {
  const [debug, setDebug] = useState(
    /** @type {null | {
      lane: string;
      frameId: string;
      execMode: string;
      schema: number;
      weather: string;
      visibility: string;
      aura: string;
      metabolic: string;
      fog: string;
      source: string;
      ageSec: number;
      epoch: string;
    }} */ (null)
  );

  useEffect(() => {
    if (!ATM_DEBUG) return undefined;
    const id = window.setInterval(() => {
      const env = getObservationEnvelopeForUiV0();
      const pl = env && typeof env === "object" && env.payload && typeof env.payload === "object" ? env.payload : null;
      if (!pl || pl.state == null || pl.hints == null) {
        setDebug(null);
        return;
      }
      const state = pl.state;
      const hints = pl.hints;
      const amb = state.ambient && typeof state.ambient === "object" ? state.ambient : {};
      const atm = state.atmosphere && typeof state.atmosphere === "object" ? state.atmosphere : {};
      const prov = getWeatherAtmosphereProvenanceV0();
      const ageSec = prov.fetchedAt > 0 ? Math.max(0, Math.floor((Date.now() - prov.fetchedAt) / 1000)) : 0;
      const lane = typeof env.lane === "string" ? env.lane : "—";
      const frameId = typeof env.runtimeFrameId === "string" ? env.runtimeFrameId : "";
      const provEnv = env.provenance && typeof env.provenance === "object" ? env.provenance : {};
      const execMode = typeof provEnv.executionMode === "string" ? provEnv.executionMode : "—";
      const schema = typeof env.snapshotSchemaVersion === "number" ? env.snapshotSchemaVersion : 0;
      setDebug({
        lane,
        frameId,
        execMode,
        schema,
        weather: String(amb.weatherType ?? "—"),
        visibility: Number(atm.visibilityBudget ?? 0).toFixed(2),
        aura: Number(hints.castleAuraIntensity ?? 0).toFixed(2),
        metabolic: Number(hints.castleMetabolicPulse ?? 0).toFixed(2),
        fog: Number(hints.fogDensity ?? 0).toFixed(2),
        source: prov.source,
        ageSec,
        epoch: prov.epoch
      });
    }, 450);
    return () => window.clearInterval(id);
  }, []);

  if (!ATM_DEBUG || !debug) return null;
  return (
    <div
      className="pointer-events-none fixed bottom-2 left-2 z-[200] max-w-[14rem] rounded border border-white/15 bg-black/75 px-2 py-1 font-mono text-[8px] leading-snug normal-case text-white/85"
      data-observation-lane={debug.lane}
      data-observation-frame={debug.frameId}
      data-observation-schema={String(debug.schema)}
    >
      <div className="text-[7px] uppercase tracking-wide text-cyan-400/80">
        lane:{debug.lane} · {debug.execMode} · v{debug.schema}
      </div>
      <div className="truncate opacity-80" title={debug.frameId}>
        rf:{debug.frameId ? `${debug.frameId.slice(0, 18)}…` : "—"}
      </div>
      <div>ATM SOURCE: {debug.source}</div>
      <div>age: {debug.ageSec}s</div>
      <div>epoch: {debug.epoch}</div>
      <div>WEATHER: {debug.weather}</div>
      <div>VISIBILITY: {debug.visibility}</div>
      <div>AURA: {debug.aura}</div>
      <div>METABOLIC: {debug.metabolic}</div>
      <div>FOG: {debug.fog}</div>
    </div>
  );
}
