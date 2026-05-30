import { useEffect, useRef } from "react";
import { createGlobalSocialCoherenceLiveTickerV0 } from "./globalSocialCoherenceLiveTickV0.js";

/**
 * Interval-driven global coherence: `getCastleSlices` → reducer → kernel. Runs in the browser main thread.
 *
 * @param {{
 *   enabled: boolean,
 *   tickMs?: number,
 *   getCastleSlices: () => unknown[],
 *   getKernelInput: () => (Record<string, unknown> | null | undefined),
 *   onTick?: (out: Record<string, unknown>) => void
 * }} opts
 */
export function useGlobalSocialCoherenceLiveTickV0(opts) {
  const enabled = !!opts?.enabled;
  const tickMs = Math.max(200, Math.floor(Number(opts?.tickMs) || 2000));

  const getCastleSlicesRef = useRef(opts.getCastleSlices);
  getCastleSlicesRef.current = opts.getCastleSlices;
  const getKernelInputRef = useRef(opts.getKernelInput);
  getKernelInputRef.current = opts.getKernelInput;
  const onTickRef = useRef(opts.onTick);
  onTickRef.current = opts.onTick;

  useEffect(() => {
    if (!enabled) return undefined;
    const t = createGlobalSocialCoherenceLiveTickerV0({
      tickMs,
      getCastleSlices: () => getCastleSlicesRef.current?.() ?? [],
      getKernelInput: () => getKernelInputRef.current?.(),
      onTick: (o) => onTickRef.current?.(o)
    });
    t.start();
    return () => t.dispose();
  }, [enabled, tickMs]);
}
