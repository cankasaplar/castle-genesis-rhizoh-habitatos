/**
 * Derive human-readable continuity micro-lines from successive gateway genesis snapshots.
 * No synthetic events — only deltas on real fields.
 * @param {Record<string, unknown> | null} prev
 * @param {Record<string, unknown> | null} next
 * @returns {{ at: string, line: string }[]}
 */
export function diffGenesisRuntimeSnapshots(prev, next) {
  if (!next || typeof next !== "object") return [];
  const ts =
    typeof next.serverTime === "number"
      ? new Date(next.serverTime).toISOString().slice(11, 19)
      : "";
  if (!prev || typeof prev !== "object") {
    return [{ at: ts, line: "sync · observer bound to gateway surface" }];
  }

  /** @param {unknown} o @param {string} path */
  const n = (o, path) => {
    const parts = path.split(".");
    let x = o;
    for (const p of parts) {
      if (x == null || typeof x !== "object") return undefined;
      x = /** @type {Record<string, unknown>} */ (x)[p];
    }
    return x;
  };

  const out = [];

  const pt = n(prev, "canonicalTick.value");
  const nt = n(next, "canonicalTick.value");
  if (typeof nt === "number" && typeof pt === "number" && nt > pt) {
    out.push({ at: ts, line: `tick · ${pt}→${nt}` });
  }

  const ps = n(prev, "lastEpistemicSeal.sealHash");
  const ns = n(next, "lastEpistemicSeal.sealHash");
  if (typeof ns === "string" && ns && ns !== ps) {
    out.push({ at: ts, line: `seal · ${ns.slice(0, 10)}…${ns.slice(-6)}` });
  }

  const pl = Number(n(prev, "epistemicLedger.entriesPersistedTotal"));
  const nl = Number(n(next, "epistemicLedger.entriesPersistedTotal"));
  if (Number.isFinite(nl) && Number.isFinite(pl) && nl > pl) {
    out.push({ at: ts, line: `ledger · +${nl - pl} → total ${nl}` });
  }

  const pm = n(prev, "presenceMesh.uniqueClientUids");
  const nm = n(next, "presenceMesh.uniqueClientUids");
  if (nm !== pm && (nm !== undefined || pm !== undefined)) {
    out.push({ at: ts, line: `presence · ${pm ?? "—"}→${nm ?? "—"} uids` });
  }

  const pra = n(prev, "replay.alignment");
  const nra = n(next, "replay.alignment");
  const prd = n(prev, "replay.divergenceTotal");
  const nrd = n(next, "replay.divergenceTotal");
  if (nra !== pra || nrd !== prd) {
    const div = nrd != null ? ` div=${nrd}` : "";
    out.push({ at: ts, line: `replay · ${String(nra ?? "—")}${div}` });
  }

  const pis = n(prev, "infra.status");
  const nis = n(next, "infra.status");
  if (nis !== pis) {
    out.push({ at: ts, line: `infra · ${String(pis ?? "—")}→${String(nis ?? "—")}` });
  }

  const pie = n(prev, "infra.errors");
  const nie = n(next, "infra.errors");
  if (typeof nie === "number" && typeof pie === "number" && nie !== pie) {
    out.push({ at: ts, line: `errors · ${pie}→${nie}` });
  }

  const psw = n(prev, "spiralWebSocket.clientsActive");
  const nsw = n(next, "spiralWebSocket.clientsActive");
  if (nsw !== psw && (nsw !== undefined || psw !== undefined)) {
    out.push({ at: ts, line: `spiral ws · ${psw ?? "—"}→${nsw ?? "—"}` });
  }

  return out;
}
