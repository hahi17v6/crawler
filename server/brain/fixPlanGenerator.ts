import { CheckResult } from '../checker/types';
import { CrawlDiagnosticOutput } from '../crawler/crawlerEngine';

export interface FixPlanItem {
  id: string;
  rank: number;
  isTopThree: boolean;
  category: string;
  title: string;
  evidence: string;
  impact: string;
  action: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  verify: string;
}

export interface FullFixPlanReport {
  productName: 'Full Website Visibility Diagnosis';
  pricePaid: '$11';
  targetUrl: string;
  timestamp: string;
  topThreeFixes: FixPlanItem[];
  allFixes: FixPlanItem[];
  passedCheckSummaries: { name: string; evidence: string; verify: string }[];
  deepCrawlMetrics: {
    pagesSampled: number;
    sitemapUrlsCount: number;
    internalLinksCount: number;
    duplicateTitleCount: number;
    thinContentCount: number;
    httpErrorCount: number;
  };
}

export function generateFixPlan(
  crawlData: CrawlDiagnosticOutput,
  checksData: CheckResult[]
): FullFixPlanReport {
  const fixes: FixPlanItem[] = [];
  const passedCheckSummaries: { name: string; evidence: string; verify: string }[] = [];

  // Track duplicate titles & thin content signals
  const seenTitles = new Map<string, string[]>();
  let duplicateTitleCount = 0;
  let thinContentCount = 0;
  let httpErrorCount = 0;

  if (crawlData.homepage) {
    if (crawlData.homepage.status >= 400) httpErrorCount++;
    if ((crawlData.homepage.bodyLength || 0) < 300) thinContentCount++;
    if (crawlData.homepage.title) {
      const normTitle = crawlData.homepage.title.trim().toLowerCase();
      seenTitles.set(normTitle, [crawlData.homepage.finalUrl]);
    }
  }

  for (const page of crawlData.pages || []) {
    if (page.status >= 400) httpErrorCount++;
    if (page.title) {
      const normTitle = page.title.trim().toLowerCase();
      const existing = seenTitles.get(normTitle) || [];
      existing.push(page.url);
      seenTitles.set(normTitle, existing);
    }
  }

  seenTitles.forEach((urls) => {
    if (urls.length > 1) {
      duplicateTitleCount += urls.length;
    }
  });

  // Evaluate each check and convert failed/warning checks to FixPlanItem
  checksData.forEach((check) => {
    if (check.status === 'pass') {
      passedCheckSummaries.push({
        name: check.name,
        evidence: check.evidence,
        verify: getVerificationMethod(check.id, check.status),
      });
      return;
    }

    const item = convertCheckToFixPlanItem(check, crawlData);
    if (item) {
      fixes.push(item);
    }
  });

  // Check duplicate content / titles signal
  if (duplicateTitleCount > 0) {
    fixes.push({
      id: 'duplicate_titles',
      rank: 0,
      isTopThree: false,
      category: 'Content Signals',
      title: 'Duplicate Page Title Tags Detected',
      evidence: `${duplicateTitleCount} sampled URLs share identical <title> tags across pages.`,
      impact: 'Medium — Duplicate titles confuse search engines when choosing canonical landing pages.',
      action: 'Ensure every public page features a unique, descriptive <title> tag reflecting its specific content.',
      difficulty: 'Easy',
      verify: 'Inspect HTML <title> elements on affected URLs or re-run crawl to confirm uniqueness.',
    });
  }

  // Check thin content signal
  if (thinContentCount > 0) {
    fixes.push({
      id: 'thin_content',
      rank: 0,
      isTopThree: false,
      category: 'Content Signals',
      title: 'Thin Static Rendered HTML Content',
      evidence: `${thinContentCount} sampled page(s) render less than 300 characters of static HTML body text.`,
      impact: 'Medium — Search crawlers may evaluate thin HTML pages as low quality or uninformative.',
      action: 'Include descriptive header text and body prose directly in initial server-rendered HTML.',
      difficulty: 'Medium',
      verify: 'Run `curl -s https://yourdomain.com | wc -c` or inspect View Source in browser without JavaScript enabled.',
    });
  }

  // Sort fixes by priority rank
  fixes.sort((a, b) => getPriorityWeight(a.id) - getPriorityWeight(b.id));

  // Assign 1-based ranks and mark top 3
  fixes.forEach((fix, index) => {
    fix.rank = index + 1;
    fix.isTopThree = index < 3;
  });

  const topThreeFixes = fixes.slice(0, 3);

  return {
    productName: 'Full Website Visibility Diagnosis',
    pricePaid: '$11',
    targetUrl: crawlData.site?.requestedUrl || 'https://' + crawlData.site?.hostname,
    timestamp: new Date().toISOString(),
    topThreeFixes,
    allFixes: fixes,
    passedCheckSummaries,
    deepCrawlMetrics: {
      pagesSampled: (crawlData.pages?.length || 0) + (crawlData.homepage ? 1 : 0),
      sitemapUrlsCount: crawlData.sitemap?.urlsFoundCount || 0,
      internalLinksCount: crawlData.homepage?.internalLinksCount || 0,
      duplicateTitleCount,
      thinContentCount,
      httpErrorCount,
    },
  };
}

