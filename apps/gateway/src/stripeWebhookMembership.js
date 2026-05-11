import Stripe from "stripe";
import { FieldValue } from "firebase-admin/firestore";
import { getFirebasePersistence } from "./firebasePersistence.js";
import { deriveMembershipFieldsFromStripeSubscription, premiumPriceIdSetFromEnv } from "./membershipStripeDerivationV1.js";
import { rememberStripeEventOrSkip } from "./stripePaymentReplayValidatorV1.js";

function sendJson(res, statusCode, payload) {
  res.writeHead(statusCode, { "Content-Type": "application/json; charset=utf-8" });
  res.end(JSON.stringify(payload));
}

function readHttpBodyBuffer(req, limit = 1024 * 1024) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    let len = 0;
    req.on("data", (chunk) => {
      len += chunk.length;
      if (len > limit) reject(new Error("payload_too_large"));
      else chunks.push(chunk);
    });
    req.on("end", () => resolve(Buffer.concat(chunks)));
    req.on("error", reject);
  });
}

function getStripe() {
  const key = String(process.env.STRIPE_SECRET_KEY || "").trim();
  if (!key) return null;
  return new Stripe(key);
}

function membershipDocRef(db, uid) {
  return db.collection("memberships").doc(String(uid));
}

async function persistMembershipFromSubscription(db, uid, subscription, stripeEventId) {
  const premiumSet = premiumPriceIdSetFromEnv();
  const derived = deriveMembershipFieldsFromStripeSubscription(subscription, premiumSet);
  const ref = membershipDocRef(db, uid);
  await ref.set(
    {
      schemaVersion: 1,
      uid: String(uid),
      membershipPlan: derived.plan,
      subscriptionStatus: derived.subscriptionStatus,
      stripeCustomerId: derived.stripeCustomerId,
      stripeSubscriptionId: derived.stripeSubscriptionId,
      currentPeriodEndSec: derived.currentPeriodEndSec,
      lastStripeEventId: stripeEventId || null,
      updatedAt: FieldValue.serverTimestamp(),
      source: "stripe_webhook"
    },
    { merge: true }
  );
}

function resolveUidFromSubscription(sub) {
  const meta = sub?.metadata || {};
  return String(meta.firebaseUid || meta.firebase_uid || "").trim();
}

/**
 * POST /webhooks/stripe — raw body required for signature verification.
 */
export async function handleStripeMembershipWebhook(req, res) {
  const secret = String(process.env.STRIPE_WEBHOOK_SECRET || "").trim();
  if (!secret) {
    sendJson(res, 503, { ok: false, error: "stripe_webhook_not_configured" });
    return;
  }

  const stripe = getStripe();
  if (!stripe) {
    sendJson(res, 503, { ok: false, error: "stripe_secret_not_configured" });
    return;
  }

  const sig = req.headers["stripe-signature"];
  if (!sig) {
    sendJson(res, 400, { ok: false, error: "missing_stripe_signature" });
    return;
  }

  let buf;
  try {
    buf = await readHttpBodyBuffer(req);
  } catch {
    sendJson(res, 413, { ok: false, error: "payload_too_large" });
    return;
  }

  let event;
  try {
    event = stripe.webhooks.constructEvent(buf, sig, secret);
  } catch (e) {
    sendJson(res, 400, { ok: false, error: "invalid_signature", detail: String(e?.message || e) });
    return;
  }

  const replay = rememberStripeEventOrSkip(event.id, event.created);
  if (replay.skippedAge) {
    sendJson(res, 400, { ok: false, error: "stripe_event_rejected", reason: replay.reason || "age" });
    return;
  }
  if (replay.duplicate) {
    res.writeHead(200, { "Content-Type": "application/json; charset=utf-8" });
    res.end(JSON.stringify({ received: true, duplicate: true }));
    return;
  }

  const { db, mode } = getFirebasePersistence();
  if (mode !== "firebase" || !db) {
    sendJson(res, 503, { ok: false, error: "firebase_persistence_required" });
    return;
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object;
        const uid = String(session.metadata?.firebaseUid || session.client_reference_id || "").trim();
        const subId = session.subscription;
        if (uid && subId) {
          const sub = await stripe.subscriptions.retrieve(String(subId));
          await persistMembershipFromSubscription(db, uid, sub, event.id);
        }
        break;
      }
      case "customer.subscription.updated":
      case "customer.subscription.deleted": {
        const sub = event.data.object;
        const uid = resolveUidFromSubscription(sub);
        if (uid) await persistMembershipFromSubscription(db, uid, sub, event.id);
        break;
      }
      default:
        break;
    }
  } catch (e) {
    sendJson(res, 500, { ok: false, error: "webhook_handler_failed", detail: String(e?.message || e) });
    return;
  }

  res.writeHead(200, { "Content-Type": "application/json; charset=utf-8" });
  res.end(JSON.stringify({ received: true }));
}

/**
 * POST /billing/stripe/checkout — authenticated user; returns Checkout Session URL.
 * Card data never touches this server (Stripe-hosted Checkout).
 */
export async function handleStripeCheckoutCreate(req, res, { readHttpJson, resolveHttpUser, sendJson: sj }) {
  const auth = await resolveHttpUser(req);
  if (!auth.ok) return sj(res, 401, { ok: false, error: auth.reason });

  const stripe = getStripe();
  if (!stripe) return sj(res, 503, { ok: false, error: "stripe_secret_not_configured" });

  const defaultPrice = String(process.env.STRIPE_PREMIUM_PRICE_ID || "").trim();
  if (!defaultPrice) return sj(res, 503, { ok: false, error: "stripe_price_not_configured" });

  let body = {};
  try {
    body = await readHttpJson(req, 16 * 1024);
  } catch {
    return sj(res, 400, { ok: false, error: "invalid_json" });
  }

  const priceId = String(body.priceId || defaultPrice).trim();
  const successUrl =
    String(body.successUrl || process.env.STRIPE_CHECKOUT_SUCCESS_URL || "").trim() || "http://localhost:5173/?checkout=success";
  const cancelUrl =
    String(body.cancelUrl || process.env.STRIPE_CHECKOUT_CANCEL_URL || "").trim() || "http://localhost:5173/?checkout=cancel";

  try {
    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      client_reference_id: auth.uid,
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: successUrl,
      cancel_url: cancelUrl,
      metadata: { firebaseUid: auth.uid },
      subscription_data: {
        metadata: { firebaseUid: auth.uid }
      }
    });
    return sj(res, 200, { ok: true, url: session.url, id: session.id });
  } catch (e) {
    return sj(res, 400, { ok: false, error: "checkout_create_failed", detail: String(e?.message || e) });
  }
}
