import React, { useState } from 'react';
import { ProjectProfile, DocumentItem, DocType } from '../types';
import {
  Globe,
  UploadCloud,
  CheckCircle2,
  ExternalLink,
  Copy,
  Check,
  Code2,
  Download,
  Printer,
  Shield,
  Search,
  Share2,
  RefreshCw,
  Terminal
} from 'lucide-react';

interface DeployPortalViewProps {
  project: ProjectProfile;
  docs: DocumentItem[];
}

export const DeployPortalView: React.FC<DeployPortalViewProps> = ({ project, docs }) => {
  const [selectedTarget, setSelectedTarget] = useState<'vercel' | 'netlify' | 'github' | 'custom'>('vercel');
  const [activePublicPath, setActivePublicPath] = useState<DocType>('privacy-policy');
  const [isDeploying, setIsDeploying] = useState(false);
  const [deployedNotice, setDeployedNotice] = useState(false);
  const [copiedUrl, setCopiedUrl] = useState(false);
  const [copiedScript, setCopiedScript] = useState(false);
  const [portalSearch, setPortalSearch] = useState('');

  const currentDoc = docs.find((d) => d.type === activePublicPath) || docs[0];

  const handleDeploy = () => {
    setIsDeploying(true);
    setTimeout(() => {
      setIsDeploying(false);
      setDeployedNotice(true);
      setTimeout(() => setDeployedNotice(false), 5000);
    }, 1200);
  };

  const getPublicUrl = (type: DocType) => {
    const slug = type.replace('-policy', '').replace('-page', '').replace('-docs', '');
    return `${project.websiteUrl}/${slug}`;
  };

  const handleCopyUrl = () => {
    navigator.clipboard.writeText(getPublicUrl(activePublicPath));
    setCopiedUrl(true);
    setTimeout(() => setCopiedUrl(false), 2000);
  };

  const embedScriptSnippet = `<!-- DocForge Hosted Privacy & Legal Widget -->
<script
  src="https://cdn.docforge.io/v2/embed.js"
  data-project-id="${project.id}"
  data-theme="light"
  data-position="bottom-right"
  async
></script>`;

  const handleCopyScript = () => {
    navigator.clipboard.writeText(embedScriptSnippet);
    setCopiedScript(true);
    setTimeout(() => setCopiedScript(false), 2000);
  };

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      {/* Header Banner */}
      <div className="bg-slate-900 text-slate-100 rounded-2xl p-6 sm:p-8 border border-slate-800 shadow-xl relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 mb-2 text-indigo-400 font-semibold text-sm">
            <UploadCloud className="w-4 h-4" />
            <span>Workflow Step 6: One-Click Instant Deployment & Public Portal</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
            Publish & Host Live Documentation
          </h1>
          <p className="text-slate-300 text-sm sm:text-base mt-1 max-w-2xl">
            Deploy your legal policies, technical guides, and security trust center to Vercel, Netlify, or custom domains in seconds.
          </p>
        </div>

        <button
          onClick={handleDeploy}
          disabled={isDeploying}
          className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-semibold transition-all shadow-md flex items-center gap-2 shrink-0 cursor-pointer disabled:opacity-50"
        >
          {isDeploying ? (
            <>
              <RefreshCw className="w-4 h-4 animate-spin" />
              <span>Building Static Edge Pages...</span>
            </>
          ) : (
            <>
              <UploadCloud className="w-4 h-4" />
              <span>One-Click Deploy Now</span>
            </>
          )}
        </button>
      </div>

      {/* Deployment Notification */}
      {deployedNotice && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <span className="text-sm font-semibold">
              Deployment Successful! Updated edge cache for {project.websiteUrl}/privacy, /terms, and /security.
            </span>
          </div>
          <span className="text-xs font-mono bg-white px-2.5 py-1 rounded border border-emerald-300 text-emerald-800">
            Build Time: 0.8s
          </span>
        </div>
      )}

      {/* Deployment Providers & Endpoints */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <button
          onClick={() => setSelectedTarget('vercel')}
          className={`p-4 rounded-xl border text-left transition-all cursor-pointer ${
            selectedTarget === 'vercel'
              ? 'border-indigo-600 bg-white ring-2 ring-indigo-600 shadow-xs'
              : 'border-slate-200 bg-white hover:border-slate-300'
          }`}
        >
          <span className="text-xs font-bold text-slate-900 block">Vercel Edge Network</span>
          <span className="text-[11px] text-slate-500 block mt-1">Automatic ISR, zero-config</span>
          <span className="text-[10px] font-mono font-medium text-emerald-600 mt-2 block">Status: Connected</span>
        </button>

        <button
          onClick={() => setSelectedTarget('netlify')}
          className={`p-4 rounded-xl border text-left transition-all cursor-pointer ${
            selectedTarget === 'netlify'
              ? 'border-indigo-600 bg-white ring-2 ring-indigo-600 shadow-xs'
              : 'border-slate-200 bg-white hover:border-slate-300'
          }`}
        >
          <span className="text-xs font-bold text-slate-900 block">Netlify Edge</span>
          <span className="text-[11px] text-slate-500 block mt-1">Direct git push deploy</span>
          <span className="text-[10px] font-mono font-medium text-slate-500 mt-2 block">Status: Available</span>
        </button>

        <button
          onClick={() => setSelectedTarget('github')}
          className={`p-4 rounded-xl border text-left transition-all cursor-pointer ${
            selectedTarget === 'github'
              ? 'border-indigo-600 bg-white ring-2 ring-indigo-600 shadow-xs'
              : 'border-slate-200 bg-white hover:border-slate-300'
          }`}
        >
          <span className="text-xs font-bold text-slate-900 block">GitHub Pages</span>
          <span className="text-[11px] text-slate-500 block mt-1">Auto-commits to gh-pages branch</span>
          <span className="text-[10px] font-mono font-medium text-slate-500 mt-2 block">Status: Available</span>
        </button>

        <button
          onClick={() => setSelectedTarget('custom')}
          className={`p-4 rounded-xl border text-left transition-all cursor-pointer ${
            selectedTarget === 'custom'
              ? 'border-indigo-600 bg-white ring-2 ring-indigo-600 shadow-xs'
              : 'border-slate-200 bg-white hover:border-slate-300'
          }`}
        >
          <span className="text-xs font-bold text-slate-900 block">Custom Domain CNAME</span>
          <span className="text-[11px] text-slate-500 block mt-1">docs.yourapp.com</span>
          <span className="text-[10px] font-mono font-medium text-emerald-600 mt-2 block">Status: Active SSL</span>
        </button>
      </div>

      {/* Live Interactive Public Reader Portal Preview */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-lg overflow-hidden">
        {/* Browser Frame Header */}
        <div className="p-3 bg-slate-100 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 mr-2">
              <div className="w-3 h-3 rounded-full bg-rose-400" />
              <div className="w-3 h-3 rounded-full bg-amber-400" />
              <div className="w-3 h-3 rounded-full bg-emerald-400" />
            </div>

            <div className="flex items-center gap-2 bg-white px-3 py-1 rounded-md border border-slate-200 text-xs font-mono text-slate-700 min-w-[240px] sm:min-w-[320px]">
              <Globe className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <span className="truncate">{getPublicUrl(activePublicPath)}</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopyUrl}
              className="px-2.5 py-1 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded text-xs font-medium transition-all flex items-center gap-1 cursor-pointer"
            >
              {copiedUrl ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              <span>Copy Live URL</span>
            </button>
            <button
              onClick={() => window.print()}
              className="p-1.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded text-xs transition-all cursor-pointer"
              title="Print document"
            >
              <Printer className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Public Portal Navigation Tabs */}
        <div className="px-6 py-3 border-b border-slate-100 bg-slate-50/70 flex items-center justify-between overflow-x-auto">
          <div className="flex items-center gap-1 shrink-0">
            <button
              onClick={() => setActivePublicPath('privacy-policy')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all cursor-pointer ${
                activePublicPath === 'privacy-policy'
                  ? 'bg-indigo-600 text-white'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              /privacy
            </button>
            <button
              onClick={() => setActivePublicPath('terms-of-service')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all cursor-pointer ${
                activePublicPath === 'terms-of-service'
                  ? 'bg-indigo-600 text-white'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              /terms
            </button>
            <button
              onClick={() => setActivePublicPath('security-page')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all cursor-pointer ${
                activePublicPath === 'security-page'
                  ? 'bg-indigo-600 text-white'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              /security
            </button>
            <button
              onClick={() => setActivePublicPath('ai-disclosure')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all cursor-pointer ${
                activePublicPath === 'ai-disclosure'
                  ? 'bg-indigo-600 text-white'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              /ai-transparency
            </button>
            <button
              onClick={() => setActivePublicPath('api-docs')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all cursor-pointer ${
                activePublicPath === 'api-docs'
                  ? 'bg-indigo-600 text-white'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              /docs/api
            </button>
          </div>

          <div className="text-[11px] text-slate-400 font-mono shrink-0 hidden sm:block">
            DocForge Hosted Public Reader
          </div>
        </div>

        {/* Rendered Live Portal Page */}
        <div className="p-8 sm:p-12 max-w-4xl mx-auto space-y-6 min-h-[460px]">
          <div className="flex items-center justify-between pb-6 border-b border-slate-200">
            <div>
              <span className="text-xs font-mono font-semibold text-indigo-600 uppercase tracking-wider">
                {project.name} Official Governance
              </span>
              <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight mt-1">
                {currentDoc.title}
              </h1>
              <p className="text-xs text-slate-500 mt-1 font-mono">
                Current Release: {currentDoc.version} • Published on{' '}
                {new Date(currentDoc.lastModified).toLocaleDateString()}
              </p>
            </div>

            <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center font-bold text-slate-700 text-lg border border-slate-200">
              {project.name.charAt(0)}
            </div>
          </div>

          {/* Simple readable reader view */}
          <div className="space-y-4 text-slate-800 text-sm leading-relaxed font-sans">
            {currentDoc.content.split('\n').map((line, idx) => {
              if (line.startsWith('# ')) return null; // already rendered as title
              if (line.startsWith('## ')) {
                return (
                  <h2 key={idx} className="text-lg font-bold text-slate-900 mt-6 pt-2 border-t border-slate-100">
                    {line.replace('## ', '')}
                  </h2>
                );
              }
              if (line.startsWith('### ')) {
                return (
                  <h3 key={idx} className="text-base font-semibold text-slate-900 mt-4">
                    {line.replace('### ', '')}
                  </h3>
                );
              }
              if (line.startsWith('* ') || line.startsWith('- ')) {
                return (
                  <li key={idx} className="ml-5 list-disc text-slate-700 text-xs sm:text-sm">
                    {line.replace(/^(\*|-)\s+/, '')}
                  </li>
                );
              }
              if (line.startsWith('---')) {
                return <hr key={idx} className="my-6 border-slate-200" />;
              }
              if (line.trim() === '') return <div key={idx} className="h-2" />;
              return (
                <p key={idx} className="text-slate-700 text-xs sm:text-sm">
                  {line}
                </p>
              );
            })}
          </div>

          <div className="pt-8 mt-8 border-t border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between text-xs text-slate-500 gap-2">
            <span>© {new Date().getFullYear()} {project.name}. All rights reserved.</span>
            <span>Verified by DocForge Regulatory Assistant</span>
          </div>
        </div>
      </div>

      {/* Embeddable Snippet Section */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Code2 className="w-5 h-5 text-indigo-600" />
            <span>Embed In-App Privacy & Consent Modal</span>
          </h2>
          <button
            onClick={handleCopyScript}
            className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer"
          >
            {copiedScript ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span>Copy Widget Code</span>
          </button>
        </div>
        <p className="text-xs text-slate-500">
          Paste this script tag before the closing <code className="text-indigo-600 font-mono text-xs">&lt;/body&gt;</code> of your web app to provide automatic legal link modals and cookie consent compliance.
        </p>

        <div className="p-4 rounded-lg bg-slate-950 text-indigo-300 font-mono text-xs overflow-x-auto">
          <pre>{embedScriptSnippet}</pre>
        </div>
      </div>
    </div>
  );
};
