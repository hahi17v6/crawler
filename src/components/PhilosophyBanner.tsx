import React from 'react';
import { Target, CheckCircle2, XCircle } from 'lucide-react';
import { SupportedLanguage } from '../types';
import { translations } from '../i18n/translations';

interface PhilosophyBannerProps {
  currentLang: SupportedLanguage;
}

export const PhilosophyBanner: React.FC<PhilosophyBannerProps> = ({ currentLang }) => {
  const t = translations[currentLang] || translations.en;

  return (
    <section className="py-12 bg-zinc-950 border-t border-b border-zinc-900 text-zinc-100 relative overflow-hidden">
      <div className="max-w-5xl mx-auto px-4 sm:px-6">
        <div className="tech-card rounded-2xl p-6 sm:p-8 relative">
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-8">
            {/* Left side: Principle */}
            <div className="max-w-xl">
              <div className="inline-flex items-center space-x-2 text-[11px] font-mono font-bold px-2.5 py-1 rounded bg-zinc-900 text-emerald-400 border border-zinc-800 mb-3 uppercase tracking-wider">
                <Target className="w-3.5 h-3.5" />
                <span>{t.philosophyBadge}</span>
              </div>
              <h3 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight mb-2">
                {t.philosophyTitle}
              </h3>
              <p className="text-xs sm:text-sm text-zinc-400 leading-relaxed font-normal">
                {t.philosophyDescription}
              </p>
            </div>

            {/* Right side: Comparison Box */}
            <div className="w-full lg:w-auto shrink-0 space-y-2.5">
              <div className="bg-zinc-900/90 border border-rose-900/50 rounded-lg p-3.5 text-xs text-rose-300 flex items-center space-x-3 font-mono">
                <XCircle className="w-4 h-4 text-rose-400 shrink-0" />
                <span>{t.philosophyComparison.bad}</span>
              </div>
              <div className="bg-zinc-900/90 border border-emerald-900/50 rounded-lg p-3.5 text-xs text-emerald-300 flex items-center space-x-3 font-mono">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span className="font-bold">{t.philosophyComparison.good}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

