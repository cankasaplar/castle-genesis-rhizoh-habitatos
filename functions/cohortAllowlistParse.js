/**
 * @param {string} raw
 * @returns {string[]}
 */
function parseCohortEmailAllowlist(raw) {
  const s = String(raw || "").trim();
  if (!s) return [];
  return s
    .split(/[,;\n\r]+/)
    .map((x) => String(x).trim().toLowerCase())
    .filter(Boolean);
}

module.exports = { parseCohortEmailAllowlist };
