import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { getCastleFlightConfig } from "../castleFlight/castleFlightConfig.js";

const MAX_ATTEMPTS = 5;
const HEALTH_TIMEOUT_MS = 6500;

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
export function shouldUseSameOriginGatewayHealthProxyV0() {
  return false;
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
 *   retry: () => void,
 *   remoteContinuityAvailable: boolean,
 *   showSlowLoading: boolean,
 *   healthDeps: object | null,
 *   healthPollSerial: number
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
  const pollRef = useRef(0);

  const retry = useCallback(() => {
    setSessionTick((x) => x + 1);
    setDetail("");
    setSlowGate(false);
    setHealthDeps(null);
  }, []);

  useEffect(() => {
    setSlowGate(false);
    const t = window.setTimeout(() => setSlowGate(true), 1800);
    return () => window.clearTimeout(t);
  }, [sessionTick]);

  useEffect(() => {
    let cancelled = false;
    if (pollRef.current) {
      window.clearInterval(pollRef.current);
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
      setAttempt(0);

      for (let a = 1; a <= MAX_ATTEMPTS; a += 1) {
        if (cancelled) return;
        setAttempt(a);
        if (a > 1) setPhase("reconnecting");
        try {
          const raw = await fetchGatewayDepsOnce(httpBase);
          if (cancelled) return;
          const { phase: ph, detail: det } = classifyGatewayPhase(raw);
          setHealthDeps(raw.json && typeof raw.json === "object" ? raw.json : null);
          setDetail(det || "");
          if (ph === "connected" || ph === "degraded_llm" || ph === "degraded_storage" || ph === "degraded") {
            setPhase(ph);
            setAttempt(a);
            setHealthPollSerial((n) => n + 1);
            const pollId = window.setInterval(async () => {
              try {
                const r = await fetchGatewayDepsOnce(httpBase);
                if (cancelled) return;
                const cl = classifyGatewayPhase(r);
                setHealthDeps(r.json && typeof r.json === "object" ? r.json : null);
                setPhase(cl.phase);
                setDetail(cl.detail || "");
                setHealthPollSerial((n) => n + 1);
              } catch (e) {
                if (cancelled) return;
                const cl = classifyGatewayPhase({ fetchOk: false, error: e });
                setPhase(cl.phase);
                setDetail(cl.detail || "");
                setHealthDeps(null);
                setHealthPollSerial((n) => n + 1);
              }
            }, 12_000);
            pollRef.current = pollId;
            return;
          }
          if (ph === "maintenance") {
            setPhase("maintenance");
            return;
          }
          if ((ph === "offline" || ph === "offline_dns") && a < MAX_ATTEMPTS) {
            setPhase(ph);
            await new Promise((r) => window.setTimeout(r, 700 + a * 350));
            continue;
          }
          setPhase(ph);
          return;
        } catch (e) {
          if (cancelled) return;
          const cl = classifyGatewayPhase({ fetchOk: false, error: e });
          setDetail(cl.detail || "");
          setHealthDeps(null);
          if (a < MAX_ATTEMPTS) {
            await new Promise((r) => window.setTimeout(r, 700 + a * 350));
          }
        }
      }

      if (!cancelled) {
        setPhase("offline");
        setAttempt(MAX_ATTEMPTS);
        setHealthDeps(null);
      }
    };

    void runInitial();

    return () => {
      cancelled = true;
      if (pollRef.current) {
        window.clearInterval(pollRef.current);
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
      healthPollSerial
    };
  }, [phase, attempt, detail, retry, slowGate, healthDeps, healthPollSerial]);

  return model;
}
