import { DocumentItem, ProjectProfile, VersionRecord, HumanReviewQuestion, MarketplaceTemplate, ChangeEventAlert } from '../types';

export const INITIAL_PROJECT: ProjectProfile = {
  id: 'proj_saasify_01',
  name: 'SaaSify Cloud',
  projectType: 'SaaS',
  websiteUrl: 'https://saasify.cloud',
  githubUrl: 'https://github.com/saasify/core-platform',
  techStack: ['React 19', 'Next.js 15', 'Tailwind CSS', 'Supabase (PostgreSQL)', 'Node.js', 'Vite'],
  authMethods: ['Google OAuth', 'Supabase Auth (Magic Link)'],
  paymentProviders: ['Stripe Billing'],
  analyticsProviders: ['PostHog Analytics'],
  aiModels: ['Google Gemini 3.8-Flash', 'OpenAI Embeddings'],
  dataCollected: ['Email address', 'Full name', 'Usage telemetry', 'Session replay logs', 'Billing invoices'],
  complianceScore: 84,
  activeVersion: 'v1.2',
  createdAt: '2026-06-12T10:00:00Z',
  lastUpdated: '2026-09-08T14:30:00Z',
  deployedUrls: {
    privacy: 'https://saasify.cloud/privacy',
    terms: 'https://saasify.cloud/terms',
    security: 'https://saasify.cloud/security',
    apiDocs: 'https://saasify.cloud/docs/api',
    publicPortal: 'https://saasify.cloud/docs',
  },
};

