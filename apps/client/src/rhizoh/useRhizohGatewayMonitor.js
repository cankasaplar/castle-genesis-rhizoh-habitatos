import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { getCastleFlightConfig } from "../castleFlight/castleFlightConfig.js";
import { emitRhizohEngineActionTrace } from "./telemetry/rhizohUiIntentTraceV0.js";
import { computeGatewayFlapPressure } from "./runtime/runtimeFrameCorrelationV0.js";
import { setActiveConnectionId, setGatewayHealth } from "./runtime/gatewayIdentityStoreV0.js";

const MAX_ATTEMPTS = 5;
const HEALTH_TIMEOUT_MS = 6500;
/** Rolling HTTP health outcomes for stability / churn detection (runHealthTick only). */
const HEALTH_OUTCOME_RING_MAX = 12;
const HEALTH_CHURN_WINDOW_MIN_N = 8;
const HEALTH_CHURN_MIN_FAILS = 6;

function backoffWithFlapAndJitter(attemptIndex) {
  const flap = computeGatewayFlapPressure();
  const base = 700 + attemptIndex * 350 + flap.suggestedRetryExtraMs;
  return base + Math.floor(Math.random() * 550);
}

function gatewayStatusFromPhase(phase) {
  const ph = String(phase || "").toLowerCase();
  if (
    ph === "connected" ||
    ph === "uncertain" ||
    ph === "degraded" ||
    ph === "degraded_llm" ||
    ph === "degraded_storage"
  )
    return "connected";
  if (ph === "connecting" || ph === "reconnecting") return "connecting";
  return "disconnected";
}

function extractCandidateConnectionId(json) {
  try {
    if (!json || typeof json !== "object") return "";
    const j = /** @type {any} */ (json);
    const cand =
      j?.activeConnectionId ??
      j?.connectionId ??
      j?.llmConnectionId ??
      j?.gatewayConnectionId ??
      j?.deps?.activeConnectionId ??
      j?.deps?.connectionId ??
      j?.persistence?.connectionId;
    if (cand == null) return "";
    const s = String(cand).trim();
    return s ? s : "";
  } catch {
    return "";
  }
}

export function getOrCreateCastleDevUid() {
  const key = "castle.dev.uid";
  try {
    let uid = window.localStorage.getItem(key) || "";
    if (!uid) {
      uid = `u-${Math.random().toString(36).slice(2, 10)}`;
      window.localStorage.setItem(key, uid);
    }
    return uid;
  } catch {
    return `u-${Math.random().toString(36).slice(2, 10)}`;
  }
}

export function getRhizohHttpOrigin() {
  const cfg = getCastleFlightConfig();
  const url = String(cfg.rhizohLlmHttp || "").trim();
  if (!url) return null;
  try {
    return new URL(url).origin;
  } catch {
    return null;
  }
}

/**
 * Sağlık kontrolleri için taban: `.../rhizoh/llm` ise sonek kırpılır (ör. `/api/rhizoh/llm` → `/api`).
 * Sadece origin kullanıldığında reverse proxy alt yolu kaçırılıp Hosting'e /health isteği gidebiliyordu.
 * @returns {string|null}
 */
/** rhizoh.com / Firebase Hosting: health + LLM aynı origin proxy (Render doğrudan kopunca sinyal düşmesin). */
export function shouldUseSameOriginGatewayHealthProxyV0() {
  if (typeof window === "undefined") return false;
  const h = String(window.location.hostname || "").toLowerCase();
  return (
    h === "rhizoh.com" ||
    h === "www.rhizoh.com" ||
    h.endsWith(".rhizoh.com") ||
    h === "castle-genesis.web.app" ||
    h === "castle-genesis.firebaseapp.com"
  );
}

