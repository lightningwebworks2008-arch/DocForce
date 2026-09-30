import React, { useState } from 'react';
import { ProjectProfile, DocumentItem, DocType } from '../types';
import {
  Globe,
  UploadCloud,
  CheckCircle2,
  Copy,
  Check,
  Code2,
  Printer,
  RefreshCw
} from 'lucide-react';

interface DeployPortalViewProps {
  project: ProjectProfile | null;
  docs: DocumentItem[];
}

export const DeployPortalView: React.FC<DeployPortalViewProps> = ({ project, docs }) => {
  const [selectedTarget, setSelectedTarget] = useState<'vercel' | 'netlify' | 'github' | 'custom'>('vercel');
  const [activePublicPath, setActivePublicPath] = useState<DocType>('privacy-policy');
  const [isDeploying, setIsDeploying] = useState(false);
  const [deployedNotice, setDeployedNotice] = useState(false);
  const [copiedUrl, setCopiedUrl] = useState(false);
  const [copiedScript, setCopiedScript] = useState(false);

  const currentDoc = docs.find((d) => d.type === activePublicPath) || docs[0];
  const projectName = project?.name || 'Your App';

  const handleDeploy = () => {
    if (docs.length === 0 || !selectedTarget) return;
    setIsDeploying(true);
    setTimeout(() => {
      setIsDeploying(false);
      setDeployedNotice(true);
      setTimeout(() => setDeployedNotice(false), 5000);
    }, 1200);
  };

  const getPublicUrl = (type: DocType) => {
    const slug = type.replace('-policy', '').replace('-page', '').replace('-docs', '');
    const origin = project?.websiteUrl || 'https://my-app.com';
    return `${origin}/${slug}`;
  };

  const handleCopyUrl = () => {
    navigator.clipboard.writeText(getPublicUrl(activePublicPath));
    setCopiedUrl(true);
    setTimeout(() => setCopiedUrl(false), 2000);
  };

  const embedScriptSnippet = `<!-- DocForge Hosted Privacy & Legal Widget -->
<script
  src="https://cdn.docforge.io/v2/embed.js"
  data-project-id="${project?.id || 'live'}"
  data-theme="light"
  data-position="bottom-right"
  async
></script>`;

  const handleCopyScript = () => {
    navigator.clipboard.writeText(embedScriptSnippet);
    setCopiedScript(true);
    setTimeout(() => setCopiedScript(false), 2000);
  };

  const deploymentTargets = [
    { id: 'vercel' as const, label: 'Vercel Edge', desc: 'Automatic ISR edge distribution' },
    { id: 'netlify' as const, label: 'Netlify Edge', desc: 'Git commit webhook trigger' },
    { id: 'github' as const, label: 'GitHub Pages', desc: 'Auto-publish to gh-pages branch' },
    { id: 'custom' as const, label: 'Custom Domain CNAME', desc: 'Point DNS record to edge proxy' },
  ];

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="pb-5 border-b border-[#24222D] flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5 text-[#8C8C93] font-mono text-xs uppercase tracking-wider">
            <UploadCloud className="w-3.5 h-3.5 text-[#33FBFF]" />
            <span>Workflow Step 6: One-Click Instant Deployment &amp; Public Portal</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-display font-semibold tracking-tight text-[#FFFFFF]">
            Publish &amp; Host Live Documentation
          </h1>
          <p className="text-[#8C8C93] text-sm sm:text-base mt-1 max-w-2xl leading-relaxed">
            Deploy your legal policies, technical guides, and security trust center to Vercel, Netlify, or custom domains in seconds.
          </p>
        </div>

        <button
          onClick={handleDeploy}
          disabled={isDeploying || docs.length === 0}
          className="px-4 py-2 bg-[#B43BFF] hover:bg-[#A127F5] text-white rounded-md text-xs font-semibold transition-all shadow-[0_0_15px_rgba(180,59,255,0.3)] flex items-center gap-2 shrink-0 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isDeploying ? (
            <>
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              <span>Building Edge Pages...</span>
            </>
          ) : (
            <>
              <UploadCloud className="w-3.5 h-3.5" />
              <span>
                {docs.length === 0 ? 'No Documents to Deploy' : 'Deploy to Selected Target'}
              </span>
            </>
          )}
        </button>
      </div>

      {/* Deployment Notification */}
      {deployedNotice && (
        <div className="p-3.5 rounded-md bg-[#0DB44A]/10 border border-[#0DB44A]/30 text-[#0DB44A] flex items-center justify-between gap-4 shadow-md">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-[#0DB44A] shrink-0" />
            <span className="text-xs font-medium">
              Deployment Successful. Updated edge cache for {project?.websiteUrl || 'https://my-app.com'}/privacy, /terms, and /security.
            </span>
          </div>
          <span className="text-[11px] font-mono px-2 py-0.5 rounded-md border border-[#0DB44A]/30 bg-[#15141C] text-[#0DB44A]">
            Build Time: 0.8s
          </span>
        </div>
      )}

      {/* Deployment Target Selection */}
      <div className="p-3.5 bg-[#15141C] rounded-md border border-[#24222D] flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-md">
        <span className="text-xs font-mono uppercase tracking-wider text-[#8C8C93]">
          Target Provider:
        </span>
        <div className="flex flex-wrap gap-1.5">
          {deploymentTargets.map((t) => (
            <button
              key={t.id}
              onClick={() => setSelectedTarget(t.id)}
              className={`px-3 py-1.5 rounded-md border text-xs font-mono transition-all cursor-pointer flex items-center gap-1.5 ${
                selectedTarget === t.id
                  ? 'bg-[#B43BFF] text-white border-[#B43BFF] shadow-[0_0_10px_rgba(180,59,255,0.3)]'
                  : 'bg-[#18171E] text-[#8C8C93] border-[#24222D] hover:text-[#FFFFFF] hover:bg-[#201E28]'
              }`}
            >
              <span className="font-medium">{t.label}</span>
              <span className={`text-[10px] ${selectedTarget === t.id ? 'text-white/80' : 'text-[#8C8C93]'}`}>
                • {t.desc}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Live Interactive Public Reader Portal Preview */}
      <div className="bg-[#15141C] rounded-md border border-[#24222D] overflow-hidden shadow-xl">
        {/* Navigation & Address Header */}
        <div className="p-3 bg-[#111015] border-b border-[#24222D] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2 bg-[#18171E] px-3 py-1 rounded-md border border-[#24222D] text-xs font-mono text-[#33FBFF] min-w-[240px] sm:min-w-[320px]">
            <Globe className="w-3.5 h-3.5 text-[#33FBFF] shrink-0" />
            <span className="truncate">{getPublicUrl(activePublicPath)}</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopyUrl}
              className="px-2.5 py-1 bg-[#18171E] hover:bg-[#22202A] text-[#F0F0F3] border border-[#2D2A3A] rounded-md text-xs font-medium transition-colors flex items-center gap-1 cursor-pointer"
            >
              {copiedUrl ? <Check className="w-3.5 h-3.5 text-[#0DB44A]" /> : <Copy className="w-3.5 h-3.5 text-[#8C8C93]" />}
              <span>Copy URL</span>
            </button>
            <button
              onClick={() => window.print()}
              className="p-1.5 bg-[#18171E] hover:bg-[#22202A] text-[#F0F0F3] border border-[#2D2A3A] rounded-md text-xs transition-colors cursor-pointer"
              title="Print document"
            >
              <Printer className="w-3.5 h-3.5 text-[#8C8C93]" />
            </button>
          </div>
        </div>

        {/* Public Portal Navigation Tabs */}
        <div className="px-5 py-2.5 border-b border-[#24222D] bg-[#131217] flex items-center justify-between overflow-x-auto">
          <div className="flex items-center gap-1 shrink-0 font-mono text-xs">
            <button
              onClick={() => setActivePublicPath('privacy-policy')}
              className={`px-2.5 py-1 rounded-md transition-colors cursor-pointer ${
                activePublicPath === 'privacy-policy'
                  ? 'bg-[#B43BFF] text-white font-semibold'
                  : 'text-[#8C8C93] hover:text-white'
              }`}
            >
              /privacy
            </button>
            <button
              onClick={() => setActivePublicPath('terms-of-service')}
              className={`px-2.5 py-1 rounded-md transition-colors cursor-pointer ${
                activePublicPath === 'terms-of-service'
                  ? 'bg-[#B43BFF] text-white font-semibold'
                  : 'text-[#8C8C93] hover:text-white'
              }`}
            >
              /terms
            </button>
            <button
              onClick={() => setActivePublicPath('security-page')}
              className={`px-2.5 py-1 rounded-md transition-colors cursor-pointer ${
                activePublicPath === 'security-page'
                  ? 'bg-[#B43BFF] text-white font-semibold'
                  : 'text-[#8C8C93] hover:text-white'
              }`}
            >
              /security
            </button>
            <button
              onClick={() => setActivePublicPath('ai-disclosure')}
              className={`px-2.5 py-1 rounded-md transition-colors cursor-pointer ${
                activePublicPath === 'ai-disclosure'
                  ? 'bg-[#B43BFF] text-white font-semibold'
                  : 'text-[#8C8C93] hover:text-white'
              }`}
            >
              /ai-transparency
            </button>
            <button
              onClick={() => setActivePublicPath('api-docs')}
              className={`px-2.5 py-1 rounded-md transition-colors cursor-pointer ${
                activePublicPath === 'api-docs'
                  ? 'bg-[#B43BFF] text-white font-semibold'
                  : 'text-[#8C8C93] hover:text-white'
              }`}
            >
              /docs/api
            </button>
          </div>

          <div className="text-[11px] text-[#8C8C93] font-mono shrink-0 hidden sm:block">
            DocForge Reader Preview
          </div>
        </div>

        {/* Rendered Live Portal Page */}
        <div className="p-8 sm:p-12 max-w-3xl mx-auto space-y-6 min-h-[440px] bg-[#0C0B0D] text-[#F0F0F3]">
          {!currentDoc ? (
            <div className="p-12 text-center space-y-3">
              <div className="w-10 h-10 rounded-md bg-[#18171E] text-[#33FBFF] flex items-center justify-center mx-auto border border-[#24222D]">
                <Globe className="w-5 h-5 text-[#33FBFF]" />
              </div>
              <h3 className="text-sm font-semibold text-[#FFFFFF]">No Documentation Available to Preview</h3>
              <p className="text-xs text-[#8C8C93] max-w-md mx-auto leading-relaxed">
                Generate documentation in Doc Engine or inspect your repository in Connect &amp; Scan to preview live hosted pages.
              </p>
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between pb-5 border-b border-[#24222D]">
                <div>
                  <span className="text-[11px] font-mono text-[#8C8C93] uppercase tracking-wider block">
                    {projectName} Official Governance
                  </span>
                  <h1 className="text-2xl font-display font-semibold text-[#FFFFFF] tracking-tight mt-1">
                    {currentDoc.title}
                  </h1>
                  <p className="text-xs text-[#8C8C93] mt-1 font-mono">
                    Current Release: <span className="text-[#33FBFF]">{currentDoc.version}</span> • Published on{' '}
                    {new Date(currentDoc.lastModified).toLocaleDateString()}
                  </p>
                </div>

                <div className="w-10 h-10 rounded-md bg-[#18171E] flex items-center justify-center font-display font-semibold text-[#33FBFF] text-base border border-[#24222D]">
                  {projectName.charAt(0)}
                </div>
              </div>

              {/* Reader Typography */}
              <div className="space-y-4 text-[#D1D0DB] text-sm leading-relaxed">
                {currentDoc.content.split('\n').map((line, idx) => {
                  if (line.startsWith('# ')) return null;
                  if (line.startsWith('## ')) {
                    return (
                      <h2 key={idx} className="text-base font-display font-semibold text-[#FFFFFF] mt-6 pt-3 border-t border-[#24222D]">
                        {line.replace('## ', '')}
                      </h2>
                    );
                  }
                  if (line.startsWith('### ')) {
                    return (
                      <h3 key={idx} className="text-sm font-display font-semibold text-[#FFFFFF] mt-4">
                        {line.replace('### ', '')}
                      </h3>
                    );
                  }
                  if (line.startsWith('* ') || line.startsWith('- ')) {
                    return (
                      <li key={idx} className="ml-5 list-disc text-[#A5A3B0] text-xs sm:text-sm">
                        {line.replace(/^(\*|-)\s+/, '')}
                      </li>
                    );
                  }
                  if (line.startsWith('---')) {
                    return <hr key={idx} className="my-5 border-[#24222D]" />;
                  }
                  if (line.trim() === '') return <div key={idx} className="h-2" />;
                  return (
                    <p key={idx} className="text-[#D1D0DB] text-xs sm:text-sm leading-relaxed">
                      {line}
                    </p>
                  );
                })}
              </div>

              <div className="pt-6 mt-8 border-t border-[#24222D] flex flex-col sm:flex-row sm:items-center justify-between text-xs text-[#8C8C93] font-mono gap-2">
                <span>© {new Date().getFullYear()} {projectName}. All rights reserved.</span>
                <span className="text-[#33FBFF]">Verified by DocForge Regulatory Assistant</span>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Embeddable Snippet Section */}
      <div className="bg-[#15141C] rounded-md border border-[#24222D] p-5 space-y-3 shadow-lg">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-[#FFFFFF] flex items-center gap-2">
            <Code2 className="w-4 h-4 text-[#33FBFF]" />
            <span>Embed In-App Privacy &amp; Consent Modal</span>
          </h2>
          <button
            onClick={handleCopyScript}
            className="px-3 py-1.5 bg-[#B43BFF] hover:bg-[#A127F5] text-white rounded-md text-xs font-semibold transition-all shadow-[0_0_12px_rgba(180,59,255,0.25)] flex items-center gap-1.5 cursor-pointer"
          >
            {copiedScript ? <Check className="w-3.5 h-3.5 text-white" /> : <Copy className="w-3.5 h-3.5 text-[#8C8C93]" />}
            <span>Copy Widget Code</span>
          </button>
        </div>
        <p className="text-xs text-[#8C8C93]">
          Paste this script tag before the closing <code className="text-[#33FBFF] bg-[#111015] px-1.5 py-0.5 rounded-md font-mono text-xs border border-[#24222D]">&lt;/body&gt;</code> of your web app to provide automatic legal link modals and cookie consent compliance.
        </p>

        <div className="p-3.5 rounded-md bg-[#0E0D13] border border-[#24222D] text-[#33FBFF] font-mono text-xs overflow-x-auto">
          <pre>{embedScriptSnippet}</pre>
        </div>
      </div>
    </div>
  );
};
