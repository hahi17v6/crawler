import { SupportedLanguage, TranslationDictionary } from '../types';

export const translations: Record<SupportedLanguage, TranslationDictionary> = {
  en: {
    brandName: "CrawlSignal",
    tagline: "Diagnosis > Audit",
    heroTitle: "Why isn't Google showing your website?",
    heroSubtitle: "Paste your URL. We'll find the biggest problems preventing search engines from discovering your site.",
    inputPlaceholder: "https://yourwebsite.com",
    analyzeButton: "Analyze my website",
    analyzingButton: "Analyzing website...",
    invalidUrlError: "Please enter a valid URL (e.g. example.com or https://example.com)",
    serverError: "Unable to reach the diagnostic server. Please try again.",
    checkSectionTitle: "What we check",
    checkSectionSubtitle: "We inspect the core technical factors that directly determine whether search crawlers can discover, access, and index your pages.",
    checks: {
      robots: {
        title: "robots.txt Directives",
        desc: "Checks for Disallow rules blocking search engines from crawling key pages."
      },
      sitemap: {
        title: "XML Sitemap",
        desc: "Verifies whether crawlers can locate your URL structure and latest updates."
      },
      indexability: {
        title: "Indexability & Meta Tags",
        desc: "Detects noindex directives or X-Robots headers hiding pages from search results."
      },
      canonical: {
        title: "Canonical Tags",
        desc: "Identifies missing or conflicting canonical tags causing duplicate content issues."
      },
      http: {
        title: "HTTP Status & Headers",
        desc: "Catches 404 errors, server timeouts, redirect chains, and SSL configuration issues."
      },
      links: {
        title: "Internal Link Structure",
        desc: "Finds orphan pages cut off from navigation and broken links that stop crawlers."
      }
    },
    philosophyTitle: "Diagnosis > Audit",
    philosophyBadge: "Approach",
    philosophyDescription: "Most tools flood you with dozens of minor warnings. We pinpoint the few critical technical issues actually blocking search engines.",
    philosophyComparison: {
      bad: "\"We found 73 SEO issues on your website.\"",
      good: "\"We found 3 things blocking indexation. Fix this one first.\""
    },
    scanningModal: {
      title: "Diagnostic in progress",
      subtitle: "Inspecting technical reachability and indexability factors...",
      step1: "1. Testing HTTP reachability & domain response",
      step2: "2. Fetching robots.txt & XML sitemap",
      step3: "3. Inspecting meta tags & canonical headers",
      step4: "4. Verifying HTTP status codes & link paths",
      stepComplete: "Analysis Complete",
      readyNoticeTitle: "Diagnostic System Ready",
      readyNoticeDesc: "Analysis sequence prepared for",
      closeModal: "Close"
    },
    footerRights: "All rights reserved.",
    footerMotto: "Fix the #1 visibility blocker first.",
    nav: {
      technical: "Technical Diagnostic",
      aiVisibility: "AI Visibility"
    },
    issuesOverview: {
      auditSummary: "Audit Summary",
      title: "ISSUES OVERVIEW",
      target: "Target",
      critical: "Critical",
      warnings: "Warnings",
      warning: "Warning",
      info: "Info",
      passed: "Passed",
      excellent: "EXCELLENT",
      excellentDesc: "No issues were detected across the checks performed by CrawlSignal. Your technical foundation is healthy.",
      noCriticalTitle: "No critical issues detected",
      noCriticalDesc: "Your site does not currently show any critical issues based on the checks CrawlSignal performed.",
      noWarnings: "No warnings detected.",
      topPriorities: "TOP PRIORITIES",
      showingTop: "Showing top",
      whatWeFound: "What we found (Observed)",
      whyItMatters: "Why it matters (Inference)",
      recommendation: "Recommendation (Action)",
      whatWeFoundShort: "What we found",
      whyItMattersShort: "Why it matters",
      recommendationShort: "Recommendation",
      hideExtraIssues: "Hide extra issues",
      viewAllIssues: "View all issues",
      additionalTechnicalIssues: "Additional Technical Issues",
      passedChecks: "PASSED CHECKS",
      aiVisibilitySignals: "AI VISIBILITY SIGNALS",
      experimental: "Experimental",
      aiCrawlerAccess: "AI crawler access",
      llmsTxtFile: "llms.txt file",
      structuredContent: "Structured content",
      machineReadableData: "Machine-readable data",
      noLlmsTxtDesc: "No llms.txt file was detected. This may limit the amount of structured guidance available to AI crawlers.",
      fixHighestImpact: "Fix your highest-impact issues",
      improveVisibility: "Improve your website visibility",
      websiteHealthy: "Your website looks healthy",
      fixPlanDesc: "Get the complete Fix Plan for this website with step-by-step developer code snippets & verification steps.",
      monitoringDesc: "Start weekly monitoring to detect future visibility issues before search crawlers do.",
      unlockFullDiagnosis: "Unlock Full Diagnosis — $11",
      startMonitoringCta: "Start Monitoring — $25/month",
      detailedFixFooter: "🔒 Detailed fix — Get the exact implementation steps and complete Fix Plan. Powered by Stripe Checkout.",
      enterEmailPlaceholder: "Enter your email address...",
      redirectingStripe: "Redirecting to Stripe...",
      oneTime: "one-time",
      perMonth: "/month",
      difficulty: "Diff"
    },
    fixPlan: {
      title: "FULL DIAGNOSIS & FIX PLAN",
      fullDiagnosisBadge: "Unlocked Report",
      savePdf: "Download PDF Fix Plan",
      top3Title: "TOP 3 PRIORITY FIXES",
      priorityFix: "Priority Fix",
      evidence: "Evidence / Observed:",
      impact: "Impact Level:",
      action: "Recommended Action:",
      verify: "How to Verify:",
      allChecksPassed: "All technical checks passed successfully!",
      remainingItems: "REMAINING TECHNICAL CHECKS",
      deepCrawlTitle: "DEEP CRAWL SAMPLING DATA",
      pagesSampled: "Pages Sampled",
      sitemapUrls: "Sitemap URLs",
      internalLinks: "Internal Links",
      duplicateTitles: "Duplicate Titles",
      thinContent: "Thin Content Pages",
      httpErrors: "HTTP Error Pages",
      loadFullDiagnosis: "Loading Diagnosis...",
      generating: "Generating complete Fix Plan...",
      paidBadge: "Paid Access Verified",
      auditComplete: "Diagnostic Completed",
      alertTitle: "Full Website Diagnosis Unlocked",
      rawJson: "Raw Technical Crawl Data",
      expand: "Click to inspect raw JSON output"
    },
    monitoring: {
      badge: "Automated Protection",
      price: "$25 / month",
      title: "WEEKLY CRAWL & ALERT MONITORING",
      subtitle: "Detect indexability regressions, broken canonicals, and crawler blocks before search engines drop your traffic.",
      subscribeTitle: "Start Weekly Monitoring",
      subscribeSubtitle: "Continuous technical watch for your domain.",
      urlLabel: "Website URL",
      emailLabel: "Notification Email",
      feature1: "Automatic weekly technical crawl of key pages",
      feature2: "Instant email alert when new critical blockers appear",
      startCta: "Start Monitoring — $25/month",
      redirecting: "Redirecting to Stripe...",
      trialBadge: "7-Day Free Trial",
      trialText: "7-day free trial, then $25/month",
      trialDaysRemaining: "Free trial — {days} days remaining",
      statusTrialing: "Free Trial Active",
      statusActive: "Monitoring Active",
      statusPastDue: "Payment Past Due — Action Required",
      statusUnpaid: "Payment Failed — Monitoring Suspended",
      statusCanceled: "Subscription Canceled",
      cancelScheduled: "Your subscription will cancel on {date}. Monitoring remains active until then.",
      cancelBtn: "Cancel subscription",
      reactivateBtn: "Reactivate subscription",
      manageBillingBtn: "Manage billing",
      canceling: "Processing...",
      activeBadge: "Active Protection",
      lastScan: "Last scan",
      pending: "Pending first run",
      runScanNow: "Run Scan Now",
      alertsTitle: "RECENT RECENT ALERTS & CHANGES",
      whatChanged: "What Changed:",
      whyItMatters: "Why It Matters:",
      whatToDo: "What To Do:",
      noAlerts: "No active alerts. Your site structure is stable.",
      historyTitle: "WEEKLY AUDIT HISTORY",
      sampledPages: "sampled pages",
      alertsCount: "alerts",
      alertCountOne: "alert",
      clean: "Clean",
      noHistory: "No audit history yet.",
      perMonth: "month",
      sitemapUrls: "sitemap URLs",
      cancelConfirmTitle: "Cancel your subscription?",
      cancelConfirmBody: "Your subscription will not renew. Monitoring remains active until the end of the current period. No further charge will be made after that date.",
      cancelConfirmDate: "Monitoring active until: {date}",
      cancelConfirmNoCharge: "No new payment after this date.",
      cancelConfirmBtn: "Yes, cancel subscription",
      cancelKeepBtn: "Keep my subscription",
      nextPaymentLabel: "Next payment",
      firstPaymentLabel: "First payment",
      trialEndsLabel: "Free trial ends",
      nextPaymentAmount: "${amount}/month",
      statusCanceledTitle: "Monitoring Disabled",
      statusCanceledBody: "Your monitoring subscription has ended. Start a new subscription to resume weekly scans and alerts.",
      restartMonitoringBtn: "Start Monitoring",
      paymentFailedAction: "Update your payment method via \"Manage billing\" to restore monitoring."
    },
    aiVisibility: {
      disclaimerTitle: "AIVisibility Experimental Signal",
      disclaimerBadge: "Notice",
      disclaimerText: "AI bot citations and mentions vary by model version and search context. Results show observed patterns across benchmark queries.",
      title: "AI ENGINE VISIBILITY BENCHMARK",
      subtitle: "Evaluate how AI search models (ChatGPT, Gemini, Perplexity) discover and cite your brand.",
      urlLabel: "Domain / URL",
      brandLabel: "Brand / Product Name",
      runSample: "Run AI Benchmark",
      sampling: "Sampling LLM outputs...",
      allQueries: "Benchmark Queries",
      category: "Category",
      problem: "Problem Exploration",
      comparison: "Brand Comparison",
      alternative: "Alternative Search",
      useCase: "Use-case Recommendation",
      transactional: "Transactional Query",
      filterMissing: "Filter: Missing Citations Only",
      query: "Query",
      intentCategory: "Category",
      mention: "Brand Mentioned",
      citation: "Link Cited",
      mentionedYes: "Yes",
      mentionedNo: "No",
      scoreLabel: "AI Visibility Ratio",
      confidenceLabel: "Confidence Level",
      queriesAnalyzed: "Benchmark Queries Analyzed",
      competitorShares: "Competitor Share in Benchmark",
      noData: "Run a sample benchmark to inspect AI engine visibility.",
      queriesMissing: "Queries Missing",
      opportunities: "Opportunities",
      observedPatternsTitle: "Observed Patterns & Likely Signals",
      competitorsLabel: "Competitors:"
    },
    internalMetrics: {
      buttonLabel: "Internal Telemetry",
      title: "CrawlSignal Telemetry & Funnel",
      subtitle: "Real-time usage analytics and conversion funnel.",
      refresh: "Refresh Data",
      close: "Close",
      conversionFunnel: "CONVERSION FUNNEL",
      recentEvents: "RECENT SYSTEM EVENTS",
      stepAnalysis: "Analysis Started",
      stepResult: "Results Displayed",
      stepEmail: "Email Captured",
      stepCheckout: "Checkout Initiated",
      stepPurchase: "Purchase Completed",
      stepReport: "Report Viewed",
      stepMonitoring: "Monitoring Active"
    },
    checksMap: {
      robots_txt: "robots.txt Directives",
      sitemap: "XML Sitemap",
      noindex: "Meta Robots & Indexability",
      canonical: "Canonical Tag Configuration",
      http_status: "HTTP Response & SSL Status",
      internal_links: "Internal Link Structure",
      js_rendering: "JavaScript Client-Side Rendering",
      soft_404: "Soft 404 & Error Handling",
      crawlability: "Server Response & Reachability",
      llms_txt: "llms.txt AI File"
    }
  },
  fr: {
    brandName: "CrawlSignal",
    tagline: "Diagnostic > Audit",
    heroTitle: "Pourquoi Google n'affiche-t-il pas votre site web ?",
    heroSubtitle: "Collez votre URL. Nous identifions les problèmes majeurs qui empêchent les moteurs de recherche de découvrir votre site.",
    inputPlaceholder: "https://votersite.com",
    analyzeButton: "Analyser mon site web",
    analyzingButton: "Analyse du site en cours...",
    invalidUrlError: "Veuillez entrer une URL valide (ex. exemple.com ou https://exemple.com)",
    serverError: "Impossible de contacter le serveur de diagnostic. Veuillez réessayer.",
    checkSectionTitle: "Éléments analysés",
    checkSectionSubtitle: "Nous vérifions les facteurs techniques fondamentaux qui conditionnent l'accès et l'indexation par les moteurs de recherche.",
    checks: {
      robots: {
        title: "Directives robots.txt",
        desc: "Détecte les règles de blocage Disallow qui empêchent le crawl des pages clés."
      },
      sitemap: {
        title: "Sitemap XML",
        desc: "Vérifie si les moteurs de recherche trouvent le plan complet de votre site."
      },
      indexability: {
        title: "Indexabilité & Balises Meta",
        desc: "Repère les directives noindex ou en-têtes masquant vos pages aux moteurs."
      },
      canonical: {
        title: "Balises Canoniques",
        desc: "Identifie les erreurs ou conflits de balises canonical provoquant du contenu dupliqué."
      },
      http: {
        title: "Codes HTTP & Erreurs",
        desc: "Détecte les erreurs 404, erreurs 500, boucles de redirection et problèmes SSL."
      },
      links: {
        title: "Maillage Interne",
        desc: "Isole les pages orphelines et les liens cassés qui bloquent les robots d'exploration."
      }
    },
    philosophyTitle: "Diagnostic > Audit",
    philosophyBadge: "Notre approche",
    philosophyDescription: "Plutôt que de générer des listes interminables d'avertissements mineurs, nous identifions les rares points bloquants prioritaires.",
    philosophyComparison: {
      bad: "\"Nous avons trouvé 73 problèmes SEO sur votre site.\"",
      good: "\"Voici les 3 blocages majeurs. Corrigez celui-ci en priorité.\""
    },
    scanningModal: {
      title: "Diagnostic en cours",
      subtitle: "Inspection des facteurs d'accès et d'indexation...",
      step1: "1. Vérification de la réponse HTTP du domaine",
      step2: "2. Analyse du fichier robots.txt & du sitemap XML",
      step3: "3. Inspection des balises meta & balises canonical",
      step4: "4. Contrôle des codes de statut & du maillage interne",
      stepComplete: "Analyse terminée",
      readyNoticeTitle: "Système de diagnostic prêt",
      readyNoticeDesc: "Séquence d'analyse établie pour",
      closeModal: "Fermer"
    },
    footerRights: "Tous droits réservés.",
    footerMotto: "Corrigez le blocage N°1 en priorité.",
    nav: {
      technical: "Diagnostic Technique",
      aiVisibility: "Visibilité IA"
    },
    issuesOverview: {
      auditSummary: "Résumé de l'audit",
      title: "VUE D'ENSEMBLE DES PROBLÈMES",
      target: "Cible",
      critical: "Critique",
      warnings: "Avertissements",
      warning: "Avertissement",
      info: "Info",
      passed: "Validé",
      excellent: "EXCELLENT",
      excellentDesc: "Aucun problème n'a été détecté lors des vérifications effectuées par CrawlSignal. Votre socle technique est sain.",
      noCriticalTitle: "Aucun problème critique détecté",
      noCriticalDesc: "Votre site ne présente actuellement aucun problème critique selon les tests exécutés par CrawlSignal.",
      noWarnings: "Aucun avertissement détecté.",
      topPriorities: "PRIORITÉS MAJEURES",
      showingTop: "Affichage du top",
      whatWeFound: "Ce qui a été trouvé (Observé)",
      whyItMatters: "Pourquoi c'est important (Inférence)",
      recommendation: "Recommandation (Action)",
      whatWeFoundShort: "Ce qui a été trouvé",
      whyItMattersShort: "Pourquoi c'est important",
      recommendationShort: "Recommandation",
      hideExtraIssues: "Masquer les autres problèmes",
      viewAllIssues: "Voir tous les problèmes",
      additionalTechnicalIssues: "Problèmes techniques secondaires",
      passedChecks: "TESTS VALIDÉS",
      aiVisibilitySignals: "SIGNAUX DE VISIBILITÉ IA",
      experimental: "Expérimental",
      aiCrawlerAccess: "Accès des robots IA",
      llmsTxtFile: "Fichier llms.txt",
      structuredContent: "Contenu structuré",
      machineReadableData: "Données lisibles par machine",
      noLlmsTxtDesc: "Aucun fichier llms.txt n'a été détecté. Cela peut limiter le niveau de guidage structuré fourni aux robots IA.",
      fixHighestImpact: "Corrigez vos problèmes prioritaires",
      improveVisibility: "Améliorez la visibilité de votre site",
      websiteHealthy: "Votre site web semble en parfaite santé",
      fixPlanDesc: "Obtenez le Plan de Correctifs complet avec extraits de code développeur & étapes de vérification.",
      monitoringDesc: "Activez le suivi hebdomadaire pour détecter les régressions avant les moteurs de recherche.",
      unlockFullDiagnosis: "Débloquer le Diagnostic Complet — 11 $",
      startMonitoringCta: "Activer la Surveillance — 25 $/mois",
      detailedFixFooter: "🔒 Correctif détaillé — Obtenez les instructions d'implémentation exactes. Sécurisé par Stripe.",
      enterEmailPlaceholder: "Entrez votre adresse email...",
      redirectingStripe: "Redirection vers Stripe...",
      oneTime: "paiement unique",
      perMonth: "/mois",
      difficulty: "Diff"
    },
    fixPlan: {
      title: "DIAGNOSTIC COMPLET & PLAN DE CORRECTIFS",
      fullDiagnosisBadge: "Rapport Débloqué",
      savePdf: "Télécharger le Plan PDF",
      top3Title: "TOP 3 DES CORRECTIFS PRIORITAIRES",
      priorityFix: "Correctif Prioritaire",
      evidence: "Preuve / Observation :",
      impact: "Niveau d'impact :",
      action: "Action recommandée :",
      verify: "Comment vérifier :",
      allChecksPassed: "Tous les tests techniques ont été validés avec succès !",
      remainingItems: "AUTRES VÉRIFICATIONS TECHNIQUES",
      deepCrawlTitle: "DONNÉES D'ÉCHANTILLONNAGE DE CRAWL",
      pagesSampled: "Pages échantillonnées",
      sitemapUrls: "URLs du Sitemap",
      internalLinks: "Liens internes",
      duplicateTitles: "Titres dupliqués",
      thinContent: "Pages à contenu faible",
      httpErrors: "Pages en erreur HTTP",
      loadFullDiagnosis: "Chargement du diagnostic...",
      generating: "Génération du plan de correctifs complet...",
      paidBadge: "Accès Réglé Vérifié",
      auditComplete: "Diagnostic Terminé",
      alertTitle: "Diagnostic Complet Débloqué",
      rawJson: "Données Brutes du Crawl",
      expand: "Cliquer pour inspecter le JSON brut"
    },
    monitoring: {
      badge: "Protection Automatisée",
      price: "25 $ / mois",
      title: "SURVEILLANCE HEBDOMADAIRE & ALERTES",
      subtitle: "Détectez les régressions d'indexabilité, balises canonicals cassées et blocages avant la baisse de votre trafic.",
      subscribeTitle: "Activer la Surveillance Hebdomadaire",
      subscribeSubtitle: "Veille technique continue pour votre domaine.",
      urlLabel: "URL du site web",
      emailLabel: "Email de notification",
      feature1: "Crawl technique hebdomadaire automatique de vos pages clés",
      feature2: "Alerte email instantanée lors de l'apparition d'un nouveau blocage",
      startCta: "Activer la Surveillance — 25 $/mois",
      redirecting: "Redirection vers Stripe...",
      trialBadge: "Essai Gratuit 7 Jours",
      trialText: "7 jours d'essai gratuit, puis 25 $/mois",
      trialDaysRemaining: "Essai gratuit — {days} jours restants",
      statusTrialing: "Essai gratuit actif",
      statusActive: "Monitoring actif",
      statusPastDue: "Paiement en retard — Action requise",
      statusUnpaid: "Paiement échoué — Monitoring suspendu",
      statusCanceled: "Abonnement résilié",
      cancelScheduled: "Votre abonnement sera résilié le {date}. Le monitoring reste actif jusque-là.",
      cancelBtn: "Résilier mon abonnement",
      reactivateBtn: "Réactiver mon abonnement",
      manageBillingBtn: "Gérer le paiement",
      canceling: "Traitement...",
      activeBadge: "Protection Active",
      lastScan: "Dernier scan",
      pending: "En attente du premier lancement",
      runScanNow: "Lancer un scan maintenant",
      alertsTitle: "ALERTES ET CHANGEMENTS RÉCENTS",
      whatChanged: "Ce qui a changé :",
      whyItMatters: "Pourquoi c'est important :",
      whatToDo: "Que faire :",
      noAlerts: "Aucune alerte active. La structure de votre site est stable.",
      historyTitle: "HISTORIQUE DES AUDITS HEBDOMADAIRES",
      sampledPages: "pages analysées",
      alertsCount: "alertes",
      alertCountOne: "alerte",
      clean: "Conforme",
      noHistory: "Aucun historique d'audit pour le moment.",
      perMonth: "mois",
      sitemapUrls: "URLs de sitemap",
      cancelConfirmTitle: "Résilier votre abonnement ?",
      cancelConfirmBody: "Votre abonnement ne sera pas renouvelé. Le monitoring reste actif jusqu'à la fin de la période en cours. Aucun paiement ne sera effectué après cette date.",
      cancelConfirmDate: "Monitoring actif jusqu'au : {date}",
      cancelConfirmNoCharge: "Aucun nouveau paiement après cette date.",
      cancelConfirmBtn: "Oui, résilier mon abonnement",
      cancelKeepBtn: "Conserver mon abonnement",
      nextPaymentLabel: "Prochain paiement",
      firstPaymentLabel: "Premier paiement",
      trialEndsLabel: "Fin de l'essai gratuit",
      nextPaymentAmount: "{amount} $/mois",
      statusCanceledTitle: "Monitoring désactivé",
      statusCanceledBody: "Votre abonnement de monitoring a pris fin. Démarrez un nouvel abonnement pour reprendre les scans et alertes hebdomadaires.",
      restartMonitoringBtn: "Activer le Monitoring",
      paymentFailedAction: "Mettez à jour votre moyen de paiement via \"Gérer le paiement\" pour rétablir le monitoring."
    },
    aiVisibility: {
      disclaimerTitle: "Signal Expérimental Visibilité IA",
      disclaimerBadge: "Avis",
      disclaimerText: "Les citations par les moteurs IA varient selon les modèles. Les résultats présentent des tendances observées sur des requêtes types.",
      title: "BENCHMARK DE VISIBILITÉ MOTEURS IA",
      subtitle: "Évaluez comment les moteurs de recherche IA (ChatGPT, Gemini, Perplexity) citent votre marque.",
      urlLabel: "Domaine / URL",
      brandLabel: "Nom de la marque / Produit",
      runSample: "Lancer le Benchmark IA",
      sampling: "Échantillonnage des réponses LLM...",
      allQueries: "Requêtes de Test",
      category: "Catégorie",
      problem: "Recherche de Problème",
      comparison: "Comparaison de Marque",
      alternative: "Recherche d'Alternative",
      useCase: "Recommandation d'Usage",
      transactional: "Requête Transactionnelle",
      filterMissing: "Filtrer : Citations Manquantes Seules",
      query: "Requête",
      intentCategory: "Catégorie",
      mention: "Marque Mentionnée",
      citation: "Lien Cité",
      mentionedYes: "Oui",
      mentionedNo: "Non",
      scoreLabel: "Taux de Visibilité IA",
      confidenceLabel: "Niveau de Confiance",
      queriesAnalyzed: "Requêtes de Test Analysées",
      competitorShares: "Part des Concurrents dans le Benchmark",
      noData: "Lancez un benchmark pour analyser la visibilité sur les moteurs IA.",
      queriesMissing: "Requêtes Manquantes",
      opportunities: "Opportunités",
      observedPatternsTitle: "Tendances Observées & Signaux Probables",
      competitorsLabel: "Concurrents :"
    },
    internalMetrics: {
      buttonLabel: "Télémétrie Interne",
      title: "Télémétrie & Ennoir de Conversion",
      subtitle: "Analytique d'utilisation en temps réel et entonnoir.",
      refresh: "Actualiser les données",
      close: "Fermer",
      conversionFunnel: "ENTONNOIR DE CONVERSION",
      recentEvents: "ÉVÉNEMENTS SYSTÈME RÉCENTS",
      stepAnalysis: "Analyse Lancée",
      stepResult: "Résultats Affichés",
      stepEmail: "Email Capturé",
      stepCheckout: "Paiement Initié",
      stepPurchase: "Achat Confirmé",
      stepReport: "Rapport Consulté",
      stepMonitoring: "Surveillance Active"
    },
    checksMap: {
      robots_txt: "Directives robots.txt",
      sitemap: "Sitemap XML",
      noindex: "Balises Meta Robots & Indexabilité",
      canonical: "Balises Canoniques",
      http_status: "Statut HTTP & Configuration SSL",
      internal_links: "Structure du Maillage Interne",
      js_rendering: "Rendu Côté Client JavaScript",
      soft_404: "Gestion des Erreurs & Soft 404",
      crawlability: "Temps de Réponse & Accessibilité Serveur",
      llms_txt: "Fichier IA llms.txt"
    }
  },
  es: {
    brandName: "CrawlSignal",
    tagline: "Diagnóstico > Auditoría",
    heroTitle: "¿Por qué Google no muestra tu sitio web?",
    heroSubtitle: "Pega tu URL. Identificamos los mayores problemas que impiden a los motores de búsqueda descubrir tu sitio.",
    inputPlaceholder: "https://tusitioweb.com",
    analyzeButton: "Analizar mi sitio web",
    analyzingButton: "Analizando sitio web...",
    invalidUrlError: "Por favor, ingresa una URL válida (ej. ejemplo.com o https://ejemplo.com)",
    serverError: "No se pudo conectar con el servidor de diagnóstico. Inténtalo de nuevo.",
    checkSectionTitle: "Lo que verificamos",
    checkSectionSubtitle: "Inspeccionamos los factores técnicos clave que determinan si los rastreadores pueden descubrir e indexar tus páginas.",
    checks: {
      robots: {
        title: "Directivas Robots.txt",
        desc: "Comprueba reglas Disallow que bloquean a los motores de búsqueda en páginas clave."
      },
      sitemap: {
        title: "Mapa del sitio XML",
        desc: "Verifica si los rastreadores pueden localizar tu estructura de URL y cambios recientes."
      },
      indexability: {
        title: "Indexabilidad y Meta Tags",
        desc: "Detecta directivas noindex o encabezados X-Robots que ocultan tus páginas."
      },
      canonical: {
        title: "Etiquetas Canónicas",
        desc: "Identifica etiquetas canónicas ausentes o en conflicto que generan contenido duplicado."
      },
      http: {
        title: "Estado HTTP y Errores",
        desc: "Captura errores 404, fallos del servidor, cadenas de redirección y problemas SSL."
      },
      links: {
        title: "Estructura de Enlaces Internos",
        desc: "Encuentra páginas huérfanas y enlaces rotos que detienen a los rastreadores."
      }
    },
    philosophyTitle: "Diagnóstico > Auditoría",
    philosophyBadge: "Enfoque",
    philosophyDescription: "En lugar de abrumarte con docenas de advertencias menores, aislamos los pocos problemas técnicos que realmente bloquean la indexación.",
    philosophyComparison: {
      bad: "\"Encontramos 73 problemas SEO en tu sitio web.\"",
      good: "\"Encontramos 3 bloqueos críticos. Corrige este primero.\""
    },
    scanningModal: {
      title: "Diagnóstico en curso",
      subtitle: "Inspeccionando factores de acceso e indexabilidad...",
      step1: "1. Comprobando respuesta HTTP y dominio",
      step2: "2. Obteniendo archivo robots.txt y sitemap XML",
      step3: "3. Inspeccionando meta etiquetas y cabeceras canónicas",
      step4: "4. Verificando códigos de estado y rutas internas",
      stepComplete: "Análisis completado",
      readyNoticeTitle: "Sistema de diagnóstico listo",
      readyNoticeDesc: "Secuencia de análisis configurada para",
      closeModal: "Cerrar"
    },
    footerRights: "Todos los derechos reservados.",
    footerMotto: "Corrige el obstáculo #1 primero.",
    nav: {
      technical: "Diagnóstico Técnico",
      aiVisibility: "Visibilidad IA"
    },
    issuesOverview: {
      auditSummary: "Resumen de la Auditoría",
      title: "VISIÓN GENERAL DE PROBLEMAS",
      target: "Objetivo",
      critical: "Crítico",
      warnings: "Advertencias",
      warning: "Advertencia",
      info: "Info",
      passed: "Aprobados",
      excellent: "EXCELENTE",
      excellentDesc: "No se detectaron problemas en las comprobaciones realizadas por CrawlSignal. Tu base técnica es saludable.",
      noCriticalTitle: "No se detectaron problemas críticos",
      noCriticalDesc: "Tu sitio no muestra actualmente problemas críticos según las verificaciones de CrawlSignal.",
      noWarnings: "No se detectaron advertencias.",
      topPriorities: "PRIORIDADES PRINCIPALES",
      showingTop: "Mostrando las principales",
      whatWeFound: "Lo que encontramos (Observado)",
      whyItMatters: "Por qué es importante (Inferencia)",
      recommendation: "Recomendación (Acción)",
      whatWeFoundShort: "Lo que encontramos",
      whyItMattersShort: "Por qué es importante",
      recommendationShort: "Recomendación",
      hideExtraIssues: "Ocultar otros problemas",
      viewAllIssues: "Ver todos los problemas",
      additionalTechnicalIssues: "Problemas técnicos adicionales",
      passedChecks: "PRUEBAS APROBADAS",
      aiVisibilitySignals: "SEÑALES DE VISIBILIDAD IA",
      experimental: "Experimental",
      aiCrawlerAccess: "Acceso de rastreadores IA",
      llmsTxtFile: "Archivo llms.txt",
      structuredContent: "Contenido estructurado",
      machineReadableData: "Datos legibles por máquinas",
      noLlmsTxtDesc: "No se detectó el archivo llms.txt. Esto puede limitar la orientación estructurada disponible para los rastreadores IA.",
      fixHighestImpact: "Corrige tus problemas de mayor impacto",
      improveVisibility: "Mejora la visibilidad de tu sitio web",
      websiteHealthy: "Tu sitio web parece completamente saludable",
      fixPlanDesc: "Obtén el Plan de Soluciones completo con fragmentos de código para desarrolladores y pasos de verificación.",
      monitoringDesc: "Inicia el monitoreo semanal para detectar problemas de visibilidad antes de que lo hagan los motores de búsqueda.",
      unlockFullDiagnosis: "Desbloquear Diagnóstico Completo — $11",
      startMonitoringCta: "Iniciar Monitoreo — $25/mes",
      detailedFixFooter: "🔒 Solución detallada — Obtén las instrucciones de implementación exactas. Protegido por Stripe.",
      enterEmailPlaceholder: "Ingresa tu correo electrónico...",
      redirectingStripe: "Redirigiendo a Stripe...",
      oneTime: "pago único",
      perMonth: "/mes",
      difficulty: "Dif"
    },
    fixPlan: {
      title: "DIAGNÓSTICO COMPLETO Y PLAN DE SOLUCIONES",
      fullDiagnosisBadge: "Informe Desbloqueado",
      savePdf: "Descargar Plan en PDF",
      top3Title: "TOP 3 SOLUCIONES PRIORITARIAS",
      priorityFix: "Solución Prioritaria",
      evidence: "Evidencia / Observado:",
      impact: "Nivel de Impacto:",
      action: "Acción Recomendada:",
      verify: "Cómo Verificar:",
      allChecksPassed: "¡Todas las comprobaciones técnicas fueron aprobadas con éxito!",
      remainingItems: "OTRAS COMPROBACIONES TÉCNICAS",
      deepCrawlTitle: "DATOS DE MUESTREO DEL RASTREO",
      pagesSampled: "Páginas muestreadas",
      sitemapUrls: "URLs en el Sitemap",
      internalLinks: "Enlaces internos",
      duplicateTitles: "Títulos duplicados",
      thinContent: "Páginas de contenido escaso",
      httpErrors: "Páginas con error HTTP",
      loadFullDiagnosis: "Cargando diagnóstico...",
      generating: "Generando Plan de Soluciones completo...",
      paidBadge: "Acceso Pagado Verificado",
      auditComplete: "Diagnóstico Completado",
      alertTitle: "Diagnóstico Completo Desbloqueado",
      rawJson: "Datos Brutos del Rastreo",
      expand: "Haz clic para inspeccionar el JSON bruto"
    },
    monitoring: {
      badge: "Protección Automatizada",
      price: "$25 / mes",
      title: "MONITOREO SEMANAL Y ALERTAS",
      subtitle: "Detecta regresiones de indexabilidad, canónicas rotas y bloqueos antes de que caiga tu tráfico.",
      subscribeTitle: "Iniciar Monitoreo Semanal",
      subscribeSubtitle: "Vigilancia técnica continua para tu dominio.",
      urlLabel: "URL del sitio web",
      emailLabel: "Correo de notificación",
      feature1: "Rastreo técnico semanal automático de tus páginas clave",
      feature2: "Alerta por correo instantánea si aparecen nuevos bloqueos críticos",
      startCta: "Iniciar Monitoreo — $25/mes",
      redirecting: "Redirigiendo a Stripe...",
      trialBadge: "Prueba Gratuita de 7 Días",
      trialText: "7 días de prueba gratuita, luego $25/mes",
      trialDaysRemaining: "Prueba gratuita — {days} días restantes",
      statusTrialing: "Prueba gratuita activa",
      statusActive: "Monitoreo activo",
      statusPastDue: "Pago vencido — Acción requerida",
      statusUnpaid: "Pago fallido — Monitoreo suspendido",
      statusCanceled: "Suscripción cancelada",
      cancelScheduled: "Su suscripción se cancelará el {date}. El monitoreo permanece activo hasta entonces.",
      cancelBtn: "Cancelar suscripción",
      reactivateBtn: "Reactivar suscripción",
      manageBillingBtn: "Gestionar facturación",
      canceling: "Procesando...",
      activeBadge: "Protección Activa",
      lastScan: "Último análisis",
      pending: "Pendiente de la primera ejecución",
      runScanNow: "Ejecutar Análisis Ahora",
      alertsTitle: "ALERTAS Y CAMBIOS RECIENTES",
      whatChanged: "Lo que cambió:",
      whyItMatters: "Por qué es importante:",
      whatToDo: "Qué hacer:",
      noAlerts: "Sin alertas activas. La estructura de tu sitio es estable.",
      historyTitle: "HISTORIAL DE AUDITORÍAS SEMANALES",
      sampledPages: "páginas muestreadas",
      alertsCount: "alertas",
      alertCountOne: "alerta",
      clean: "Correcto",
      noHistory: "Aún no hay historial de auditoría.",
      perMonth: "mes",
      sitemapUrls: "URLs de sitemap",
      cancelConfirmTitle: "¿Cancelar su suscripción?",
      cancelConfirmBody: "Su suscripción no se renovará. El monitoreo permanece activo hasta el final del período actual. No se realizará ningún cargo después de esa fecha.",
      cancelConfirmDate: "Monitoreo activo hasta: {date}",
      cancelConfirmNoCharge: "Sin nuevo pago después de esta fecha.",
      cancelConfirmBtn: "Sí, cancelar suscripción",
      cancelKeepBtn: "Conservar mi suscripción",
      nextPaymentLabel: "Próximo pago",
      firstPaymentLabel: "Primer pago",
      trialEndsLabel: "Fin de la prueba gratuita",
      nextPaymentAmount: "${amount}/mes",
      statusCanceledTitle: "Monitoreo desactivado",
      statusCanceledBody: "Su suscripción de monitoreo ha terminado. Inicie una nueva suscripción para reanudar los análisis y alertas semanales.",
      restartMonitoringBtn: "Iniciar Monitoreo",
      paymentFailedAction: "Actualice su método de pago en \"Gestionar facturación\" para restablecer el monitoreo."
    },
    aiVisibility: {
      disclaimerTitle: "Señal Experimental de Visibilidad IA",
      disclaimerBadge: "Aviso",
      disclaimerText: "Las menciones y citas de los motores IA varían según el modelo. Los resultados muestran patrones observados en consultas de prueba.",
      title: "BENCHMARK DE VISIBILIDAD EN MOTORES IA",
      subtitle: "Evalúa cómo los motores de búsqueda IA (ChatGPT, Gemini, Perplexity) descubren y citan tu marca.",
      urlLabel: "Dominio / URL",
      brandLabel: "Nombre de la Marca / Producto",
      runSample: "Ejecutar Benchmark IA",
      sampling: "Muestreando respuestas LLM...",
      allQueries: "Consultas de Prueba",
      category: "Categoría",
      problem: "Exploración de Problemas",
      comparison: "Comparación de Marcas",
      alternative: "Búsqueda de Alternativas",
      useCase: "Recomendación de Uso",
      transactional: "Consulta Transaccional",
      filterMissing: "Filtrar: Solo Citas Faltantes",
      query: "Consulta",
      intentCategory: "Categoría",
      mention: "Marca Mencionada",
      citation: "Enlace Citado",
      mentionedYes: "Sí",
      mentionedNo: "No",
      scoreLabel: "Tasa de Visibilidad IA",
      confidenceLabel: "Nivel de Confianza",
      queriesAnalyzed: "Consultas de Prueba Analizadas",
      competitorShares: "Cuota de Competidores en Benchmark",
      noData: "Ejecuta un benchmark para inspeccionar la visibilidad en motores IA.",
      queriesMissing: "Consultas Faltantes",
      opportunities: "Oportunidades",
      observedPatternsTitle: "Patrones Observados y Señales Probables",
      competitorsLabel: "Competidores:"
    },
    internalMetrics: {
      buttonLabel: "Telemetría Interna",
      title: "Telemetría y Embudo de CrawlSignal",
      subtitle: "Analítica de uso en tiempo real y embudo de conversión.",
      refresh: "Actualizar datos",
      close: "Cerrar",
      conversionFunnel: "EMBUDO DE CONVERSIÓN",
      recentEvents: "EVENTOS RECIENTES DEL SISTEMA",
      stepAnalysis: "Análisis Iniciado",
      stepResult: "Resultados Mostrados",
      stepEmail: "Correo Capturado",
      stepCheckout: "Pago Iniciado",
      stepPurchase: "Compra Completada",
      stepReport: "Informe Consultado",
      stepMonitoring: "Monitoreo Activo"
    },
    checksMap: {
      robots_txt: "Directivas Robots.txt",
      sitemap: "Mapa del sitio XML",
      noindex: "Meta Robots e Indexabilidad",
      canonical: "Configuración de Etiquetas Canónicas",
      http_status: "Respuesta HTTP y Estado SSL",
      internal_links: "Estructura de Enlaces Internos",
      js_rendering: "Renderizado JavaScript en Cliente",
      soft_404: "Manejo de Errores y Soft 404",
      crawlability: "Tiempo de Respuesta y Accesibilidad",
      llms_txt: "Archivo IA llms.txt"
    }
  }
};