export function getRhizohDirectGatewayHealthBase() {
  const cfg = getCastleFlightConfig();
  const url = String(cfg.rhizohLlmHttp || "").trim();
  if (!url) return null;
  try {
    const baseHref = typeof window !== "undefined" && window.location?.href ? window.location.href : "http://localhost/";
    const u = new URL(url, baseHref);
    let p = u.pathname.replace(/\/+$/, "");
    if (p.endsWith("/rhizoh/llm")) {
      p = p.slice(0, -"/rhizoh/llm".length);
    }
    const prefix = !p || p === "/" ? "" : p;
    return `${u.origin}${prefix}`;
  } catch {
    return getRhizohHttpOrigin();
  }
}

export function getRhizohGatewayHealthBase() {
  if (shouldUseSameOriginGatewayHealthProxyV0()) {
    return `${window.location.origin}/api/gatewayProxy`;
  }
  return getRhizohDirectGatewayHealthBase();
}

/** @returns {string} Örn. https://host — boş string gateway yoksa */
export function getRhizohApiBase() {
  const cfg = getCastleFlightConfig();
  const url = String(cfg.rhizohLlmHttp || "").trim();
  if (!url) return "";
  try {
    const u = new URL(url);
    return `${u.protocol}//${u.host}`;
  } catch {
    return "";
  }
}

/**
 * @param {string} origin
 * @returns {Promise<{ status: number, json: object | null, fetchOk: boolean, error?: Error }>}
 */
async function fetchHealthAtBase(httpBase) {
  const headers = { "X-Castle-Dev-Uid": getOrCreateCastleDevUid() };
  const run = async (path) => {
    const ctrl = new AbortController();
    const timer = window.setTimeout(() => ctrl.abort(), HEALTH_TIMEOUT_MS);
    try {
      const res = await fetch(`${httpBase}${path}`, { signal: ctrl.signal, headers });
      const text = await res.text();
      let json = null;
      try {
        json = text ? JSON.parse(text) : null;
      } catch {
        json = null;
      }
      return { status: res.status, json, fetchOk: true };
    } finally {
      window.clearTimeout(timer);
    }
  };
  const first = await run("/health/deps");
  if (first.status === 404) {
    const legacy = await run("/health");
    const ok = legacy.status > 0 && legacy.status < 500 && legacy.json?.ok !== false;
    return {
      status: legacy.status,
      json: ok
        ? {
            ok: true,
            dns: true,
            llm: true,
            firestore: false,
            legacyFallback: true,
            persistence: legacy.json?.persistence ?? "unknown"
          }
        : legacy.json,
      fetchOk: true
    };
  }
  return first;
}

async function fetchGatewayDepsOnce(httpBase) {
  try {
    let first = await fetchHealthAtBase(httpBase);
    const viaProxy = String(httpBase || "").includes("/api/gatewayProxy");
    if (viaProxy && (first.status === 404 || first.status >= 502 || !first.json)) {
      const direct = getRhizohDirectGatewayHealthBase();
      if (direct) {
        first = await fetchHealthAtBase(direct);
      }
    }
    return first;
  } catch (e) {
    return { status: 0, json: null, fetchOk: false, error: e instanceof Error ? e : new Error(String(e)) };
  }
}

/**
 * @param {{ status: number, json: object | null, fetchOk: boolean, error?: Error }} result
 */
