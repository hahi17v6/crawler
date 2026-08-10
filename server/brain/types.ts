export type IssueDifficulty = 'Easy' | 'Medium' | 'Hard';

export interface StructuredIssue {
  id: string;
  title: string;
  observed: string; // What we actually measured
  inference: string; // What it may mean
  action: string; // What the user should do
  impact: 'Critical' | 'High' | 'Medium' | 'Low';
  difficulty: IssueDifficulty;
  confidence: 'High' | 'Medium' | 'Low';
  checkCategory: string;
  priorityScore: number;
}

export interface BrainDiagnosisOutput {
  primaryIssue: StructuredIssue | null;
  otherIssues: StructuredIssue[];
  passedChecksCount: number;
  passedChecks: { id: string; name: string; evidence: string }[];
  summaryMessage: string;
}
