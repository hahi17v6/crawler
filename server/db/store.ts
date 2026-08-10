import fs from 'node:fs';
import path from 'node:path';
import { Firestore } from '@google-cloud/firestore';

export interface PaymentRecord {
  id: string; // stripeSessionId or mockSessionId
  stripeSessionId: string;
  email: string;
  targetUrl: string;
  hostname: string;
  status: 'pending' | 'paid' | 'failed' | 'cancelled';
  amount: number;
  currency: string;
  product: 'full_diagnosis' | 'recurring_monitoring';
  createdAt: string;
  updatedAt: string;
}

export interface MonitoringSubscriptionRecord {
  id: string; // domain (normalized)
  domain: string;
  email: string;
  pricePaid: string;
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
  history: any[];
  updatedAt?: string;
}

export interface AnalyticsEventRecord {
  id: string;
  sessionId: string;
  eventType: string;
  path?: string;
  timestamp: string;
  metadata?: Record<string, any>;
}

interface LocalDbSchema {
  payments: Record<string, PaymentRecord>;
  monitoring_subscriptions: Record<string, MonitoringSubscriptionRecord>;
  analytics_events: AnalyticsEventRecord[];
}

class PersistentDbStore {
  private firestore: Firestore | null = null;
  private dbPath: string;
  private memoryCache: LocalDbSchema;

  constructor() {
    this.dbPath = path.join(process.cwd(), 'data', 'db.json');
    this.memoryCache = {
      payments: {},
      monitoring_subscriptions: {},
      analytics_events: [],
    };

    // Initialize Firestore:
    // - On GCP/Cloud Run: uses ADC via FIRESTORE_PROJECT_ID / GCP_PROJECT env
    // - On Vercel: uses explicit service account via FIREBASE_PROJECT_ID + FIREBASE_CLIENT_EMAIL + FIREBASE_PRIVATE_KEY
    const firestoreProjectId =
      process.env.FIREBASE_PROJECT_ID ||
      process.env.FIRESTORE_PROJECT_ID ||
      process.env.GCP_PROJECT ||
      process.env.GOOGLE_CLOUD_PROJECT;

    if (firestoreProjectId) {
      try {
        const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
        const privateKeyRaw = process.env.FIREBASE_PRIVATE_KEY;
        // Vercel stores private keys with escaped newlines — unescape them
        const privateKey = privateKeyRaw ? privateKeyRaw.replace(/\\n/g, '\n') : undefined;

        if (clientEmail && privateKey) {
          // Explicit service account credentials (Vercel / non-GCP environments)
          this.firestore = new Firestore({
            projectId: firestoreProjectId,
            credentials: { client_email: clientEmail, private_key: privateKey },
          });
          console.log(`[PersistentDbStore] Initialized Firestore with service account for project: ${firestoreProjectId}`);
        } else {
          // ADC (Application Default Credentials) — works on GCP/Cloud Run
          this.firestore = new Firestore({ projectId: firestoreProjectId });
          console.log(`[PersistentDbStore] Initialized Firestore via ADC for project: ${firestoreProjectId}`);
        }
      } catch (err: any) {
        console.warn(`[PersistentDbStore] Firestore init warning: ${err?.message}. Falling back to local DB.`);
      }
    }

    this.loadFromDisk();
  }

  public getFirestore(): Firestore | null {
    return this.firestore;
  }

  private loadFromDisk() {
    try {
      if (fs.existsSync(this.dbPath)) {
        const raw = fs.readFileSync(this.dbPath, 'utf8');
        const parsed = JSON.parse(raw);
        this.memoryCache = {
          payments: parsed.payments || {},
          monitoring_subscriptions: parsed.monitoring_subscriptions || {},
          analytics_events: Array.isArray(parsed.analytics_events) ? parsed.analytics_events : [],
        };
      } else {
        this.saveToDisk();
      }
    } catch (err: any) {
      console.error('[PersistentDbStore] Error reading local disk DB:', err?.message);
    }
  }

