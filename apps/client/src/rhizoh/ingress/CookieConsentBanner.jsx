import React, { useState } from "react";
import {
  getCookieConsentV0,
  getLegalDocumentPathsV0,
  setCookieConsentV0
} from "./ingress_router.js";

/**
 * Minimal cookie layer — analytics default OFF.
 */
export function CookieConsentBanner() {
  const initial = getCookieConsentV0();
  const [visible, setVisible] = useState(!initial.decided);
  const docs = getLegalDocumentPathsV0();

  if (!visible) return null;

  return (
    <div
      role="dialog"
      aria-label="Çerez tercihi"
      style={{
        position: "fixed",
        bottom: 0,
        left: 0,
        right: 0,
        padding: "12px 16px",
        background: "rgba(5, 10, 20, 0.94)",
        borderTop: "1px solid rgba(125, 211, 252, 0.25)",
        color: "#d8e8f4",
        fontFamily: "Inter, system-ui, sans-serif",
        fontSize: 13,
        lineHeight: 1.5,
        zIndex: 9999
      }}
    >
      <p style={{ margin: "0 0 10px", maxWidth: 720, marginLeft: "auto", marginRight: "auto" }}>
        Zorunlu çerezler hizmet için kullanılır. <strong>Analitik çerezler varsayılan kapalıdır.</strong>{" "}
        <a href={docs.cookies} style={{ color: "#7dd3fc" }}>
          Çerez Politikası
        </a>
      </p>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8, maxWidth: 720, margin: "0 auto" }}>
        <button
          type="button"
          onClick={() => {
            setCookieConsentV0({ analytics: false });
            setVisible(false);
          }}
          style={{
            background: "#38bdf8",
            color: "#041018",
            border: "none",
            borderRadius: 6,
            padding: "8px 14px",
            fontWeight: 600,
            cursor: "pointer"
          }}
        >
          Zorunlu — analitik kapalı
        </button>
      </div>
    </div>
  );
}
