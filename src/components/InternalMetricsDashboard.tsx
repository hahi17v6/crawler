import React, { useState, useEffect } from 'react';
import { BarChart3, TrendingUp, Users, CheckCircle2, AlertTriangle, ShoppingCart, FileText, Activity, RefreshCw, Layers } from 'lucide-react';
import { SupportedLanguage } from '../types';
import { translations } from '../i18n/translations';

interface InternalMetricsDashboardProps {
  currentLang?: SupportedLanguage;
}

export const InternalMetricsDashboard: React.FC<InternalMetricsDashboardProps> = ({ currentLang = 'en' }) => {
  const activeLang: SupportedLanguage = (currentLang as SupportedLanguage) || 'en';
  const fullT = translations[activeLang] || translations.en;
  const im = fullT.internalMetrics;

  const [metrics, setMetrics] = useState<any>(null);
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  const fetchMetrics = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/analytics/metrics');
      const data = await res.json();
      setMetrics(data.funnel);
      setEvents(data.recentEvents || []);
    } catch (err) {
      console.error('Failed to fetch analytics metrics:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMetrics();
  }, []);

  if (!isOpen) {
    return (
      <div className="fixed bottom-4 right-4 z-40">
        <button
          onClick={() => setIsOpen(true)}
          className="px-3.5 py-2 bg-zinc-900 border border-zinc-800 hover:border-zinc-700 text-zinc-300 hover:text-white rounded-lg shadow-xl text-xs font-mono font-bold flex items-center gap-2 transition-all cursor-pointer"
        >
          <BarChart3 className="w-3.5 h-3.5 text-emerald-400" />
          <span>{im.buttonLabel}</span>
        </button>
      </div>
    );
  }

  const funnel = metrics || {
    analyses: 0,
    resultsViewed: 0,
    emailsCaptured: 0,
    checkoutsStarted: 0,
    purchasesCompleted: 0,
    reportsOpened: 0,
    monitoringStarted: 0,
    monitoringCancelled: 0,
    successfulScans: 0,
    failedScans: 0,
    conversionRates: {
      analysisToResultPct: 0,
      resultToEmailPct: 0,
      emailToCheckoutPct: 0,
      checkoutToPurchasePct: 0,
      purchaseToReportPct: 0,
      purchaseToMonitoringPct: 0,
    },
  };

  const funnelSteps = [
    { label: im.stepAnalysis, count: funnel.analyses, icon: Activity, color: 'text-indigo-400', bg: 'bg-indigo-500/10' },
    { label: im.stepResult, count: funnel.resultsViewed, icon: CheckCircle2, color: 'text-emerald-400', bg: 'bg-emerald-500/10', ratePct: funnel.conversionRates?.analysisToResultPct },
    { label: im.stepEmail, count: funnel.emailsCaptured, icon: Users, color: 'text-amber-400', bg: 'bg-amber-500/10', ratePct: funnel.conversionRates?.resultToEmailPct },
    { label: im.stepCheckout, count: funnel.checkoutsStarted, icon: ShoppingCart, color: 'text-purple-400', bg: 'bg-purple-500/10', ratePct: funnel.conversionRates?.emailToCheckoutPct },
    { label: im.stepPurchase, count: funnel.purchasesCompleted, icon: TrendingUp, color: 'text-emerald-300', bg: 'bg-emerald-500/20', ratePct: funnel.conversionRates?.checkoutToPurchasePct },
    { label: im.stepReport, count: funnel.reportsOpened, icon: FileText, color: 'text-cyan-400', bg: 'bg-cyan-500/10', ratePct: funnel.conversionRates?.purchaseToReportPct },
    { label: im.stepMonitoring, count: funnel.monitoringStarted, icon: Layers, color: 'text-indigo-300', bg: 'bg-indigo-600/20', ratePct: funnel.conversionRates?.purchaseToMonitoringPct },
  ];

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-4xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Modal Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/50">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
              <BarChart3 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white tracking-tight">
                {im.title}
              </h2>
              <p className="text-xs text-slate-400 font-mono">
                {im.subtitle}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={fetchMetrics}
              disabled={loading}
              className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl transition-colors cursor-pointer text-xs flex items-center gap-1.5 font-mono"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              <span>{im.refresh}</span>
            </button>
            <button
              onClick={() => setIsOpen(false)}
              className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl transition-colors cursor-pointer text-xs font-mono font-bold"
            >
              ✕
            </button>
          </div>
        </div>

        <div className="p-6 overflow-y-auto space-y-6">
          {/* FUNNEL FLOW CHART */}
          <div className="space-y-3">
            <h3 className="text-xs font-mono font-bold text-slate-400 uppercase tracking-wider">
              {im.conversionFunnel}
            </h3>

            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2">
              {funnelSteps.map((step, idx) => {
                const IconComponent = step.icon;
                return (
                  <div
                    key={step.label}
                    className="bg-slate-950 border border-slate-800/80 rounded-2xl p-3 flex flex-col justify-between space-y-2 relative"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-mono text-slate-500 font-bold uppercase">
                        #{idx + 1}
                      </span>
                      <div className={`p-1.5 rounded-lg ${step.bg} ${step.color}`}>
                        <IconComponent className="w-3.5 h-3.5" />
                      </div>
                    </div>

                    <div>
                      <span className="text-lg font-black text-white block">{step.count}</span>
                      <span className="text-[11px] font-bold text-slate-300 block">{step.label}</span>
                    </div>

                    {step.ratePct !== undefined && (
                      <div className="pt-1 border-t border-slate-900 text-[10px] font-mono text-indigo-400">
                        {step.ratePct}% conv.
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* SYSTEM SUMMARY METRICS */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 flex items-center justify-between">
              <div>
                <span className="text-xs text-slate-400 font-mono block">Crawl Success Rate</span>
                <span className="text-xl font-bold text-emerald-400">
                  {funnel.analyses > 0
                    ? `${Math.round((funnel.successfulScans / funnel.analyses) * 100)}%`
                    : '100%'}
                </span>
                <span className="text-[10px] text-slate-500 block">
                  {funnel.successfulScans} pass / {funnel.failedScans} fail
                </span>
              </div>
              <CheckCircle2 className="w-8 h-8 text-emerald-500/20" />
            </div>

            <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 flex items-center justify-between">
              <div>
                <span className="text-xs text-slate-400 font-mono block">Captured Emails</span>
                <span className="text-xl font-bold text-amber-400">{funnel.emailsCaptured}</span>
                <span className="text-[10px] text-slate-500 block">Lead Generation</span>
              </div>
              <Users className="w-8 h-8 text-amber-500/20" />
            </div>

            <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 flex items-center justify-between">
              <div>
                <span className="text-xs text-slate-400 font-mono block">Active Subscriptions</span>
                <span className="text-xl font-bold text-indigo-400">{funnel.monitoringStarted}</span>
                <span className="text-[10px] text-slate-500 block">
                  $25/mo Recurring ({funnel.monitoringCancelled} cancelled)
                </span>
              </div>
              <Activity className="w-8 h-8 text-indigo-500/20" />
            </div>
          </div>

          {/* RECENT ANALYTICS EVENTS TABLE */}
          <div className="space-y-3">
            <h3 className="text-xs font-mono font-bold text-slate-400 uppercase tracking-wider">
              {im.recentEvents} ({events.length})
            </h3>

            <div className="bg-slate-950 border border-slate-800 rounded-2xl overflow-hidden">
              <div className="max-h-56 overflow-y-auto">
                <table className="w-full text-left text-xs font-mono">
                  <thead className="bg-slate-900 text-slate-400 text-[10px] uppercase border-b border-slate-800 sticky top-0">
                    <tr>
                      <th className="py-2.5 px-3">Event</th>
                      <th className="py-2.5 px-3">Domain</th>
                      <th className="py-2.5 px-3">Email</th>
                      <th className="py-2.5 px-3">Timestamp</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 text-slate-300 text-[11px]">
                    {events.map((ev) => (
                      <tr key={ev.id} className="hover:bg-slate-900/50 transition-colors">
                        <td className="py-2 px-3 font-semibold text-indigo-300">{ev.event}</td>
                        <td className="py-2 px-3 text-slate-300">{ev.domain || '—'}</td>
                        <td className="py-2 px-3 text-slate-400">{ev.email || '—'}</td>
                        <td className="py-2 px-3 text-slate-500 text-[10px]">
                          {new Date(ev.timestamp).toLocaleTimeString()}
                        </td>
                      </tr>
                    ))}
                    {events.length === 0 && (
                      <tr>
                        <td colSpan={4} className="py-6 text-center text-slate-500 italic">
                          No analytics events logged yet. Perform a scan or action to view events.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
