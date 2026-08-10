import { runTechnicalChecks } from '../checker/checksEngine';
import { CrawlDiagnosticOutput } from '../crawler/crawlerEngine';

function assert(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(`TEST FAILED: ${message}`);
  }
}

console.log('🧪 Starting Technical Checks Unit Tests...\n');

let passedTests = 0;
let totalTests = 0;

function runTest(testName: string, testFn: () => void) {
  totalTests++;
  try {
    testFn();
    console.log(`  ✅ PASS: ${testName}`);
    passedTests++;
  } catch (err: any) {
    console.error(`  ❌ FAIL: ${testName}\n     ${err.message}`);
  }
}

// Mock healthy baseline crawl data
function createMockCrawlData(overrides: Partial<CrawlDiagnosticOutput> = {}): CrawlDiagnosticOutput {
  return {
    site: {
      requestedUrl: 'https://example.com',
      hostname: 'example.com',
      crawledAt: new Date().toISOString(),
    },
    homepage: {
      url: 'https://example.com',
      status: 200,
      finalUrl: 'https://example.com/',
      redirects: [],
      title: 'Example Domain - Official Homepage',
      metaRobots: 'index, follow',
      canonical: 'https://example.com/',
      internalLinksCount: 12,
      externalLinksCount: 3,
      jsRenderedLikely: false,
      bodyLength: 2500,
    },
    robots: {
      exists: true,
      url: 'https://example.com/robots.txt',
      status: 200,
      sitemaps: ['https://example.com/sitemap.xml'],
      disallowedPaths: ['/admin/'],
      disallowsAll: false,
    },
    sitemap: {
      exists: true,
      url: 'https://example.com/sitemap.xml',
      status: 200,
      type: 'urlset',
      urlsFoundCount: 25,
      sampleUrls: [
        'https://example.com/about',
        'https://example.com/services',
        'https://example.com/contact',
      ],
      errors: [],
    },
    pages: [
      {
        url: 'https://example.com/about',
        status: 200,
        finalUrl: 'https://example.com/about',
        title: 'About Us',
        metaRobots: 'index, follow',
        canonical: 'https://example.com/about',
        source: 'homepage_link',
      },
    ],
    links: [
      {
        source: 'https://example.com/',
        target: 'https://example.com/about',
        isInternal: true,
      },
      {
        source: 'https://example.com/',
        target: 'https://example.com/services',
        isInternal: true,
      },
      {
        source: 'https://example.com/',
        target: 'https://example.com/contact',
        isInternal: true,
      },
    ],
    errors: [],
    ...overrides,
  };
}

// 1. Healthy Site -> All checks PASS
runTest('1. Healthy site returns all 10 checks passing', () => {
  const data = createMockCrawlData();
  const results = runTechnicalChecks(data);

  assert(results.length === 10, `Expected 10 check results, got ${results.length}`);
  const nonPass = results.filter((r) => r.status !== 'pass');
  assert(nonPass.length === 0, `Expected 0 warnings/criticals on healthy site, got ${nonPass.length}: ${nonPass.map((r) => r.id).join(', ')}`);
});

// 2. HTTP Status Check -> 500 error on homepage
runTest('2. HTTP status check detects 500 server error', () => {
  const data = createMockCrawlData({
    homepage: {
      url: 'https://example.com',
      status: 500,
      finalUrl: 'https://example.com',
      redirects: [],
      title: null,
      metaRobots: null,
      canonical: null,
      internalLinksCount: 0,
      externalLinksCount: 0,
      jsRenderedLikely: false,
      bodyLength: 0,
    },
  });

  const results = runTechnicalChecks(data);
  const httpCheck = results.find((r) => r.id === 'http_status')!;
  assert(httpCheck.status === 'critical', `Expected status critical, got ${httpCheck.status}`);
  assert(httpCheck.severity === 'critical', `Expected severity critical, got ${httpCheck.severity}`);
  assert(httpCheck.evidence.includes('500'), 'Evidence should cite HTTP 500');
});

// 3. robots.txt -> Disallow: /
runTest('3. robots.txt check flags Disallow: / as critical', () => {
  const data = createMockCrawlData({
    robots: {
      exists: true,
      url: 'https://example.com/robots.txt',
      status: 200,
      sitemaps: [],
      disallowedPaths: ['/'],
      disallowsAll: true,
    },
  });

  const results = runTechnicalChecks(data);
  const robCheck = results.find((r) => r.id === 'robots_txt')!;
  assert(robCheck.status === 'critical', `Expected critical status, got ${robCheck.status}`);
  assert(robCheck.evidence.includes('Disallow: /'), 'Evidence should note Disallow: /');
});

// 4. Sitemap -> Missing sitemap
runTest('4. Sitemap check flags missing sitemap as warning', () => {
  const data = createMockCrawlData({
    sitemap: {
      exists: false,
      url: 'https://example.com/sitemap.xml',
      status: 404,
      type: 'unknown',
      urlsFoundCount: 0,
      sampleUrls: [],
      errors: ['HTTP 404'],
    },
  });

  const results = runTechnicalChecks(data);
  const smCheck = results.find((r) => r.id === 'sitemap_xml')!;
  assert(smCheck.status === 'warning', `Expected warning status, got ${smCheck.status}`);
});

