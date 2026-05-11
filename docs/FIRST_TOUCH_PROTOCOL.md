# First-touch protocol — welcome layer ↔ Observation Fabric

**SPECFLOW:** `FUTURE-PROOF-ONLY` — **interpretation / UX contract**, execution değildir.

Karşılama, **Attested Boot Observation Artifact** (ABOA) olarak ele alınır — [`BOOT_ARTIFACT_PROTOCOL.md`](BOOT_ARTIFACT_PROTOCOL.md) canonical invariant’ları geçerlidir.

**Canonical metin:** [`WELCOME_RHIZOH.md`](WELCOME_RHIZOH.md)

**Kod:** `rhizohWelcomeEpistemicV1.js` · `RHIZOH_FIRST_TOUCH_EPISTEMIC_VERSION` · `schemaVersion` (`ABOA-1`) · `buildBootObservationProvenance`

**Registry:** [`OBSERVATION_EVENT_REGISTRY.md`](OBSERVATION_EVENT_REGISTRY.md)

---

## First-touch özeti

- **`primary`:** Sürüm içinde **sabit** canonical declaration; faz metni **değiştirmez** (Invariant 2).
- **`provenance`:** Emit bağlamı — `phase`, `scenario`, `fieldSnapshot`, `driftState` (metadata); `UNKNOWN` geçerli.
- **Seal:** Kanonik payload fingerprint + `emittedAt`.

**Gözlem:** `window.__rhizoh.debug().bootObservationArtifact` (ve legacy `welcomeArtifact` alias).

---

## İlgili

- [`BOOT_ARTIFACT_PROTOCOL.md`](BOOT_ARTIFACT_PROTOCOL.md)  
- [`OBSERVATION_FABRIC_V1.md`](OBSERVATION_FABRIC_V1.md)  
- [`CURSOR_AGENT_INTRO.md`](CURSOR_AGENT_INTRO.md)
