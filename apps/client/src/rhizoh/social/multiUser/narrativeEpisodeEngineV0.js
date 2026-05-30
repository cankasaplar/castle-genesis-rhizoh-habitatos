/**
 * SPECFLOW: RESEARCH-ONLY — **Narrative Episode Engine**: yayın isteğine sabit “episode identity”
 * (seri numara, zincir, çağ etiketi, görünen başlık) — Castle History + YouTube hint ile hizalı.
 */

export const NARRATIVE_EPISODE_ENGINE_SCHEMA_V0 = "castle.rhizoh.narrative_episode_engine.v0";
export const NARRATIVE_EPISODE_IDENTITY_SCHEMA_V0 = "castle.rhizoh.narrative_episode_identity.v0";

/** Aynı arc içinde aynı bölüm numarası (bundle) penceresi. */
const BUNDLE_GAP_MS = 45 * 60 * 1000;

/** @returns {Record<string, unknown>} */
export function createInitialNarrativeEpisodeEngineStateV0() {
  return {
    schema: NARRATIVE_EPISODE_ENGINE_SCHEMA_V0,
    narrativeChainId: "castle.genesis.narrative_chain.v0",
    eraTag: "GENESIS",
    /** 0 = henüz yayın kimliği yok; ilk publish’te tohumlanır. */
    activeEpisodeSerial: 0,
    bundleArcId: "",
    bundleOpenedAtMs: 0
  };
}

/**
 * @param {{ schema?: string, episodes?: unknown[] }|null|undefined} book
 */
function seedSerialFromBookV0(book) {
  const b = book && typeof book === "object" ? book : null;
  const eps = b != null && Array.isArray(b.episodes) ? b.episodes : [];
  const n = eps.length;
  return Math.max(1, Math.min(10_000, n > 0 ? n + 1 : 1));
}

/**
 * @param {Record<string, unknown>|null|undefined} engine
 * @param {Record<string, unknown>|null|undefined} distributor
 * @param {{ schema?: string, episodes?: unknown[] }|null|undefined} book
 * @param {number} nowMs
 */
export function resolveNarrativeEpisodeForPublishV0(engine, distributor, book, nowMs) {
  const e0 = engine && typeof engine === "object" ? engine : createInitialNarrativeEpisodeEngineStateV0();
  const d = distributor && typeof distributor === "object" ? distributor : null;
  const y = d?.youtubePipelineHint && typeof d.youtubePipelineHint === "object" ? d.youtubePipelineHint : null;
  const arcId = y && typeof y.narrativeArcId === "string" ? y.narrativeArcId : "castle.unknown.arc.v0";
  const defaultTitle =
    y && typeof y.defaultEpisodeTitle === "string" ? String(y.defaultEpisodeTitle).slice(0, 120) : "Castle Live";

  const now = Math.max(0, Number(nowMs) || Date.now());
  const cur = Math.max(0, Math.floor(Number(e0.activeEpisodeSerial) || 0));
  const bundleArc = String(e0.bundleArcId || "");
  const opened = Math.max(0, Number(e0.bundleOpenedAtMs) || 0);
  const sameArc = bundleArc.length > 0 && bundleArc === arcId;
  const inBundle = sameArc && opened > 0 && now - opened < BUNDLE_GAP_MS;

  const seed = seedSerialFromBookV0(book);
  let episodeSerial;
  if (inBundle) {
    episodeSerial = cur <= 0 ? seed : cur;
  } else {
    const base = cur <= 0 ? Math.max(0, seed - 1) : cur;
    episodeSerial = base + 1;
  }

  const displayTitle = `Castle Genesis Episode #${episodeSerial} — ${defaultTitle}`;

  const episode = {
    schema: NARRATIVE_EPISODE_IDENTITY_SCHEMA_V0,
    episodeSerial,
    episodeDisplayTitle: displayTitle.slice(0, 200),
    narrativeArcId: arcId,
    narrativeChainId: String(e0.narrativeChainId || "castle.genesis.narrative_chain.v0"),
    eraTag: String(e0.eraTag || "GENESIS"),
    bundleContinues: inBundle,
    bundleOpenedAtMs: inBundle ? opened : now,
    defaultEpisodeTitle: defaultTitle
  };

  const nextEngine = {
    ...e0,
    schema: NARRATIVE_EPISODE_ENGINE_SCHEMA_V0,
    activeEpisodeSerial: episodeSerial,
    bundleArcId: arcId,
    bundleOpenedAtMs: inBundle ? opened : now
  };

  return { episode, nextEngine };
}
