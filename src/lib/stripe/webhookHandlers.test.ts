import { describe, it, expect, vi } from "vitest";
import type Stripe from "stripe";
import type { SupabaseClient } from "@supabase/supabase-js";
import { handleCheckoutSessionCompleted, handleSubscriptionSync } from "./webhookHandlers";

// Minimal in-memory fake covering only the chains these handlers actually
// use (.from(table).update(payload).eq(col, val) and .from(table).insert
// (payload)) -- enough to exercise real update-matching semantics (a
// no-op update when nothing matches the .eq() filter) without pulling in
// a full Supabase client mock.
function createFakeSupabase(seed: { profiles?: Record<string, unknown>[] }) {
  const tables: Record<string, Record<string, unknown>[]> = {
    profiles: seed.profiles ? seed.profiles.map((r) => ({ ...r })) : [],
    claim_entitlements: [],
  };

  const client = {
    from(table: string) {
      return {
        update(payload: Record<string, unknown>) {
          return {
            eq(col: string, val: unknown) {
              for (const row of tables[table]) {
                if (row[col] === val) Object.assign(row, payload);
              }
              return Promise.resolve({ error: null });
            },
          };
        },
        insert(payload: Record<string, unknown>) {
          tables[table].push({ ...payload });
          return Promise.resolve({ error: null });
        },
      };
    },
    _tables: tables,
  };

  return client as unknown as SupabaseClient & { _tables: typeof tables };
}

function fakeSubscription(overrides: Partial<Stripe.Subscription> = {}): Stripe.Subscription {
  return {
    id: "sub_test123",
    customer: "cus_test123",
    status: "active",
    items: { data: [{ current_period_end: 1800000000 }] },
    ...overrides,
  } as unknown as Stripe.Subscription;
}

function fakeCheckoutSession(overrides: Partial<Stripe.Checkout.Session> = {}): Stripe.Checkout.Session {
  return {
    id: "cs_test123",
    mode: "subscription",
    customer: "cus_test123",
    subscription: "sub_test123",
    client_reference_id: "user_test123",
    metadata: { user_id: "user_test123" },
    ...overrides,
  } as unknown as Stripe.Checkout.Session;
}

function fakeStripeClient(subscription: Stripe.Subscription, retrieveImpl?: () => Promise<Stripe.Subscription>) {
  return {
    subscriptions: {
      retrieve: vi.fn(retrieveImpl ?? (async () => subscription)),
    },
  } as unknown as Stripe;
}

describe("checkout.session.completed (subscription) webhook ordering", () => {
  it("checkout.session.completed -> customer.subscription.created: activates immediately, event is a no-op re-sync", async () => {
    const supabase = createFakeSupabase({
      profiles: [{ id: "user_test123", plan: "free", subscription_status: null, stripe_customer_id: null }],
    });
    const subscription = fakeSubscription();
    const stripe = fakeStripeClient(subscription);

    await handleCheckoutSessionCompleted(supabase, fakeCheckoutSession(), stripe);

    const profile = supabase._tables.profiles[0];
    expect(profile.plan).toBe("pro");
    expect(profile.stripe_customer_id).toBe("cus_test123");
    expect(profile.stripe_subscription_id).toBe("sub_test123");
    expect(profile.subscription_status).toBe("active");
    expect(profile.subscription_current_period_end).toBe(new Date(1800000000 * 1000).toISOString());

    // The real customer.subscription.created event still arrives on its
    // own -- must be a harmless idempotent re-sync, not a second grant or
    // an error.
    await handleSubscriptionSync(supabase, subscription);
    expect(supabase._tables.profiles[0].subscription_status).toBe("active");
  });

  it("customer.subscription.created -> checkout.session.completed: early event matches nothing, checkout handler still activates deterministically", async () => {
    const supabase = createFakeSupabase({
      profiles: [{ id: "user_test123", plan: "free", subscription_status: null, stripe_customer_id: null }],
    });
    const subscription = fakeSubscription();
    const stripe = fakeStripeClient(subscription);

    // customer.subscription.created arrives FIRST, before stripe_customer_id
    // has ever been written -- this is the exact pre-fix bug: the .eq()
    // filter matches zero rows, so it must not throw and must leave the
    // profile untouched (not an error case -- Stripe delivered a valid
    // event, there's just nothing to attach it to yet).
    await handleSubscriptionSync(supabase, subscription);
    expect(supabase._tables.profiles[0].subscription_status).toBeNull();
    expect(supabase._tables.profiles[0].plan).toBe("free");

    // checkout.session.completed arrives second. It sets stripe_customer_id
    // itself, then (the fix) proactively fetches and syncs the subscription
    // -- no longer dependent on a second delivery of
    // customer.subscription.created to ever arrive.
    await handleCheckoutSessionCompleted(supabase, fakeCheckoutSession(), stripe);

    const profile = supabase._tables.profiles[0];
    expect(profile.plan).toBe("pro");
    expect(profile.stripe_customer_id).toBe("cus_test123");
    expect(profile.subscription_status).toBe("active");
    expect(profile.subscription_current_period_end).toBe(new Date(1800000000 * 1000).toISOString());
  });

  it("does not throw and leaves plan/customer_id set if the proactive subscription fetch fails", async () => {
    const supabase = createFakeSupabase({
      profiles: [{ id: "user_test123", plan: "free", subscription_status: null, stripe_customer_id: null }],
    });
    const stripe = fakeStripeClient(fakeSubscription(), async () => {
      throw new Error("network error");
    });

    await expect(
      handleCheckoutSessionCompleted(supabase, fakeCheckoutSession(), stripe),
    ).resolves.toBeUndefined();

    const profile = supabase._tables.profiles[0];
    // The profiles update (plan/customer_id/subscription_id) already
    // committed before the proactive fetch was attempted -- a failed
    // fetch falls back to the real customer.subscription.created event,
    // it doesn't undo work that already succeeded.
    expect(profile.plan).toBe("pro");
    expect(profile.stripe_customer_id).toBe("cus_test123");
    expect(profile.subscription_status).toBeNull();
  });

  it("lifetime (payment mode) checkout is unaffected -- still inserts a claim_entitlements row, no subscription fetch attempted", async () => {
    const supabase = createFakeSupabase({ profiles: [] });
    const stripe = fakeStripeClient(fakeSubscription());

    await handleCheckoutSessionCompleted(
      supabase,
      fakeCheckoutSession({
        mode: "payment",
        subscription: null,
        metadata: { user_id: "user_test123", claim_id: "claim_test123" },
      }),
      stripe,
    );

    expect(supabase._tables.claim_entitlements).toHaveLength(1);
    expect(supabase._tables.claim_entitlements[0].claim_id).toBe("claim_test123");
    expect(stripe.subscriptions.retrieve).not.toHaveBeenCalled();
  });
});
