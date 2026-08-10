import React from 'react';
import { Activity, Globe, ChevronDown } from 'lucide-react';
import { SupportedLanguage } from '../types';
import { translations } from '../i18n/translations';

interface HeaderProps {
  currentLang: SupportedLanguage;
  onLanguageChange: (lang: SupportedLanguage) => void;
}

export const Header: React.FC<HeaderProps> = ({ currentLang, onLanguageChange }) => {
  const t = translations[currentLang] || translations.en;

  const languages: { code: SupportedLanguage; label: string; badge: string }[] = [
    { code: 'en', label: 'English', badge: 'EN' },
    { code: 'fr', label: 'Français', badge: 'FR' },
    { code: 'es', label: 'Español', badge: 'ES' },
  ];

  return (
    <header className="border-b border-zinc-800/80 bg-zinc-950/90 backdrop-blur-md sticky top-0 z-40 text-zinc-100">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
        {/* Brand Logo & Name */}
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 rounded-md bg-zinc-900 border border-zinc-700/80 flex items-center justify-center text-emerald-400 font-mono text-sm font-bold shadow-sm">
            <Activity className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="flex items-baseline space-x-2">
            <span className="font-bold text-base text-zinc-100 tracking-tight font-sans">
              {t.brandName}
            </span>
            <span className="hidden sm:inline-block text-[11px] font-mono font-medium px-2 py-0.5 rounded bg-zinc-900 text-zinc-400 border border-zinc-800">
              {t.tagline}
            </span>
          </div>
        </div>

        {/* Language Selector */}
        <div className="relative group">
          <button
            type="button"
            aria-label="Select language"
            className="flex items-center space-x-2 bg-zinc-900 border border-zinc-800 hover:border-zinc-700 rounded-md px-2.5 py-1.5 text-xs text-zinc-300 transition-all cursor-pointer"
          >
            <Globe className="w-3.5 h-3.5 text-zinc-400" />
            <span className="font-mono font-bold uppercase tracking-wide text-zinc-200">{currentLang}</span>
            <ChevronDown className="w-3 h-3 text-zinc-500" />
          </button>

          <div className="absolute right-0 top-full mt-1.5 w-36 bg-zinc-900 border border-zinc-800 rounded-lg shadow-2xl py-1 hidden group-hover:block z-50">
            {languages.map((lang) => (
              <button
                key={lang.code}
                onClick={() => onLanguageChange(lang.code)}
                className={`w-full text-left px-3 py-1.5 text-xs flex items-center justify-between transition-colors ${
                  currentLang === lang.code
                    ? 'bg-zinc-800 text-emerald-400 font-medium'
                    : 'text-zinc-300 hover:bg-zinc-800/60'
                }`}
              >
                <span>{lang.label}</span>
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-zinc-950 border border-zinc-800 text-zinc-400">
                  {lang.badge}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </header>
  );
};

