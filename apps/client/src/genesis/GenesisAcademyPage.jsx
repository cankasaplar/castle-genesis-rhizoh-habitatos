import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { GenesisSurfaceNav } from "./GenesisSurfaceNav.jsx";
import { resolveGenesisNetworkBundle } from "./genesisNetworkResolverV1.js";
import { GENESIS_SEMANTIC_BRIDGE_SCHEMA, SEMANTIC_ANCHOR } from "./genesisSemanticBridgeV1.js";
import { AcademyHubContextLink } from "./AcademyHubContextLink.jsx";

/**
 * @param {{
 *   id: string,
 *   title: string,
 *   children: React.ReactNode,
 *   hub?: { anchor?: string, eventType?: string, window?: number } | null,
 *   lastSeq?: number | null
 * }} props
 */
function AnchorBlock({ id, title, children, hub, lastSeq }) {
  return (
    <article id={id} className="scroll-mt-24 rounded-xl border border-white/[0.07] bg-black/25 p-3">
      <h2 className="mb-2 flex flex-wrap items-baseline gap-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-violet-200/90">
        {title}
        <span className="font-mono text-[7px] font-normal normal-case text-white/35">#{id}</span>
      </h2>
      <div className="space-y-2 text-[10px] leading-relaxed text-white/65 normal-case">{children}</div>
      {hub ? (
        <div className="mt-2 flex flex-wrap items-center gap-2 border-t border-white/[0.07] pt-2">
          <AcademyHubContextLink
            anchorId={hub.anchor || id}
            eventType={hub.eventType}
            lastSeq={lastSeq ?? null}
            windowN={hub.window ?? 24}
          />
          <span className="text-[8px] text-white/35 normal-case">Bidirectional · Academy → Hub (ctx=1 + seq penceresi)</span>
        </div>
      ) : null}
    </article>
  );
}

/**
 * Açıklama katmanı — canlı `lastAcceptedSeq` runtime’dan okunur; Hub’a deterministik query ile geri bağlanır.
 */
