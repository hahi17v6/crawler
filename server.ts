import express from "express";
import crypto from "node:crypto";
import path from "path";

import { runTechnicalCrawl } from "./server/crawler/crawlerEngine";
import { runTechnicalChecks } from "./server/checker/checksEngine";
import { diagnoseSite } from "./server/brain/diagnosisBrain";
import { generateFixPlan } from "./server/brain/fixPlanGenerator";
import {
  createCheckoutSession,
  createSubscriptionCheckoutSession,
  handleStripeWebhookEvent,
  isSessionPaid,
  markSessionAsPaid,
  cancelMonitoringSubscription,
  reactivateMonitoringSubscription,
  createCustomerPortalSession,
} from "./server/payments/stripeService";
import { monitoringStore } from "./server/monitoring/monitoringStore";
import { executeDomainWeeklyScan, initCronScheduler, runMonitoringJob } from "./server/monitoring/cronScheduler";
import { analyticsStore, AnalyticsEventType } from "./server/analytics/analyticsService";
import { runAIVisibilityAnalysis } from "./server/aiVisibility/aiVisibilityEngine";
import { analyzeRateLimiter } from "./server/crawler/rateLimiter";

const app = express();

// Initialize weekly background monitoring scheduler (no-op in production)
initCronScheduler();

