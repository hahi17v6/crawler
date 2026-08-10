export type SupportedLanguage = 'en' | 'fr' | 'es';

export interface TranslationDictionary {
  brandName: string;
  tagline: string;
  heroTitle: string;
  heroSubtitle: string;
  inputPlaceholder: string;
  analyzeButton: string;
  analyzingButton: string;
  invalidUrlError: string;
  serverError: string;
  checkSectionTitle: string;
  checkSectionSubtitle: string;
  checks: {
    robots: {
      title: string;
      desc: string;
    };
    sitemap: {
      title: string;
      desc: string;
    };
    indexability: {
      title: string;
      desc: string;
    };
    canonical: {
      title: string;
      desc: string;
    };
    http: {
      title: string;
      desc: string;
    };
    links: {
      title: string;
      desc: string;
    };
  };
  philosophyTitle: string;
  philosophyBadge: string;
  philosophyDescription: string;
  philosophyComparison: {
    bad: string;
    good: string;
  };
  scanningModal: {
    title: string;
    subtitle: string;
    step1: string;
    step2: string;
    step3: string;
    step4: string;
    stepComplete: string;
    readyNoticeTitle: string;
    readyNoticeDesc: string;
    closeModal: string;
  };
  footerRights: string;
  footerMotto: string;
  nav: {
    technical: string;
    aiVisibility: string;
  };
  issuesOverview: {
    auditSummary: string;
    title: string;
    target: string;
    critical: string;
    warnings: string;
    warning: string;
    info: string;
    passed: string;
    excellent: string;
    excellentDesc: string;
    noCriticalTitle: string;
    noCriticalDesc: string;
    noWarnings: string;
    topPriorities: string;
    showingTop: string;
    whatWeFound: string;
    whyItMatters: string;
    recommendation: string;
    whatWeFoundShort: string;
    whyItMattersShort: string;
    recommendationShort: string;
    hideExtraIssues: string;
    viewAllIssues: string;
    additionalTechnicalIssues: string;
    passedChecks: string;
    aiVisibilitySignals: string;
    experimental: string;
    aiCrawlerAccess: string;
    llmsTxtFile: string;
    structuredContent: string;
    machineReadableData: string;
    noLlmsTxtDesc: string;
    fixHighestImpact: string;
    improveVisibility: string;
    websiteHealthy: string;
    fixPlanDesc: string;
    monitoringDesc: string;
    unlockFullDiagnosis: string;
    startMonitoringCta: string;
    detailedFixFooter: string;
    enterEmailPlaceholder: string;
    redirectingStripe: string;
    oneTime: string;
    perMonth: string;
    difficulty: string;
  };
  fixPlan: {
    title: string;
    fullDiagnosisBadge: string;
    savePdf: string;
    top3Title: string;
    priorityFix: string;
    evidence: string;
    impact: string;
    action: string;
    verify: string;
    allChecksPassed: string;
    remainingItems: string;
    deepCrawlTitle: string;
    pagesSampled: string;
    sitemapUrls: string;
    internalLinks: string;
    duplicateTitles: string;
    thinContent: string;
    httpErrors: string;
    loadFullDiagnosis: string;
    generating: string;
    paidBadge: string;
    auditComplete: string;
    alertTitle: string;
    rawJson: string;
    expand: string;
  };
  monitoring: {
    badge: string;
    price: string;
    title: string;
    subtitle: string;
    subscribeTitle: string;
    subscribeSubtitle: string;
    urlLabel: string;
    emailLabel: string;
    feature1: string;
    feature2: string;
    startCta: string;
    redirecting: string;
    trialBadge: string;
    trialText: string;
    trialDaysRemaining: string;
    statusTrialing: string;
    statusActive: string;
    statusPastDue: string;
    statusUnpaid: string;
    statusCanceled: string;
    cancelScheduled: string;
    cancelBtn: string;
    reactivateBtn: string;
    manageBillingBtn: string;
    canceling: string;
    activeBadge: string;
    lastScan: string;
    pending: string;
    runScanNow: string;
    alertsTitle: string;
    whatChanged: string;
    whyItMatters: string;
    whatToDo: string;
    noAlerts: string;
    historyTitle: string;
    sampledPages: string;
    alertsCount: string;
    alertCountOne: string;
    clean: string;
    noHistory: string;
    perMonth: string;
    sitemapUrls: string;
    // Cancellation confirmation dialog
    cancelConfirmTitle: string;
    cancelConfirmBody: string;
    cancelConfirmDate: string;
    cancelConfirmNoCharge: string;
    cancelConfirmBtn: string;
    cancelKeepBtn: string;
    // Next payment / billing cycle
    nextPaymentLabel: string;
    firstPaymentLabel: string;
    trialEndsLabel: string;
    nextPaymentAmount: string;
    // Canceled state
    statusCanceledTitle: string;
    statusCanceledBody: string;
    restartMonitoringBtn: string;
    // Payment failure guidance
    paymentFailedAction: string;
  };
  aiVisibility: {
    disclaimerTitle: string;
    disclaimerBadge: string;
    disclaimerText: string;
    title: string;
    subtitle: string;
    urlLabel: string;
    brandLabel: string;
    runSample: string;
    sampling: string;
    allQueries: string;
    category: string;
    problem: string;
    comparison: string;
    alternative: string;
    useCase: string;
    transactional: string;
    filterMissing: string;
    query: string;
    intentCategory: string;
    mention: string;
    citation: string;
    mentionedYes: string;
    mentionedNo: string;
    scoreLabel: string;
    confidenceLabel: string;
    queriesAnalyzed: string;
    competitorShares: string;
    noData: string;
    queriesMissing: string;
    opportunities: string;
    observedPatternsTitle: string;
    competitorsLabel: string;
  };
  internalMetrics: {
    buttonLabel: string;
    title: string;
    subtitle: string;
    refresh: string;
    close: string;
    conversionFunnel: string;
    recentEvents: string;
    stepAnalysis: string;
    stepResult: string;
    stepEmail: string;
    stepCheckout: string;
    stepPurchase: string;
    stepReport: string;
    stepMonitoring: string;
  };
  checksMap: Record<string, string>;
}

export interface ScanStatusStep {
  id: number;
  labelKey: keyof TranslationDictionary['scanningModal'];
  detailKey?: string;
  done: boolean;
  active: boolean;
}

export interface DiagnosticSummary {
  url: string;
  hostname: string;
  status: 'QUEUED' | 'ANALYZING' | 'READY';
  timestamp: string;
}

