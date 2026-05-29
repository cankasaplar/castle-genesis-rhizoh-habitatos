const nodemailer = require("nodemailer");

function smtpConfig() {
  const user = String(process.env.SPIRALMMO_SMTP_USER || process.env.RHIZOH_SMTP_USER || "").trim();
  const pass = String(process.env.SPIRALMMO_SMTP_APP_PASSWORD || process.env.RHIZOH_SMTP_APP_PASSWORD || "")
    .replace(/\s/g, "")
    .trim();
  const host = String(process.env.RHIZOH_SMTP_HOST || "smtp.gmail.com").trim();
  const port = Number(process.env.RHIZOH_SMTP_PORT || 587);
  return { user, pass, host, port };
}

function cohortFromIdentity() {
  return {
    address: String(process.env.RHIZOH_MAIL_COHORT_FROM || "observe@rhizoh.com").trim(),
    name: String(process.env.RHIZOH_MAIL_COHORT_FROM_NAME || "Rhizoh").trim(),
    replyTo: String(process.env.RHIZOH_MAIL_COHORT_REPLY_TO || "observe@rhizoh.com").trim()
  };
}

function opsInbox() {
  return String(process.env.SPIRALMMO_REPORT_TO || process.env.RHIZOH_COHORT_OPS_TO || "").trim();
}

/**
 * @param {{ to: string, subject: string, html: string, text?: string, replyTo?: string }} msg
 */
async function sendRhizohHtmlMailV0(msg) {
  const { user, pass, host, port } = smtpConfig();
  if (!user || !pass) {
    const err = new Error("smtp_unconfigured");
    err.code = "smtp_unconfigured";
    throw err;
  }
  const from = cohortFromIdentity();
  const transporter = nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass }
  });

  await transporter.sendMail({
    from: `"${from.name}" <${from.address}>`,
    to: msg.to,
    replyTo: msg.replyTo || from.replyTo,
    subject: msg.subject,
    html: msg.html,
    text: msg.text || msg.html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim()
  });
}

module.exports = {
  sendRhizohHtmlMailV0,
  cohortFromIdentity,
  opsInbox,
  smtpConfig
};
