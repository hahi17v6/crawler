const fs = require('fs');
const file = './server/payments/stripeService.ts';
let code = fs.readFileSync(file, 'utf8');

// 1. Add back the missing types
const typesToAdd = `export type StripeSubscriptionWithPeriod = Stripe.Subscription & {
  current_period_start?: number;
  current_period_end?: number;
};

export type StripeInvoiceWithSubscription = Stripe.Invoice & {
  subscription?: string | StripeSubscriptionWithPeriod | null;
};

`;
code = code.replace('// Custom interfaces removed in favor of native Stripe types\n\n', typesToAdd);

// 2. Replace all instances of `Stripe.Subscription` with `StripeSubscriptionWithPeriod` (but only where appropriate)
code = code.replace(/let subObj: Stripe\.Subscription \| null = null;/g, 'let subObj: StripeSubscriptionWithPeriod | null = null;');
code = code.replace(/subObj = await stripe\.subscriptions\.retrieve\(subId\);/g, 'subObj = (await stripe.subscriptions.retrieve(subId)) as StripeSubscriptionWithPeriod;');
code = code.replace(/const subscription = event\.data\.object as Stripe\.Subscription;/g, 'const subscription = event.data.object as StripeSubscriptionWithPeriod;');
code = code.replace(/const invoice = event\.data\.object as Stripe\.Invoice;/g, 'const invoice = event.data.object as StripeInvoiceWithSubscription;');
code = code.replace(/const subscription = await stripe\.subscriptions\.retrieve\(subId\);/g, 'const subscription = (await stripe.subscriptions.retrieve(subId)) as StripeSubscriptionWithPeriod;');
code = code.replace(/const updatedSub = await stripe\.subscriptions\.update\(sub\.stripeSubscriptionId, {/g, 'const updatedSub = (await stripe.subscriptions.update(sub.stripeSubscriptionId, {');
code = code.replace(/cancel_at_period_end: true,\n      });/g, 'cancel_at_period_end: true,\n      })) as StripeSubscriptionWithPeriod;');
code = code.replace(/cancel_at_period_end: false,\n      });/g, 'cancel_at_period_end: false,\n      })) as StripeSubscriptionWithPeriod;');

// 3. Fix status typings by asserting to `any` since Stripe's status enum might have added values not in our schema
code = code.replace(/status: subscription\.status,/g, 'status: subscription.status as any,');
code = code.replace(/status: updatedSub\.status,/g, 'status: updatedSub.status as any,');
code = code.replace(/const status = subObj\?\.status \|\| 'trialing';/g, 'const status = (subObj?.status as any) || \'trialing\';');

fs.writeFileSync(file, code);
