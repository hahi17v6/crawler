import { runTechnicalCrawl } from '../crawler/crawlerEngine';
import { createSnapshotFromCrawl, compareSnapshots } from './monitoringEngine';
import { monitoringStore } from './monitoringStore';
import { dbStore } from '../db/store';

// Frequency: Weekly scan (7 days in milliseconds)
const WEEKLY_SCAN_INTERVAL_MS = 7 * 24 * 60 * 60 * 1000;
const MIN_SCAN_INTERVAL_LOCK_MS = 60 * 60 * 1000; // 1 hour concurrency lock window

/**
 * Executes a weekly recurring scan for a target domain.
 */
export async function executeDomainWeeklyScan(domain: string, gscSignal?: any) {
  try {
    const url = domain.startsWith('http') ? domain : `https://${domain}`;
    console.log(`[Weekly Monitoring Cron] Starting scheduled scan for ${url}...`);

    const crawlResult = await runTechnicalCrawl(url);
    const newSnapshot = createSnapshotFromCrawl(crawlResult, gscSignal);

    const previousSnapshot = await monitoringStore.getLatestSnapshot(domain);
    const comparisonResult = compareSnapshots(newSnapshot, previousSnapshot);

    await monitoringStore.recordScanResult(domain, comparisonResult);

    console.log(
      `[Weekly Monitoring Cron] Scan completed for ${domain}. ${comparisonResult.alerts.length} important alerts found.`
    );

    return comparisonResult;
  } catch (err: any) {
    console.error(`[Weekly Monitoring Cron Error] Failed scan for ${domain}:`, err?.message);
    throw err;
  }
}

/**
 * Cloud Scheduler triggerable monitoring runner.
 * Safe for multi-instance Cloud Run execution with concurrency lock.
 */
export async function runMonitoringJob(): Promise<{ scannedCount: number; errorsCount: number }> {
  let scannedCount = 0;
  let errorsCount = 0;

  try {
    const domains = await monitoringStore.getAllSubscribedDomains();
    const now = Date.now();

    for (const domain of domains) {
      const sub = await monitoringStore.getSubscription(domain);
      if (!sub) continue;

      const lastScanTime = sub.lastScanAt ? new Date(sub.lastScanAt).getTime() : 0;
      // Ensure domain hasn't been scanned recently (concurrency / duplicate execution protection)
      if (now - lastScanTime >= WEEKLY_SCAN_INTERVAL_MS || now - lastScanTime >= MIN_SCAN_INTERVAL_LOCK_MS) {
        const lockId = `cron_scan_${domain}`;
        const acquired = await dbStore.acquireJobLock(lockId, MIN_SCAN_INTERVAL_LOCK_MS);
        if (!acquired) {
          console.log(`[Weekly Monitoring Job] Domain ${domain} is locked by another instance or was recently scanned. Skipping.`);
          continue;
        }

        try {
          await executeDomainWeeklyScan(domain);
          scannedCount++;
        } catch (_err) {
          errorsCount++;
        } finally {
          await dbStore.releaseJobLock(lockId);
        }
      }
    }
  } catch (err: any) {
    console.error('[Weekly Monitoring Job] Fatal error during batch execution:', err?.message);
  }

  return { scannedCount, errorsCount };
}

/**
 * Legacy local fallback initializer (for non-production local development).
 */
export function initCronScheduler() {
  if (process.env.NODE_ENV === 'production') {
    console.log('[Weekly Monitoring Cron] Cloud Run production mode: use POST /api/cron/run-monitoring with Cloud Scheduler.');
    return;
  }

  console.log('[Weekly Monitoring Cron] Initializing local dev scheduler...');
}

