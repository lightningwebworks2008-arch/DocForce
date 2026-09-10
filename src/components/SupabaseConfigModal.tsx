import React, { useState } from 'react';
import {
  X,
  Database,
  Key,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Copy,
  ExternalLink,
  Lock,
  RefreshCw,
  Terminal,
  FileCode,
  Layers,
  HelpCircle,
  Eye,
  EyeOff
} from 'lucide-react';
import {
  getClientSupabaseCredentials,
  setClientSupabaseCredentials,
  clearClientSupabaseCredentials,
  testSupabaseConnection,
  isSupabaseConfigured
} from '../lib/supabase';

interface SupabaseConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SupabaseConfigModal: React.FC<SupabaseConfigModalProps> = ({ isOpen, onClose }) => {
  const currentCreds = getClientSupabaseCredentials();

  const [url, setUrl] = useState(currentCreds.url || '');
  const [publishableKey, setPublishableKey] = useState(currentCreds.publishableKey || '');
  const [showKey, setShowKey] = useState(false);
  const [activeSubTab, setActiveSubTab] = useState<'configure' | 'env' | 'rls'>('configure');

  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [copiedEnv, setCopiedEnv] = useState(false);
  const [copiedSql, setCopiedSql] = useState(false);

  if (!isOpen) return null;

  const handleTestConnection = async () => {
    setTesting(true);
    setTestResult(null);
    try {
      const res = await testSupabaseConnection(url.trim(), publishableKey.trim());
      setTestResult(res);
    } catch (e: any) {
      setTestResult({ success: false, message: e.message || 'Connection test failed' });
    } finally {
      setTesting(false);
    }
  };

  const handleSave = () => {
    if (!url.trim() || !publishableKey.trim()) {
      setTestResult({
        success: false,
        message: 'Please provide both the Supabase URL and Publishable Key to connect.',
      });
      return;
    }
    setClientSupabaseCredentials(url.trim(), publishableKey.trim());
  };

  const handleReset = () => {
    clearClientSupabaseCredentials();
  };

  const envSnippet = `# Supabase Current Publishable & Secret Key Configuration
VITE_SUPABASE_URL="${url || 'https://your-project.supabase.co'}"
VITE_SUPABASE_PUBLISHABLE_KEY="${publishableKey || 'sb_publishable_your_key_here'}"
# Server-side ONLY (never expose to client or browser):
SUPABASE_SECRET_KEY="sb_secret_your_backend_key_here"`;

