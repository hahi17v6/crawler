import { CheckResult } from './types';
import { CrawlDiagnosticOutput } from '../crawler/crawlerEngine';

export function runTechnicalChecks(crawlData: CrawlDiagnosticOutput): CheckResult[] {
  const checks: CheckResult[] = [];

  // 1. HTTP Status Check
  checks.push(evaluateHttpStatus(crawlData));

  // 2. robots.txt Check
  checks.push(evaluateRobotsTxt(crawlData));

  // 3. Sitemap Check
  checks.push(evaluateSitemap(crawlData));

  // 4. noindex Check
  checks.push(evaluateNoindex(crawlData));

  // 5. Canonical Check
  checks.push(evaluateCanonical(crawlData));

  // 6. Internal Links Check
  checks.push(evaluateInternalLinks(crawlData));

  // 7. Orphan Page Signals Check
  checks.push(evaluateOrphanSignals(crawlData));

  // 8. JS Rendering Signals Check
  checks.push(evaluateJsRendering(crawlData));

  // 9. Soft 404 Check
  checks.push(evaluateSoft404(crawlData));

  // 10. Crawlability Check
  checks.push(evaluateCrawlability(crawlData));

  return checks;
}

// ------------------------------------------------------------------
// 1. HTTP Status Check
// ------------------------------------------------------------------
function evaluateHttpStatus(data: CrawlDiagnosticOutput): CheckResult {
  const hp = data.homepage;
  if (!hp) {
    return {
      id: 'http_status',
      name: 'HTTP Status Response',
      category: 'http',
      status: 'critical',
      severity: 'critical',
      evidence: 'Homepage returned no HTTP response or request failed completely.',
      explanation: 'Search engine crawlers cannot access the site homepage when HTTP request fails.',
      recommended_action: 'Ensure web server is running and accessible over public HTTP/HTTPS ports.',
      confidence: 'high',
    };
  }

  if (hp.status >= 500) {
    return {
      id: 'http_status',
      name: 'HTTP Status Response',
      category: 'http',
      status: 'critical',
      severity: 'critical',
      evidence: `Homepage returned server error HTTP status ${hp.status}.`,
      explanation: '5xx server errors prevent search engines from indexing the homepage and signal infrastructure instability.',
      recommended_action: 'Check web server logs and resolve application backend errors throwing 5xx responses.',
      confidence: 'high',
    };
  }

  if (hp.status >= 400) {
    return {
      id: 'http_status',
      name: 'HTTP Status Response',
      category: 'http',
      status: 'critical',
      severity: 'high',
      evidence: `Homepage returned client error HTTP status ${hp.status}.`,
      explanation: '4xx status codes indicate the homepage path is not found or access is forbidden.',
      recommended_action: 'Verify URL routing and ensure homepage path serves 200 OK.',
      confidence: 'high',
    };
  }

  // Check sample pages for 4xx/5xx
  const errorPages = (data.pages || []).filter((p) => p.status >= 400);
  if (errorPages.length > 0) {
    const errorList = errorPages.map((p) => `${p.url} (${p.status})`).join(', ');
    return {
      id: 'http_status',
      name: 'HTTP Status Response',
      category: 'http',
      status: 'warning',
      severity: 'medium',
      evidence: `Homepage returned HTTP 200, but ${errorPages.length} sampled page(s) returned errors: ${errorList}.`,
      explanation: 'Linked or indexed pages returning 4xx/5xx errors waste crawl budget and harm search experience.',
      recommended_action: 'Fix broken internal links or restore missing pages returning 4xx/5xx status.',
      confidence: 'high',
    };
  }

  return {
    id: 'http_status',
    name: 'HTTP Status Response',
    category: 'http',
    status: 'pass',
    severity: 'low',
    evidence: `Homepage and ${data.pages.length} sample pages returned successful HTTP status 200/2xx.`,
    explanation: 'All inspected pages respond with valid HTTP success status codes.',
    recommended_action: 'Maintain existing HTTP response health and monitor server uptime.',
    confidence: 'high',
  };
}