export const INITIAL_DOCS: DocumentItem[] = [
  // Legal
  {
    id: 'doc_privacy',
    type: 'privacy-policy',
    title: 'Privacy Policy',
    category: 'legal',
    version: 'v1.2',
    status: 'published',
    lastModified: '2026-09-08T14:20:00Z',
    wordCount: 850,
    content: `# Privacy Policy for SaaSify Cloud

**Effective Date:** September 8, 2026  
**Last Updated:** September 8, 2026  
**Website:** [https://saasify.cloud](https://saasify.cloud)

At **SaaSify Cloud**, we are committed to safeguarding personal data in compliance with GDPR (EU), CCPA/CPRA (California), UK GDPR, and international data protection standards.

---

### 1. Information We Collect
We collect personal information when you create an account, connect repositories, or utilize our documentation workflows:
* **Account Credentials:** Name, email address, profile avatar retrieved via Google OAuth and Supabase Auth.
* **Transaction Records:** Payment history and subscription tiers processed through Stripe, Inc. We do not store raw credit card numbers.
* **Product Telemetry:** Browsing interactions, page views, and feature engagement recorded via PostHog.
* **Project Specifications:** Repository architectures, API schemas, and metadata provided by developers.

---

### 2. Legal Basis for Processing (GDPR Article 6)
We process personal data based on:
1. **Contract Performance:** Fulfilling our service agreements and rendering documentation.
2. **Legitimate Interests:** Continuously optimizing platform security, preventing abuse, and measuring system performance.
3. **Legal Obligations:** Complying with financial accounting and tax reporting statutory requirements.

---

### 3. Data Retention & Deletion
* **Account Deletion:** Users can trigger instant account deletion through account settings. All associated personal records and credentials are automatically expunged within 30 days.
* **Database Backups:** Disaster recovery snapshots are cycled out and permanently overwritten every 30 days.

---

### 4. Third-Party Sub-Processors
* **Identity & Authentication:** Google Identity Services, Supabase Inc.
* **Payment Gateway:** Stripe, Inc. (PCI-DSS Level 1 certified).
* **Analytics & Telemetry:** PostHog Inc. (US/EU isolated instances).
* **Artificial Intelligence:** Google Gemini API (processed transiently with zero retention).

---

### 5. Your Rights Under GDPR & CCPA
You are entitled to:
* Access personal data held about you.
* Request deletion ("Right to be Forgotten").
* Restrict automated profiling.
* Request structured data export in JSON/Markdown.

Contact our Data Protection Officer: **privacy@saasify.cloud**.`,
  },
  {
    id: 'doc_terms',
    type: 'terms-of-service',
    title: 'Terms of Service',
    category: 'legal',
    version: 'v1.2',
    status: 'published',
    lastModified: '2026-09-08T14:15:00Z',
    wordCount: 790,
    content: `# Terms of Service for SaaSify Cloud

**Effective Date:** September 8, 2026  
**Governing Law:** State of Delaware, United States

By signing up for or accessing **SaaSify Cloud** ("the Service"), you agree to these legally enforceable terms.

---

### 1. Subscription & Payment Terms
* **Billing Cycles:** Subscriptions are billed on a recurring monthly or annual basis via Stripe.
* **Refund Guarantee:** We provide a 14-day no-questions-asked refund guarantee on all first-time subscription activations.
* **Cancellation:** Users may cancel anytime in the billing settings panel without penalties.

---

### 2. Intellectual Property Rights
* **Developer Ownership:** You retain full, exclusive ownership of all code, architecture schemas, and generated legal policies created using our platform.
* **Platform License:** SaaSify Cloud grants you a worldwide, non-exclusive license to host and publish generated documentation freely.

---

### 3. Acceptable Use
You agree not to use the Service to:
* Reverse engineer or decompile platform source algorithms.
* Generate misleading, fraudulent, or malicious compliance certifications.
* Bypass rate limits or interfere with other tenant workloads.

---

### 4. Limitation of Liability
To the maximum extent permitted by applicable law, SaaSify Cloud and its affiliates shall not be liable for incidental, special, or consequential damages resulting from downtime or regulatory enforcement.`,
  },
  {
    id: 'doc_cookie',
    type: 'cookie-policy',
    title: 'Cookie Policy',
    category: 'legal',
    version: 'v1.1',
    status: 'published',
    lastModified: '2026-08-20T11:00:00Z',
    wordCount: 420,
    content: `# Cookie Policy for SaaSify Cloud

**Effective Date:** August 20, 2026

This document explains our usage of cookies, web beacons, and local storage tokens.

### 1. Types of Cookies Used
* **Strictly Necessary:** Auth session tokens (\`sb:token\`, \`csrf_session\`). Mandatory for login security.
* **Functional Cookies:** User interface preferences, sidebar toggle state, theme mode.
* **Analytics Cookies:** PostHog telemetry cookies (\`ph_*\`) used to detect platform performance regressions.

### 2. Cookie Management
You can update your cookie preferences at any time via the cookie banner at the bottom of our site, or by adjusting your browser settings.`,
  },
  {
    id: 'doc_refund',
    type: 'refund-policy',
    title: 'Refund & Cancellation Policy',
    category: 'legal',
    version: 'v1.0',
    status: 'published',
    lastModified: '2026-07-01T09:00:00Z',
    wordCount: 380,
    content: `# Refund & Cancellation Policy

### 1. Standard 14-Day Money-Back Guarantee
If you are dissatisfied with SaaSify Cloud within 14 calendar days of your initial paid upgrade, email **billing@saasify.cloud** with your invoice ID for a full, 100% refund.

### 2. Subsequent Billing Periods
Monthly recurring subscription renewals are non-refundable once the billing window opens. Annual plans cancelled midway receive prorated platform credits upon request.`,
  },
  {
    id: 'doc_retention',
    type: 'data-retention',
    title: 'Data Retention Policy',
    category: 'legal',
    version: 'v1.1',
    status: 'reviewed',
    lastModified: '2026-08-15T16:00:00Z',
    wordCount: 450,
    content: `# Data Retention & Purge Policy

**Standard:** GDPR Article 5(1)(e) - Storage Limitation

### 1. Retention Schedule
| Data Category | Retention Period | Purge Mechanism |
| :--- | :--- | :--- |
| Active User Accounts | Lifetime of account | N/A |
| Deleted Accounts | 30 Calendar Days | Cryptographic overwrite |
| Stripe Payment Receipts | 7 Years | Mandated by IRS / Tax regulations |
| PostHog Analytics Logs | 90 Days | Automatic rolling truncation |
| Document Version History | Indefinitely (User controllable) | Manual or automated rollback |`,
  },
  {
    id: 'doc_ai_disclosure',
    type: 'ai-disclosure',
    title: 'AI Usage & Transparency Disclosure',
    category: 'legal',
    version: 'v1.2',
    status: 'published',
    lastModified: '2026-09-08T14:10:00Z',
    wordCount: 520,
    content: `# AI Usage & Transparency Disclosure

**Compliance Reference:** EU AI Act (Regulation EU 2024/1689, Article 50)

### 1. Deployed Foundational Models
SaaSify Cloud utilizes **Google Gemini 3.8-Flash** to parse project questionnaires, map repository structures, and draft regulatory documentation.

### 2. User Data Privacy & Training Opt-Out
* **Zero Model Training:** User proprietary source code, credentials, and custom questions are strictly **never used** to train or fine-tune public foundation models.
* **Transient Processing:** Prompts sent to the Gemini API are processed in-memory and not logged into persistent training corpuses.

### 3. Human Oversight
All generated technical guides and legal clauses are reviewed by human operators via the **Human Review Layer** before deployment.`,
  },

  // Technical Docs
  {
    id: 'doc_readme',
    type: 'readme',
    title: 'README.md',
    category: 'technical',
    version: 'v1.2',
    status: 'published',
    lastModified: '2026-09-08T14:00:00Z',
    wordCount: 650,
    content: `# SaaSify Cloud Core

> High-velocity documentation and compliance orchestration platform.

[![CI/CD Build](https://img.shields.io/badge/build-passing-brightgreen.svg)](https://github.com/saasify/core-platform)
[![Version](https://img.shields.io/badge/version-1.2.0-blue.svg)](https://github.com/saasify/core-platform/releases)
[![GDPR Compliant](https://img.shields.io/badge/GDPR-Certified%2084%25-green.svg)](https://saasify.cloud/privacy)

## ✨ Architecture Highlights
* **Web Client:** React 19, Next.js 15 App Router, Tailwind CSS
* **Database & Auth:** Supabase PostgreSQL with Row Level Security (RLS) & Google OAuth
* **Payments:** Stripe Checkout & Webhooks
* **AI Engine:** Google Gemini 3.8-Flash via \`@google/genai\`
* **Telemetry:** PostHog Analytics

## 🚀 Quick Setup

\`\`\`bash
# Clone the repository
git clone https://github.com/saasify/core-platform.git
cd core-platform

# Install project dependencies
npm install

# Setup environment variables
cp .env.example .env

# Run local development server
npm run dev
\`\`\`

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.`,
  },
  {
    id: 'doc_install',
    type: 'installation',
    title: 'Installation Guide',
    category: 'technical',
    version: 'v1.1',
    status: 'published',
    lastModified: '2026-08-10T12:00:00Z',
    wordCount: 460,
    content: `# Comprehensive Installation Guide

### Prerequisites
* **Node.js**: v20.x or v22.x LTS
* **Package Manager**: npm v10+ or pnpm v9+
* **Supabase Account**: Provisioned PostgreSQL instance with URL & Anon Key
* **Stripe Developer Account**: Public & Secret API keys

### Step-by-Step Installation
1. Clone the repository and execute \`npm install\`.
2. Populate \`.env\` with:
   \`\`\`env
   VITE_SUPABASE_URL="https://your-proj.supabase.co"
   VITE_SUPABASE_PUBLISHABLE_KEY="your-publishable-key"
   SUPABASE_SECRET_KEY="your-secret-key"
   STRIPE_SECRET_KEY="sk_test_..."
   GEMINI_API_KEY="your-gemini-key"
   \`\`\`
3. Run database migrations:
   \`\`\`bash
   npx supabase db push
   \`\`\`
4. Run \`npm run build\` to verify production compatibility.`,
  },
  {
    id: 'doc_api',
    type: 'api-docs',
    title: 'REST API Documentation',
    category: 'technical',
    version: 'v1.2',
    status: 'published',
    lastModified: '2026-09-08T14:05:00Z',
    wordCount: 710,
    content: `# SaaSify Cloud REST API Documentation

**Base URL:** \`https://api.saasify.cloud/v1\`  
**Auth:** Bearer Token (\`Authorization: Bearer <token>\`)

---

### Endpoints

#### \`POST /projects/scan\`
Analyzes a repository URL or \`package.json\` AST payload to discover tech stack integrations.

**Request Payload:**
\`\`\`json
{
  "repoUrl": "https://github.com/saasify/core-platform",
  "branch": "main",
  "includeDevDeps": true
}
\`\`\`

**Response (200 OK):**
\`\`\`json
{
  "detected": {
    "auth": ["Google OAuth", "Supabase Auth"],
    "payments": ["Stripe"],
    "analytics": ["PostHog"],
    "ai": ["Google Gemini 3.8-Flash"],
    "complianceScore": 84
  }
}
\`\`\`

#### \`POST /documents/generate\`
Generates markdown policy or technical doc tailored with human review answers.`,
  },
  {
    id: 'doc_schema',
    type: 'schema-docs',
    title: 'Database Schema Docs',
    category: 'technical',
    version: 'v1.1',
    status: 'published',
    lastModified: '2026-08-12T15:00:00Z',
    wordCount: 480,
    content: `# Supabase Database Schema

### Table: \`profiles\`
Stores authenticated developer account profiles.
* \`id\` (UUID, PK) -> references \`auth.users.id\`
* \`email\` (TEXT, UNIQUE)
* \`full_name\` (TEXT)
* \`stripe_customer_id\` (TEXT)
* \`created_at\` (TIMESTAMPTZ)

### Table: \`projects\`
* \`id\` (UUID, PK)
* \`profile_id\` (UUID, FK) -> references \`profiles.id\`
* \`name\` (TEXT)
* \`github_repo\` (TEXT)
* \`compliance_score\` (INT)
* \`active_version\` (TEXT)

### Table: \`doc_versions\`
* \`id\` (UUID, PK)
* \`project_id\` (UUID, FK)
* \`version_tag\` (TEXT)
* \`commit_sha\` (TEXT)
* \`doc_type\` (TEXT)
* \`content\` (TEXT)`,
  },
  {
    id: 'doc_arch',
    type: 'architecture',
    title: 'Architecture Overview',
    category: 'technical',
    version: 'v1.2',
    status: 'published',
    lastModified: '2026-09-08T14:12:00Z',
    wordCount: 540,
    content: `# Architecture Overview

\`\`\`
[ Browser / Client ] ──(HTTPS/WSS)──> [ Cloud Run / Ingress ]
                                              │
                    ┌─────────────────────────┴────────────────────────┐
                    ▼                                                  ▼
          [ Next.js / Vite UI ]                              [ Express API Gateway ]
                    │                                                  │
          ┌─────────┴─────────┐                         ┌──────────────┼──────────────┐
          ▼                   ▼                         ▼              ▼              ▼
   [ Supabase Auth ]  [ PostHog Telemetry ]        [ Supabase DB ] [ Gemini API ] [ Stripe SDK ]
\`\`\`

### System Component Responsibilities
* **Ingress Layer:** SSL/TLS 1.3 termination, rate limiting, and static file delivery.
* **API Gateway:** AST parsing for package.json, Git commit webhook listener, and AI document orchestrator.
* **Database:** Multi-tenant PostgreSQL hosted on Supabase with row-level encryption.`,
  },
  {
    id: 'doc_changelog',
    type: 'changelog',
    title: 'Changelog',
    category: 'technical',
    version: 'v1.2',
    status: 'published',
    lastModified: '2026-09-08T14:25:00Z',
    wordCount: 390,
    content: `# SaaSify Cloud Changelog

All notable changes to the SaaSify Cloud platform and documentation suites.

---

### [v1.2.0] - 2026-09-08
* **Added:** Deployed EU AI Act Article 50 transparency notice (\`ai-disclosure\`).
* **Added:** Integrated PostHog analytics telemetry disclosure clauses.
* **Changed:** Enhanced Privacy Policy sub-processors list with geographical data storage nodes.
* **Security:** Updated Google OAuth scopes documentation.

### [v1.1.0] - 2026-08-15
* **Added:** Automated Supabase Database schema documentation page.
* **Added:** 14-day refund policy guarantee statement in Terms of Service.

### [v1.0.0] - 2026-07-01
* **Initial Release:** Initial generation of core legal and technical documentation suites.`,
  },

  // Business Docs
  {
    id: 'doc_faq',
    type: 'faq',
    title: 'Frequently Asked Questions',
    category: 'business',
    version: 'v1.1',
    status: 'published',
    lastModified: '2026-08-18T10:00:00Z',
    wordCount: 420,
    content: `# Frequently Asked Questions

### Q: Does SaaSify Cloud comply with GDPR and CCPA?
**A:** Yes, our platform provides complete compliance coverage including user access requests, automated right-to-be-forgotten deletion pipelines, and subprocessor transparency.

### Q: What happens when I install a new npm package?
**A:** Our Change Monitor alerts you automatically (e.g. "PostHog analytics detected") and prompts you with a 1-click diff to update your Privacy Policy.

### Q: Can I export documentation to Markdown or PDF?
**A:** Absolutely. You can export complete bundles, publish to GitHub Pages, or embed live widgets on your own domain.`,
  },
  {
    id: 'doc_security',
    type: 'security-page',
    title: 'Security & Trust Center',
    category: 'business',
    version: 'v1.2',
    status: 'published',
    lastModified: '2026-09-08T14:18:00Z',
    wordCount: 560,
    content: `# Security & Trust Center

**Platform:** SaaSify Cloud  
**Security Officer:** security@saasify.cloud  
**Bug Bounty Program:** https://saasify.cloud/security/bounty

### 1. Data Encryption
* **In-Transit:** TLS 1.3 enforced across all domains with HSTS preloading.
* **At-Rest:** AES-256 GCM encryption on all PostgreSQL database volumes and documentation snapshots.

### 2. Vulnerability Management
* Nightly automated dependency scans (Dependabot / Snyk).
* 99.9% uptime SLA with real-time health telemetry.`,
  },
  {
    id: 'doc_support',
    type: 'support-page',
    title: 'Support & Help Center',
    category: 'business',
    version: 'v1.1',
    status: 'published',
    lastModified: '2026-08-10T11:00:00Z',
    wordCount: 310,
    content: `# Support & Help Center

Need help with SaaSify Cloud? We're available 24/7.

* **Email Support:** support@saasify.cloud (Response time < 2 hours)
* **Live Community:** https://discord.gg/saasify-devs
* **Status Page:** https://status.saasify.cloud
* **Enterprise SLA:** Guaranteed 30-minute response time for critical incidents.`,
  },
];

