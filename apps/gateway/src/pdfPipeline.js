import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const pdfParse = require("pdf-parse");
import { getFirebasePersistence } from "./firebasePersistence.js";
import { appendMemory } from "./memoryStore.js";

const jobs = new Map();
let running = false;

function summarizeText(text = "", maxLen = 12000) {
  return String(text || "").replace(/\s+/g, " ").trim().slice(0, maxLen);
}

function buildCitations(pageTexts = []) {
  const out = [];
  for (let i = 0; i < pageTexts.length; i++) {
    const p = String(pageTexts[i] || "").replace(/\s+/g, " ").trim();
    if (!p) continue;
    const titleGuess = p.split(/[.!?]/)[0]?.slice(0, 120) || `Page ${i + 1}`;
    out.push({
      page: i + 1,
      title: titleGuess,
      excerpt: p.slice(0, 280)
    });
    if (out.length >= 8) break;
  }
  return out;
}

async function persistJob(uid, job) {
  const { db } = getFirebasePersistence();
  if (!db) return;
  await db.collection("castle_pdf_jobs").doc(uid).collection("jobs").doc(job.id).set({
    ...job,
    bytesBase64: undefined
  }, { merge: true });
}

async function processQueue() {
  if (running) return;
  running = true;
  try {
    while (true) {
      const next = [...jobs.values()].find((j) => j.status === "queued");
      if (!next) break;
      next.status = "processing";
      next.updatedAt = Date.now();
      await persistJob(next.uid, next);
      try {
        const bytes = Buffer.from(next.bytesBase64, "base64");
        const pageTexts = [];
        const out = await pdfParse(bytes, {
          pagerender: async (pageData) => {
            const tc = await pageData.getTextContent({ normalizeWhitespace: true });
            const pageText = tc.items.map((x) => x.str).join(" ");
            pageTexts.push(pageText);
            return pageText;
          }
        });
        next.extractedText = summarizeText(out?.text || "", 18000);
        next.pageCount = Number(out?.numpages || 0);
        next.citations = buildCitations(pageTexts);
        next.status = "done";
        next.updatedAt = Date.now();
        await appendMemory({
          scope: "users",
          id: next.uid,
          kind: "semantic",
          text: `PDF_EXTRACT:${next.fileName} pages=${next.pageCount} text=${next.extractedText.slice(0, 1200)}`,
          tags: ["pdf", "library", "extract"],
          importance: 0.72,
          meta: { jobId: next.id, pageCount: next.pageCount, citations: next.citations }
        });
      } catch (error) {
        next.status = "failed";
        next.error = error?.message || "pdf_extract_failed";
        next.updatedAt = Date.now();
      }
      await persistJob(next.uid, next);
    }
  } finally {
    running = false;
  }
}

export async function enqueuePdfJob({ uid, fileName = "document.pdf", bytesBase64 }) {
  if (!uid || !bytesBase64) throw new Error("uid_and_bytesBase64_required");
  const id = `pdf-${Math.random().toString(36).slice(2, 11)}`;
  const now = Date.now();
  const job = {
    id,
    uid,
    fileName: String(fileName).slice(0, 160),
    status: "queued",
    createdAt: now,
    updatedAt: now,
    bytesBase64: String(bytesBase64),
    extractedText: "",
    citations: [],
    pageCount: 0,
    error: ""
  };
  jobs.set(id, job);
  await persistJob(uid, job);
  void processQueue();
  return { id: job.id, status: job.status, createdAt: job.createdAt };
}

export async function getPdfJob(uid, id) {
  const mem = jobs.get(String(id));
  if (mem && mem.uid === uid) {
    return {
      id: mem.id,
      fileName: mem.fileName,
      status: mem.status,
      createdAt: mem.createdAt,
      updatedAt: mem.updatedAt,
      pageCount: mem.pageCount,
      citations: Array.isArray(mem.citations) ? mem.citations : [],
      error: mem.error,
      extractedText: mem.extractedText
    };
  }
  const { db } = getFirebasePersistence();
  if (!db) return null;
  const snap = await db.collection("castle_pdf_jobs").doc(uid).collection("jobs").doc(String(id)).get();
  if (!snap.exists) return null;
  const d = snap.data() || {};
  return {
    id: snap.id,
    fileName: d.fileName || "document.pdf",
    status: d.status || "unknown",
    createdAt: d.createdAt || 0,
    updatedAt: d.updatedAt || 0,
    pageCount: d.pageCount || 0,
    citations: Array.isArray(d.citations) ? d.citations : [],
    error: d.error || "",
    extractedText: d.extractedText || ""
  };
}
