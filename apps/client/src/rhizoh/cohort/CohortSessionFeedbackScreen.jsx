import React, { useState } from "react";
import { readCohortFeedbackParamsFromUrlV0 } from "./cohortFeedbackUrlV0.js";

/**
 * Post-session human feedback — no technical jargon.
 */
export function CohortSessionFeedbackScreen() {
  const params = readCohortFeedbackParamsFromUrlV0();
  const [notes, setNotes] = useState("");
  const [status, setStatus] = useState("");

  return (
    <div className="min-h-screen bg-[#0a1020] text-white flex items-center justify-center p-6 normal-case">
      <div className="max-w-lg w-full rounded-2xl border border-violet-400/25 bg-violet-950/20 p-6 space-y-4">
        <h1 className="text-lg font-semibold text-violet-100">Rhizoh — kısa geri bildirim</h1>
        <p className="text-sm text-white/70 leading-relaxed">
          Oturumun bitti. Rhizoh&apos;u nasıl hissettiğini birkaç cümleyle yazabilirsin: ne meraklandırdı, nerede
          duraksadın, ne canlı geldi?
        </p>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={6}
          placeholder="Hissettiklerini buraya yaz…"
          className="w-full rounded-xl border border-white/15 bg-black/35 px-3 py-2 text-sm text-white placeholder:text-white/40"
        />
        <button
          type="button"
          disabled={!notes.trim() || status === "sending"}
          className="w-full rounded-xl bg-violet-500/80 hover:bg-violet-400/90 disabled:opacity-40 px-4 py-2 text-sm font-semibold"
          onClick={async () => {
            setStatus("sending");
            try {
              const res = await fetch("/api/cohortFeedbackSubmitV0", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  schema: "castle.rhizoh.cohort_feedback_submit.v0",
                  reviewerId: params.reviewerId,
                  sessionRef: params.sessionRef,
                  notes: notes.trim().slice(0, 4000)
                })
              });
              const json = await res.json().catch(() => ({}));
              setStatus(json?.ok ? "sent" : "error");
            } catch {
              setStatus("error");
            }
          }}
        >
          Gönder
        </button>
        {status === "sent" ? (
          <p className="text-sm text-emerald-300/90">Teşekkürler — notların alındı.</p>
        ) : null}
        {status === "error" ? (
          <p className="text-sm text-amber-300/90">Gönderilemedi; biraz sonra tekrar deneyebilirsin.</p>
        ) : null}
      </div>
    </div>
  );
}
