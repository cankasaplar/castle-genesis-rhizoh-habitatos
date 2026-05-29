const logger = require("firebase-functions/logger");
const { sendRhizohHtmlMailV0, opsInbox } = require("./lib/smtpMailV0");

function escapeHtml(s) {
  return String(s || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/**
 * @param {{ reviewerId?: string, sessionRef?: string, feedbackUrl?: string, email?: string | null }} body
 * @param {string | null} tokenEmail verified token email if any
 */
async function handleCohortSessionFeedbackMailV0(body, tokenEmail) {
  const reviewerId = String(body?.reviewerId || "metehan").trim().toLowerCase();
  const sessionRef = String(body?.sessionRef || "").trim();
  const feedbackUrl =
    String(body?.feedbackUrl || "").trim() ||
    `https://rhizoh.com/?cohort=feedback&reviewer=${encodeURIComponent(reviewerId)}&session=${encodeURIComponent(sessionRef)}`;
  const to = String(tokenEmail || body?.email || "").trim().toLowerCase();
  if (!to || !to.includes("@")) {
    return { ok: false, reason: "missing_observer_email" };
  }
  if (!sessionRef) {
    return { ok: false, reason: "missing_session_ref" };
  }

  const html = `<!DOCTYPE html><html lang="tr"><body style="font-family:system-ui,sans-serif;color:#111;max-width:560px">
<p>Merhaba,</p>
<p>Rhizoh oturumun sona erdi. Birkaç dakikalık geri bildirimin, deneyimi anlamamıza çok yardımcı olur.</p>
<p><a href="${escapeHtml(feedbackUrl)}" style="display:inline-block;padding:12px 18px;background:#5b21b6;color:#fff;text-decoration:none;border-radius:8px">Geri bildirimini yaz</a></p>
<p style="font-size:13px;color:#555">Teknik detay gerekmez — sadece ne hissettiğini yazman yeterli.</p>
<p style="font-size:12px;color:#888">Rhizoh · observe@rhizoh.com</p>
</body></html>`;

  await sendRhizohHtmlMailV0({
    to,
    subject: "Rhizoh — oturum geri bildirimi",
    html
  });

  logger.info("cohort_session_feedback_mail_sent", { reviewerId, sessionRef, toDomain: to.split("@")[1] });
  return { ok: true };
}

/**
 * @param {{ reviewerId?: string, sessionRef?: string, notes?: string, email?: string | null }} body
 * @param {string | null} tokenEmail
 */
async function handleCohortFeedbackSubmitV0(body, tokenEmail) {
  const reviewerId = String(body?.reviewerId || "metehan").trim().toLowerCase();
  const sessionRef = String(body?.sessionRef || "").trim();
  const notes = String(body?.notes || "").trim().slice(0, 4000);
  if (!notes) return { ok: false, reason: "empty_notes" };

  const observerEmail = String(tokenEmail || body?.email || "").trim().toLowerCase();
  const ops = opsInbox();

  const html = `<!DOCTYPE html><html lang="tr"><body style="font-family:system-ui,sans-serif;color:#111;max-width:640px">
<h2 style="font-size:16px">Cohort feedback</h2>
<p><strong>Reviewer:</strong> ${escapeHtml(reviewerId)}<br/>
<strong>Session:</strong> ${escapeHtml(sessionRef || "—")}<br/>
<strong>Observer:</strong> ${escapeHtml(observerEmail || "—")}</p>
<pre style="white-space:pre-wrap;background:#f4f4f5;padding:12px;border-radius:8px">${escapeHtml(notes)}</pre>
</body></html>`;

  if (ops) {
    await sendRhizohHtmlMailV0({
      to: ops,
      subject: `Rhizoh cohort feedback · ${reviewerId}${sessionRef ? ` · ${sessionRef}` : ""}`,
      html,
      replyTo: observerEmail || undefined
    });
  }

  if (observerEmail && observerEmail.includes("@")) {
    await sendRhizohHtmlMailV0({
      to: observerEmail,
      subject: "Rhizoh — geri bildirimin alındı",
      html: `<p>Teşekkürler — notların kaydedildi.</p><p style="color:#666;font-size:13px">Rhizoh</p>`
    });
  }

  logger.info("cohort_feedback_submit", { reviewerId, sessionRef, noteLen: notes.length });
  return { ok: true };
}

module.exports = {
  handleCohortSessionFeedbackMailV0,
  handleCohortFeedbackSubmitV0
};
