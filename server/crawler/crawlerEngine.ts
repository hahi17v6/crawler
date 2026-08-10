import { safeFetch } from './safeFetcher';
import { parseHtml } from './htmlParser';
import { parseRobotsTxt } from './robotsParser';
import { parseSitemapXml } from './sitemapParser';
import { validateUrlForSsrf } from './ssrfGuard';

export interface CrawlPageResult {
  url: string;
  status: number;
  finalUrl: string;
  title: string | null;
  metaRobots: string | null;
  canonical: string | null;
  source: 'homepage_link' | 'sitemap';
}

export interface CrawlErrorItem {
  url: string;
  error: string;
}

export interface CrawlDiagnosticOutput {
  site: {
    requestedUrl: string;
    hostname: string;
    crawledAt: string;
  };
  homepage: {
    url: string;
    status: number;
    finalUrl: string;
    redirects: string[];
    title: string | null;
    metaRobots: string | null;
    canonical: string | null;
    internalLinksCount: number;
    externalLinksCount: number;
    jsRenderedLikely: boolean;
    bodyLength: number;
  } | null;
  robots: {
    exists: boolean;
    url: string;
    status: number;
    sitemaps: string[];
    disallowedPaths: string[];
    disallowsAll: boolean;
    contentSnippet?: string;
  } | null;
  sitemap: {
    exists: boolean;
    url: string;
    status: number;
    type: string;
    urlsFoundCount: number;
    sampleUrls: string[];
    errors: string[];
  } | null;
  pages: CrawlPageResult[];
  links: {
    source: string;
    target: string;
    isInternal: boolean;
  }[];
  errors: CrawlErrorItem[];
}

