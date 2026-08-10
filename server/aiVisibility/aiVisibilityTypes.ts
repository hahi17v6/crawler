export type QueryCategory =
  | 'category'
  | 'problem'
  | 'comparison'
  | 'alternative'
  | 'use_case'
  | 'transactional';

export interface QuerySampleItem {
  id: string;
  query: string;
  category: QueryCategory;
  brandMentioned: boolean;
  competitorsMentioned: string[];
  citedUrls: string[];
  citationPresent: boolean;
  sampleResponseSnippet?: string;
}

export interface CompetitorShare {
  name: string;
  mentionedCount: number;
  totalQueries: number;
  sharePct: number;
}

export interface AIVisibilityResult {
  brandName: string;
  domain: string;
  totalQueriesEvaluated: number; // e.g. 30
  mentionedQueriesCount: number; // e.g. 18 -> "18 / 30 relevant queries"
  mentionRatePct: number;
  citationRatePct: number;
  competitorShares: CompetitorShare[];
  queries: QuerySampleItem[];
  missingQueries: QuerySampleItem[];
  confidenceLevel: 'Low' | 'Medium' | 'High';
  confidenceExplanation: string;
  observedPatterns: {
    type: 'likely_signal' | 'possible_factor' | 'observed_pattern';
    label: string;
    description: string;
  }[];
  platform: string;
  timestamp: string;
}