function classifyGatewayPhase(result) {
  if (!result.fetchOk) {
    const e = result.error;
    const name = e?.name || "";
    const msg = String(e?.message || "").toLowerCase();
    if (
      name === "TypeError" ||
      msg.includes("failed to fetch") ||
      msg.includes("networkerror") ||
      msg.includes("load failed") ||
      msg.includes("err_name_not_resolved")
    ) {
      return {
        phase: "offline_dns",
        detail: "Alan adı çözülemedi veya ağ geçidine ulaşılamıyor (tünel/DNS)."
      };
    }
    if (name === "AbortError") {
      return { phase: "offline", detail: "Sağlık kontrolü zaman aşımına uğradı." };
    }
    return { phase: "offline", detail: String(e?.message || "Ağ hatası") };
  }

  if (result.status === 503 && result.json && String(result.json.phase || "") === "maintenance") {
    return { phase: "maintenance", detail: "Sunucu bakım modunda." };
  }

  if (result.status === 503) {
    return { phase: "maintenance", detail: `HTTP ${result.status}` };
  }

  if (result.status !== 200 || !result.json || typeof result.json !== "object") {
    return { phase: "degraded", detail: result.status ? `HTTP ${result.status}` : "Geçersiz yanıt" };
  }

  const j = result.json;
  if (j.ok === true) {
    return { phase: "connected", detail: "" };
  }
  if (j.llm === true) {
    const parts = [];
    if (j.persistence === "firebase" && j.firestore === false) {
      parts.push("LLM hazır; Firestore zayıf — süreklilik çoğunlukla yerelde kalır.");
    } else if (j.ok === false) {
      parts.push("LLM hazır; bazı sunucu bağımlılıkları kısıtlı.");
    }
    return { phase: "connected", detail: parts.join(" ") };
  }
  if (j.llm === false) {
    return { phase: "degraded_llm", detail: "LLM ortam anahtarı veya yapılandırması eksik." };
  }
  if (j.persistence === "firebase" && j.firestore === false) {
    return { phase: "degraded_storage", detail: "Firestore erişilemedi veya zaman aşımı." };
  }
  return { phase: "degraded", detail: "Bir veya daha fazla bağımlılık hazır değil." };
}

/**
 * @returns {{
 *   phase: string,
 *   attempt: number,
 *   maxAttempts: number,
 *   headline: string,
 *   hint: string,
 *   detail: string,
 *   liveMessage: string,
 *   retry: (opts?: { correlationId?: string }) => void,
 *   remoteContinuityAvailable: boolean,
 *   showSlowLoading: boolean,
 *   healthDeps: object | null,
 *   healthPollSerial: number,
 *   healthConfidence: number,
 *   healthSampleN: number,
 *   healthFailN: number,
 *   healthChurnEscalated: boolean
 * }}
 */
