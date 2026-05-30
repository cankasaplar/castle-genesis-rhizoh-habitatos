import React from "react";
import { isCastleBenignDomErrorV0, reportCastleFatal } from "./castleCrashTelemetry.js";

/**
 * Root React error boundary — extension DOM noise recovers; real app errors surface.
 */
export class CastleRootErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { error: null, recoverKey: 0 };
  }

  static getDerivedStateFromError(err) {
    if (isCastleBenignDomErrorV0(err)) {
      return { error: null };
    }
    return { error: err };
  }

  componentDidCatch(err, info) {
    const extra = { componentStack: String(info?.componentStack || "") };
    if (isCastleBenignDomErrorV0(err, extra)) {
      try {
        console.warn("[CASTLE] React reconcile noise (extension/DOM); recovering", err?.message || err);
      } catch {
        /* noop */
      }
      this.setState((s) => ({ error: null, recoverKey: (s.recoverKey || 0) + 1 }));
      return;
    }
    reportCastleFatal("react_error_boundary", err, extra);
  }

  render() {
    const { error, recoverKey } = this.state;
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
          <p style={{ fontSize: 12, marginTop: 12, opacity: 0.9 }}>
            Tarayıcı eklentisi (çeviri, yazım denetimi, şifre yöneticisi) bu hatayı tetikleyebilir — gizli pencerede
            veya eklentisiz tekrar deneyin.
          </p>
        </div>
      );
    }
    return <React.Fragment key={recoverKey}>{this.props.children}</React.Fragment>;
  }
}
