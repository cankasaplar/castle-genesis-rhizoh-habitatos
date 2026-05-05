/**
 * Presence room mesh — HTTP + SSE transport (gateway `/presence/mesh/*`).
 * Auth: `X-Castle-Guest-Id` on POST; SSE uses `guestId` query (EventSource cannot set headers).
 */
import { getCastleFlightConfig } from "../../castleFlight/castleFlightConfig";
import {
  getOrCreateCastleDevUid,
  getRhizohGatewayHealthBase,
  getRhizohApiBase
} from "../../rhizoh/useRhizohGatewayMonitor.js";
import { getOrCreateEphemeralGuestOwnerId } from "../lib/ephemeralGuestIdentity";

export type PresenceMeshDeltaEvent = {
  kind: "delta";
  seq: number;
  roomUid: string;
  node: unknown;
  projectionPatch?: unknown;
  serverAt: number;
  clientUid?: string;
  writerSubject?: string | null;
};

export type PresenceMeshHelloEvent = { kind: "hello"; roomUid: string; seq: number };
export type PresenceMeshMemberEvent = {
  kind: "member_join" | "member_leave";
  roomUid: string;
  clientUid?: string;
  seq?: number;
};

export type PresenceMeshEvent = PresenceMeshDeltaEvent | PresenceMeshHelloEvent | PresenceMeshMemberEvent;

export function resolvePresenceMeshHttpBase(): string {
  const explicit = String(import.meta.env.VITE_GATEWAY_MESH_HTTP || "").trim();
  if (explicit) return explicit.replace(/\/+$/, "");
  const hb = getRhizohGatewayHealthBase();
  if (hb) return hb.replace(/\/+$/, "");
  const api = getRhizohApiBase();
  return api ? api.replace(/\/+$/, "") : "";
}

function meshHeaders(): Record<string, string> {
  const h: Record<string, string> = {
    "Content-Type": "application/json",
    "X-Castle-Guest-Id": getOrCreateEphemeralGuestOwnerId(),
    "X-Castle-Dev-Uid": getOrCreateCastleDevUid()
  };
  const token = String(getCastleFlightConfig().gatewayToken || "").trim();
  if (token) h.Authorization = `Bearer ${token}`;
  return h;
}

