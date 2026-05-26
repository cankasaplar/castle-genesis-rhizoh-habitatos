import React from "react";
import { RhizohLivingLoopRuntime } from "./RhizohLivingLoopRuntime.jsx";
import { RhizohAtmosphereRenderer } from "./RhizohAtmosphereRenderer.jsx";

/**
 * PR-2 / RLL-O — Composition root: living loop orchestrator + `RhizohAtmosphereRenderer` (debug UI, **DEV only**).
 * Import path sabit kaldı (`AppRhizoh528`).
 *
 * @param {{ onLivingFrame?: (frame: import("./rhizohLivingLoopOrchestratorV0.js").RhizohLivingLoopFrameV0) => void }} [props]
 */
export function RhizohAtmospherePresenceBridge({ onLivingFrame }) {
  return (
    <>
      <RhizohLivingLoopRuntime onFrame={onLivingFrame} />
      {import.meta.env.DEV ? <RhizohAtmosphereRenderer /> : null}
    </>
  );
}
