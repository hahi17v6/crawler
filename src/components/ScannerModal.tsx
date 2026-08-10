import React, { useState, useEffect } from 'react';
import { Loader2, CheckCircle2, X, AlertTriangle, FileCode, Check, Server, Bot, ArrowRight, Lock, Mail, ShieldCheck, Download, RefreshCw, ExternalLink } from 'lucide-react';
import { SupportedLanguage } from '../types';
import { translations, translateDifficulty, translateCategory, translateSeverity } from '../i18n/translations';
import { IssuesOverview } from './IssuesOverview';

interface ScannerModalProps {
  url: string;
  currentLang: SupportedLanguage;
  crawlData?: any;
  checksData?: any[] | null;
  diagnosisData?: any | null;
  crawlError?: string | null;
  isAnalyzing?: boolean;
  onClose: () => void;
}

export const ScannerModal: React.FC<ScannerModalProps> = ({
  url,
  currentLang,
  crawlData,
  checksData,
  diagnosisData,
  crawlError,
  isAnalyzing,
  onClose,
}) => {
  const fullT = translations[currentLang] || translations.en;
  const t = fullT.scanningModal;
  const fp = fullT.fixPlan;
  const io = fullT.issuesOverview;

  const [email, setEmail] = useState('');
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [isPaid, setIsPaid] = useState(false);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [fullFixPlan, setFullFixPlan] = useState<any | null>(null);
  const [loadingReport, setLoadingReport] = useState(false);

  const primaryIssue = diagnosisData?.primaryIssue;
  const otherIssues = diagnosisData?.otherIssues || [];
  const passedChecks = diagnosisData?.passedChecks || [];
  const totalIssues = (primaryIssue ? 1 : 0) + otherIssues.length;

  // Check URL query parameters or session state if payment was completed
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const paidParam = urlParams.get('paid');
    const sessionIdParam = urlParams.get('session_id');

    if (paidParam === 'true' || sessionIdParam) {
      setIsPaid(true);
      fetchFullFixPlan();
    }
  }, []);

  const fetchFullFixPlan = async (forceUnlock?: boolean) => {
    setLoadingReport(true);
    try {
      const res = await fetch('/api/full-diagnosis', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url, forceUnlock: Boolean(forceUnlock) }),
      });
      const contentType = res.headers.get('content-type');
      let data: any;
      if (contentType && contentType.includes('application/json')) {
        data = await res.json();
      } else {
        const text = await res.text();
        throw new Error(`Invalid response (Status: ${res.status}). Expected JSON, got: ${contentType || 'empty'}. Body: ${text.substring(0, 100)}`);
      }

      if (data.success && data.paidConfirmed && data.report) {
        setFullFixPlan(data.report);
        setIsPaid(true);
      } else {
        setIsPaid(false);
        setFullFixPlan(null);
      }
    } catch (err) {
      console.error('Failed to load Full Website Visibility Diagnosis:', err);
    } finally {
      setLoadingReport(false);
    }
  };

  const handleStartStripeCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setCheckoutLoading(true);
    try {
      const res = await fetch('/api/create-checkout-session', {
        method: 'POST',
        credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url, email }),
      });
      const contentType = res.headers.get('content-type');
      let data: any;
      if (contentType && contentType.includes('application/json')) {
        data = await res.json();
      } else {
        const text = await res.text();
        throw new Error(`Invalid checkout response (Status: ${res.status}). Got: ${contentType || 'empty'}. Body: ${text.substring(0, 100)}`);
      }

      if (data.success) {
        if (data.checkoutUrl) {
          // Redirect to Stripe Checkout or local success URL
          window.location.href = data.checkoutUrl;
        } else {
          // Fallback mock payment simulation
          fetchFullFixPlan(true);
        }
      } else {
        alert('Checkout error: ' + (data.message || 'Failed to initiate Stripe Checkout.'));
      }
    } catch (err: any) {
      console.error('Checkout error:', err);
      // Fallback
      fetchFullFixPlan(true);
    } finally {
      setCheckoutLoading(false);
      setIsCheckoutOpen(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-fade-in">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-3xl w-full p-6 sm:p-8 shadow-2xl relative text-white max-h-[92vh] overflow-y-auto">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-slate-400 hover:text-white bg-slate-800/60 hover:bg-slate-800 rounded-full p-2 transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center space-x-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 shrink-0">
            {isAnalyzing ? (
              <Loader2 className="w-6 h-6 animate-spin text-indigo-400" />
            ) : crawlError ? (
              <AlertTriangle className="w-6 h-6 text-rose-400" />
            ) : isPaid ? (
              <ShieldCheck className="w-6 h-6 text-emerald-400" />
            ) : (
              <CheckCircle2 className="w-6 h-6 text-emerald-400" />
            )}
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h3 className="text-xl font-bold text-white tracking-tight">
                {isAnalyzing
                  ? t.title
                  : crawlError
                  ? fp.alertTitle
                  : isPaid
                  ? fp.title
                  : fp.auditComplete}
              </h3>
              {isPaid && (
                <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800 font-bold">
                  {fp.paidBadge} — $11
                </span>
              )}
            </div>
            <p className="text-xs sm:text-sm text-slate-400 truncate max-w-md font-mono">
              {url}
            </p>
          </div>
        </div>

        {/* Analyzing Spinner State */}
        {isAnalyzing && (
          <div className="py-8 text-center space-y-4">
            <Loader2 className="w-10 h-10 animate-spin text-indigo-400 mx-auto" />
            <p className="text-sm text-slate-300 font-medium">{t.subtitle}</p>
            <div className="text-xs text-slate-500 max-w-md mx-auto">
              {t.readyNoticeDesc} {url}...
            </div>
          </div>
        )}

        {/* Error State */}
        {!isAnalyzing && crawlError && (
          <div className="bg-rose-950/40 border border-rose-800/80 rounded-2xl p-5 mb-6 text-rose-200 text-sm">
            <div className="font-semibold mb-1 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-400" />
              <span>{fullT.serverError || 'Diagnostic Error'}</span>
            </div>
            <p className="text-xs text-rose-300/90">{crawlError}</p>
          </div>
        )}

        {/* ========================================================= */}
        {/* VIEW 1: UNLOCKED FULL "FIX PLAN" REPORT (PAID PRODUCT $11) */}
        {/* ========================================================= */}
        {!isAnalyzing && !crawlError && isPaid && (
          <div className="space-y-6 my-2">
            {loadingReport ? (
              <div className="py-12 text-center space-y-3">
                <Loader2 className="w-8 h-8 animate-spin text-indigo-400 mx-auto" />
                <p className="text-sm text-slate-300">{fp.generating}</p>
              </div>
            ) : fullFixPlan ? (
              <div className="space-y-6">
                {/* Fix Plan Title Header */}
                <div className="bg-gradient-to-r from-slate-900 via-indigo-950/40 to-slate-900 border border-indigo-500/30 rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <span className="text-[10px] font-mono uppercase tracking-widest text-indigo-400 font-bold block mb-1">
                      {fp.title} ($11)
                    </span>
                    <h2 className="text-2xl font-black text-white tracking-tight">
                      # {fp.title}
                    </h2>
                    <p className="text-xs text-slate-400 mt-1">
                      {io.target}: <span className="font-mono text-slate-200">{fullFixPlan.targetUrl}</span>
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => window.print()}
                      className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-xs font-semibold rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer text-slate-200"
                    >
                      <Download className="w-3.5 h-3.5" />
                      {fp.savePdf}
                    </button>
                  </div>
                </div>

                {/* KEY QUESTION ANSWERED: What are the 3 things I should fix first? */}
                <div className="bg-gradient-to-br from-indigo-950/70 via-slate-900 to-slate-900 border-2 border-indigo-500/60 rounded-2xl p-5 sm:p-6 space-y-4 shadow-xl">
                  <div className="flex items-center space-x-2.5 border-b border-indigo-900/60 pb-3">
                    <span className="flex h-3 w-3 rounded-full bg-indigo-400 animate-ping" />
                    <h3 className="text-sm font-bold text-indigo-200 uppercase tracking-wider">
                      {fp.top3Title}
                    </h3>
                  </div>

                  {fullFixPlan.topThreeFixes.length > 0 ? (
                    <div className="space-y-4">
                      {fullFixPlan.topThreeFixes.map((fix: any, idx: number) => (
                        <div
                          key={fix.id || idx}
                          className="bg-slate-950/90 border border-slate-800 rounded-xl p-4 text-xs space-y-3 transition-colors hover:border-slate-700"
                        >
                          <div className="flex items-center justify-between border-b border-slate-800/80 pb-2">
                            <div className="flex items-center space-x-2 font-bold text-slate-100">
                              <span className="px-2 py-0.5 bg-rose-950 text-rose-300 border border-rose-800 rounded-md text-[11px]">
                                #{fix.rank} {fp.priorityFix}
                              </span>
                              <span className="text-sm text-white">{fix.title}</span>
                            </div>
                            <div className="flex gap-1.5 font-mono text-[10px]">
                              <span className="px-2 py-0.5 bg-amber-950 text-amber-300 rounded font-semibold">
                                {io.difficulty}: {translateDifficulty(fix.difficulty, currentLang)}
                              </span>
                            </div>
                          </div>

                          <div className="grid grid-cols-1 gap-2.5 text-[11px] leading-relaxed">
                            <div className="bg-slate-900/80 p-2.5 rounded-lg border border-slate-800/60">
                              <strong className="text-slate-400 uppercase text-[9px] tracking-wider block mb-0.5">
                                {fp.evidence}
                              </strong>
                              <span className="font-mono text-slate-200">{fix.evidence}</span>
                            </div>

                            <div className="bg-slate-900/80 p-2.5 rounded-lg border border-slate-800/60">
                              <strong className="text-amber-400 uppercase text-[9px] tracking-wider block mb-0.5">
                                {fp.impact}
                              </strong>
                              <span className="text-slate-300">{fix.impact}</span>
                            </div>

                            <div className="bg-emerald-950/30 p-2.5 rounded-lg border border-emerald-800/60">
                              <strong className="text-emerald-400 uppercase text-[9px] tracking-wider block mb-0.5">
                                {fp.action}
                              </strong>
                              <span className="text-emerald-200 font-medium">{fix.action}</span>
                            </div>

                            <div className="bg-indigo-950/30 p-2.5 rounded-lg border border-indigo-800/60">
                              <strong className="text-indigo-400 uppercase text-[9px] tracking-wider block mb-0.5">
                                {fp.verify}
                              </strong>
                              <span className="text-indigo-200 font-mono">{fix.verify}</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="bg-emerald-950/30 border border-emerald-800 rounded-xl p-4 text-xs text-emerald-200 text-center">
                      <CheckCircle2 className="w-6 h-6 text-emerald-400 mx-auto mb-2" />
                      {fp.allChecksPassed}
                    </div>
                  )}
                </div>

                {/* Complete List of Technical Signals in Fix Plan */}
                {fullFixPlan.allFixes.length > 3 && (
                  <div className="space-y-3 pt-2">
                    <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                      {fp.remainingItems} ({fullFixPlan.allFixes.length - 3})
                    </h3>
                    <div className="space-y-3">
                      {fullFixPlan.allFixes.slice(3).map((fix: any) => (
                        <div
                          key={fix.id}
                          className="bg-slate-950/80 border border-slate-800 rounded-xl p-4 text-xs space-y-2.5"
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-slate-200 text-sm">{fix.title}</span>
                            <span className="text-[10px] font-mono px-2 py-0.5 bg-slate-800 text-slate-300 rounded">
                              {translateCategory(fix.category, currentLang)}
                            </span>
                          </div>

                          <div className="space-y-2 text-[11px]">
                            <div>
                              <strong className="text-slate-400 uppercase text-[9px] block">{fp.evidence}</strong>
                              <p className="font-mono text-slate-300">{fix.evidence}</p>
                            </div>
                            <div>
                              <strong className="text-amber-400 uppercase text-[9px] block">{fp.impact}</strong>
                              <p className="text-slate-300">{fix.impact}</p>
                            </div>
                            <div>
                              <strong className="text-emerald-400 uppercase text-[9px] block">{fp.action}</strong>
                              <p className="text-emerald-200 font-medium">{fix.action}</p>
                            </div>
                            <div>
                              <strong className="text-indigo-400 uppercase text-[9px] block">{fp.verify}</strong>
                              <p className="text-indigo-200 font-mono">{fix.verify}</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Deep Crawl Metrics Overview */}
                {fullFixPlan.deepCrawlMetrics && (
                  <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-4 space-y-3">
                    <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                      {fp.deepCrawlTitle}
                    </h4>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs font-mono">
                      <div className="bg-slate-900 p-2.5 rounded-lg border border-slate-800">
                        <span className="text-slate-500 block text-[10px]">{fp.pagesSampled}</span>
                        <span className="text-white font-bold">{fullFixPlan.deepCrawlMetrics.pagesSampled}</span>
                      </div>
                      <div className="bg-slate-900 p-2.5 rounded-lg border border-slate-800">
                        <span className="text-slate-500 block text-[10px]">{fp.sitemapUrls}</span>
                        <span className="text-indigo-300 font-bold">{fullFixPlan.deepCrawlMetrics.sitemapUrlsCount}</span>
                      </div>
                      <div className="bg-slate-900 p-2.5 rounded-lg border border-slate-800">
                        <span className="text-slate-500 block text-[10px]">{fp.internalLinks}</span>
                        <span className="text-emerald-300 font-bold">{fullFixPlan.deepCrawlMetrics.internalLinksCount}</span>
                      </div>
                      <div className="bg-slate-900 p-2.5 rounded-lg border border-slate-800">
                        <span className="text-slate-500 block text-[10px]">{fp.duplicateTitles}</span>
                        <span className="text-amber-300 font-bold">{fullFixPlan.deepCrawlMetrics.duplicateTitleCount}</span>
                      </div>
                      <div className="bg-slate-900 p-2.5 rounded-lg border border-slate-800">
                        <span className="text-slate-500 block text-[10px]">{fp.thinContent}</span>
                        <span className="text-rose-300 font-bold">{fullFixPlan.deepCrawlMetrics.thinContentCount}</span>
                      </div>
                      <div className="bg-slate-900 p-2.5 rounded-lg border border-slate-800">
                        <span className="text-slate-500 block text-[10px]">{fp.httpErrors}</span>
                        <span className="text-rose-400 font-bold">{fullFixPlan.deepCrawlMetrics.httpErrorCount}</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-6">
                <button
                  onClick={() => fetchFullFixPlan(true)}
                  className="px-6 py-2.5 bg-indigo-600 text-white rounded-xl text-xs font-bold"
                >
                  {fp.loadFullDiagnosis}
                </button>
              </div>
            )}
          </div>
        )}

        {/* ========================================================= */}
        {/* VIEW 2: ISSUES OVERVIEW REPORT                             */}
        {/* ========================================================= */}
        {!isAnalyzing && !crawlError && crawlData && !isPaid && (
          <div className="space-y-6 my-2">
            <IssuesOverview
              diagnosisData={diagnosisData}
              checksData={checksData || []}
              url={url}
              isPaid={isPaid}
              onUnlockDiagnosis={(userEmail) => {
                setEmail(userEmail);
                handleStartStripeCheckout({ preventDefault: () => {} } as any);
              }}
              checkoutLoading={checkoutLoading}
              email={email}
              setEmail={setEmail}
              currentLang={currentLang}
            />

            {/* Raw JSON inspection accordion */}
            <details className="bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-slate-400">
              <summary className="font-mono text-slate-300 cursor-pointer flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <FileCode className="w-4 h-4 text-indigo-400" /> {fp.rawJson}
                </span>
                <span className="text-[10px] bg-slate-800 text-slate-400 px-2 py-0.5 rounded">{fp.expand}</span>
              </summary>
              <pre className="mt-3 p-3 bg-slate-900 rounded-lg overflow-x-auto text-[11px] font-mono text-emerald-300/90 leading-relaxed border border-slate-800/80 max-h-60">
                {JSON.stringify({ checks: checksData, diagnosis: diagnosisData, crawl: crawlData }, null, 2)}
              </pre>
            </details>
          </div>
        )}

        {/* Footer Close Button */}
        <div className="flex justify-end pt-2">
          <button
            onClick={onClose}
            className="w-full sm:w-auto px-6 py-2.5 bg-slate-800 hover:bg-slate-700 text-white font-medium text-sm rounded-xl transition-colors cursor-pointer"
          >
            {t.closeModal}
          </button>
        </div>
      </div>
    </div>
  );
};
