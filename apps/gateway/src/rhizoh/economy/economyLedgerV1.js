import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function resolveDataDir() {
  const candidates = [
    process.env.RHIZOH_DATA_DIR,
    path.resolve(__dirname, "..", "..", "..", "..", "data"),
    path.resolve(__dirname, "..", "..", "..", "data"),
    path.resolve(process.cwd(), "..", "data"),
    path.resolve(process.cwd(), "data"),
    "C:/Users/LENOVO/Desktop/castle/data"
  ];
  for (const c of candidates) {
    if (c && fs.existsSync(c)) {
      return c;
    }
  }
  return path.resolve(process.cwd(), "data");
}

const DATA_DIR = resolveDataDir();

const ECONOMY_LEDGER_FILE = path.join(DATA_DIR, "economy_ledger.json");
const RESOURCE_ALLOCATIONS_FILE = path.join(DATA_DIR, "resource_allocations.json");
const PLEDGE_INTENTS_FILE = path.join(DATA_DIR, "economy_pledge_intents.json");

function ensureDirectoryExists(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

// Canonical Membership Tiers
export const MEMBERSHIP_TIERS = [
  {
    tier_id: "RHIZOH_SUPPORTER",
    name: "Rhizoh Supporter",
    monthly_usd: 10,
    tagline: "Fuel the continuous live games and community servers (7-day free trial on Patreon)",
    benefits: [
      "Official supporter badge on public profile",
      "Full access to Puzzle World personal analytics",
      "Priority matching in open chess rooms",
      "Supporter attribution in the public Chronicle"
    ],
    epistemic_guard: "Does not grant access to mutate or poison model weights",
    patreon_url: "https://www.patreon.com/c/CanKasaplar/membership"
  },
  {
    tier_id: "RHIZOH_PATRON",
    name: "Rhizoh Patron",
    monthly_usd: 20,
    tagline: "Directly sponsor self-play tournaments and forensic analysis",
    benefits: [
      "All Supporter benefits",
      "Access to deep tactical search forensics reports",
      "Engine Council discussion spectator voting",
      "Custom private room time-controls"
    ],
    epistemic_guard: "User games are filtered by P4-E/P5 quality gates before candidate consideration"
  },
  {
    tier_id: "RESEARCH_PARTNER",
    name: "Research Partner",
    monthly_usd: 100,
    tagline: "Underwrite targeted research experiments and evaluation suites",
    benefits: [
      "All Patron benefits",
      "Named attribution on completed research experiment artifacts",
      "Direct API access to raw telemetry and EPD benchmark corpora",
      "Dedicated compute allocation ledger tracking"
    ],
    epistemic_guard: "Models are promoted strictly by empirical SPRT; sponsorship cannot buy promotion"
  },
  {
    tier_id: "COMPUTE_FOUNDER",
    name: "Compute Founder",
    monthly_usd: null,
    tagline: "Provide dedicated GPU/CPU clusters for autonomous training and gauntlets",
    benefits: [
      "All Research Partner benefits",
      "Permanent provenance in Generation Release Manifests",
      "Direct tracking from compute cluster to experiment artifacts to Chronicle",
      "Autonomous league sponsor badge"
    ],
    epistemic_guard: "All compute outputs are independently verified by the Engine Council before admission"
  }
];

// Valid economic event types
export const ECONOMIC_EVENT_TYPES = [
  "SPONSOR_CREATED",
  "MEMBERSHIP_STARTED",
  "MEMBERSHIP_CANCELLED",
  "DONATION_RECEIVED",
  "COMPUTE_CREDIT_GRANTED",
  "RESEARCH_SPONSORSHIP",
  "TOURNAMENT_SPONSORSHIP"
];

function loadJson(filePath, defaultValue) {
  try {
    if (fs.existsSync(filePath)) {
      return JSON.parse(fs.readFileSync(filePath, "utf8"));
    }
  } catch (err) {
    console.error(`Failed to load ${filePath}:`, err);
  }
  return defaultValue;
}

function saveJson(filePath, data) {
  ensureDirectoryExists(path.dirname(filePath));
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), "utf8");
}

