import React, { useState } from 'react';
import {
  Sparkles,
  Search,
  Bot,
  AlertCircle,
  HelpCircle,
  BarChart2,
  ExternalLink,
  ShieldAlert,
  Info,
  Layers,
  TrendingUp,
  CheckCircle2,
  XCircle,
  Filter,
  RefreshCw,
} from 'lucide-react';
import { AIVisibilityResult, QueryCategory, QuerySampleItem } from '../../server/aiVisibility/aiVisibilityTypes';
import { SupportedLanguage } from '../types';
import { translations } from '../i18n/translations';

interface AIVisibilityDashboardProps {
  initialUrl?: string;
  currentLang?: SupportedLanguage;
}

export const AIVisibilityDashboard: React.FC<AIVisibilityDashboardProps> = ({
  initialUrl = 'crawlsignal.com',
  currentLang = 'en',
}) => {
  const t = translations[currentLang] || translations.en;
  const ai = t.aiVisibility;

  const [url, setUrl] = useState(initialUrl);
  const [brandName, setBrandName] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AIVisibilityResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [filterMissingOnly, setFilterMissingOnly] = useState(false);

  const runAnalysis = async () => {
    if (!url) return;
    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/ai-visibility/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url, brandName }),
      });

      const json = await res.json();
      if (json.success) {
        setResult(json.data);
      } else {
        setError(json.message || 'Failed to perform AI Visibility sampling');
      }
    } catch (err: any) {
      setError(err.message || 'Error connecting to AI Visibility API');
    } finally {
      setLoading(false);
    }
  };

  const categoriesList: { id: QueryCategory | 'all'; label: string }[] = [
    { id: 'all', label: ai.allQueries },
    { id: 'category', label: ai.category },
    { id: 'problem', label: ai.problem },
    { id: 'comparison', label: ai.comparison },
    { id: 'alternative', label: ai.alternative },
    { id: 'use_case', label: ai.useCase },
    { id: 'transactional', label: ai.transactional },
  ];

  const filteredQueries = result?.queries.filter((q) => {
    if (filterMissingOnly && q.brandMentioned) return false;
    if (selectedCategory !== 'all' && q.category !== selectedCategory) return false;
    return true;
  }) || [];

  return (
    <div className="space-y-8">
      {/* FEATURE DISCLAIMER BANNER */}
      <div className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-4 sm:p-5 flex items-start gap-3.5">
        <ShieldAlert className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
        <div className="text-xs text-amber-200/90 leading-relaxed space-y-1">
          <div className="flex items-center gap-2 font-bold text-amber-300">
            <span>{ai.disclaimerTitle}</span>
            <span className="text-[10px] bg-amber-400/20 text-amber-300 px-2 py-0.5 rounded-full uppercase tracking-wider font-mono">
              {ai.disclaimerBadge}
            </span>
          </div>
          <p>
            {ai.disclaimerText}
          </p>
        </div>
      </div>

      {/* INPUT FORM */}
      <div className="tech-card rounded-2xl p-6 sm:p-8 space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2 font-sans">
              <Bot className="w-4 h-4 text-emerald-400" />
              <span>{ai.title}</span>
            </h2>
            <p className="text-xs text-zinc-400 font-mono mt-1">
              {ai.subtitle}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
          <div className="sm:col-span-6">
            <label className="block text-[10px] font-mono uppercase text-zinc-400 mb-1">{ai.urlLabel}</label>
            <input
              type="text"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="e.g. crawlsignal.com"
              className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-xs text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-emerald-500/80 font-mono"
            />
          </div>

          <div className="sm:col-span-4">
            <label className="block text-[10px] font-mono uppercase text-zinc-400 mb-1">{ai.brandLabel}</label>
            <input
              type="text"
              value={brandName}
              onChange={(e) => setBrandName(e.target.value)}
              placeholder="e.g. CrawlSignal"
              className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-xs text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-emerald-500/80 font-mono"
            />
          </div>

          <div className="sm:col-span-2 flex items-end">
            <button
              onClick={runAnalysis}
              disabled={loading || !url}
              className="w-full bg-emerald-500 hover:bg-emerald-400 disabled:bg-zinc-800 text-zinc-950 font-bold py-2 px-3 rounded-lg transition-colors text-xs font-mono flex items-center justify-center gap-2 cursor-pointer shadow-sm"
            >
              {loading ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin text-zinc-950" />
                  <span>{ai.sampling}</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>{ai.runSample}</span>
                </>
              )}
            </button>
          </div>
        </div>

        {error && (
          <div className="p-3 bg-rose-950/80 border border-rose-800 rounded-lg text-xs text-rose-200 font-mono">
            {error}
          </div>
        )}
      </div>

      {/* RESULTS DISPLAY */}
      {result && (
        <div className="space-y-8">
          {/* PRIMARY METRIC DISPLAY */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-800">
              <div>
                <span className="text-xs font-mono text-indigo-400 uppercase tracking-widest block font-bold">
                  {result.brandName}
                </span>
                <div className="mt-2 flex items-baseline gap-3">
                  <span className="text-3xl sm:text-4xl font-black text-white tracking-tight">
                    {result.mentionedQueriesCount} / {result.totalQueriesEvaluated}
                  </span>
                  <span className="text-sm font-semibold text-slate-300">{ai.queriesAnalyzed}</span>
                </div>
              </div>

              {/* CONFIDENCE BADGE */}
              <div className="bg-slate-950 border border-slate-800 p-3.5 rounded-2xl max-w-xs space-y-1">
                <div className="flex items-center gap-2 text-xs font-mono font-bold text-amber-400">
                  <Info className="w-3.5 h-3.5" />
                  <span>{ai.confidenceLabel}: {result.confidenceLevel}</span>
                </div>
                <p className="text-[11px] text-slate-400 leading-tight">
                  {result.confidenceExplanation}
                </p>
              </div>
            </div>

            {/* SECONDARY METRICS GRID */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="bg-slate-950 border border-slate-800/80 p-4 rounded-2xl space-y-1">
                <span className="text-xs font-mono text-slate-400">{ai.scoreLabel}</span>
                <div className="text-2xl font-bold text-indigo-400">{result.mentionRatePct}%</div>
                <span className="text-[10px] text-slate-500 block">{ai.mention}</span>
              </div>

              <div className="bg-slate-950 border border-slate-800/80 p-4 rounded-2xl space-y-1">
                <span className="text-xs font-mono text-slate-400">{ai.citation}</span>
                <div className="text-2xl font-bold text-cyan-400">{result.citationRatePct}%</div>
                <span className="text-[10px] text-slate-500 block">{ai.citation}</span>
              </div>

              <div className="bg-slate-950 border border-slate-800/80 p-4 rounded-2xl space-y-1">
                <span className="text-xs font-mono text-slate-400">{ai.queriesMissing}</span>
                <div className="text-2xl font-bold text-amber-400">{result.missingQueries.length}</div>
                <span className="text-[10px] text-slate-500 block">{ai.opportunities}</span>
              </div>

              <div className="bg-slate-950 border border-slate-800/80 p-4 rounded-2xl space-y-1">
                <span className="text-xs font-mono text-slate-400">Platform</span>
                <div className="text-sm font-bold text-slate-200 truncate">{result.platform}</div>
                <span className="text-[10px] text-slate-500 block font-mono">
                  {new Date(result.timestamp).toLocaleTimeString()}
                </span>
              </div>
            </div>

            {/* COMPETITOR SHARE */}
            <div className="space-y-3 pt-4 border-t border-slate-800/80">
              <h3 className="text-xs font-mono font-bold text-slate-400 uppercase tracking-wider">
                {ai.competitorShares}
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {result.competitorShares.map((comp) => (
                  <div key={comp.name} className="bg-slate-950 border border-slate-800/60 p-3.5 rounded-2xl flex items-center justify-between">
                    <div>
                      <span className="text-xs font-bold text-slate-200 block">{comp.name}</span>
                      <span className="text-[10px] text-slate-500 font-mono">
                        {comp.mentionedCount} / {comp.totalQueries}
                      </span>
                    </div>
                    <span className="text-sm font-black text-indigo-300 font-mono">{comp.sharePct}%</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* OBSERVATIONS & LIKELY SIGNALS */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-4">
            <h3 className="text-sm font-mono font-bold text-indigo-400 uppercase tracking-wider flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />
              <span>{ai.observedPatternsTitle}</span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {result.observedPatterns.map((pattern, i) => {
                const badgeColor =
                  pattern.type === 'likely_signal'
                    ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                    : pattern.type === 'possible_factor'
                    ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                    : 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20';

                return (
                  <div key={i} className="bg-slate-950 border border-slate-800 p-4 rounded-2xl space-y-2">
                    <span className={`inline-block text-[10px] font-mono px-2 py-0.5 rounded-md border ${badgeColor} uppercase font-bold`}>
                      {pattern.type.replace('_', ' ')}
                    </span>
                    <h4 className="text-xs font-bold text-white">{pattern.label}</h4>
                    <p className="text-xs text-slate-400 leading-relaxed">{pattern.description}</p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* DETAILED QUERY SAMPLES */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-base font-bold text-white">{ai.allQueries}</h3>
                <p className="text-xs text-slate-400 font-mono">
                  {ai.intentCategory}
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={() => setFilterMissingOnly(!filterMissingOnly)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold transition-colors cursor-pointer border ${
                    filterMissingOnly
                      ? 'bg-amber-500/20 border-amber-500/40 text-amber-300'
                      : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700'
                  }`}
                >
                  {ai.filterMissing}
                </button>
              </div>
            </div>

            {/* CATEGORY TABS */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-2 border-b border-slate-800">
              {categoriesList.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-mono font-medium whitespace-nowrap transition-colors cursor-pointer ${
                    selectedCategory === cat.id
                      ? 'bg-indigo-600 text-white'
                      : 'bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-800'
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>

            {/* QUERY LIST */}
            <div className="space-y-3">
              {filteredQueries.map((q) => (
                <div
                  key={q.id}
                  className="bg-slate-950 border border-slate-800/80 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:border-slate-700 transition-colors"
                >
                  <div className="space-y-1 max-w-2xl">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-mono uppercase bg-slate-900 border border-slate-800 px-2 py-0.5 rounded text-indigo-400 font-bold">
                        {q.category}
                      </span>
                      {q.brandMentioned ? (
                        <span className="inline-flex items-center gap-1 text-[11px] text-emerald-400 font-bold font-mono">
                          <CheckCircle2 className="w-3.5 h-3.5" /> {ai.mentionedYes}
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[11px] text-slate-500 font-mono">
                          <XCircle className="w-3.5 h-3.5 text-amber-500/80" /> {ai.mentionedNo}
                        </span>
                      )}
                    </div>
                    <p className="text-xs sm:text-sm font-semibold text-slate-200">"{q.query}"</p>
                    {q.sampleResponseSnippet && (
                      <p className="text-[11px] text-slate-500 italic">
                        {q.sampleResponseSnippet}
                      </p>
                    )}
                  </div>

                  <div className="flex flex-col sm:items-end gap-1 text-[11px] font-mono shrink-0">
                    {q.competitorsMentioned.length > 0 && (
                      <div className="text-slate-400">
                        {ai.competitorsLabel} <span className="text-slate-200">{q.competitorsMentioned.join(', ')}</span>
                      </div>
                    )}
                    {q.citedUrls.length > 0 && (
                      <div className="text-cyan-400 flex items-center gap-1">
                        <ExternalLink className="w-3 h-3" />
                        <span>{ai.citation}</span>
                      </div>
                    )}
                  </div>
                </div>
              ))}

              {filteredQueries.length === 0 && (
                <div className="p-8 text-center text-slate-500 font-mono text-xs italic bg-slate-950 border border-slate-800 rounded-2xl">
                  {ai.noData}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
