import React, { useState, useEffect } from 'react';
import { Activity, Bell, Calendar, CheckCircle, Clock, Loader2, Mail, RefreshCw, ShieldAlert, ArrowRight, Lock, ExternalLink, AlertTriangle } from 'lucide-react';
import { SupportedLanguage } from '../types';
import { translations } from '../i18n/translations';

interface MonitoringDashboardProps {
  currentLang: SupportedLanguage;
  initialUrl?: string;
}

export const MonitoringDashboard: React.FC<MonitoringDashboardProps> = ({
  currentLang,
  initialUrl = '',
}) => {
  const t = translations[currentLang] || translations.en;
  const m = t.monitoring;

  const [url, setUrl] = useState(initialUrl);
  const [email, setEmail] = useState('');
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [subscription, setSubscription] = useState<any | null>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [scanning, setScanning] = useState(false);

  const [cancelingSub, setCancelingSub] = useState(false);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [restartForm, setRestartForm] = useState(false);

  useEffect(() => {
    if (initialUrl) {
      setUrl(initialUrl);
      checkMonitoringStatus(initialUrl);
    }

    const params = new URLSearchParams(window.location.search);
    const monitoringSub = params.get('monitoring_subscribed');
    const targetUrl = params.get('url');

    if (monitoringSub === 'true' && targetUrl) {
      setUrl(targetUrl);
      activateSubscription(targetUrl);
    }
  }, [initialUrl]);

  const checkMonitoringStatus = async (targetDomain: string) => {
    if (!targetDomain) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/monitoring/status?url=${encodeURIComponent(targetDomain)}`);
      const data = await res.json();
      if (data.subscribed) {
        setIsSubscribed(true);
        setSubscription(data.subscription);
        setHistory(data.history || []);
      }
    } catch (err) {
      console.error('Failed to check monitoring status:', err);
    } finally {
      setLoading(false);
    }
  };

  const activateSubscription = async (targetDomain: string) => {
    setLoading(true);
    try {
      const res = await fetch('/api/monitoring/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: targetDomain, email }),
      });
      const data = await res.json();
      if (data.success) {
        setIsSubscribed(true);
        setSubscription(data.subscription);
        if (data.latestScan) {
          setHistory([data.latestScan]);
        }
      }
    } catch (err) {
      console.error('Failed to activate monitoring subscription:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleStartStripeSubscription = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url || !email) return;

    setSubmitting(true);
    try {
      const res = await fetch('/api/monitoring/create-subscription-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url, email }),
      });
      const data = await res.json();

      if (data.success) {
        if (data.checkoutUrl) {
          window.location.href = data.checkoutUrl;
        } else {
          activateSubscription(url);
        }
      } else {
        alert('Subscription error: ' + (data.message || 'Failed to initiate Stripe Subscription.'));
      }
    } catch (err) {
      console.error('Subscription creation error:', err);
      activateSubscription(url);
    } finally {
      setSubmitting(false);
    }
  };


  // Format a date string respecting the active language locale
  const formatDate = (iso: string | null | undefined): string => {
    if (!iso) return '';
    const localeMap: Record<string, string> = { en: 'en-US', fr: 'fr-FR', es: 'es-ES' };
    return new Date(iso).toLocaleDateString(localeMap[currentLang] || 'en-US', {
      year: 'numeric', month: 'long', day: 'numeric',
    });
  };

  // Open confirmation dialog instead of calling API directly
  const handleRequestCancel = () => setShowCancelConfirm(true);

  const handleConfirmCancel = async () => {
    if (!url) return;
    setShowCancelConfirm(false);
    setCancelingSub(true);
    try {
      const res = await fetch('/api/monitoring/cancel-subscription', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url }),
      });
      const data = await res.json();
      if (data.success && data.subscription) {
        setSubscription(data.subscription);
      } else {
        alert(data.message || 'Failed to cancel subscription.');
      }
    } catch (err) {
      console.error('Error canceling subscription:', err);
    } finally {
      setCancelingSub(false);
    }
  };

  const handleCancelSubscription = handleRequestCancel;

  const handleReactivateSubscription = async () => {
    if (!url) return;
    setCancelingSub(true);
    try {
      const res = await fetch('/api/monitoring/reactivate-subscription', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url }),
      });
      const data = await res.json();
      if (data.success && data.subscription) {
        setSubscription(data.subscription);
      } else {
        alert(data.message || 'Failed to reactivate subscription.');
      }
    } catch (err) {
      console.error('Error reactivating subscription:', err);
    } finally {
      setCancelingSub(false);
    }
  };

  const handleOpenCustomerPortal = async () => {
    if (!url) return;
    try {
      const res = await fetch('/api/monitoring/customer-portal', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url, returnUrl: window.location.href }),
      });
      const data = await res.json();
      if (data.success && data.url) {
        window.location.href = data.url;
      } else {
        alert(data.message || 'Failed to open Customer Portal.');
      }
    } catch (err) {
      console.error('Error launching customer portal:', err);
    }
  };

  const handleTriggerManualScan = async () => {
    if (!url) return;
    setScanning(true);
    try {
      const res = await fetch('/api/monitoring/run-scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url }),
      });
      const data = await res.json();
      if (data.success && data.history) {
        setHistory(data.history);
      }
    } catch (err) {
      console.error('Failed to run manual weekly scan:', err);
    } finally {
      setScanning(false);
    }
  };

  const latestScan = history.length > 0 ? history[0] : null;
  const latestAlerts = latestScan?.alerts || [];

  // Determine next billing date info
  const isCanceled = subscription?.status === 'canceled';
  const isTrialing = subscription?.status === 'trialing';
  const periodEndDate = subscription?.currentPeriodEnd ? formatDate(subscription.currentPeriodEnd) : null;
  const trialEndDate = subscription?.trialEnd ? formatDate(subscription.trialEnd) : null;


  return (
    <section className="py-16 px-4 bg-slate-950/60 border-t border-slate-900" id="recurring-monitoring">
      <div className="max-w-5xl mx-auto space-y-8">
        {/* Header Title Section */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded bg-zinc-900 border border-zinc-800 text-emerald-400 text-xs font-mono">
            <Activity className="w-3.5 h-3.5" />
            <span>{m.badge}</span>
            <span className="bg-emerald-500 text-zinc-950 px-1.5 py-0.2 rounded text-[10px] font-bold">{m.price}</span>
          </div>
          <h2 className="text-xl sm:text-3xl font-extrabold text-white tracking-tight">
            {m.title}
          </h2>
          <p className="text-xs sm:text-sm text-zinc-400 max-w-2xl mx-auto leading-relaxed">
            {m.subtitle}
          </p>
        </div>

        {/* SUBSCRIPTION CARD (IF NOT SUBSCRIBED) */}
        {!isSubscribed ? (
          <div className="tech-card rounded-2xl p-6 sm:p-8 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-800/80 pb-5">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    <Bell className="w-4 h-4 text-emerald-400" />
                    {m.subscribeTitle}
                  </h3>
                  <span className="px-2 py-0.5 rounded bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-[10px] font-mono font-bold uppercase tracking-wider">
                    {m.trialBadge}
                  </span>
                </div>
                <p className="text-xs text-zinc-400">
                  {m.subscribeSubtitle} — <span className="text-emerald-400 font-mono">{m.trialText}</span>
                </p>
              </div>
              <div className="text-right">
                <span className="text-2xl font-bold font-mono text-white">$25</span>
                <span className="text-xs text-zinc-500 font-mono block">/ {m.perMonth}</span>
              </div>
            </div>

            <form onSubmit={handleStartStripeSubscription} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-mono uppercase text-zinc-400 mb-1">
                    {m.urlLabel}
                  </label>
                  <input
                    type="url"
                    required
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    placeholder="https://example.com"
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-xs text-zinc-100 font-mono placeholder-zinc-600 focus:outline-none focus:border-emerald-500/80 transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-mono uppercase text-zinc-400 mb-1">
                    {m.emailLabel}
                  </label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="alert@yourdomain.com"
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-xs text-zinc-100 font-mono placeholder-zinc-600 focus:outline-none focus:border-emerald-500/80 transition-colors"
                  />
                </div>
              </div>

              <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-4">
                <ul className="text-xs text-zinc-400 space-y-1 font-mono text-[11px]">
                  <li className="flex items-center gap-1.5 text-zinc-300">
                    <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
                    {m.feature1}
                  </li>
                  <li className="flex items-center gap-1.5 text-zinc-300">
                    <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
                    {m.feature2}
                  </li>
                </ul>

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full sm:w-auto px-5 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-bold text-xs rounded-lg transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 shrink-0"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin text-zinc-950" />
                      <span>{m.redirecting}</span>
                    </>
                  ) : (
                    <>
                      <span>{m.startCta}</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        ) : (
          /* SUBSCRIBED DASHBOARD */
          <div className="space-y-6">

            {/* ── CANCELLATION CONFIRMATION DIALOG ── */}
            {showCancelConfirm && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm px-4" data-testid="cancel-confirm-dialog">
                <div className="bg-slate-900 border border-slate-700 rounded-2xl p-6 max-w-md w-full space-y-4 shadow-2xl">
                  <div className="flex items-center gap-3">
                    <span className="flex h-9 w-9 items-center justify-center rounded-full bg-rose-950 border border-rose-800 shrink-0">
                      <AlertTriangle className="w-4 h-4 text-rose-400" />
                    </span>
                    <h3 className="text-base font-bold text-white">{m.cancelConfirmTitle}</h3>
                  </div>

                  <p className="text-xs text-zinc-300 leading-relaxed">{m.cancelConfirmBody}</p>

                  {periodEndDate && (
                    <div className="bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 space-y-1">
                      <p className="text-xs font-mono text-zinc-400">
                        {m.cancelConfirmDate.replace('{date}', periodEndDate)}
                      </p>
                      <p className="text-xs font-mono text-zinc-500">{m.cancelConfirmNoCharge}</p>
                    </div>
                  )}

                  <div className="flex flex-col sm:flex-row gap-2 pt-1">
                    <button
                      onClick={handleConfirmCancel}
                      disabled={cancelingSub}
                      data-testid="cancel-confirm-btn"
                      className="flex-1 px-4 py-2 bg-rose-700 hover:bg-rose-600 text-white text-xs font-bold rounded-lg transition-colors cursor-pointer disabled:opacity-50"
                    >
                      {cancelingSub ? m.canceling : m.cancelConfirmBtn}
                    </button>
                    <button
                      onClick={() => setShowCancelConfirm(false)}
                      data-testid="cancel-keep-btn"
                      className="flex-1 px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-bold rounded-lg transition-colors cursor-pointer border border-zinc-700"
                    >
                      {m.cancelKeepBtn}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* ── CANCELED STATE ── */}
            {isCanceled ? (
              <div className="tech-card rounded-xl p-6 space-y-4 border border-slate-700/60">
                <div className="flex items-start gap-3">
                  <span className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-800 border border-slate-700 shrink-0 mt-0.5">
                    <Lock className="w-4 h-4 text-slate-400" />
                  </span>
                  <div>
                    <h3 className="text-base font-bold text-slate-300">{m.statusCanceledTitle}</h3>
                    <p className="text-xs text-zinc-400 mt-1 leading-relaxed">{m.statusCanceledBody}</p>
                  </div>
                </div>
                <button
                  onClick={() => { setIsSubscribed(false); setSubscription(null); setHistory([]); }}
                  data-testid="restart-monitoring-btn"
                  className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-zinc-950 text-xs font-bold rounded-lg transition-colors cursor-pointer"
                >
                  {m.restartMonitoringBtn}
                </button>
              </div>
            ) : (
              /* ACTIVE / TRIALING / PAST_DUE / UNPAID BANNER */
              <div className="tech-card rounded-xl p-5 flex flex-col space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                  <div className="space-y-2 min-w-0">
                    {/* Status badge row */}
                    <div className="flex items-center gap-2 flex-wrap">
                      {subscription?.status === 'trialing' ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-mono font-bold">
                          <Clock className="w-3.5 h-3.5" />
                          {m.statusTrialing}
                        </span>
                      ) : subscription?.status === 'past_due' ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-mono font-bold">
                          <AlertTriangle className="w-3.5 h-3.5" />
                          {m.statusPastDue}
                        </span>
                      ) : subscription?.status === 'unpaid' ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-mono font-bold">
                          <AlertTriangle className="w-3.5 h-3.5" />
                          {m.statusUnpaid}
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-mono font-bold">
                          <span className="flex h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                          {m.statusActive}
                        </span>
                      )}

                      {subscription?.trialEnd && subscription?.status === 'trialing' && (
                        <span className="text-xs font-mono text-zinc-400">
                          ({m.trialDaysRemaining.replace(
                            '{days}',
                            Math.max(
                              0,
                              Math.ceil(
                                (new Date(subscription.trialEnd).getTime() - Date.now()) /
                                  (1000 * 60 * 60 * 24)
                              )
                            ).toString()
                          )})
                        </span>
                      )}
                    </div>

                    <h3 className="text-base font-bold text-white font-mono">{url}</h3>
                    <p className="text-xs text-zinc-400">
                      {m.lastScan}:{' '}
                      <span className="text-zinc-200 font-mono">
                        {subscription?.lastScanAt
                          ? new Date(subscription.lastScanAt).toLocaleString()
                          : m.pending}
                      </span>
                    </p>

                    {/* ── NEXT PAYMENT INFO ── */}
                    {isTrialing && trialEndDate && (
                      <div data-testid="trial-billing-info" className="mt-2 bg-amber-950/30 border border-amber-800/40 rounded-xl px-3 py-2 space-y-0.5">
                        <p className="text-[10px] font-mono uppercase text-amber-400/80 tracking-wider">{m.trialEndsLabel}</p>
                        <p className="text-sm font-bold text-amber-300 font-mono">{trialEndDate}</p>
                        {periodEndDate && trialEndDate !== periodEndDate && (
                          <p className="text-[11px] text-zinc-400 font-mono">
                            {m.firstPaymentLabel}: {periodEndDate} — {m.nextPaymentAmount.replace('{amount}', '25')}
                          </p>
                        )}
                        {!periodEndDate && (
                          <p className="text-[11px] text-zinc-400 font-mono">
                            {m.firstPaymentLabel}: {trialEndDate} — {m.nextPaymentAmount.replace('{amount}', '25')}
                          </p>
                        )}
                      </div>
                    )}

                    {!isTrialing && periodEndDate && !subscription?.cancelAtPeriodEnd && (
                      <div data-testid="next-payment-info" className="mt-2 bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 space-y-0.5">
                        <p className="text-[10px] font-mono uppercase text-zinc-500 tracking-wider">{m.nextPaymentLabel}</p>
                        <p className="text-sm font-bold text-zinc-200 font-mono">{periodEndDate}</p>
                        <p className="text-[11px] text-zinc-500 font-mono">{m.nextPaymentAmount.replace('{amount}', '25')}</p>
                      </div>
                    )}

                    {/* ── PAYMENT FAILURE GUIDANCE ── */}
                    {(subscription?.status === 'past_due' || subscription?.status === 'unpaid') && (
                      <div data-testid="payment-failed-guidance" className="mt-2 bg-rose-950/30 border border-rose-800/50 rounded-xl px-3 py-2">
                        <p className="text-[11px] text-rose-300 font-mono leading-relaxed">{m.paymentFailedAction}</p>
                      </div>
                    )}

                    {/* ── CANCEL SCHEDULED NOTICE ── */}
                    {subscription?.cancelAtPeriodEnd && (
                      <div className="mt-2 text-xs text-amber-300/90 bg-amber-950/40 border border-amber-800/40 px-3 py-1.5 rounded-lg font-mono">
                        {m.cancelScheduled.replace(
                          '{date}',
                          periodEndDate || 'the end of period'
                        )}
                      </div>
                    )}
                  </div>

                  {/* Action buttons */}
                  <div className="flex flex-wrap sm:flex-col items-start gap-2 shrink-0">
                    <button
                      onClick={handleTriggerManualScan}
                      disabled={scanning}
                      className="px-3.5 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-zinc-950 text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                    >
                      {scanning ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin text-zinc-950" />
                      ) : (
                        <RefreshCw className="w-3.5 h-3.5" />
                      )}
                      <span>{m.runScanNow}</span>
                    </button>

                    <button
                      onClick={handleOpenCustomerPortal}
                      className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-mono rounded-lg transition-colors border border-zinc-700 cursor-pointer"
                    >
                      {m.manageBillingBtn}
                    </button>

                    {subscription?.cancelAtPeriodEnd ? (
                      <button
                        onClick={handleReactivateSubscription}
                        disabled={cancelingSub}
                        data-testid="reactivate-btn"
                        className="px-3 py-1.5 bg-emerald-950/80 hover:bg-emerald-900 border border-emerald-700/60 text-emerald-300 text-xs font-mono rounded-lg transition-colors cursor-pointer disabled:opacity-50"
                      >
                        {cancelingSub ? m.canceling : m.reactivateBtn}
                      </button>
                    ) : (
                      <button
                        onClick={handleCancelSubscription}
                        disabled={cancelingSub}
                        data-testid="cancel-btn"
                        className="px-3 py-1.5 bg-zinc-900 hover:bg-rose-950/50 border border-zinc-800 hover:border-rose-800/60 text-zinc-400 hover:text-rose-300 text-xs font-mono rounded-lg transition-colors cursor-pointer disabled:opacity-50"
                      >
                        {cancelingSub ? m.canceling : m.cancelBtn}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* LATEST IMPORTANT ALERTS SECTION */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
                  <ShieldAlert className="w-4 h-4 text-amber-400" />
                  {m.alertsTitle} ({latestAlerts.length})
                </h3>
              </div>

              {latestAlerts.length > 0 ? (
                <div className="space-y-4">
                  {latestAlerts.map((alert: any) => (
                    <div
                      key={alert.id}
                      className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 text-xs space-y-3 shadow-lg"
                    >
                      <div className="flex items-center justify-between border-b border-slate-800/80 pb-2.5">
                        <h4 className="text-sm font-bold text-rose-300 flex items-center gap-2">
                          {alert.header}
                        </h4>
                      </div>

                      <div className="grid grid-cols-1 gap-2.5 leading-relaxed text-[11px]">
                        <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
                          <strong className="text-slate-400 uppercase text-[9px] tracking-wider block mb-0.5">
                            {m.whatChanged}
                          </strong>
                          <span className="text-slate-200 font-mono">{alert.whatChanged}</span>
                        </div>

                        <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
                          <strong className="text-amber-400 uppercase text-[9px] tracking-wider block mb-0.5">
                            {m.whyItMatters}
                          </strong>
                          <span className="text-slate-300">{alert.whyItMatters}</span>
                        </div>

                        <div className="bg-emerald-950/30 p-3 rounded-xl border border-emerald-800/60">
                          <strong className="text-emerald-400 uppercase text-[9px] tracking-wider block mb-0.5">
                            {m.whatToDo}
                          </strong>
                          <span className="text-emerald-200 font-medium">{alert.whatToDo}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="bg-emerald-950/20 border border-emerald-800/60 rounded-2xl p-6 text-center text-xs text-emerald-300">
                  <CheckCircle className="w-6 h-6 text-emerald-400 mx-auto mb-2" />
                  {m.noAlerts}
                </div>
              )}
            </div>

            {/* SCAN HISTORY TIMELINE */}
            <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
                <Clock className="w-4 h-4 text-indigo-400" />
                {m.historyTitle} ({history.length})
              </h3>

              {history.length > 0 ? (
                <div className="space-y-2">
                  {history.map((scan: any, idx: number) => (
                    <div
                      key={scan.snapshot?.id || idx}
                      className="bg-slate-950 border border-slate-800/80 rounded-xl p-3 flex items-center justify-between text-xs font-mono"
                    >
                      <div className="flex items-center space-x-3">
                        <Calendar className="w-4 h-4 text-slate-500 shrink-0" />
                        <div>
                          <span className="text-slate-200 font-semibold block">
                            {new Date(scan.scanDate).toLocaleDateString(undefined, {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                          <span className="text-[10px] text-slate-500">
                            {scan.snapshot?.discoveredPagesCount || 0} {m.sampledPages} • {scan.snapshot?.sitemapUrlCount || 0} {m.sitemapUrls}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center space-x-2">
                        {scan.alerts?.length > 0 ? (
                          <span className="px-2 py-0.5 bg-rose-950 text-rose-300 border border-rose-800 rounded text-[10px] font-bold">
                            {scan.alerts.length} {scan.alerts.length === 1 ? m.alertCountOne : m.alertsCount}
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 bg-emerald-950 text-emerald-300 border border-emerald-800 rounded text-[10px] font-bold">
                            {m.clean}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-slate-500 text-xs text-center py-4">
                  {m.noHistory}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </section>
  );
};
