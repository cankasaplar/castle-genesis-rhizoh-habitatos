/**
 * football-data.org v4 ingest — free-tier football + World Cup (WC).
 */

import { normalizeFootballDataMatchesPayloadV0 } from "./footballDataNormalizeV0.js";

const BASE = "https://api.football-data.org/v4";

/**
 * @returns {string}
 */
export function readFootballDataOrgTokenV0() {
  return String(
    process.env.FOOTBALL_DATA_ORG_TOKEN ||
      process.env.CASTLE_FOOTBALL_DATA_ORG_TOKEN ||
      ""
  ).trim();
}

/**
 * @returns {boolean}
 */
export function isFootballDataOrgEnabledV0() {
  return Boolean(readFootballDataOrgTokenV0());
}

/**
 * @param {string} pathQuery
 * @param {string} token
 */
async function fetchFootballDataV0(pathQuery, token) {
  const url = `${BASE}${pathQuery.startsWith("/") ? pathQuery : `/${pathQuery}`}`;
  const res = await fetch(url, {
    method: "GET",
    headers: {
      "X-Auth-Token": token,
      Accept: "application/json"
    }
  });
  if (!res.ok) {
    throw new Error(`football_data_http_${res.status}`);
  }
  return res.json();
}

function formatDateYmd(d) {
  return d.toISOString().slice(0, 10);
}

/**
 * @param {string} [token]
 * @returns {Promise<{ rows: object[], apiCalls: number, errors: string[] }>}
 */
export async function fetchFootballDataOrgBundleV0(token = readFootballDataOrgTokenV0()) {
  if (!token) {
    return { rows: [], apiCalls: 0, errors: ["football_data/unconfigured"] };
  }

  /** @type {object[]} */
  const all = [];
  const errors = [];
  let apiCalls = 0;

  const tasks = [
    {
      label: "live",
      run: async () => {
        const json = await fetchFootballDataV0("/matches?status=LIVE", token);
        apiCalls += 1;
        all.push(...normalizeFootballDataMatchesPayloadV0(json));
      }
    },
    {
      label: "world_cup",
      run: async () => {
        const json = await fetchFootballDataV0("/competitions/WC/matches?limit=20", token);
        apiCalls += 1;
        all.push(...normalizeFootballDataMatchesPayloadV0(json));
      }
    },
    {
      label: "scheduled_week",
      run: async () => {
        const from = new Date();
        const to = new Date(from.getTime() + 7 * 24 * 60 * 60 * 1000);
        const json = await fetchFootballDataV0(
          `/matches?status=SCHEDULED&dateFrom=${formatDateYmd(from)}&dateTo=${formatDateYmd(to)}&limit=15`,
          token
        );
        apiCalls += 1;
        all.push(...normalizeFootballDataMatchesPayloadV0(json));
      }
    },
    {
      label: "champions_league",
      run: async () => {
        const json = await fetchFootballDataV0("/competitions/CL/matches?limit=8", token);
        apiCalls += 1;
        all.push(...normalizeFootballDataMatchesPayloadV0(json));
      }
    }
  ];

  for (const task of tasks) {
    try {
      await task.run();
    } catch (e) {
      errors.push(`${task.label}:${String(e?.message || e)}`);
    }
  }

  const dedup = new Map();
  for (const row of all) {
    if (row && !dedup.has(row.id)) dedup.set(row.id, row);
  }

  return { rows: [...dedup.values()], apiCalls, errors };
}