export const INITIAL_VERSIONS: VersionRecord[] = [
  {
    id: 'ver_1_2',
    version: 'v1.2',
    timestamp: '2026-09-08T14:30:00Z',
    commitSha: 'a4f891b',
    commitMessage: 'feat(docs): integrate PostHog telemetry disclosure and EU AI Act transparency',
    author: 'Sarah Chen <sarah@saasify.cloud>',
    changesSummary: 'Added AI disclosure document, updated Privacy Policy for PostHog analytics, bumped version to v1.2.',
    docsSnapshot: {
      'privacy-policy': INITIAL_DOCS[0].content,
      'terms-of-service': INITIAL_DOCS[1].content,
      'ai-disclosure': INITIAL_DOCS[5].content,
    },
  },
  {
    id: 'ver_1_1',
    version: 'v1.1',
    timestamp: '2026-08-15T16:00:00Z',
    commitSha: 'c8230fe',
    commitMessage: 'fix(legal): incorporate 14-day refund window & Supabase schema docs',
    author: 'Alex Rivera <alex@saasify.cloud>',
    changesSummary: 'Added Refund Policy clauses into Terms, published Database Schema documentation.',
    docsSnapshot: {
      'privacy-policy': INITIAL_DOCS[0].content,
      'terms-of-service': INITIAL_DOCS[1].content,
    },
  },
  {
    id: 'ver_1_0',
    version: 'v1.0',
    timestamp: '2026-07-01T09:00:00Z',
    commitSha: 'e91244a',
    commitMessage: 'initial: generate full baseline legal and technical docs suite',
    author: 'DocForge Bot <bot@docforge.io>',
    changesSummary: 'Initial automated generation from project questionnaire.',
    docsSnapshot: {
      'privacy-policy': INITIAL_DOCS[0].content,
    },
  },
];

