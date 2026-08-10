export interface GscDataSignal {
  gscVerifiedDataAvailable?: boolean;
  googleDisappearedCount?: number;
  googleConsoleAlert?: boolean;
}

export interface ScanSnapshot {
  id: string;
  domain: string;
  timestamp: string; // ISO string
  robotsContent: string;
  robotsDisallowsAll: boolean;
  sitemapUrlCount: number;
  sitemapErrorsCount: number;
  sitemapExists: boolean;
  pageStatuses: Record<string, number>; // URL -> HTTP status code
  noindexUrls: string[];
  canonicalUrls: Record<string, string | null>;
  discoveredPagesCount: number;
  discoveredPages: string[];
  internalLinksCount: number;
  gscData?: GscDataSignal;
}

export interface ImportantAlert {
  id: string;
  header: string; // e.g. "🚨 32 previously accessible pages now return 403."
  whatChanged: string;
  whyItMatters: string;
  whatToDo: string;
}

export interface ScanComparisonResult {
  domain: string;
  scanDate: string;
  previousScanDate: string | null;
  alerts: ImportantAlert[];
  snapshot: ScanSnapshot;
}

export interface MonitoringSubscription {
  domain: string;
  email: string;
  pricePaid: '$25/month';
  active: boolean;
  status: 'trialing' | 'active' | 'past_due' | 'unpaid' | 'canceled' | 'incomplete' | 'incomplete_expired';
  stripeCustomerId?: string | null;
  stripeSubscriptionId?: string | null;
  userSessionId?: string | null;
  trialStart?: string | null;
  trialEnd?: string | null;
  currentPeriodStart?: string | null;
  currentPeriodEnd?: string | null;
  cancelAtPeriodEnd?: boolean;
  canceledAt?: string | null;
  subscribedAt: string;
  lastScanAt: string | null;
  history: ScanComparisonResult[];
  updatedAt?: string;
}
