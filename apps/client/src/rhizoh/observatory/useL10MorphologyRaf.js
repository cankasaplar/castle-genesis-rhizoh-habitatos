import { useEffect, useRef } from "react";
import { computeMorphologyTargets } from "./l10MorphologyTargets.js";
import {
  applyMorphologyCssVars,
  lerpMorphologyToward,
  snapMorphologyToTarget
} from "./l10MorphologyLerp.js";

/**
 * rAF loop: lerp morphology toward targets(slowDiagnostics), write CSS vars on morphRootRef (no React setState).
 *
 * @param {Record<string, unknown> | null | undefined} slowDiagnostics
 * @param {React.RefObject<HTMLElement | null>} morphRootRef
 * @param {React.MutableRefObject<unknown>} morphRef — runtime from createMorphologyRuntimeState()
 */
export function useL10MorphologyRaf(slowDiagnostics, morphRootRef, morphRef) {
  const slowRef = useRef(slowDiagnostics);
  slowRef.current = slowDiagnostics;
  const boot = useRef(false);

  useEffect(() => {
    let frame = 0;
    const loop = () => {
      const targets = computeMorphologyTargets(slowRef.current);
      if (!boot.current) {
        snapMorphologyToTarget(morphRef.current, targets);
        boot.current = true;
      } else {
        lerpMorphologyToward(morphRef.current, targets);
      }
      applyMorphologyCssVars(morphRootRef.current, morphRef.current);
      frame = requestAnimationFrame(loop);
    };
    frame = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(frame);
  }, [morphRootRef, morphRef]);
}