export const INITIAL_QUESTIONS: HumanReviewQuestion[] = [
  {
    id: 'q_refund',
    detectedTrigger: 'Stripe Billing detected in package.json',
    category: 'legal',
    question: 'Do you offer customer refunds for subscriptions?',
    description: 'Stripe payments require an explicit, legally clear refund and chargeback disclosure.',
    options: [
      { label: '14-Day Money-Back Guarantee', value: '14-day money-back guarantee for initial subscription period' },
      { label: '30-Day Full Refund Window', value: '30-day no-questions-asked refund guarantee' },
      { label: 'No Refunds (All Sales Final)', value: 'All purchases and recurring subscription fees are strictly non-refundable' },
      { label: 'Case-by-Case Prorated Credit', value: 'Prorated platform credit provided upon support review' },
    ],
    selectedAnswer: '14-day money-back guarantee for initial subscription period',
    affectedDocs: ['terms-of-service', 'refund-policy'],
  },
  {
    id: 'q_deletion',
    detectedTrigger: 'Google OAuth & Supabase Auth detected',
    category: 'privacy',
    question: 'How do users delete their accounts, and what is your data purge SLA?',
    description: 'GDPR Article 17 mandates an explicit "Right to Erasure" policy with a defined purge timeline.',
    options: [
      { label: 'Self-Serve Instant (30-day backup purge)', value: 'Users can delete account directly in settings; data completely purged within 30 days' },
      { label: 'Immediate Hard Delete (0-day purge)', value: 'Immediate permanent deletion of all databases and logs upon account close' },
      { label: 'Email Request to Support (48hr SLA)', value: 'Users request deletion via email to privacy@domain; fulfilled within 48 hours' },
    ],
    selectedAnswer: 'Users can delete account directly in settings; data completely purged within 30 days',
    affectedDocs: ['privacy-policy', 'data-retention', 'security-page'],
  },
  {
    id: 'q_ai_training',
    detectedTrigger: 'Google Gemini & OpenAI detected in dependencies',
    category: 'legal',
    question: 'Are user inputs or project files used to train AI models?',
    description: 'EU AI Act Article 50 requires explicit transparency regarding synthetic generation and training corpuses.',
    options: [
      { label: 'Strict Zero-Training (Private Transience)', value: 'User inputs are strictly private and never used to train public models' },
      { label: 'Opt-In Voluntary Training', value: 'Users can optionally opt-in to model improvement programs' },
      { label: 'Internal Fine-Tuning Only', value: 'Proprietary models are fine-tuned on anonymized platform data' },
    ],
    selectedAnswer: 'User inputs are strictly private and never used to train public models',
    affectedDocs: ['ai-disclosure', 'privacy-policy', 'terms-of-service'],
  },
  {
    id: 'q_telemetry',
    detectedTrigger: 'PostHog Analytics detected',
    category: 'privacy',
    question: 'Do you record session replays or sensitive user keystrokes?',
    description: 'ePrivacy Directive and wiretap regulations require disclosing session replay recording tools.',
    options: [
      { label: 'Anonymized Events Only (No Session Replay)', value: 'Collects anonymized event counts without session replay or keystroke capture' },
      { label: 'Session Replay with Password Masking', value: 'Session replays enabled with strict masking of all input fields and passwords' },
      { label: 'Full Replay for Debugging', value: 'Replay enabled with consent for authorized support sessions' },
    ],
    selectedAnswer: 'Session Replay with Password Masking',
    affectedDocs: ['cookie-policy', 'privacy-policy'],
  },
];

