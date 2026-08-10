import { createSnapshotFromCrawl, compareSnapshots } from '../monitoring/monitoringEngine';
import { CrawlDiagnosticOutput } from '../crawler/crawlerEngine';
import { ScanSnapshot } from '../monitoring/monitoringTypes';

function runMonitoringTests() {
  console.log('🧪 Starting Monitoring Engine Unit Tests...');

  const mockCrawlData1: CrawlDiagnosticOutput = {
    site: {
      requestedUrl: 'https://example.com',
      hostname: 'example.com',
      crawledAt: new Date().toISOString(),
    },
    homepage: {
      url: 'https://example.com',
      finalUrl: 'https://example.com',
      status: 200,
      redirects: [],
      bodyLength: 2500,
      title: 'Example Homepage',
      metaRobots: 'index, follow',
      canonical: 'https://example.com',
      internalLinksCount: 10,
      externalLinksCount: 2,
      jsRenderedLikely: false,
    },
    robots: {
      exists: true,
      url: 'https://example.com/robots.txt',
      status: 200,
      disallowedPaths: [],
      sitemaps: ['https://example.com/sitemap.xml'],
      disallowsAll: false,
    },
    sitemap: {
      exists: true,
      url: 'https://example.com/sitemap.xml',
      status: 200,
      type: 'urlset',
      urlsFoundCount: 50,
      sampleUrls: ['https://example.com/p1'],
      errors: [],
    },
    pages: Array.from({ length: 32 }, (_, i) => ({
      url: `https://example.com/p${i + 1}`,
      finalUrl: `https://example.com/p${i + 1}`,
      source: 'sitemap' as const,
      status: 200,
      title: `Page ${i + 1}`,
      metaRobots: 'index, follow',
      canonical: `https://example.com/p${i + 1}`,
    })),
    links: [],
    errors: [],
  };

  // 1. Test Snapshot Creation
  const snapshot1 = createSnapshotFromCrawl(mockCrawlData1);
  if (snapshot1.domain !== 'example.com') {
    throw new Error(`Expected domain 'example.com', got '${snapshot1.domain}'`);
  }
  if (snapshot1.discoveredPagesCount !== 33) { // 1 homepage + 32 pages
    throw new Error(`Expected 33 discovered pages, got ${snapshot1.discoveredPagesCount}`);
  }
  console.log('  ✅ PASS: 1. Snapshot creation normalizes crawl metrics correctly');

  // 2. Test HTTP Status Differential (32 pages now return 403)
  const mockCrawlData2: CrawlDiagnosticOutput = {
    ...mockCrawlData1,
    pages: Array.from({ length: 32 }, (_, i) => ({
      url: `https://example.com/p${i + 1}`,
      finalUrl: `https://example.com/p${i + 1}`,
      source: 'sitemap' as const,
      status: 403, // Turned into 403 Forbidden!
      title: `Page ${i + 1}`,
      metaRobots: 'index, follow',
      canonical: `https://example.com/p${i + 1}`,
    })),
  };

  const snapshot2 = createSnapshotFromCrawl(mockCrawlData2);
  const comp2 = compareSnapshots(snapshot2, snapshot1);

  const alert403 = comp2.alerts.find((a) => a.header.includes('32') && a.header.includes('403'));
  if (!alert403) {
    throw new Error('Expected alert "32 previously accessible pages now return 403." not found!');
  }
  if (!alert403.whatChanged || !alert403.whyItMatters || !alert403.whatToDo) {
    throw new Error('Alert missing required What changed / Why it matters / What to do structure!');
  }
  console.log('  ✅ PASS: 2. HTTP status differential flags "32 previously accessible pages now return 403"');

  // 3. Test Noindex Differential (14 pages became noindex)
  const mockCrawlData3: CrawlDiagnosticOutput = {
    ...mockCrawlData1,
    pages: Array.from({ length: 32 }, (_, i) => ({
      url: `https://example.com/p${i + 1}`,
      finalUrl: `https://example.com/p${i + 1}`,
      source: 'sitemap' as const,
      status: 200,
      title: `Page ${i + 1}`,
      metaRobots: i < 14 ? 'noindex, follow' : 'index, follow', // 14 pages set to noindex
      canonical: `https://example.com/p${i + 1}`,
    })),
  };

  const snapshot3 = createSnapshotFromCrawl(mockCrawlData3);
  const comp3 = compareSnapshots(snapshot3, snapshot1);

  const alertNoindex = comp3.alerts.find((a) => a.header.includes('14') && a.header.includes('noindex'));
  if (!alertNoindex) {
    throw new Error('Expected alert "14 pages became noindex." not found!');
  }
  console.log('  ✅ PASS: 3. Noindex differential flags "14 pages became noindex."');

  // 4. Test Sitemap Change Alerts
  const snapshotSitemapDiff: ScanSnapshot = {
    ...snapshot1,
    sitemapUrlCount: 10, // Dropped from 50 to 10
    sitemapErrorsCount: 27, // 27 errors
  };

  const compSitemap = compareSnapshots(snapshotSitemapDiff, snapshot1);
  const alertSigSitemap = compSitemap.alerts.find((a) => a.header === '🚨 Sitemap changed significantly.');
  const alertErrorsSitemap = compSitemap.alerts.find((a) => a.header.includes('27') && a.header.includes('errors'));

  if (!alertSigSitemap) {
    throw new Error('Expected alert "🚨 Sitemap changed significantly." not found!');
  }
  if (!alertErrorsSitemap) {
    throw new Error('Expected alert "🚨 27 sitemap URLs now return errors." not found!');
  }
  console.log('  ✅ PASS: 4. Sitemap differential flags "Sitemap changed significantly" and "27 sitemap URLs now return errors"');

  // 5. Test GSC Phrasing Rules
  // Case A: Verified GSC data exists
  const snapshotGscVerified: ScanSnapshot = {
    ...snapshot1,
    gscData: {
      gscVerifiedDataAvailable: true,
      googleDisappearedCount: 32,
    },
  };
  const compGscVerified = compareSnapshots(snapshotGscVerified, snapshot1);
  const alertGscVerified = compGscVerified.alerts.find((a) => a.header.includes('32') && a.header.includes('disappeared from Google'));

  if (!alertGscVerified) {
    throw new Error('Expected "32 pages disappeared from Google" alert when GSC verified data is present!');
  }

  // Case B: General GSC signal (not verified count)
  const snapshotGscGeneral: ScanSnapshot = {
    ...snapshot1,
    gscData: {
      gscVerifiedDataAvailable: false,
      googleConsoleAlert: true,
    },
  };
  const compGscGeneral = compareSnapshots(snapshotGscGeneral, snapshot1);
  const alertGscGeneral = compGscGeneral.alerts.find((a) => a.header.includes('Google Search Console shows a significant change in your search visibility.'));

  if (!alertGscGeneral) {
    throw new Error('Expected fallback alert "Google Search Console shows a significant change in your search visibility." when verified GSC data is missing!');
  }
  console.log('  ✅ PASS: 5. GSC phrasing strictly enforces verified vs fallback phrasing rules');

  console.log('🎉 Summary: 5/5 monitoring engine unit tests passed successfully.');
}

runMonitoringTests();