export async function runTechnicalCrawl(rawInputUrl: string): Promise<CrawlDiagnosticOutput> {
  const globalStartTime = Date.now();
  const MAX_BUDGET_MS = 45000; // Leave 15s buffer for processing and Vercel's 60s maxDuration limit

  const getRemainingMs = () => Math.max(0, MAX_BUDGET_MS - (Date.now() - globalStartTime));

  const errors: CrawlErrorItem[] = [];

  let targetUrl = rawInputUrl.trim();
  if (!/^https?:\/\//i.test(targetUrl)) {
    targetUrl = `https://${targetUrl}`;
  }

  // Initial SSRF Validation
  const initialSsrf = await validateUrlForSsrf(targetUrl);
  if (!initialSsrf.safe || !initialSsrf.urlObj) {
    throw new Error(`SSRF_SECURITY_BLOCK: ${initialSsrf.error || 'Access to this URL or IP range is restricted.'}`);
  }

  const hostname = initialSsrf.urlObj.hostname;
  const protocol = initialSsrf.urlObj.protocol;

  const output: CrawlDiagnosticOutput = {
    site: {
      requestedUrl: targetUrl,
      hostname,
      crawledAt: new Date().toISOString(),
    },
    homepage: null,
    robots: null,
    sitemap: null,
    pages: [],
    links: [],
    errors,
  };

  // 1. Fetch Homepage
  let homepageLinks: string[] = [];
  try {
    const hpRemaining = getRemainingMs();
    if (hpRemaining < 1000) return output; // Budget exhausted

    const hpRes = await safeFetch(targetUrl, { timeoutMs: Math.min(7000, hpRemaining) });
    const parsedHp = parseHtml(hpRes.body, hpRes.finalUrl);

    homepageLinks = parsedHp.internalLinks;

    output.homepage = {
      url: targetUrl,
      status: hpRes.status,
      finalUrl: hpRes.finalUrl,
      redirects: hpRes.redirects,
      title: parsedHp.title,
      metaRobots: parsedHp.metaRobots,
      canonical: parsedHp.canonical,
      internalLinksCount: parsedHp.internalLinks.length,
      externalLinksCount: parsedHp.externalLinks.length,
      jsRenderedLikely: parsedHp.jsRenderedLikely,
      bodyLength: parsedHp.bodyTextLength,
    };

    // Store sample internal links from homepage
    parsedHp.internalLinks.slice(0, 15).forEach((target) => {
      output.links.push({
        source: hpRes.finalUrl,
        target,
        isInternal: true,
      });
    });
  } catch (err: any) {
    errors.push({
      url: targetUrl,
      error: `Homepage fetch error: ${err.message || String(err)}`,
    });
  }

  // 2. Fetch robots.txt
  const robotsUrl = `${protocol}//${hostname}/robots.txt`;
  let sitemapsFromRobots: string[] = [];
  try {
    const robRemaining = getRemainingMs();
    if (robRemaining < 1000) return output; // Budget exhausted

    const robRes = await safeFetch(robotsUrl, { timeoutMs: Math.min(5000, robRemaining) });
    const parsedRobots = parseRobotsTxt(robotsUrl, robRes.status, robRes.body);
    sitemapsFromRobots = parsedRobots.sitemaps;

    output.robots = {
      exists: parsedRobots.exists,
      url: robotsUrl,
      status: robRes.status,
      sitemaps: parsedRobots.sitemaps,
      disallowedPaths: parsedRobots.disallowedPaths,
      disallowsAll: parsedRobots.disallowsAll,
      contentSnippet: parsedRobots.contentSnippet,
    };
  } catch (err: any) {
    output.robots = {
      exists: false,
      url: robotsUrl,
      status: 0,
      sitemaps: [],
      disallowedPaths: [],
      disallowsAll: false,
    };
    errors.push({
      url: robotsUrl,
      error: `robots.txt fetch error: ${err.message || String(err)}`,
    });
  }

  // 3. Fetch Sitemap
  const sitemapCandidate = sitemapsFromRobots[0] || `${protocol}//${hostname}/sitemap.xml`;
  let sitemapSampleUrls: string[] = [];

  try {
    const smRemaining = getRemainingMs();
    if (smRemaining >= 1000) {
      const smRes = await safeFetch(sitemapCandidate, { timeoutMs: Math.min(6000, smRemaining) });
      let parsedSm = parseSitemapXml(sitemapCandidate, smRes.status, smRes.body);

      // If sitemapindex, attempt to fetch the first nested sitemap
      if (parsedSm.type === 'sitemapindex' && parsedSm.nestedSitemaps.length > 0) {
        const nestedUrl = parsedSm.nestedSitemaps[0];
        try {
          const nestedRemaining = getRemainingMs();
          if (nestedRemaining >= 1000) {
             const nestedRes = await safeFetch(nestedUrl, { timeoutMs: Math.min(6000, nestedRemaining) });
             const nestedParsed = parseSitemapXml(nestedUrl, nestedRes.status, nestedRes.body);
             parsedSm.sampleUrls = nestedParsed.sampleUrls;
             parsedSm.urlsFoundCount = nestedParsed.urlsFoundCount;
          }
        } catch (_nestedErr) {
          // Ignore nested sitemap failure
        }
      }

      sitemapSampleUrls = parsedSm.sampleUrls;

      output.sitemap = {
        exists: parsedSm.exists,
        url: sitemapCandidate,
        status: smRes.status,
        type: parsedSm.type,
        urlsFoundCount: parsedSm.urlsFoundCount,
        sampleUrls: parsedSm.sampleUrls,
        errors: parsedSm.errors,
      };
    }
  } catch (err: any) {
    output.sitemap = {
      exists: false,
      url: sitemapCandidate,
      status: 0,
      type: 'unknown',
      urlsFoundCount: 0,
      sampleUrls: [],
      errors: [`Sitemap fetch error: ${err.message || String(err)}`],
    };
    errors.push({
      url: sitemapCandidate,
      error: `Sitemap fetch error: ${err.message || String(err)}`,
    });
  }

  // 4. Sample Page Checks (max 5 URLs total from internal links + sitemap)
  const sampleTargets: { url: string; source: 'homepage_link' | 'sitemap' }[] = [];
  const visited = new Set<string>();
  visited.add(targetUrl);
  if (output.homepage?.finalUrl) visited.add(output.homepage.finalUrl);

  // Take up to 3 homepage internal links
  for (const link of homepageLinks) {
    if (sampleTargets.length >= 3) break;
    if (!visited.has(link)) {
      visited.add(link);
      sampleTargets.push({ url: link, source: 'homepage_link' });
    }
  }

  // Take up to 2 sitemap URLs
  for (const smUrl of sitemapSampleUrls) {
    if (sampleTargets.length >= 5) break;
    if (!visited.has(smUrl)) {
      visited.add(smUrl);
      sampleTargets.push({ url: smUrl, source: 'sitemap' });
    }
  }

  for (const item of sampleTargets) {
    try {
      const pageRemaining = getRemainingMs();
      if (pageRemaining < 1500) {
         break; // Stop fetching sample pages if budget is exhausted
      }

      // Small rate limiting delay
      await new Promise((resolve) => setTimeout(resolve, 150));

      const pageRes = await safeFetch(item.url, { timeoutMs: Math.min(5000, getRemainingMs()) });
      const parsedPage = parseHtml(pageRes.body, pageRes.finalUrl);

      output.pages.push({
        url: item.url,
        status: pageRes.status,
        finalUrl: pageRes.finalUrl,
        title: parsedPage.title,
        metaRobots: parsedPage.metaRobots,
        canonical: parsedPage.canonical,
        source: item.source,
      });
    } catch (err: any) {
      errors.push({
        url: item.url,
        error: `Page check failed: ${err.message || String(err)}`,
      });
    }
  }

  return output;
}
