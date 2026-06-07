import React, { memo, useCallback, useEffect, useMemo, useState } from "react";
import {
  RHIZOH_EVENT_SURFACE_FOCUS_EVENT_V12,
  RHIZOH_EVENT_TYPE_V12,
  attachRhizohEventToExperienceSessionV12,
  createRhizohEventV12,
  loadRhizohEventRecordV12,
  propagateRhizohEventCatalogV12
} from "../rhizoh/experience/rhizohEventSurfaceV12.js";
import { loadRhizohExperienceSessionContextV0 } from "../rhizoh/experience/rhizohExperienceSessionContextV0.js";
import { buildRhizohEventInviteLinkWithSyncV1 } from "../rhizoh/experience/rhizohEventCatalogSyncV1.js";
import {
  recordCohortFunnelStepOnceV1,
  RHIZOH_COHORT_FUNNEL_STEP_V1
} from "../rhizoh/experience/rhizohCohortFunnelRingV1.js";

const EVENT_TYPES_V12 = Object.freeze([
  { id: RHIZOH_EVENT_TYPE_V12.LIVE, label: "Live" },
  { id: RHIZOH_EVENT_TYPE_V12.SCHEDULED, label: "Scheduled" },
  { id: RHIZOH_EVENT_TYPE_V12.VISIT, label: "Visit" },
  { id: RHIZOH_EVENT_TYPE_V12.CONCERT, label: "Concert · Octo" }
]);

/**
 * Minimal event create + invite link — inside existing drawer (no new route).
 * @param {{
 *   experienceSessionId?: string | null,
 *   productSessionId?: string | null,
 *   authUid?: string | null,
 *   uiLocale?: string
 * }} props
 */