export function useRhizohGatewayMonitor() {
  const [phase, setPhase] = useState("initializing");
  const [attempt, setAttempt] = useState(0);
  const [detail, setDetail] = useState("");
  const [sessionTick, setSessionTick] = useState(0);
  const [slowGate, setSlowGate] = useState(false);
  const [healthDeps, setHealthDeps] = useState(null);
  const [healthPollSerial, setHealthPollSerial] = useState(0);
  const [healthSignalSnapshot, setHealthSignalSnapshot] = useState(() => ({
    confidence: 1,
    sampleN: 0,
    failN: 0,
    churnEscalated: false
  }));
  const pollRef = useRef(0);

  const retry = useCallback((opts) => {
    const correlationId =
      opts && typeof opts === "object" && opts.correlationId != null ? String(opts.correlationId) : "";
    if (correlationId) {
      emitRhizohEngineActionTrace({
        intent: "GATEWAY_RETRY",
        outcome: "session_retry_scheduled",
        target: "useRhizohGatewayMonitor.retry",
        correlationId
      });
    }
    setSessionTick((x) => x + 1);
    setDetail("");
    setSlowGate(false);
    setHealthDeps(null);
    setHealthSignalSnapshot({ confidence: 1, sampleN: 0, failN: 0, churnEscalated: false });
  }, []);

  useEffect(() => {
    setSlowGate(false);
    const t = window.setTimeout(() => setSlowGate(true), 1800);
    return () => window.clearTimeout(t);
  }, [sessionTick]);

  useEffect(() => {
    let cancelled = false;
    if (pollRef.current) {
      window.clearTimeout(pollRef.current);
      pollRef.current = 0;
    }

    const runInitial = async () => {
      const httpBase = getRhizohGatewayHealthBase();
      if (!httpBase) {
        if (!cancelled) {
          setPhase("unconfigured");
          setAttempt(0);
          setHealthDeps(null);
          setDetail(
            "Bundle içinde VITE_GATEWAY_HTTP / VITE_GATEWAY_URL yok (build sırasında gömülmedi). " +
              "Yeniden build + deploy veya alttaki kutudan tam LLM URL kaydedin (örn. https://sunucu/rhizoh/llm)."
          );
        }
        return;
      }

      setPhase("connecting");
      setGatewayHealth("connecting");
      setAttempt(0);

      for (let a = 1; a <= MAX_ATTEMPTS; a += 1) {
        if (cancelled) return;
        setAttempt(a);
        if (a > 1) {
          setPhase("reconnecting");
          setGatewayHealth("connecting");
        }
        try {
          const raw = await fetchGatewayDepsOnce(httpBase);
          if (cancelled) return;
          const { phase: ph, detail: det } = classifyGatewayPhase(raw);
          setHealthDeps(raw.json && typeof raw.json === "object" ? raw.json : null);
          setDetail(det || "");
          if (ph === "connected" || ph === "degraded_llm" || ph === "degraded_storage" || ph === "degraded") {
            setPhase(ph);
            const gwStatus = gatewayStatusFromPhase(ph);
            setGatewayHealth(gwStatus);
            const candidateConn = extractCandidateConnectionId(raw?.json);
            if (gwStatus === "connected" && candidateConn) {
              setActiveConnectionId(candidateConn, { status: gwStatus, at: Date.now() });
            }
            setAttempt(a);
            setHealthPollSerial((n) => n + 1);
            /** Monotonic tick id: stale async completions must not overwrite newer poll state (ordering guard). */
            let healthPollIssueId = 0;
            /** Only `offline` / `offline_dns` are debounced — avoids flip-flop from single flaky / out-of-order HTTP health. */
            let offlinePollStreak = 0;
            /** @type {boolean[]} */
            let healthOutcomeRing = [];

            /**
             * Rolling HTTP health outcomes (max {@link HEALTH_OUTCOME_RING_MAX}) → explicit confidence + churn.
             * @returns {boolean} `true` when sustained failure mass should bypass offline debounce (escape uncertain↔connected loops).
             */
            function pushHealthOutcome(ok) {
              healthOutcomeRing.push(!!ok);
              if (healthOutcomeRing.length > HEALTH_OUTCOME_RING_MAX) healthOutcomeRing.shift();
              const n = healthOutcomeRing.length;
              const failN = healthOutcomeRing.filter((x) => !x).length;
              const okN = n - failN;
              const confidence = n === 0 ? 1 : Math.max(0.08, Math.min(1, okN / n));
              const churnEscalated = n >= HEALTH_CHURN_WINDOW_MIN_N && failN >= HEALTH_CHURN_MIN_FAILS;
              if (!cancelled) {
                setHealthSignalSnapshot({ confidence, sampleN: n, failN, churnEscalated });
              }
              return churnEscalated;
            }

            function isOfflineHealthPhase(ph) {
              return ph === "offline" || ph === "offline_dns";
            }

            async function runHealthTick() {
              if (cancelled) return;
              const myIssueId = ++healthPollIssueId;
              try {
                const r = await fetchGatewayDepsOnce(httpBase);
                if (cancelled) return;
                if (myIssueId !== healthPollIssueId) return;

                const cl = classifyGatewayPhase(r);

                if (cl.phase === "maintenance") {
                  offlinePollStreak = 0;
                  pushHealthOutcome(false);
                  setPhase("maintenance");
                  setGatewayHealth("disconnected");
                  setActiveConnectionId(null, { at: Date.now() });
                  setDetail(cl.detail || "");
                  setHealthDeps(r.json && typeof r.json === "object" ? r.json : null);
                  setHealthPollSerial((n) => n + 1);
                } else if (!isOfflineHealthPhase(cl.phase)) {
                  offlinePollStreak = 0;
                  pushHealthOutcome(true);
                  setHealthDeps(r.json && typeof r.json === "object" ? r.json : null);
                  setPhase(cl.phase);
                  const gwStatus2 = gatewayStatusFromPhase(cl.phase);
                  setGatewayHealth(gwStatus2);
                  const candidateConn2 = extractCandidateConnectionId(r?.json);
                  if (gwStatus2 === "connected" && candidateConn2) {
                    setActiveConnectionId(candidateConn2, { status: gwStatus2, at: Date.now() });
                  } else if (gwStatus2 === "disconnected") {
                    setActiveConnectionId(null, { at: Date.now() });
                  }
                  setDetail(cl.detail || "");
                  setHealthPollSerial((n) => n + 1);
                } else {
                  offlinePollStreak += 1;
                  const churnBypass = pushHealthOutcome(false);
                  if (offlinePollStreak < 2 && !churnBypass) {
                    setPhase("uncertain");
                    setGatewayHealth("connected");
                    setDetail(
                      [
                        cl.detail || "Sağlık kontrolü geçici başarısız.",
                        "Tam offline için ardışık 2 başarısız tur veya yoğun rolling başarısızlık (otomatik yükseltme)."
                      ]
                        .filter(Boolean)
                        .join(" ")
                    );
                    setHealthPollSerial((n) => n + 1);
                  } else {
                    offlinePollStreak = 0;
                    healthOutcomeRing.length = 0;
                    if (!cancelled) {
                      setHealthSignalSnapshot({ confidence: 1, sampleN: 0, failN: 0, churnEscalated: false });
                    }
                    setHealthDeps(r.json && typeof r.json === "object" ? r.json : null);
                    setPhase(cl.phase);
                    setGatewayHealth("disconnected");
                    setActiveConnectionId(null, { at: Date.now() });
                    setDetail(cl.detail || "");
                    setHealthPollSerial((n) => n + 1);
                  }
                }
              } catch (e) {
                if (cancelled) return;
                if (myIssueId !== healthPollIssueId) return;

                const cl = classifyGatewayPhase({ fetchOk: false, error: e });
                if (cl.phase === "maintenance") {
                  offlinePollStreak = 0;
                  pushHealthOutcome(false);
                  setPhase("maintenance");
                  setGatewayHealth("disconnected");
                  setActiveConnectionId(null, { at: Date.now() });
                  setDetail(cl.detail || "");
                  setHealthDeps(null);
                  setHealthPollSerial((n) => n + 1);
                } else if (!isOfflineHealthPhase(cl.phase)) {
                  offlinePollStreak = 0;
                  pushHealthOutcome(true);
                  setHealthDeps(null);
                  setPhase(cl.phase);
                  const gwStatus2 = gatewayStatusFromPhase(cl.phase);
                  setGatewayHealth(gwStatus2);
                  if (gwStatus2 === "disconnected") {
                    setActiveConnectionId(null, { at: Date.now() });
                  }
                  setDetail(cl.detail || "");
                  setHealthPollSerial((n) => n + 1);
                } else {
                  offlinePollStreak += 1;
                  const churnBypass = pushHealthOutcome(false);
                  if (offlinePollStreak < 2 && !churnBypass) {
                    setPhase("uncertain");
                    setGatewayHealth("connected");
                    setDetail(
                      [
                        cl.detail || "Sağlık kontrolü geçici başarısız.",
                        "Tam offline için ardışık 2 başarısız tur veya yoğun rolling başarısızlık (otomatik yükseltme)."
                      ]
                        .filter(Boolean)
                        .join(" ")
                    );
                    setHealthPollSerial((n) => n + 1);
                  } else {
                    offlinePollStreak = 0;
                    healthOutcomeRing.length = 0;
                    if (!cancelled) {
                      setHealthSignalSnapshot({ confidence: 1, sampleN: 0, failN: 0, churnEscalated: false });
                    }
                    setHealthDeps(null);
                    setPhase(cl.phase);
                    setGatewayHealth("disconnected");
                    setActiveConnectionId(null, { at: Date.now() });
                    setDetail(cl.detail || "");
                    setHealthPollSerial((n) => n + 1);
                  }
                }
              }
              if (!cancelled && myIssueId === healthPollIssueId) scheduleHealthPoll();
            }
            function scheduleHealthPoll() {
              if (cancelled) return;
              const flap = computeGatewayFlapPressure();
              const delay = 12_000 + flap.suggestedPollExtraMs + Math.floor(Math.random() * 2200);
              pollRef.current = window.setTimeout(() => void runHealthTick(), delay);
            }
            scheduleHealthPoll();
            return;
          }
          if (ph === "maintenance") {
            setPhase("maintenance");
            setGatewayHealth("disconnected");
            setActiveConnectionId(null, { at: Date.now() });
            return;
          }
          if ((ph === "offline" || ph === "offline_dns") && a < MAX_ATTEMPTS) {
            setPhase(ph);
            setGatewayHealth("disconnected");
            setActiveConnectionId(null, { at: Date.now() });
            await new Promise((r) => window.setTimeout(r, backoffWithFlapAndJitter(a)));
            continue;
          }
          setPhase(ph);
          setGatewayHealth(gatewayStatusFromPhase(ph));
          if (gatewayStatusFromPhase(ph) === "disconnected") setActiveConnectionId(null, { at: Date.now() });
          return;
        } catch (e) {
          if (cancelled) return;
          const cl = classifyGatewayPhase({ fetchOk: false, error: e });
          setDetail(cl.detail || "");
          setHealthDeps(null);
          const gwStatus = gatewayStatusFromPhase(cl.phase);
          setGatewayHealth(gwStatus);
          if (gwStatus === "disconnected") setActiveConnectionId(null, { at: Date.now() });
          if (a < MAX_ATTEMPTS) {
            await new Promise((r) => window.setTimeout(r, backoffWithFlapAndJitter(a)));
          }
        }
      }

      if (!cancelled) {
        setPhase("offline");
        setGatewayHealth("disconnected");
        setActiveConnectionId(null, { at: Date.now() });
        setAttempt(MAX_ATTEMPTS);
        setHealthDeps(null);
      }
    };

    void runInitial();

    return () => {
      cancelled = true;
      if (pollRef.current) {
        window.clearTimeout(pollRef.current);
        pollRef.current = 0;
      }
    };
  }, [sessionTick]);

  const model = useMemo(() => {
    const maxAttempts = MAX_ATTEMPTS;
    let headline = "";
    let hint = "";
    let liveMessage = "";

    switch (phase) {
      case "initializing":
        headline = "Oturum başlatılıyor…";
        hint = "Gerçek zamanlı ağ geçidi kontrol ediliyor.";
        liveMessage = headline;
        break;
      case "unconfigured":
        headline = "Çevrimdışı mod (demo)";
        hint = "Uzak gateway yapılandırılmadı. Komutlar yerel Rhizoh protokolüyle işlenir; süreklilik API’leri kapalı.";
        liveMessage = "Gateway yapılandırılmadı. Demo modu.";
        break;
      case "connecting":
        headline = "Gerçek zamanlı ağ geçidine bağlanılıyor…";
        hint = "İnternet bağlantınızı kontrol edin. Bu 1–2 saniye sürebilir.";
        liveMessage = headline;
        break;
      case "reconnecting":
        headline = `Yeniden bağlanılıyor (deneme ${attempt}/${maxAttempts})…`;
        hint = "DNS veya geçici tünel kopması olabilir. Kalıcı origin (ör. gateway.castlegenesis.ai) önerilir.";
        liveMessage = headline;
        break;
      case "connected":
        headline = "Bağlandı";
        hint = "Rhizoh backend hazır. Komut ve süreklilik hattı kullanılabilir.";
        liveMessage = "Gateway bağlantısı kuruldu.";
        break;
      case "uncertain": {
        headline = "Bağlantı belirsiz";
        const { churnEscalated, confidence, sampleN } = healthSignalSnapshot;
        if (churnEscalated) {
          hint =
            "Rolling HTTP sağlık penceresinde yoğun başarısızlık algılandı; debounce atlanarak tam offline’a yükseltme mümkün. Ağ veya sunucu tarafında sürekli gecikme/kopma olası.";
          liveMessage = "Gateway belirsiz — rolling churn eşiği.";
        } else if (sampleN >= 4 && confidence < 0.75) {
          hint = `Rolling güven ~${Math.round(confidence * 100)}% (${sampleN} örnek, ${healthSignalSnapshot.failN} başarısız). Tam offline için 2 ardışık hata veya churn eşiği uygulanır.`;
          liveMessage = "Gateway sağlık sinyali belirsiz; düşük rolling güven.";
        } else {
          hint =
            "Son HTTP sağlık turu başarısız; bir önceki tur hâlâ geçerli sayılıyor. Ağ gecikmesi veya tek seferlik zaman aşımı olabilir — bir sonraki poll sonucunu bekleyin.";
          liveMessage = "Gateway sağlık sinyali belirsiz (yeniden doğrulanıyor).";
        }
        break;
      }
      case "degraded_llm":
        headline = "Kısıtlı: LLM yapılandırması";
        hint = "Ağ geçidi ayakta ancak sunucu LLM anahtarı veya sağlayıcı yapılandırması eksik. Yerel / bağlantı anahtarı deneyin.";
        liveMessage = "Gateway ayakta; LLM bağımlılığı zayıf.";
        break;
      case "degraded_storage":
        headline = "Kısıtlı: kalıcılık (Firestore)";
        hint = "Geçit çalışıyor; Firestore sağlık kontrolü başarısız. Oturum hafızası sunucuya yazılamayabilir.";
        liveMessage = "Gateway kısıtlı — depolama.";
        break;
      case "degraded":
        headline = "Kısıtlı bağlantı";
        hint = "Sunucu yanıt veriyor ancak bağımlılıkların bir kısmı hazır değil.";
        liveMessage = "Gateway kısıtlı modda.";
        break;
      case "offline_dns":
        headline = "DNS / ağ geçidi çözülemedi";
        hint = "trycloudflare gibi geçici tünel kapalı olabilir. Üretimde sabit domain + Cloud Run/Fly/VPS kullanın.";
        liveMessage = "Gateway host çözülemedi.";
        break;
      case "maintenance":
        headline = "Bakım modu";
        hint = "Sunucu CASTLE_GATEWAY_MAINTENANCE ile bakımda. Daha sonra yeniden deneyin.";
        liveMessage = "Gateway bakımda.";
        break;
      case "offline":
        headline = "Çevrimdışı";
        hint = "Backend’e ulaşılamıyor. İnternetinizi kontrol edin veya «Yeniden dene» kullanın.";
        liveMessage = "Gateway çevrimdışı.";
        break;
      default:
        headline = phase;
        hint = "";
        liveMessage = headline;
    }

    const remoteContinuityAvailable =
      phase === "connected" ||
      phase === "uncertain" ||
      phase === "degraded_llm" ||
      phase === "degraded_storage" ||
      phase === "degraded";
    const showSlowLoading =
      (phase === "connecting" || phase === "reconnecting" || phase === "initializing") && slowGate;

    return {
      phase,
      attempt,
      maxAttempts,
      headline,
      hint,
      detail,
      liveMessage,
      retry,
      remoteContinuityAvailable,
      showSlowLoading,
      healthDeps,
      healthPollSerial,
      healthConfidence: healthSignalSnapshot.confidence,
      healthSampleN: healthSignalSnapshot.sampleN,
      healthFailN: healthSignalSnapshot.failN,
      healthChurnEscalated: healthSignalSnapshot.churnEscalated
    };
  }, [phase, attempt, detail, retry, slowGate, healthDeps, healthPollSerial, healthSignalSnapshot]);

  return model;
}
