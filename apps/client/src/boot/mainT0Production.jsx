import React from "react";
import { initFirebaseAnalyticsWhenReady } from "./firebase/castleFirebase.js";
import { getCookieConsentV0 } from "./rhizoh/ingress/ingress_router.js";
import {
  installCastleBootLogFlow,
  installGlobalCrashTelemetry,
  reportCastleFatal
} from "./boot/castleCrashTelemetry.js";
import { mountCastleApplicationT0V0 } from "./boot/mountCastleApplicationT0V0.jsx";
import "../../../src/index.css";

const bootLog = installCastleBootLogFlow();
bootLog.start("boot.entry", "main.jsx loaded");
installGlobalCrashTelemetry();
bootLog.ok("boot.crash_telemetry", "global error + rejection hooks installed");

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
        </div>
      );
    }
    return this.props.children;
  }
}

const appEl = document.getElementById("app");
void mountCastleApplicationT0V0({ appEl, RootErrorBoundary, bootLog });
