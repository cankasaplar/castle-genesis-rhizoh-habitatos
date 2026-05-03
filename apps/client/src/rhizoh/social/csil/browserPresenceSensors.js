/**
 * Tarayıcı presence sensörleri — mikrofon, sekme odağı, işaretçi kinetiği.
 * Gizlilik: koordinatlar saklanmaz; yalnızca anlık hız / eşik bayrakları.
 */

/** @returns {Record<string, unknown>} */
export function createBrowserPresenceSignalRef() {
  return {
    micActive: false,
    tabFocused: typeof document !== "undefined" ? document.visibilityState === "visible" : true,
    windowFocused: typeof document !== "undefined" ? document.hasFocus() : true,
    pointerVelocity: 0,
    pointerBurst: false,
    lastPointerAt: 0,
    lastSampleAt: 0
  };
}

/**
 * @param {Record<string, unknown>} targetRef
 * @returns {() => void} detach
 */
export function attachBrowserPresenceSensors(targetRef) {
  if (typeof window === "undefined" || typeof document === "undefined") {
    return () => {};
  }

  let lastX = 0;
  let lastY = 0;
  let lastT = performance.now();

  const onMove = (e) => {
    const t = performance.now();
    const dt = Math.max(1, t - lastT);
    const dist = Math.hypot(e.clientX - lastX, e.clientY - lastY);
    const v = dist / dt;
    targetRef.pointerVelocity = v;
    targetRef.pointerBurst = v > 2.2;
    targetRef.lastPointerAt = Date.now();
    lastX = e.clientX;
    lastY = e.clientY;
    lastT = t;
    targetRef.lastSampleAt = Date.now();
  };

  const onVis = () => {
    targetRef.tabFocused = document.visibilityState === "visible";
    targetRef.lastSampleAt = Date.now();
  };

  const onWinFocus = () => {
    targetRef.windowFocused = true;
    targetRef.lastSampleAt = Date.now();
  };
  const onWinBlur = () => {
    targetRef.windowFocused = false;
    targetRef.lastSampleAt = Date.now();
  };

  window.addEventListener("pointermove", onMove, { passive: true });
  document.addEventListener("visibilitychange", onVis);
  window.addEventListener("focus", onWinFocus);
  window.addEventListener("blur", onWinBlur);

  targetRef.tabFocused = document.visibilityState === "visible";
  targetRef.windowFocused = document.hasFocus();

  return () => {
    window.removeEventListener("pointermove", onMove);
    document.removeEventListener("visibilitychange", onVis);
    window.removeEventListener("focus", onWinFocus);
    window.removeEventListener("blur", onWinBlur);
  };
}

/**
 * @param {Record<string, unknown> | null | undefined} ref
 */
export function snapshotBrowserPresenceForCsil(ref) {
  const r = ref && typeof ref === "object" ? ref : createBrowserPresenceSignalRef();
  const v = Number(r.pointerVelocity) || 0;
  const burst = !!r.pointerBurst;
  const recentPointer = r.lastPointerAt && Date.now() - r.lastPointerAt < 2800;
  const cursorActivity = burst || v > 0.65 || (recentPointer && v > 0.08);
  const micActive = !!r.micActive;
  const tabFocused = r.tabFocused !== false;
  const windowFocused = r.windowFocused !== false;

  let voiceActivity = false;
  if (micActive && tabFocused && windowFocused) voiceActivity = true;

  /** @type {Record<string, unknown> | null} */
  const sensorEvent =
    !tabFocused || !windowFocused
      ? { kind: "browser", tabFocused: false, windowFocused }
      : v > 1.2
        ? { kind: "browser", pointerVelocity: Math.round(v * 1000) / 1000 }
        : null;

  return {
    micActive,
    voiceActivity,
    cursorActivity,
    sensorEvent,
    tabFocused,
    windowFocused,
    pointerVelocity: Math.round(v * 1000) / 1000
  };
}
