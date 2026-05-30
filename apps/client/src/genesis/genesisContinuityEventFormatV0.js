/** @param {{ type?: string, id?: string, seq?: number, payload?: Record<string, unknown> }} ev */
export function formatGenesisContinuityEventLine(ev) {
  const seqTag = typeof ev.seq === "number" ? `#${ev.seq} · ` : "";
  const t = String(ev.type || "unknown");
  const p = ev.payload && typeof ev.payload === "object" ? ev.payload : {};
  let body;
  switch (t) {
    case "TickAdvanced":
      body = `tick · ${p.value}`;
      break;
    case "SealIssued":
      body = `seal · ${String(p.sealHash || "").slice(0, 12)}…`;
      break;
    case "LedgerAdvanced":
      body = `ledger · +${p.delta} → total ${p.total}`;
      break;
    case "ReplayState":
      body = `replay · ${String(p.alignment || "—")}${p.divergenceTotal != null ? ` div=${p.divergenceTotal}` : ""}`;
      break;
    case "PresenceMesh":
      body = `mesh · uids ${p.uniqueClientUids ?? "—"} · maxSeq ${p.maxSeqAcrossRooms ?? 0}`;
      break;
    case "InfraHealth":
      body = `infra · ${p.status ?? "—"} · err ${p.errors ?? 0} · q ${p.queueDepth ?? 0}`;
      break;
    case "SpiralWebSocket":
      body = `spiral ws · clients ${p.clientsActive ?? 0}`;
      break;
    case "ReplayFingerprint":
      body = `fingerprint · ${String(p.short || "—")} · div ${p.basis?.divergenceTotal ?? "—"}`;
      break;
    case "RuntimeCapabilityEvent":
      body = `cap · ${p.nodeRole ?? "—"} · llm ${p.llmConfigured ? "on" : "off"} · persist ${p.persistence ?? "—"}`;
      break;
    case "WorldObservation":
      body = `${String(p.observationType || "obs")} · ${String(p.clientId || "").slice(0, 12) || "client"}`;
      break;
    default:
      body = `${t} · ${String(ev.id || "")}`;
  }
  return `${seqTag}${body}`;
}

export const GENESIS_CONTINUITY_EVENT_SCHEMA = "castle.genesis.continuity_event.v0";
