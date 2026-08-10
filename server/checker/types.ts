export type CheckStatus = 'pass' | 'warning' | 'critical';
export type CheckSeverity = 'low' | 'medium' | 'high' | 'critical';
export type CheckConfidence = 'high' | 'medium' | 'low';

export interface CheckResult {
  id: string;
  name: string;
  category: 'http' | 'robots' | 'sitemap' | 'indexability' | 'canonical' | 'links' | 'rendering' | 'crawlability';
  status: CheckStatus;
  severity: CheckSeverity;
  evidence: string;
  explanation: string;
  recommended_action: string;
  confidence: CheckConfidence;
}
