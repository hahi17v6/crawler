import React from 'react';
import { Bot, Map, EyeOff, Link2, Server, Route } from 'lucide-react';
import { SupportedLanguage } from '../types';
import { translations } from '../i18n/translations';

interface ChecksOverviewProps {
  currentLang: SupportedLanguage;
}

export const ChecksOverview: React.FC<ChecksOverviewProps> = ({ currentLang }) => {
  const t = translations[currentLang] || translations.en;

  const checkItems = [
    {
      key: 'robots',
      icon: Bot,
      title: t.checks.robots.title,
      desc: t.checks.robots.desc,
      code: 'CHECK 01',
    },
    {
      key: 'sitemap',
      icon: Map,
      title: t.checks.sitemap.title,
      desc: t.checks.sitemap.desc,
      code: 'CHECK 02',
    },
    {
      key: 'indexability',
      icon: EyeOff,
      title: t.checks.indexability.title,
      desc: t.checks.indexability.desc,
      code: 'CHECK 03',
    },
    {
      key: 'canonical',
      icon: Link2,
      title: t.checks.canonical.title,
      desc: t.checks.canonical.desc,
      code: 'CHECK 04',
    },
    {
      key: 'http',
      icon: Server,
      title: t.checks.http.title,
      desc: t.checks.http.desc,
      code: 'CHECK 05',
    },
    {
      key: 'links',
      icon: Route,
      title: t.checks.links.title,
      desc: t.checks.links.desc,
      code: 'CHECK 06',
    },
  ];

  return (
    <section className="py-16 sm:py-20 bg-zinc-950 border-t border-zinc-900 text-zinc-100">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto mb-12 sm:mb-16">
          <h2 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-white mb-3">
            {t.checkSectionTitle}
          </h2>
          <p className="text-sm sm:text-base text-zinc-400 leading-relaxed font-normal">
            {t.checkSectionSubtitle}
          </p>
        </div>

        {/* 6 Checks Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {checkItems.map((item) => {
            const Icon = item.icon;
            return (
              <div
                key={item.key}
                className="tech-card p-6 rounded-xl relative overflow-hidden group"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="w-9 h-9 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center text-emerald-400 group-hover:border-zinc-700 transition-colors">
                    <Icon className="w-4 h-4" />
                  </div>
                  <span className="text-[10px] font-mono font-bold text-zinc-500 tracking-wider">
                    {item.code}
                  </span>
                </div>
                <h3 className="text-base font-bold text-zinc-100 mb-2 tracking-tight">
                  {item.title}
                </h3>
                <p className="text-xs text-zinc-400 leading-relaxed font-normal">
                  {item.desc}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

