import { AnalyzeRateLimiter } from '../crawler/rateLimiter';

async function testRateLimiter() {
  console.log('🧪 Starting Rate Limiter Unit Tests...');

  const limiter = new AnalyzeRateLimiter({
    windowMs: 60 * 1000,
    maxPerWindow: 3,
    maxConcurrentPerIp: 2,
    maxConcurrentGlobal: 4,
  });

  // 1. IP Window Limit Test
  const ip1 = '192.168.1.100'; // test string IP name
  const res1 = await limiter.checkAndAcquire(ip1);
  const res2 = await limiter.checkAndAcquire(ip1);
  await limiter.release(ip1);
  await limiter.release(ip1);

  const res3 = await limiter.checkAndAcquire(ip1);
  await limiter.release(ip1);

  // 4th request in window should be blocked
  const res4 = await limiter.checkAndAcquire(ip1);
  if (res4.allowed) {
    throw new Error('Expected 4th request to be blocked by window limit');
  }
  if (res4.reason !== 'WINDOW_LIMIT') {
    throw new Error(`Expected reason WINDOW_LIMIT, got ${res4.reason}`);
  }
  console.log('  ✅ PASS: 1. Per-IP window limit enforced correctly (3 max per window)');

  // 2. Concurrent IP limit test
  limiter.reset();
  const ip2 = '10.20.30.40';
  const c1 = await limiter.checkAndAcquire(ip2);
  const c2 = await limiter.checkAndAcquire(ip2);
  if (!c1.allowed || !c2.allowed) {
    throw new Error('Expected first 2 concurrent acquisitions to succeed');
  }

  const c3 = await limiter.checkAndAcquire(ip2);
  if (c3.allowed || c3.reason !== 'CONCURRENT_IP_LIMIT') {
    throw new Error('Expected 3rd active acquisition for same IP to be blocked');
  }
  console.log('  ✅ PASS: 2. Per-IP concurrent crawl limit enforced (2 max active)');

  // Release one and acquire again
  await limiter.release(ip2);
  const c4 = await limiter.checkAndAcquire(ip2);
  if (!c4.allowed) {
    throw new Error('Expected acquisition to succeed after releasing active slot');
  }
  console.log('  ✅ PASS: 3. Releasing active scan slot allows subsequent requests');

  limiter.reset();
  console.log('🎉 Rate Limiter Unit Tests passed successfully.');
}

testRateLimiter().catch((err) => {
  console.error('❌ Rate Limiter Test Failed:', err);
  process.exit(1);
});
