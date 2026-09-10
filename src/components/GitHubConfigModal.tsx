import React, { useState, useEffect } from 'react';
import {
  X,
  Github,
  Key,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Copy,
  ExternalLink,
  Lock,
  RefreshCw,
  LogOut,
  Terminal,
  Eye,
  EyeOff
} from 'lucide-react';

interface GitHubConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConnectionChange?: () => void;
}

export const GitHubConfigModal: React.FC<GitHubConfigModalProps> = ({
  isOpen,
  onClose,
  onConnectionChange,
}) => {
  const [clientId, setClientId] = useState('');
  const [clientSecret, setClientSecret] = useState('');
  const [showSecret, setShowSecret] = useState(false);
  const [activeTab, setActiveTab] = useState<'configure' | 'account' | 'env'>('configure');

  const [loading, setLoading] = useState(false);
  const [statusData, setStatusData] = useState<{
    configured: boolean;
    clientIdPrefix: string | null;
    hasSecret: boolean;
    missingConfig: string[];
    connected: boolean;
    user: any | null;
  } | null>(null);

  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [copiedCallback, setCopiedCallback] = useState(false);
  const [copiedEnv, setCopiedEnv] = useState(false);

  const callbackUrl = typeof window !== 'undefined' ? `${window.location.origin}/api/github/oauth/callback` : '/api/github/oauth/callback';

  useEffect(() => {
    if (isOpen) {
      fetchStatus();
    }
  }, [isOpen]);

  const fetchStatus = async () => {
    setLoading(true);
    setMessage(null);
    try {
      const res = await fetch('/api/github/status');
      if (res.ok) {
        const data = await res.json();
        setStatusData(data);
        if (data.connected) {
          setActiveTab('account');
        }
      }
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Failed to fetch GitHub status' });
    } finally {
      setLoading(false);
    }
  };

  const handleSaveConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientId.trim() || !clientSecret.trim()) {
      setMessage({ type: 'error', text: 'Please provide both GitHub Client ID and Client Secret.' });
      return;
    }

    setLoading(true);
    setMessage(null);
    try {
      const res = await fetch('/api/github/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientId: clientId.trim(),
          clientSecret: clientSecret.trim(),
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setMessage({ type: 'success', text: 'GitHub OAuth credentials saved and activated on the server.' });
        setClientSecret('');
        await fetchStatus();
        if (onConnectionChange) onConnectionChange();
      } else {
        setMessage({ type: 'error', text: data.error || 'Failed to save configuration.' });
      }
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Network error updating GitHub credentials' });
    } finally {
      setLoading(false);
    }
  };

  const handleDisconnect = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/github/disconnect', { method: 'POST' });
      if (res.ok) {
        setMessage({ type: 'success', text: 'GitHub account disconnected successfully.' });
        await fetchStatus();
        if (onConnectionChange) onConnectionChange();
      }
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Failed to disconnect account' });
    } finally {
      setLoading(false);
    }
  };

  const copyCallbackToClipboard = () => {
    navigator.clipboard.writeText(callbackUrl);
    setCopiedCallback(true);
    setTimeout(() => setCopiedCallback(false), 2000);
  };

  const copyEnvSnippet = () => {
    const snippet = `# GitHub App / OAuth Configuration\nGITHUB_CLIENT_ID=${clientId || 'your_client_id_here'}\nGITHUB_CLIENT_SECRET=${clientSecret || 'your_client_secret_here'}\n`;
    navigator.clipboard.writeText(snippet);
    setCopiedEnv(true);
    setTimeout(() => setCopiedEnv(false), 2000);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
      <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="p-6 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center text-white border border-slate-700 shadow-sm">
              <Github className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold">GitHub App & OAuth Integration</h2>
                {statusData?.connected ? (
                  <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-950/80 border border-emerald-500/40 text-emerald-300">
                    Connected
                  </span>
                ) : statusData?.configured ? (
                  <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-indigo-950/80 border border-indigo-500/40 text-indigo-300">
                    Ready to Connect
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-amber-950/80 border border-amber-500/40 text-amber-300">
                    Credentials Missing
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Server-side OAuth 2.0 flow with automated token rotation and zero client exposure.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-200 bg-slate-50 px-6 pt-3 gap-2">
          <button
            onClick={() => setActiveTab('configure')}
            className={`pb-2.5 px-3 text-xs font-semibold border-b-2 transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'configure'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Key className="w-3.5 h-3.5" />
            <span>OAuth Credentials</span>
          </button>
          <button
            onClick={() => setActiveTab('account')}
            className={`pb-2.5 px-3 text-xs font-semibold border-b-2 transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'account'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Github className="w-3.5 h-3.5" />
            <span>Connected Account</span>
            {statusData?.connected && (
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            )}
          </button>
          <button
            onClick={() => setActiveTab('env')}
            className={`pb-2.5 px-3 text-xs font-semibold border-b-2 transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'env'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Terminal className="w-3.5 h-3.5" />
            <span>Server .env Guide</span>
          </button>
        </div>

        {/* Feedback Message */}
        {message && (
          <div
            className={`mx-6 mt-4 p-3 rounded-xl text-xs flex items-center gap-2.5 ${
              message.type === 'success'
                ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                : 'bg-red-50 text-red-800 border border-red-200'
            }`}
          >
            {message.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
            ) : (
              <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
            )}
            <span>{message.text}</span>
          </div>
        )}

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 text-slate-700 text-xs">
          {/* TAB 1: CONFIGURE CREDENTIALS */}
          {activeTab === 'configure' && (
            <div className="space-y-6">
              {/* Security Banner */}
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex items-start gap-3">
                <ShieldCheck className="w-5 h-5 text-indigo-600 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p className="font-semibold text-slate-900 text-xs">Secure OAuth Architecture</p>
                  <p className="text-slate-500 leading-relaxed">
                    DocForge exchanges temporary authorization codes server-side. Access tokens and client secrets are stored in secure HTTP-only cookies and memory, never returned in browser payloads.
                  </p>
                </div>
              </div>

              {/* Callback URL Card */}
              <div className="p-4 rounded-xl bg-indigo-50/50 border border-indigo-100 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-indigo-950 text-xs">
                    Authorization Callback URL (Required by GitHub):
                  </span>
                  <button
                    onClick={copyCallbackToClipboard}
                    className="flex items-center gap-1 text-[11px] font-semibold text-indigo-600 hover:text-indigo-800 cursor-pointer"
                  >
                    {copiedCallback ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedCallback ? 'Copied!' : 'Copy URL'}</span>
                  </button>
                </div>
                <div className="font-mono text-[11px] bg-white p-2.5 rounded-lg border border-indigo-200 text-slate-800 break-all select-all">
                  {callbackUrl}
                </div>
                <p className="text-[11px] text-slate-500">
                  Register this exact URL in GitHub under <strong>Authorization callback URL</strong>.
                </p>
              </div>

              {/* Step-by-Step GitHub Setup Guide */}
              <div className="space-y-2 border-t border-slate-100 pt-4">
                <h4 className="font-bold text-slate-900 text-xs">How to register on GitHub:</h4>
                <ol className="list-decimal list-inside space-y-1.5 text-slate-600 leading-relaxed">
                  <li>
                    Open GitHub{' '}
                    <a
                      href="https://github.com/settings/developers"
                      target="_blank"
                      rel="noreferrer"
                      className="text-indigo-600 font-semibold underline inline-flex items-center gap-0.5"
                    >
                      Developer settings &rarr; OAuth Apps
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </li>
                  <li>Click <strong>New OAuth App</strong></li>
                  <li>Application name: <strong>DocForge Legal Engine</strong></li>
                  <li>Homepage URL: <code className="font-mono bg-slate-100 px-1 py-0.5 rounded text-slate-800">{typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000'}</code></li>
                  <li>Authorization callback URL: <code className="font-mono bg-slate-100 px-1 py-0.5 rounded text-slate-800">{callbackUrl}</code></li>
                  <li>Click <strong>Register application</strong>, click <strong>Generate a new client secret</strong>, and copy both values below.</li>
                </ol>
              </div>

              {/* Form Input */}
              <form onSubmit={handleSaveConfig} className="space-y-4 border-t border-slate-100 pt-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    GitHub Client ID
                  </label>
                  <input
                    type="text"
                    value={clientId}
                    onChange={(e) => setClientId(e.target.value)}
                    placeholder={statusData?.clientIdPrefix ? `Current: ${statusData.clientIdPrefix}` : "e.g. Ov23li58..."}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl font-mono text-xs text-slate-900 focus:ring-2 focus:ring-indigo-500 focus:bg-white outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    GitHub Client Secret
                  </label>
                  <div className="relative">
                    <input
                      type={showSecret ? "text" : "password"}
                      value={clientSecret}
                      onChange={(e) => setClientSecret(e.target.value)}
                      placeholder={statusData?.hasSecret ? "••••••••••••••••••••••••••••••••" : "Paste GitHub Client Secret"}
                      className="w-full pl-3.5 pr-10 py-2.5 bg-slate-50 border border-slate-300 rounded-xl font-mono text-xs text-slate-900 focus:ring-2 focus:ring-indigo-500 focus:bg-white outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => setShowSecret(!showSecret)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      {showSecret ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1">
                    Client secret is retained server-side only for token exchange.
                  </p>
                </div>

                <div className="flex items-center justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loading || !clientId.trim() || !clientSecret.trim()}
                    className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold shadow-sm transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    {loading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Lock className="w-3.5 h-3.5" />}
                    <span>Save Server Credentials</span>
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* TAB 2: CONNECTED ACCOUNT */}
          {activeTab === 'account' && (
            <div className="space-y-6">
              {statusData?.connected && statusData.user ? (
                <div className="space-y-4">
                  <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <img
                        src={statusData.user.avatarUrl}
                        alt={statusData.user.login}
                        className="w-12 h-12 rounded-xl border border-slate-200 object-cover shadow-xs"
                        referrerPolicy="no-referrer"
                      />
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-900 text-sm">{statusData.user.name || statusData.user.login}</span>
                          <span className="font-mono text-xs text-indigo-600 font-semibold">@{statusData.user.login}</span>
                        </div>
                        <p className="text-slate-500 text-xs">{statusData.user.email || 'Email set to private'}</p>
                        <div className="flex items-center gap-3 text-[11px] text-slate-400 font-mono mt-1">
                          <span>{statusData.user.publicRepos} public repos</span>
                          <span>•</span>
                          <span>{statusData.user.totalPrivateRepos} private repos</span>
                        </div>
                      </div>
                    </div>

                    <a
                      href={statusData.user.htmlUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="px-3 py-1.5 rounded-lg border border-slate-300 text-slate-700 hover:bg-white text-xs font-semibold flex items-center gap-1.5 transition-colors"
                    >
                      <Github className="w-3.5 h-3.5" />
                      <span>View GitHub Profile</span>
                      <ExternalLink className="w-3 h-3 text-slate-400" />
                    </a>
                  </div>

                  <div className="p-4 rounded-xl bg-emerald-50/50 border border-emerald-200 text-emerald-900 space-y-1">
                    <div className="flex items-center gap-2 font-semibold text-xs text-emerald-800">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      <span>OAuth Scopes Granted:</span>
                    </div>
                    <p className="text-emerald-700 text-xs leading-relaxed">
                      <code className="bg-emerald-100 px-1 py-0.5 rounded font-mono">repo</code> (Full private and public repository inspection), <code className="bg-emerald-100 px-1 py-0.5 rounded font-mono">read:user</code>, and <code className="bg-emerald-100 px-1 py-0.5 rounded font-mono">user:email</code>.
                    </p>
                  </div>

                  <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                    <button
                      onClick={() => {
                        window.location.href = '/api/github/oauth/authorize';
                      }}
                      className="px-4 py-2 rounded-xl border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                      <span>Re-authorize or Switch Account</span>
                    </button>

                    <button
                      onClick={handleDisconnect}
                      disabled={loading}
                      className="px-4 py-2 rounded-xl bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      <span>Disconnect GitHub Account</span>
                    </button>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 space-y-4">
                  <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
                    <Github className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 text-sm">No GitHub Account Connected</h3>
                    <p className="text-slate-500 text-xs max-w-sm mx-auto mt-1">
                      Authorize DocForge to scan repository trees, dependencies, and configuration for privacy compliance.
                    </p>
                  </div>

                  {statusData?.configured ? (
                    <button
                      onClick={() => {
                        window.location.href = '/api/github/oauth/authorize';
                      }}
                      className="px-6 py-2.5 bg-slate-900 hover:bg-black text-white rounded-xl text-xs font-semibold shadow-sm transition-all inline-flex items-center gap-2 cursor-pointer"
                    >
                      <Github className="w-4 h-4" />
                      <span>Connect GitHub Account</span>
                    </button>
                  ) : (
                    <div className="p-3 bg-amber-50 border border-amber-200 text-amber-800 rounded-xl text-xs inline-block text-left">
                      <strong>OAuth credentials not configured:</strong> Please configure your Client ID and Client Secret in the <strong>OAuth Credentials</strong> tab before connecting.
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* TAB 3: SERVER .ENV GUIDE */}
          {activeTab === 'env' && (
            <div className="space-y-4">
              <p className="text-slate-600 leading-relaxed">
                For persistent cloud deployment or local development environments, declare these variables in your <code className="font-mono bg-slate-100 px-1 py-0.5 rounded text-slate-800">.env</code> file:
              </p>

              <div className="relative">
                <pre className="p-4 rounded-xl bg-slate-900 text-slate-100 font-mono text-xs overflow-x-auto">
{`# GitHub App / OAuth Credentials
GITHUB_CLIENT_ID=${statusData?.clientIdPrefix || 'Ov23li...'}
GITHUB_CLIENT_SECRET=${statusData?.hasSecret ? '••••••••••••••••' : 'your_client_secret_here'}
GITHUB_APP_ID=`}
                </pre>
                <button
                  onClick={copyEnvSnippet}
                  className="absolute top-3 right-3 p-1.5 rounded-lg bg-slate-800 text-slate-300 hover:text-white border border-slate-700 cursor-pointer flex items-center gap-1 text-[11px]"
                >
                  {copiedEnv ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedEnv ? 'Copied' : 'Copy'}</span>
                </button>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1 text-slate-500">
                <p className="font-semibold text-slate-800">Configuration Precedence:</p>
                <p>1. In-memory credentials submitted via the OAuth modal takes immediate precedence.</p>
                <p>2. Defaults fall back to container environment variables (<code className="font-mono text-[11px]">process.env.GITHUB_CLIENT_ID</code>).</p>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
          <div className="flex items-center gap-1.5">
            <Lock className="w-3.5 h-3.5 text-slate-400" />
            <span>Zero tokens stored on client browser</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 font-semibold cursor-pointer transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
