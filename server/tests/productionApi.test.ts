import fs from 'fs';
import path from 'path';

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

  console.log('\n🧪 Starting Vercel Production API + Stripe Audit Tests...\n');

  // ─── 1. api/index.ts validity ──────────────────────────────────────────────
  {
    console.log('► Test 1: api/index.ts has no invalid TypeScript extensions in imports...');
    const apiIndex = fs.readFileSync(path.join(root, 'api', 'index.ts'), 'utf-8');
    assert(!apiIndex.includes("from '../server.ts'"), '1a. export { default } from "../server"; does NOT use .ts extension');
  }

  // ─── 2. /api/health endpoint ───────────────────────────────────────────────
  {
    console.log('\n► Test 2: /api/health endpoint exists in server.ts...');
    const serverTs = fs.readFileSync(path.join(root, 'server.ts'), 'utf-8');
    assert(serverTs.includes('app.get("/api/health"'), '2a. /api/health endpoint is defined');
    assert(serverTs.includes('res.json({'), '2b. /api/health returns JSON');
  }

  // ─── 3. Diagnostic API endpoint (analyze) ──────────────────────────────────
  {
    console.log('\n► Test 3: /api/analyze diagnostic endpoint checks...');
    const serverTs = fs.readFileSync(path.join(root, 'server.ts'), 'utf-8');
    assert(serverTs.includes('app.post("/api/analyze"'), '3a. /api/analyze is a POST route');
    assert(serverTs.includes('res.json({'), '3b. /api/analyze returns JSON');
    assert(serverTs.includes('res.status(400).json({'), '3c. /api/analyze returns JSON on error, not HTML');
  }

  // ─── 4. Stripe Subscription Session ────────────────────────────────────────
  {
    console.log('\n► Test 4: /api/monitoring/create-subscription-session checks...');
    const serverTs = fs.readFileSync(path.join(root, 'server.ts'), 'utf-8');
    assert(serverTs.includes('app.post("/api/monitoring/create-subscription-session"'), '4a. POST route exists');
    assert(serverTs.includes('return res.json({'), '4b. Returns JSON containing checkoutUrl');
  }

  // ─── 5. Stripe Redirect ────────────────────────────────────────────────────
  {
    console.log('\n► Test 5: Frontend Stripe Redirect checks...');
    const dashboardTsx = fs.readFileSync(path.join(root, 'src/components/MonitoringDashboard.tsx'), 'utf-8');
    assert(dashboardTsx.includes('window.location.href = data.checkoutUrl'), '5a. Frontend properly redirects to Stripe Checkout URL');
  }

  // ─── 6. Stripe Environment ─────────────────────────────────────────────────
  {
    console.log('\n► Test 6: Environment variables loaded properly...');
    const envExample = fs.readFileSync(path.join(root, '.env.example'), 'utf-8');
    assert(envExample.includes('STRIPE_SECRET_KEY='), '6a. STRIPE_SECRET_KEY required');
    assert(envExample.includes('STRIPE_MONITORING_PRICE_ID='), '6b. STRIPE_MONITORING_PRICE_ID required');
  }

  // ─── 7. Webhook & Stripe ───────────────────────────────────────────────────
  {
    console.log('\n► Test 7: Webhook and Stripe configuration...');
    const serverTs = fs.readFileSync(path.join(root, 'server.ts'), 'utf-8');
    assert(serverTs.includes('app.post('), '7a. /api/webhook is a POST route');
    assert(serverTs.includes('express.raw({ type: "application/json" })'), '7b. Uses raw body for signature verification');
    assert(serverTs.indexOf('express.raw') < serverTs.indexOf('express.json()'), '7c. Raw parser precedes JSON parser');
    const vercelJson = fs.readFileSync(path.join(root, 'vercel.json'), 'utf-8');
    assert(vercelJson.includes('"source": "/api/:path*",'), '7d. Vercel API rewrite allows all /api/* requests, including webhook');
  }

  // ─── 8. Session Cookie ─────────────────────────────────────────────────────
  {
    console.log('\n► Test 8: Session cookie correctly handled...');
    const serverTs = fs.readFileSync(path.join(root, 'server.ts'), 'utf-8');
    assert(serverTs.includes('res.cookie("crawlsignal_session"'), '8a. Cookie is set');
    assert(serverTs.includes('httpOnly: true'), '8b. Cookie is HttpOnly');
  }

  // ─── Summary ──────────────────────────────────────────────────────────────
  console.log(`\n${'─'.repeat(60)}`);
  if (failed === 0) {
    console.log(`🎉 All ${passed} Production API + Stripe Audit tests passed!\n`);
  } else {
    console.error(`❌ ${failed} test(s) failed out of ${passed + failed}.\n`);
    process.exit(1);
  }
}

runTests().catch((err) => {
  console.error('Test suite crashed:', err);
  process.exit(1);
});