// ------------------------------------------------------------------
// 2. robots.txt Check
// ------------------------------------------------------------------
function evaluateRobotsTxt(data: CrawlDiagnosticOutput): CheckResult {
  const rob = data.robots;

  if (!rob || !rob.exists) {
    return {
      id: 'robots_txt',
      name: 'robots.txt Directives',
      category: 'robots',
      status: 'pass',
      severity: 'low',
      evidence: 'No robots.txt file detected (HTTP status 404 or missing).',
      explanation: 'In the absence of robots.txt, search engines default to allowing all public pages to be crawled.',
      recommended_action: 'Optionally create a robots.txt file to declare your XML sitemap location and specify crawl preferences.',
      confidence: 'high',
    };
  }

  if (rob.disallowsAll) {
    return {
      id: 'robots_txt',
      name: 'robots.txt Directives',
      category: 'robots',
      status: 'critical',
      severity: 'critical',
      evidence: 'robots.txt contains global block rule ("Disallow: /" or "Disallow: /*").',
      explanation: 'Search crawlers including Googlebot are explicitly forbidden from crawling any pages on this site.',
      recommended_action: 'Remove "Disallow: /" from robots.txt if you want search engines to discover and index your pages.',
      confidence: 'high',
    };
  }

  if (rob.disallowedPaths.length > 0) {
    return {
      id: 'robots_txt',
      name: 'robots.txt Directives',
      category: 'robots',
      status: 'pass',
      severity: 'low',
      evidence: `robots.txt exists with ${rob.disallowedPaths.length} targeted disallow rule(s) (e.g. ${rob.disallowedPaths.slice(0, 3).join(', ')}).`,
      explanation: 'robots.txt is correctly configured to block specific paths without blocking public content.',
      recommended_action: 'Periodically review disallowed paths to ensure important public content is not inadvertently blocked.',
      confidence: 'high',
    };
  }

  return {
    id: 'robots_txt',
    name: 'robots.txt Directives',
    category: 'robots',
    status: 'pass',
    severity: 'low',
    evidence: 'robots.txt is present and contains no restrictive disallow rules.',
    explanation: 'Search crawlers are allowed full access to crawl the website.',
    recommended_action: 'Ensure robots.txt explicitly references your XML sitemap URL.',
    confidence: 'high',
  };
}

// ------------------------------------------------------------------
// 3. Sitemap Check
// ------------------------------------------------------------------
function evaluateSitemap(data: CrawlDiagnosticOutput): CheckResult {
  const sm = data.sitemap;

  if (!sm || !sm.exists || sm.status !== 200) {
    return {
      id: 'sitemap_xml',
      name: 'XML Sitemap',
      category: 'sitemap',
      status: 'warning',
      severity: 'medium',
      evidence: 'No accessible XML sitemap found at /sitemap.xml or declared in robots.txt.',
      explanation: 'While not mandatory for indexing, a valid XML sitemap accelerates page discovery and canonical URL discovery.',
      recommended_action: 'Generate an XML sitemap at /sitemap.xml and declare its URL in robots.txt.',
      confidence: 'high',
    };
  }

  if (sm.urlsFoundCount === 0) {
    return {
      id: 'sitemap_xml',
      name: 'XML Sitemap',
      category: 'sitemap',
      status: 'warning',
      severity: 'medium',
      evidence: `XML sitemap found at ${sm.url} but contains 0 valid <url> location entries.`,
      explanation: 'An empty XML sitemap does not provide search engines with indexable page locations.',
      recommended_action: 'Populate your XML sitemap with canonical, publicly accessible URLs.',
      confidence: 'high',
    };
  }

  if (sm.errors && sm.errors.length > 0) {
    return {
      id: 'sitemap_xml',
      name: 'XML Sitemap',
      category: 'sitemap',
      status: 'warning',
      severity: 'medium',
      evidence: `XML sitemap at ${sm.url} contains parsing issues: ${sm.errors.join('; ')}.`,
      explanation: 'Malformed XML tags or syntax errors in the sitemap can cause crawlers to ignore entries.',
      recommended_action: 'Validate your sitemap XML structure against standard sitemaps.org schema.',
      confidence: 'high',
    };
  }

  return {
    id: 'sitemap_xml',
    name: 'XML Sitemap',
    category: 'sitemap',
    status: 'pass',
    severity: 'low',
    evidence: `Valid XML sitemap (${sm.type}) found at ${sm.url} containing ${sm.urlsFoundCount} indexed URLs.`,
    explanation: 'XML sitemap is accessible, properly formatted, and contains indexable URL entries.',
    recommended_action: 'Keep sitemap automatically updated as new pages are created or updated.',
    confidence: 'high',
  };
}

