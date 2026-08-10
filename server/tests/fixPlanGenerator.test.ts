import { generateFixPlan } from '../brain/fixPlanGenerator';
import { CrawlDiagnosticOutput } from '../crawler/crawlerEngine';
import { CheckResult } from '../checker/types';

function runFixPlanTests() {
  console.log('🧪 Starting Fix Plan Generator Unit Tests...');

  const mockCrawlData: CrawlDiagnosticOutput = {
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
      internalLinksCount: 12,
      externalLinksCount: 4,
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
      urlsFoundCount: 25,
      sampleUrls: ['https://example.com/about', 'https://example.com/pricing'],
      errors: [],
    },
    pages: [
      {
        url: 'https://example.com/about',
        finalUrl: 'https://example.com/about',
        source: 'sitemap',
        status: 200,
        title: 'About Us',
        metaRobots: 'index, follow',
        canonical: 'https://example.com/about',
      },
      {
        url: 'https://example.com/pricing',
        finalUrl: 'https://example.com/pricing',
        source: 'sitemap',
        status: 404,
        title: '404 Not Found',
        metaRobots: 'index, follow',
        canonical: null,
      },
    ],
    links: [
      { source: 'https://example.com', target: 'https://example.com/about', isInternal: true },
    ],
    errors: [],
  };

  const mockChecks: CheckResult[] = [
    {
      id: 'http_status',
      name: 'HTTP Status Response',
      category: 'http',
      status: 'warning',
      severity: 'medium',
      evidence: 'Homepage returned HTTP 200, but 1 sampled page returned 404.',
      explanation: 'Linked or indexed pages returning 4xx/5xx errors waste crawl budget.',
      recommended_action: 'Fix broken internal links or restore missing pages.',
      confidence: 'high',
    },
    {
      id: 'robots_txt',
      name: 'robots.txt Directives',
      category: 'robots',
      status: 'pass',
      severity: 'low',
      evidence: 'robots.txt exists with no block rules.',
      explanation: 'Crawlers are allowed.',
      recommended_action: 'Maintain config.',
      confidence: 'high',
    },
    {
      id: 'sitemap_xml',
      name: 'XML Sitemap',
      category: 'sitemap',
      status: 'pass',
      severity: 'low',
      evidence: '25 URLs found in sitemap.',
      explanation: 'Sitemap is valid.',
      recommended_action: 'Keep updated.',
      confidence: 'high',
    },
  ];

  const report = generateFixPlan(mockCrawlData, mockChecks);

  // Assertions
  if (report.productName !== 'Full Website Visibility Diagnosis') {
    throw new Error(`Expected product name 'Full Website Visibility Diagnosis', got '${report.productName}'`);
  }
  if (report.pricePaid !== '$11') {
    throw new Error(`Expected pricePaid '$11', got '${report.pricePaid}'`);
  }
  if (!report.topThreeFixes) {
    throw new Error('Expected topThreeFixes array to exist');
  }

  // Verify that each fix has Evidence, Impact, Action, Difficulty, Verify
  for (const fix of report.allFixes) {
    if (!fix.evidence || !fix.impact || !fix.action || !fix.difficulty || !fix.verify) {
      throw new Error(`Fix ${fix.id} is missing required Fix Plan attributes!`);
    }
  }

  console.log('  ✅ PASS: 1. Fix Plan report structure matches Full Website Visibility Diagnosis specifications');
  console.log('  ✅ PASS: 2. All fixes strictly include Evidence, Impact, Action, Difficulty, and Verify attributes');
  console.log('🎉 Fix Plan Generator Unit Tests passed successfully.');
}

runFixPlanTests();
