import { useEffect, useRef, useState } from "react";

/**
 * @param {Record<string, unknown> | null | undefined} latestDiagnostics
 * @param {number} [intervalMs] — ~2–4 Hz (default 320ms)
 */
export function useL10SlowTruthSnapshot(latestDiagnostics, intervalMs = 320) {
  const r = useRef(latestDiagnostics);
  r.current = latestDiagnostics;
  const [slow, setSlow] = useState(() => latestDiagnostics);

  useEffect(() => {
    setSlow(r.current);
  }, []);

  useEffect(() => {
    const id = window.setInterval(() => setSlow(r.current), intervalMs);
    return () => window.clearInterval(id);
  }, [intervalMs]);

  return slow;
}
