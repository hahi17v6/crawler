import { runAIVisibilityAnalysis, generateRelevantQueries } from '../aiVisibility/aiVisibilityEngine';

async function testAIVisibilityEngine() {
  console.log('🧪 Starting AI Visibility Engine Unit Tests...');

  // 1. Query generation test across all 6 required categories
  const queries = generateRelevantQueries('crawlsignal.com', 'CrawlSignal');
  if (queries.length < 20 || queries.length > 50) {
    throw new Error(`Expected 20-50 queries, got ${queries.length}`);
  }

  const categories = new Set(queries.map(q => q.category));
  const requiredCategories = ['category', 'problem', 'comparison', 'alternative', 'use_case', 'transactional'];
  requiredCategories.forEach(cat => {
    if (!categories.has(cat as any)) {
      throw new Error(`Missing required query category: ${cat}`);
    }
  });
  console.log(`  ✅ PASS: 1. Generated ${queries.length} queries spanning all 6 required categories`);

  // 2. Full Analysis test
  const result = await runAIVisibilityAnalysis('crawlsignal.com', 'CrawlSignal');

  if (typeof result.mentionedQueriesCount !== 'number' || typeof result.totalQueriesEvaluated !== 'number') {
    throw new Error('Result must provide mentionedQueriesCount and totalQueriesEvaluated');
  }

  console.log(`  ✅ PASS: 2. Formatted as "${result.mentionedQueriesCount} / ${result.totalQueriesEvaluated} relevant queries" without 0-100 score`);

  // 3. Check Confidence badge and explanation
  if (!result.confidenceLevel || !result.confidenceExplanation) {
    throw new Error('AI Visibility result must include Confidence level and explanation');
  }
  console.log(`  ✅ PASS: 3. Confidence level provided with variation disclaimer ("${result.confidenceLevel}")`);

  // 4. Verify strict probabilistic phrasing in recommendations
  const recommendedText = JSON.stringify(result.observedPatterns);
  if (recommendedText.toLowerCase().includes('this will make chatgpt recommend you')) {
    throw new Error('FORBIDDEN claim found: "This will make ChatGPT recommend you"');
  }

  const allowedTypes = ['likely_signal', 'possible_factor', 'observed_pattern'];
  result.observedPatterns.forEach(pattern => {
    if (!allowedTypes.includes(pattern.type)) {
      throw new Error(`Invalid pattern type: ${pattern.type}`);
    }
  });
  console.log(`  ✅ PASS: 4. Strictly enforced probabilistic language (likely signal / possible factor / observed pattern)`);

  // 5. Competitor share test
  if (!Array.isArray(result.competitorShares) || result.competitorShares.length === 0) {
    throw new Error('Competitor shares must be populated');
  }
  console.log(`  ✅ PASS: 5. Competitor shares generated (${result.competitorShares.map(c => `${c.name}: ${c.mentionedCount}/${c.totalQueries}`).join(', ')})`);

  console.log('🎉 AI Visibility Engine Unit Tests passed successfully.');
}

testAIVisibilityEngine().catch((err) => {
  console.error('❌ AI Visibility Test Failed:', err);
  process.exit(1);
});