  private saveToDisk() {
    // Cloud Run and Production environments must use Firestore exclusively for persistence
    // Writing to the local filesystem in Cloud Run can cause OOM errors due to the ephemeral memory-backed filesystem
    const isProd = process.env.NODE_ENV === 'production' || !!process.env.K_SERVICE || !!this.firestore;
    if (isProd) {
      return;
    }
    try {
      const dir = path.dirname(this.dbPath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      // Atomic write using temporary file
      const tempPath = `${this.dbPath}.tmp.${Date.now()}`;
      fs.writeFileSync(tempPath, JSON.stringify(this.memoryCache, null, 2), 'utf8');
      fs.renameSync(tempPath, this.dbPath);
    } catch (err: any) {
      console.error('[PersistentDbStore] Error writing to local disk DB:', err?.message);
    }
  }

  // --- PAYMENTS ---

  public async savePayment(record: PaymentRecord): Promise<void> {
    record.updatedAt = new Date().toISOString();
    this.memoryCache.payments[record.id] = record;
    this.saveToDisk();

    if (this.firestore) {
      try {
        await this.firestore.collection('payments').doc(record.id).set(record, { merge: true });
      } catch (err: any) {
        console.error('[Firestore Error] savePayment failed:', err?.message);
      }
    }
  }

  public async getPayment(sessionId: string): Promise<PaymentRecord | null> {
    if (this.firestore) {
      try {
        const doc = await this.firestore.collection('payments').doc(sessionId).get();
        if (doc.exists) {
          return doc.data() as PaymentRecord;
        }
      } catch (err: any) {
        console.error('[Firestore Error] getPayment failed:', err?.message);
      }
    }
    return this.memoryCache.payments[sessionId] || null;
  }

  public async isPaymentValidForTarget(sessionId: string, targetUrlOrHostname: string): Promise<boolean> {
    const payment = await this.getPayment(sessionId);
    if (!payment || payment.status !== 'paid') {
      return false;
    }

    let reqHostname = targetUrlOrHostname.toLowerCase().trim();
    try {
      if (reqHostname.startsWith('http://') || reqHostname.startsWith('https://')) {
        reqHostname = new URL(reqHostname).hostname;
      }
    } catch (_e) {
      // keep raw
    }

    return payment.hostname.toLowerCase() === reqHostname || payment.targetUrl.toLowerCase() === reqHostname;
  }

  // --- MONITORING SUBSCRIPTIONS ---

  public async saveMonitoringSubscription(record: MonitoringSubscriptionRecord): Promise<void> {
    this.memoryCache.monitoring_subscriptions[record.id] = record;
    this.saveToDisk();

    if (this.firestore) {
      try {
        await this.firestore.collection('monitoring_subscriptions').doc(record.id).set(record, { merge: true });
      } catch (err: any) {
        console.error('[Firestore Error] saveMonitoringSubscription failed:', err?.message);
      }
    }
  }

  public async getMonitoringSubscription(domain: string): Promise<MonitoringSubscriptionRecord | null> {
    const normDomain = domain.toLowerCase().trim();
    if (this.firestore) {
      try {
        const doc = await this.firestore.collection('monitoring_subscriptions').doc(normDomain).get();
        if (doc.exists) {
          return doc.data() as MonitoringSubscriptionRecord;
        }
      } catch (err: any) {
        console.error('[Firestore Error] getMonitoringSubscription failed:', err?.message);
      }
    }
    return this.memoryCache.monitoring_subscriptions[normDomain] || null;
  }

  public async getAllActiveSubscriptions(): Promise<MonitoringSubscriptionRecord[]> {
    if (this.firestore) {
      try {
        const snapshot = await this.firestore
          .collection('monitoring_subscriptions')
          .where('active', '==', true)
          .get();
        return snapshot.docs.map((doc) => doc.data() as MonitoringSubscriptionRecord);
      } catch (err: any) {
        console.error('[Firestore Error] getAllActiveSubscriptions failed:', err?.message);
      }
    }

    return Object.values(this.memoryCache.monitoring_subscriptions).filter((sub) => sub.active);
  }

  // --- ANALYTICS ---

  public async recordAnalyticsEvent(event: AnalyticsEventRecord): Promise<void> {
    this.memoryCache.analytics_events.push(event);
    if (this.memoryCache.analytics_events.length > 5000) {
      this.memoryCache.analytics_events = this.memoryCache.analytics_events.slice(-5000);
    }
    this.saveToDisk();

    if (this.firestore) {
      try {
        await this.firestore.collection('analytics_events').doc(event.id).set(event);
      } catch (err: any) {
        console.error('[Firestore Error] recordAnalyticsEvent failed:', err?.message);
      }
    }
  }

  public async getAllAnalyticsEvents(): Promise<AnalyticsEventRecord[]> {
    if (this.firestore) {
      try {
        const snapshot = await this.firestore.collection('analytics_events').get();
        return snapshot.docs.map((doc) => doc.data() as AnalyticsEventRecord);
      } catch (err: any) {
        console.error('[Firestore Error] getAllAnalyticsEvents failed:', err?.message);
      }
    }
    return [...this.memoryCache.analytics_events];
  }

  // --- SCHEDULER ATOMICITY & LOCKS ---

  private localLocks: Record<string, number> = {};

  public async acquireJobLock(jobId: string, ttlMs: number): Promise<boolean> {
    const now = Date.now();
    if (!this.firestore) {
      // Fallback for local development
      if (this.localLocks[jobId] && this.localLocks[jobId] > now) return false;
      this.localLocks[jobId] = now + ttlMs;
      return true;
    }

    const docRef = this.firestore.collection('locks').doc(jobId);
    try {
      return await this.firestore.runTransaction(async (t) => {
        const doc = await t.get(docRef);
        if (doc.exists) {
          const data = doc.data();
          if (data && data.expiresAt > now) {
            return false; // Lock is currently held
          }
        }
        t.set(docRef, { expiresAt: now + ttlMs });
        return true;
      });
    } catch (err: any) {
      console.error(`[Firestore Lock Error] Failed to acquire lock ${jobId}:`, err?.message);
      return false;
    }
  }

  public async releaseJobLock(jobId: string): Promise<void> {
    if (!this.firestore) {
      delete this.localLocks[jobId];
      return;
    }
    try {
      await this.firestore.collection('locks').doc(jobId).delete();
    } catch (err: any) {
      console.error(`[Firestore Lock Error] Failed to release lock ${jobId}:`, err?.message);
    }
  }

  public async appendHistoryAtomically(domain: string, result: any): Promise<void> {
    const normDomain = domain.toLowerCase().trim();
    if (!this.firestore) {
      // Fallback: local synchronous update
      const sub = this.memoryCache.monitoring_subscriptions[normDomain];
      if (sub) {
        sub.lastScanAt = result.scanDate;
        sub.history.unshift(result);
        if (sub.history.length > 20) sub.history = sub.history.slice(0, 20);
        this.saveToDisk();
      }
      return;
    }

    const docRef = this.firestore.collection('monitoring_subscriptions').doc(normDomain);
    try {
      await this.firestore.runTransaction(async (t) => {
        const doc = await t.get(docRef);
        if (doc.exists) {
          const data = doc.data() as MonitoringSubscriptionRecord;
          const newHistory = [result, ...(data.history || [])].slice(0, 20);
          t.update(docRef, {
            lastScanAt: result.scanDate,
            history: newHistory,
          });
          
          // Update memory cache silently to keep local state somewhat synced
          if (this.memoryCache.monitoring_subscriptions[normDomain]) {
             this.memoryCache.monitoring_subscriptions[normDomain].lastScanAt = result.scanDate;
             this.memoryCache.monitoring_subscriptions[normDomain].history = newHistory;
          }
        }
      });
    } catch (err: any) {
      console.error(`[Firestore Transaction Error] appendHistoryAtomically failed for ${normDomain}:`, err?.message);
    }
  }
}

export const dbStore = new PersistentDbStore();
