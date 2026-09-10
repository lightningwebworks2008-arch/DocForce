import React, { useState, useEffect } from 'react';
import { ProjectProfile, GitHubRepo, UserProfile } from '../types';
import {
  Code,
  Github,
  Globe,
  Layers,
  Sparkles,
  Zap,
  CheckCircle2,
  RefreshCw,
  Cpu,
  ShieldCheck,
  CreditCard,
  BarChart3,
  Bot,
  Database,
  Search,
  ExternalLink,
  AlertCircle,
  HelpCircle,
  Lock,
  ArrowRight,
  SlidersHorizontal,
  FileText,
  LogOut,
  GitBranch,
  Star,
  GitFork,
  Check,
  Diff,
  X
} from 'lucide-react';

interface ConnectScanViewProps {
  project: ProjectProfile;
  user: UserProfile | null;
  onUpdateProject: (updated: Partial<ProjectProfile>) => void;
  onTriggerScan: (repoUrl: string, packageJson: string, envs: string, desc: string) => Promise<void>;
  onInspectGitHubRepo: (repoUrlOrFullName: string) => Promise<any>;
  isScanning: boolean;
  onNavigateToReview: () => void;
  onNavigateToDocs: () => void;
  onOpenAuthModal: () => void;
  onOpenGitHubConfigModal?: () => void;
}

