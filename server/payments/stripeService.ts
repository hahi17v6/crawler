import Stripe from 'stripe';
import { dbStore, PaymentRecord } from '../db/store';
import { monitoringStore } from '../monitoring/monitoringStore';

let stripeClient: Stripe | null = null;

// Lazy initialization pattern to prevent crashes if STRIPE_SECRET_KEY is missing
export function getStripe(): Stripe | null {
  if (!stripeClient) {
    const key = process.env.STRIPE_SECRET_KEY;
    if (key && key !== 'sk_test_...' && key.trim() !== '') {
      stripeClient = new Stripe(key, {
        apiVersion: '2025-01-27.acacia' as any,
      });
    }
  }
  return stripeClient;
}

export async function markSessionAsPaid(sessionId: string, targetUrl?: string, email?: string): Promise<PaymentRecord> {
  let hostname = targetUrl || 'unknown';
  if (targetUrl) {
    try {
      hostname = new URL(targetUrl.startsWith('http') ? targetUrl : `https://${targetUrl}`).hostname.toLowerCase();
    } catch (_e) {
      hostname = targetUrl.toLowerCase();
    }
  }

  const existing = await dbStore.getPayment(sessionId);
  const now = new Date().toISOString();

  const record: PaymentRecord = {
    id: sessionId,
    stripeSessionId: sessionId,
    email: email || existing?.email || 'customer@example.com',
    targetUrl: targetUrl || existing?.targetUrl || hostname,
    hostname: hostname || existing?.hostname || 'unknown',
    status: 'paid',
    amount: existing?.amount || 1100,
    currency: existing?.currency || 'usd',
    product: existing?.product || 'full_diagnosis',
    createdAt: existing?.createdAt || now,
    updatedAt: now,
  };

  await dbStore.savePayment(record);
  return record;
}

export async function isSessionPaid(sessionId?: string, targetUrl?: string): Promise<boolean> {
  if (!sessionId) {
    return false;
  }

  const payment = await dbStore.getPayment(sessionId);
  if (!payment || payment.status !== 'paid') {
    return false;
  }

  if (targetUrl) {
    let reqHostname = targetUrl.toLowerCase().trim();
    try {
      if (reqHostname.startsWith('http://') || reqHostname.startsWith('https://')) {
        reqHostname = new URL(reqHostname).hostname;
      }
    } catch (_e) {
      // keep raw
    }
    return payment.hostname.toLowerCase() === reqHostname || payment.targetUrl.toLowerCase() === reqHostname;
  }

  return true;
}

