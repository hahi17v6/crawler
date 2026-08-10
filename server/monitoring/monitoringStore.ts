import {
  MonitoringSubscription,
  ScanComparisonResult,
  ScanSnapshot,
} from './monitoringTypes';
import { dbStore, MonitoringSubscriptionRecord } from '../db/store';

class MonitoringStore {
  /**
   * Subscribes or updates a domain recurring weekly monitoring ($25/month).
   */
  public async subscribeDomain(
    domain: string,
    email: string,
    options?: {
      status?: 'trialing' | 'active' | 'past_due' | 'unpaid' | 'canceled' | 'incomplete' | 'incomplete_expired';
      stripeCustomerId?: string | null;
      stripeSubscriptionId?: string | null;
      userSessionId?: string | null;
      trialStart?: string | null;
      trialEnd?: string | null;
      currentPeriodStart?: string | null;
      currentPeriodEnd?: string | null;
      cancelAtPeriodEnd?: boolean;
      canceledAt?: string | null;
    }
  ): Promise<MonitoringSubscription> {
    const normDomain = this.normalizeDomain(domain);
    let subRecord = await dbStore.getMonitoringSubscription(normDomain);

    const newStatus = options?.status || (subRecord?.status ?? 'active');
    const isActiveStatus = ['trialing', 'active', 'past_due'].includes(newStatus);
    const now = new Date().toISOString();

    if (!subRecord) {
      subRecord = {
        id: normDomain,
        domain: normDomain,
        email: email || 'user@example.com',
        pricePaid: '$25/month',
        active: isActiveStatus,
        status: newStatus,
        stripeCustomerId: options?.stripeCustomerId || null,
        stripeSubscriptionId: options?.stripeSubscriptionId || null,
        userSessionId: options?.userSessionId || null,
        trialStart: options?.trialStart || null,
        trialEnd: options?.trialEnd || null,
        currentPeriodStart: options?.currentPeriodStart || null,
        currentPeriodEnd: options?.currentPeriodEnd || null,
        cancelAtPeriodEnd: options?.cancelAtPeriodEnd || false,
        canceledAt: options?.canceledAt || null,
        subscribedAt: now,
        lastScanAt: null,
        history: [],
        updatedAt: now,
      };
    } else {
      subRecord.status = newStatus;
      subRecord.active = isActiveStatus;
      if (email) subRecord.email = email;
      if (options?.stripeCustomerId !== undefined) subRecord.stripeCustomerId = options.stripeCustomerId;
      if (options?.stripeSubscriptionId !== undefined) subRecord.stripeSubscriptionId = options.stripeSubscriptionId;
      if (options?.userSessionId !== undefined && options.userSessionId !== null) subRecord.userSessionId = options.userSessionId;
      if (options?.trialStart !== undefined) subRecord.trialStart = options.trialStart;
      if (options?.trialEnd !== undefined) subRecord.trialEnd = options.trialEnd;
      if (options?.currentPeriodStart !== undefined) subRecord.currentPeriodStart = options.currentPeriodStart;
      if (options?.currentPeriodEnd !== undefined) subRecord.currentPeriodEnd = options.currentPeriodEnd;
      if (options?.cancelAtPeriodEnd !== undefined) subRecord.cancelAtPeriodEnd = options.cancelAtPeriodEnd;
      if (options?.canceledAt !== undefined) subRecord.canceledAt = options.canceledAt;
      subRecord.updatedAt = now;
    }

    await dbStore.saveMonitoringSubscription(subRecord);
    return subRecord as MonitoringSubscription;
  }

  /**
   * Checks if a domain has an active recurring subscription.
   */
  public async isSubscribed(domain: string): Promise<boolean> {
    const normDomain = this.normalizeDomain(domain);
    const sub = await dbStore.getMonitoringSubscription(normDomain);
    return Boolean(sub && sub.active);
  }

  /**
   * Retrieves subscription details for a domain.
   */
  public async getSubscription(domain: string): Promise<MonitoringSubscription | null> {
    const normDomain = this.normalizeDomain(domain);
    const record = await dbStore.getMonitoringSubscription(normDomain);
    return (record as MonitoringSubscription) || null;
  }

  /**
   * Appends a new scan comparison result to domain history.
   */
  public async recordScanResult(domain: string, result: ScanComparisonResult): Promise<void> {
    const normDomain = this.normalizeDomain(domain);
    await dbStore.appendHistoryAtomically(normDomain, result);
  }

  /**
   * Retrieves latest snapshot recorded for a domain (if any).
   */
  public async getLatestSnapshot(domain: string): Promise<ScanSnapshot | null> {
    const normDomain = this.normalizeDomain(domain);
    const sub = await dbStore.getMonitoringSubscription(normDomain);
    if (sub && sub.history && sub.history.length > 0) {
      return sub.history[0].snapshot;
    }
    return null;
  }

  /**
   * Retrieves full scan history for a domain.
   */
  public async getHistory(domain: string): Promise<ScanComparisonResult[]> {
    const normDomain = this.normalizeDomain(domain);
    const sub = await dbStore.getMonitoringSubscription(normDomain);
    return sub ? sub.history : [];
  }

  /**
   * Unsubscribes a domain from monitoring.
   */
  public async unsubscribeDomain(domain: string): Promise<void> {
    const normDomain = this.normalizeDomain(domain);
    const subRecord = await dbStore.getMonitoringSubscription(normDomain);
    if (subRecord) {
      subRecord.active = false;
      subRecord.status = 'canceled';
      subRecord.cancelAtPeriodEnd = false;
      subRecord.canceledAt = new Date().toISOString();
      subRecord.updatedAt = new Date().toISOString();
      await dbStore.saveMonitoringSubscription(subRecord);
    }
  }

  /**
   * Retrieves all active subscribed domains for background cron execution.
   */
  public async getAllSubscribedDomains(): Promise<string[]> {
    const activeSubs = await dbStore.getAllActiveSubscriptions();
    return activeSubs.map((sub) => sub.domain);
  }

  private normalizeDomain(input: string): string {
    let clean = input.trim().toLowerCase();
    if (clean.startsWith('http://') || clean.startsWith('https://')) {
      try {
        clean = new URL(clean).hostname;
      } catch (_e) {
        // fallback
      }
    }
    return clean;
  }
}

export const monitoringStore = new MonitoringStore();