export function detectDeviceLanguage(): SupportedLanguage {
  if (typeof window === 'undefined' || !window.navigator) {
    return 'en';
  }

  const userLangs = window.navigator.languages || [window.navigator.language || ''];
  for (const lang of userLangs) {
    const code = lang.toLowerCase();
    if (code.startsWith('fr')) return 'fr';
    if (code.startsWith('es')) return 'es';
    if (code.startsWith('en')) return 'en';
  }

  return 'en';
}

export function translateDifficulty(diff?: string, lang: SupportedLanguage = 'en'): string {
  if (!diff) return '';
  const lower = diff.toLowerCase().trim();
  const diffMap: Record<SupportedLanguage, Record<string, string>> = {
    en: { easy: 'Easy', medium: 'Medium', hard: 'Hard' },
    fr: { easy: 'Facile', medium: 'Moyen', hard: 'Difficile' },
    es: { easy: 'Fácil', medium: 'Medio', hard: 'Difícil' },
  };
  const langMap = diffMap[lang] || diffMap.en;
  return langMap[lower] || diff;
}

export function translateSeverity(sev?: string, lang: SupportedLanguage = 'en'): string {
  if (!sev) return '';
  const lower = sev.toLowerCase().trim();
  const t = translations[lang] || translations.en;
  const io = t.issuesOverview;

  if (lower === 'critical') return io.critical;
  if (lower === 'warning' || lower === 'warnings' || lower === 'high' || lower === 'medium') return io.warning;
  if (lower === 'info' || lower === 'low') return io.info;
  if (lower === 'pass' || lower === 'passed') return io.passed;

  return sev;
}

export function translateCategory(category?: string, lang: SupportedLanguage = 'en'): string {
  if (!category) return '';
  const t = translations[lang] || translations.en;
  if (!t.checksMap) return category;

  const catLower = category.toLowerCase();

  if (catLower.includes('robots')) return t.checksMap.robots_txt || category;
  if (catLower.includes('sitemap')) return t.checksMap.sitemap || category;
  if (catLower.includes('index') || catLower.includes('noindex')) return t.checksMap.noindex || category;
  if (catLower.includes('canonical')) return t.checksMap.canonical || category;
  if (catLower.includes('http') || catLower.includes('server')) return t.checksMap.http_status || category;
  if (catLower.includes('link')) return t.checksMap.internal_links || category;
  if (catLower.includes('render') || catLower.includes('js')) return t.checksMap.js_rendering || category;
  if (catLower.includes('404')) return t.checksMap.soft_404 || category;
  if (catLower.includes('crawl')) return t.checksMap.crawlability || category;
  if (catLower.includes('llm')) return t.checksMap.llms_txt || category;
  if (catLower.includes('content')) return t.issuesOverview?.structuredContent || category;

  return category;
}