export async function createCheckoutSession(params: {
  targetUrl: string;
  email: string;
  appUrl: string;
}): Promise<{ url: string | null; sessionId: string; isMock: boolean }> {
  const stripe = getStripe();
  let hostname = params.targetUrl.toLowerCase();
  try {
    hostname = new URL(params.targetUrl.startsWith('http') ? params.targetUrl : `https://${params.targetUrl}`).hostname;
  } catch (_e) {
    // fallback
  }

  if (!stripe) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('STRIPE_SECRET_KEY is required in production.');
    }

    // Graceful Fallback / Mock mode ONLY in non-production development environments
    const mockSessionId = `mock_cs_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const mockSuccessUrl = `${params.appUrl}/?paid=true&session_id=${mockSessionId}&url=${encodeURIComponent(params.targetUrl)}`;
    
    // Auto mark mock session as paid in dev and save to DB
    await markSessionAsPaid(mockSessionId, params.targetUrl, params.email);

    return {
      url: mockSuccessUrl,
      sessionId: mockSessionId,
      isMock: true,
    };
  }

  const session = await stripe.checkout.sessions.create({
    payment_method_types: ['card'],
    customer_email: params.email || undefined,
    line_items: [
      {
        price_data: {
          currency: 'usd',
          product_data: {
            name: 'Full Website Visibility Diagnosis',
            description: 'Comprehensive technical crawl, indexability audit & step-by-step Fix Plan',
          },
          unit_amount: 1100, // $11.00 USD
        },
        quantity: 1,
      },
    ],
    mode: 'payment',
    success_url: `${params.appUrl}/?paid=true&session_id={CHECKOUT_SESSION_ID}&url=${encodeURIComponent(params.targetUrl)}`,
    cancel_url: `${params.appUrl}/?cancelled=true`,
    metadata: {
      targetUrl: params.targetUrl,
      email: params.email,
    },
  });

  const now = new Date().toISOString();
  await dbStore.savePayment({
    id: session.id,
    stripeSessionId: session.id,
    email: params.email || 'customer@example.com',
    targetUrl: params.targetUrl,
    hostname,
    status: 'pending',
    amount: 1100,
    currency: 'usd',
    product: 'full_diagnosis',
    createdAt: now,
    updatedAt: now,
  });

  return {
    url: session.url,
    sessionId: session.id,
    isMock: false,
  };
}

export async function createSubscriptionCheckoutSession(params: {
  targetUrl: string;
  email: string;
  appUrl: string;
  userSessionId?: string;
}): Promise<{ url: string | null; sessionId: string; isMock: boolean }> {
  const stripe = getStripe();
  let hostname = params.targetUrl.toLowerCase();
  try {
    hostname = new URL(params.targetUrl.startsWith('http') ? params.targetUrl : `https://${params.targetUrl}`).hostname;
  } catch (_e) {
    // fallback
  }

  if (!stripe) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('STRIPE_SECRET_KEY is required in production.');
    }

    const mockSessionId = `mock_sub_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const mockSuccessUrl = `${params.appUrl}/?monitoring_subscribed=true&session_id=${mockSessionId}&url=${encodeURIComponent(params.targetUrl)}`;
    
    await markSessionAsPaid(mockSessionId, params.targetUrl, params.email);

    return {
      url: mockSuccessUrl,
      sessionId: mockSessionId,
      isMock: true,
    };
  }

  const lineItem = process.env.STRIPE_MONITORING_PRICE_ID
    ? { price: process.env.STRIPE_MONITORING_PRICE_ID, quantity: 1 }
    : {
        price_data: {
          currency: 'usd',
          product_data: {
            name: 'Recurring Monitoring ($25/month)',
            description: 'Weekly automated crawl, status change detection & instant alert monitoring (7-day free trial)',
          },
          unit_amount: 2500, // $25.00 USD
          recurring: {
            interval: 'month' as const,
          },
        },
        quantity: 1,
      };

  const session = await stripe.checkout.sessions.create({
    payment_method_types: ['card'],
    customer_email: params.email || undefined,
    line_items: [lineItem],
    mode: 'subscription',
    subscription_data: {
      trial_period_days: 7,
      metadata: {
        targetUrl: params.targetUrl,
        email: params.email,
        userSessionId: params.userSessionId || '',
      },
    },
    success_url: `${params.appUrl}/?monitoring_subscribed=true&session_id={CHECKOUT_SESSION_ID}&url=${encodeURIComponent(params.targetUrl)}`,
    cancel_url: `${params.appUrl}/?cancelled=true`,
    metadata: {
      targetUrl: params.targetUrl,
      email: params.email,
      product: 'recurring_monitoring',
      userSessionId: params.userSessionId || '',
    },
  });

  const now = new Date().toISOString();
  await dbStore.savePayment({
    id: session.id,
    stripeSessionId: session.id,
    email: params.email || 'customer@example.com',
    targetUrl: params.targetUrl,
    hostname,
    status: 'pending',
    amount: 2500,
    currency: 'usd',
    product: 'recurring_monitoring',
    createdAt: now,
    updatedAt: now,
  });

  return {
    url: session.url,
    sessionId: session.id,
    isMock: false,
  };
}

// Custom interfaces removed in favor of native Stripe types

export async function handleStripeWebhookEvent(rawBody: Buffer | string, signature: string): Promise<{ success: boolean; eventType?: string }> {
  const stripe = getStripe();
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!stripe || !webhookSecret) {
    console.warn('[Stripe Webhook] Stripe secret key or webhook secret missing.');
    return { success: false };
  }

  try {
    const event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);

    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as Stripe.Checkout.Session;
      const targetUrl = session.metadata?.targetUrl;
      const email = session.metadata?.email || session.customer_details?.email || undefined;
      await markSessionAsPaid(session.id, targetUrl, email);

      if (session.mode === 'subscription' || session.metadata?.product === 'recurring_monitoring') {
        if (targetUrl) {
          const subId = typeof session.subscription === 'string' ? session.subscription : session.subscription?.id;
          const customerId = typeof session.customer === 'string' ? session.customer : session.customer?.id;

          let subObj: Stripe.Subscription | null = null;
          if (subId && stripe) {
            try {
              subObj = await stripe.subscriptions.retrieve(subId);
            } catch (_err) {
              // fallback
            }
          }

          const subAny = subObj as any;
          const status = (subAny?.status as any) || 'trialing';
          const trialStart = subAny?.trial_start ? new Date(subAny.trial_start * 1000).toISOString() : null;
          const trialEnd = subAny?.trial_end ? new Date(subAny.trial_end * 1000).toISOString() : null;
          const currentPeriodStart = subAny?.current_period_start ? new Date(subAny.current_period_start * 1000).toISOString() : null;
          const currentPeriodEnd = subAny?.current_period_end ? new Date(subAny.current_period_end * 1000).toISOString() : null;
          const userSessionId = session.metadata?.userSessionId || subObj?.metadata?.userSessionId || null;

          await monitoringStore.subscribeDomain(targetUrl, email || '', {
            status: status as any,
            stripeCustomerId: customerId || null,
            stripeSubscriptionId: subId || null,
            userSessionId,
            trialStart,
            trialEnd,
            currentPeriodStart,
            currentPeriodEnd,
            cancelAtPeriodEnd: subObj?.cancel_at_period_end || false,
          });
        }
      }

      console.log(`[Stripe Webhook] Payment confirmed and persisted for session ${session.id} (${targetUrl})`);
    } else if (event.type === 'customer.subscription.created' || event.type === 'customer.subscription.updated') {
      const subscription = event.data.object as Stripe.Subscription;
      const targetUrl = subscription.metadata?.targetUrl;
      const email = subscription.metadata?.email || '';
      const userSessionId = subscription.metadata?.userSessionId || null;
      const customerId = typeof subscription.customer === 'string' ? subscription.customer : subscription.customer?.id;

      if (targetUrl) {
        const subAny = subscription as any;
        const trialStart = subAny.trial_start ? new Date(subAny.trial_start * 1000).toISOString() : null;
        const trialEnd = subAny.trial_end ? new Date(subAny.trial_end * 1000).toISOString() : null;
        const currentPeriodStart = subAny.current_period_start ? new Date(subAny.current_period_start * 1000).toISOString() : null;
        const currentPeriodEnd = subAny.current_period_end ? new Date(subAny.current_period_end * 1000).toISOString() : null;
        const canceledAt = subAny.canceled_at ? new Date(subAny.canceled_at * 1000).toISOString() : null;

        await monitoringStore.subscribeDomain(targetUrl, email, {
          status: subscription.status as any,
          stripeCustomerId: customerId || null,
          stripeSubscriptionId: subscription.id,
          userSessionId,
          trialStart,
          trialEnd,
          currentPeriodStart,
          currentPeriodEnd,
          cancelAtPeriodEnd: subscription.cancel_at_period_end,
          canceledAt,
        });
        console.log(`[Stripe Webhook] Subscription ${subscription.id} updated: status=${subscription.status} for ${targetUrl}`);
      }
    } else if (event.type === 'customer.subscription.deleted') {
      const subscription = event.data.object as Stripe.Subscription;
      const targetUrl = subscription.metadata?.targetUrl;
      if (targetUrl) {
        await monitoringStore.unsubscribeDomain(targetUrl);
        console.log(`[Stripe Webhook] Subscription ${subscription.id} deleted, monitoring deactivated for ${targetUrl}`);
      }
    } else if (event.type === 'invoice.paid') {
      const invoice = event.data.object as Stripe.Invoice;
      const invoiceAny = invoice as any;
      const subId = typeof invoiceAny.subscription === 'string' ? invoiceAny.subscription : invoiceAny.subscription?.id;
      if (subId && stripe) {
        try {
          const subscription = await stripe.subscriptions.retrieve(subId);
          const targetUrl = subscription.metadata?.targetUrl;
          if (targetUrl) {
            const subAny = subscription as any;
            await monitoringStore.subscribeDomain(targetUrl, subscription.metadata?.email || '', {
              status: subscription.status as any,
              currentPeriodStart: subAny.current_period_start ? new Date(subAny.current_period_start * 1000).toISOString() : null,
              currentPeriodEnd: subAny.current_period_end ? new Date(subAny.current_period_end * 1000).toISOString() : null,
            });
            console.log(`[Stripe Webhook] Invoice paid for subscription ${subId} (${targetUrl})`);
          }
        } catch (_err) {
          // ignore
        }
      }
    } else if (event.type === 'invoice.payment_failed') {
      const invoice = event.data.object as Stripe.Invoice;
      const invoiceAny = invoice as any;
      const subId = typeof invoiceAny.subscription === 'string' ? invoiceAny.subscription : invoiceAny.subscription?.id;
      if (subId && stripe) {
        try {
          const subscription = await stripe.subscriptions.retrieve(subId);
          const targetUrl = subscription.metadata?.targetUrl;
          if (targetUrl) {
            await monitoringStore.subscribeDomain(targetUrl, subscription.metadata?.email || '', {
              status: subscription.status as any,
            });
            console.warn(`[Stripe Webhook] Invoice payment failed for subscription ${subId} (${targetUrl}), status set to ${subscription.status}`);
          }
        } catch (_err) {
          // ignore
        }
      }
    }

    return { success: true, eventType: event.type };
  } catch (err: any) {
    console.error(`[Stripe Webhook Error] Signature verification failed: ${err.message}`);
    return { success: false };
  }
}

export async function cancelMonitoringSubscription(
  domain: string,
  userSessionId?: string
): Promise<{ success: boolean; status?: number; message?: string; subscription?: any }> {
  const sub = await monitoringStore.getSubscription(domain);
  if (!sub) {
    return { success: false, status: 404, message: 'Subscription not found for this domain.' };
  }

  // Server-side authorization check (IDOR Protection)
  if (!userSessionId) {
    return { success: false, status: 401, message: 'Authentication required to manage subscription.' };
  }
  if (!sub.userSessionId || sub.userSessionId !== userSessionId) {
    return { success: false, status: 403, message: 'You do not have permission to manage this subscription.' };
  }

  const stripe = getStripe();
  if (stripe && sub.stripeSubscriptionId) {
    try {
      const updatedSub = await stripe.subscriptions.update(sub.stripeSubscriptionId, {
        cancel_at_period_end: true,
      });

      const updated = await monitoringStore.subscribeDomain(domain, sub.email, {
        cancelAtPeriodEnd: true,
        canceledAt: new Date().toISOString(),
        currentPeriodEnd: (updatedSub as any).current_period_end ? new Date((updatedSub as any).current_period_end * 1000).toISOString() : sub.currentPeriodEnd,
      });

      return { success: true, subscription: updated };
    } catch (err: any) {
      console.error('[Stripe Cancel Subscription Error]:', err?.message);
      return { success: false, status: 500, message: err?.message || 'Failed to cancel subscription on Stripe.' };
    }
  }

  // Fallback for mock/dev environment
  const updated = await monitoringStore.subscribeDomain(domain, sub.email, {
    cancelAtPeriodEnd: true,
    canceledAt: new Date().toISOString(),
  });
  return { success: true, subscription: updated };
}

export async function reactivateMonitoringSubscription(
  domain: string,
  userSessionId?: string
): Promise<{ success: boolean; status?: number; message?: string; subscription?: any }> {
  const sub = await monitoringStore.getSubscription(domain);
  if (!sub) {
    return { success: false, status: 404, message: 'Subscription not found for this domain.' };
  }

  // Server-side authorization check (IDOR Protection)
  if (!userSessionId) {
    return { success: false, status: 401, message: 'Authentication required to manage subscription.' };
  }
  if (!sub.userSessionId || sub.userSessionId !== userSessionId) {
    return { success: false, status: 403, message: 'You do not have permission to manage this subscription.' };
  }

  const stripe = getStripe();
  if (stripe && sub.stripeSubscriptionId) {
    try {
      const updatedSub = await stripe.subscriptions.update(sub.stripeSubscriptionId, {
        cancel_at_period_end: false,
      });

      const updated = await monitoringStore.subscribeDomain(domain, sub.email, {
        cancelAtPeriodEnd: false,
        canceledAt: null,
        status: updatedSub.status as any,
      });

      return { success: true, subscription: updated };
    } catch (err: any) {
      console.error('[Stripe Reactivate Subscription Error]:', err?.message);
      return { success: false, status: 500, message: err?.message || 'Failed to reactivate subscription on Stripe.' };
    }
  }

  // Fallback for mock/dev environment
  const updated = await monitoringStore.subscribeDomain(domain, sub.email, {
    cancelAtPeriodEnd: false,
    canceledAt: null,
    status: 'active',
  });
  return { success: true, subscription: updated };
}

export async function createCustomerPortalSession(
  domain: string,
  returnUrl: string,
  userSessionId?: string
): Promise<{ success: boolean; status?: number; url?: string; message?: string }> {
  const sub = await monitoringStore.getSubscription(domain);
  if (!sub) {
    return { success: false, status: 404, message: 'Subscription not found.' };
  }

  if (!userSessionId) {
    return { success: false, status: 401, message: 'Authentication required to access billing portal.' };
  }

  // Server-side authorization check (IDOR Protection)
  if (!sub.userSessionId || sub.userSessionId !== userSessionId) {
    return { success: false, status: 403, message: 'You do not have permission to access billing for this domain.' };
  }

  const stripe = getStripe();
  if (!stripe) {
    return { success: false, status: 400, message: 'Stripe is not configured in this environment.' };
  }

  if (!sub.stripeCustomerId) {
    return { success: false, status: 400, message: 'No Stripe Customer ID associated with this subscription.' };
  }

  try {
    const portalSession = await stripe.billingPortal.sessions.create({
      customer: sub.stripeCustomerId,
      return_url: returnUrl,
    });
    return { success: true, url: portalSession.url };
  } catch (err: any) {
    console.error('[Stripe Customer Portal Error]:', err?.message);
    return { success: false, status: 500, message: err?.message || 'Failed to create Customer Portal session.' };
  }
}

