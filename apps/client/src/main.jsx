import React from "react";
import ReactDOM from "react-dom/client";
import { initFirebaseAnalyticsWhenReady } from "./firebase/castleFirebase.js";
import { getCookieConsentV0 } from "./rhizoh/ingress/ingress_router.js";
import { installChromeWebGpuNoiseSuppressV0 } from "./rhizoh/runtime/rhizohProductionLogNamespacesV0.js";
import { installCastleBootLogFlow, installGlobalCrashTelemetry, hideLegacyIndexHudV0 } from "./boot/castleCrashTelemetry.js";
import { CastleRootErrorBoundary } from "./boot/CastleRootErrorBoundary.jsx";
import { initRuntimeFrameOnce } from "./rhizoh/runtime/runtimeFrameCorrelationV0.js";
import "../../../src/index.css";

const bootLog = installCastleBootLogFlow();
bootLog.start("boot.entry", "main.jsx loaded");
installGlobalCrashTelemetry();
hideLegacyIndexHudV0();
bootLog.ok("boot.crash_telemetry", "global error + rejection hooks installed");
initRuntimeFrameOnce();
bootLog.ok("boot.runtime_frame", "runtimeFrameId bound (castle.last_frame.v1)");
installChromeWebGpuNoiseSuppressV0();
bootLog.ok("boot.webgpu_noise", "Chrome WebGPU adapter probe noise filter armed");
if (import.meta.env.DEV) {
  void import("./rhizoh/runtime/runtimeSnapshotV1.js")
    .then((m) => {
      window.__CASTLE_BUILD_RUNTIME_SNAPSHOT__ = () => m.buildRuntimeSnapshotV1();
      window.__CASTLE_PERSIST_RUNTIME_SNAPSHOT__ = () => m.persistRuntimeSnapshotV1();
      bootLog.ok("boot.runtime_snapshot", "DevTools: __CASTLE_BUILD_RUNTIME_SNAPSHOT__()");
      return import("./rhizoh/runtime/runtimeIdentityMergePolicyV0.js");
    })
    .then((m) => {
      window.__CASTLE_RESOLVE_RUNTIME_IDENTITY__ = (opts) =>
        m.resolveActiveRuntimeIdentity(opts && typeof opts === "object" ? opts : {});
    })
    .catch(() => {
      bootLog.ok("boot.runtime_snapshot", "dev snapshot modules optional (not in tree)");
    });
} else {
  bootLog.ok("boot.runtime_snapshot", "prod: snapshot DevTools globals omitted");
}
if (getCookieConsentV0().analytics) {
  initFirebaseAnalyticsWhenReady();
  bootLog.ok("boot.firebase_analytics", "analytics init requested");
} else {
  bootLog.ok("boot.firebase_analytics", "skipped — cookie consent analytics off");
}

import { mountCastleApplicationV0 } from "./boot/mountCastleApplicationV0.jsx";
import { registerRhizohServiceWorkerV0 } from "./pwa/registerRhizohServiceWorkerV0.js";
import { initRhizohPwaSyncManagerV0 } from "./pwa/rhizohPwaSyncManagerV0.js";
import { initRhizohSimulationPersistenceV0 } from "./core/initRhizohSimulationPersistenceV0.js";

const appEl = document.getElementById("app");
if (!import.meta.env.DEV) {
  initRhizohPwaSyncManagerV0();
  void registerRhizohServiceWorkerV0().then((out) => {
    bootLog.ok("boot.pwa_shell", out.ok ? "service worker registered" : `skipped: ${out.reason || "unknown"}`);
  });
  const runSimPersistenceBootV0 = () => {
    void initRhizohSimulationPersistenceV0().then((out) => {
      bootLog.ok("boot.sim_persistence", out.mode || out.reason || "ok");
    });
  };
  if (typeof requestIdleCallback !== "undefined") {
    requestIdleCallback(runSimPersistenceBootV0, { timeout: 4000 });
  } else {
    setTimeout(runSimPersistenceBootV0, 400);
  }
} else {
  bootLog.ok("boot.pwa_shell", "dev: service worker skipped");
  bootLog.ok("boot.sim_persistence", "dev: event replay optional");
}
void mountCastleApplicationV0({ appEl, RootErrorBoundary: CastleRootErrorBoundary, bootLog }).then((mount) => {
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
