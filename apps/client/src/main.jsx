import React from "react";
import ReactDOM from "react-dom/client";
import { initFirebaseAnalyticsWhenReady } from "./firebase/castleFirebase.js";
import { getCookieConsentV0 } from "./rhizoh/ingress/ingress_router.js";
import {
  installCastleBootLogFlow,
  installGlobalCrashTelemetry,
  reportCastleFatal
} from "./boot/castleCrashTelemetry.js";
import { initRuntimeFrameOnce } from "./rhizoh/runtime/runtimeFrameCorrelationV0.js";
import { buildRuntimeSnapshotV1, persistRuntimeSnapshotV1 } from "./rhizoh/runtime/runtimeSnapshotV1.js";
import { resolveActiveRuntimeIdentity } from "./rhizoh/runtime/runtimeIdentityMergePolicyV0.js";
import "../../../src/index.css";

const bootLog = installCastleBootLogFlow();
bootLog.start("boot.entry", "main.jsx loaded");
installGlobalCrashTelemetry();
bootLog.ok("boot.crash_telemetry", "global error + rejection hooks installed");
initRuntimeFrameOnce();
bootLog.ok("boot.runtime_frame", "runtimeFrameId bound (castle.last_frame.v1)");
try {
  if (typeof window !== "undefined" && import.meta.env.DEV) {
    window.__CASTLE_BUILD_RUNTIME_SNAPSHOT__ = () => buildRuntimeSnapshotV1();
    window.__CASTLE_PERSIST_RUNTIME_SNAPSHOT__ = () => persistRuntimeSnapshotV1();
    window.__CASTLE_RESOLVE_RUNTIME_IDENTITY__ = (opts) => resolveActiveRuntimeIdentity(opts && typeof opts === "object" ? opts : {});
    bootLog.ok("boot.runtime_snapshot", "DevTools: __CASTLE_BUILD_RUNTIME_SNAPSHOT__()");
  }
} catch {
  /* noop */
}
if (!import.meta.env.DEV) {
  bootLog.ok("boot.runtime_snapshot", "prod: snapshot DevTools globals omitted");
}
if (getCookieConsentV0().analytics) {
  initFirebaseAnalyticsWhenReady();
  bootLog.ok("boot.firebase_analytics", "analytics init requested");
} else {
  bootLog.ok("boot.firebase_analytics", "skipped — cookie consent analytics off");
}

class RootErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(err) {
    return { error: err };
  }

  componentDidCatch(err, info) {
    reportCastleFatal("react_error_boundary", err, {
      componentStack: String(info?.componentStack || "")
    });
  }

  render() {
    const { error } = this.state;
    if (error) {
      return (
        <div
          style={{
            padding: 24,
            minHeight: "100vh",
            boxSizing: "border-box",
            background: "#140505",
            color: "#fecaca",
            fontFamily: "system-ui, sans-serif"
          }}
        >
          <h1 style={{ fontSize: 18, margin: "0 0 12px" }}>Castle arayüz hatası</h1>
          <pre style={{ fontSize: 13, whiteSpace: "pre-wrap", margin: 0 }}>{String(error?.message || error)}</pre>
          <pre style={{ fontSize: 11, opacity: 0.85, whiteSpace: "pre-wrap", marginTop: 12 }}>
            {String(error?.stack || "")}
          </pre>
          <p style={{ fontSize: 13, marginTop: 16 }}>
            Konsol: <code>[CASTLE_FATAL]</code> · <code>window.__CASTLE_LAST_FATAL__</code> · yenileme sonrası{" "}
            <code>sessionStorage castle.last_fatal.v1</code>
          </p>
        </div>
      );
    }
    return this.props.children;
  }
}

import { mountCastleApplicationV0 } from "./boot/mountCastleApplicationV0.jsx";

const appEl = document.getElementById("app");
void mountCastleApplicationV0({ appEl, RootErrorBoundary, bootLog }).then((mount) => {
  if (mount.quarantine) {
    bootLog.ok("boot.react_mount", "quarantine shell rendered (ontological gate)");
  } else {
    bootLog.ok("boot.react_mount", "root rendered; Rhizoh shell routing live");
  }
});

if (import.meta.env?.VITE_RCIL_LIVE_WIRING === "1") {
  /** @type {Promise<typeof window.__RCIL_LIVE_WIRING__>} Yükleme bitene kadar `__RCIL_LIVE_WIRING__` yoktur — önce bunu await edin. */
  window.__RCIL_LIVE_WIRING_READY__ = import("./rhizoh/runtime/rcilLiveWiringV1.js")
    .then((m) => {
      m.installRcilLiveWiringBootHook?.();
      bootLog.ok("boot.rcil_wiring", "RCIL live wiring dev hook (__RCIL_LIVE_WIRING__)");
      return window.__RCIL_LIVE_WIRING__;
    })
    .catch((e) => {
      bootLog.fail?.("boot.rcil_wiring", String(e?.message || e));
      throw e;
    });
}
