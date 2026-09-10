export type DocCategory = 'legal' | 'technical' | 'business';

export type DocType =
  // Legal & Regulatory Policies
  | 'privacy-policy'
  | 'terms-of-service'
  | 'cookie-policy'
  | 'refund-policy'
  | 'data-deletion'
  | 'data-retention'
  | 'ai-disclosure'
  | 'security-policy'
  // Technical Documentation
  | 'readme'
  | 'project-overview'
  | 'installation'
  | 'env-guide'
  | 'architecture'
  | 'api-docs'
  | 'schema-docs'
  | 'auth-docs'
  | 'deployment'
  | 'contributing'
  | 'security-docs'
  | 'changelog'
  // Business & Trust Center
  | 'faq'
  | 'support-page'
  | 'security-page';

export interface DocumentItem {
  id: string;
  projectId?: string;
  type: DocType;
  title: string;
  category: DocCategory;
  version: string;
  content: string;
  lastModified: string;
  status: 'draft' | 'reviewed' | 'published';
  wordCount: number;
}

export type ProjectType =
  | 'SaaS'
  | 'website'
  | 'mobile-app'
  | 'api'
  | 'marketplace'
  | 'ai-application'
  | 'other';

export interface ProjectProfile {
  id: string;
  userId?: string;
  name: string;
  description?: string;
  websiteUrl: string;
  githubUrl: string;
  repoOwner?: string;
  repoName?: string;
  defaultBranch?: string;
  isPrivate?: boolean;
  projectType: ProjectType;
  primaryLanguage?: string;
  framework?: string;
  techStack: string[];
  authMethods: string[];
  paymentProviders: string[];
  analyticsProviders: string[];
  aiModels: string[];
  storageProviders?: string[];
  emailProviders?: string[];
  dataCollected: string[];
  complianceScore: number;
  activeVersion: string;
  lastAnalysisDate?: string;
  lastAnalysisStatus?: 'complete' | 'needs_review' | 'pending';
  createdAt: string;
  lastUpdated: string;
  deployedUrls: {
    privacy: string;
    terms: string;
    security: string;
    apiDocs: string;
    publicPortal: string;
  };
}

export interface UserProfile {
  id: string;
  email: string;
  fullName?: string;
  avatarUrl?: string;
  githubUsername?: string;
  provider?: 'github' | 'google' | 'email';
}

export interface GitHubRepo {
  id: number;
  name: string;
  fullName: string;
  owner: {
    login: string;
    avatarUrl: string;
  };
  private: boolean;
  htmlUrl: string;
  description: string | null;
  defaultBranch: string;
  language: string | null;
  stargazersCount: number;
  updatedAt: string;
}

export interface DetectedServiceItem {
  id: string;
  category: 'auth' | 'payments' | 'analytics' | 'ai' | 'storage' | 'email' | 'database' | 'tracking';
  name: string;
  status: 'needs_confirmation' | 'confirmed' | 'rejected';
  confidence: 'high' | 'medium' | 'low';
  details: string;
  matchedLibrary?: string;
  requiresConfirmation: boolean;
}

export interface DataHandlingItem {
  category: 'accounts' | 'profiles' | 'uploads' | 'payments' | 'analytics' | 'ai' | 'logs';
  title: string;
  status: 'confirmed' | 'needs_confirmation' | 'not_applicable';
  detectedEvidence: string;
  userDescription: string;
}

export interface ProjectAnalysis {
  id: string;
  projectId: string;
  commitSha?: string;
  branch?: string;
  projectType: ProjectType;
  technology: string[];
  detectedServices: DetectedServiceItem[];
  dataHandling: DataHandlingItem[];
  detectedEnvVars: string[];
  detectedApiRoutes: string[];
  summary: string;
  scanDate: string;
}

export interface VersionRecord {
  id: string;
  projectId?: string;
  documentId?: string;
  version: string;
  timestamp: string;
  commitSha: string;
  commitMessage: string;
  author: string;
  changesSummary: string;
  docsSnapshot: Record<string, string>;
}

export interface HumanReviewQuestion {
  id: string;
  triggerService?: string;
  detectedTrigger?: string;
  category: 'legal' | 'technical' | 'privacy';
  question: string;
  description: string;
  options: { label: string; value: string; description?: string }[];
  selectedAnswer: string;
  isConfirmed?: boolean;
  affectedDocs: DocType[];
}

export interface ComplianceMissingItem {
  severity: 'high' | 'medium' | 'low';
  title: string;
  regulation: string;
  recommendation: string;
  docTarget: DocType;
}

export interface ComplianceReport {
  overallScore: number;
  gdprScore: number;
  ccpaScore: number;
  coppaScore: number;
  aiActScore: number;
  passedChecks: string[];
  missingItems: ComplianceMissingItem[];
  summary: string;
}

export interface MarketplaceTemplate {
  id: string;
  title: string;
  description: string;
  category: 'SaaS' | 'AI Startup' | 'E-Commerce' | 'Mobile App' | 'Healthcare & HIPAA';
  tags: string[];
  forksCount: number;
  starsCount: number;
  sampleStack: {
    tech: string[];
    auth: string[];
    payments: string[];
    ai: string[];
  };
  highlightedDocs: string[];
}

export interface ChangeEventAlert {
  id: string;
  timestamp: string;
  title: string;
  message: string;
  detectedChange: string;
  affectedDocs: DocType[];
  suggestedClause: string;
  suggestedVersion: string;
  status: 'pending' | 'applied' | 'dismissed';
}
