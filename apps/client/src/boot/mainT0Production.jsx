import { initFirebaseAnalyticsWhenReady } from "./firebase/castleFirebase.js";
import { getCookieConsentV0 } from "./rhizoh/ingress/ingress_router.js";
import { installCastleBootLogFlow, installGlobalCrashTelemetry, hideLegacyIndexHudV0 } from "./boot/castleCrashTelemetry.js";
import { CastleRootErrorBoundary } from "./boot/CastleRootErrorBoundary.jsx";
import { mountCastleApplicationT0V0 } from "./boot/mountCastleApplicationT0V0.jsx";
import "../../../src/index.css";

const bootLog = installCastleBootLogFlow();
bootLog.start("boot.entry", "main.jsx loaded");
installGlobalCrashTelemetry();
hideLegacyIndexHudV0();
bootLog.ok("boot.crash_telemetry", "global error + rejection hooks installed");

if (getCookieConsentV0().analytics) {
  initFirebaseAnalyticsWhenReady();
  bootLog.ok("boot.firebase_analytics", "analytics init requested");
} else {
  bootLog.ok("boot.firebase_analytics", "skipped — cookie consent analytics off");
}

const appEl = document.getElementById("app");
void mountCastleApplicationT0V0({ appEl, RootErrorBoundary: CastleRootErrorBoundary, bootLog });
