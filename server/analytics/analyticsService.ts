import fs from 'fs';
import path from 'path';
import { dbStore } from '../db/store';

export type AnalyticsEventType =
  | 'analysis_started'
  | 'successful_scan'
  | 'failed_scan'
  | 'result_viewed'
  | 'email_captured'
  | 'checkout_started'
  | 'purchase_completed'
  | 'report_opened'
  | 'monitoring_started'
  | 'monitoring_cancelled';

export interface AnalyticsEvent {
  id: string;
  event: AnalyticsEventType;
  sessionId: string;
  domain?: string;
  email?: string;
  metadata?: Record<string, any>;
  timestamp: string;
}

export interface FunnelMetrics {
  analyses: number;
  resultsViewed: number;
  emailsCaptured: number;
  checkoutsStarted: number;
  purchasesCompleted: number;
  reportsOpened: number;
  monitoringStarted: number;
  monitoringCancelled: number;
  failedScans: number;
  successfulScans: number;
  conversionRates: {
    analysisToResultPct: number;
    resultToEmailPct: number;
    emailToCheckoutPct: number;
    checkoutToPurchasePct: number;
    purchaseToReportPct: number;
    purchaseToMonitoringPct: number;
  };
}

export class AnalyticsStore {
  private events: AnalyticsEvent[] = [];
  private filePath: string;

  constructor(customFilePath?: string) {
    if (customFilePath) {
      this.filePath = customFilePath;
    } else {
      const dataDir = path.join(process.cwd(), 'data');
      if (!fs.existsSync(dataDir)) {
        try {
          fs.mkdirSync(dataDir, { recursive: true });
        } catch (_e) {
          // ignore
        }
      }
      this.filePath = path.join(dataDir, 'analytics_events.json');
    }

    this.loadFromDisk();
  }

  private isProduction(): boolean {
    return process.env.NODE_ENV === 'production' || !!process.env.VERCEL || !!process.env.K_SERVICE;
  }

  private loadFromDisk(): void {
    // Skip disk I/O in production (Vercel, Cloud Run) — Firestore is the source of truth
    if (this.isProduction()) return;
    try {
      if (fs.existsSync(this.filePath)) {
        const raw = fs.readFileSync(this.filePath, 'utf-8');
        const data = JSON.parse(raw);
        if (Array.isArray(data)) {
          this.events = data;
        }
      }
    } catch (err) {
      console.warn('[AnalyticsStore] Error loading events from disk:', err);
      this.events = [];
    }
  }

  private saveToDisk(): void {
    // Skip disk I/O in production (Vercel, Cloud Run) — Firestore is the source of truth
    if (this.isProduction()) return;
    try {
      const dir = path.dirname(this.filePath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      fs.writeFileSync(this.filePath, JSON.stringify(this.events, null, 2), 'utf-8');
    } catch (err) {
      console.warn('[AnalyticsStore] Error saving events to disk:', err);
    }
  }

  private anonymizeEmail(email?: string): string | undefined {
    if (!email) return undefined;
    const clean = email.trim().toLowerCase();
    const parts = clean.split('@');
    if (parts.length === 2) {
      const name = parts[0];
      const domain = parts[1];
      const anonName = name.length > 2 ? `${name[0]}***${name[name.length - 1]}` : 'u***';
      return `${anonName}@${domain}`;
    }
    return 'anon@user.com';
  }

  public track(
    event: AnalyticsEventType,
    domain?: string,
    email?: string,
    metadata?: Record<string, any>,
    sessionId?: string
  ): AnalyticsEvent {
    const entry: AnalyticsEvent = {
      id: `evt_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      event,
      sessionId: sessionId || `sess_${Math.random().toString(36).substring(2, 9)}`,
      domain: domain ? domain.toLowerCase().replace(/^https?:\/\//i, '').replace(/\/.*$/, '') : undefined,
      email: this.anonymizeEmail(email),
      metadata,
      timestamp: new Date().toISOString(),
    };

    this.events.push(entry);

    if (this.events.length > 2000) {
      this.events = this.events.slice(-2000);
    }

    this.saveToDisk();

    // Async non-blocking write to persistent store
    dbStore.recordAnalyticsEvent({
      id: entry.id,
      sessionId: entry.sessionId,
      eventType: entry.event,
      path: entry.domain,
      timestamp: entry.timestamp,
      metadata: entry.metadata,
    }).catch((err) => {
      console.error('[AnalyticsStore] Non-blocking dbStore save error:', err);
    });

    return entry;
  }

  public getEvents(limit = 100): AnalyticsEvent[] {
    return [...this.events].reverse().slice(0, limit);
  }

  public getFunnelMetrics(): FunnelMetrics {
    let analyses = 0;
    let successfulScans = 0;
    let failedScans = 0;
    let resultsViewed = 0;
    let emailsCaptured = 0;
    let checkoutsStarted = 0;
    let purchasesCompleted = 0;
    let reportsOpened = 0;
    let monitoringStarted = 0;
    let monitoringCancelled = 0;

    for (const ev of this.events) {
      switch (ev.event) {
        case 'analysis_started':
          analyses++;
          break;
        case 'successful_scan':
          successfulScans++;
          break;
        case 'failed_scan':
          failedScans++;
          break;
        case 'result_viewed':
          resultsViewed++;
          break;
        case 'email_captured':
          emailsCaptured++;
          break;
        case 'checkout_started':
          checkoutsStarted++;
          break;
        case 'purchase_completed':
          purchasesCompleted++;
          break;
        case 'report_opened':
          reportsOpened++;
          break;
        case 'monitoring_started':
          monitoringStarted++;
          break;
        case 'monitoring_cancelled':
          monitoringCancelled++;
          break;
      }
    }

    const pct = (num: number, den: number) => (den > 0 ? Math.round((num / den) * 1000) / 10 : 0);

    return {
      analyses,
      successfulScans,
      failedScans,
      resultsViewed,
      emailsCaptured,
      checkoutsStarted,
      purchasesCompleted,
      reportsOpened,
      monitoringStarted,
      monitoringCancelled,
      conversionRates: {
        analysisToResultPct: pct(resultsViewed, analyses),
        resultToEmailPct: pct(emailsCaptured, resultsViewed),
        emailToCheckoutPct: pct(checkoutsStarted, emailsCaptured),
        checkoutToPurchasePct: pct(purchasesCompleted, checkoutsStarted),
        purchaseToReportPct: pct(reportsOpened, purchasesCompleted),
        purchaseToMonitoringPct: pct(monitoringStarted, purchasesCompleted),
      },
    };
  }

  public clearForTest(): void {
    this.events = [];
    if (fs.existsSync(this.filePath)) {
      try {
        fs.unlinkSync(this.filePath);
      } catch (_e) {
        // ignore
      }
    }
  }
}

export const analyticsStore = new AnalyticsStore();


