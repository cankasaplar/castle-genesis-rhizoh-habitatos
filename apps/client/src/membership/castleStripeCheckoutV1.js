/**
 * Stripe Checkout Session — gateway POST /billing/stripe/checkout (kart verisi Stripe’ta).
 * Kimlik: Authorization: Bearer <Firebase ID token>.
 */

function gatewayOriginBestEffort() {
  const llm = String(
    typeof import.meta !== "undefined"
      ? import.meta.env?.VITE_GATEWAY_HTTP || import.meta.env?.VITE_RHIZOH_LLM_HTTP || ""
      : ""
  ).trim();
  if (!llm) return "";
  try {
    const originBase =
      typeof window !== "undefined" && window.location ? window.location.origin : "http://localhost";
    return new URL(llm, originBase).origin;
  } catch {
    return "";
  }
}

/**
 * @param {{ idToken: string, priceId?: string, successUrl?: string, cancelUrl?: string }} opts
 * @returns {Promise<{ url: string, id?: string }>}
 */
export async function postCastleStripeCheckoutSession(opts = {}) {
  const idToken = String(opts.idToken || "").trim();
  const base = gatewayOriginBestEffort();
  if (!base) throw new Error("gateway_http_not_configured");
  if (!idToken) throw new Error("auth_token_required");

  const token = String(typeof import.meta !== "undefined" ? import.meta.env?.VITE_GATEWAY_TOKEN || "" : "").trim();
  const headers = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${idToken}`
  };
  if (token) headers["x-castle-gateway-token"] = token;

  const envSuccess =
    typeof import.meta !== "undefined" ? String(import.meta.env?.VITE_STRIPE_CHECKOUT_SUCCESS_URL || "").trim() : "";
  const envCancel =
    typeof import.meta !== "undefined" ? String(import.meta.env?.VITE_STRIPE_CHECKOUT_CANCEL_URL || "").trim() : "";

  const res = await fetch(`${base}/billing/stripe/checkout`, {
    method: "POST",
    headers,
    body: JSON.stringify({
      priceId: opts.priceId,
      successUrl: opts.successUrl || envSuccess || undefined,
      cancelUrl: opts.cancelUrl || envCancel || undefined
    })
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok || !body?.ok || !body?.url) {
    const err = new Error(String(body?.error || body?.detail || "checkout_session_failed"));
    err.cause = body;
    throw err;
  }
  return { url: body.url, id: body.id };
}

/**
 * Oturum URL’ini döner; istenirse tam sayfa yönlendirir.
 * @param {{ idToken: string, priceId?: string, successUrl?: string, cancelUrl?: string, redirect?: boolean }} opts
 */
export async function startCastleStripeCheckout(opts = {}) {
  const { redirect = true, ...rest } = opts;
  const session = await postCastleStripeCheckoutSession(rest);
  if (redirect && typeof window !== "undefined") window.location.assign(session.url);
  return session;
}
