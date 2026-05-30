const fs = require("fs");
const path = require("path");
const { parseCohortEmailAllowlist } = require("./cohortAllowlistParse");

/**
 * Sunucu kohort kapısı: COHORT_EMAIL_ALLOWLIST env öncelikli; yoksa cohort-email-allowlist.v0.json.
 * @returns {string[]}
 */
function loadCohortEmailAllowlistV0() {
  const fromEnv = parseCohortEmailAllowlist(process.env.COHORT_EMAIL_ALLOWLIST || "");
  if (fromEnv.length) return fromEnv;
  try {
    const p = path.join(__dirname, "cohort-email-allowlist.v0.json");
    const raw = JSON.parse(fs.readFileSync(p, "utf8"));
    const emails = Array.isArray(raw?.emails) ? raw.emails : [];
    return parseCohortEmailAllowlist(emails.join(","));
  } catch {
    return [];
  }
}

module.exports = { loadCohortEmailAllowlistV0 };
