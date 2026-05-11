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

/**
 * Analytics / ads script or stylesheet failed to load (ad blocker, offline, embedded browser).
 * Still fires window "error" — not an application bug; do not trip CASTLE_FATAL.
 */
function benignScriptOrLinkResourceUrl(event) {
  const t = event?.target;
  if (!t || (t.tagName !== "SCRIPT" && t.tagName !== "LINK")) return "";
  return String(t.src || t.href || "");
}

function isBenignExternalResourceError(event) {
  const url = benignScriptOrLinkResourceUrl(event);
  const fromUrl =
    url &&
    /googletagmanager\.com|google-analytics\.com|doubleclick\.net|googlesyndication\.com/i.test(url);
  if (fromUrl) return true;
  const fn = String(event?.filename || "");
  if (/googletagmanager\.com|google-analytics\.com|doubleclick\.net/i.test(fn)) return true;
  return false;
}

function shouldIgnoreFatal(errOrMsg, extra = {}) {
  const msg = errOrMsg instanceof Error ? String(errOrMsg.message || "") : String(errOrMsg || "");
  const stack = errOrMsg instanceof Error ? String(errOrMsg.stack || "") : "";
  const combined = `${msg}\n${stack}\n${String(extra?.filename || "")}`.toLowerCase();
  // Browser extensions (not app code) can emit global errors/rejections on any page.
  // These should not trip Castle fatal banner.
  if (combined.includes("chrome-extension://")) return true;
  if (combined.includes("failed to connect to metamask")) return true;
  if (combined.includes("metamask")) return true;
  if (combined.includes("googletagmanager.com")) return true;
  if (combined.includes("google-analytics.com")) return true;
  return false;
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
      if (isBenignExternalResourceError(event)) return;
      const resourceHint = benignScriptOrLinkResourceUrl(event) || event.filename || "";
      const err = event.error;
      if (
        shouldIgnoreFatal(err || event.message || "error_event", {
          filename: resourceHint || event.filename
        })
      ) {
        return;
      }
      reportCastleFatal(
        "window_error",
        err || event.message || "error_event",
        {
          filename: event.filename,
          resourceUrl: resourceHint || undefined,
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
    if (shouldIgnoreFatal(err)) {
      try {
        event.preventDefault?.();
      } catch {
        /* noop */
      }
      return;
    }
    reportCastleFatal("unhandled_rejection", err, { reasonType: typeof r });
  });
}

export function installCastleBootLogFlow() {
  if (window.__CASTLE_BOOT_LOG__) return window.__CASTLE_BOOT_LOG__;
  const startedAt = Date.now();
  const timeline = [];
  const stamp = (phase, level = "info", detail = "") => {
    const at = Date.now();
    const dt = at - startedAt;
    const row = { at, dt, phase: String(phase || "phase"), level, detail: String(detail || "") };
    timeline.push(row);
    const icon = level === "ok" ? "✅" : level === "warn" ? "⚠️" : level === "error" ? "🛑" : "🚀";
    const line = `[CASTLE_BOOT] ${icon} +${dt}ms · ${row.phase}${row.detail ? ` · ${row.detail}` : ""}`;
    if (level === "warn") console.warn(line);
    else if (level === "error") console.error(line);
    else console.info(line);
    return row;
  };
  const api = {
    start: (phase, detail = "") => stamp(phase, "info", detail),
    ok: (phase, detail = "") => stamp(phase, "ok", detail),
    warn: (phase, detail = "") => stamp(phase, "warn", detail),
    fail: (phase, detail = "") => stamp(phase, "error", detail),
    timeline: () => timeline.slice(),
    print: () => {
      try {
        console.table(
          timeline.map((r) => ({
            t_ms: r.dt,
            phase: r.phase,
            level: r.level,
            detail: r.detail
          }))
        );
      } catch {
        /* noop */
      }
      return timeline.slice();
    }
  };
  window.__CASTLE_BOOT_LOG__ = api;
  stamp("boot.log.install", "ok", "Rhizoh launch timeline active");
  return api;
}
