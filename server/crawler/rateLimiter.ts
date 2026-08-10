import { dbStore } from '../db/store';

export interface RateLimiterOptions {
  windowMs?: number; // Time window in ms (default 15 mins)
  maxPerWindow?: number; // Max requests per window per IP (default 10)
  maxConcurrentPerIp?: number; // Max active concurrent scans per IP (default 2)
  maxConcurrentGlobal?: number; // Max active concurrent scans globally (default 8)
}

interface IpState {
  timestamps: number[];
  activeCount: number;
}

export class AnalyzeRateLimiter {
  private windowMs: number;
  private maxPerWindow: number;
  private maxConcurrentPerIp: number;
  private maxConcurrentGlobal: number;

  private ipStates = new Map<string, IpState>();
  private globalActiveCount = 0;

  constructor(options: RateLimiterOptions = {}) {
    this.windowMs = options.windowMs ?? 15 * 60 * 1000;
    this.maxPerWindow = options.maxPerWindow ?? 10;
    this.maxConcurrentPerIp = options.maxConcurrentPerIp ?? 2;
    this.maxConcurrentGlobal = options.maxConcurrentGlobal ?? 8;
  }

  private cleanupOldTimestamps(timestamps: number[], now: number) {
    return timestamps.filter((ts) => now - ts < this.windowMs);
  }

  public async checkAndAcquire(ip: string): Promise<{ allowed: boolean; reason?: 'WINDOW_LIMIT' | 'CONCURRENT_IP_LIMIT' | 'CONCURRENT_GLOBAL_LIMIT'; message?: string }> {
    const fs = dbStore.getFirestore();
    const now = Date.now();

    if (fs) {
      // Distributed Firestore implementation
      try {
        const globalRef = fs.collection('rate_limits').doc('_global_');
        const ipRef = fs.collection('rate_limits').doc(ip);

        return await fs.runTransaction(async (t) => {
          const globalDoc = await t.get(globalRef);
          const ipDoc = await t.get(ipRef);

          let globalActive = globalDoc.exists ? globalDoc.data()?.activeCount || 0 : 0;
          let ipTimestamps = ipDoc.exists ? ipDoc.data()?.timestamps || [] : [];
          let ipActive = ipDoc.exists ? ipDoc.data()?.activeCount || 0 : 0;

          // Cleanup
          ipTimestamps = this.cleanupOldTimestamps(ipTimestamps, now);

          if (ipTimestamps.length >= this.maxPerWindow) {
             t.set(ipRef, { timestamps: ipTimestamps, activeCount: ipActive }, { merge: true });
             return { allowed: false, reason: 'WINDOW_LIMIT', message: `Too many requests from this IP. Limit is ${this.maxPerWindow} per 15 minutes.` };
          }
          if (ipActive >= this.maxConcurrentPerIp) {
             return { allowed: false, reason: 'CONCURRENT_IP_LIMIT', message: `Maximum concurrent active crawls (${this.maxConcurrentPerIp}) reached for your IP.` };
          }
          if (globalActive >= this.maxConcurrentGlobal) {
             return { allowed: false, reason: 'CONCURRENT_GLOBAL_LIMIT', message: 'System is currently processing maximum concurrent crawls. Please try again shortly.' };
          }

          // Acquire
          ipTimestamps.push(now);
          t.set(globalRef, { activeCount: globalActive + 1 }, { merge: true });
          t.set(ipRef, { timestamps: ipTimestamps, activeCount: ipActive + 1 }, { merge: true });

          return { allowed: true };
        });
      } catch (err: any) {
        console.warn(`[RateLimiter] Firestore error: ${err?.message}. Failing open.`);
        return { allowed: true };
      }
    } else {
      // Local fallback implementation
      let state = this.ipStates.get(ip);
      if (!state) {
        state = { timestamps: [], activeCount: 0 };
        this.ipStates.set(ip, state);
      }
      
      state.timestamps = this.cleanupOldTimestamps(state.timestamps, now);

      if (state.timestamps.length >= this.maxPerWindow) {
        return { allowed: false, reason: 'WINDOW_LIMIT', message: `Too many requests from this IP. Limit is ${this.maxPerWindow} per 15 minutes.` };
      }
      if (state.activeCount >= this.maxConcurrentPerIp) {
        return { allowed: false, reason: 'CONCURRENT_IP_LIMIT', message: `Maximum concurrent active crawls (${this.maxConcurrentPerIp}) reached for your IP.` };
      }
      if (this.globalActiveCount >= this.maxConcurrentGlobal) {
        return { allowed: false, reason: 'CONCURRENT_GLOBAL_LIMIT', message: 'System is currently processing maximum concurrent crawls. Please try again shortly.' };
      }

      state.timestamps.push(now);
      state.activeCount += 1;
      this.globalActiveCount += 1;
      return { allowed: true };
    }
  }

  public async release(ip: string): Promise<void> {
    const fs = dbStore.getFirestore();
    if (fs) {
      try {
        const globalRef = fs.collection('rate_limits').doc('_global_');
        const ipRef = fs.collection('rate_limits').doc(ip);

        await fs.runTransaction(async (t) => {
          const globalDoc = await t.get(globalRef);
          const ipDoc = await t.get(ipRef);

          let globalActive = globalDoc.exists ? globalDoc.data()?.activeCount || 0 : 0;
          let ipActive = ipDoc.exists ? ipDoc.data()?.activeCount || 0 : 0;
          let ipTimestamps = ipDoc.exists ? ipDoc.data()?.timestamps || [] : [];

          if (globalActive > 0) {
            t.set(globalRef, { activeCount: globalActive - 1 }, { merge: true });
          }
          if (ipActive > 0) {
            t.set(ipRef, { timestamps: ipTimestamps, activeCount: ipActive - 1 }, { merge: true });
          }
        });
      } catch (err) {
        console.warn(`[RateLimiter] Release error:`, err);
      }
    } else {
      const state = this.ipStates.get(ip);
      if (state) {
        state.activeCount = Math.max(0, state.activeCount - 1);
      }
      this.globalActiveCount = Math.max(0, this.globalActiveCount - 1);
    }
  }

  public reset(): void {
    this.ipStates.clear();
    this.globalActiveCount = 0;
  }
}

export const analyzeRateLimiter = new AnalyzeRateLimiter();