export const RhizohEventCreatePanelV12 = memo(function RhizohEventCreatePanelV12({
  experienceSessionId = null,
  productSessionId = null,
  authUid = null,
  uiLocale = "en"
}) {
  const tr = uiLocale === "tr";
  const [title, setTitle] = useState("");
  const [type, setType] = useState(RHIZOH_EVENT_TYPE_V12.SCHEDULED);
  const [status, setStatus] = useState("");
  const [created, setCreated] = useState(null);
  const [focusCreate, setFocusCreate] = useState(false);

  const activeEventId = useMemo(() => {
    try {
      return loadRhizohExperienceSessionContextV0()?.eventId || null;
    } catch {
      return null;
    }
  }, [created]);

  const activeEvent = useMemo(
    () => (activeEventId ? loadRhizohEventRecordV12(activeEventId) : null),
    [activeEventId, created]
  );

  useEffect(() => {
    const onFocus = (event) => {
      if (String(event?.detail?.mode || "") === "create") {
        setFocusCreate(true);
      }
    };
    window.addEventListener(RHIZOH_EVENT_SURFACE_FOCUS_EVENT_V12, onFocus);
    return () => window.removeEventListener(RHIZOH_EVENT_SURFACE_FOCUS_EVENT_V12, onFocus);
  }, []);

  const onCreate = useCallback(() => {
    setStatus(tr ? "oluşturuluyor…" : "creating…");
    const expId =
      experienceSessionId ||
      loadRhizohExperienceSessionContextV0()?.experienceSessionId ||
      null;
    const result = createRhizohEventV12({
      title,
      type,
      experienceSessionId: expId,
      productSessionId
    });
    if (!result.ok) {
      setStatus(tr ? "oluşturulamadı" : "create failed");
      return;
    }
    attachRhizohEventToExperienceSessionV12(loadRhizohExperienceSessionContextV0(), result.record);
    recordCohortFunnelStepOnceV1(RHIZOH_COHORT_FUNNEL_STEP_V1.EVENT_CREATE, {
      eventId: result.eventId
    });
    void propagateRhizohEventCatalogV12(result.record, { uid: authUid });
    setCreated({ ...result, inviteLink: buildRhizohEventInviteLinkWithSyncV1(result.record) });
    setStatus(tr ? "hazır — davet linkini paylaş" : "ready — share invite link");
    setFocusCreate(false);
  }, [title, type, experienceSessionId, productSessionId, authUid, tr]);

  const copyInvite = useCallback(async () => {
    const link = created?.inviteLink || activeEvent?.inviteLink;
    if (!link) return;
    try {
      await navigator.clipboard.writeText(link);
      setStatus(tr ? "link kopyalandı" : "link copied");
    } catch {
      setStatus(link);
    }
  }, [created, activeEvent, tr]);

  const displayLink = created?.inviteLink || activeEvent?.inviteLink || "";

  return (
    <div
      className="rounded-xl border border-fuchsia-400/25 bg-fuchsia-950/15 p-3 space-y-3 normal-case"
      data-rhizoh-event-surface="create-v12"
      data-rhizoh-event-active={activeEventId || ""}
    >
      <div>
        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-fuchsia-200/90">
          {tr ? "Deneyim oluştur" : "Create experience"}
        </p>
        <p className="text-[10px] text-white/55">
          {tr
            ? "Paylaşılan deneyim — aynı T0 dünyası, yeni shell yok."
            : "Shared experience container — same T0 world, no new shell."}
        </p>
      </div>

      {activeEvent && !created ? (
        <div className="rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-[10px] text-white/70">
          {tr ? "Aktif deneyim" : "Active experience"}:{" "}
          <span className="text-fuchsia-100">{activeEvent.title}</span>
          <span className="text-white/40"> · {activeEvent.eventId}</span>
        </div>
      ) : null}

      <label className="block space-y-1">
        <span className="text-[9px] uppercase tracking-wide text-white/45">
          {tr ? "Başlık" : "Title"}
        </span>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder={tr ? "Cuma akşamı canlı…" : "Friday night live…"}
          className={`w-full rounded-lg border bg-black/40 px-3 py-2 text-[11px] text-white outline-none transition ${
            focusCreate ? "border-fuchsia-400/60 ring-1 ring-fuchsia-400/30" : "border-white/15"
          }`}
          maxLength={120}
        />
      </label>

      <label className="block space-y-1">
        <span className="text-[9px] uppercase tracking-wide text-white/45">
          {tr ? "Tür" : "Type"}
        </span>
        <select
          value={type}
          onChange={(e) => setType(e.target.value)}
          className="w-full rounded-lg border border-white/15 bg-black/40 px-3 py-2 text-[11px] text-white outline-none"
        >
          {EVENT_TYPES_V12.map((row) => (
            <option key={row.id} value={row.id}>
              {row.label}
            </option>
          ))}
        </select>
      </label>

      <p className="text-[9px] text-white/40">
        {tr ? "Görünürlük: yalnızca davet (varsayılan)" : "Visibility: invite-only (default)"}
      </p>

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={onCreate}
          disabled={!title.trim()}
          className="rounded-lg border border-fuchsia-400/45 bg-fuchsia-500/15 px-3 py-1.5 text-[9px] font-bold uppercase tracking-wide text-fuchsia-100 disabled:opacity-40"
        >
          {tr ? "Deneyim oluştur" : "Create event"}
        </button>
        {displayLink ? (
          <button
            type="button"
            onClick={copyInvite}
            className="rounded-lg border border-cyan-400/35 bg-cyan-500/10 px-3 py-1.5 text-[9px] font-bold uppercase tracking-wide text-cyan-100"
          >
            {tr ? "Davet linki" : "Copy invite"}
          </button>
        ) : null}
      </div>

      {displayLink ? (
        <div className="rounded-lg border border-white/10 bg-black/35 px-3 py-2">
          <p className="text-[8px] uppercase tracking-wide text-white/40">
            {tr ? "Davet linki" : "Invite link"}
          </p>
          <p className="mt-1 break-all text-[10px] text-cyan-100/90">{displayLink}</p>
        </div>
      ) : null}

      {status ? <p className="text-[9px] text-white/50">{status}</p> : null}
    </div>
  );
});
