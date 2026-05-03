/**
 * Boş konsol senaryosu: WebGL context lost, yakalanmayan promise, capture-phase kaçan hatalar.
 * window.__CASTLE_LAST_FATAL__ + ekranda sabit banner + [CASTLE_FATAL] console.error
 */

function ensureFatalBanner() {
  let el = document.getElementById("castle-crash-banner");
  if (el) return el;
  el = document.createElement("div");
  el.id = "castle-crash-banner";
  el.setAttribute("role", "alert");
  Object.assign(el.style, {
    position: "fixed",
    left: "8px",
    right: "8px",
    bottom: "8px",
    zIndex: "2147483646",
    maxHeight: "42vh",
    overflow: "auto",
    padding: "12px 14px",
    fontFamily: "ui-monospace, Consolas, monospace",
    fontSize: "12px",
    lineHeight: "1.45",
    color: "#fecaca",
    background: "rgba(40, 6, 6, 0.94)",
    border: "1px solid rgba(248, 113, 113, 0.6)",
    borderRadius: "10px",
    whiteSpace: "pre-wrap",
    wordBreak: "break-word",
    display: "none",
    boxShadow: "0 8px 32px rgba(0,0,0,0.5)"
  });
  document.body.appendChild(el);
  return el;
}

export function reportCastleFatal(kind, errOrMsg, extra = {}) {
  const message =
    errOrMsg instanceof Error ? errOrMsg.message : String(errOrMsg == null ? "" : errOrMsg);
  const stack = errOrMsg instanceof Error ? String(errOrMsg.stack || "") : "";
  const payload = {
    at: Date.now(),
    kind,
    message,
    stack,
    ...extra
  };
  try {
    window.__CASTLE_LAST_FATAL__ = payload;
  } catch {
    /* noop */
  }

  const line = `[CASTLE_FATAL] ${kind}\n${message}${stack ? `\n${stack}` : ""}`;
  try {
    console.error(line, extra);
  } catch {
    /* noop */
  }

  try {
    const b = ensureFatalBanner();
    b.style.display = "block";
    b.textContent = `${line}\n\nDevTools: konsolda "Varsayılan seviyeler" açık olsun, "Preserve log" işaretli olsun.\nTek satır kopyala: window.__CASTLE_LAST_FATAL__`;
  } catch {
    /* noop */
  }
}

export function installWebglContextLostReporter(domElement, label = "unknown") {
  if (!domElement?.addEventListener) return;
  domElement.addEventListener(
    "webglcontextlost",
    (e) => {
      try {
        e.preventDefault();
      } catch {
        /* noop */
      }
      reportCastleFatal("webgl_context_lost", `WebGL context lost (${label})`, { label });
    },
    false
  );
  domElement.addEventListener(
    "webglcontextrestored",
    () => {
      try {
        console.warn("[CASTLE] WebGL context restored:", label);
      } catch {
        /* noop */
      }
    },
    false
  );
}

export function installGlobalCrashTelemetry() {
  if (window.__CASTLE_CRASH_TELEMETRY__) return;
  window.__CASTLE_CRASH_TELEMETRY__ = true;

  window.addEventListener(
    "error",
    (event) => {
      const err = event.error;
      reportCastleFatal(
        "window_error",
        err || event.message || "error_event",
        {
          filename: event.filename,
          lineno: event.lineno,
          colno: event.colno,
          message: event.message
        }
      );
    },
    true
  );

  window.addEventListener("unhandledrejection", (event) => {
    const r = event.reason;
    const err =
      r instanceof Error
        ? r
        : new Error(typeof r === "object" && r !== null ? String(r) : String(r));
    reportCastleFatal("unhandled_rejection", err, { reasonType: typeof r });
  });
}