function computeEventHash(prevHash, eventType, timestamp, payload) {
  const payloadStr = typeof payload === "string" ? payload : JSON.stringify(payload);
  return crypto
    .createHash("sha256")
    .update(`${prevHash}:${eventType}:${timestamp}:${payloadStr}`)
    .digest("hex");
}

export function getEconomySummary() {
  const ledger = loadJson(ECONOMY_LEDGER_FILE, {
    genesis_timestamp: "2026-10-08T00:00:00Z",
    events: []
  });
  const allocations = loadJson(RESOURCE_ALLOCATIONS_FILE, { allocations: [] });
  const pledges = loadJson(PLEDGE_INTENTS_FILE, { intents: [] });

  let totalComputeHoursAllocated = 0;
  let totalComputeCreditsGranted = 0;
  let activeMembersCount = 0;
  let verifiedSponsorsCount = 0;

  for (const ev of ledger.events) {
    if (ev.event_type === "COMPUTE_CREDIT_GRANTED") {
      totalComputeCreditsGranted += Number(ev.payload?.credits || 0);
    } else if (ev.event_type === "MEMBERSHIP_STARTED") {
      activeMembersCount++;
    } else if (ev.event_type === "SPONSOR_CREATED" || ev.event_type === "RESEARCH_SPONSORSHIP") {
      verifiedSponsorsCount++;
    }
  }

  for (const alloc of allocations.allocations) {
    totalComputeHoursAllocated += Number(alloc.allocated_hours || 0);
  }

  return {
    economic_identity: {
      framework: "Rhizoh P12 Sovereign Economy",
      version: "1.0.0",
      payment_gateway_status: "INTENT_AND_LEDGER_ACTIVE",
      currency: "USD / COMPUTE_HOURS",
      principle: "NO_PAY_TO_WIN_IN_RESEARCH",
      epistemic_axiom: "Funds and compute provide search/training resources, but NEVER dictate chess truth or model promotion."
    },
    metrics: {
      total_economic_events: ledger.events.length,
      active_members: activeMembersCount,
      verified_sponsors: verifiedSponsorsCount,
      pledge_intents_registered: pledges.intents.length,
      total_compute_credits_granted: totalComputeCreditsGranted,
      total_compute_hours_allocated: totalComputeHoursAllocated,
      completed_sponsored_experiments: allocations.allocations.filter((a) => a.status === "COMPLETED").length
    },
    membership_tiers: MEMBERSHIP_TIERS
  };
}

export function listEconomicEvents(limit = 100) {
  const ledger = loadJson(ECONOMY_LEDGER_FILE, { events: [] });
  const events = [...ledger.events].reverse().slice(0, limit);
  return {
    count: ledger.events.length,
    events
  };
}

export function recordEconomicEvent(eventType, payload, actor = "system") {
  if (!ECONOMIC_EVENT_TYPES.includes(eventType)) {
    return { ok: false, error: `Invalid economic event type: ${eventType}` };
  }

  const ledger = loadJson(ECONOMY_LEDGER_FILE, {
    genesis_timestamp: new Date().toISOString(),
    events: []
  });

  const prevHash = ledger.events.length > 0 
    ? ledger.events[ledger.events.length - 1].event_hash 
    : "0000000000000000000000000000000000000000000000000000000000000000";

  const timestamp = new Date().toISOString();
  const eventHash = computeEventHash(prevHash, eventType, timestamp, payload);

  const event = {
    event_id: `ECON-${Date.now()}-${crypto.randomBytes(3).toString("hex")}`,
    event_type: eventType,
    timestamp,
    actor_hash: crypto.createHash("sha256").update(String(actor)).digest("hex").slice(0, 16),
    payload,
    prev_hash: prevHash,
    event_hash: eventHash
  };

  ledger.events.push(event);
  saveJson(ECONOMY_LEDGER_FILE, ledger);

  return { ok: true, event };
}

