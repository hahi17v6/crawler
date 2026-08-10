import { CheckResult } from '../checker/types';
import { BrainDiagnosisOutput, StructuredIssue, IssueDifficulty } from './types';

// Deterministic priority weight mapping for issue ranking
const PRIORITY_SCORES: Record<string, number> = {
  crawlability_critical: 100,
  http_status_hp_error: 95,
  robots_txt_disallow_all: 90,
  noindex_homepage: 85,
  soft_404_critical: 80,
  canonical_cross_domain: 75,
  internal_links_zero: 70,
  http_status_page_error: 65,
  noindex_pages: 60,
  sitemap_missing_or_error: 50,
  js_rendering_heavy: 40,
  orphan_signals_unlinked: 30,
};

export function diagnoseSite(checks: CheckResult[]): BrainDiagnosisOutput {
  const issues: StructuredIssue[] = [];
  const passedChecks: { id: string; name: string; evidence: string }[] = [];

  for (const check of checks) {
    if (check.status === 'pass') {
      passedChecks.push({
        id: check.id,
        name: check.name,
        evidence: check.evidence,
      });
      continue;
    }

    // Convert non-passing checks into structured issues with strict OBSERVED / INFERENCE / ACTION separation
    const issue = convertCheckToIssue(check);
    if (issue) {
      issues.push(issue);
    }
  }

  // Sort issues deterministically by priority score descending
  issues.sort((a, b) => b.priorityScore - a.priorityScore);

  const primaryIssue = issues.length > 0 ? issues[0] : null;
  const otherIssues = issues.length > 1 ? issues.slice(1) : [];

  let summaryMessage = '';
  if (!primaryIssue) {
    summaryMessage = 'All 10 core technical checks passed cleanly. No critical indexability blockers detected.';
  } else {
    summaryMessage = `Identified 1 primary technical issue (${primaryIssue.title}) requiring immediate attention.`;
  }

  return {
    primaryIssue,
    otherIssues,
    passedChecksCount: passedChecks.length,
    passedChecks,
    summaryMessage,
  };
}

