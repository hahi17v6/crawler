import { diagnoseSite } from '../brain/diagnosisBrain';
import { CheckResult } from '../checker/types';

function assert(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(`TEST FAILED: ${message}`);
  }
}

console.log('🧪 Starting Diagnosis Brain Unit Tests...\n');

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

// Helper mock check generator
function createMockCheck(overrides: Partial<CheckResult>): CheckResult {
  return {
    id: 'test_check',
    name: 'Test Check',
    category: 'http',
    status: 'pass',
    severity: 'low',
    evidence: 'Default pass evidence',
    explanation: 'Default pass explanation',
    recommended_action: 'Default pass action',
    confidence: 'high',
    ...overrides,
  };
}

// 1. All 10 checks pass
runTest('1. Healthy site returns primaryIssue null and 10 passed checks', () => {
  const mock10Passes: CheckResult[] = [
    createMockCheck({ id: 'http_status', name: 'HTTP Status' }),
    createMockCheck({ id: 'robots_txt', name: 'robots.txt' }),
    createMockCheck({ id: 'sitemap_xml', name: 'XML Sitemap' }),
    createMockCheck({ id: 'noindex_directive', name: 'noindex Directive' }),
    createMockCheck({ id: 'canonical_tag', name: 'Canonical Tag' }),
    createMockCheck({ id: 'internal_links', name: 'Internal Links' }),
    createMockCheck({ id: 'orphan_signals', name: 'Orphan Signals' }),
    createMockCheck({ id: 'js_rendering_signals', name: 'JS Rendering' }),
    createMockCheck({ id: 'soft_404', name: 'Soft 404' }),
    createMockCheck({ id: 'crawlability', name: 'Crawlability' }),
  ];

  const diag = diagnoseSite(mock10Passes);
  assert(diag.primaryIssue === null, 'Primary issue should be null for 10 passing checks');
  assert(diag.otherIssues.length === 0, 'Other issues should be empty for 10 passing checks');
  assert(diag.passedChecksCount === 10, 'Passed checks count should be 10');
});

// 2. Multiple simultaneous issues: Crawlability timeout vs robots Disallow: / vs noindex vs sitemap missing
runTest('2. Multiple simultaneous issues selects Crawlability as #1 Primary Issue', () => {
  const mockChecks: CheckResult[] = [
    createMockCheck({
      id: 'robots_txt',
      status: 'critical',
      severity: 'critical',
      evidence: 'robots.txt contains global block rule ("Disallow: /").',
    }),
    createMockCheck({
      id: 'sitemap_xml',
      status: 'warning',
      severity: 'medium',
      evidence: 'No accessible XML sitemap found at /sitemap.xml.',
    }),
    createMockCheck({
      id: 'crawlability',
      status: 'critical',
      severity: 'critical',
      evidence: 'Crawlability issue detected: FETCH_TIMEOUT on https://example.com.',
    }),
    createMockCheck({
      id: 'noindex_directive',
      status: 'critical',
      severity: 'critical',
      evidence: 'Homepage meta robots tag is set to "noindex, nofollow".',
    }),
    createMockCheck({ id: 'http_status', status: 'pass' }),
  ];

  const diag = diagnoseSite(mockChecks);

  // #1 Primary Issue should be Crawlability (score 100)
  assert(diag.primaryIssue !== null, 'Primary issue should not be null');
  assert(diag.primaryIssue?.id === 'crawlability', `Expected primary issue crawlability, got ${diag.primaryIssue?.id}`);
  assert(diag.primaryIssue?.impact === 'Critical', 'Primary issue impact should be Critical');

  // Next in otherIssues should be HTTP / Homepage / Robots (score 90), then noindex (85), then sitemap (50)
  assert(diag.otherIssues.length === 3, `Expected 3 other issues, got ${diag.otherIssues.length}`);
  assert(diag.otherIssues[0].id === 'robots_txt', `Expected 1st other issue robots_txt, got ${diag.otherIssues[0].id}`);
  assert(diag.otherIssues[1].id === 'noindex_directive', `Expected 2nd other issue noindex_directive, got ${diag.otherIssues[1].id}`);
  assert(diag.otherIssues[2].id === 'sitemap_xml', `Expected 3rd other issue sitemap_xml, got ${diag.otherIssues[2].id}`);
});