export const MARKETPLACE_TEMPLATES: MarketplaceTemplate[] = [
  {
    id: 'tpl_b2b_saas',
    title: 'B2B SaaS Pro Enterprise Kit',
    description: 'Complete legal and technical documentation for modern subscription web apps with team seats, SLAs, and Stripe billing.',
    category: 'SaaS',
    tags: ['Stripe', 'Next.js', 'Clerk', 'PostHog', 'SOC-2 Ready'],
    forksCount: 1420,
    starsCount: 3890,
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
    forksCount: 2890,
    starsCount: 6120,
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
    forksCount: 840,
    starsCount: 1980,
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
    forksCount: 1150,
    starsCount: 2650,
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
    forksCount: 620,
    starsCount: 1540,
    sampleStack: {
      tech: ['Next.js', 'AWS HealthLake / Encrypted Postgres'],
      auth: ['Multi-Factor Auth (Duo/Okta)'],
      payments: ['Stripe Healthcare'],
      ai: ['Medical Scribe Gemini'],
    },
    highlightedDocs: ['HIPAA Notice of Privacy Practices', 'Business Associate Agreement', 'Security Architecture', 'Audit Policy'],
  },
];

export const INITIAL_CHANGE_ALERTS: ChangeEventAlert[] = [
  {
    id: 'alert_01',
    timestamp: '2026-09-08T14:02:00Z',
    title: 'Dependency Change Detected in Commit #a4f891b',
    message: 'Developer added "posthog-js": "^1.150.0" to package.json.',
    detectedChange: 'PostHog Product Analytics SDK added to codebase',
    affectedDocs: ['privacy-policy', 'cookie-policy'],
    suggestedClause: '### 4.3 Product Telemetry (PostHog)\nWe utilize PostHog to analyze user navigation patterns and platform performance. PostHog collects pseudonymized telemetry data in accordance with our strict data minimization policies.',
    suggestedVersion: 'v1.2',
    status: 'applied',
  },
];
