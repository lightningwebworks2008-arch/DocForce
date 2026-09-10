import React, { useState } from 'react';
import { DocumentItem, DocCategory, DocType, ProjectProfile } from '../types';
import {
  FileText,
  Code,
  Shield,
  Briefcase,
  Copy,
  Download,
  Sparkles,
  Check,
  Eye,
  Edit3,
  Search,
  RefreshCw,
  ExternalLink,
  BookOpen,
  Terminal,
  Layers,
  History
} from 'lucide-react';

interface DocEngineViewProps {
  project: ProjectProfile;
  docs: DocumentItem[];
  activeDocId: string;
  onSelectDoc: (id: string) => void;
  onUpdateDocContent: (id: string, content: string) => void;
  onRegenerateDocWithAI: (docType: DocType) => Promise<void>;
  isGenerating: boolean;
  onNavigateToHumanReview: () => void;
  onNavigateToVersionControl: () => void;
}

export const DocEngineView: React.FC<DocEngineViewProps> = ({
  project,
  docs,
  activeDocId,
  onSelectDoc,
  onUpdateDocContent,
  onRegenerateDocWithAI,
  isGenerating,
  onNavigateToHumanReview,
  onNavigateToVersionControl,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<DocCategory | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isEditMode, setIsEditMode] = useState(false);
  const [copied, setCopied] = useState(false);

  const activeDoc = docs.find((d) => d.id === activeDocId) || docs[0];

  const filteredDocs = docs.filter((doc) => {
    const matchesCategory = selectedCategory === 'all' || doc.category === selectedCategory;
    const matchesSearch =
      doc.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.type.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const handleCopyMarkdown = () => {
    if (!activeDoc) return;
    navigator.clipboard.writeText(activeDoc.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadFile = () => {
    if (!activeDoc) return;
    const blob = new Blob([activeDoc.content], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${activeDoc.type}.md`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Simple clean markdown renderer without heavy external deps
  const renderMarkdownPreview = (text: string) => {
    const lines = text.split('\n');
    return (
      <div className="space-y-3 font-sans text-slate-800 leading-relaxed text-sm">
        {lines.map((line, idx) => {
          if (line.startsWith('# ')) {
            return (
              <h1 key={idx} className="text-2xl font-bold text-slate-900 border-b border-slate-200 pb-2 mt-4 mb-2">
                {line.replace('# ', '')}
              </h1>
            );
          }
          if (line.startsWith('## ')) {
            return (
              <h2 key={idx} className="text-xl font-bold text-slate-900 mt-6 mb-2">
                {line.replace('## ', '')}
              </h2>
            );
          }
          if (line.startsWith('### ')) {
            return (
              <h3 key={idx} className="text-base font-semibold text-slate-900 mt-4 mb-1">
                {line.replace('### ', '')}
              </h3>
            );
          }
          if (line.startsWith('#### ')) {
            return (
              <h4 key={idx} className="text-sm font-semibold text-slate-900 mt-3 mb-1">
                {line.replace('#### ', '')}
              </h4>
            );
          }
          if (line.startsWith('> ')) {
            return (
              <blockquote key={idx} className="border-l-4 border-indigo-500 pl-4 py-1 italic text-slate-600 bg-indigo-50/40 rounded-r">
                {line.replace('> ', '')}
              </blockquote>
            );
          }
          if (line.startsWith('```')) {
            return null; // Handle code blocks with simple wrapper or render nicely
          }
          if (line.startsWith('* ') || line.startsWith('- ')) {
            return (
              <li key={idx} className="ml-5 list-disc text-slate-700">
                {line.replace(/^(\*|-)\s+/, '')}
              </li>
            );
          }
          if (line.startsWith('---')) {
            return <hr key={idx} className="my-4 border-slate-200" />;
          }
          if (line.trim() === '') {
            return <div key={idx} className="h-1.5" />;
          }

          // Inline formatting like **bold** or `code`
          return (
            <p key={idx} className="text-slate-700">
              {line}
            </p>
          );
        })}
      </div>
    );
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Top Controls & Status Bar */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
            <BookOpen className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold text-slate-900">DocForge Document Engine</h1>
              <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 font-mono font-medium text-slate-600">
                {docs.length} Documents Active
              </span>
            </div>
            <p className="text-xs text-slate-500">
              Generated for <strong className="text-slate-700">{project.name}</strong> • Current Git Tag:{' '}
              <strong className="text-indigo-600">{project.activeVersion}</strong>
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={onNavigateToHumanReview}
            className="px-3 py-2 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 text-xs font-semibold rounded-lg transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <Shield className="w-3.5 h-3.5 text-amber-600" />
            <span>Human Review Layer</span>
          </button>

          <button
            onClick={onNavigateToVersionControl}
            className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <History className="w-3.5 h-3.5" />
            <span>Version History</span>
          </button>
        </div>
      </div>

      {/* Main Grid: Sidebar Navigator + Editor/Preview Pane */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Document Directory Column */}
        <div className="lg:col-span-4 space-y-4">
          <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
            {/* Search Input */}
            <div className="relative mb-3">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search documents..."
                className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
              />
            </div>

            {/* Category Filter Pills */}
            <div className="grid grid-cols-4 gap-1 p-1 bg-slate-100 rounded-lg mb-3">
              <button
                onClick={() => setSelectedCategory('all')}
                className={`py-1 text-center text-[11px] font-semibold rounded transition-all ${
                  selectedCategory === 'all' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                All ({docs.length})
              </button>
              <button
                onClick={() => setSelectedCategory('legal')}
                className={`py-1 text-center text-[11px] font-semibold rounded transition-all ${
                  selectedCategory === 'legal' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Legal (6)
              </button>
              <button
                onClick={() => setSelectedCategory('technical')}
                className={`py-1 text-center text-[11px] font-semibold rounded transition-all ${
                  selectedCategory === 'technical' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Tech (6)
              </button>
              <button
                onClick={() => setSelectedCategory('business')}
                className={`py-1 text-center text-[11px] font-semibold rounded transition-all ${
                  selectedCategory === 'business' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Biz (3)
              </button>
            </div>

            {/* Document List */}
            <div className="space-y-1 max-h-[520px] overflow-y-auto pr-1">
              {filteredDocs.map((doc) => {
                const isCurrent = doc.id === activeDoc?.id;
                return (
                  <button
                    key={doc.id}
                    onClick={() => onSelectDoc(doc.id)}
                    className={`w-full text-left p-2.5 rounded-lg text-xs transition-all flex items-center justify-between border cursor-pointer ${
                      isCurrent
                        ? 'bg-indigo-50/70 border-indigo-200 text-indigo-950 font-semibold shadow-2xs'
                        : 'bg-white border-transparent text-slate-700 hover:bg-slate-50 hover:border-slate-200'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      {doc.category === 'legal' && <Shield className="w-3.5 h-3.5 text-indigo-600 shrink-0" />}
                      {doc.category === 'technical' && <Terminal className="w-3.5 h-3.5 text-emerald-600 shrink-0" />}
                      {doc.category === 'business' && <Briefcase className="w-3.5 h-3.5 text-amber-600 shrink-0" />}
                      <span className="truncate">{doc.title}</span>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0 ml-2">
                      <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-100 text-slate-600">
                        {doc.version}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Editor / Reader Pane Column */}
        <div className="lg:col-span-8 space-y-4">
          {activeDoc ? (
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
              {/* Header Bar */}
              <div className="p-4 border-b border-slate-200 bg-slate-50/60 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono px-2 py-0.5 rounded bg-indigo-100 text-indigo-800 font-semibold uppercase">
                      {activeDoc.category}
                    </span>
                    <h2 className="text-base font-bold text-slate-900">{activeDoc.title}</h2>
                    <span className="text-xs text-slate-400 font-mono">({activeDoc.type}.md)</span>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-slate-500 mt-1">
                    <span>Version: {activeDoc.version}</span>
                    <span>•</span>
                    <span>Approx. {activeDoc.wordCount} words</span>
                    <span>•</span>
                    <span className="text-emerald-700 font-medium">Status: {activeDoc.status.toUpperCase()}</span>
                  </div>
                </div>

                {/* Right Controls */}
                <div className="flex items-center gap-2 flex-wrap">
                  {/* View/Edit Toggle */}
                  <div className="flex bg-slate-200 p-0.5 rounded-lg">
                    <button
                      onClick={() => setIsEditMode(false)}
                      className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-all flex items-center gap-1 ${
                        !isEditMode ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Preview</span>
                    </button>
                    <button
                      onClick={() => setIsEditMode(true)}
                      className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-all flex items-center gap-1 ${
                        isEditMode ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      <span>Markdown Edit</span>
                    </button>
                  </div>

                  {/* Regenerate With AI */}
                  <button
                    onClick={() => onRegenerateDocWithAI(activeDoc.type)}
                    disabled={isGenerating}
                    className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                  >
                    {isGenerating ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        <span>Synthesizing...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>AI Re-Synthesize</span>
                      </>
                    )}
                  </button>

                  {/* Copy */}
                  <button
                    onClick={handleCopyMarkdown}
                    className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs transition-all cursor-pointer"
                    title="Copy raw markdown"
                  >
                    {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                  </button>

                  {/* Download */}
                  <button
                    onClick={handleDownloadFile}
                    className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs transition-all cursor-pointer"
                    title="Download as .md file"
                  >
                    <Download className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Content Body */}
              <div className="p-6 min-h-[500px] max-h-[640px] overflow-y-auto">
                {isEditMode ? (
                  <textarea
                    rows={24}
                    value={activeDoc.content}
                    onChange={(e) => onUpdateDocContent(activeDoc.id, e.target.value)}
                    className="w-full h-full font-mono text-xs leading-relaxed p-4 rounded-lg border border-slate-300 bg-slate-50 text-slate-800 focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none resize-none"
                  />
                ) : (
                  renderMarkdownPreview(activeDoc.content)
                )}
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-slate-200 p-12 text-center text-slate-500">
              Select a document from the left directory to preview.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