export const ConnectScanView: React.FC<ConnectScanViewProps> = ({
  project,
  user,
  onUpdateProject,
  onTriggerScan,
  onInspectGitHubRepo,
  isScanning,
  onNavigateToReview,
  onNavigateToDocs,
  onOpenAuthModal,
  onOpenGitHubConfigModal,
}) => {
  const [activeMode, setActiveMode] = useState<'github' | 'scanner' | 'questionnaire'>('github');
  const [repoInput, setRepoInput] = useState(project.githubUrl || '');
  const [websiteUrl, setWebsiteUrl] = useState(project.websiteUrl || '');
  const [projectName, setProjectName] = useState(project.name || '');

  // GitHub OAuth & Status state
  const [githubStatus, setGithubStatus] = useState<{
    configured: boolean;
    clientIdPrefix: string | null;
    hasSecret: boolean;
    missingConfig: string[];
    connected: boolean;
    user: any | null;
  } | null>(null);

  const [loadingStatus, setLoadingStatus] = useState(false);
  const [userRepos, setUserRepos] = useState<GitHubRepo[]>([]);
  const [loadingRepos, setLoadingRepos] = useState(false);
  const [repoSearch, setRepoSearch] = useState('');
  const [languageFilter, setLanguageFilter] = useState<string>('all');
  const [githubError, setGithubError] = useState<string | null>(null);
  const [githubSuccess, setGithubSuccess] = useState<string | null>(null);

  // Diff comparison modal state
  const [diffModalOpen, setDiffModalOpen] = useState(false);
  const [diffComparing, setDiffComparing] = useState(false);
  const [diffData, setDiffData] = useState<{
    hasSignificantChanges: boolean;
    summary: string;
    addedServices: any[];
    removedServices: any[];
    addedRoutes: string[];
    removedRoutes: string[];
    addedStack: string[];
    currentAnalysis: any;
    targetRepoName: string;
  } | null>(null);

  // Manual code scanner inputs
  const [packageJsonInput, setPackageJsonInput] = useState(`{
  "name": "${project.name.toLowerCase().replace(/\\s+/g, '-') || 'my-app'}",
  "version": "1.0.0",
  "dependencies": {
    "react": "^19.0.0",
    "next": "^15.1.0",
    "@supabase/supabase-js": "^2.48.0",
    "@stripe/stripe-js": "^4.2.0",
    "posthog-js": "^1.150.0",
    "@google/genai": "^2.4.0",
    "tailwindcss": "^4.0.0"
  },
  "devDependencies": {
    "typescript": "^5.6.0"
  }
}`);

  const [envVarsInput, setEnvVarsInput] = useState(`VITE_SUPABASE_URL=https://xyz.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=sb_publishable_...
SUPABASE_SECRET_KEY=sb_secret_...
STRIPE_SECRET_KEY=sk_live_51...
GEMINI_API_KEY=AIzaSy...
NEXT_PUBLIC_POSTHOG_KEY=phc_94...`);

  const [promptDescription, setPromptDescription] = useState(
    'React + Supabase app with Google Login, Stripe payments, PostHog analytics, and Google Gemini AI'
  );

  // Initial load: parse redirect params and fetch status & repos
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('github_connected') === 'true') {
      setGithubSuccess('GitHub account connected and authorized successfully!');
      window.history.replaceState({}, document.title, window.location.pathname);
    }
    if (urlParams.get('github_error')) {
      setGithubError(decodeURIComponent(urlParams.get('github_error') || 'GitHub OAuth authorization failed or was cancelled.'));
      window.history.replaceState({}, document.title, window.location.pathname);
    }
    fetchGitHubStatusAndRepos();
  }, [user]);

  const fetchGitHubStatusAndRepos = async () => {
    setLoadingStatus(true);
    setGithubError(null);
    try {
      const statusRes = await fetch('/api/github/status');
      if (statusRes.ok) {
        const data = await statusRes.json();
        setGithubStatus(data);

        if (data.connected) {
          // Fetch authorized repositories
          await fetchRepos();
        } else {
          setUserRepos([]);
        }
      }
    } catch (err: any) {
      console.warn('Status fetch note:', err.message);
    } finally {
      setLoadingStatus(false);
    }
  };

  const fetchRepos = async () => {
    setLoadingRepos(true);
    setGithubError(null);
    try {
      const res = await fetch('/api/github/repos');
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data.repos)) {
          setUserRepos(data.repos);
        }
      } else {
        const errData = await res.json().catch(() => ({}));
        if (res.status === 401) {
          setUserRepos([]);
          // Not an unrecoverable error, just prompt to connect
        } else {
          setGithubError(errData.error || 'Failed to retrieve GitHub repositories.');
        }
      }
    } catch (err: any) {
      setGithubError(err.message || 'Error communicating with server for repositories.');
    } finally {
      setLoadingRepos(false);
    }
  };

  const handleConnectGitHub = () => {
    if (!githubStatus?.configured) {
      if (onOpenGitHubConfigModal) {
        onOpenGitHubConfigModal();
      } else {
        setGithubError('GitHub OAuth credentials are not yet configured on the server. Please provide GITHUB_CLIENT_ID and GITHUB_CLIENT_SECRET.');
      }
      return;
    }
    window.location.href = '/api/github/oauth/authorize';
  };

  const handleDisconnectGitHub = async () => {
    setLoadingStatus(true);
    try {
      await fetch('/api/github/disconnect', { method: 'POST' });
      setGithubSuccess('Disconnected GitHub account.');
      setUserRepos([]);
      await fetchGitHubStatusAndRepos();
    } catch (err: any) {
      setGithubError(err.message || 'Failed to disconnect account');
    } finally {
      setLoadingStatus(false);
    }
  };

  const handleDeepInspectRepo = async (targetRepo: string) => {
    if (!targetRepo.trim()) return;
    setGithubError(null);
    setGithubSuccess(null);
    try {
      await onInspectGitHubRepo(targetRepo);
      setGithubSuccess(`Repository ${targetRepo} successfully inspected. Tech stack and services detected.`);
    } catch (err: any) {
      setGithubError(err.message || 'Failed to inspect GitHub repository');
    }
  };

  const handleCompareDiff = async (targetRepoUrl: string, repoName: string) => {
    setDiffComparing(true);
    setGithubError(null);
    try {
      const res = await fetch('/api/github/compare', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          repoUrl: targetRepoUrl,
          previousScan: {
            detectedServices: (project.techStack || []).map((name) => ({ name })),
            techStack: project.techStack || [],
          },
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to compare repository changes');
      }

      setDiffData({
        hasSignificantChanges: data.hasSignificantChanges,
        summary: data.changeSummary || data.summary,
        addedServices: data.addedServices || [],
        removedServices: data.removedServices || [],
        addedRoutes: data.addedRoutes || [],
        removedRoutes: data.removedRoutes || [],
        addedStack: data.addedStack || [],
        currentAnalysis: data.currentAnalysis,
        targetRepoName: repoName,
      });
      setDiffModalOpen(true);
    } catch (err: any) {
      setGithubError(err.message || 'Failed to compare repository changes');
    } finally {
      setDiffComparing(false);
    }
  };

  const handleApplyDiffAndReview = async () => {
    if (!diffData?.currentAnalysis) return;
    setDiffModalOpen(false);
    await onInspectGitHubRepo(diffData.targetRepoName);
    onNavigateToReview();
  };

  const handleRunManualScan = async () => {
    await onTriggerScan(repoInput, packageJsonInput, envVarsInput, promptDescription);
  };

  // Distinct languages for filter
  const distinctLanguages = Array.from(
    new Set(userRepos.map((r) => r.language).filter(Boolean))
  ) as string[];

  const filteredRepos = userRepos.filter((r) => {
    const matchesSearch =
      r.name.toLowerCase().includes(repoSearch.toLowerCase()) ||
      r.fullName.toLowerCase().includes(repoSearch.toLowerCase()) ||
      (r.description && r.description.toLowerCase().includes(repoSearch.toLowerCase()));
    const matchesLang = languageFilter === 'all' || r.language === languageFilter;
    return matchesSearch && matchesLang;
  });

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      {/* Top Banner / Mode Switcher */}
      <div className="bg-slate-900 text-slate-100 rounded-2xl p-6 sm:p-8 border border-slate-800 shadow-xl relative overflow-hidden">
        <div className="absolute -right-16 -top-16 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -left-16 -bottom-16 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 mb-2 text-indigo-400 font-semibold text-sm">
              <Sparkles className="w-4 h-4" />
              <span>Step 1 & 2: GitHub OAuth & Repository AST Inspector</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
              Connect Repository & Detect Services
            </h1>
            <p className="text-slate-300 text-sm sm:text-base mt-2 max-w-2xl leading-relaxed">
              DocForge scans your GitHub repository tree, <code className="text-indigo-400 font-mono text-xs">package.json</code>, lockfiles, and configuration to detect authentication, payment providers, analytics, and AI models automatically.
            </p>
          </div>

          {/* Mode Selector Tabs */}
          <div className="flex bg-slate-800/90 p-1 rounded-xl border border-slate-700/80 self-start md:self-auto shrink-0">
            <button
              onClick={() => setActiveMode('github')}
              className={`px-3.5 py-2 text-xs font-semibold rounded-lg transition-all flex items-center gap-2 cursor-pointer ${
                activeMode === 'github' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Github className="w-4 h-4" />
              <span>GitHub OAuth</span>
            </button>
            <button
              onClick={() => setActiveMode('scanner')}
              className={`px-3.5 py-2 text-xs font-semibold rounded-lg transition-all flex items-center gap-2 cursor-pointer ${
                activeMode === 'scanner' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Code className="w-4 h-4" />
              <span>AST Manifest</span>
            </button>
            <button
              onClick={() => setActiveMode('questionnaire')}
              className={`px-3.5 py-2 text-xs font-semibold rounded-lg transition-all flex items-center gap-2 cursor-pointer ${
                activeMode === 'questionnaire' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Layers className="w-4 h-4" />
              <span>Questionnaire</span>
            </button>
          </div>
        </div>
      </div>

      {/* Global Status Notifications */}
      {githubSuccess && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span className="font-semibold">{githubSuccess}</span>
          </div>
          <button
            onClick={() => setGithubSuccess(null)}
            className="text-emerald-700 hover:text-emerald-900 cursor-pointer p-1"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {githubError && (
        <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-900 text-xs flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-2.5">
            <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
            <span className="font-medium">{githubError}</span>
          </div>
          <button
            onClick={() => setGithubError(null)}
            className="text-red-700 hover:text-red-900 cursor-pointer p-1"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* GITHUB DIRECT INSPECTION MODE */}
      {activeMode === 'github' && (
        <div className="space-y-6">
          {/* GitHub Connection Status / OAuth Action Banner */}
          {githubStatus?.connected && githubStatus.user ? (
            /* Connected GitHub Account Card */
            <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-center gap-3.5">
                <img
                  src={githubStatus.user.avatarUrl}
                  alt={githubStatus.user.login}
                  className="w-12 h-12 rounded-xl object-cover border border-slate-200 shadow-xs"
                  referrerPolicy="no-referrer"
                />
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-900 text-sm">{githubStatus.user.name || githubStatus.user.login}</span>
                    <span className="font-mono text-xs font-semibold text-indigo-600">@{githubStatus.user.login}</span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                      OAuth Active
                    </span>
                  </div>
                  <p className="text-slate-500 text-xs mt-0.5">
                    Authorized for {githubStatus.user.publicRepos} public & {githubStatus.user.totalPrivateRepos} private repositories • Tokens secured server-side
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 self-start md:self-auto shrink-0">
                <button
                  onClick={fetchRepos}
                  disabled={loadingRepos}
                  className="px-3 py-2 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer"
                  title="Reload repositories from GitHub"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${loadingRepos ? 'animate-spin' : ''}`} />
                  <span>Refresh Repos</span>
                </button>

                {onOpenGitHubConfigModal && (
                  <button
                    onClick={onOpenGitHubConfigModal}
                    className="px-3 py-2 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer"
                  >
                    <Github className="w-3.5 h-3.5" />
                    <span>OAuth Settings</span>
                  </button>
                )}

                <button
                  onClick={handleDisconnectGitHub}
                  disabled={loadingStatus}
                  className="px-3 py-2 rounded-lg bg-red-50 hover:bg-red-100 border border-red-200 text-red-700 text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Disconnect</span>
                </button>
              </div>
            </div>
          ) : (
            /* Not Connected State Card */
            <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Github className="w-5 h-5 text-slate-900" />
                    <h3 className="font-bold text-slate-900 text-sm">Connect GitHub Account</h3>
                    {!githubStatus?.configured && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800">
                        OAuth Credentials Missing
                      </span>
                    )}
                  </div>
                  <p className="text-slate-500 text-xs max-w-2xl leading-relaxed">
                    Authorize DocForge to read repository file structures and package manifests to automatically extract integrated third-party services and audit compliance.
                  </p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {githubStatus?.configured ? (
                    <button
                      onClick={handleConnectGitHub}
                      className="px-5 py-2.5 bg-slate-900 hover:bg-black text-white rounded-xl text-xs font-semibold shadow-sm transition-all flex items-center gap-2 cursor-pointer"
                    >
                      <Github className="w-4 h-4" />
                      <span>Connect GitHub</span>
                    </button>
                  ) : (
                    <button
                      onClick={onOpenGitHubConfigModal}
                      className="px-4 py-2.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-semibold shadow-sm transition-all flex items-center gap-2 cursor-pointer"
                    >
                      <Lock className="w-4 h-4" />
                      <span>Configure GitHub OAuth</span>
                    </button>
                  )}
                </div>
              </div>

              {!githubStatus?.configured && (
                <div className="mt-4 p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs space-y-1.5">
                  <div className="font-semibold flex items-center gap-1.5">
                    <AlertCircle className="w-4 h-4 text-amber-600" />
                    <span>Missing GitHub OAuth configuration:</span>
                  </div>
                  <p className="text-amber-800 leading-relaxed">
                    Please provide <code className="bg-amber-100 px-1 py-0.5 rounded font-mono">GITHUB_CLIENT_ID</code> and <code className="bg-amber-100 px-1 py-0.5 rounded font-mono">GITHUB_CLIENT_SECRET</code> in the OAuth configuration modal or in your container environment to enable direct repository authorization.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Quick Input Bar for Any Repo */}
          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
            <h2 className="text-base font-bold text-slate-900 mb-1 flex items-center gap-2">
              <Github className="w-5 h-5 text-indigo-600" />
              <span>Inspect Repository by Name or URL</span>
            </h2>
            <p className="text-xs text-slate-500 mb-4">
              Enter any public or connected repository (e.g. <code className="text-indigo-600 font-mono">owner/repo</code> or full GitHub URL) to inspect dependencies, README, and API routes.
            </p>

            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Github className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={repoInput}
                  onChange={(e) => setRepoInput(e.target.value)}
                  placeholder="e.g. owner/repo or https://github.com/owner/repo"
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-mono text-slate-900 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 focus:bg-white outline-none transition-all"
                />
              </div>

              <button
                onClick={() => handleDeepInspectRepo(repoInput)}
                disabled={isScanning || !repoInput.trim()}
                className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 shrink-0"
              >
                {isScanning ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Scanning AST Tree...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    <span>Deep Inspect Repository</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Authorized Repositories List */}
          {githubStatus?.connected ? (
            <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
                <div>
                  <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                    <span>Authorized Repositories</span>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 font-mono font-medium">
                      {userRepos.length}
                    </span>
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Select a repository to scan or re-scan and detect changes before updating legal documentation.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  {distinctLanguages.length > 0 && (
                    <select
                      value={languageFilter}
                      onChange={(e) => setLanguageFilter(e.target.value)}
                      className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 focus:ring-2 focus:ring-indigo-500 outline-none text-slate-700"
                    >
                      <option value="all">All Languages</option>
                      {distinctLanguages.map((l) => (
                        <option key={l} value={l}>
                          {l}
                        </option>
                      ))}
                    </select>
                  )}

                  <div className="relative">
                    <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      value={repoSearch}
                      onChange={(e) => setRepoSearch(e.target.value)}
                      placeholder="Filter repos..."
                      className="pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none w-44 sm:w-52"
                    />
                  </div>
                </div>
              </div>

              {loadingRepos ? (
                <div className="py-12 text-center text-slate-400 text-xs flex flex-col items-center gap-2">
                  <RefreshCw className="w-5 h-5 animate-spin text-indigo-600" />
                  <span>Loading authorized repositories from GitHub...</span>
                </div>
              ) : filteredRepos.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {filteredRepos.map((r) => {
                    const isCurrentProject = project.githubUrl && project.githubUrl.includes(r.fullName);
                    return (
                      <div
                        key={r.id}
                        className={`p-4 rounded-xl border transition-all text-left flex flex-col justify-between ${
                          isCurrentProject
                            ? 'border-indigo-500 bg-indigo-50/40 shadow-xs'
                            : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50/50'
                        }`}
                      >
                        <div>
                          <div className="flex items-start justify-between gap-2">
                            <div className="font-semibold text-xs text-slate-900 truncate">{r.name}</div>
                            <span
                              className={`text-[10px] uppercase font-mono px-1.5 py-0.5 rounded font-bold shrink-0 ${
                                r.private
                                  ? 'bg-amber-100 text-amber-800'
                                  : 'bg-slate-100 text-slate-600'
                              }`}
                            >
                              {r.private ? 'Private' : 'Public'}
                            </span>
                          </div>

                          <p className="text-[11px] text-slate-500 mt-1 line-clamp-2 h-8">
                            {r.description || 'No description provided.'}
                          </p>
                        </div>

                        <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                          <div className="flex items-center gap-2 text-[11px] text-slate-500 font-mono">
                            <span>{r.language || 'Code'}</span>
                            <span>•</span>
                            <span className="flex items-center gap-0.5">
                              <Star className="w-3 h-3 text-amber-500 fill-amber-500" />
                              {r.stargazersCount}
                            </span>
                          </div>

                          <div className="flex items-center gap-1.5">
                            {isCurrentProject ? (
                              <button
                                onClick={() => handleCompareDiff(r.htmlUrl, r.fullName)}
                                disabled={diffComparing || isScanning}
                                className="px-2.5 py-1 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-semibold transition-all cursor-pointer disabled:opacity-50 flex items-center gap-1"
                              >
                                {diffComparing ? <RefreshCw className="w-3 h-3 animate-spin" /> : <Diff className="w-3 h-3" />}
                                <span>Re-scan & Diff</span>
                              </button>
                            ) : (
                              <button
                                onClick={() => handleDeepInspectRepo(r.htmlUrl)}
                                disabled={isScanning}
                                className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold transition-all cursor-pointer disabled:opacity-50 flex items-center gap-1"
                              >
                                <span>Inspect</span>
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="py-12 text-center text-slate-500 text-xs">
                  <Github className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                  <p className="font-semibold text-slate-700">No repositories matched your filter.</p>
                  <p className="text-slate-400 mt-1">Try searching for a different name or inspect a repository directly above.</p>
                </div>
              )}
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-slate-200 p-8 shadow-sm text-center space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto border border-indigo-100">
                <Github className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h3 className="font-bold text-slate-900 text-base">Connect GitHub to View Repositories</h3>
                <p className="text-slate-500 text-xs max-w-md mx-auto leading-relaxed">
                  Authenticate your GitHub account using secure server-side OAuth to browse private and public repositories and analyze your tech stack.
                </p>
              </div>
              <button
                onClick={handleConnectGitHub}
                className="px-6 py-2.5 bg-slate-900 hover:bg-black text-white rounded-xl text-xs font-semibold shadow-sm transition-all inline-flex items-center gap-2 cursor-pointer"
              >
                <Github className="w-4 h-4" />
                <span>Connect GitHub Account</span>
              </button>
            </div>
          )}
        </div>
      )}

      {/* AST MANIFEST & ENVIRONMENT SCANNER MODE */}
      {activeMode === 'scanner' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-7 space-y-6">
            <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
              <h2 className="text-base font-bold text-slate-900 mb-1 flex items-center gap-2">
                <Code className="w-5 h-5 text-indigo-600" />
                <span>Package Manifest & Environment Keys</span>
              </h2>
              <p className="text-xs text-slate-500 mb-4">
                Paste your <code className="text-indigo-600 font-mono text-xs">package.json</code> or sample environment variables to extract integrated services.
              </p>

              <div className="space-y-4">
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="text-xs font-semibold uppercase tracking-wider text-slate-600">
                      package.json payload
                    </label>
                    <span className="text-xs text-slate-400">AST dependency evaluation</span>
                  </div>
                  <textarea
                    rows={8}
                    value={packageJsonInput}
                    onChange={(e) => setPackageJsonInput(e.target.value)}
                    className="w-full font-mono text-xs p-3 rounded-lg border border-slate-300 bg-slate-50 text-slate-800 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 focus:bg-white transition-all outline-none"
                    placeholder="{ ...dependencies }"
                  />
                </div>

                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="text-xs font-semibold uppercase tracking-wider text-slate-600">
                      Environment Variables Template (.env.example)
                    </label>
                    <span className="text-xs text-slate-400">Key names only (values sanitized)</span>
                  </div>
                  <textarea
                    rows={4}
                    value={envVarsInput}
                    onChange={(e) => setEnvVarsInput(e.target.value)}
                    className="w-full font-mono text-xs p-3 rounded-lg border border-slate-300 bg-slate-50 text-slate-800 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 focus:bg-white transition-all outline-none"
                    placeholder="NEXT_PUBLIC_API_KEY=..."
                  />
                </div>

                <div className="pt-2 flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs text-slate-500">
                    <ShieldCheck className="w-4 h-4 text-emerald-600" />
                    <span>Zero secrets dispatched. Only dependency keys evaluated.</span>
                  </div>

                  <button
                    onClick={handleRunManualScan}
                    disabled={isScanning}
                    className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold shadow-sm transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    {isScanning ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        <span>Analyzing Dependencies...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4" />
                        <span>Scan & Detect Tech Stack</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="lg:col-span-5 space-y-4">
            <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
              <h3 className="font-bold text-slate-900 text-sm mb-2">Live Stack Footprint</h3>
              <p className="text-xs text-slate-500 mb-4">
                Services discovered from current AST parser.
              </p>

              <div className="space-y-2.5">
                <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <CreditCard className="w-4 h-4 text-indigo-600" />
                    <span className="text-xs font-semibold text-slate-800">Billing:</span>
                  </div>
                  <span className="text-xs font-mono font-bold text-indigo-600">
                    {project.paymentProviders.join(', ') || 'None'}
                  </span>
                </div>

                <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <ShieldCheck className="w-4 h-4 text-emerald-600" />
                    <span className="text-xs font-semibold text-slate-800">Auth:</span>
                  </div>
                  <span className="text-xs font-mono font-bold text-emerald-600 truncate max-w-[180px]">
                    {project.authMethods.join(', ') || 'Standard'}
                  </span>
                </div>

                <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <Bot className="w-4 h-4 text-purple-600" />
                    <span className="text-xs font-semibold text-slate-800">Generative AI:</span>
                  </div>
                  <span className="text-xs font-mono font-bold text-purple-600 truncate max-w-[180px]">
                    {project.aiModels.join(', ') || 'None'}
                  </span>
                </div>

                <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <BarChart3 className="w-4 h-4 text-amber-600" />
                    <span className="text-xs font-semibold text-slate-800">Analytics:</span>
                  </div>
                  <span className="text-xs font-mono font-bold text-amber-600">
                    {project.analyticsProviders.join(', ') || 'None'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* QUESTIONNAIRE MODE */}
      {activeMode === 'questionnaire' && (
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-6">
          <div>
            <h2 className="text-base font-bold text-slate-900 mb-1">Developer Questionnaire</h2>
            <p className="text-xs text-slate-500">
              Provide project parameters manually to generate tailored legal and technical docs.
            </p>
          </div>

          {/* Quick Presets */}
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
            <span className="text-xs font-semibold text-slate-600 block mb-2">Load Common Presets:</span>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => {
                  onUpdateProject({
                    name: 'SaaSify Core',
                    websiteUrl: 'https://saasify.cloud',
                    techStack: ['React', 'Next.js', 'Supabase', 'Tailwind'],
                    authMethods: ['Google OAuth', 'Supabase Auth'],
                    paymentProviders: ['Stripe'],
                    analyticsProviders: ['PostHog'],
                    aiModels: ['Google Gemini 3.8-Flash'],
                  });
                }}
                className="px-3 py-1.5 bg-white hover:bg-indigo-50 hover:text-indigo-700 text-slate-700 rounded-lg text-xs font-semibold border border-slate-200 transition-all cursor-pointer"
              >
                React + Supabase + Stripe + PostHog
              </button>
              <button
                onClick={() => {
                  onUpdateProject({
                    name: 'AI Agent Studio',
                    websiteUrl: 'https://agentstudio.dev',
                    techStack: ['Python', 'FastAPI', 'PostgreSQL'],
                    authMethods: ['GitHub OAuth', 'API Keys'],
                    paymentProviders: ['LemonSqueezy'],
                    analyticsProviders: ['Plausible'],
                    aiModels: ['Google Gemini Pro', 'Anthropic Claude'],
                  });
                }}
                className="px-3 py-1.5 bg-white hover:bg-indigo-50 hover:text-indigo-700 text-slate-700 rounded-lg text-xs font-semibold border border-slate-200 transition-all cursor-pointer"
              >
                AI Agent API + LemonSqueezy + Gemini
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Project Name</label>
              <input
                type="text"
                value={projectName}
                onChange={(e) => {
                  setProjectName(e.target.value);
                  onUpdateProject({ name: e.target.value });
                }}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Website URL</label>
              <input
                type="url"
                value={websiteUrl}
                onChange={(e) => {
                  setWebsiteUrl(e.target.value);
                  onUpdateProject({ websiteUrl: e.target.value });
                }}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>
        </div>
      )}

      {/* DATA HANDLING CLASSIFICATION & SUMMARY CARD */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
          <div>
            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-indigo-600" />
              <span>Data Handling Classification & Regulatory Baseline</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Identifies confirmed vs unconfirmed personal data flows that trigger mandatory legal clauses.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onNavigateToReview}
              className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-semibold shadow-sm transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
              <span>Step 3: Human Review ({project.complianceScore}% Ready)</span>
            </button>
            <button
              onClick={onNavigateToDocs}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold shadow-sm transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <FileText className="w-3.5 h-3.5" />
              <span>View Generated Docs</span>
            </button>
          </div>
        </div>

        {/* Data Categories Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-bold text-slate-900">User Accounts</span>
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">
                Detected
              </span>
            </div>
            <p className="text-[11px] text-slate-600">
              {project.authMethods.join(', ') || 'Email / OAuth'}. Requires explicit account deletion SLA.
            </p>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-bold text-slate-900">Payment & Invoicing</span>
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">
                Detected
              </span>
            </div>
            <p className="text-[11px] text-slate-600">
              {project.paymentProviders.join(', ') || 'Stripe'}. Triggers PCI-DSS and 14-day refund policy.
            </p>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-bold text-slate-900">Telemetry & Analytics</span>
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">
                Detected
              </span>
            </div>
            <p className="text-[11px] text-slate-600">
              {project.analyticsProviders.join(', ') || 'PostHog'}. Requires cookie disclosure and opt-out notice.
            </p>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-bold text-slate-900">Generative AI Models</span>
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-purple-100 text-purple-800">
                {project.aiModels.length > 0 ? 'Detected' : 'None'}
              </span>
            </div>
            <p className="text-[11px] text-slate-600">
              {project.aiModels.join(', ') || 'None'}. Triggers EU AI Act Article 50 transparency notice.
            </p>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-bold text-slate-900">System Logs & Traces</span>
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">
                Confirmed
              </span>
            </div>
            <p className="text-[11px] text-slate-600">
              Standard HTTP server logs and IP addresses kept strictly for security defense.
            </p>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-bold text-slate-900">Uploaded Files & Media</span>
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-amber-100 text-amber-800">
                Needs Confirmation
              </span>
            </div>
            <p className="text-[11px] text-slate-600">
              Disclose allowed MIME types and lifecycle retention window in Human Review.
            </p>
          </div>
        </div>
      </div>

      {/* RE-SCAN & DIFF COMPARISON MODAL */}
      {diffModalOpen && diffData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-6 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-500/20 flex items-center justify-center text-amber-400 border border-amber-500/30">
                  <Diff className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold">Repository Re-Scan & Diff Analysis</h3>
                  <p className="text-xs text-slate-400 mt-0.5">Target: {diffData.targetRepoName}</p>
                </div>
              </div>
              <button
                onClick={() => setDiffModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 overflow-y-auto text-xs text-slate-700">
              {/* Important Review Policy Requirement */}
              <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 space-y-1">
                <div className="flex items-center gap-2 font-semibold">
                  <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                  <span>Mandatory Human Review Required</span>
                </div>
                <p className="leading-relaxed">
                  Do not automatically modify or publish your Privacy Policy. Regulations require developers to review detected code changes and confirm data collection practices before generating updated documents.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                <p className="font-semibold text-slate-900 text-sm mb-1">Scan Comparison Summary</p>
                <p className="text-slate-600 leading-relaxed">{diffData.summary}</p>
              </div>

              {diffData.addedServices.length > 0 && (
                <div className="space-y-2">
                  <h4 className="font-bold text-slate-900 uppercase tracking-wider text-[11px] text-emerald-700">
                    + Newly Detected Services ({diffData.addedServices.length})
                  </h4>
                  <div className="space-y-1.5">
                    {diffData.addedServices.map((s: any, idx: number) => (
                      <div key={idx} className="p-2.5 rounded-lg bg-emerald-50 border border-emerald-200 flex items-center justify-between">
                        <div>
                          <span className="font-semibold text-emerald-900">{s.name}</span>
                          <span className="text-emerald-700 text-[11px] ml-2 font-mono">({s.category})</span>
                        </div>
                        <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-200 text-emerald-800 font-bold">
                          Needs Confirmation
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {diffData.removedServices.length > 0 && (
                <div className="space-y-2">
                  <h4 className="font-bold text-slate-900 uppercase tracking-wider text-[11px] text-red-700">
                    - Removed Services ({diffData.removedServices.length})
                  </h4>
                  <div className="space-y-1.5">
                    {diffData.removedServices.map((s: any, idx: number) => (
                      <div key={idx} className="p-2.5 rounded-lg bg-red-50 border border-red-200 flex items-center justify-between">
                        <span className="font-semibold text-red-900">{s.name}</span>
                        <span className="text-[10px] px-2 py-0.5 rounded bg-red-200 text-red-800 font-bold">
                          De-registered
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {diffData.addedRoutes.length > 0 && (
                <div className="space-y-2">
                  <h4 className="font-bold text-slate-900 uppercase tracking-wider text-[11px] text-indigo-700">
                    + New API Endpoints ({diffData.addedRoutes.length})
                  </h4>
                  <div className="flex flex-wrap gap-1.5">
                    {diffData.addedRoutes.map((r, i) => (
                      <span key={i} className="px-2 py-0.5 rounded font-mono text-[11px] bg-indigo-50 text-indigo-800 border border-indigo-200">
                        {r}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
              <button
                onClick={() => setDiffModalOpen(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleApplyDiffAndReview}
                className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold shadow-sm transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <SlidersHorizontal className="w-3.5 h-3.5" />
                <span>Apply Scan & Review in Human Audit</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