export function registerPledgeIntent(data) {
  const { name, email, tier_id, compute_type, message, intent_type } = data || {};

  if (!email || !email.includes("@")) {
    return { ok: false, error: "A valid email address is required for pledge registration." };
  }

  const pledges = loadJson(PLEDGE_INTENTS_FILE, { intents: [] });
  const intentId = `PLEDGE-${Date.now()}-${crypto.randomBytes(3).toString("hex")}`;

  const intentRecord = {
    intent_id: intentId,
    timestamp: new Date().toISOString(),
    name: String(name || "Anonymous Supporter").trim(),
    email_hash: crypto.createHash("sha256").update(String(email).trim().toLowerCase()).digest("hex").slice(0, 16),
    tier_id: tier_id || "RHIZOH_SUPPORTER",
    intent_type: intent_type || "MEMBERSHIP",
    compute_type: compute_type || null,
    message: String(message || "").slice(0, 500),
    status: "REGISTERED_PENDING_GATEWAY"
  };

  pledges.intents.push(intentRecord);
  saveJson(PLEDGE_INTENTS_FILE, pledges);

  recordEconomicEvent("DONATION_RECEIVED", {
    intent_id: intentId,
    tier_id: intentRecord.tier_id,
    intent_type: intentRecord.intent_type,
    status: "INTENT_RECORDED"
  }, email);

  return {
    ok: true,
    message: "Thank you for supporting the continuity of Rhizoh. Your intent has been sealed into the ledger.",
    intent: intentRecord
  };
}

export function listResourceAllocations() {
  const allocations = loadJson(RESOURCE_ALLOCATIONS_FILE, { allocations: [] });
  return {
    ok: true,
    count: allocations.allocations.length,
    allocations: allocations.allocations
  };
}

export function allocateComputeToExperiment({
  sponsor_id,
  sponsor_name,
  experiment_id,
  allocated_hours,
  hardware_spec,
  target_suite
}) {
  if (!experiment_id || !allocated_hours) {
    return { ok: false, error: "experiment_id and allocated_hours are required." };
  }

  const allocations = loadJson(RESOURCE_ALLOCATIONS_FILE, { allocations: [] });
  const allocationId = `ALLOC-${Date.now()}-${crypto.randomBytes(3).toString("hex")}`;

  const record = {
    allocation_id: allocationId,
    timestamp: new Date().toISOString(),
    sponsor_id: sponsor_id || "COMMUNITY_POOL",
    sponsor_name: sponsor_name || "Rhizoh Community Compute Pool",
    experiment_id,
    allocated_hours: Number(allocated_hours),
    hardware_spec: hardware_spec || "CPU 8-core / 16GB RAM",
    target_suite: target_suite || "SPRT Gauntlet / Self-Play",
    status: "ACTIVE",
    artifact_sha: null,
    provenance_statement: `${allocated_hours} compute-hours allocated to experiment ${experiment_id}.`
  };

  allocations.allocations.push(record);
  saveJson(RESOURCE_ALLOCATIONS_FILE, allocations);

  recordEconomicEvent("RESEARCH_SPONSORSHIP", {
    allocation_id: allocationId,
    experiment_id,
    allocated_hours,
    sponsor_name: record.sponsor_name
  }, sponsor_id || "community");

  return { ok: true, allocation: record };
}

export function clearEconomyData() {
  saveJson(ECONOMY_LEDGER_FILE, {
    genesis_timestamp: new Date().toISOString(),
    events: []
  });
  saveJson(RESOURCE_ALLOCATIONS_FILE, { allocations: [] });
  saveJson(PLEDGE_INTENTS_FILE, { intents: [] });
  return { ok: true };
}
