import fs from 'fs';
import path from 'path';
import { AnalyticsStore } from '../analytics/analyticsService';

async function testAnalyticsPersistence() {
  console.log('🧪 Starting Analytics Persistence & Funnel Unit Tests...');

  const testFile = path.join(process.cwd(), 'data', 'test_analytics_events.json');

  // Clean up any old test file
  if (fs.existsSync(testFile)) {
    fs.unlinkSync(testFile);
  }

  // 1. Instanciate fresh store and track events
  const store1 = new AnalyticsStore(testFile);
  
  store1.track('analysis_started', 'example.com', 'user1@example.com', { ref: 'test' }, 'sess_123');
  store1.track('successful_scan', 'example.com', undefined, undefined, 'sess_123');
  store1.track('result_viewed', 'example.com', undefined, undefined, 'sess_123');
  store1.track('email_captured', 'example.com', 'user1@example.com', undefined, 'sess_123');
  store1.track('checkout_started', 'example.com', 'user1@example.com', { price: 11 }, 'sess_123');
  store1.track('purchase_completed', 'example.com', undefined, { price: 11 }, 'sess_123');
  store1.track('report_opened', 'example.com', undefined, undefined, 'sess_123');
  store1.track('monitoring_started', 'example.com', 'user1@example.com', undefined, 'sess_123');

  // Verify file exists on disk
  if (!fs.existsSync(testFile)) {
    throw new Error('Analytics events JSON file was not created on disk.');
  }
  console.log('  ✅ PASS: 1. Analytics event persisted immediately to disk');

  // 2. Simulate server restart by creating a second store instance reading from the same file
  const store2 = new AnalyticsStore(testFile);
  const events = store2.getEvents();

  if (events.length !== 8) {
    throw new Error(`Expected 8 events after server restart reload, got ${events.length}`);
  }

  const firstEvent = events.find(e => e.event === 'analysis_started');
  if (!firstEvent || firstEvent.sessionId !== 'sess_123' || firstEvent.domain !== 'example.com') {
    throw new Error('Loaded event attributes do not match persisted parameters');
  }

  // Check email anonymization
  if (firstEvent.email && firstEvent.email.includes('user1@example.com')) {
    throw new Error('Raw email address PII found unanonymized in stored event');
  }
  console.log('  ✅ PASS: 2. Events survive server restart and preserve session ID & anonymized data');

  // 3. Test metric aggregation & conversion rate calculation
  const metrics = store2.getFunnelMetrics();

  if (metrics.analyses !== 1 || metrics.resultsViewed !== 1 || metrics.purchasesCompleted !== 1) {
    throw new Error('Aggregated metrics count mismatch');
  }

  if (
    metrics.conversionRates.analysisToResultPct !== 100 ||
    metrics.conversionRates.checkoutToPurchasePct !== 100 ||
    metrics.conversionRates.purchaseToReportPct !== 100 ||
    metrics.conversionRates.purchaseToMonitoringPct !== 100
  ) {
    throw new Error(`Conversion rate calculations incorrect: ${JSON.stringify(metrics.conversionRates)}`);
  }
  console.log('  ✅ PASS: 3. Aggregated metrics and conversion percentages calculated accurately');

  // Clean up test file
  store2.clearForTest();

  console.log('🎉 Analytics Persistence & Funnel Unit Tests passed successfully.');
}

testAnalyticsPersistence().catch((err) => {
  console.error('❌ Analytics Persistence Test Failed:', err);
  process.exit(1);
});
