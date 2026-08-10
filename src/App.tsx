import React, { useState, useEffect } from 'react';
import { SupportedLanguage } from './types';
import { detectDeviceLanguage, translations } from './i18n/translations';
import { Header } from './components/Header';
import { HeroSection } from './components/HeroSection';
import { ChecksOverview } from './components/ChecksOverview';
import { PhilosophyBanner } from './components/PhilosophyBanner';
import { MonitoringDashboard } from './components/MonitoringDashboard';
import { AIVisibilityDashboard } from './components/AIVisibilityDashboard';
import { InternalMetricsDashboard } from './components/InternalMetricsDashboard';
import { ScannerModal } from './components/ScannerModal';
import { Footer } from './components/Footer';
import { Search, Bot, Activity } from 'lucide-react';

export default function App() {
  const [lang, setLang] = useState<SupportedLanguage>('en');
  const [activeTab, setActiveTab] = useState<'technical' | 'ai_visibility'>('technical');
  const [analyzingUrl, setAnalyzingUrl] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [showModal, setShowModal] = useState<boolean>(false);

  // Detect device language on mount
  useEffect(() => {
    const detected = detectDeviceLanguage();
    setLang(detected);
  }, []);

  const t = translations[lang] || translations.en;

  const [crawlData, setCrawlData] = useState<any | null>(null);
  const [checksData, setChecksData] = useState<any[] | null>(null);
  const [diagnosisData, setDiagnosisData] = useState<any | null>(null);
  const [crawlError, setCrawlError] = useState<string | null>(null);

  const handleStartAnalysis = async (url: string) => {
    setAnalyzingUrl(url);
    setIsAnalyzing(true);
    setShowModal(true);
    setCrawlData(null);
    setChecksData(null);
    setDiagnosisData(null);
    setCrawlError(null);

    try {
      const res = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url }),
      });

      const json = await res.json();
      if (res.ok && json.success) {
        setCrawlData(json.data);
        setChecksData(json.checks || []);
        setDiagnosisData(json.diagnosis || null);
      } else {
        setCrawlError(json.message || 'Analysis failed.');
      }
    } catch (err: any) {
      setCrawlError(err?.message || 'Unable to complete technical crawl.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setAnalyzingUrl(null);
    setCrawlData(null);
    setChecksData(null);
    setDiagnosisData(null);
    setCrawlError(null);
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 font-sans selection:bg-emerald-500 selection:text-zinc-950 flex flex-col justify-between">
      <div>
        <Header currentLang={lang} onLanguageChange={setLang} />

        {/* Feature Navigation Bar (Precision Technical Suite) */}
        <div className="max-w-6xl mx-auto px-4 sm:px-6 pt-6">
          <div className="bg-zinc-900 border border-zinc-800 p-1 rounded-lg inline-flex items-center gap-1">
            <button
              onClick={() => setActiveTab('technical')}
              className={`px-3.5 py-1.5 rounded-md text-xs font-mono font-bold transition-all flex items-center gap-2 cursor-pointer ${
                activeTab === 'technical'
                  ? 'bg-zinc-800 text-emerald-400 border border-zinc-700/80 shadow-sm'
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/40'
              }`}
            >
              <Activity className="w-3.5 h-3.5" />
              <span>{t.nav.technical}</span>
            </button>

            <button
              onClick={() => setActiveTab('ai_visibility')}
              className={`px-3.5 py-1.5 rounded-md text-xs font-mono font-bold transition-all flex items-center gap-2 cursor-pointer ${
                activeTab === 'ai_visibility'
                  ? 'bg-zinc-800 text-emerald-400 border border-zinc-700/80 shadow-sm'
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/40'
              }`}
            >
              <Bot className="w-3.5 h-3.5 text-amber-400" />
              <span>{t.nav.aiVisibility} ({t.issuesOverview.experimental})</span>
            </button>
          </div>
        </div>

        <main className="max-w-6xl mx-auto px-4 sm:px-6 py-6">
          {activeTab === 'technical' ? (
            <div className="space-y-10">
              <HeroSection
                currentLang={lang}
                onStartAnalysis={handleStartAnalysis}
                isAnalyzing={isAnalyzing}
              />
              <ChecksOverview currentLang={lang} />
              <PhilosophyBanner currentLang={lang} />
              <MonitoringDashboard currentLang={lang} initialUrl={analyzingUrl || ''} />
            </div>
          ) : (
            <AIVisibilityDashboard currentLang={lang} initialUrl={analyzingUrl || 'crawlsignal.com'} />
          )}
        </main>
      </div>

      <Footer currentLang={lang} />
      <InternalMetricsDashboard currentLang={lang} />

      {/* Scanner Progress / Ready Modal */}
      {showModal && analyzingUrl && (
        <ScannerModal
          url={analyzingUrl}
          currentLang={lang}
          crawlData={crawlData}
          checksData={checksData}
          diagnosisData={diagnosisData}
          crawlError={crawlError}
          isAnalyzing={isAnalyzing}
          onClose={handleCloseModal}
        />
      )}
    </div>
  );
}