  const sqlSnippet = `-- Enable Row Level Security (RLS) on all DocForge tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.github_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.repository_scans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.detected_services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.document_versions ENABLE ROW LEVEL SECURITY;

-- User-Isolation Policies (Users can only read & write their own records)
CREATE POLICY "Users can manage own profile" ON public.profiles FOR ALL USING (auth.uid() = id);
CREATE POLICY "Users can manage own github connections" ON public.github_connections FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage own projects" ON public.projects FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage own repository scans" ON public.repository_scans FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage own detected services" ON public.detected_services FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage own project questions" ON public.project_questions FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage own documents" ON public.documents FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage own document versions" ON public.document_versions FOR ALL USING (auth.uid() = user_id);`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
      <div className="relative w-full max-w-2xl rounded-2xl bg-slate-900 border border-slate-700 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/90">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                Supabase API Key Configuration
                <span
                  className={`text-[10px] uppercase font-mono font-bold tracking-wider px-2 py-0.5 rounded ${
                    isSupabaseConfigured
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                      : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                  }`}
                >
                  {isSupabaseConfigured ? 'Live Connected' : 'Setup Required'}
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Configure your Supabase URL &amp; Publishable Key with Row Level Security (RLS).
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
        <div className="flex items-center border-b border-slate-800 bg-slate-900/60 px-6 gap-2 pt-2">
          <button
            onClick={() => setActiveSubTab('configure')}
            className={`flex items-center gap-2 px-3 py-2 text-xs font-semibold border-b-2 transition-all cursor-pointer ${
              activeSubTab === 'configure'
                ? 'border-emerald-500 text-emerald-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Key className="w-3.5 h-3.5" />
            Paste Credentials
          </button>
          <button
            onClick={() => setActiveSubTab('env')}
            className={`flex items-center gap-2 px-3 py-2 text-xs font-semibold border-b-2 transition-all cursor-pointer ${
              activeSubTab === 'env'
                ? 'border-emerald-500 text-emerald-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Terminal className="w-3.5 h-3.5" />
            .env Configuration
          </button>
          <button
            onClick={() => setActiveSubTab('rls')}
            className={`flex items-center gap-2 px-3 py-2 text-xs font-semibold border-b-2 transition-all cursor-pointer ${
              activeSubTab === 'rls'
                ? 'border-emerald-500 text-emerald-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            Database RLS Schema
          </button>
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {activeSubTab === 'configure' && (
            <div className="space-y-4">
              {/* Architecture Info Callout */}
              <div className="p-3.5 rounded-xl bg-slate-800/80 border border-slate-700/80 text-xs space-y-2">
                <div className="flex items-center gap-2 font-semibold text-slate-200">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  <span>Modern Supabase Key Architecture (Publishable &amp; Secret)</span>
                </div>
                <p className="text-slate-300 leading-relaxed">
                  Supabase now uses the <strong className="text-white">Publishable Key</strong> system. The Publishable Key is safe to run in the browser client when protected by PostgreSQL <strong className="text-white">Row Level Security (RLS)</strong>.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                  <div className="p-2 rounded-lg bg-slate-900 border border-slate-700/50">
                    <span className="text-[10px] font-mono uppercase font-bold text-emerald-400 block">
                      Frontend Client
                    </span>
                    <span className="text-[11px] text-slate-300">
                      Uses <code className="text-emerald-300 font-mono">VITE_SUPABASE_PUBLISHABLE_KEY</code>.
                    </span>
                  </div>
                  <div className="p-2 rounded-lg bg-slate-900 border border-slate-700/50">
                    <span className="text-[10px] font-mono uppercase font-bold text-indigo-400 block">
                      Backend Server
                    </span>
                    <span className="text-[11px] text-slate-300">
                      Uses <code className="text-indigo-300 font-mono">SUPABASE_SECRET_KEY</code> (never sent to client).
                    </span>
                  </div>
                </div>
              </div>

              {/* Form Inputs */}
              <div className="space-y-4">
                {/* 1. Supabase URL */}
                <div>
                  <label className="block text-xs font-semibold text-slate-200 mb-1">
                    1. Supabase Project URL (<code className="text-indigo-300 font-mono">VITE_SUPABASE_URL</code>)
                  </label>
                  <input
                    type="url"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    placeholder="https://xyzprojectid.supabase.co"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 font-mono"
                  />
                  <span className="text-[11px] text-slate-400 block mt-1">
                    Found in Supabase Dashboard → Settings → API → Project URL.
                  </span>
                </div>

                {/* 2. Supabase Publishable Key */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-semibold text-slate-200">
                      2. Supabase Publishable Key (<code className="text-emerald-300 font-mono">VITE_SUPABASE_PUBLISHABLE_KEY</code>)
                    </label>
                    <button
                      type="button"
                      onClick={() => setShowKey(!showKey)}
                      className="text-[11px] text-slate-400 hover:text-slate-200 flex items-center gap-1 cursor-pointer"
                    >
                      {showKey ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      {showKey ? 'Hide' : 'Show'}
                    </button>
                  </div>
                  <div className="relative">
                    <input
                      type={showKey ? 'text' : 'password'}
                      value={publishableKey}
                      onChange={(e) => setPublishableKey(e.target.value)}
                      placeholder="sb_publishable_... or pk_..."
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 font-mono"
                    />
                  </div>
                  <span className="text-[11px] text-slate-400 block mt-1">
                    Replaces legacy anon key. Safe for browser usage when RLS is configured.
                  </span>
                </div>

                {/* 3. Server Secret Key Note */}
                <div className="p-3 rounded-xl bg-indigo-950/20 border border-indigo-800/40 text-xs space-y-1">
                  <div className="flex items-center gap-1.5 font-semibold text-indigo-300">
                    <Lock className="w-3.5 h-3.5" />
                    <span>3. Backend Server Key (<code className="font-mono">SUPABASE_SECRET_KEY</code>)</span>
                  </div>
                  <p className="text-[11px] text-slate-300 leading-relaxed">
                    The new Supabase Secret Key replaces the legacy service role key. For security, <strong className="text-white">never paste this secret in the frontend</strong>. Set it securely in your deployment environment variables or <code className="font-mono text-indigo-200">.env</code> file.
                  </p>
                </div>
              </div>

              {/* Test Result Message */}
              {testResult && (
                <div
                  className={`p-3 rounded-xl flex items-start gap-2.5 text-xs ${
                    testResult.success
                      ? 'bg-emerald-950/40 border border-emerald-500/40 text-emerald-200'
                      : 'bg-rose-950/40 border border-rose-500/40 text-rose-200'
                  }`}
                >
                  {testResult.success ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                  )}
                  <span className="leading-relaxed">{testResult.message}</span>
                </div>
              )}
            </div>
          )}

          {activeSubTab === 'env' && (
            <div className="space-y-4">
              <div className="text-xs text-slate-300 leading-relaxed">
                Save these environment variables into your project's <code className="text-emerald-300 font-mono">.env</code> file or the AI Studio settings:
              </div>

              <div className="relative rounded-xl bg-slate-950 border border-slate-800 p-4 font-mono text-xs text-slate-200 overflow-x-auto">
                <pre className="whitespace-pre">{envSnippet}</pre>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(envSnippet);
                    setCopiedEnv(true);
                    setTimeout(() => setCopiedEnv(false), 2000);
                  }}
                  className="absolute top-3 right-3 flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-[11px] text-slate-300 transition-colors cursor-pointer"
                >
                  {copiedEnv ? (
                    <>
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy .env</span>
                    </>
                  )}
                </button>
              </div>

              <div className="p-3 rounded-xl bg-slate-800/60 border border-slate-700 text-xs text-slate-300 space-y-1.5">
                <div className="font-semibold text-white">How to get these keys in Supabase:</div>
                <ol className="list-decimal list-inside space-y-1 text-[11px] text-slate-400 pl-1">
                  <li>Log in to <strong className="text-slate-200">supabase.com</strong> and open your project.</li>
                  <li>Click <strong className="text-slate-200">Project Settings</strong> (gear icon) → <strong className="text-slate-200">API</strong>.</li>
                  <li>Copy <strong className="text-slate-200">Project URL</strong> into <code className="text-slate-300">VITE_SUPABASE_URL</code>.</li>
                  <li>Copy <strong className="text-slate-200">Publishable Key</strong> into <code className="text-slate-300">VITE_SUPABASE_PUBLISHABLE_KEY</code>.</li>
                  <li>Copy <strong className="text-slate-200">Secret Key</strong> into <code className="text-slate-300">SUPABASE_SECRET_KEY</code> (Server only).</li>
                </ol>
              </div>
            </div>
          )}

          {activeSubTab === 'rls' && (
            <div className="space-y-4">
              <div className="text-xs text-slate-300 leading-relaxed">
                DocForge requires Supabase <strong className="text-white">Row Level Security (RLS)</strong> so users only have access to their own data (profiles, projects, documents, scans, questions). Run this script in the <strong className="text-emerald-400">Supabase SQL Editor</strong>:
              </div>

              <div className="relative rounded-xl bg-slate-950 border border-slate-800 p-4 font-mono text-xs text-slate-200 overflow-x-auto max-h-64">
                <pre className="whitespace-pre">{sqlSnippet}</pre>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(sqlSnippet);
                    setCopiedSql(true);
                    setTimeout(() => setCopiedSql(false), 2000);
                  }}
                  className="absolute top-3 right-3 flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-[11px] text-slate-300 transition-colors cursor-pointer"
                >
                  {copiedSql ? (
                    <>
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy SQL</span>
                    </>
                  )}
                </button>
              </div>

              <div className="p-3 rounded-xl bg-slate-800/60 border border-slate-700 text-xs text-slate-300 space-y-1">
                <span className="font-semibold text-emerald-400 block">Database Entities Protected by RLS:</span>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 text-[11px] text-slate-400 pt-1">
                  <span>• profiles</span>
                  <span>• projects</span>
                  <span>• github_connections</span>
                  <span>• repository_scans</span>
                  <span>• detected_services</span>
                  <span>• project_questions</span>
                  <span>• documents</span>
                  <span>• document_versions</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-slate-800 bg-slate-900/90 gap-3">
          <div>
            {currentCreds.source === 'storage' && (
              <button
                type="button"
                onClick={handleReset}
                className="text-xs text-rose-400 hover:text-rose-300 underline cursor-pointer"
              >
                Clear Custom Keys
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleTestConnection}
              disabled={testing || !url || !publishableKey}
              className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-xs font-semibold text-slate-200 border border-slate-700 transition-all cursor-pointer flex items-center gap-1.5"
            >
              {testing ? (
                <RefreshCw className="w-3.5 h-3.5 animate-spin text-emerald-400" />
              ) : (
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              )}
              <span>{testing ? 'Testing...' : 'Test Connection'}</span>
            </button>

            <button
              type="button"
              onClick={handleSave}
              disabled={!url || !publishableKey}
              className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-xs font-semibold text-white transition-all shadow-md cursor-pointer"
            >
              Apply &amp; Connect
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