function convertCheckToFixPlanItem(check: CheckResult, crawlData: CrawlDiagnosticOutput): FixPlanItem {
  const category = getCategoryLabel(check.category);
  const difficulty = getDifficulty(check.id);
  const verify = getVerificationMethod(check.id, check.status);

  return {
    id: check.id,
    rank: 0,
    isTopThree: false,
    category,
    title: check.name,
    evidence: check.evidence,
    impact: `${check.severity.toUpperCase()} — ${check.explanation}`,
    action: check.recommended_action || 'Inspect and resolve technical signal.',
    difficulty,
    verify,
  };
}

function getCategoryLabel(cat: string): string {
  switch (cat) {
    case 'crawlability': return 'Indexability & Crawlability';
    case 'http': return 'HTTP Status & Server Response';
    case 'robots': return 'robots.txt Configuration';
    case 'sitemap': return 'XML Sitemap Analysis';
    case 'indexability': return 'noindex & Directives';
    case 'canonical': return 'Canonical Architecture';
    case 'links': return 'Internal Linking & Architecture';
    case 'rendering': return 'Rendering & JS Signals';
    default: return 'Technical Signals';
  }
}

function getDifficulty(checkId: string): 'Easy' | 'Medium' | 'Hard' {
  switch (checkId) {
    case 'robots_txt':
    case 'noindex_directive':
    case 'canonical_tag':
      return 'Easy';
    case 'sitemap_xml':
    case 'internal_links':
    case 'soft_404':
    case 'orphan_signals':
      return 'Medium';
    case 'crawlability':
    case 'http_status':
    case 'js_rendering_signals':
      return 'Hard';
    default:
      return 'Medium';
  }
}

function getPriorityWeight(id: string): number {
  const weights: Record<string, number> = {
    crawlability: 1,
    http_status: 2,
    robots_txt: 3,
    noindex_directive: 4,
    soft_404: 5,
    canonical_tag: 6,
    internal_links: 7,
    sitemap_xml: 8,
    js_rendering_signals: 9,
    orphan_signals: 10,
    duplicate_titles: 11,
    thin_content: 12,
  };
  return weights[id] || 99;
}

function getVerificationMethod(checkId: string, status: string): string {
  switch (checkId) {
    case 'crawlability':
      return 'Run `curl -I -A "Googlebot" https://yourdomain.com` to verify HTTP connectivity and response status.';
    case 'http_status':
      return 'Check server access logs and run `curl -I https://yourdomain.com` to ensure clean 200 OK headers.';
    case 'robots_txt':
      return 'Fetch `https://yourdomain.com/robots.txt` in browser or terminal and confirm no `Disallow: /` rule is blocking Googlebot.';
    case 'noindex_directive':
      return 'Inspect raw HTML source with `curl -s https://yourdomain.com | grep -i noindex` and verify no `noindex` meta tag is present.';
    case 'soft_404':
      return 'Request a non-existent path like `/non-existent-test-page` and verify HTTP status code is strictly 404 Not Found.';
    case 'canonical_tag':
      return 'Run `curl -s https://yourdomain.com | grep canonical` and verify `<link rel="canonical">` matches your exact URL.';
    case 'internal_links':
      return 'Inspect homepage HTML navigation and ensure key category pages have standard `<a href="...">` anchor tags.';
    case 'sitemap_xml':
      return 'Validate your sitemap URL at `https://yourdomain.com/sitemap.xml` using Google Search Console Sitemap report.';
    case 'js_rendering_signals':
      return 'Disable JavaScript in browser DevTools and reload the page to confirm text content renders statically.';
    case 'orphan_signals':
      return 'Verify that all URLs listed in `/sitemap.xml` are accessible within 2 clicks from the homepage navigation.';
    default:
      return 'Re-run the Technical Crawl inspection to verify signal resolution.';
  }
}
