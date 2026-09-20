import openingsCompact from "./openings_compact.json";

/**
 * Identifies the current chess opening and variation from a sequence of UCI moves.
 * Backtracks from the longest prefix to 1 ply to find the deepest theoretical match.
 * 
 * @param {string[]|string} moves - Array of UCI move strings (e.g. ['e2e4', 'c7c5']) or space-separated string
 * @returns {object} { eco, name, variation, fullName, ply, inTheory, prefix }
 */
export function identifyOpeningTheory(moves) {
  if (!moves) {
    return {
      eco: "---",
      name: "Starting Position",
      variation: "",
      fullName: "Starting Position",
      ply: 0,
      inTheory: true,
      prefix: ""
    };
  }

  const moveArray = Array.isArray(moves)
    ? moves.map(m => String(m).trim().toLowerCase()).filter(Boolean)
    : String(moves).trim().toLowerCase().split(/\s+/).filter(Boolean);

  if (moveArray.length === 0) {
    return {
      eco: "---",
      name: "Starting Position",
      variation: "",
      fullName: "Starting Position",
      ply: 0,
      inTheory: true,
      prefix: ""
    };
  }

  // Backtrack from full game length to find the deepest named variation in our CC0 database
  for (let len = moveArray.length; len >= 1; len--) {
    const prefix = moveArray.slice(0, len).join(" ");
    const match = openingsCompact[prefix];
    if (match) {
      const [eco, fullName] = match;
      let name = fullName;
      let variation = "";
      if (fullName.includes(":")) {
        const parts = fullName.split(":");
        name = parts[0].trim();
        variation = parts.slice(1).join(":").trim();
      } else if (fullName.includes(",")) {
        const parts = fullName.split(",");
        name = parts[0].trim();
        variation = parts.slice(1).join(",").trim();
      }

      return {
        eco: eco || "---",
        name,
        variation,
        fullName,
        ply: len,
        inTheory: len === moveArray.length,
        outOfBookMoveCount: moveArray.length - len,
        prefix
      };
    }
  }

  return {
    eco: "---",
    name: "Unorthodox / Custom Line",
    variation: "",
    fullName: "Unorthodox / Custom Line",
    ply: 0,
    inTheory: false,
    outOfBookMoveCount: moveArray.length,
    prefix: ""
  };
}