// ------------------------------------------------------------------
// 4. noindex Check
// ------------------------------------------------------------------
function evaluateNoindex(data: CrawlDiagnosticOutput): CheckResult {
  const hp = data.homepage;

  if (hp && hp.metaRobots && hp.metaRobots.toLowerCase().includes('noindex')) {
    return {
      id: 'noindex_directive',
      name: 'noindex Directive',
      category: 'indexability',
      status: 'critical',
      severity: 'critical',
      evidence: `Homepage meta robots tag is set to "${hp.metaRobots}".`,
      explanation: 'The noindex directive instructs search engine crawlers not to include the homepage in search results.',
      recommended_action: 'Remove "noindex" from your homepage <meta name="robots"> tag.',
      confidence: 'high',
    };
  }

  const noindexPages = data.pages.filter(
    (p) => p.metaRobots && p.metaRobots.toLowerCase().includes('noindex')
  );

  if (noindexPages.length > 0) {
    const list = noindexPages.map((p) => p.url).join(', ');
    return {
      id: 'noindex_directive',
      name: 'noindex Directive',
      category: 'indexability',
      status: 'warning',
      severity: 'medium',
      evidence: `Homepage is indexable, but ${noindexPages.length} sampled page(s) contain "noindex": ${list}.`,
      explanation: 'noindex directives on inner pages explicitly remove those pages from search engine indices.',
      recommended_action: 'Confirm if these pages are intended to be hidden from search engines; if not, remove "noindex".',
      confidence: 'high',
    };
  }

  return {
    id: 'noindex_directive',
    name: 'noindex Directive',
    category: 'indexability',
    status: 'pass',
    severity: 'low',
    evidence: 'No "noindex" directives found on homepage or sampled pages.',
    explanation: 'Pages are free of index-blocking meta robots directives.',
    recommended_action: 'Ensure key landing pages continue to permit indexing.',
    confidence: 'high',
  };
}

