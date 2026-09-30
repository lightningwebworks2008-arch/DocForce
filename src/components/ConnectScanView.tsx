import React, { useState, useEffect } from 'react';
import { ProjectProfile, GitHubRepo, UserProfile } from '../types';
import {
  Code,
  Github,
  Globe,
  Layers,
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
  X,
  Key,
  Copy
} from 'lucide-react';

interface ConnectScanViewProps {
  project: ProjectProfile | null;
  user: UserProfile | null;
  onUpdateProject: (updated: Partial<ProjectProfile>) => void;
  onTriggerScan: (repoUrl: string, packageJson: string, envs: string, desc: string) => Promise<void>;
  onInspectGitHubRepo: (repoUrlOrFullName: string) => Promise<any>;
  isScanning: boolean;
  onNavigateToReview: () => void;
  onNavigateToDocs: () => void;
  onOpenAuthModal: () => void;
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
}) => {
  const [activeMode, setActiveMode] = useState<'github' | 'scanner' | 'questionnaire'>('github');
  const [repoInput, setRepoInput] = useState(project?.githubUrl || '');
  const [websiteUrl, setWebsiteUrl] = useState(project?.websiteUrl || '');
  const [projectName, setProjectName] = useState(project?.name || '');

  // Keep state in sync with active project
  React.useEffect(() => {
    if (project) {
      setRepoInput(project.githubUrl || '');
      setWebsiteUrl(project.websiteUrl || '');
      setProjectName(project.name || '');
    } else {
      setRepoInput('');
      setWebsiteUrl('');
      setProjectName('');
    }
  }, [project]);

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

  // Manual code scanner inputs - clean by default
  const [packageJsonInput, setPackageJsonInput] = useState('');
  const [envVarsInput, setEnvVarsInput] = useState('');
  const [promptDescription, setPromptDescription] = useState('');

  const [connectingOAuth, setConnectingOAuth] = useState(false);
  const [patModalOpen, setPatModalOpen] = useState(false);
  const [patTokenInput, setPatTokenInput] = useState('');
  const [patSubmitting, setPatSubmitting] = useState(false);
  const [blockedPopupUrl, setBlockedPopupUrl] = useState<string | null>(null);
  const [copiedCallback, setCopiedCallback] = useState(false);
  const [visibilityFilter, setVisibilityFilter] = useState<'all' | 'public' | 'private'>('all');
  const [showPrivateRepoHelp, setShowPrivateRepoHelp] = useState(false);

  const getSessionHeaders = (): Record<string, string> => {
    const sid = localStorage.getItem('docforge_gh_sid');
    return sid ? { 'x-github-session': sid } : {};
  };

  // Listen for popup OAuth postMessage responses
  useEffect(() => {
    const handleOAuthMessage = (event: MessageEvent) => {
      if (event.data?.type === 'GITHUB_OAUTH_SUCCESS') {
        if (event.data.sid) {
          localStorage.setItem('docforge_gh_sid', event.data.sid);
        }
        setGithubSuccess(`GitHub connected successfully! Authorized as @${event.data.user?.login || 'user'}.`);
        setBlockedPopupUrl(null);
        fetchGitHubStatusAndRepos();
      } else if (event.data?.type === 'GITHUB_OAUTH_ERROR') {
        setGithubError(event.data.error || 'GitHub OAuth authorization failed or was cancelled.');
        setBlockedPopupUrl(null);
      }
    };

    window.addEventListener('message', handleOAuthMessage);
    return () => window.removeEventListener('message', handleOAuthMessage);
  }, []);

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
      const statusRes = await fetch('/api/github/status', {
        headers: { ...getSessionHeaders() },
      });
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
      const res = await fetch('/api/github/repos', {
        headers: { ...getSessionHeaders() },
      });
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data.repos)) {
          setUserRepos(data.repos);
        }
      } else {
        const errData = await res.json().catch(() => ({}));
        if (res.status === 401) {
          setUserRepos([]);
          // Not an unrecoverable error, prompt to connect
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

  const handleConnectGitHub = async () => {
    setConnectingOAuth(true);
    setGithubError(null);
    setBlockedPopupUrl(null);

    try {
      // 1. Fetch provider authorization URL directly
      const res = await fetch('/api/github/oauth/url');
      const data = await res.json();

      if (!res.ok || !data.url) {
        if (data.configured === false) {
          setGithubError(
            'GitHub OAuth is not configured on the server yet. You can connect immediately using a Personal Access Token below, or set GITHUB_CLIENT_ID and GITHUB_CLIENT_SECRET.'
          );
          setPatModalOpen(true);
          return;
        }
        throw new Error(data.error || 'Failed to generate GitHub authorization URL');
      }

      // 2. Open provider directly in a popup window to comply with iframe constraints
      const width = 600;
      const height = 750;
      const left = window.screenX + (window.outerWidth - width) / 2;
      const top = window.screenY + (window.outerHeight - height) / 2;

      const popup = window.open(
        data.url,
        'github_oauth_popup',
        `width=${width},height=${height},left=${left},top=${top},toolbar=no,menubar=no,status=no`
      );

      if (!popup || popup.closed || typeof popup.closed === 'undefined') {
        // Popup was blocked by browser
        setBlockedPopupUrl(data.url);
        setGithubError('Browser blocked the authorization popup window. Click "Open GitHub in New Tab" below.');
      }
    } catch (err: any) {
      setGithubError(err.message || 'Failed to initiate GitHub authorization');
    } finally {
      setConnectingOAuth(false);
    }
  };

  const handleConnectPAT = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!patTokenInput.trim()) return;
    setPatSubmitting(true);
    setGithubError(null);
    try {
      const res = await fetch('/api/github/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token: patTokenInput.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to authenticate with GitHub token');
      }
      if (data.sid) {
        localStorage.setItem('docforge_gh_sid', data.sid);
      }
      setGithubSuccess(data.message || `Successfully connected to GitHub as @${data.user?.login || 'user'}`);
      setPatTokenInput('');
      setPatModalOpen(false);
      await fetchGitHubStatusAndRepos();
    } catch (err: any) {
      setGithubError(err.message || 'Invalid GitHub Personal Access Token');
    } finally {
      setPatSubmitting(false);
    }
  };

  const handleDisconnectGitHub = async () => {
    setLoadingStatus(true);
    try {
      await fetch('/api/github/disconnect', {
        method: 'POST',
        headers: { ...getSessionHeaders() },
      });
      localStorage.removeItem('docforge_gh_sid');
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

  // Counts for public vs private repositories
  const publicCount = userRepos.filter((r) => !r.private).length;
  const privateCount = userRepos.filter((r) => r.private).length;

  const filteredRepos = userRepos.filter((r) => {
    const matchesSearch =
      r.name.toLowerCase().includes(repoSearch.toLowerCase()) ||
      r.fullName.toLowerCase().includes(repoSearch.toLowerCase()) ||
      (r.description && r.description.toLowerCase().includes(repoSearch.toLowerCase()));
    const matchesLang = languageFilter === 'all' || r.language === languageFilter;
    const matchesVisibility =
      visibilityFilter === 'all' ||
      (visibilityFilter === 'public' && !r.private) ||
      (visibilityFilter === 'private' && r.private);
    return matchesSearch && matchesLang && matchesVisibility;
  });

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      {/* Top Banner / Mode Switcher */}
      <div className="flex flex-col md:flex-row md:items-baseline justify-between gap-6 pb-6 border-b border-[#24222D]">
        <div>
          <div className="flex items-center gap-2 mb-1.5 text-[#8C8C93] font-mono text-xs uppercase tracking-wider">
            <Github className="w-3.5 h-3.5 text-[#33FBFF]" />
            <span>Workflow Steps 1 &amp; 2 • Repository AST Inspector</span>
          </div>
          <h1 className="font-display text-2xl sm:text-3xl font-semibold tracking-tight text-[#FFFFFF]">
            Connect Repository &amp; Detect Services
          </h1>
          <p className="text-[#8C8C93] text-xs sm:text-sm mt-1 max-w-2xl leading-relaxed">
            DocForge inspects repository trees, <code className="text-[#33FBFF] font-mono text-xs bg-[#111015] px-1.5 py-0.5 rounded-md border border-[#24222D]">package.json</code>, lockfiles, and configuration to detect authentication, payment providers, analytics, and AI models.
          </p>
        </div>

        {/* Mode Selector Tabs */}
        <div className="flex bg-[#111015] p-1 rounded-md border border-[#24222D] self-start md:self-auto shrink-0 shadow-inner">
          <button
            onClick={() => setActiveMode('github')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all flex items-center gap-1.5 cursor-pointer ${
              activeMode === 'github' ? 'bg-[#B43BFF] text-white font-semibold shadow-[0_0_10px_rgba(180,59,255,0.3)]' : 'text-[#8C8C93] hover:text-white'
            }`}
          >
            <Github className="w-3.5 h-3.5" />
            <span>GitHub OAuth</span>
          </button>
          <button
            onClick={() => setActiveMode('scanner')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all flex items-center gap-1.5 cursor-pointer ${
              activeMode === 'scanner' ? 'bg-[#B43BFF] text-white font-semibold shadow-[0_0_10px_rgba(180,59,255,0.3)]' : 'text-[#8C8C93] hover:text-white'
            }`}
          >
            <Code className="w-3.5 h-3.5" />
            <span>AST Manifest</span>
          </button>
          <button
            onClick={() => setActiveMode('questionnaire')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all flex items-center gap-1.5 cursor-pointer ${
              activeMode === 'questionnaire' ? 'bg-[#B43BFF] text-white font-semibold shadow-[0_0_10px_rgba(180,59,255,0.3)]' : 'text-[#8C8C93] hover:text-white'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Questionnaire</span>
          </button>
        </div>
      </div>

      {/* Global Status Notifications */}
      {githubSuccess && (
        <div className="p-3.5 rounded-xs bg-[#0DB44A]/10 border border-[#0DB44A]/30 text-[#0DB44A] text-xs flex items-center justify-between shadow-md">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-[#0DB44A] shrink-0" />
            <span className="font-medium">{githubSuccess}</span>
          </div>
          <button
            onClick={() => setGithubSuccess(null)}
            className="text-[#0DB44A] hover:text-white cursor-pointer p-1"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {githubError && (
        <div className="p-3.5 rounded-xs bg-[#FF5A5A]/10 border border-[#FF5A5A]/30 text-[#FF5A5A] text-xs flex items-center justify-between shadow-md">
          <div className="flex items-center gap-2.5">
            <AlertCircle className="w-4 h-4 text-[#FF5A5A] shrink-0" />
            <span className="font-medium">{githubError}</span>
          </div>
          <button
            onClick={() => setGithubError(null)}
            className="text-[#FF5A5A] hover:text-white cursor-pointer p-1"
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
            /* Connected GitHub Account */
            <div className="bg-[#15141C] rounded-xs border border-[#24222D] p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-lg">
              <div className="flex items-center gap-3.5">
                <img
                  src={githubStatus.user.avatarUrl}
                  alt={githubStatus.user.login}
                  className="w-11 h-11 rounded-xs object-cover border border-[#24222D]"
                  referrerPolicy="no-referrer"
                />
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-[#FFFFFF] text-sm">{githubStatus.user.name || githubStatus.user.login}</span>
                    <span className="font-mono text-xs text-[#33FBFF]">@{githubStatus.user.login}</span>
                    <span className="px-1.5 py-0.5 rounded-xs text-[10px] font-mono uppercase tracking-wider bg-[#0DB44A]/10 text-[#0DB44A] border border-[#0DB44A]/30">
                      OAuth Active
                    </span>
                  </div>
                  <p className="text-[#8C8C93] text-xs mt-0.5 font-sans">
                    Authorized for {githubStatus.user.publicRepos} public and {githubStatus.user.totalPrivateRepos} private repositories • Tokens secured server-side
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 self-start md:self-auto shrink-0">
                <button
                  onClick={fetchRepos}
                  disabled={loadingRepos}
                  className="px-3 py-1.5 rounded-md border border-[#24222D] bg-[#18171E] hover:bg-[#201E28] text-[#F0F0F3] text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
                  title="Reload repositories from GitHub"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${loadingRepos ? 'animate-spin' : ''}`} />
                  <span>Refresh Repos</span>
                </button>

                <button
                  onClick={handleDisconnectGitHub}
                  disabled={loadingStatus}
                  className="px-3 py-1.5 rounded-md border border-[#FF5A5A]/30 bg-[#18171E] hover:bg-[#FF5A5A]/10 text-[#FF5A5A] text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Disconnect</span>
                </button>
              </div>
            </div>
          ) : (
            /* Not Connected State */
            <div className="bg-[#15141C] rounded-md border border-[#24222D] p-5 shadow-lg">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Github className="w-4 h-4 text-[#FFFFFF]" />
                    <h3 className="font-semibold text-[#FFFFFF] text-sm">Connect GitHub Account</h3>
                    {!githubStatus?.configured ? (
                      <span className="px-1.5 py-0.5 rounded-md text-[10px] font-mono uppercase bg-[#18171E] text-[#8C8C93] border border-[#24222D]">
                        OAuth Unset
                      </span>
                    ) : (
                      <span className="px-1.5 py-0.5 rounded-md text-[10px] font-mono uppercase bg-[#0DB44A]/10 text-[#0DB44A] border border-[#0DB44A]/30">
                        OAuth Configured
                      </span>
                    )}
                  </div>
                  <p className="text-[#8C8C93] text-xs max-w-2xl leading-relaxed">
                    Authenticate DocForge to read repository structures and dependency manifests to automatically extract integrated third-party services and audit compliance.
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2 shrink-0">
                  {githubStatus?.configured ? (
                    <button
                      onClick={handleConnectGitHub}
                      disabled={connectingOAuth}
                      className="px-4 py-2 bg-[#B43BFF] hover:bg-[#A127F5] text-white rounded-md text-xs font-semibold transition-all shadow-[0_0_12px_rgba(180,59,255,0.25)] flex items-center gap-2 cursor-pointer disabled:opacity-50"
                    >
                      {connectingOAuth ? (
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Github className="w-3.5 h-3.5" />
                      )}
                      <span>{connectingOAuth ? 'Authorizing...' : 'Connect GitHub'}</span>
                    </button>
                  ) : null}

                  <button
                    onClick={() => setPatModalOpen(true)}
                    className="px-3.5 py-2 bg-[#18171E] hover:bg-[#201E28] text-[#F0F0F3] border border-[#24222D] rounded-md text-xs font-medium transition-colors flex items-center gap-2 cursor-pointer"
                  >
                    <Key className="w-3.5 h-3.5 text-[#33FBFF]" />
                    <span>Connect with Token</span>
                  </button>
                </div>
              </div>

              {/* Fallback button if popup was blocked */}
              {blockedPopupUrl && (
                <div className="mt-4 p-3 rounded-md bg-[#18171E] border border-[#24222D] text-[#F0F0F3] text-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-[#33FBFF] shrink-0" />
                    <span>Popup blocked? Open authorization in new tab:</span>
                  </div>
                  <a
                    href={blockedPopupUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3 py-1.5 bg-[#B43BFF] hover:bg-[#A127F5] text-white rounded-md font-medium text-xs flex items-center gap-1.5 transition-all shrink-0"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>Open GitHub in New Tab</span>
                  </a>
                </div>
              )}

              {!githubStatus?.configured && (
                <div className="mt-4 p-4 rounded-xs bg-[#111015] border border-[#24222D] text-[#F0F0F3] text-xs space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="font-semibold text-[#FFFFFF] flex items-center gap-1.5">
                      <AlertCircle className="w-4 h-4 text-[#33FBFF]" />
                      <span>Configure GitHub OAuth App or Connect Instantly with a Token</span>
                    </div>
                    <button
                      onClick={() => setPatModalOpen(true)}
                      className="text-xs font-medium text-[#33FBFF] underline hover:text-white flex items-center gap-1 cursor-pointer"
                    >
                      <Key className="w-3.5 h-3.5" />
                      <span>Use Token (No Setup Required)</span>
                    </button>
                  </div>
                  <p className="text-[#8C8C93] leading-relaxed">
                    To use OAuth, create an OAuth App in GitHub Developer Settings with the following endpoints, then supply <code className="bg-[#18171E] px-1.5 py-0.5 rounded-xs border border-[#24222D] font-mono text-[11px] text-[#33FBFF]">GITHUB_CLIENT_ID</code> and <code className="bg-[#18171E] px-1.5 py-0.5 rounded-xs border border-[#24222D] font-mono text-[11px] text-[#33FBFF]">GITHUB_CLIENT_SECRET</code>:
                  </p>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
                    <div className="bg-[#15141C] p-3 rounded-xs border border-[#24222D] space-y-1">
                      <span className="text-[10px] font-mono font-medium text-[#8C8C93] uppercase tracking-wider">Homepage URL</span>
                      <div className="flex items-center justify-between gap-2 font-mono text-[11px] text-[#33FBFF] bg-[#111015] px-2 py-1 rounded-xs border border-[#24222D]">
                        <span className="truncate">{window.location.origin}</span>
                        <button
                          onClick={() => {
                            navigator.clipboard.writeText(window.location.origin);
                          }}
                          className="text-[#8C8C93] hover:text-white shrink-0"
                          title="Copy Homepage URL"
                        >
                          <Copy className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    <div className="bg-[#15141C] p-3 rounded-xs border border-[#24222D] space-y-1">
                      <span className="text-[10px] font-mono font-medium text-[#8C8C93] uppercase tracking-wider">Authorization Callback URL</span>
                      <div className="flex items-center justify-between gap-2 font-mono text-[11px] text-[#33FBFF] bg-[#111015] px-2 py-1 rounded-xs border border-[#24222D]">
                        <span className="truncate">{`${window.location.origin}/api/github/oauth/callback`}</span>
                        <button
                          onClick={() => {
                            navigator.clipboard.writeText(`${window.location.origin}/api/github/oauth/callback`);
                            setCopiedCallback(true);
                            setTimeout(() => setCopiedCallback(false), 2000);
                          }}
                          className="text-[#8C8C93] hover:text-white shrink-0"
                          title="Copy Callback URL"
                        >
                          {copiedCallback ? <Check className="w-3.5 h-3.5 text-[#0DB44A]" /> : <Copy className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Quick Input Bar for Any Repo */}
          <div className="bg-[#15141C] rounded-md border border-[#24222D] p-5 shadow-lg">
            <h2 className="text-sm font-semibold text-[#FFFFFF] mb-1 flex items-center gap-2">
              <Github className="w-4 h-4 text-[#33FBFF]" />
              <span>Inspect Repository by Name or URL</span>
            </h2>
            <p className="text-xs text-[#8C8C93] mb-3">
              Enter any public or connected private repository (e.g. <code className="text-[#33FBFF] font-mono bg-[#111015] px-1.5 py-0.5 rounded-md border border-[#24222D]">owner/repo</code> or full GitHub URL) to inspect dependencies, README, and API routes.
            </p>

            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Github className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#8C8C93]" />
                <input
                  type="text"
                  value={repoInput}
                  onChange={(e) => setRepoInput(e.target.value)}
                  placeholder="e.g. owner/repo or https://github.com/owner/repo"
                  className="w-full pl-10 pr-4 py-2 bg-[#18171E] border border-[#24222D] rounded-md text-xs font-mono text-[#F0F0F3] placeholder-[#8C8C93] focus:border-[#B43BFF] outline-none transition-colors"
                />
              </div>

              <button
                onClick={() => handleDeepInspectRepo(repoInput)}
                disabled={isScanning || !repoInput.trim()}
                className="px-5 py-2 bg-[#B43BFF] hover:bg-[#A127F5] text-white rounded-md text-xs font-semibold transition-all shadow-[0_0_12px_rgba(180,59,255,0.25)] flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 shrink-0"
              >
                {isScanning ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Scanning AST Tree...</span>
                  </>
                ) : (
                  <>
                    <Code className="w-3.5 h-3.5" />
                    <span>Deep Inspect Repository</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Authorized Repositories List */}
          {githubStatus?.connected ? (
            <div className="bg-[#15141C] rounded-md border border-[#24222D] p-5 shadow-lg space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h3 className="font-semibold text-[#FFFFFF] text-sm flex items-center gap-2">
                    <span>Authorized Repositories</span>
                    <span className="text-xs px-1.5 py-0.5 rounded-md bg-[#18171E] text-[#33FBFF] font-mono font-medium border border-[#24222D]">
                      {userRepos.length}
                    </span>
                  </h3>
                  <p className="text-xs text-[#8C8C93] mt-0.5">
                    Select a repository to scan or re-scan and detect changes before updating legal documentation.
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  {distinctLanguages.length > 0 && (
                    <select
                      value={languageFilter}
                      onChange={(e) => setLanguageFilter(e.target.value)}
                      className="text-xs bg-[#18171E] border border-[#24222D] rounded-md px-2.5 py-1.5 outline-none text-[#F0F0F3] focus:border-[#B43BFF]"
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
                    <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[#8C8C93]" />
                    <input
                      type="text"
                      value={repoSearch}
                      onChange={(e) => setRepoSearch(e.target.value)}
                      placeholder="Filter repos..."
                      className="pl-8 pr-3 py-1.5 text-xs bg-[#18171E] border border-[#24222D] rounded-md outline-none text-[#F0F0F3] placeholder-[#8C8C93] focus:border-[#B43BFF] w-44 sm:w-52"
                    />
                  </div>
                </div>
              </div>

              {/* Visibility Filter Tabs & Private Repos Guide Trigger */}
              <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-[#24222D]/60">
                <div className="flex items-center gap-1.5 bg-[#111015] p-1 rounded-md border border-[#24222D]">
                  <button
                    onClick={() => setVisibilityFilter('all')}
                    className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors cursor-pointer flex items-center gap-1.5 ${
                      visibilityFilter === 'all'
                        ? 'bg-[#B43BFF] text-white font-semibold'
                        : 'text-[#8C8C93] hover:text-[#FFFFFF] hover:bg-[#18171E]'
                    }`}
                  >
                    <span>All</span>
                    <span className="text-[10px] font-mono px-1 rounded-sm bg-black/20">{userRepos.length}</span>
                  </button>

                  <button
                    onClick={() => setVisibilityFilter('public')}
                    className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors cursor-pointer flex items-center gap-1.5 ${
                      visibilityFilter === 'public'
                        ? 'bg-[#B43BFF] text-white font-semibold'
                        : 'text-[#8C8C93] hover:text-[#FFFFFF] hover:bg-[#18171E]'
                    }`}
                  >
                    <Globe className="w-3 h-3" />
                    <span>Public</span>
                    <span className="text-[10px] font-mono px-1 rounded-sm bg-black/20">{publicCount}</span>
                  </button>

                  <button
                    onClick={() => setVisibilityFilter('private')}
                    className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors cursor-pointer flex items-center gap-1.5 ${
                      visibilityFilter === 'private'
                        ? 'bg-[#B43BFF] text-white font-semibold'
                        : 'text-[#8C8C93] hover:text-[#FFFFFF] hover:bg-[#18171E]'
                    }`}
                  >
                    <Lock className="w-3 h-3" />
                    <span>Private</span>
                    <span className="text-[10px] font-mono px-1 rounded-sm bg-black/20">{privateCount}</span>
                  </button>
                </div>

                <button
                  onClick={() => setShowPrivateRepoHelp(!showPrivateRepoHelp)}
                  className="text-xs text-[#33FBFF] hover:text-[#FFFFFF] flex items-center gap-1 px-2.5 py-1 rounded-md bg-[#18171E] border border-[#24222D] hover:border-[#33FBFF]/40 transition-colors cursor-pointer"
                >
                  <HelpCircle className="w-3.5 h-3.5 text-[#33FBFF]" />
                  <span>{showPrivateRepoHelp ? 'Hide Private Repos Info' : 'Private Repos FAQ'}</span>
                </button>
              </div>

              {/* Private Repository Access Info Callout */}
              {showPrivateRepoHelp && (
                <div className="p-4 rounded-md bg-[#111015] border border-[#33FBFF]/30 text-xs text-[#F0F0F3] space-y-2.5">
                  <div className="flex items-center gap-2 font-semibold text-[#33FBFF]">
                    <Lock className="w-4 h-4" />
                    <span>How Private Repositories Work with GitHub &amp; DocForge</span>
                  </div>
                  <p className="text-[#C9C8D2] leading-relaxed">
                    By default, GitHub only returns private repositories if your authentication token has been granted explicit read permissions. Here is how to ensure private repositories appear:
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-1">
                    <div className="p-2.5 rounded-md bg-[#18171E] border border-[#24222D] space-y-1">
                      <div className="font-semibold text-white flex items-center gap-1.5">
                        <Key className="w-3 h-3 text-[#B43BFF]" />
                        <span>Classic Token (PAT)</span>
                      </div>
                      <p className="text-[11px] text-[#8C8C93] leading-relaxed">
                        When creating the token in GitHub Settings, make sure the <strong className="text-white">repo</strong> (Full control of private repositories) scope is checked.
                      </p>
                    </div>

                    <div className="p-2.5 rounded-md bg-[#18171E] border border-[#24222D] space-y-1">
                      <div className="font-semibold text-white flex items-center gap-1.5">
                        <ShieldCheck className="w-3 h-3 text-[#0DB44A]" />
                        <span>Fine-Grained Token</span>
                      </div>
                      <p className="text-[11px] text-[#8C8C93] leading-relaxed">
                        Under "Repository access", choose <strong className="text-white">All repositories</strong> (or specifically select your private repos) and grant <strong className="text-white">Contents: Read-only</strong>.
                      </p>
                    </div>

                    <div className="p-2.5 rounded-md bg-[#18171E] border border-[#24222D] space-y-1">
                      <div className="font-semibold text-white flex items-center gap-1.5">
                        <Code className="w-3 h-3 text-[#33FBFF]" />
                        <span>Direct Inspection</span>
                      </div>
                      <p className="text-[11px] text-[#8C8C93] leading-relaxed">
                        You can paste ANY private repo name (e.g. <code className="text-[#33FBFF]">owner/private-repo</code>) into the input box above to inspect it directly without loading the full list.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {loadingRepos ? (
                <div className="py-12 text-center text-[#8C8C93] text-xs flex flex-col items-center gap-2">
                  <RefreshCw className="w-4 h-4 animate-spin text-[#33FBFF]" />
                  <span>Loading authorized repositories from GitHub...</span>
                </div>
              ) : filteredRepos.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {filteredRepos.map((r) => {
                    const isCurrentProject = Boolean(project?.githubUrl && project.githubUrl.includes(r.fullName));
                    return (
                      <div
                        key={r.id}
                        className={`p-3.5 rounded-md border transition-all text-left flex flex-col justify-between ${
                          isCurrentProject
                            ? 'border-[#B43BFF] bg-[#18171E] shadow-[0_0_12px_rgba(180,59,255,0.15)]'
                            : 'border-[#24222D] bg-[#15141C] hover:border-[#B43BFF]/50'
                        }`}
                      >
                        <div>
                          <div className="flex items-start justify-between gap-2">
                            <div className="font-semibold text-xs text-[#FFFFFF] truncate">{r.name}</div>
                            {r.private ? (
                              <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded-md font-medium shrink-0 bg-[#B43BFF]/15 text-[#B43BFF] border border-[#B43BFF]/30 flex items-center gap-1">
                                <Lock className="w-2.5 h-2.5" />
                                <span>Private</span>
                              </span>
                            ) : (
                              <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded-md font-medium shrink-0 bg-[#111015] text-[#8C8C93] border border-[#24222D] flex items-center gap-1">
                                <Globe className="w-2.5 h-2.5" />
                                <span>Public</span>
                              </span>
                            )}
                          </div>

                          <p className="text-[11px] text-[#8C8C93] mt-1 line-clamp-2 h-8 leading-relaxed">
                            {r.description || 'No description provided.'}
                          </p>
                        </div>

                        <div className="mt-3 pt-2.5 border-t border-[#24222D] flex items-center justify-between">
                          <div className="flex items-center gap-2 text-[11px] text-[#8C8C93] font-mono">
                            <span className="text-[#33FBFF]">{r.language || 'Code'}</span>
                            <span>•</span>
                            <span className="flex items-center gap-0.5">
                              <Star className="w-3 h-3 text-[#8C8C93]" />
                              {r.stargazersCount}
                            </span>
                          </div>

                          <div className="flex items-center gap-1.5">
                            {isCurrentProject ? (
                              <button
                                onClick={() => handleCompareDiff(r.htmlUrl, r.fullName)}
                                disabled={diffComparing || isScanning}
                                className="px-2.5 py-1 bg-[#B43BFF] hover:bg-[#A127F5] text-white rounded-md text-xs font-semibold transition-all shadow-[0_0_10px_rgba(180,59,255,0.25)] cursor-pointer disabled:opacity-50 flex items-center gap-1"
                              >
                                {diffComparing ? <RefreshCw className="w-3 h-3 animate-spin" /> : <Diff className="w-3 h-3" />}
                                <span>Re-scan &amp; Diff</span>
                              </button>
                            ) : (
                              <button
                                onClick={() => handleDeepInspectRepo(r.htmlUrl)}
                                disabled={isScanning}
                                className="px-2.5 py-1 bg-[#18171E] hover:bg-[#201E28] border border-[#24222D] text-[#F0F0F3] hover:text-white rounded-md text-xs font-medium transition-colors cursor-pointer disabled:opacity-50 flex items-center gap-1"
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
                <div className="py-12 text-center text-[#8C8C93] text-xs">
                  <Github className="w-6 h-6 text-[#8C8C93] mx-auto mb-2" />
                  <p className="font-semibold text-[#FFFFFF]">No repositories matched your filter.</p>
                  <p className="text-[#8C8C93] mt-1">Try switching the visibility filter or inspect a repository directly above.</p>
                </div>
              )}
            </div>
          ) : (
            <div className="bg-[#15141C] rounded-md border border-[#24222D] p-8 text-center space-y-4 shadow-lg">
              <div className="w-10 h-10 rounded-md bg-[#18171E] text-[#33FBFF] flex items-center justify-center mx-auto border border-[#24222D]">
                <Github className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <h3 className="font-semibold text-[#FFFFFF] text-base">Connect GitHub to View Repositories</h3>
                <p className="text-[#8C8C93] text-xs max-w-md mx-auto leading-relaxed">
                  Authenticate your GitHub account using OAuth or a Personal Access Token to browse private and public repositories and inspect your tech stack.
                </p>
              </div>
              <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                {githubStatus?.configured && (
                  <button
                    onClick={handleConnectGitHub}
                    disabled={connectingOAuth}
                    className="px-5 py-2 bg-[#B43BFF] hover:bg-[#A127F5] text-white rounded-md text-xs font-semibold transition-all shadow-[0_0_12px_rgba(180,59,255,0.25)] inline-flex items-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    {connectingOAuth ? (
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Github className="w-3.5 h-3.5" />
                    )}
                    <span>{connectingOAuth ? 'Opening...' : 'Connect GitHub Account'}</span>
                  </button>
                )}
                <button
                  onClick={() => setPatModalOpen(true)}
                  className="px-4 py-2 bg-[#18171E] hover:bg-[#201E28] text-[#F0F0F3] border border-[#24222D] rounded-md text-xs font-medium transition-colors inline-flex items-center gap-2 cursor-pointer"
                >
                  <Key className="w-3.5 h-3.5 text-[#33FBFF]" />
                  <span>Connect with Personal Access Token</span>
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* AST MANIFEST & ENVIRONMENT SCANNER MODE */}
      {activeMode === 'scanner' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-7 space-y-6">
            <div className="bg-[#15141C] rounded-xs border border-[#24222D] p-5 shadow-lg">
              <h2 className="text-sm font-semibold text-[#FFFFFF] mb-1 flex items-center gap-2">
                <Code className="w-4 h-4 text-[#33FBFF]" />
                <span>Package Manifest &amp; Environment Keys</span>
              </h2>
              <p className="text-xs text-[#8C8C93] mb-4">
                Paste your <code className="text-[#33FBFF] font-mono text-xs bg-[#111015] px-1.5 py-0.5 rounded-xs border border-[#24222D]">package.json</code> or sample environment variables to extract integrated services.
              </p>

              <div className="space-y-4">
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="text-xs font-mono uppercase tracking-wider text-[#8C8C93]">
                      package.json payload
                    </label>
                    <span className="text-[11px] text-[#8C8C93] font-mono">AST dependency evaluation</span>
                  </div>
                  <textarea
                    rows={8}
                    value={packageJsonInput}
                    onChange={(e) => setPackageJsonInput(e.target.value)}
                    className="w-full font-mono text-xs p-3 rounded-xs border border-[#24222D] bg-[#18171E] text-[#F0F0F3] placeholder-[#8C8C93] focus:border-[#753CFF] transition-colors outline-none"
                    placeholder="{ ...dependencies }"
                  />
                </div>

                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="text-xs font-mono uppercase tracking-wider text-[#8C8C93]">
                      Environment Variables Template (.env.example)
                    </label>
                    <span className="text-[11px] text-[#8C8C93] font-mono">Key names only (values sanitized)</span>
                  </div>
                  <textarea
                    rows={4}
                    value={envVarsInput}
                    onChange={(e) => setEnvVarsInput(e.target.value)}
                    className="w-full font-mono text-xs p-3 rounded-xs border border-[#24222D] bg-[#18171E] text-[#F0F0F3] placeholder-[#8C8C93] focus:border-[#753CFF] transition-colors outline-none"
                    placeholder="NEXT_PUBLIC_API_KEY=..."
                  />
                </div>

                <div className="pt-2 flex items-center justify-between border-t border-[#24222D]">
                  <div className="flex items-center gap-2 text-xs text-[#8C8C93]">
                    <ShieldCheck className="w-3.5 h-3.5 text-[#0DB44A]" />
                    <span>Zero secrets dispatched. Only dependency keys evaluated.</span>
                  </div>

                  <button
                    onClick={handleRunManualScan}
                    disabled={isScanning}
                    className="px-4 py-2 bg-[#B43BFF] hover:bg-[#A127F5] text-white rounded-md text-xs font-semibold transition-all shadow-[0_0_12px_rgba(180,59,255,0.25)] flex items-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    {isScanning ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        <span>Analyzing Dependencies...</span>
                      </>
                    ) : (
                      <>
                        <Code className="w-3.5 h-3.5" />
                        <span>Scan &amp; Detect Tech Stack</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="lg:col-span-5 space-y-4">
            <div className="bg-[#15141C] rounded-md border border-[#24222D] p-5 shadow-lg">
              <h3 className="font-semibold text-[#FFFFFF] text-sm mb-1">Live Stack Footprint</h3>
              <p className="text-xs text-[#8C8C93] mb-4">
                Services discovered from current AST parser.
              </p>

              <div className="space-y-2">
                <div className="p-2.5 rounded-md bg-[#18171E] border border-[#24222D] flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CreditCard className="w-3.5 h-3.5 text-[#33FBFF]" />
                    <span className="text-xs font-medium text-[#F0F0F3]">Billing:</span>
                  </div>
                  <span className="text-xs font-mono text-[#FFFFFF]">
                    {project?.paymentProviders && project.paymentProviders.length > 0 ? project.paymentProviders.join(', ') : 'None'}
                  </span>
                </div>

                <div className="p-2.5 rounded-md bg-[#18171E] border border-[#24222D] flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-3.5 h-3.5 text-[#0DB44A]" />
                    <span className="text-xs font-medium text-[#F0F0F3]">Auth:</span>
                  </div>
                  <span className="text-xs font-mono text-[#FFFFFF] truncate max-w-[180px]">
                    {project?.authMethods && project.authMethods.length > 0 ? project.authMethods.join(', ') : 'None'}
                  </span>
                </div>

                <div className="p-2.5 rounded-md bg-[#18171E] border border-[#24222D] flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Bot className="w-3.5 h-3.5 text-[#B43BFF]" />
                    <span className="text-xs font-medium text-[#F0F0F3]">AI Models:</span>
                  </div>
                  <span className="text-xs font-mono text-[#FFFFFF] truncate max-w-[180px]">
                    {project?.aiModels && project.aiModels.length > 0 ? project.aiModels.join(', ') : 'None'}
                  </span>
                </div>

                <div className="p-2.5 rounded-md bg-[#18171E] border border-[#24222D] flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <BarChart3 className="w-3.5 h-3.5 text-[#33FBFF]" />
                    <span className="text-xs font-medium text-[#F0F0F3]">Analytics:</span>
                  </div>
                  <span className="text-xs font-mono text-[#FFFFFF]">
                    {project?.analyticsProviders && project.analyticsProviders.length > 0 ? project.analyticsProviders.join(', ') : 'None'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* QUESTIONNAIRE MODE */}
      {activeMode === 'questionnaire' && (
        <div className="bg-[#15141C] rounded-md border border-[#24222D] p-5 space-y-5 shadow-lg">
          <div>
            <h2 className="text-sm font-semibold text-[#FFFFFF] mb-1">Developer Questionnaire</h2>
            <p className="text-xs text-[#8C8C93]">
              Provide project parameters manually to generate tailored legal and technical docs.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-mono uppercase tracking-wider text-[#8C8C93] mb-1">Project Name</label>
              <input
                type="text"
                value={projectName}
                onChange={(e) => {
                  setProjectName(e.target.value);
                  onUpdateProject({ name: e.target.value });
                }}
                className="w-full px-3 py-1.5 text-xs border border-[#24222D] bg-[#18171E] text-[#F0F0F3] placeholder-[#8C8C93] rounded-md outline-none focus:border-[#B43BFF]"
              />
            </div>

            <div>
              <label className="block text-xs font-mono uppercase tracking-wider text-[#8C8C93] mb-1">Website URL</label>
              <input
                type="url"
                value={websiteUrl}
                onChange={(e) => {
                  setWebsiteUrl(e.target.value);
                  onUpdateProject({ websiteUrl: e.target.value });
                }}
                className="w-full px-3 py-1.5 text-xs border border-[#24222D] bg-[#18171E] text-[#F0F0F3] placeholder-[#8C8C93] rounded-md outline-none focus:border-[#B43BFF]"
              />
            </div>
          </div>
        </div>
      )}

      {/* DATA HANDLING CLASSIFICATION & SUMMARY */}
      <div className="bg-[#15141C] rounded-md border border-[#24222D] p-5 shadow-lg">
        <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-4 mb-4 pb-3 border-b border-[#24222D]">
          <div>
            <h3 className="font-semibold text-[#FFFFFF] text-sm flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-[#33FBFF]" />
              <span>Data Handling Classification &amp; Regulatory Baseline</span>
            </h3>
            <p className="text-xs text-[#8C8C93] mt-0.5">
              Identifies confirmed vs unconfirmed personal data flows that trigger mandatory legal clauses.
            </p>
          </div>

          {project && (
            <div className="flex items-center gap-2">
              <button
                onClick={onNavigateToReview}
                className="px-3.5 py-1.5 bg-[#B43BFF] hover:bg-[#A127F5] text-white rounded-md text-xs font-semibold transition-all shadow-[0_0_10px_rgba(180,59,255,0.25)] flex items-center gap-1.5 cursor-pointer"
              >
                <SlidersHorizontal className="w-3.5 h-3.5" />
                <span>Step 3: Human Review ({project.complianceScore > 0 ? `${project.complianceScore}% Ready` : 'Pending'})</span>
              </button>
              <button
                onClick={onNavigateToDocs}
                className="px-3 py-1.5 bg-[#18171E] hover:bg-[#201E28] border border-[#24222D] text-[#F0F0F3] hover:text-white rounded-md text-xs font-medium transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <FileText className="w-3.5 h-3.5 text-[#33FBFF]" />
                <span>View Generated Docs</span>
              </button>
            </div>
          )}
        </div>

        {!project || (!project.techStack?.length && !project.authMethods?.length && !project.paymentProviders?.length && !project.analyticsProviders?.length && !project.aiModels?.length) ? (
          <div className="p-8 rounded-xs border border-dashed border-[#24222D] bg-[#111015] text-center space-y-2">
            <div className="w-8 h-8 rounded-xs bg-[#18171E] text-[#8C8C93] flex items-center justify-center mx-auto mb-2 border border-[#24222D]">
              <ShieldCheck className="w-4 h-4 text-[#33FBFF]" />
            </div>
            <h4 className="text-sm font-semibold text-[#FFFFFF]">Awaiting Codebase or Repository Inspection</h4>
            <p className="text-xs text-[#8C8C93] max-w-md mx-auto leading-relaxed">
              Connect your GitHub repository above or paste a package manifest to automatically classify data categories, detect third-party integrations, and generate tailored compliance clauses.
            </p>
          </div>
        ) : (
          /* Data Categories Grid */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            <div className="p-3.5 rounded-xs bg-[#18171E] border border-[#24222D]">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-semibold text-[#FFFFFF]">User Accounts</span>
                <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded-xs ${
                  project.authMethods && project.authMethods.length > 0 ? 'bg-[#0DB44A]/10 text-[#0DB44A] border border-[#0DB44A]/30' : 'bg-[#111015] text-[#8C8C93] border border-[#24222D]'
                }`}>
                  {project.authMethods && project.authMethods.length > 0 ? 'Detected' : 'Not Detected'}
                </span>
              </div>
              <p className="text-[11px] text-[#8C8C93] leading-relaxed">
                {project.authMethods && project.authMethods.length > 0
                  ? `${project.authMethods.join(', ')}. Requires explicit account deletion SLA.`
                  : 'No authentication providers detected.'}
              </p>
            </div>

            <div className="p-3.5 rounded-xs bg-[#18171E] border border-[#24222D]">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-semibold text-[#FFFFFF]">Payment &amp; Invoicing</span>
                <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded-xs ${
                  project.paymentProviders && project.paymentProviders.length > 0 ? 'bg-[#0DB44A]/10 text-[#0DB44A] border border-[#0DB44A]/30' : 'bg-[#111015] text-[#8C8C93] border border-[#24222D]'
                }`}>
                  {project.paymentProviders && project.paymentProviders.length > 0 ? 'Detected' : 'Not Detected'}
                </span>
              </div>
              <p className="text-[11px] text-[#8C8C93] leading-relaxed">
                {project.paymentProviders && project.paymentProviders.length > 0
                  ? `${project.paymentProviders.join(', ')}. Triggers PCI-DSS and 14-day refund policy.`
                  : 'No payment gateways or billing SDKs identified in code.'}
              </p>
            </div>

            <div className="p-3.5 rounded-xs bg-[#18171E] border border-[#24222D]">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-semibold text-[#FFFFFF]">Telemetry &amp; Analytics</span>
                <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded-xs ${
                  project.analyticsProviders && project.analyticsProviders.length > 0 ? 'bg-[#0DB44A]/10 text-[#0DB44A] border border-[#0DB44A]/30' : 'bg-[#111015] text-[#8C8C93] border border-[#24222D]'
                }`}>
                  {project.analyticsProviders && project.analyticsProviders.length > 0 ? 'Detected' : 'Not Detected'}
                </span>
              </div>
              <p className="text-[11px] text-[#8C8C93] leading-relaxed">
                {project.analyticsProviders && project.analyticsProviders.length > 0
                  ? `${project.analyticsProviders.join(', ')}. Requires cookie disclosure and opt-out notice.`
                  : 'No product telemetry or cookie-tracking SDKs identified.'}
              </p>
            </div>

            <div className="p-3.5 rounded-xs bg-[#18171E] border border-[#24222D]">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-semibold text-[#FFFFFF]">Generative AI Models</span>
                <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded-xs ${
                  project.aiModels && project.aiModels.length > 0 ? 'bg-[#753CFF]/15 text-[#33FBFF] border border-[#753CFF]/40' : 'bg-[#111015] text-[#8C8C93] border border-[#24222D]'
                }`}>
                  {project.aiModels && project.aiModels.length > 0 ? 'Detected' : 'None Detected'}
                </span>
              </div>
              <p className="text-[11px] text-[#8C8C93] leading-relaxed">
                {project.aiModels && project.aiModels.length > 0
                  ? `${project.aiModels.join(', ')}. Triggers EU AI Act Article 50 transparency notice.`
                  : 'No generative AI or machine learning models identified.'}
              </p>
            </div>

            <div className="p-3.5 rounded-xs bg-[#18171E] border border-[#24222D]">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-semibold text-[#FFFFFF]">System Logs &amp; Traces</span>
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded-xs bg-[#0DB44A]/10 text-[#0DB44A] border border-[#0DB44A]/30">
                  Confirmed
                </span>
              </div>
              <p className="text-[11px] text-[#8C8C93] leading-relaxed">
                Standard HTTP server logs and IP addresses kept strictly for security defense.
              </p>
            </div>

            <div className="p-3.5 rounded-xs bg-[#18171E] border border-[#24222D]">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-semibold text-[#FFFFFF]">Uploaded Files &amp; Media</span>
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded-xs bg-[#111015] text-[#8C8C93] border border-[#24222D]">
                  Needs Confirmation
                </span>
              </div>
              <p className="text-[11px] text-[#8C8C93] leading-relaxed">
                Disclose allowed MIME types and lifecycle retention window in Human Review.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* RE-SCAN & DIFF COMPARISON MODAL */}
      {diffModalOpen && diffData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs">
          <div className="bg-[#15141C] rounded-xs max-w-2xl w-full border border-[#24222D] overflow-hidden flex flex-col max-h-[90vh] shadow-2xl">
            <div className="p-4 bg-[#15141C] border-b border-[#24222D] flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-xs bg-[#18171E] flex items-center justify-center text-[#33FBFF] border border-[#24222D]">
                  <Diff className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold font-display text-[#FFFFFF]">Repository Re-Scan &amp; Diff Analysis</h3>
                  <p className="text-xs text-[#8C8C93] font-mono">Target: {diffData.targetRepoName}</p>
                </div>
              </div>
              <button
                onClick={() => setDiffModalOpen(false)}
                className="p-1 text-[#8C8C93] hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-4 overflow-y-auto text-xs text-[#F0F0F3]">
              {/* Important Review Policy Requirement */}
              <div className="p-3.5 rounded-xs bg-[#18171E] border border-[#753CFF]/40 text-[#F0F0F3] space-y-1">
                <div className="flex items-center gap-2 font-medium text-[#33FBFF]">
                  <AlertCircle className="w-3.5 h-3.5 text-[#33FBFF] shrink-0" />
                  <span>Mandatory Human Review Required</span>
                </div>
                <p className="text-[#8C8C93] leading-relaxed">
                  Do not automatically modify or publish your Privacy Policy. Regulations require developers to review detected code changes and confirm data collection practices before generating updated documents.
                </p>
              </div>

              <div className="p-3.5 rounded-xs bg-[#18171E] border border-[#24222D]">
                <p className="font-medium text-[#FFFFFF] text-xs mb-1">Scan Comparison Summary</p>
                <p className="text-[#8C8C93] leading-relaxed">{diffData.summary}</p>
              </div>

              {diffData.addedServices.length > 0 && (
                <div className="space-y-2">
                  <h4 className="font-mono uppercase tracking-wider text-[10px] text-[#0DB44A]">
                    + Newly Detected Services ({diffData.addedServices.length})
                  </h4>
                  <div className="space-y-1">
                    {diffData.addedServices.map((s: any, idx: number) => (
                      <div key={idx} className="p-2 rounded-xs bg-[#0DB44A]/10 border border-[#0DB44A]/30 flex items-center justify-between">
                        <div>
                          <span className="font-medium text-[#0DB44A]">{s.name}</span>
                          <span className="text-[#0DB44A]/70 text-[11px] ml-2 font-mono">({s.category})</span>
                        </div>
                        <span className="text-[10px] font-mono px-1.5 py-0.5 rounded-xs bg-[#0DB44A]/20 text-[#0DB44A]">
                          Needs Confirmation
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {diffData.removedServices.length > 0 && (
                <div className="space-y-2">
                  <h4 className="font-mono uppercase tracking-wider text-[10px] text-[#FF5A5A]">
                    - Removed Services ({diffData.removedServices.length})
                  </h4>
                  <div className="space-y-1">
                    {diffData.removedServices.map((s: any, idx: number) => (
                      <div key={idx} className="p-2 rounded-xs bg-[#FF5A5A]/10 border border-[#FF5A5A]/30 flex items-center justify-between">
                        <span className="font-medium text-[#FF5A5A]">{s.name}</span>
                        <span className="text-[10px] font-mono px-1.5 py-0.5 rounded-xs bg-[#FF5A5A]/20 text-[#FF5A5A]">
                          De-registered
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {diffData.addedRoutes.length > 0 && (
                <div className="space-y-2">
                  <h4 className="font-mono uppercase tracking-wider text-[10px] text-[#FFFFFF]">
                    + New API Endpoints ({diffData.addedRoutes.length})
                  </h4>
                  <div className="flex flex-wrap gap-1.5">
                    {diffData.addedRoutes.map((r, i) => (
                      <span key={i} className="px-1.5 py-0.5 rounded-xs font-mono text-[11px] bg-[#18171E] text-[#33FBFF] border border-[#24222D]">
                        {r}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="p-3 bg-[#111015] border-t border-[#24222D] flex items-center justify-between">
              <button
                onClick={() => setDiffModalOpen(false)}
                className="px-3 py-1.5 text-xs font-medium text-[#8C8C93] hover:text-white cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleApplyDiffAndReview}
                className="px-4 py-1.5 bg-[#B43BFF] hover:bg-[#A127F5] text-white rounded-md text-xs font-semibold transition-all shadow-[0_0_10px_rgba(180,59,255,0.25)] flex items-center gap-1.5 cursor-pointer"
              >
                <SlidersHorizontal className="w-3.5 h-3.5" />
                <span>Apply Scan &amp; Review in Human Audit</span>
              </button>
            </div>
          </div>
        </div>
      )}
      {/* GITHUB PERSONAL ACCESS TOKEN MODAL */}
      {patModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs">
          <div className="bg-[#15141C] rounded-md max-w-md w-full border border-[#24222D] overflow-hidden flex flex-col shadow-2xl">
            <div className="p-4 bg-[#15141C] border-b border-[#24222D] flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-md bg-[#18171E] flex items-center justify-center text-[#33FBFF] border border-[#24222D]">
                  <Key className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold font-display text-[#FFFFFF]">Connect via Personal Access Token</h3>
                  <p className="text-xs text-[#8C8C93]">Direct alternative to GitHub OAuth App</p>
                </div>
              </div>
              <button
                onClick={() => setPatModalOpen(false)}
                className="p-1 text-[#8C8C93] hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleConnectPAT} className="p-5 space-y-4">
              <p className="text-xs text-[#8C8C93] leading-relaxed">
                Connect your account immediately without configuring GitHub OAuth credentials. Tokens are stored only in your encrypted session cookie.
              </p>

              <div className="space-y-1">
                <label className="block text-xs font-mono uppercase tracking-wider text-[#8C8C93]">
                  GitHub Personal Access Token (classic or fine-grained)
                </label>
                <input
                  type="password"
                  value={patTokenInput}
                  onChange={(e) => setPatTokenInput(e.target.value)}
                  placeholder="ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                  required
                  className="w-full px-3 py-1.5 bg-[#18171E] border border-[#24222D] rounded-md text-xs font-mono text-[#F0F0F3] placeholder-[#8C8C93] focus:border-[#B43BFF] outline-none transition-colors"
                />
              </div>

              <div className="p-3 bg-[#111015] rounded-md border border-[#24222D] text-xs text-[#F0F0F3] space-y-1">
                <p className="font-medium flex items-center gap-1.5 text-[#33FBFF]">
                  <ExternalLink className="w-3.5 h-3.5 text-[#33FBFF]" />
                  <span>How to create a Personal Access Token:</span>
                </p>
                <ol className="list-decimal pl-4 space-y-0.5 text-[11px] text-[#8C8C93]">
                  <li>
                    Visit{' '}
                    <a
                      href="https://github.com/settings/tokens/new?scopes=repo,read:user&description=DocForge"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="underline font-medium text-[#33FBFF] hover:text-white"
                    >
                      GitHub Token Generator
                    </a>
                  </li>
                  <li>Check the <strong className="font-medium text-[#FFFFFF]">repo</strong> and <strong className="font-medium text-[#FFFFFF]">read:user</strong> scopes</li>
                  <li>Click <em>Generate token</em> at the bottom and paste it here</li>
                </ol>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2 border-t border-[#24222D]">
                <button
                  type="button"
                  onClick={() => setPatModalOpen(false)}
                  className="px-3 py-1.5 text-xs font-medium text-[#8C8C93] hover:text-white cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={patSubmitting || !patTokenInput.trim()}
                  className="px-4 py-1.5 bg-[#B43BFF] hover:bg-[#A127F5] text-white rounded-md text-xs font-semibold transition-all shadow-[0_0_10px_rgba(180,59,255,0.25)] flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  {patSubmitting ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Validating Token...</span>
                    </>
                  ) : (
                    <>
                      <Key className="w-3.5 h-3.5" />
                      <span>Connect Account</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
