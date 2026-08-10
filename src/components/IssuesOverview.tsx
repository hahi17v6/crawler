import React, { useState } from 'react';
import {
  AlertCircle,
  AlertTriangle,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Info,
  Lock,
  ArrowRight,
  Loader2,
  Mail,
  Bot,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';
import { SupportedLanguage } from '../types';
import { translations, translateDifficulty } from '../i18n/translations';

export interface StructuredIssue {
  id: string;
  title: string;
  observed: string;
  inference: string;
  action: string;
  impact: 'Critical' | 'High' | 'Medium' | 'Low';
  difficulty?: string;
  confidence?: string;
  checkCategory?: string;
  priorityScore?: number;
  severity?: 'critical' | 'warning' | 'info' | 'pass';
}

export interface PassedCheckItem {
  id: string;
  name: string;
  evidence?: string;
}

export interface IssuesOverviewProps {
  diagnosisData: {
    primaryIssue: StructuredIssue | null;
    otherIssues: StructuredIssue[];
    passedChecksCount: number;
    passedChecks: PassedCheckItem[];
    summaryMessage?: string;
  } | null;
  checksData?: any[];
  url: string;
  isPaid?: boolean;
  onUnlockDiagnosis?: (email: string) => void;
  onStartMonitoring?: () => void;
  checkoutLoading?: boolean;
  email?: string;
  setEmail?: (e: string) => void;
  currentLang?: SupportedLanguage;
}

export const IssuesOverview: React.FC<IssuesOverviewProps> = ({
  diagnosisData,
  checksData = [],
  url,
  isPaid = false,
  onUnlockDiagnosis,
  onStartMonitoring,
  checkoutLoading = false,
  email: initialEmail = '',
  setEmail: setParentEmail,
  currentLang = 'en',
}) => {
  const activeLang: SupportedLanguage = (currentLang as SupportedLanguage) || 'en';
  const t = translations[activeLang] || translations.en;
  const io = t.issuesOverview;

  const [showAllIssues, setShowAllIssues] = useState(false);
  const [localEmail, setLocalEmail] = useState(initialEmail);

  const currentEmail = setParentEmail ? initialEmail : localEmail;
  const handleEmailChange = (val: string) => {
    if (setParentEmail) {
      setParentEmail(val);
    } else {
      setLocalEmail(val);
    }
  };

  // Helper to translate check name
  const translateCheckName = (checkId: string, defaultName?: string) => {
    return t.checksMap?.[checkId] || defaultName || checkId;
  };

  // 1. Gather all issues
  const rawIssues: StructuredIssue[] = [];
  if (diagnosisData?.primaryIssue) {
    rawIssues.push(diagnosisData.primaryIssue);
  }
  if (diagnosisData?.otherIssues && Array.isArray(diagnosisData.otherIssues)) {
    rawIssues.push(...diagnosisData.otherIssues);
  }

  // Fallback: If no diagnosis object, build from checksData
  if (rawIssues.length === 0 && checksData.length > 0) {
    checksData
      .filter((c) => c.status !== 'pass')
      .forEach((c) => {
        let impact: 'Critical' | 'High' | 'Medium' | 'Low' = 'Medium';
        if (c.severity === 'critical' || c.status === 'critical') impact = 'Critical';
        else if (c.severity === 'high') impact = 'High';
        else if (c.severity === 'low' || c.status === 'info') impact = 'Low';

        rawIssues.push({
          id: c.id,
          title: translateCheckName(c.id, c.name),
          observed: c.evidence || 'Issue observed during technical crawl.',
          inference: c.explanation || 'May impact crawlability or indexability.',
          action: c.recommended_action || 'Review website technical configuration.',
          impact,
          severity: impact === 'Critical' ? 'critical' : impact === 'Low' ? 'info' : 'warning',
        });
      });
  }

  // Helper to normalize impact into standard Severity Category
  const getSeverity = (issue: StructuredIssue): 'CRITICAL' | 'WARNING' | 'INFO' => {
    if (issue.impact === 'Critical' || issue.severity === 'critical') return 'CRITICAL';
    if (issue.impact === 'Low' || issue.severity === 'info') return 'INFO';
    return 'WARNING'; // High or Medium
  };

  const getSeverityLabel = (sev: 'CRITICAL' | 'WARNING' | 'INFO') => {
    if (sev === 'CRITICAL') return io.critical;
    if (sev === 'WARNING') return io.warning;
    return io.info;
  };

  // 2. Sort issues: CRITICAL > WARNING > INFO, then by priorityScore descending
  const allSortedIssues = [...rawIssues].sort((a, b) => {
    const sevOrder = { CRITICAL: 0, WARNING: 1, INFO: 2 };
    const sevA = sevOrder[getSeverity(a)];
    const sevB = sevOrder[getSeverity(b)];
    if (sevA !== sevB) return sevA - sevB;
    return (b.priorityScore || 0) - (a.priorityScore || 0);
  });

  // 3. Dynamic Counters Calculation
  const criticalCount = allSortedIssues.filter((i) => getSeverity(i) === 'CRITICAL').length;
  const warningCount = allSortedIssues.filter((i) => getSeverity(i) === 'WARNING').length;
  const infoCount = allSortedIssues.filter((i) => getSeverity(i) === 'INFO').length;

  // Gather passed checks
  const passedChecks: PassedCheckItem[] = (diagnosisData?.passedChecks || []).map(item => ({
    ...item,
    name: translateCheckName(item.id, item.name)
  }));
  if (passedChecks.length === 0 && checksData.length > 0) {
    checksData
      .filter((c) => c.status === 'pass')
      .forEach((c) => {
        passedChecks.push({
          id: c.id,
          name: translateCheckName(c.id, c.name),
          evidence: c.evidence,
        });
      });
  }
  const passedCount = passedChecks.length;

  // 4. Top Priorities (Max 3)
  const topPriorities = allSortedIssues.slice(0, 3);
  const remainingIssues = allSortedIssues.slice(3);

  // Check if llms.txt check was run
  const llmsCheck = checksData.find((c) => c.id === 'llms_txt');
  const hasLlmsTxt = llmsCheck ? llmsCheck.status === 'pass' : false;

  const handleSubmitCheckout = (e: React.FormEvent) => {
    e.preventDefault();
    if (onUnlockDiagnosis && currentEmail) {
      onUnlockDiagnosis(currentEmail);
    }
  };

  return (
    <div className="space-y-6 text-slate-100">
      {/* ========================================================= */}
      {/* HEADER & DYNAMIC COUNTERS                                  */}
      {/* ========================================================= */}
      <div className="bg-slate-950/90 border border-slate-800 rounded-2xl p-5 shadow-lg space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800/80 pb-4">
          <div>
            <span className="text-[10px] font-mono uppercase tracking-widest text-indigo-400 font-bold block mb-1">
              {io.auditSummary}
            </span>
            <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
              {io.title}
            </h2>
          </div>
          <div className="text-xs font-mono text-slate-400 truncate">
            {io.target}: <span className="text-slate-200 font-medium">{url}</span>
          </div>
        </div>

        {/* Dynamic Counter Badges */}
        <div className="flex flex-wrap items-center gap-2.5 sm:gap-3 text-xs font-semibold">
          <div
            className={`px-3 py-1.5 rounded-xl border flex items-center gap-2 transition-colors ${
              criticalCount > 0
                ? 'bg-rose-950/80 text-rose-300 border-rose-800/80 shadow-sm'
                : 'bg-slate-900/60 text-slate-400 border-slate-800'
            }`}
          >
            <span className="text-sm">🔴</span>
            <span>{criticalCount} {io.critical}</span>
          </div>

          <div
            className={`px-3 py-1.5 rounded-xl border flex items-center gap-2 transition-colors ${
              warningCount > 0
                ? 'bg-amber-950/80 text-amber-300 border-amber-800/80 shadow-sm'
                : 'bg-slate-900/60 text-slate-400 border-slate-800'
            }`}
          >
            <span className="text-sm">🟠</span>
            <span>{warningCount} {warningCount === 1 ? io.warning : io.warnings}</span>
          </div>

          {infoCount > 0 && (
            <div className="px-3 py-1.5 rounded-xl bg-blue-950/80 text-blue-300 border border-blue-800/80 flex items-center gap-2">
              <span className="text-sm">🔵</span>
              <span>{infoCount} {io.info}</span>
            </div>
          )}

          <div className="px-3 py-1.5 rounded-xl bg-emerald-950/80 text-emerald-300 border border-emerald-800/80 flex items-center gap-2">
            <span className="text-sm">🟢</span>
            <span>{passedCount} {io.passed}</span>
          </div>
        </div>
      </div>

      {/* ========================================================= */}
      {/* EMPTY STATES                                              */}
      {/* ========================================================= */}
      {allSortedIssues.length === 0 ? (
        <div className="bg-emerald-950/40 border-2 border-emerald-600/80 rounded-2xl p-6 text-center space-y-2 shadow-xl">
          <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto" />
          <h3 className="text-lg font-bold text-white uppercase tracking-wider">{io.excellent}</h3>
          <p className="text-xs sm:text-sm text-emerald-200/90 max-w-lg mx-auto leading-relaxed">
            {io.excellentDesc}
          </p>
        </div>
      ) : (
        <>
          {criticalCount === 0 && (
            <div className="bg-emerald-950/30 border border-emerald-800/80 rounded-2xl p-4 flex items-center gap-3 text-emerald-200 text-xs">
              <span className="text-base">🟢</span>
              <div>
                <strong className="font-bold text-emerald-300 block">{io.noCriticalTitle}</strong>
                <span className="text-emerald-300/80">
                  {io.noCriticalDesc}
                </span>
              </div>
            </div>
          )}

          {warningCount === 0 && criticalCount > 0 && (
            <div className="bg-emerald-950/30 border border-emerald-800/80 rounded-2xl p-4 flex items-center gap-3 text-emerald-200 text-xs">
              <span className="text-base">🟢</span>
              <span className="font-medium">{io.noWarnings}</span>
            </div>
          )}
        </>
      )}

      {/* ========================================================= */}
      {/* TOP PRIORITIES SECTION (MAX 3)                            */}
      {/* ========================================================= */}
      {topPriorities.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <h3 className="text-xs font-black text-slate-300 uppercase tracking-widest flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-400" />
              <span>{io.topPriorities}</span>
            </h3>
            <span className="text-[10px] font-mono text-slate-500">
              {io.showingTop} {topPriorities.length} / {allSortedIssues.length}
            </span>
          </div>

          <div className="space-y-4">
            {topPriorities.map((issue, idx) => {
              const severity = getSeverity(issue);
              return (
                <div
                  key={issue.id || idx}
                  className={`bg-slate-950/90 border-2 rounded-2xl p-5 text-xs space-y-3.5 transition-colors shadow-lg ${
                    severity === 'CRITICAL'
                      ? 'border-rose-600/80 bg-gradient-to-br from-rose-950/30 via-slate-950 to-slate-950'
                      : severity === 'WARNING'
                      ? 'border-amber-600/70 bg-gradient-to-br from-amber-950/20 via-slate-950 to-slate-950'
                      : 'border-blue-600/60 bg-gradient-to-br from-blue-950/20 via-slate-950 to-slate-950'
                  }`}
                >
                  {/* Card Header */}
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800/80 pb-2.5">
                    <div className="flex items-center space-x-2.5">
                      <span className="font-mono text-slate-400 font-bold text-sm">{idx + 1}.</span>
                      <span
                        className={`px-2.5 py-0.5 rounded-md font-mono font-bold text-[10px] uppercase tracking-wider border ${
                          severity === 'CRITICAL'
                            ? 'bg-rose-950 text-rose-300 border-rose-800'
                            : severity === 'WARNING'
                            ? 'bg-amber-950 text-amber-300 border-amber-800'
                            : 'bg-blue-950 text-blue-300 border-blue-800'
                        }`}
                      >
                        [{getSeverityLabel(severity)}]
                      </span>
                      <h4 className="text-sm font-bold text-white tracking-tight">
                        {translateCheckName(issue.id, issue.title)}
                      </h4>
                    </div>

                    {issue.difficulty && (
                      <span className="text-[10px] font-mono px-2 py-0.5 bg-slate-900 text-slate-400 border border-slate-800 rounded">
                        {io.difficulty}: {translateDifficulty(issue.difficulty, activeLang)}
                      </span>
                    )}
                  </div>

                  {/* OBSERVED / INFERENCE / ACTION GRID */}
                  <div className="grid grid-cols-1 gap-2.5 text-[11px] leading-relaxed">
                    <div className="bg-slate-900/80 p-3 rounded-xl border border-slate-800/80 space-y-1">
                      <strong className="text-slate-400 uppercase text-[9px] tracking-wider block font-bold">
                        {io.whatWeFound}
                      </strong>
                      <p className="font-mono text-slate-200">{issue.observed}</p>
                    </div>

                    <div className="bg-slate-900/80 p-3 rounded-xl border border-slate-800/80 space-y-1">
                      <strong className="text-amber-400 uppercase text-[9px] tracking-wider block font-bold">
                        {io.whyItMatters}
                      </strong>
                      <p className="text-slate-300">{issue.inference}</p>
                    </div>

                    <div className="bg-emerald-950/30 p-3 rounded-xl border border-emerald-800/60 space-y-1">
                      <strong className="text-emerald-400 uppercase text-[9px] tracking-wider block font-bold">
                        {io.recommendation}
                      </strong>
                      <p className="text-emerald-200 font-medium">{issue.action}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* VIEW ALL ISSUES TOGGLE BUTTON */}
          {remainingIssues.length > 0 && (
            <div className="text-center pt-1">
              <button
                onClick={() => setShowAllIssues(!showAllIssues)}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 hover:text-white rounded-xl text-xs font-semibold transition-all inline-flex items-center gap-2 cursor-pointer"
              >
                {showAllIssues ? (
                  <>
                    <span>{io.hideExtraIssues}</span>
                    <ChevronUp className="w-4 h-4" />
                  </>
                ) : (
                  <>
                    <span>{io.viewAllIssues} ({allSortedIssues.length})</span>
                    <ChevronDown className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          )}

          {/* EXPANDED REMAINING ISSUES */}
          {showAllIssues && remainingIssues.length > 0 && (
            <div className="space-y-3 pt-2 animate-fade-in">
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                {io.additionalTechnicalIssues} ({remainingIssues.length})
              </h4>
              <div className="space-y-3">
                {remainingIssues.map((issue, idx) => {
                  const severity = getSeverity(issue);
                  return (
                    <div
                      key={issue.id || idx}
                      className="bg-slate-950/80 border border-slate-800 rounded-xl p-4 text-xs space-y-3"
                    >
                      <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                        <div className="flex items-center space-x-2">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase ${
                              severity === 'CRITICAL'
                                ? 'bg-rose-950 text-rose-300 border border-rose-800'
                                : severity === 'WARNING'
                                ? 'bg-amber-950 text-amber-300 border border-amber-800'
                                : 'bg-blue-950 text-blue-300 border border-blue-800'
                            }`}
                          >
                            [{getSeverityLabel(severity)}]
                          </span>
                          <span className="font-bold text-white text-xs">{translateCheckName(issue.id, issue.title)}</span>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 gap-2 text-[11px] leading-relaxed">
                        <div className="bg-slate-900 p-2.5 rounded-lg border border-slate-800/60">
                          <strong className="text-slate-400 uppercase text-[9px] block">{io.whatWeFoundShort}:</strong>
                          <p className="font-mono text-slate-300">{issue.observed}</p>
                        </div>
                        <div className="bg-slate-900 p-2.5 rounded-lg border border-slate-800/60">
                          <strong className="text-amber-400 uppercase text-[9px] block">{io.whyItMattersShort}:</strong>
                          <p className="text-slate-300">{issue.inference}</p>
                        </div>
                        <div className="bg-emerald-950/30 p-2.5 rounded-lg border border-emerald-800/60">
                          <strong className="text-emerald-400 uppercase text-[9px] block">{io.recommendationShort}:</strong>
                          <p className="text-emerald-200">{issue.action}</p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========================================================= */}
      {/* PASSED CHECKS SECTION                                     */}
      {/* ========================================================= */}
      {passedChecks.length > 0 && (
        <div className="bg-slate-950/90 border border-slate-800/80 rounded-2xl p-5 space-y-3 shadow-lg">
          <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2 border-b border-slate-800 pb-2.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>{io.passedChecks} ({passedCount})</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
            {passedChecks.map((check) => (
              <div
                key={check.id}
                className="flex items-center gap-2.5 bg-slate-900/80 border border-slate-800/60 p-2.5 rounded-xl transition-colors hover:border-slate-700"
              >
                <span className="text-emerald-400 font-bold shrink-0">✓</span>
                <span className="font-medium text-slate-200 truncate">{translateCheckName(check.id, check.name)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* AI VISIBILITY SECTION (SEPARATED FROM SEO CHECKS)          */}
      {/* ========================================================= */}
      <div className="bg-slate-950/90 border border-slate-800/80 rounded-2xl p-5 space-y-3.5 shadow-lg">
        <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
          <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
            <Bot className="w-4 h-4 text-indigo-400" />
            <span>{io.aiVisibilitySignals}</span>
          </h3>
          <span className="text-[10px] font-mono bg-indigo-950/80 text-indigo-300 border border-indigo-800/80 px-2 py-0.5 rounded font-bold">
            {io.experimental}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs font-mono">
          <div className="flex items-center justify-between bg-slate-900/80 border border-slate-800/60 p-2.5 rounded-xl">
            <span className="text-slate-300 font-sans">{io.aiCrawlerAccess}</span>
            <span className="text-emerald-400 font-bold">✓</span>
          </div>

          <div className="flex items-center justify-between bg-slate-900/80 border border-slate-800/60 p-2.5 rounded-xl">
            <span className="text-slate-300 font-sans">{io.llmsTxtFile}</span>
            {hasLlmsTxt ? (
              <span className="text-emerald-400 font-bold">✓</span>
            ) : (
              <span className="text-blue-400 font-bold">ℹ</span>
            )}
          </div>

          <div className="flex items-center justify-between bg-slate-900/80 border border-slate-800/60 p-2.5 rounded-xl">
            <span className="text-slate-300 font-sans">{io.structuredContent}</span>
            <span className="text-amber-400 font-bold">⚠</span>
          </div>

          <div className="flex items-center justify-between bg-slate-900/80 border border-slate-800/60 p-2.5 rounded-xl">
            <span className="text-slate-300 font-sans">{io.machineReadableData}</span>
            <span className="text-emerald-400 font-bold">✓</span>
          </div>
        </div>

        {!hasLlmsTxt && (
          <div className="bg-slate-900/90 border border-slate-800/80 p-3 rounded-xl text-xs text-slate-300 flex items-start gap-2.5 leading-relaxed">
            <Info className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
            <span>
              {io.noLlmsTxtDesc}
            </span>
          </div>
        )}
      </div>

      {/* ========================================================= */}
      {/* DYNAMIC CTA & PAYWALL                                     */}
      {/* ========================================================= */}
      {!isPaid && onUnlockDiagnosis && (
        <div className="bg-gradient-to-br from-indigo-950/70 via-slate-900 to-slate-900 border-2 border-indigo-500/60 rounded-2xl p-6 space-y-4 shadow-xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h4 className="text-base font-bold text-white flex items-center gap-2">
                <Lock className="w-4 h-4 text-indigo-400" />
                <span>
                  {criticalCount > 0
                    ? io.fixHighestImpact
                    : warningCount > 0
                    ? io.improveVisibility
                    : io.websiteHealthy}
                </span>
              </h4>
              <p className="text-xs text-slate-300 mt-1">
                {criticalCount > 0 || warningCount > 0
                  ? io.fixPlanDesc
                  : io.monitoringDesc}
              </p>
            </div>

            <div className="text-right shrink-0">
              <span className="text-xl font-black text-white">
                {allSortedIssues.length > 0 ? '$11' : '$25'}
              </span>
              <span className="text-[10px] text-slate-400 block font-mono">
                {allSortedIssues.length > 0 ? io.oneTime : io.perMonth}
              </span>
            </div>
          </div>

          <form onSubmit={handleSubmitCheckout} className="space-y-3 pt-1">
            <div className="flex flex-col sm:flex-row gap-2.5">
              <div className="relative flex-1">
                <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-3.5" />
                <input
                  type="email"
                  required
                  value={currentEmail}
                  onChange={(e) => handleEmailChange(e.target.value)}
                  placeholder={io.enterEmailPlaceholder}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
                />
              </div>

              {allSortedIssues.length > 0 ? (
                <button
                  type="submit"
                  disabled={checkoutLoading}
                  className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs sm:text-sm rounded-xl transition-all shadow-lg hover:shadow-indigo-500/25 flex items-center justify-center gap-2 cursor-pointer shrink-0 disabled:opacity-50"
                >
                  {checkoutLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>{io.redirectingStripe}</span>
                    </>
                  ) : (
                    <>
                      <span>{io.unlockFullDiagnosis}</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              ) : (
                <button
                  type="button"
                  onClick={onStartMonitoring}
                  className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs sm:text-sm rounded-xl transition-all shadow-lg hover:shadow-emerald-500/25 flex items-center justify-center gap-2 cursor-pointer shrink-0"
                >
                  <span>{io.startMonitoringCta}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              )}
            </div>

            <p className="text-[10px] text-slate-500 text-center sm:text-left">
              {io.detailedFixFooter}
            </p>
          </form>
        </div>
      )}
    </div>
  );
};
