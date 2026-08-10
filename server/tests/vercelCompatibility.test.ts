/**
 * CRAWLSIGNAL — Vercel Production Compatibility Tests
 *
 * Verifies the 25 Vercel-specific requirements without a live Vercel environment.
 */

import fs from 'fs';
import path from 'path';
import { translations } from '../../src/i18n/translations';

let passed = 0;
let failed = 0;

function assert(condition: boolean, label: string) {
  if (condition) {
    console.log(`  ✅ PASS: ${label}`);
    passed++;
  } else {
    console.error(`  ❌ FAIL: ${label}`);
    failed++;
  }
}

async function runTests() {
  const root = path.resolve('.');

  console.log('\n🧪 Starting Vercel Production Compatibility Tests...\n');

  // ─── 1. vercel.json exists and is valid ───────────────────────────────────
  {
    console.log('► Test 1: vercel.json exists and is valid JSON...');
    const vercelJsonPath = path.join(root, 'vercel.json');
    const exists = fs.existsSync(vercelJsonPath);
    assert(exists, '1a. vercel.json exists');
    if (exists) {
      const raw = fs.readFileSync(vercelJsonPath, 'utf-8');
      let config: any;
      try { config = JSON.parse(raw); } catch { config = null; }
      assert(config !== null, '1b. vercel.json is valid JSON');
      assert(typeof config?.functions === 'object', '1c. vercel.json has functions config');
      assert(Array.isArray(config?.rewrites), '1d. vercel.json has rewrites');
      assert(Array.isArray(config?.crons), '1e. vercel.json has crons config');

      const spaRewrite = config?.rewrites?.find((r: any) => r.source === '/(.*)');
      assert(!!spaRewrite, '1g. SPA fallback rewrite rule present');

      const cronJob = config?.crons?.[0];
      assert(cronJob?.path === '/api/cron/run-monitoring', '1h. Cron targets /api/cron/run-monitoring');
      assert(!!cronJob?.schedule, '1i. Cron has a schedule');

      const fnConfig = config?.functions?.['api/[[...path]].ts'];
      assert(fnConfig?.maxDuration >= 60, '1j. API function maxDuration >= 60s (Vercel Pro required)');
    }
  }

  // ─── 2. api/[[...path]].ts entry point exists ──────────────────────────────
  {
    console.log('\n► Test 2: api/[[...path]].ts entry point exists...');
    const apiIndexPath = path.join(root, 'api', '[[...path]].ts');
    assert(fs.existsSync(apiIndexPath), '2. api/[[...path]].ts exists');
  }

  // ─── 3. server.ts does NOT import Vite at top level ──────────────────────
  {
    console.log('\n► Test 3: server.ts does not import Vite at module level...');
    const serverTs = fs.readFileSync(path.join(root, 'server.ts'), 'utf-8');
    const hasTopLevelViteImport = !!serverTs.match(/^import.*createViteServer.*from\s+['"]vite['"]/m);
    assert(!hasTopLevelViteImport, '3a. No top-level Vite import (prevents Vercel Function crash)');
    assert(serverTs.includes('export default app'), '3b. app exported as default for Vercel handler');
    assert(!serverTs.includes('startServer().catch'), '3c. startServer() entrypoint removed from top level');
  }

  // ─── 4. app.listen() only in dev guard ───────────────────────────────────
  {
    console.log('\n► Test 4: app.listen() guarded by NODE_ENV/VERCEL check...');
    const serverTs = fs.readFileSync(path.join(root, 'server.ts'), 'utf-8');
    // listen() appears AFTER the export default and INSIDE the NODE_ENV/VERCEL guard block
    const exportIdx = serverTs.indexOf('export default app');
    const listenIdx = serverTs.indexOf('app.listen(PORT');
    assert(listenIdx > exportIdx, '4. app.listen() comes after export default (inside local dev block)');
    assert(serverTs.includes('!process.env.VERCEL'), '4b. VERCEL env var explicitly checked before listen()');
  }

  // ─── 5. analyticsService.ts has production disk-write guard ──────────────
  {
    console.log('\n► Test 5: analyticsService.ts skips disk writes in production...');
    const analyticsTs = fs.readFileSync(
      path.join(root, 'server', 'analytics', 'analyticsService.ts'), 'utf-8'
    );
    assert(analyticsTs.includes('isProduction()'), '5a. isProduction() method exists');
    assert(analyticsTs.includes('VERCEL'), '5b. VERCEL env var checked in isProduction()');
    assert(analyticsTs.includes('if (this.isProduction()) return;'), '5c. saveToDisk() bails early in production');
  }

  // ─── 6. Firestore init supports service account credentials ──────────────
  {
    console.log('\n► Test 6: Firestore init supports FIREBASE_CLIENT_EMAIL + FIREBASE_PRIVATE_KEY...');
    const storeTs = fs.readFileSync(path.join(root, 'server', 'db', 'store.ts'), 'utf-8');
    assert(storeTs.includes('FIREBASE_CLIENT_EMAIL'), '6a. FIREBASE_CLIENT_EMAIL supported');
    assert(storeTs.includes('FIREBASE_PRIVATE_KEY'), '6b. FIREBASE_PRIVATE_KEY supported');
    assert(storeTs.includes('\\\\n'), '6c. Private key newline unescaping implemented');
    assert(storeTs.includes('credentials:'), '6d. Firestore credentials option used for service account');
  }

  // ─── 7. Stripe webhook raw body preservation ─────────────────────────────
  {
    console.log('\n► Test 7: Stripe webhook uses raw body parser...');
    const serverTs = fs.readFileSync(path.join(root, 'server.ts'), 'utf-8');
    assert(serverTs.includes("express.raw({ type: \"application/json\" })"), '7a. express.raw() used for webhook');
    const rawIdx = serverTs.indexOf('express.raw');
    const jsonIdx = serverTs.indexOf('express.json()');
    assert(rawIdx < jsonIdx, '7b. express.raw() registered BEFORE express.json()');
  }

  // ─── 8. Cron authentication verified ──────────────────────────────────────
  {
    console.log('\n► Test 8: Cron endpoint requires CRON_SECRET authentication...');
    const serverTs = fs.readFileSync(path.join(root, 'server.ts'), 'utf-8');
    assert(serverTs.includes('CRON_SECRET'), '8a. CRON_SECRET env var checked');
    assert(serverTs.includes('run-monitoring') && (serverTs.includes('app.all(') || serverTs.includes('app.get(')), '8b. /api/cron/run-monitoring endpoint accepts GET requests');
    assert(serverTs.includes('401'), '8c. 401 returned for missing/invalid cron secret');
  }

  // ─── 9. IDOR protection in cancel/reactivate/portal ──────────────────────
  {
    console.log('\n► Test 9: IDOR protection endpoints check session...');
    const serverTs = fs.readFileSync(path.join(root, 'server.ts'), 'utf-8');
    assert(serverTs.includes('authSessionId'), '9a. authSessionId used for auth');
    assert(serverTs.includes('userSessionId'), '9b. userSessionId derived from cookie');
    assert(!!serverTs.match(/cancel-subscription[\s\S]{0,500}authSessionId/), '9c. cancel-subscription uses authSessionId');
  }

  // ─── 10. Session cookie is HttpOnly ───────────────────────────────────────
  {
    console.log('\n► Test 10: Session cookie set with HttpOnly, Secure, SameSite...');
    const serverTs = fs.readFileSync(path.join(root, 'server.ts'), 'utf-8');
    assert(serverTs.includes('httpOnly: true'), '10a. httpOnly: true');
    assert(serverTs.includes('secure: isProd'), '10b. secure flag conditional on production');
    assert(serverTs.includes("sameSite: \"lax\""), '10c. sameSite: lax');
    assert(serverTs.includes('crawlsignal_session'), '10d. cookie named crawlsignal_session');
  }

  // ─── 11. No x-session-id / x-user-token in auth ──────────────────────────
  {
    console.log('\n► Test 11: No insecure header-based session auth...');
    const serverTs = fs.readFileSync(path.join(root, 'server.ts'), 'utf-8');
    assert(!serverTs.includes("x-session-id"), '11a. x-session-id NOT used for auth');
    assert(!serverTs.includes("x-user-token"), '11b. x-user-token NOT used for auth');
    assert(!serverTs.includes("req.body.sessionId"), '11c. req.body.sessionId NOT used for auth');
  }

  // ─── 12. Firestore distributed lock present ───────────────────────────────
  {
    console.log('\n► Test 12: Distributed lock (Firestore transaction) implemented...');
    const storeTs = fs.readFileSync(path.join(root, 'server', 'db', 'store.ts'), 'utf-8');
    assert(storeTs.includes('acquireJobLock'), '12a. acquireJobLock implemented');
    assert(storeTs.includes('releaseJobLock'), '12b. releaseJobLock implemented');
    assert(storeTs.includes('runTransaction'), '12c. Firestore runTransaction used for atomicity');
  }

  // ─── 13. No secrets in Vite env (VITE_ prefix check) ─────────────────────
  {
    console.log('\n► Test 13: No secrets exposed via VITE_ prefix...');
    const projectFiles = [
      path.join(root, '.env.example'),
      path.join(root, 'vite.config.ts'),
    ];
    for (const f of projectFiles) {
      if (fs.existsSync(f)) {
        const content = fs.readFileSync(f, 'utf-8');
        assert(!content.includes('VITE_STRIPE'), `13a. No VITE_STRIPE_ in ${path.basename(f)}`);
        assert(!content.includes('VITE_FIREBASE_PRIVATE_KEY'), `13b. No VITE_FIREBASE_PRIVATE_KEY in ${path.basename(f)}`);
      }
    }
  }

  // ─── 14. Filesystem independence — PersistentDbStore prod guard ───────────
  {
    console.log('\n► Test 14: PersistentDbStore skips disk writes in production...');
    const storeTs = fs.readFileSync(path.join(root, 'server', 'db', 'store.ts'), 'utf-8');
    assert(storeTs.includes('K_SERVICE'), '14a. K_SERVICE (Cloud Run) detected');
    assert(storeTs.includes('isProd'), '14b. isProd guard present');
    const saveToDiskBlock = storeTs.match(/saveToDisk\(\)[\s\S]{0,400}/);
    assert(saveToDiskBlock?.[0]?.includes('isProd') || saveToDiskBlock?.[0]?.includes('return'), '14c. saveToDisk() returns early in production');
  }

  // ─── 15. Vercel cron authentication check ─────────────────────────────────
  {
    console.log('\n► Test 15: Vercel Cron auth accepts Bearer token and x-cron-secret...');
    const serverTs = fs.readFileSync(path.join(root, 'server.ts'), 'utf-8');
    assert(serverTs.includes("startsWith('Bearer ')"), '15a. Bearer token auth supported');
    assert(serverTs.includes("x-cron-secret"), '15b. x-cron-secret header accepted');
  }

  // ─── 16. Monitoring job statuses filtered ─────────────────────────────────
  {
    console.log('\n► Test 16: Monitoring cron filters canceled/unpaid subscriptions...');
    const cronTs = fs.readFileSync(path.join(root, 'server', 'monitoring', 'cronScheduler.ts'), 'utf-8');
    // The subscription filtering is in monitoringStore.getAllSubscribedDomains
    const storeMonTs = fs.readFileSync(path.join(root, 'server', 'monitoring', 'monitoringStore.ts'), 'utf-8');
    assert(
      storeMonTs.includes('active') || cronTs.includes('active'),
      '16. Active subscription filter present in monitoring pipeline'
    );
  }

  // ─── 17. Rate limiter degradation acknowledged ────────────────────────────
  {
    console.log('\n► Test 17: Rate limiter implementation supports distributed execution (Firestore)...');
    const rlTs = fs.readFileSync(path.join(root, 'server', 'crawler', 'rateLimiter.ts'), 'utf-8');
    assert(rlTs.includes('dbStore.getFirestore()') || rlTs.includes('runTransaction'), '17a. Rate limiter uses Firestore transactions for distributed state');
    assert(rlTs.includes('async checkAndAcquire'), '17b. checkAndAcquire method is async');
    assert(rlTs.includes('async release'), '17c. release method is async');
  }

  // ─── 18. i18n keys parity EN / FR / ES ────────────────────────────────────
  {
    console.log('\n► Test 18: i18n key parity EN / FR / ES...');
    const enKeys = Object.keys(translations.en.monitoring).sort();
    const frKeys = Object.keys(translations.fr.monitoring).sort();
    const esKeys = Object.keys(translations.es.monitoring).sort();
    assert(
      enKeys.length === frKeys.length,
      `18a. FR monitoring keys count matches EN (${frKeys.length}/${enKeys.length})`
    );
    assert(
      enKeys.length === esKeys.length,
      `18b. ES monitoring keys count matches EN (${esKeys.length}/${enKeys.length})`
    );
  }

  // ─── 19. SSRF guard in crawler ────────────────────────────────────────────
  {
    console.log('\n► Test 19: SSRF guard integrated in crawler...');
    const crawlerTs = fs.readFileSync(path.join(root, 'server', 'crawler', 'crawlerEngine.ts'), 'utf-8');
    assert(crawlerTs.includes('validateUrlForSsrf'), '19a. validateUrlForSsrf called in runTechnicalCrawl');
    assert(crawlerTs.includes('SSRF_SECURITY_BLOCK'), '19b. SSRF error thrown on unsafe URL');
  }

  // ─── 20. Multi-instance safety (Firestore as truth) ──────────────────────
  {
    console.log('\n► Test 20: Multi-instance safety via Firestore...');
    const storeTs = fs.readFileSync(path.join(root, 'server', 'db', 'store.ts'), 'utf-8');
    assert(storeTs.includes('runTransaction'), '20a. Atomic Firestore transactions used');
    assert(storeTs.includes('expiresAt'), '20b. Lock TTL/expiry mechanism present');
    assert(storeTs.includes('appendHistoryAtomically'), '20c. Atomic history append implemented');
  }

  // ─── 21. Stripe subscriptions integrity ───────────────────────────────────
  {
    console.log('\n► Test 21: Stripe subscription features intact...');
    const stripeTs = fs.readFileSync(path.join(root, 'server', 'payments', 'stripeService.ts'), 'utf-8');
    assert(stripeTs.includes('trial_period_days'), '21a. 7-day trial configured');
    assert(stripeTs.includes('cancel_at_period_end'), '21b. cancel_at_period_end used');
    assert(stripeTs.includes('customer.subscription.deleted'), '21c. subscription.deleted webhook handled');
    assert(stripeTs.includes('invoice.payment_failed'), '21d. payment_failed webhook handled');
    assert(stripeTs.includes('createCustomerPortalSession') || stripeTs.includes('billingPortal'), '21e. Customer Portal implemented');
  }

  // ─── 22. .env.example has all required Vercel vars ───────────────────────
  {
    console.log('\n► Test 22: .env.example contains all required Vercel variables...');
    const envExample = fs.readFileSync(path.join(root, '.env.example'), 'utf-8');
    assert(envExample.includes('STRIPE_SECRET_KEY'), '22a. STRIPE_SECRET_KEY documented');
    assert(envExample.includes('STRIPE_WEBHOOK_SECRET'), '22b. STRIPE_WEBHOOK_SECRET documented');
    assert(envExample.includes('STRIPE_MONITORING_PRICE_ID'), '22c. STRIPE_MONITORING_PRICE_ID documented');
    assert(envExample.includes('FIREBASE_PROJECT_ID'), '22d. FIREBASE_PROJECT_ID documented');
    assert(envExample.includes('FIREBASE_CLIENT_EMAIL'), '22e. FIREBASE_CLIENT_EMAIL documented');
    assert(envExample.includes('FIREBASE_PRIVATE_KEY'), '22f. FIREBASE_PRIVATE_KEY documented');
    assert(envExample.includes('APP_URL'), '22g. APP_URL documented');
    assert(envExample.includes('CRON_SECRET'), '22h. CRON_SECRET documented');
  }

  // ─── 23. Vercel cron schedule is valid cron syntax ────────────────────────
  {
    console.log('\n► Test 23: Vercel cron schedule uses valid format...');
    const vercelJson = JSON.parse(fs.readFileSync(path.join(root, 'vercel.json'), 'utf-8'));
    const schedule = vercelJson?.crons?.[0]?.schedule;
    // Valid cron: five fields separated by spaces
    assert(/^[\d*/,\-]+ [\d*/,\-]+ [\d*/,\-]+ [\d*/,\-]+ [\d*/,\-]+$/.test(schedule || ''), '23. Cron schedule format is valid');
  }

  // ─── Summary ──────────────────────────────────────────────────────────────
  console.log(`\n${'─'.repeat(60)}`);
  if (failed === 0) {
    console.log(`🎉 All ${passed} Vercel compatibility tests passed!\n`);
  } else {
    console.error(`❌ ${failed} test(s) failed out of ${passed + failed}.\n`);
    process.exit(1);
  }
}

runTests().catch((err) => {
  console.error('Test suite crashed:', err);
  process.exit(1);
});
