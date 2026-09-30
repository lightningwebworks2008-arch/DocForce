import React, { useState } from 'react';
import { DocumentItem, DocCategory, DocType, ProjectProfile } from '../types';
import {
  FileText,
  Code,
  Shield,
  Briefcase,
  Copy,
  Download,
  Check,
  Eye,
  Edit3,
  Search,
  RefreshCw,
  BookOpen,
  History
} from 'lucide-react';

interface DocEngineViewProps {
  project: ProjectProfile | null;
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

  // Clean, technical markdown preview matching xpander.ai dark palette
  const renderMarkdownPreview = (text: string) => {
    const lines = text.split('\n');
    return (
      <div className="space-y-3 font-sans text-[#E4E2ED] leading-relaxed text-sm">
        {lines.map((line, idx) => {
          if (line.startsWith('# ')) {
            return (
              <h1 key={idx} className="font-display text-2xl font-semibold text-[#FFFFFF] border-b border-[#24222D] pb-2 mt-5 mb-3 tracking-tight">
                {line.replace('# ', '')}
              </h1>
            );
          }
          if (line.startsWith('## ')) {
            return (
              <h2 key={idx} className="font-display text-xl font-semibold text-[#FFFFFF] mt-6 mb-2 tracking-tight">
                {line.replace('## ', '')}
              </h2>
            );
          }
          if (line.startsWith('### ')) {
            return (
              <h3 key={idx} className="font-display text-base font-semibold text-[#FFFFFF] mt-4 mb-1">
                {line.replace('### ', '')}
              </h3>
            );
          }
          if (line.startsWith('#### ')) {
            return (
              <h4 key={idx} className="text-xs uppercase font-mono tracking-wider text-[#33FBFF] mt-3 mb-1">
                {line.replace('#### ', '')}
              </h4>
            );
          }
          if (line.startsWith('> ')) {
            return (
              <blockquote key={idx} className="pl-4 py-1.5 italic text-[#9A98A4] border-l-2 border-[#753CFF] bg-[#18171E]">
                {line.replace('> ', '')}
              </blockquote>
            );
          }
          if (line.startsWith('```')) {
            return null;
          }
          if (line.startsWith('* ') || line.startsWith('- ')) {
            return (
              <li key={idx} className="ml-5 list-disc text-[#F0F0F3]">
                {line.replace(/^(\*|-)\s+/, '')}
              </li>
            );
          }
          if (line.startsWith('---')) {
            return <hr key={idx} className="my-4 border-[#24222D]" />;
          }
          if (line.trim() === '') {
            return <div key={idx} className="h-1.5" />;
          }

          return (
            <p key={idx} className="text-[#E4E2ED]">
              {line}
            </p>
          );
        })}
      </div>
    );
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Technical Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-4 pb-4 border-b border-[#24222D]">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-display text-2xl sm:text-3xl font-semibold text-[#FFFFFF] tracking-tight">
              Documentation Engine
            </h1>
            <span className="text-[11px] font-mono px-2 py-0.5 rounded-xs bg-[#1F1D28] border border-[#2D2A3A] text-[#33FBFF]">
              {docs.length} Documents Active
            </span>
          </div>
          <p className="text-xs text-[#8C8C93] mt-1">
            {project ? (
              <>
                Active policy baseline for <strong className="text-[#FFFFFF] font-medium">{project.name}</strong> • Release <strong className="font-mono text-[#33FBFF]">{project.activeVersion}</strong>
              </>
            ) : (
              'Connect a repository or select a project to manage legal and technical documentation'
            )}
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={onNavigateToHumanReview}
            className="px-3 py-1.5 bg-[#18171E] hover:bg-[#201E28] text-[#F0F0F3] border border-[#2D2A3A] text-xs font-medium rounded-md transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <Shield className="w-3.5 h-3.5 text-[#B43BFF]" />
            <span>Human Review Layer</span>
          </button>

          <button
            onClick={onNavigateToVersionControl}
            className="px-3 py-1.5 bg-[#18171E] hover:bg-[#201E28] text-[#F0F0F3] border border-[#2D2A3A] text-xs font-medium rounded-md transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <History className="w-3.5 h-3.5 text-[#33FBFF]" />
            <span>Version History</span>
          </button>
        </div>
      </div>

      {/* Main Grid: Directory Column + Editor/Preview Pane */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Document Directory Column */}
        <div className="lg:col-span-4 space-y-3">
          {/* Search Input */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[#8C8C93]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search policies..."
              className="w-full pl-8 pr-3 py-1.5 text-xs rounded-md border border-[#2A2735] bg-[#111015] text-[#F0F0F3] placeholder-[#5E5C68] focus:border-[#B43BFF] focus:bg-[#15141C] outline-none transition-colors"
            />
          </div>

          {/* Category Filter Pills */}
          <div className="flex gap-1 p-0.5 bg-[#131217] rounded-md border border-[#24222D]">
            <button
              onClick={() => setSelectedCategory('all')}
              className={`flex-1 py-1 text-center text-[11px] font-medium rounded-md transition-colors cursor-pointer ${
                selectedCategory === 'all' ? 'bg-[#B43BFF] text-white font-semibold' : 'text-[#8C8C93] hover:text-[#FFFFFF]'
              }`}
            >
              All ({docs.length})
            </button>
            <button
              onClick={() => setSelectedCategory('legal')}
              className={`flex-1 py-1 text-center text-[11px] font-medium rounded-md transition-colors cursor-pointer ${
                selectedCategory === 'legal' ? 'bg-[#B43BFF] text-white font-semibold' : 'text-[#8C8C93] hover:text-[#FFFFFF]'
              }`}
            >
              Legal ({docs.filter((d) => d.category === 'legal').length})
            </button>
            <button
              onClick={() => setSelectedCategory('technical')}
              className={`flex-1 py-1 text-center text-[11px] font-medium rounded-md transition-colors cursor-pointer ${
                selectedCategory === 'technical' ? 'bg-[#B43BFF] text-white font-semibold' : 'text-[#8C8C93] hover:text-[#FFFFFF]'
              }`}
            >
              Tech ({docs.filter((d) => d.category === 'technical').length})
            </button>
            <button
              onClick={() => setSelectedCategory('business')}
              className={`flex-1 py-1 text-center text-[11px] font-medium rounded-md transition-colors cursor-pointer ${
                selectedCategory === 'business' ? 'bg-[#B43BFF] text-white font-semibold' : 'text-[#8C8C93] hover:text-[#FFFFFF]'
              }`}
            >
              Biz ({docs.filter((d) => d.category === 'business').length})
            </button>
          </div>

          {/* Document List */}
          <div className="border border-[#24222D] bg-[#15141C] divide-y divide-[#24222D] max-h-[560px] overflow-y-auto rounded-md">
            {filteredDocs.length === 0 ? (
              <div className="p-4 text-center text-xs text-[#8C8C93] italic">
                No documents found matching filter.
              </div>
            ) : (
              filteredDocs.map((doc) => {
                const isCurrent = doc.id === activeDoc?.id;
                return (
                  <button
                    key={doc.id}
                    onClick={() => onSelectDoc(doc.id)}
                    className={`w-full text-left p-3 text-xs transition-colors flex items-center justify-between gap-2 cursor-pointer ${
                      isCurrent
                        ? 'bg-[#1F1D2B] text-[#FFFFFF] font-semibold border-l-2 border-[#B43BFF]'
                        : 'hover:bg-[#1A1822] text-[#9A98A4]'
                    }`}
                  >
                    <div className="truncate">
                      <div className="truncate font-medium">{doc.title}</div>
                      <div className="text-[10px] text-[#8C8C93] font-mono mt-0.5">{doc.type}.md</div>
                    </div>
                    <span className="text-[10px] font-mono text-[#8C8C93] shrink-0">{doc.version}</span>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Editor / Reader Pane Column */}
        <div className="lg:col-span-8">
          {activeDoc ? (
            <div className="border border-[#24222D] bg-[#15141C] rounded-md flex flex-col shadow-xl">
              {/* Header Bar */}
              <div className="p-4 border-b border-[#24222D] bg-[#131217] flex flex-wrap items-center justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono uppercase tracking-wider px-1.5 py-0.5 rounded-md bg-[#B43BFF]/15 text-[#B43BFF] border border-[#B43BFF]/30">
                      {activeDoc.category}
                    </span>
                    <h2 className="font-display text-lg font-semibold text-[#FFFFFF]">{activeDoc.title}</h2>
                    <span className="text-xs text-[#8C8C93] font-mono">({activeDoc.type}.md)</span>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-[#8C8C93] mt-1 font-mono">
                    <span>Version: {activeDoc.version}</span>
                    <span>•</span>
                    <span>{activeDoc.wordCount} words</span>
                    <span>•</span>
                    <span className="text-[#0DB44A] font-medium">Status: {activeDoc.status.toUpperCase()}</span>
                  </div>
                </div>

                {/* Right Controls */}
                <div className="flex items-center gap-2 flex-wrap">
                  {/* View/Edit Toggle */}
                  <div className="flex bg-[#131217] p-0.5 rounded-md border border-[#24222D]">
                    <button
                      onClick={() => setIsEditMode(false)}
                      className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors flex items-center gap-1 cursor-pointer ${
                        !isEditMode ? 'bg-[#B43BFF] text-white font-semibold' : 'text-[#8C8C93] hover:text-[#FFFFFF]'
                      }`}
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Preview</span>
                    </button>
                    <button
                      onClick={() => setIsEditMode(true)}
                      className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors flex items-center gap-1 cursor-pointer ${
                        isEditMode ? 'bg-[#B43BFF] text-white font-semibold' : 'text-[#8C8C93] hover:text-[#FFFFFF]'
                      }`}
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      <span>Edit Source</span>
                    </button>
                  </div>

                  {/* Regenerate */}
                  <button
                    onClick={() => onRegenerateDocWithAI(activeDoc.type)}
                    disabled={isGenerating}
                    className="px-3 py-1 bg-[#B43BFF] hover:bg-[#A127F5] text-white rounded-md text-xs font-semibold transition-all shadow-[0_0_12px_rgba(180,59,255,0.25)] flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                  >
                    <RefreshCw className={`w-3 h-3 ${isGenerating ? 'animate-spin' : ''}`} />
                    <span>{isGenerating ? 'Updating...' : 'Regenerate'}</span>
                  </button>

                  {/* Copy */}
                  <button
                    onClick={handleCopyMarkdown}
                    className="p-1.5 bg-[#18171E] hover:bg-[#201E28] text-[#F0F0F3] border border-[#2D2A3A] rounded-md text-xs transition-colors cursor-pointer"
                    title="Copy raw markdown"
                  >
                    {copied ? <Check className="w-3.5 h-3.5 text-[#0DB44A]" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>

                  {/* Download */}
                  <button
                    onClick={handleDownloadFile}
                    className="p-1.5 bg-[#18171E] hover:bg-[#201E28] text-[#F0F0F3] border border-[#2D2A3A] rounded-md text-xs transition-colors cursor-pointer"
                    title="Download as .md file"
                  >
                    <Download className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Content Body */}
              <div className="p-8 min-h-[500px] max-h-[640px] overflow-y-auto">
                {isEditMode ? (
                  <textarea
                    rows={24}
                    value={activeDoc.content}
                    onChange={(e) => onUpdateDocContent(activeDoc.id, e.target.value)}
                    className="w-full h-full font-mono text-xs leading-relaxed p-4 border border-[#24222D] bg-[#0E0D13] text-[#F0F0F3] focus:border-[#B43BFF] outline-none resize-none rounded-md"
                  />
                ) : (
                  renderMarkdownPreview(activeDoc.content)
                )}
              </div>
            </div>
          ) : (
            <div className="border border-[#24222D] bg-[#15141C] p-12 text-center text-[#8C8C93] rounded-xs">
              Select a document from the left directory to preview.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