// 3. Verification of OBSERVED / INFERENCE / ACTION structure
runTest('3. Issues strictly separate OBSERVED, INFERENCE, and ACTION attributes', () => {
  const mockChecks: CheckResult[] = [
    createMockCheck({
      id: 'noindex_directive',
      status: 'critical',
      severity: 'critical',
      evidence: 'Homepage meta robots tag is set to "noindex, nofollow".',
    }),
  ];

  const diag = diagnoseSite(mockChecks);
  const issue = diag.primaryIssue!;

  assert(Boolean(issue.title), 'Issue title must exist');
  assert(Boolean(issue.observed), 'Issue observed must exist');
  assert(Boolean(issue.inference), 'Issue inference must exist');
  assert(Boolean(issue.action), 'Issue action must exist');
  assert(Boolean(issue.impact), 'Issue impact must exist');
  assert(Boolean(issue.difficulty), 'Issue difficulty must exist');
  assert(Boolean(issue.confidence), 'Issue confidence must exist');

  assert(issue.observed === 'Homepage meta robots tag is set to "noindex, nofollow".', 'Observed should match exact measured evidence');
});

// 4. Verification that INFERENCE never uses declarative "Google isn't indexing..." statements
runTest('4. Inference uses probabilistic framing ("may prevent...") and avoids absolute Google claims', () => {
  const mockChecks: CheckResult[] = [
    createMockCheck({
      id: 'robots_txt',
      status: 'critical',
      severity: 'critical',
      evidence: 'robots.txt contains global block rule ("Disallow: /").',
    }),
    createMockCheck({
      id: 'noindex_directive',
      status: 'critical',
      severity: 'critical',
      evidence: 'Homepage meta robots tag is set to "noindex, nofollow".',
    }),
    createMockCheck({
      id: 'soft_404',
      status: 'critical',
      severity: 'high',
      evidence: 'Homepage returns HTTP 200 status but title indicates error: "404 Not Found".',
    }),
  ];

  const diag = diagnoseSite(mockChecks);
  const allIssues = [diag.primaryIssue!, ...diag.otherIssues];

  for (const issue of allIssues) {
    const infLower = issue.inference.toLowerCase();
    assert(!infLower.includes("google isn't indexing"), `Inference should not state "Google isn't indexing": ${issue.inference}`);
    assert(!infLower.includes("google is not indexing"), `Inference should not state "Google is not indexing": ${issue.inference}`);
    assert(
      infLower.includes("may prevent") ||
      infLower.includes("instructs") ||
      infLower.includes("may confuse") ||
      infLower.includes("prevent"),
      `Inference should use appropriate probabilistic or specification language: ${issue.inference}`
    );
  }
});

// 5. Deterministic ranking test: Homepage 500 error vs cross-domain canonical vs 0 internal links
runTest('5. Homepage 500 beats canonical cross-domain and zero internal links', () => {
  const mockChecks: CheckResult[] = [
    createMockCheck({
      id: 'canonical_tag',
      status: 'warning',
      severity: 'high',
      evidence: 'Homepage canonical points to a different domain: "https://spam.com".',
    }),
    createMockCheck({
      id: 'internal_links',
      status: 'critical',
      severity: 'high',
      evidence: 'Homepage contains 0 internal <a href> links.',
    }),
    createMockCheck({
      id: 'http_status',
      status: 'critical',
      severity: 'critical',
      evidence: 'Homepage returned server error HTTP status 500.',
    }),
  ];

  const diag = diagnoseSite(mockChecks);

  assert(diag.primaryIssue?.id === 'http_status', `Expected primary issue http_status, got ${diag.primaryIssue?.id}`);
  assert(diag.otherIssues[0].id === 'canonical_tag', `Expected 1st other issue canonical_tag, got ${diag.otherIssues[0].id}`);
  assert(diag.otherIssues[1].id === 'internal_links', `Expected 2nd other issue internal_links, got ${diag.otherIssues[1].id}`);
});

console.log(`\n🎉 Summary: ${passedTests}/${totalTests} diagnosis brain unit tests passed successfully.\n`);
