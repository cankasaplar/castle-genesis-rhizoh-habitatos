import React from "react";
import ReactDOM from "react-dom/client";
import App from "./AppRhizoh528.jsx";
import { initFirebaseAnalyticsWhenReady } from "./firebase/castleFirebase.js";
import { installGlobalCrashTelemetry, reportCastleFatal } from "./boot/castleCrashTelemetry.js";
import "../../../src/index.css";

installGlobalCrashTelemetry();
initFirebaseAnalyticsWhenReady();

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

ReactDOM.createRoot(document.getElementById("app")).render(
  <RootErrorBoundary>
    <App />
  </RootErrorBoundary>
);