function normalizeSsePayload(raw: unknown): PresenceMeshEvent | null {
  if (!raw || typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;
  const t = o.type;
  if (t === "hello" && typeof o.roomUid === "string") {
    return { kind: "hello", roomUid: o.roomUid, seq: Number(o.seq) || 0 };
  }
  if ((t === "member_join" || t === "member_leave") && typeof o.roomUid === "string") {
    return {
      kind: t,
      roomUid: o.roomUid,
      clientUid: typeof o.clientUid === "string" ? o.clientUid : undefined,
      seq: typeof o.seq === "number" ? o.seq : undefined
    };
  }
  if (t === "delta" && typeof o.roomUid === "string" && typeof o.seq === "number") {
    return {
      kind: "delta",
      seq: o.seq,
      roomUid: o.roomUid,
      node: o.node,
      projectionPatch: o.projectionPatch,
      serverAt: typeof o.serverAt === "number" ? o.serverAt : Number(o.ts) || Date.now(),
      clientUid: typeof o.clientUid === "string" ? o.clientUid : undefined,
      writerSubject: o.writerSubject != null ? String(o.writerSubject) : null
    };
  }
  return null;
}

export type PresenceMeshClientOptions = {
  baseUrl?: string;
};

export class PresenceMeshClient {
  private readonly opts: PresenceMeshClientOptions;
  private es: EventSource | null = null;
  private roomUid: string | null = null;
  private readonly cbs = new Set<(ev: PresenceMeshEvent) => void>();
  private lastSeq = 0;
  private closed = false;

  constructor(opts: PresenceMeshClientOptions = {}) {
    this.opts = opts;
  }

  getLastSeq(): number {
    return this.lastSeq;
  }

  getRoomUid(): string | null {
    return this.roomUid;
  }

  subscribe(cb: (ev: PresenceMeshEvent) => void): () => void {
    this.cbs.add(cb);
    return () => this.cbs.delete(cb);
  }

  private emit(ev: PresenceMeshEvent) {
    if (ev.kind === "delta") this.lastSeq = Math.max(this.lastSeq, ev.seq);
    for (const cb of this.cbs) {
      try {
        cb(ev);
      } catch (e) {
        console.error("[presenceMeshClient] subscriber", e);
      }
    }
  }

  private base(): string {
    const b = (this.opts.baseUrl || resolvePresenceMeshHttpBase()).trim();
    return b.replace(/\/+$/, "");
  }

  async connect(roomUid: string): Promise<boolean> {
    this.disconnect(false);
    const base = this.base();
    if (!base || !roomUid) return false;
    this.roomUid = roomUid;
    this.closed = false;
    try {
      const jr = await fetch(`${base}/presence/mesh/join`, {
        method: "POST",
        headers: meshHeaders(),
        body: JSON.stringify({ roomUid })
      });
      if (!jr.ok) {
        console.warn("[presenceMeshClient] join failed", jr.status);
        return false;
      }
    } catch (e) {
      console.warn("[presenceMeshClient] join error", e);
      return false;
    }
    const guest = encodeURIComponent(getOrCreateEphemeralGuestOwnerId());
    const url = `${base}/presence/mesh/subscribe?roomUid=${encodeURIComponent(roomUid)}&guestId=${guest}`;
    try {
      this.es = new EventSource(url);
    } catch (e) {
      console.warn("[presenceMeshClient] EventSource", e);
      return false;
    }
    this.es.onmessage = (msg) => {
      if (this.closed || !msg.data) return;
      let raw: unknown;
      try {
        raw = JSON.parse(msg.data);
      } catch {
        return;
      }
      const ev = normalizeSsePayload(raw);
      if (ev) this.emit(ev);
    };
    this.es.onerror = () => {
      /* browser auto-reconnects EventSource */
    };
    return true;
  }

  disconnect(callLeave = true): void {
    this.closed = true;
    if (this.es) {
      try {
        this.es.close();
      } catch {
        /* ignore */
      }
      this.es = null;
    }
    const ru = this.roomUid;
    this.roomUid = null;
    if (callLeave && ru) {
      const base = this.base();
      if (base) {
        void fetch(`${base}/presence/mesh/leave`, {
          method: "POST",
          headers: meshHeaders(),
          body: JSON.stringify({ roomUid: ru })
        }).catch(() => {});
      }
    }
  }

  async publish(
    node: unknown,
    projectionPatch?: unknown,
    extra?: { writerSubject?: string }
  ): Promise<{ ok: boolean; seq?: number; error?: string }> {
    const ru = this.roomUid;
    const base = this.base();
    if (!ru || !base) return { ok: false, error: "not_connected" };
    try {
      const res = await fetch(`${base}/presence/mesh/delta`, {
        method: "POST",
        headers: meshHeaders(),
        body: JSON.stringify({
          roomUid: ru,
          node,
          projectionPatch,
          ...(extra?.writerSubject ? { writerSubject: extra.writerSubject } : {})
        })
      });
      const j = (await res.json().catch(() => null)) as { ok?: boolean; seq?: number; error?: string } | null;
      if (!res.ok || !j?.ok) return { ok: false, error: String(j?.error || res.status) };
      return { ok: true, seq: typeof j.seq === "number" ? j.seq : undefined };
    } catch (e) {
      return { ok: false, error: String(e) };
    }
  }

  async snapshot(): Promise<unknown> {
    const ru = this.roomUid;
    const base = this.base();
    if (!ru || !base) return null;
    const res = await fetch(`${base}/presence/mesh/snapshot`, {
      method: "POST",
      headers: meshHeaders(),
      body: JSON.stringify({ roomUid: ru })
    });
    return res.json().catch(() => null);
  }

  async replay(query: { fromSeq?: number; fromNodeId?: string }): Promise<unknown> {
    const ru = this.roomUid;
    const base = this.base();
    if (!ru || !base) return null;
    const body: Record<string, unknown> = { roomUid: ru };
    if (query.fromNodeId != null) body.fromNodeId = query.fromNodeId;
    else if (query.fromSeq != null) body.fromSeq = query.fromSeq;
    const res = await fetch(`${base}/presence/mesh/replay`, {
      method: "POST",
      headers: meshHeaders(),
      body: JSON.stringify(body)
    });
    return res.json().catch(() => null);
  }

  /**
   * If local `lastSeq` is behind `minSeq`, fetch replay and emit `delta` events for subscribers (ingest handles dedup).
   */
  async reconcile(minSeq: number): Promise<void> {
    if (this.lastSeq >= minSeq) return;
    const fromSeq = this.lastSeq + 1;
    const raw = await this.replay({ fromSeq });
    if (!raw || typeof raw !== "object") return;
    const entries = (raw as { entries?: unknown[] }).entries;
    if (!Array.isArray(entries)) return;
    const ru = this.roomUid;
    if (!ru) return;
    for (const ent of entries) {
      if (!ent || typeof ent !== "object") continue;
      const e = ent as Record<string, unknown>;
      const seq = typeof e.seq === "number" ? e.seq : 0;
      if (seq < fromSeq) continue;
      this.emit({
        kind: "delta",
        seq,
        roomUid: ru,
        node: e.node,
        projectionPatch: e.projectionPatch,
        serverAt: typeof e.ts === "number" ? e.ts : Date.now(),
        clientUid: typeof e.clientUid === "string" ? e.clientUid : undefined,
        writerSubject: e.writerSubject != null ? String(e.writerSubject) : null
      });
    }
  }
}
