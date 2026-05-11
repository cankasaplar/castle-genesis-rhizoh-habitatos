import React from "react";
import ReactDOM from "react-dom/client";
import { CastleShellRouter } from "./shell/CastleShellRouter.jsx";
import { initFirebaseAnalyticsWhenReady } from "./firebase/castleFirebase.js";
import {
  installCastleBootLogFlow,
  installGlobalCrashTelemetry,
  reportCastleFatal
} from "./boot/castleCrashTelemetry.js";
import "../../../src/index.css";

const bootLog = installCastleBootLogFlow();
bootLog.start("boot.entry", "main.jsx loaded");
installGlobalCrashTelemetry();
bootLog.ok("boot.crash_telemetry", "global error + rejection hooks installed");
initFirebaseAnalyticsWhenReady();
bootLog.ok("boot.firebase_analytics", "analytics init requested");

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
            Konsol: <code>[CASTLE_FATAL]</code> · <code>window.__CASTLE_LAST_FATAL__</code>
          </p>
        </div>
      );
    }
    return this.props.children;
  }
}

const appEl = document.getElementById("app");
let reactRoot = window.__CASTLE_REACT_ROOT__;
if (!reactRoot) {
  reactRoot = ReactDOM.createRoot(appEl);
  window.__CASTLE_REACT_ROOT__ = reactRoot;
}
reactRoot.render(
  <RootErrorBoundary>
    <CastleShellRouter />
  </RootErrorBoundary>
);
bootLog.ok("boot.react_mount", "root rendered; Rhizoh shell routing live");

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