// ─── Stripe Webhook (MUST use raw body parser BEFORE express.json) ───────────
  app.post(
    "/api/webhook",
    express.raw({ type: "application/json" }),
    async (req, res) => {
      const sig = req.headers["stripe-signature"] as string;
      const result = await handleStripeWebhookEvent(req.body, sig || "");

      if (!result.success) {
        return res.status(400).send("Webhook verification or processing failed.");
      }

      return res.json({ received: true, eventType: result.eventType });
    }
  );

  app.use(express.json());

  // Session Security Middleware
  app.use("/api", (req, res, next) => {
    if (req.path === "/webhook") return next(); // Webhook has no session
    if (req.path === "/cron/run-monitoring") return next(); // Cron uses its own auth

    const cookies = Object.fromEntries(
      (req.headers.cookie || "").split(";").map((c) => {
        const [key, ...v] = c.trim().split("=");
        return [key, decodeURIComponent(v.join("="))];
      })
    );

    let sessionId = cookies["crawlsignal_session"];
    if (!sessionId) {
      sessionId = crypto.randomBytes(32).toString("hex");
      const isProd = process.env.NODE_ENV === "production";
      res.cookie("crawlsignal_session", sessionId, {
        httpOnly: true,
        secure: isProd,
        sameSite: "lax",
        maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
      });
    }
    res.locals.userSessionId = sessionId;
    next();
  });

  // API Health Check
  app.get("/api/health", (_req, res) => {
    res.json({ status: "ok", service: "CrawlSignal Technical Crawler API" });
  });

  // Analytics Track Endpoint
  app.post("/api/analytics/event", (req, res) => {
    const { event, domain, email, metadata } = req.body || {};
    if (!event || typeof event !== "string") {
      return res.status(400).json({ error: "INVALID_EVENT", message: "Event name is required." });
    }

    const tracked = analyticsStore.track(event as AnalyticsEventType, domain, email, metadata);
    return res.json({ success: true, event: tracked });
  });

  // Analytics Metrics Endpoint (Internal Dashboard Data)
  app.get("/api/analytics/metrics", (_req, res) => {
    const funnel = analyticsStore.getFunnelMetrics();
    const recentEvents = analyticsStore.getEvents(50);
    return res.json({ funnel, recentEvents });
  });

  // Create Stripe Checkout Session Endpoint ($11 one-time)
  app.post("/api/create-checkout-session", async (req, res) => {
    const { url, email } = req.body || {};

    if (!url || typeof url !== "string") {
      return res.status(400).json({ error: "INVALID_URL", message: "Target URL is required." });
    }

    if (email) {
      analyticsStore.track('email_captured', url, email);
    }
    analyticsStore.track('checkout_started', url, email, { type: 'one_time_diagnosis', price: 11 });

    const host = req.get("host") || "localhost:3000";
    const protocol = req.protocol === "https" || req.headers["x-forwarded-proto"] === "https" ? "https" : "http";
    const appUrl = process.env.APP_URL || `${protocol}://${host}`;

    try {
      const checkoutResult = await createCheckoutSession({
        targetUrl: url,
        email: email || "",
        appUrl,
      });

      return res.json({
        success: true,
        checkoutUrl: checkoutResult.url,
        sessionId: checkoutResult.sessionId,
        isMock: checkoutResult.isMock,
      });
    } catch (err: any) {
      console.error("Checkout creation error:", err);
      return res.status(500).json({ error: "CHECKOUT_FAILED", message: err.message });
    }
  });

  // Verify Payment Status Endpoint
  app.get("/api/verify-session", (req, res) => {
    const sessionId = (req.query.sessionId as string) || "";
    const url = (req.query.url as string) || "";

    const paid = isSessionPaid(sessionId, url);
    if (paid) {
      analyticsStore.track('purchase_completed', url, undefined, { sessionId });
    }
    return res.json({ paid, sessionId, url });
  });

  // Technical Crawler Endpoint (Free Diagnosis)
  app.post("/api/analyze", async (req, res) => {
    const { url } = req.body || {};

    if (!url || typeof url !== "string") {
      return res.status(400).json({
        error: "INVALID_URL",
        message: "A valid URL string is required.",
      });
    }

    const clientIp = (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() || req.ip || '127.0.0.1';
    const rateCheck = await analyzeRateLimiter.checkAndAcquire(clientIp);
    if (!rateCheck.allowed) {
      return res.status(429).json({
        error: "TOO_MANY_REQUESTS",
        reason: rateCheck.reason,
        message: rateCheck.message || "Rate limit exceeded. Please wait a few moments before trying again.",
      });
    }

    analyticsStore.track('analysis_started', url);

    try {
      const crawlResult = await runTechnicalCrawl(url);
      const checksResult = runTechnicalChecks(crawlResult);
      const diagnosisResult = diagnoseSite(checksResult);

      analyticsStore.track('successful_scan', url);
      analyticsStore.track('result_viewed', url);

      return res.json({
        success: true,
        data: crawlResult,
        checks: checksResult,
        diagnosis: diagnosisResult,
      });
    } catch (err: any) {
      console.error("Crawl error:", err);
      analyticsStore.track('failed_scan', url, undefined, { error: err.message });
      return res.status(400).json({
        error: "CRAWL_FAILED",
        message: err.message || "Failed to analyze target website.",
      });
    } finally {
      await analyzeRateLimiter.release(clientIp).catch(e => console.warn(e));
    }
  });

  // Full Website Visibility Diagnosis Endpoint ($11 Full Fix Plan)
  app.post("/api/full-diagnosis", async (req, res) => {
    const { url, forceUnlock } = req.body || {};
    const sessionId = res.locals.userSessionId;

    if (!url || typeof url !== "string") {
      return res.status(400).json({ error: "INVALID_URL", message: "Target URL is required." });
    }

    // Verify payment source of truth (forceUnlock only allowed in non-production)
    const isDev = process.env.NODE_ENV !== 'production';
    const paid = (await isSessionPaid(sessionId, url)) || (isDev && Boolean(forceUnlock));

    try {
      const crawlResult = await runTechnicalCrawl(url);
      const checksResult = runTechnicalChecks(crawlResult);
      const fixPlanReport = paid ? generateFixPlan(crawlResult, checksResult) : null;

      analyticsStore.track('report_opened', url, undefined, { paid });
      if (paid) {
        analyticsStore.track('purchase_completed', url, undefined, { sessionId, type: 'one_time' });
      }

      return res.json({
        success: true,
        paidConfirmed: paid,
        report: fixPlanReport,
        message: paid
          ? "Full Website Visibility Diagnosis unlocked."
          : "Payment required ($11) to unlock Full Website Visibility Diagnosis.",
      });
    } catch (err: any) {
      console.error("Full diagnosis error:", err);
      return res.status(400).json({
        error: "DIAGNOSIS_FAILED",
        message: err.message || "Failed to generate Full Website Visibility Diagnosis report.",
      });
    }
  });

  // ─── Monitoring Cron Endpoint (Vercel uses GET, Cloud Scheduler uses POST) ──
  app.all("/api/cron/run-monitoring", async (req, res) => {
    // Both Vercel Cron and Cloud Scheduler triggers use Authorization headers or specific internal mechanisms
    // but the actual runMonitoringJob handles its own queue safely.
    const cronSecret = process.env.CRON_SECRET;
    const authHeader = req.headers.authorization;
    const reqSecret = authHeader?.startsWith('Bearer ')
      ? authHeader.substring(7)
      : (req.headers['x-cron-secret'] as string) || (req.query.secret as string);

    if (cronSecret && reqSecret !== cronSecret) {
      return res.status(401).json({ error: "UNAUTHORIZED", message: "Invalid or missing cron authorization." });
    }

    try {
      const result = await runMonitoringJob();
      return res.json({ success: true, ...result });
    } catch (err: any) {
      console.error("Cron monitoring execution error:", err);
      return res.status(500).json({ error: "CRON_JOB_FAILED", message: err.message });
    }
  });

  // Recurring Monitoring ($25/month) - Stripe Checkout Session
  app.post("/api/monitoring/create-subscription-session", async (req, res) => {
    const { url, email } = req.body || {};
    const authSessionId = res.locals.userSessionId;

    if (!url || typeof url !== "string") {
      return res.status(400).json({ error: "INVALID_URL", message: "Target URL is required." });
    }

    if (email) {
      analyticsStore.track('email_captured', url, email);
    }
    analyticsStore.track('checkout_started', url, email, { type: 'recurring_monitoring', price: 25 });

    const host = req.get("host") || "localhost:3000";
    const protocol = req.protocol === "https" || req.headers["x-forwarded-proto"] === "https" ? "https" : "http";
    const appUrl = process.env.APP_URL || `${protocol}://${host}`;

    try {
      const checkoutResult = await createSubscriptionCheckoutSession({
        targetUrl: url,
        email: email || "",
        appUrl,
        userSessionId: authSessionId,
      });

      return res.json({
        success: true,
        checkoutUrl: checkoutResult.url,
        sessionId: checkoutResult.sessionId,
        isMock: checkoutResult.isMock,
      });
    } catch (err: any) {
      console.error("Monitoring subscription checkout error:", err);
      return res.status(500).json({ error: "SUBSCRIPTION_CHECKOUT_FAILED", message: err.message });
    }
  });

  // Activate / Subscribe domain to recurring monitoring
  app.post("/api/monitoring/subscribe", async (req, res) => {
    const { url, email } = req.body || {};
    const authSessionId = res.locals.userSessionId;

    if (!url || typeof url !== "string") {
      return res.status(400).json({ error: "INVALID_URL", message: "Target URL is required." });
    }

    try {
      const sub = await monitoringStore.subscribeDomain(url, email || "", { userSessionId: authSessionId });
      if (email) {
        analyticsStore.track('email_captured', url, email);
      }
      analyticsStore.track('monitoring_started', url, email);

      // Run initial baseline scan
      const initialComparison = await executeDomainWeeklyScan(url);

      return res.json({
        success: true,
        subscription: sub,
        latestScan: initialComparison,
      });
    } catch (err: any) {
      console.error("Monitoring subscribe error:", err);
      return res.status(500).json({ error: "SUBSCRIBE_FAILED", message: err.message });
    }
  });

  // Get monitoring status & history for domain
  app.get("/api/monitoring/status", async (req, res) => {
    const url = (req.query.url as string) || "";

    if (!url) {
      return res.status(400).json({ error: "INVALID_URL", message: "Target URL parameter is required." });
    }

    const isSub = await monitoringStore.isSubscribed(url);
    const sub = await monitoringStore.getSubscription(url);
    const history = await monitoringStore.getHistory(url);

    return res.json({
      subscribed: isSub,
      subscription: sub,
      history,
    });
  });

  // Run weekly monitoring scan manually (on demand)
  app.post("/api/monitoring/run-scan", async (req, res) => {
    const { url, gscData } = req.body || {};

    if (!url || typeof url !== "string") {
      return res.status(400).json({ error: "INVALID_URL", message: "Target URL is required." });
    }

    try {
      const comparisonResult = await executeDomainWeeklyScan(url, gscData);
      const history = await monitoringStore.getHistory(url);
      return res.json({
        success: true,
        comparison: comparisonResult,
        history,
      });
    } catch (err: any) {
      console.error("Manual scan execution error:", err);
      return res.status(500).json({ error: "SCAN_EXECUTION_FAILED", message: err.message });
    }
  });

  // Cancel subscription (cancel at period end)
  app.post("/api/monitoring/cancel-subscription", async (req, res) => {
    const { url } = req.body || {};
    const authSessionId = res.locals.userSessionId;

    if (!url || typeof url !== "string") {
      return res.status(400).json({ error: "INVALID_URL", message: "Target URL is required." });
    }

    if (!authSessionId) {
      return res.status(401).json({ error: "UNAUTHORIZED", message: "Authentication session required to cancel subscription." });
    }

    try {
      const result = await cancelMonitoringSubscription(url, authSessionId);
      if (!result.success) {
        return res.status(result.status || 400).json({ error: "CANCELLATION_FAILED", message: result.message });
      }
      return res.json({ success: true, subscription: result.subscription });
    } catch (err: any) {
      console.error("Cancel subscription error:", err);
      return res.status(500).json({ error: "CANCEL_FAILED", message: err.message });
    }
  });

  // Reactivate subscription before period end
  app.post("/api/monitoring/reactivate-subscription", async (req, res) => {
    const { url } = req.body || {};
    const authSessionId = res.locals.userSessionId;

    if (!url || typeof url !== "string") {
      return res.status(400).json({ error: "INVALID_URL", message: "Target URL is required." });
    }

    if (!authSessionId) {
      return res.status(401).json({ error: "UNAUTHORIZED", message: "Authentication session required to reactivate subscription." });
    }

    try {
      const result = await reactivateMonitoringSubscription(url, authSessionId);
      if (!result.success) {
        return res.status(result.status || 400).json({ error: "REACTIVATION_FAILED", message: result.message });
      }
      return res.json({ success: true, subscription: result.subscription });
    } catch (err: any) {
      console.error("Reactivate subscription error:", err);
      return res.status(500).json({ error: "REACTIVATE_FAILED", message: err.message });
    }
  });

  // Create Stripe Customer Portal session
  app.post("/api/monitoring/customer-portal", async (req, res) => {
    const { url, returnUrl } = req.body || {};
    const authSessionId = res.locals.userSessionId;

    if (!url || typeof url !== "string") {
      return res.status(400).json({ error: "INVALID_URL", message: "Target URL is required." });
    }

    if (!authSessionId) {
      return res.status(401).json({ error: "UNAUTHORIZED", message: "Authentication session required to open customer portal." });
    }

    try {
      const appOrigin = returnUrl || `${req.protocol}://${req.get("host")}`;
      const result = await createCustomerPortalSession(url, appOrigin, authSessionId);
      if (!result.success) {
        return res.status(result.status || 400).json({ error: "PORTAL_FAILED", message: result.message });
      }
      return res.json({ success: true, url: result.url });
    } catch (err: any) {
      console.error("Customer portal session error:", err);
      return res.status(500).json({ error: "PORTAL_FAILED", message: err.message });
    }
  });

  // Decoupled Experimental AI Visibility Analysis Endpoint
  app.post("/api/ai-visibility/analyze", async (req, res) => {
    const { url, brandName } = req.body || {};

    if (!url || typeof url !== "string") {
      return res.status(400).json({ error: "INVALID_URL", message: "Target URL is required." });
    }

    try {
      analyticsStore.track('analysis_started', url, undefined, { feature: 'ai_visibility' });
      const result = await runAIVisibilityAnalysis(url, brandName);
      return res.json({ success: true, data: result });
    } catch (err: any) {
      console.error("AI Visibility evaluation error:", err);
      return res.status(500).json({ error: "AI_VISIBILITY_EVALUATION_FAILED", message: err.message });
    }
  });

// ─── Export for Vercel Functions ──────────────────────────────────────────────
// Vercel imports this module and calls the exported handler directly.
// app.listen() is only called in local development.
export default app;

// ─── Local Development Server ─────────────────────────────────────────────────
if (process.env.NODE_ENV !== "production" && !process.env.VERCEL) {
  const PORT = 3000;
  (async () => {
    try {
      // Dynamically import Vite only in local dev to avoid bundling it for production
      const { createServer: createViteServer } = await import("vite");
      const vite = await createViteServer({
        server: { middlewareMode: true },
        appType: "spa",
      });
      app.use(vite.middlewares);
    } catch (e) {
      console.warn("[Dev] Vite middleware not available:", e);
    }

    app.listen(PORT, "0.0.0.0", () => {
      console.log(`[Website Visibility] Server active at http://0.0.0.0:${PORT}`);
    });
  })();
}
