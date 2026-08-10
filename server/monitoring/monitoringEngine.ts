import { CrawlDiagnosticOutput } from '../crawler/crawlerEngine';
import {
  GscDataSignal,
  ImportantAlert,
  ScanComparisonResult,
  ScanSnapshot,
} from './monitoringTypes';

/**
 * Converts a raw CrawlDiagnosticOutput into a normalized ScanSnapshot for historical comparison.
 */
export function createSnapshotFromCrawl(
  crawl: CrawlDiagnosticOutput,
  gscData?: GscDataSignal
): ScanSnapshot {
  const domain = crawl.site?.hostname || 'unknown';
  const timestamp = new Date().toISOString();
  const id = `snap_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

  const pageStatuses: Record<string, number> = {};
  const noindexUrls: string[] = [];
  const canonicalUrls: Record<string, string | null> = {};
  const discoveredPages: string[] = [];

  if (crawl.homepage) {
    pageStatuses[crawl.homepage.url] = crawl.homepage.status;
    discoveredPages.push(crawl.homepage.url);
    if (crawl.homepage.metaRobots && crawl.homepage.metaRobots.toLowerCase().includes('noindex')) {
      noindexUrls.push(crawl.homepage.url);
    }
    canonicalUrls[crawl.homepage.url] = crawl.homepage.canonical || null;
  }

  for (const page of crawl.pages || []) {
    pageStatuses[page.url] = page.status;
    if (!discoveredPages.includes(page.url)) {
      discoveredPages.push(page.url);
    }
    if (page.metaRobots && page.metaRobots.toLowerCase().includes('noindex')) {
      if (!noindexUrls.includes(page.url)) {
        noindexUrls.push(page.url);
      }
    }
    canonicalUrls[page.url] = page.canonical || null;
  }

  return {
    id,
    domain: domain.toLowerCase(),
    timestamp,
    robotsContent: crawl.robots?.contentSnippet || '',
    robotsDisallowsAll: Boolean(crawl.robots?.disallowsAll),
    sitemapUrlCount: crawl.sitemap?.urlsFoundCount || 0,
    sitemapErrorsCount: crawl.sitemap?.errors?.length || 0,
    sitemapExists: Boolean(crawl.sitemap?.exists),
    pageStatuses,
    noindexUrls,
    canonicalUrls,
    discoveredPagesCount: discoveredPages.length,
    discoveredPages,
    internalLinksCount: crawl.homepage?.internalLinksCount || 0,
    gscData: gscData || {
      gscVerifiedDataAvailable: false,
      googleConsoleAlert: false,
    },
  };
}

/**
 * Compares current scan snapshot against previous scan snapshot to detect critical visibility alerts.
 */
export function compareSnapshots(
  current: ScanSnapshot,
  previous: ScanSnapshot | null
): ScanComparisonResult {
  const alerts: ImportantAlert[] = [];

  if (!previous) {
    // Initial scan benchmark - compute baseline alerts if initial state has severe issues
    if (current.robotsDisallowsAll) {
      alerts.push({
        id: 'robots_disallow_all_initial',
        header: '🚨 robots.txt blocks all search crawlers with Disallow: /',
        whatChanged: 'Your site current robots.txt contains a global Disallow: / directive.',
        whyItMatters: 'Googlebot and other search engines cannot crawl or index any pages on your domain.',
        whatToDo: 'Edit your robots.txt file to allow search engine crawling.',
      });
    }

    if (current.noindexUrls.length > 0) {
      alerts.push({
        id: `noindex_initial_${current.noindexUrls.length}`,
        header: `🚨 ${current.noindexUrls.length} ${current.noindexUrls.length === 1 ? 'page is' : 'pages are'} set to noindex.`,
        whatChanged: `${current.noindexUrls.length} discovered public page(s) contain a <meta name="robots" content="noindex"> tag.`,
        whyItMatters: 'Googlebot strictly respects noindex directives and will remove these pages from search results.',
        whatToDo: 'Remove the noindex meta tag or header from pages intended for search visibility.',
      });
    }

    return {
      domain: current.domain,
      scanDate: current.timestamp,
      previousScanDate: null,
      alerts,
      snapshot: current,
    };
  }

  // 1. HTTP Status comparison (e.g. 32 previously accessible pages now return 403/404/500)
  const newlyErroringUrls: { url: string; status: number }[] = [];
  Object.keys(current.pageStatuses).forEach((url) => {
    const prevStatus = previous.pageStatuses[url];
    const currStatus = current.pageStatuses[url];

    if ((prevStatus === 200 || prevStatus === undefined) && currStatus >= 400) {
      newlyErroringUrls.push({ url, status: currStatus });
    }
  });

  if (newlyErroringUrls.length > 0) {
    const errorCount = newlyErroringUrls.length;
    const dominantStatus = newlyErroringUrls[0].status;
    alerts.push({
      id: `http_errors_diff_${errorCount}`,
      header: `🚨 ${errorCount} previously accessible ${errorCount === 1 ? 'page now returns' : 'pages now return'} ${dominantStatus}.`,
      whatChanged: `${errorCount} URL(s) that previously responded with HTTP 200 OK now return HTTP status code ${dominantStatus}.`,
      whyItMatters: 'Search crawlers cannot index erroring URLs, wasting crawl budget and leading to de-indexing.',
      whatToDo: 'Check server access controls, fix broken internal routes, and verify web server configuration.',
    });
  }

  // 2. Noindex comparison (e.g. 14 pages became noindex)
  const newlyNoindex = current.noindexUrls.filter((url) => !previous.noindexUrls.includes(url));
  if (newlyNoindex.length > 0) {
    const count = newlyNoindex.length;
    alerts.push({
      id: `noindex_diff_${count}`,
      header: `🚨 ${count} ${count === 1 ? 'page' : 'pages'} became noindex.`,
      whatChanged: `${count} page(s) that were previously indexable now feature a noindex directive.`,
      whyItMatters: 'Google will de-index these pages from search engine results as soon as they are re-crawled.',
      whatToDo: 'Inspect page headers and template code to remove accidental noindex directives.',
    });
  }

  // 3. Sitemap comparison
  // A. Sitemap changed significantly
  const sitemapUrlDiff = Math.abs(current.sitemapUrlCount - previous.sitemapUrlCount);
  if (previous.sitemapExists && current.sitemapExists && sitemapUrlDiff >= 5) {
    alerts.push({
      id: `sitemap_significant_change_${sitemapUrlDiff}`,
      header: '🚨 Sitemap changed significantly.',
      whatChanged: `Sitemap URL count changed from ${previous.sitemapUrlCount} to ${current.sitemapUrlCount} URLs.`,
      whyItMatters: 'Large shifts in sitemap content can cause search crawlers to drop coverage of core landing pages.',
      whatToDo: 'Verify your sitemap generator script and ensure all essential canonical URLs remain included.',
    });
  }

  // B. Sitemap URLs returning errors (e.g. 27 sitemap URLs now return errors)
  if (current.sitemapErrorsCount > 0 && current.sitemapErrorsCount > previous.sitemapErrorsCount) {
    const count = current.sitemapErrorsCount;
    alerts.push({
      id: `sitemap_urls_errors_${count}`,
      header: `🚨 ${count} sitemap ${count === 1 ? 'URL now returns errors' : 'URLs now return errors'}.`,
      whatChanged: `${count} URL(s) listed in your XML sitemap returned HTTP error codes during the crawl.`,
      whyItMatters: 'Submitting broken URLs in sitemaps degrades search engine trust and wastes crawl budget.',
      whatToDo: 'Remove erroring URLs from /sitemap.xml or fix the underlying HTTP server issues.',
    });
  }

  // 4. Robots.txt block comparison
  if (!previous.robotsDisallowsAll && current.robotsDisallowsAll) {
    alerts.push({
      id: 'robots_became_disallowed',
      header: '🚨 robots.txt now blocks all search crawlers with Disallow: /',
      whatChanged: 'A global Disallow: / directive was added to your robots.txt file.',
      whyItMatters: 'Search engines are completely blocked from crawling and updating search indexes for your site.',
      whatToDo: 'Remove the global Disallow rule from robots.txt immediately.',
    });
  }

  // 5. Canonical directives changed
  const canonicalMismatches: string[] = [];
  Object.keys(current.canonicalUrls).forEach((url) => {
    const prevCan = previous.canonicalUrls[url];
    const currCan = current.canonicalUrls[url];

    if (prevCan !== currCan && currCan && currCan !== url) {
      canonicalMismatches.push(url);
    }
  });

  if (canonicalMismatches.length > 0) {
    alerts.push({
      id: `canonical_changed_${canonicalMismatches.length}`,
      header: `🚨 Canonical directives changed on ${canonicalMismatches.length} ${canonicalMismatches.length === 1 ? 'page' : 'pages'}.`,
      whatChanged: `${canonicalMismatches.length} page(s) updated their canonical target to point to a different URL.`,
      whyItMatters: 'Incorrect canonical directives instruct Google to pass ranking credit and indexing to external or alternate pages.',
      whatToDo: 'Audit canonical tags across page headers to ensure self-referential consistency.',
    });
  }

  // 6. Google Search Console (GSC) Data Rule
  if (current.gscData?.gscVerifiedDataAvailable && current.gscData.googleDisappearedCount && current.gscData.googleDisappearedCount > 0) {
    const count = current.gscData.googleDisappearedCount;
    alerts.push({
      id: `gsc_pages_disappeared_${count}`,
      header: `🚨 ${count} ${count === 1 ? 'page' : 'pages'} disappeared from Google.`,
      whatChanged: `Google Search Console data confirms ${count} previously indexed URLs are no longer present in Google's index.`,
      whyItMatters: 'Pages dropped from Google index immediately stop generating search impressions and organic traffic.',
      whatToDo: 'Review Search Console Index Coverage reports to identify crawl errors, soft 404s, or manual actions.',
    });
  } else if (current.gscData?.googleConsoleAlert) {
    alerts.push({
      id: 'gsc_visibility_change',
      header: '🚨 Google Search Console shows a significant change in your search visibility.',
      whatChanged: 'Google Search Console metrics indicate a noticeable shift in indexing or organic impressions.',
      whyItMatters: 'Sudden search visibility changes indicate potential search engine re-evaluations or indexing shifts.',
      whatToDo: 'Review Google Search Console Performance and Page Indexing reports to identify affected URL clusters.',
    });
  }

  return {
    domain: current.domain,
    scanDate: current.timestamp,
    previousScanDate: previous.timestamp,
    alerts,
    snapshot: current,
  };
}
