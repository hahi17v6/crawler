import React from 'react';
import { Activity } from 'lucide-react';
import { SupportedLanguage } from '../types';
import { translations } from '../i18n/translations';

interface FooterProps {
  currentLang: SupportedLanguage;
}

export const Footer: React.FC<FooterProps> = ({ currentLang }) => {
  const t = translations[currentLang] || translations.en;

  return (
    <footer className="border-t border-zinc-900 bg-zinc-950 py-8 text-zinc-400 text-xs font-mono">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center space-x-2.5">
          <div className="w-5 h-5 rounded bg-zinc-900 border border-zinc-800 flex items-center justify-center text-emerald-400">
            <Activity className="w-3 h-3 text-emerald-400" />
          </div>
          <span className="font-bold text-zinc-200">{t.brandName}</span>
          <span className="text-zinc-700">•</span>
          <span className="text-zinc-500">{t.footerMotto}</span>
        </div>

        <div className="text-zinc-600">
          © {new Date().getFullYear()} {t.brandName}. {t.footerRights}
        </div>
      </div>
    </footer>
  );
};

