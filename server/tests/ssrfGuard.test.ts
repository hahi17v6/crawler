import { validateUrlForSsrf, isPrivateIp } from '../crawler/ssrfGuard';

async function testSsrfGuard() {
  console.log('🧪 Starting SSRF Guard Unit Tests...');

  // 1. Check IP range classification
  const testIps = [
    { ip: '127.0.0.1', expectedPrivate: true },
    { ip: '10.0.0.1', expectedPrivate: true },
    { ip: '172.16.0.1', expectedPrivate: true },
    { ip: '192.168.1.1', expectedPrivate: true },
    { ip: '169.254.169.254', expectedPrivate: true },
    { ip: '0.0.0.0', expectedPrivate: true },
    { ip: '::1', expectedPrivate: true },
    { ip: 'fe80::1', expectedPrivate: true },
    { ip: 'fc00::1', expectedPrivate: true },
    { ip: '8.8.8.8', expectedPrivate: false },
    { ip: '1.1.1.1', expectedPrivate: false },
    { ip: '93.184.216.34', expectedPrivate: false },
  ];

  for (const item of testIps) {
    const isPriv = isPrivateIp(item.ip);
    if (isPriv !== item.expectedPrivate) {
      throw new Error(`IP ${item.ip} expected private=${item.expectedPrivate}, got ${isPriv}`);
    }
  }
  console.log('  ✅ PASS: 1. All IPv4 and IPv6 private/reserved ranges detected correctly');

  // 2. Hostname validation checks
  const testUrls = [
    { url: 'http://localhost/admin', expectedSafe: false },
    { url: 'http://127.0.0.1:8080/metrics', expectedSafe: false },
    { url: 'http://169.254.169.254/latest/meta-data/', expectedSafe: false },
    { url: 'http://[::1]/', expectedSafe: false },
    { url: 'http://internal.local/status', expectedSafe: false },
    { url: 'file:///etc/passwd', expectedSafe: false },
    { url: 'gopher://127.0.0.1:70', expectedSafe: false },
    { url: 'http://example.com:22/ssh', expectedSafe: false },
    { url: 'https://crawlsignal.com', expectedSafe: true },
  ];

  for (const item of testUrls) {
    const res = await validateUrlForSsrf(item.url);
    if (res.safe !== item.expectedSafe) {
      throw new Error(`URL ${item.url} expected safe=${item.expectedSafe}, got ${res.safe} (${res.error})`);
    }
  }
  console.log('  ✅ PASS: 2. Localhost, metadata, non-HTTP, and custom port URLs blocked');

  console.log('🎉 SSRF Guard Unit Tests passed successfully.');
}

testSsrfGuard().catch((err) => {
  console.error('❌ SSRF Guard Test Failed:', err);
  process.exit(1);
});