// ------------------------------------------------------------------
// 5. Canonical Tag Check
// ------------------------------------------------------------------
function evaluateCanonical(data: CrawlDiagnosticOutput): CheckResult {
  const hp = data.homepage;

  if (!hp) {
    return {
      id: 'canonical_tag',
      name: 'Canonical URL Tag',
      category: 'canonical',
      status: 'pass',
      severity: 'low',
      evidence: 'Homepage was not reached.',
      explanation: 'Canonical check skipped due to missing homepage response.',
      recommended_action: 'Fix homepage HTTP status.',
      confidence: 'low',
    };
  }

  if (!hp.canonical) {
    return {
      id: 'canonical_tag',
      name: 'Canonical URL Tag',
      category: 'canonical',
      status: 'pass',
      severity: 'low',
      evidence: 'No <link rel="canonical"> tag declared on homepage HTML.',
      explanation: 'Missing canonical tag on homepage is not inherently critical, but self-referential canonicals help prevent duplicate content issues.',
      recommended_action: `Add <link rel="canonical" href="${hp.finalUrl}" /> to your homepage HTML <head>.`,
      confidence: 'high',
    };
  }

  // Validate canonical target
  try {
    const canonicalObj = new URL(hp.canonical, hp.finalUrl);
    const homepageObj = new URL(hp.finalUrl);

    if (canonicalObj.hostname.toLowerCase() !== homepageObj.hostname.toLowerCase()) {
      return {
        id: 'canonical_tag',
        name: 'Canonical URL Tag',
        category: 'canonical',
        status: 'warning',
        severity: 'high',
        evidence: `Homepage canonical points to a different domain: "${hp.canonical}".`,
        explanation: 'Cross-domain canonical on homepage tells Google to attribute search authority and indexing to another domain.',
        recommended_action: 'Verify that cross-domain canonical is intentional; otherwise update it to match your own domain.',
        confidence: 'high',
      };
    }

    if (canonicalObj.protocol !== homepageObj.protocol) {
      return {
        id: 'canonical_tag',
        name: 'Canonical URL Tag',
        category: 'canonical',
        status: 'warning',
        severity: 'medium',
        evidence: `Canonical protocol mismatch: Page is ${homepageObj.protocol} but canonical points to ${canonicalObj.protocol}.`,
        explanation: 'Canonical protocol mismatches cause confusion during HTTPS indexation.',
        recommended_action: `Update canonical tag to use ${homepageObj.protocol}.`,
        confidence: 'high',
      };
    }
  } catch (_err) {
    return {
      id: 'canonical_tag',
      name: 'Canonical URL Tag',
      category: 'canonical',
      status: 'warning',
      severity: 'medium',
      evidence: `Homepage canonical contains malformed URL: "${hp.canonical}".`,
      explanation: 'Invalid canonical URLs are ignored by search engines.',
      recommended_action: 'Fix syntax error in canonical tag href attribute.',
      confidence: 'high',
    };
  }

  return {
    id: 'canonical_tag',
    name: 'Canonical URL Tag',
    category: 'canonical',
    status: 'pass',
    severity: 'low',
    evidence: `Valid canonical tag present: "${hp.canonical}".`,
    explanation: 'Canonical URL tag is correctly specified and matches target host.',
    recommended_action: 'Maintain consistent canonical URLs across all public pages.',
    confidence: 'high',
  };
}

// ------------------------------------------------------------------
// 6. Internal Links Check
// ------------------------------------------------------------------
function evaluateInternalLinks(data: CrawlDiagnosticOutput): CheckResult {
  const hp = data.homepage;

  if (!hp) {
    return {
      id: 'internal_links',
      name: 'Internal Link Architecture',
      category: 'links',
      status: 'critical',
      severity: 'high',
      evidence: 'Homepage was not reached.',
      explanation: 'Internal link architecture cannot be analyzed without homepage HTML.',
      recommended_action: 'Fix homepage HTTP status.',
      confidence: 'high',
    };
  }

  if (hp.internalLinksCount === 0) {
    return {
      id: 'internal_links',
      name: 'Internal Link Architecture',
      category: 'links',
      status: 'critical',
      severity: 'high',
      evidence: 'Homepage contains 0 internal <a href> links.',
      explanation: 'Without internal HTML links on the homepage, crawlers cannot navigate or discover deep website content.',
      recommended_action: 'Add clear HTML navigation links on your homepage leading to core section pages.',
      confidence: 'high',
    };
  }

  if (hp.internalLinksCount < 3) {
    return {
      id: 'internal_links',
      name: 'Internal Link Architecture',
      category: 'links',
      status: 'warning',
      severity: 'medium',
      evidence: `Homepage contains only ${hp.internalLinksCount} internal link(s).`,
      explanation: 'Very few internal links on homepage may limit search crawlers ability to distribute PageRank and discover subpages.',
      recommended_action: 'Include navigation menus, footer links, and contextual links to key pages.',
      confidence: 'high',
    };
  }

  return {
    id: 'internal_links',
    name: 'Internal Link Architecture',
    category: 'links',
    status: 'pass',
    severity: 'low',
    evidence: `Homepage contains ${hp.internalLinksCount} internal HTML links.`,
    explanation: 'Sufficient internal link pathways exist on the homepage for crawler discovery.',
    recommended_action: 'Ensure internal anchor text is descriptive and relevant.',
    confidence: 'high',
  };
}