// 5. noindex -> Homepage noindex
runTest('5. noindex check detects homepage noindex tag', () => {
  const data = createMockCrawlData({
    homepage: {
      url: 'https://example.com',
      status: 200,
      finalUrl: 'https://example.com/',
      redirects: [],
      title: 'Example',
      metaRobots: 'noindex, nofollow',
      canonical: 'https://example.com/',
      internalLinksCount: 10,
      externalLinksCount: 2,
      jsRenderedLikely: false,
      bodyLength: 2000,
    },
  });

  const results = runTechnicalChecks(data);
  const noindexCheck = results.find((r) => r.id === 'noindex_directive')!;
  assert(noindexCheck.status === 'critical', `Expected critical status, got ${noindexCheck.status}`);
  assert(noindexCheck.evidence.includes('noindex'), 'Evidence should cite noindex');
});

// 6. Canonical -> Mismatched external domain canonical
runTest('6. Canonical check flags cross-domain canonical', () => {
  const data = createMockCrawlData({
    homepage: {
      url: 'https://example.com',
      status: 200,
      finalUrl: 'https://example.com/',
      redirects: [],
      title: 'Example',
      metaRobots: 'index, follow',
      canonical: 'https://spamdomain.com/other-page',
      internalLinksCount: 10,
      externalLinksCount: 2,
      jsRenderedLikely: false,
      bodyLength: 2000,
    },
  });

  const results = runTechnicalChecks(data);
  const canCheck = results.find((r) => r.id === 'canonical_tag')!;
  assert(canCheck.status === 'warning', `Expected warning status, got ${canCheck.status}`);
  assert(canCheck.severity === 'high', `Expected high severity, got ${canCheck.severity}`);
});

// 7. Internal Links -> 0 internal links
runTest('7. Internal links check flags 0 links on homepage', () => {
  const data = createMockCrawlData({
    homepage: {
      url: 'https://example.com',
      status: 200,
      finalUrl: 'https://example.com/',
      redirects: [],
      title: 'Example',
      metaRobots: 'index, follow',
      canonical: 'https://example.com/',
      internalLinksCount: 0,
      externalLinksCount: 0,
      jsRenderedLikely: false,
      bodyLength: 1000,
    },
  });

  const results = runTechnicalChecks(data);
  const linksCheck = results.find((r) => r.id === 'internal_links')!;
  assert(linksCheck.status === 'critical', `Expected critical status, got ${linksCheck.status}`);
});

// 8. JS Rendering -> Empty client root container
runTest('8. JS rendering check flags heavy client-side rendering', () => {
  const data = createMockCrawlData({
    homepage: {
      url: 'https://example.com',
      status: 200,
      finalUrl: 'https://example.com/',
      redirects: [],
      title: 'SPA React App',
      metaRobots: 'index, follow',
      canonical: 'https://example.com/',
      internalLinksCount: 5,
      externalLinksCount: 1,
      jsRenderedLikely: true,
      bodyLength: 80,
    },
  });

  const results = runTechnicalChecks(data);
  const jsCheck = results.find((r) => r.id === 'js_rendering_signals')!;
  assert(jsCheck.status === 'warning', `Expected warning status, got ${jsCheck.status}`);
  assert(jsCheck.evidence.includes('80 characters'), 'Evidence should note text body length');
});

// 9. Soft 404 -> Title contains 404 Not Found
runTest('9. Soft 404 check detects 200 OK with "404 Not Found" title', () => {
  const data = createMockCrawlData({
    homepage: {
      url: 'https://example.com',
      status: 200,
      finalUrl: 'https://example.com/',
      redirects: [],
      title: '404 Not Found - Error Page',
      metaRobots: 'index, follow',
      canonical: 'https://example.com/',
      internalLinksCount: 5,
      externalLinksCount: 1,
      jsRenderedLikely: false,
      bodyLength: 500,
    },
  });

  const results = runTechnicalChecks(data);
  const soft404Check = results.find((r) => r.id === 'soft_404')!;
  assert(soft404Check.status === 'critical', `Expected critical status, got ${soft404Check.status}`);
});

// 10. Crawlability -> Network Timeout Error
runTest('10. Crawlability check flags network timeouts', () => {
  const data = createMockCrawlData({
    errors: [
      {
        url: 'https://example.com',
        error: 'FETCH_TIMEOUT: Request to https://example.com timed out after 6000ms',
      },
    ],
  });

  const results = runTechnicalChecks(data);
  const crawlCheck = results.find((r) => r.id === 'crawlability')!;
  assert(crawlCheck.status === 'critical', `Expected critical status, got ${crawlCheck.status}`);
});

console.log(`\n🎉 Summary: ${passedTests}/${totalTests} unit tests passed successfully.\n`);
