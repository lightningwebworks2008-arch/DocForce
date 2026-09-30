import { DocumentItem, ProjectProfile, VersionRecord, HumanReviewQuestion, MarketplaceTemplate, ChangeEventAlert } from '../types';

export function createDefaultProject(name: string, websiteUrl?: string, githubUrl?: string): ProjectProfile {
  const baseWeb = websiteUrl || 'https://docforge.dev';
  return {
    id: `proj_${Date.now().toString(36)}`,
    name: name || 'Untitled Project',
    projectType: 'SaaS',
    websiteUrl: websiteUrl || '',
    githubUrl: githubUrl || '',
    techStack: [],
    authMethods: [],
    paymentProviders: [],
    analyticsProviders: [],
    aiModels: [],
    dataCollected: [],
    complianceScore: 0,
    activeVersion: 'v1.0',
    createdAt: new Date().toISOString(),
    lastUpdated: new Date().toISOString(),
    deployedUrls: {
      privacy: `${baseWeb}/privacy`,
      terms: `${baseWeb}/terms`,
      security: `${baseWeb}/security`,
      apiDocs: `${baseWeb}/docs/api`,
      publicPortal: `${baseWeb}/docs`,
    },
  };
}

export const INITIAL_PROJECT: ProjectProfile | null = null;

export const INITIAL_DOCS: DocumentItem[] = [];

export const INITIAL_VERSIONS: VersionRecord[] = [];

export const INITIAL_CHANGE_ALERTS: ChangeEventAlert[] = [];

export function createDefaultDocuments(project: ProjectProfile): DocumentItem[] {
  return [
    {
      id: `doc_privacy_${project.id}`,
      type: 'privacy-policy',
      title: 'Privacy Policy',
      category: 'legal',
      version: 'v1.0',
      status: 'draft',
      lastModified: new Date().toISOString(),
      wordCount: 0,
      content: `# Privacy Policy for ${project.name}\n\n*Pending repository inspection or document generation.*`,
    },
    {
      id: `doc_terms_${project.id}`,
      type: 'terms-of-service',
      title: 'Terms of Service',
      category: 'legal',
      version: 'v1.0',
      status: 'draft',
      lastModified: new Date().toISOString(),
      wordCount: 0,
      content: `# Terms of Service for ${project.name}\n\n*Pending repository inspection or document generation.*`,
    },
    {
      id: `doc_readme_${project.id}`,
      type: 'readme',
      title: 'Technical README',
      category: 'technical',
      version: 'v1.0',
      status: 'draft',
      lastModified: new Date().toISOString(),
      wordCount: 0,
      content: `# ${project.name}\n\n*Pending repository inspection or document generation.*`,
    },
  ];
}

export const INITIAL_QUESTIONS: HumanReviewQuestion[] = [];

export const MARKETPLACE_TEMPLATES: MarketplaceTemplate[] = [
  {
    id: 'tpl_b2b_saas',
    title: 'B2B SaaS Pro Enterprise Kit',
    description: 'Complete legal and technical documentation for modern subscription web apps with team seats, SLAs, and Stripe billing.',
    category: 'SaaS',
    tags: ['Stripe', 'Next.js', 'Clerk', 'PostHog', 'SOC-2 Ready'],
    forksCount: 0,
    starsCount: 0,
    sampleStack: {
      tech: ['Next.js 15', 'Tailwind CSS', 'PostgreSQL'],
      auth: ['Clerk Auth', 'SAML SSO'],
      payments: ['Stripe Billing'],
      ai: ['Google Gemini'],
    },
    highlightedDocs: ['Terms of Service', 'Privacy Policy', 'SLA Agreement', 'API Docs', 'Security Portal'],
  },
  {
    id: 'tpl_ai_startup',
    title: 'Generative AI Startup & Agent Suite',
    description: 'Tailored for LLM wrappers, AI copilots, and autonomous agents. Pre-configured with EU AI Act disclosures and data privacy clauses.',
    category: 'AI Startup',
    tags: ['Gemini', 'OpenAI', 'Vector DB', 'EU AI Act', 'Zero-Retention'],
    forksCount: 0,
    starsCount: 0,
    sampleStack: {
      tech: ['React 19', 'FastAPI / Express', 'Pinecone'],
      auth: ['Google OAuth', 'GitHub OAuth'],
      payments: ['Stripe Usage-Based Metering'],
      ai: ['Google Gemini 3.8-Flash', 'LangChain'],
    },
    highlightedDocs: ['AI Usage Disclosure', 'Acceptable Use Policy', 'Privacy Policy', 'API Reference', 'Data Retention'],
  },
  {
    id: 'tpl_ecommerce_marketplace',
    title: 'Multi-Vendor Marketplace & Commerce',
    description: 'Covers two-sided transactions, vendor payouts, escrow guidelines, buyer disputes, and sales tax compliance.',
    category: 'E-Commerce',
    tags: ['Stripe Connect', 'Escrow', 'Dispute SLA', 'Sales Tax'],
    forksCount: 0,
    starsCount: 0,
    sampleStack: {
      tech: ['Next.js', 'Shopify Storefront / Supabase'],
      auth: ['Magic Links', 'Phone OTP'],
      payments: ['Stripe Connect'],
      ai: ['Product Description AI'],
    },
    highlightedDocs: ['Terms of Trade', 'Refund & Return Policy', 'Vendor Agreement', 'Cookie Policy'],
  },
  {
    id: 'tpl_mobile_app',
    title: 'Mobile App Store & Consumer Utility',
    description: 'Compliant with Apple App Store & Google Play guidelines, In-App Purchase policies, push notification permissions, and COPPA.',
    category: 'Mobile App',
    tags: ['iOS', 'Android', 'RevenueCat', 'Push Notifications', 'COPPA'],
    forksCount: 0,
    starsCount: 0,
    sampleStack: {
      tech: ['React Native', 'Expo', 'Supabase'],
      auth: ['Apple Sign-In', 'Google Play Auth'],
      payments: ['In-App Purchases (RevenueCat)'],
      ai: ['On-Device AI'],
    },
    highlightedDocs: ['Mobile Privacy Policy', 'EULA (End User License)', 'COPPA Disclosure', 'Support FAQ'],
  },
  {
    id: 'tpl_healthcare_hipaa',
    title: 'Healthcare & HIPAA Compliant Starter',
    description: 'Rigorous privacy policies for digital health platforms handling Protected Health Information (PHI) with BAA agreements.',
    category: 'Healthcare & HIPAA',
    tags: ['HIPAA', 'PHI Encryption', 'BAA Agreement', 'Audit Trail'],
    forksCount: 0,
    starsCount: 0,
    sampleStack: {
      tech: ['Next.js', 'AWS HealthLake / Encrypted Postgres'],
      auth: ['Multi-Factor Auth (Duo/Okta)'],
      payments: ['Stripe Healthcare'],
      ai: ['Medical Scribe Gemini'],
    },
    highlightedDocs: ['HIPAA Notice of Privacy Practices', 'Business Associate Agreement', 'Security Architecture', 'Audit Policy'],
  },
];