// ------------------------------------------------------------------
// 7. Orphan-Page Signals Check
// ------------------------------------------------------------------
function evaluateOrphanSignals(data: CrawlDiagnosticOutput): CheckResult {
  const sitemapUrls = data.sitemap?.sampleUrls || [];
  const linkedTargets = new Set<string>();

  (data.links || []).forEach((l) => linkedTargets.add(l.target));
  (data.pages || []).filter((p) => p.source === 'homepage_link').forEach((p) => linkedTargets.add(p.url));

  if (sitemapUrls.length === 0) {
    return {
      id: 'orphan_signals',
      name: 'Orphan Page Discovery Signals',
      category: 'links',
      status: 'pass',
      severity: 'low',
      evidence: 'No sitemap URLs available to test orphan signals.',
      explanation: 'Signal calculated strictly from discovered sample URLs; not an exhaustive site audit.',
      recommended_action: 'Provide an XML sitemap to run orphan signal checks against sitemap entries.',
      confidence: 'medium',
    };
  }

  const unlinkedSitemapUrls = sitemapUrls.filter((url) => !linkedTargets.has(url));

  if (unlinkedSitemapUrls.length > 0 && sitemapUrls.length > 1) {
    return {
      id: 'orphan_signals',
      name: 'Orphan Page Discovery Signals',
      category: 'links',
      status: 'warning',
      severity: 'low',
      evidence: `${unlinkedSitemapUrls.length} sitemap URL(s) (e.g. ${unlinkedSitemapUrls.slice(0, 2).join(', ')}) were not found in homepage internal navigation links.`,
      explanation: 'Pages present in XML sitemaps but unlinked from main navigation are harder for crawlers to discover. Note: This signal is based on sampled links, not an exhaustive site crawl.',
      recommended_action: 'Verify that important sitemap pages have contextual internal links from relevant site sections.',
      confidence: 'medium',
    };
  }

  return {
    id: 'orphan_signals',
    name: 'Orphan Page Discovery Signals',
    category: 'links',
    status: 'pass',
    severity: 'low',
    evidence: 'Sampled sitemap URLs are reachable via homepage internal links.',
    explanation: 'Sitemap entries align with discovered internal site links. Note: Signal based on sampled URLs.',
    recommended_action: 'Maintain internal link structure for all indexed pages.',
    confidence: 'medium',
  };
}

// ------------------------------------------------------------------
// 8. JavaScript Rendering Signals Check
// ------------------------------------------------------------------
function evaluateJsRendering(data: CrawlDiagnosticOutput): CheckResult {
  const hp = data.homepage;

  if (!hp) {
    return {
      id: 'js_rendering_signals',
      name: 'JavaScript Rendering Signals',
      category: 'rendering',
      status: 'pass',
      severity: 'low',
      evidence: 'Homepage was not reached.',
      explanation: 'JS rendering signal check skipped.',
      recommended_action: 'Ensure homepage is accessible.',
      confidence: 'low',
    };
  }

  if (hp.jsRenderedLikely) {
    return {
      id: 'js_rendering_signals',
      name: 'JavaScript Rendering Signals',
      category: 'rendering',
      status: 'warning',
      severity: 'medium',
      evidence: `Homepage static HTML body length is ${hp.bodyLength} characters with client-side application container (<div id="root"> / scripts).`,
      explanation: 'Content relies heavily on client-side JavaScript rendering. While Googlebot executes JS, initial indexing may be delayed compared to server-rendered HTML. Note: This check inspects static response HTML, not headless browser execution.',
      recommended_action: 'Consider Server-Side Rendering (SSR) or Static Site Generation (SSG) for critical SEO content.',
      confidence: 'medium',
    };
  }

  return {
    id: 'js_rendering_signals',
    name: 'JavaScript Rendering Signals',
    category: 'rendering',
    status: 'pass',
    severity: 'low',
    evidence: `Homepage provides substantial static HTML body content (${hp.bodyLength} chars).`,
    explanation: 'Core textual content is immediately present in raw HTML without requiring JavaScript execution.',
    recommended_action: 'Continue serving essential content directly in server-rendered HTML.',
    confidence: 'high',
  };
}

