import React, { useState } from 'react';
import { Search, Loader2, AlertCircle, ArrowRight, Activity } from 'lucide-react';
import { SupportedLanguage } from '../types';
import { translations } from '../i18n/translations';

interface HeroSectionProps {
  currentLang: SupportedLanguage;
  onStartAnalysis: (url: string) => void;
  isAnalyzing: boolean;
}

export const HeroSection: React.FC<HeroSectionProps> = ({
  currentLang,
  onStartAnalysis,
  isAnalyzing,
}) => {
  const t = translations[currentLang] || translations.en;
  const [inputUrl, setInputUrl] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const validateAndSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const trimmed = inputUrl.trim();
    if (!trimmed) {
      setErrorMessage(t.invalidUrlError);
      return;
    }

    let formatted = trimmed;
    if (!/^https?:\/\//i.test(formatted)) {
      formatted = `https://${formatted}`;
    }

    try {
      const parsed = new URL(formatted);
      if (!parsed.hostname || !parsed.hostname.includes('.') || parsed.hostname.length < 3) {
        setErrorMessage(t.invalidUrlError);
        return;
      }
      onStartAnalysis(parsed.href);
    } catch (_err) {
      setErrorMessage(t.invalidUrlError);
    }
  };

  const handleQuickSample = (sampleUrl: string) => {
    setInputUrl(sampleUrl);
    setErrorMessage(null);
  };

  return (
    <section className="relative overflow-hidden pt-12 pb-16 sm:pt-16 sm:pb-20 bg-zinc-950 text-zinc-100 border-b border-zinc-900 tech-grid-pattern">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center relative z-10">
        {/* Status Badge */}
        <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-md bg-zinc-900 border border-zinc-800 text-zinc-300 text-xs font-mono mb-6 shadow-sm">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span>{t.tagline}</span>
        </div>

        {/* Main Hero Title */}
        <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold text-white tracking-tight leading-[1.12] mb-5 font-sans">
          {t.heroTitle}
        </h1>

        {/* Subtitle */}
        <p className="text-sm sm:text-lg text-zinc-400 max-w-2xl mx-auto font-normal leading-relaxed mb-8">
          {t.heroSubtitle}
        </p>

        {/* Diagnostic Input Box */}
        <form
          onSubmit={validateAndSubmit}
          className="max-w-2xl mx-auto bg-zinc-900/90 p-2 sm:p-2.5 rounded-xl border border-zinc-800 shadow-2xl backdrop-blur-md"
        >
          <div className="flex flex-col sm:flex-row items-stretch gap-2">
            <div className="relative flex-1">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-zinc-500">
                <Search className="w-4 h-4" />
              </div>
              <input
                type="text"
                value={inputUrl}
                onChange={(e) => {
                  setInputUrl(e.target.value);
                  if (errorMessage) setErrorMessage(null);
                }}
                placeholder={t.inputPlaceholder}
                disabled={isAnalyzing}
                className="w-full pl-10 pr-4 py-3 bg-zinc-950 border border-zinc-800 focus:border-emerald-500/80 focus:ring-1 focus:ring-emerald-500/30 text-zinc-100 placeholder-zinc-500 text-xs sm:text-sm font-mono rounded-lg transition-all outline-none"
              />
            </div>

            <button
              type="submit"
              disabled={isAnalyzing || !inputUrl.trim()}
              className="px-5 py-3 bg-emerald-500 hover:bg-emerald-400 disabled:bg-zinc-800 disabled:text-zinc-600 disabled:cursor-not-allowed text-zinc-950 font-bold text-xs sm:text-sm font-sans rounded-lg shadow-sm transition-all flex items-center justify-center space-x-2 shrink-0 cursor-pointer"
            >
              {isAnalyzing ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-zinc-950" />
                  <span>{t.analyzingButton}</span>
                </>
              ) : (
                <>
                  <span>{t.analyzeButton}</span>
                  <ArrowRight className="w-4 h-4 ml-0.5" />
                </>
              )}
            </button>
          </div>
        </form>

        {/* Quick Sample Links */}
        <div className="mt-4 flex items-center justify-center gap-2 text-[11px] font-mono text-zinc-500">
          <span className="hidden sm:inline">Try benchmark:</span>
          {['https://github.com', 'https://vercel.com', 'https://stripe.com'].map((sample) => (
            <button
              key={sample}
              type="button"
              onClick={() => handleQuickSample(sample)}
              className="px-2 py-0.5 rounded bg-zinc-900 border border-zinc-800/80 hover:border-zinc-700 text-zinc-400 hover:text-zinc-200 transition-colors cursor-pointer"
            >
              {sample.replace('https://', '')}
            </button>
          ))}
        </div>

        {/* Invalid URL Error Notice */}
        {errorMessage && (
          <div className="mt-4 inline-flex items-center space-x-2 bg-rose-950/80 border border-rose-800 text-rose-200 text-xs px-3.5 py-2 rounded-lg">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
            <span className="font-mono">{errorMessage}</span>
          </div>
        )}
      </div>
    </section>
  );
};