function convertCheckToIssue(check: CheckResult): StructuredIssue | null {
  const checkId = check.id;

  switch (checkId) {
    case 'crawlability':
      return {
        id: checkId,
        title: 'Network & Infrastructure Crawl Blocker',
        observed: check.evidence,
        inference: 'Network timeouts, DNS resolution failures, or security blocks prevent search crawlers from accessing site content.',
        action: 'Inspect firewall rules, DNS records, and server stability to ensure public HTTP accessibility.',
        impact: 'Critical',
        difficulty: 'Hard',
        confidence: check.confidence === 'low' ? 'Low' : check.confidence === 'medium' ? 'Medium' : 'High',
        checkCategory: check.category,
        priorityScore: PRIORITY_SCORES.crawlability_critical,
      };

    case 'http_status': {
      const isHpError = check.evidence.toLowerCase().includes('homepage');
      return {
        id: checkId,
        title: isHpError ? 'Homepage Server / Response Error' : 'Subpage HTTP Status Errors',
        observed: check.evidence,
        inference: isHpError
          ? 'An HTTP error on your homepage may completely prevent search engines from discovering and indexing your site.'
          : 'HTTP 4xx/5xx errors on sampled internal pages may waste crawl budget and cause search engines to de-index affected URLs.',
        action: 'Review web server logs and fix backend routing to ensure affected URLs return HTTP 200 OK.',
        impact: isHpError ? 'Critical' : 'High',
        difficulty: 'Medium',
        confidence: 'High',
        checkCategory: check.category,
        priorityScore: isHpError ? PRIORITY_SCORES.http_status_hp_error : PRIORITY_SCORES.http_status_page_error,
      };
    }

    case 'robots_txt':
      return {
        id: checkId,
        title: 'Global Search Crawler Block in robots.txt',
        observed: check.evidence,
        inference: 'A "Disallow: /" rule instructs search engine crawlers not to fetch or inspect any pages on this domain.',
        action: 'Remove "Disallow: /" from your robots.txt file to allow search crawlers to access public pages.',
        impact: 'Critical',
        difficulty: 'Easy',
        confidence: 'High',
        checkCategory: check.category,
        priorityScore: PRIORITY_SCORES.robots_txt_disallow_all,
      };

    case 'noindex_directive': {
      const isHpNoindex = check.evidence.toLowerCase().includes('homepage');
      return {
        id: checkId,
        title: isHpNoindex ? 'Homepage noindex Directive' : 'Subpage noindex Directives',
        observed: check.evidence,
        inference: isHpNoindex
          ? 'A noindex meta tag on your homepage explicitly instructs search engines not to display your site in search results.'
          : 'noindex meta tags on internal pages explicitly prevent search engines from indexing those specific URLs.',
        action: 'Remove <meta name="robots" content="noindex"> from pages you want visible in search results.',
        impact: isHpNoindex ? 'Critical' : 'Medium',
        difficulty: 'Easy',
        confidence: 'High',
        checkCategory: check.category,
        priorityScore: isHpHpNoindex(check) ? PRIORITY_SCORES.noindex_homepage : PRIORITY_SCORES.noindex_pages,
      };
    }

    case 'soft_404':
      return {
        id: checkId,
        title: 'Soft 404 Error Detected',
        observed: check.evidence,
        inference: 'Serving an error message with a 200 OK status code may confuse search engines into indexing broken pages or flagging soft 404s.',
        action: 'Configure your web server to return a true HTTP 404 Not Found or HTTP 410 Gone status code for missing content.',
        impact: 'High',
        difficulty: 'Medium',
        confidence: 'High',
        checkCategory: check.category,
        priorityScore: PRIORITY_SCORES.soft_404_critical,
      };

    case 'canonical_tag':
      return {
        id: checkId,
        title: 'Conflicting or External Canonical Tag',
        observed: check.evidence,
        inference: 'A canonical tag pointing to an external domain instructs search engines to attribute ranking power to a different website.',
        action: 'Update the <link rel="canonical"> tag on your homepage to point to your own preferred URL.',
        impact: 'High',
        difficulty: 'Easy',
        confidence: 'High',
        checkCategory: check.category,
        priorityScore: PRIORITY_SCORES.canonical_cross_domain,
      };

    case 'internal_links':
      return {
        id: checkId,
        title: 'Missing Homepage Internal Links',
        observed: check.evidence,
        inference: 'A homepage with no or very few internal HTML links makes it difficult for search crawlers to navigate to deep content.',
        action: 'Add standard HTML navigation links (<a href="...">) to lead crawlers and users to key site sections.',
        impact: 'High',
        difficulty: 'Medium',
        confidence: 'High',
        checkCategory: check.category,
        priorityScore: PRIORITY_SCORES.internal_links_zero,
      };

    case 'sitemap_xml':
      return {
        id: checkId,
        title: 'Missing or Empty XML Sitemap',
        observed: check.evidence,
        inference: 'Without an accessible XML sitemap, search engines rely solely on link discovery, which may slow down new page indexing.',
        action: 'Generate a valid XML sitemap at /sitemap.xml and reference its location in your robots.txt file.',
        impact: 'Medium',
        difficulty: 'Easy',
        confidence: 'High',
        checkCategory: check.category,
        priorityScore: PRIORITY_SCORES.sitemap_missing_or_error,
      };

    case 'js_rendering_signals':
      return {
        id: checkId,
        title: 'Heavy Client-Side JavaScript Dependency',
        observed: check.evidence,
        inference: 'When initial HTML lacks text content, search engines must execute client-side JavaScript, which may delay indexation.',
        action: 'Consider implementing Server-Side Rendering (SSR) or Static Site Generation (SSG) for core SEO content.',
        impact: 'Medium',
        difficulty: 'Hard',
        confidence: 'Medium',
        checkCategory: check.category,
        priorityScore: PRIORITY_SCORES.js_rendering_heavy,
      };

    case 'orphan_signals':
      return {
        id: checkId,
        title: 'Orphan Page Discovery Risk',
        observed: check.evidence,
        inference: 'URLs present in your sitemap but omitted from homepage navigation links may receive lower internal page authority.',
        action: 'Ensure important pages listed in your sitemap are linked contextually in your site header, footer, or content body.',
        impact: 'Low',
        difficulty: 'Easy',
        confidence: 'Medium',
        checkCategory: check.category,
        priorityScore: PRIORITY_SCORES.orphan_signals_unlinked,
      };

    default:
      return null;
  }
}

function isHpHpNoindex(check: CheckResult): boolean {
  return check.evidence.toLowerCase().includes('homepage');
}
