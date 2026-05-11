import test from "node:test";
import assert from "node:assert/strict";
import { deriveMembershipFieldsFromStripeSubscription } from "../membershipStripeDerivationV1.js";

test("deriveMembershipFieldsFromStripeSubscription: active + premium price → premium", () => {
  const premium = new Set(["price_prem"]);
  const sub = {
    id: "sub_1",
    status: "active",
    customer: "cus_x",
    current_period_end: 1700000000,
    items: { data: [{ price: { id: "price_prem" } }] }
  };
  const d = deriveMembershipFieldsFromStripeSubscription(sub, premium);
  assert.equal(d.plan, "premium");
  assert.equal(d.subscriptionStatus, "active");
  assert.equal(d.stripeSubscriptionId, "sub_1");
});

test("deriveMembershipFieldsFromStripeSubscription: active but wrong price → free", () => {
  const premium = new Set(["price_prem"]);
  const sub = {
    id: "sub_2",
    status: "active",
    customer: "cus_x",
    current_period_end: 1700000000,
    items: { data: [{ price: { id: "price_other" } }] }
  };
  const d = deriveMembershipFieldsFromStripeSubscription(sub, premium);
  assert.equal(d.plan, "free");
});

test("deriveMembershipFieldsFromStripeSubscription: past_due premium price → free", () => {
  const premium = new Set(["price_prem"]);
  const sub = {
    status: "past_due",
    items: { data: [{ price: { id: "price_prem" } }] }
  };
  const d = deriveMembershipFieldsFromStripeSubscription(sub, premium);
  assert.equal(d.plan, "free");
});