// ------------------------------------------------------------------
// 9. Soft 404 Check
// ------------------------------------------------------------------
function evaluateSoft404(data: CrawlDiagnosticOutput): CheckResult {
  const hp = data.homepage;

  if (!hp) {
    return {
      id: 'soft_404',
      name: 'Soft 404 Detection',
      category: 'http',
      status: 'pass',
      severity: 'low',
      evidence: 'Homepage was not reached.',
      explanation: 'Soft 404 check skipped.',
      recommended_action: 'Fix homepage connectivity.',
      confidence: 'low',
    };
  }

  const soft404Patterns = [
    '404 not found',
    'page not found',
    'page non trouvée',
    'pagina no encontrada',
    'error 404',
    'does not exist',
  ];

  const hpTitle = (hp.title || '').toLowerCase();
  const isSoft404Hp = soft404Patterns.some((pattern) => hpTitle.includes(pattern));

  if (hp.status === 200 && isSoft404Hp) {
    return {
      id: 'soft_404',
      name: 'Soft 404 Detection',
      category: 'http',
      status: 'critical',
      severity: 'high',
      evidence: `Homepage returns HTTP 200 status but title indicates error: "${hp.title}".`,
      explanation: 'Soft 404 occurs when a non-existent or error page responds with an HTTP 200 status code instead of 404/410.',
      recommended_action: 'Configure server to return an explicit HTTP 404 or 410 status code for missing content.',
      confidence: 'high',
    };
  }

  return {
    id: 'soft_404',
    name: 'Soft 404 Detection',
    category: 'http',
    status: 'pass',
    severity: 'low',
    evidence: 'Homepage returns HTTP 200 with normal title and content signature.',
    explanation: 'No soft 404 error patterns detected on inspected pages.',
    recommended_action: 'Ensure missing URLs return proper HTTP 404 responses.',
    confidence: 'high',
  };
}

// ------------------------------------------------------------------
// 10. Crawlability Check
// ------------------------------------------------------------------
function evaluateCrawlability(data: CrawlDiagnosticOutput): CheckResult {
  const errors = data.errors || [];

  if (errors.length > 0) {
    const criticalError = errors.find(
      (e) =>
        e.error.includes('SSRF') ||
        e.error.includes('FETCH_TIMEOUT') ||
        e.error.includes('DNS')
    );

    if (criticalError) {
      return {
        id: 'crawlability',
        name: 'Technical Crawlability',
        category: 'crawlability',
        status: 'critical',
        severity: 'critical',
        evidence: `Crawlability issue detected: ${criticalError.error} on ${criticalError.url}.`,
        explanation: 'Network timeouts, DNS resolution failures, or security blocks strictly prevent crawlers from retrieving site content.',
        recommended_action: 'Resolve DNS configuration issues, network timeouts, or firewall blocking.',
        confidence: 'high',
      };
    }

    return {
      id: 'crawlability',
      name: 'Technical Crawlability',
      category: 'crawlability',
      status: 'warning',
      severity: 'medium',
      evidence: `${errors.length} fetch warning(s) occurred during crawl (e.g. ${errors[0].error}).`,
      explanation: 'Minor fetch or timeout issues encountered on specific sampled URLs.',
      recommended_action: 'Check server performance and edge network responsiveness.',
      confidence: 'high',
    };
  }

  return {
    id: 'crawlability',
    name: 'Technical Crawlability',
    category: 'crawlability',
    status: 'pass',
    severity: 'low',
    evidence: 'All HTTP requests, DNS lookups, and security checks executed cleanly with no timeouts.',
    explanation: 'Web server is fully reachable and permits automated crawler requests.',
    recommended_action: 'Maintain current server network configuration and response times.',
    confidence: 'high',
  };
}