export default function GenesisAcademyPage() {
  const bundle = useMemo(() => resolveGenesisNetworkBundle(), []);
  const [liveSeq, setLiveSeq] = useState(/** @type {number | null} */ (null));

  useEffect(() => {
    const url = String(bundle.runtimeUrl || "").trim();
    if (!url) return undefined;
    let alive = true;
    const tick = async () => {
      try {
        const res = await fetch(url, { method: "GET", cache: "no-store" });
        const j = await res.json().catch(() => null);
        if (!alive || !res.ok || !j?.ok) return;
        const n = j?.genesisStream?.lastAcceptedSeq;
        if (typeof n === "number" && Number.isFinite(n)) setLiveSeq(n);
      } catch {
        /* quiet */
      }
    };
    void tick();
    const id = window.setInterval(() => void tick(), 4000);
    return () => {
      alive = false;
      window.clearInterval(id);
    };
  }, [bundle.runtimeUrl]);

  return (
    <div className="min-h-screen bg-[#07060d] px-4 py-6 text-white">
      <div className="mx-auto max-w-2xl space-y-5">
        <GenesisSurfaceNav active="academy" />

        <section className="rounded-xl border border-violet-400/30 bg-gradient-to-br from-violet-950/40 to-black/30 p-4 normal-case">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="text-[9px] font-black uppercase tracking-[0.28em] text-violet-200/90">Live system</div>
              <p className="mt-1 max-w-md text-[10px] leading-relaxed text-white/70">
                Gateway SSE, deterministic replay ve evolution yüzeyi — salt okunur ürün konsolu. Academy metinleri burayı
                açıklar; canlı veri bu modülde.
              </p>
            </div>
            <Link
              to="/academy/observe"
              className="inline-flex shrink-0 items-center gap-2 rounded-lg border border-emerald-400/40 bg-emerald-500/15 px-4 py-2.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-emerald-100 hover:border-emerald-300/60 hover:bg-emerald-500/25"
            >
              <span className="h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.8)]" aria-hidden />
              Open Observe
            </Link>
          </div>
        </section>

        <header className="space-y-1">
          <div className="text-[10px] font-black uppercase tracking-[0.32em] text-amber-200/80">Genesis Academy</div>
          <h1 className="text-lg font-light text-white/90">Observability sözlüğü</h1>
          <p className="text-[10px] text-white/45 normal-case">
            Bu sayfa yorumlayıcı metin katmanıdır; gateway durumunu değiştirmez. Köprü şeması:{" "}
            <span className="font-mono text-white/55">{GENESIS_SEMANTIC_BRIDGE_SCHEMA}</span>
          </p>
        </header>

        <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-emerald-500/20 bg-emerald-950/15 px-3 py-2 text-[9px] text-emerald-100/90 normal-case">
          <span>
            Runtime <span className="font-mono text-emerald-50/90">genesisStream.lastAcceptedSeq</span>:{" "}
            <strong>{liveSeq != null ? String(liveSeq) : "—"}</strong>
          </span>
          <AcademyHubContextLink anchorId={SEMANTIC_ANCHOR.seq} lastSeq={liveSeq} windowN={32}>
            Hub · seq penceresi
          </AcademyHubContextLink>
        </div>

        <AnchorBlock id={SEMANTIC_ANCHOR.resolverBundle} title="Resolver bundle (tek origin)" hub={{ anchor: SEMANTIC_ANCHOR.resolverBundle, window: 32 }} lastSeq={liveSeq}>
          <p>
            Hub’daki tüm HTTP/SSE adresleri <strong className="text-white/80">GenesisNetworkResolverV1</strong> çıktısından türemelidir. İki farklı gateway origin →
            runtime ile stream ayrışır; bu yüzey drift&apos;ini burada ve Hub diagnostics&apos;te ararsın.
          </p>
          {bundle.origin ? (
            <ul className="space-y-1 font-mono text-[8px] text-violet-100/80">
              <li className="break-all">runtime → {bundle.runtimeUrl}</li>
              <li className="break-all">stream → {bundle.streamUrl}</li>
              <li className="break-all">checkpoint latest → {bundle.checkpointLatestUrl}</li>
            </ul>
          ) : (
            <p className="text-amber-200/80">Resolver origin boş — VITE_GATEWAY_HTTP ve VITE_LIVE_GATEWAY_BASE aynı gateway köküne kilitlenmeli.</p>
          )}
        </AnchorBlock>

        <AnchorBlock id={SEMANTIC_ANCHOR.seq} title="Seq (continuity acceptance)" hub={{ anchor: SEMANTIC_ANCHOR.seq, window: 40 }} lastSeq={liveSeq}>
          <p>
            <strong className="text-white/80">seq</strong>, gateway’in kabul ettiği süreklilik olaylarının monoton sıra numarasıdır. SSE{" "}
            <span className="font-mono text-white/55">id:</span> ile yeniden bağlanırken son seq’ten sonra taşıma yapılır; tek başına imzalı checkpoint değildir.
          </p>
        </AnchorBlock>

        <AnchorBlock id={SEMANTIC_ANCHOR.checkpointVsStream} title="Checkpoint vs stream" hub={{ anchor: SEMANTIC_ANCHOR.checkpointVsStream, window: 24 }} lastSeq={liveSeq}>
          <p>
            <strong className="text-white/80">Checkpoint</strong> imzalı / disk projeksiyonu (durable projection);{" "}
            <strong className="text-white/80">stream</strong> anlık olay halkası + bounded catch-up. Biri denetlenebilir snapshot, diğeri düşük gecikmeli gözlem taşıyıcısıdır.
          </p>
        </AnchorBlock>

        <AnchorBlock id={SEMANTIC_ANCHOR.streamTransport} title="Stream transport (SSE vs poll)" hub={{ anchor: SEMANTIC_ANCHOR.streamTransport, window: 24 }} lastSeq={liveSeq}>
          <p>
            <strong className="text-white/80">SSE</strong> tercihen <span className="font-mono text-white/55">text/event-stream</span> ile açılır. Tarayıcı aynı origin’de
            HTML alırsa (ör. Firebase SPA fallback) EventSource hata verir; Hub poll moduna düşebilir — bu bir yürütme hatası değil, topoloji sinyalidir.
          </p>
        </AnchorBlock>

        <AnchorBlock id={SEMANTIC_ANCHOR.sseErrors} title="SSE onerror sayacı" hub={{ anchor: SEMANTIC_ANCHOR.sseErrors, window: 24 }} lastSeq={liveSeq}>
          <p>
            Hub’daki sayaç, tarayıcının <span className="font-mono text-white/55">EventSource</span> hata döngüsünü özetler (MIME, ağ kopması, proxy). Otomatik reconnect
            davranışı tarayıcıya bağlıdır; burada yalnızca gözlemlenen kesinti sayısı tutulur.
          </p>
        </AnchorBlock>

        <AnchorBlock id={SEMANTIC_ANCHOR.healthLive} title="health/live" hub={{ anchor: SEMANTIC_ANCHOR.healthLive, window: 24 }} lastSeq={liveSeq}>
          <p>
            Gateway sürecinin canlılık sinyali. Hub A bloğunda fail görüyorsan önce DNS / Render / yanlış host eşlemesini ele; Academy metni gateway’i iyileştirmez.
          </p>
        </AnchorBlock>

        <AnchorBlock id={SEMANTIC_ANCHOR.runtimeSurface} title="Runtime surface (GET …/runtime)" hub={{ anchor: SEMANTIC_ANCHOR.runtimeSurface, window: 24 }} lastSeq={liveSeq}>
          <p>
            <span className="font-mono text-white/55">castle.genesis.runtime.surface.v0</span> — gateway-only JSON. UI sentezlemez; tick, mühür özeti, replay fingerprint vb.
            burada okunur.
          </p>
        </AnchorBlock>

        <AnchorBlock id={SEMANTIC_ANCHOR.checkpointTools} title="Checkpoint araçları" hub={{ anchor: SEMANTIC_ANCHOR.checkpointTools, window: 24 }} lastSeq={liveSeq}>
          <p>
            by-seq / range / lineage uçları salt okunur projeksiyondur. 410 <span className="font-mono text-white/55">genesis_ephemeral_mode</span> veya 503 disk kapalı
            gibi kodlar, kalıcılık politikasıyla ilgilidir — epistemik “yanlışlık” etiketi değildir.
          </p>
        </AnchorBlock>

        <AnchorBlock id={SEMANTIC_ANCHOR.epistemicField} title="Epistemic field (containment)" hub={{ anchor: SEMANTIC_ANCHOR.epistemicField, window: 24 }} lastSeq={liveSeq}>
          <p>
            Replay observatory tensörleri ve containment etiketleri burada okunur; bunlar <strong className="text-white/80">yürütme otoritesi değildir</strong>, yalnızca
            gözlemlenebilir alan özeti.
          </p>
        </AnchorBlock>

        <AnchorBlock id={SEMANTIC_ANCHOR.snorm} title="S_norm" hub={{ anchor: SEMANTIC_ANCHOR.snorm, window: 24 }} lastSeq={liveSeq}>
          <p>
            <strong className="text-white/80">S_norm</strong>, skoru raporlanabilir aralığa indirger; ani sıçramalar çoğunlukla checkpoint penceresi / runtime tensörü
            uyuşmazlığı veya veri gürültüsü sinyalidir — otomatik “düzeltme” anlamına gelmez.
          </p>
        </AnchorBlock>

        <AnchorBlock
          id={SEMANTIC_ANCHOR.tickAdvanced}
          title="TickAdvanced (continuity event)"
          hub={{ anchor: SEMANTIC_ANCHOR.tickAdvanced, eventType: "TickAdvanced", window: 20 }}
          lastSeq={liveSeq}
        >
          <p>Anlam: zamansal ilerleme / kabul çizgisinde tick yüzeyi güncellendi. Yürütme değil, gözlem sırası.</p>
        </AnchorBlock>

        <AnchorBlock id={SEMANTIC_ANCHOR.sealIssued} title="SealIssued" hub={{ anchor: SEMANTIC_ANCHOR.sealIssued, eventType: "SealIssued", window: 20 }} lastSeq={liveSeq}>
          <p>Gateway epistemik mühür yüzeyinde yeni bir mühür yayını; ledger ile karıştırma — mühür kısa özet, ledger ayrı akış olabilir.</p>
        </AnchorBlock>

        <AnchorBlock id={SEMANTIC_ANCHOR.ledgerAdvanced} title="LedgerAdvanced" hub={{ anchor: SEMANTIC_ANCHOR.ledgerAdvanced, eventType: "LedgerAdvanced", window: 20 }} lastSeq={liveSeq}>
          <p>Kalıcı epistemik ledger yüksekliği veya batch kabul sinyali; seq ile birlikte düşünülür.</p>
        </AnchorBlock>

        <AnchorBlock id={SEMANTIC_ANCHOR.replayState} title="ReplayState" hub={{ anchor: SEMANTIC_ANCHOR.replayState, eventType: "ReplayState", window: 20 }} lastSeq={liveSeq}>
          <p>Worker / replay hizalama sinyali (alignment, divergence). Operasyonel sağlık göstergesi, tek başına “gerçek dünya” iddiası değildir.</p>
        </AnchorBlock>

        <AnchorBlock id={SEMANTIC_ANCHOR.presenceMesh} title="PresenceMesh" hub={{ anchor: SEMANTIC_ANCHOR.presenceMesh, eventType: "PresenceMesh", window: 20 }} lastSeq={liveSeq}>
          <p>Oda bazlı süreklilik özetleri (uid sayıları, max seq). Mesh SSE dinleyicisi transport katmanıdır.</p>
        </AnchorBlock>

        <AnchorBlock id={SEMANTIC_ANCHOR.infraHealth} title="InfraHealth" hub={{ anchor: SEMANTIC_ANCHOR.infraHealth, eventType: "InfraHealth", window: 20 }} lastSeq={liveSeq}>
          <p>Gateway içi kuyruk / hata sayaçları ve skorlanmış sağlık özeti.</p>
        </AnchorBlock>

        <AnchorBlock id={SEMANTIC_ANCHOR.spiralWs} title="SpiralWebSocket" hub={{ anchor: SEMANTIC_ANCHOR.spiralWs, eventType: "SpiralWebSocket", window: 20 }} lastSeq={liveSeq}>
          <p>Spiral dünya WebSocket fan-out özeti; HTTP runtime’dan ayrı transport.</p>
        </AnchorBlock>

        <AnchorBlock
          id={SEMANTIC_ANCHOR.replayFingerprint}
          title="ReplayFingerprint"
          hub={{ anchor: SEMANTIC_ANCHOR.replayFingerprint, eventType: "ReplayFingerprint", window: 20 }}
          lastSeq={liveSeq}
        >
          <p>Runtime yüzeyinin kısa parmak izi; iki deploy veya iki origin karşılaştırmasında drift tespiti için kullanılır.</p>
        </AnchorBlock>

        <AnchorBlock
          id={SEMANTIC_ANCHOR.runtimeCapabilityEvent}
          title="RuntimeCapabilityEvent"
          hub={{ anchor: SEMANTIC_ANCHOR.runtimeCapabilityEvent, eventType: "RuntimeCapabilityEvent", window: 20 }}
          lastSeq={liveSeq}
        >
          <p>Yetenek bayrakları (LLM yapılandırılmış mı, kalıcılık modu vb.) anlık snapshot; politika değil.</p>
        </AnchorBlock>

        <AnchorBlock id={SEMANTIC_ANCHOR.continuityUnknown} title="Eşlenmemiş continuity type" hub={{ anchor: SEMANTIC_ANCHOR.continuityUnknown, window: 24 }} lastSeq={liveSeq}>
          <p>Hub’da <span className="font-mono text-white/55">?</span> ile geldin; gateway yeni bir <span className="font-mono text-white/55">type</span> gönderiyor olabilir. Bu
            dosyaya deterministik mapping eklenmeli (AI yok).</p>
        </AnchorBlock>

        <AnchorBlock id={SEMANTIC_ANCHOR.diagnostics} title="Diagnostics & UI contamination" hub={{ anchor: SEMANTIC_ANCHOR.diagnostics, window: 24 }} lastSeq={liveSeq}>
          <p>
            Hub E bloğu HTTP/SSE/transport sinyallerini toplar. React üretim invariant (#185) gibi motor hataları burada otomatik çözülmez; konsol ve hata sınırı ayrı izlenir.
          </p>
        </AnchorBlock>
      </div>
    </div>
  );
}
