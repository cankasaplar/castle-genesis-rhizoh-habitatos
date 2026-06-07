/**
 * Cesium host layout gate — never init / register ready while client size is 0 or strip-thin.
 */

export const CESIUM_HOST_MIN_WIDTH_V0 = 48;
/** @deprecated use resolveCesiumHostMinHeightV0 */
export const CESIUM_HOST_MIN_SIZE_V0 = 48;

/**
 * Viewport-aware minimum height — 48px strips pass the old gate but break Cesium PVS.
 * @returns {number}
 */
export function resolveCesiumHostMinHeightV0() {
  if (typeof window === "undefined") return 280;
  return Math.max(280, Math.floor(window.innerHeight * 0.35));
}

/**
 * @param {HTMLElement | null | undefined} el
 * @param {{ minWidth?: number, minHeight?: number }} [opts]
 * @returns {boolean}
 */
export function isCesiumHostLayoutReadyV0(el, opts = {}) {
  if (!el) return false;
  const minW = Number(opts.minWidth) || CESIUM_HOST_MIN_WIDTH_V0;
  const minH = Number(opts.minHeight) || resolveCesiumHostMinHeightV0();
  return el.clientWidth >= minW && el.clientHeight >= minH;
}

/**
 * @param {HTMLElement | null | undefined} host
 * @param {{ minWidth?: number, minHeight?: number }} [opts]
 * @returns {{ hostW: number, hostH: number, canvasW: number, canvasH: number, minH: number, ready: boolean }}
 */
export function measureCesiumHostLayoutV0(host, opts = {}) {
  const canvas = host?.querySelector?.("canvas") ?? null;
  const hostW = host?.clientWidth ?? 0;
  const hostH = host?.clientHeight ?? 0;
  const canvasW = canvas?.clientWidth ?? 0;
  const canvasH = canvas?.clientHeight ?? 0;
  const minW = Number(opts.minWidth) || CESIUM_HOST_MIN_WIDTH_V0;
  const minH = Number(opts.minHeight) || resolveCesiumHostMinHeightV0();
  const ready =
    hostW >= minW &&
    hostH >= minH &&
    (!canvas || (canvasW >= minW && canvasH >= minH));
  return { hostW, hostH, canvasW, canvasH, minH, ready };
}

/**
 * @param {HTMLElement} el
 * @param {{ minSize?: number, timeoutMs?: number }} [opts]
 * @returns {Promise<boolean>}
 */
export function waitForCesiumHostLayoutV0(el, opts = {}) {
  const minWidth = opts.minWidth ?? CESIUM_HOST_MIN_WIDTH_V0;
  const minHeight = opts.minHeight ?? resolveCesiumHostMinHeightV0();
  const timeoutMs = opts.timeoutMs ?? 12_000;
  if (!el) return Promise.resolve(false);
  if (isCesiumHostLayoutReadyV0(el, { minWidth, minHeight })) return Promise.resolve(true);

  return new Promise((resolve) => {
    const t0 = performance.now();
    let ro = null;
    let settled = false;
    const ready = () => isCesiumHostLayoutReadyV0(el, { minWidth, minHeight });

    const finish = (ok) => {
      if (settled) return;
      settled = true;
      try {
        ro?.disconnect();
      } catch {
        /* noop */
      }
      resolve(ok);
    };

    const tick = () => {
      if (ready()) {
        finish(true);
        return;
      }
      if (performance.now() - t0 >= timeoutMs) {
        finish(false);
        return;
      }
      requestAnimationFrame(tick);
    };

    try {
      ro = new ResizeObserver(() => {
        if (ready()) finish(true);
      });
      ro.observe(el);
    } catch {
      /* ResizeObserver unavailable — rAF poll only */
    }

    tick();
  });
}

/**
 * @param {object | null | undefined} viewer
 * @param {HTMLElement | null | undefined} host
 * @returns {boolean}
 */
export function resizeCesiumViewerToHostV0(viewer, host) {
  if (!viewer || viewer.isDestroyed?.() || !host) return false;
  try {
    viewer.resize();
    viewer.scene?.requestRender?.();
    return isCesiumHostLayoutReadyV0(host);
  } catch {
    return false;
  }
}

/**
 * @param {HTMLElement} host
 * @param {(entry: ResizeObserverEntry) => void} onSized
 * @returns {() => void}
 */
export function observeCesiumHostLayoutV0(host, onSized) {
  if (!host || typeof onSized !== "function") return () => {};
  let ro = null;
  try {
    ro = new ResizeObserver((entries) => {
      for (const entry of entries) onSized(entry);
    });
    ro.observe(host);
  } catch {
    /* noop */
  }
  return () => {
    try {
      ro?.disconnect();
    } catch {
      /* noop */
    }
  };
}
