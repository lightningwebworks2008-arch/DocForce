import React, { useState } from 'react';
import { VersionRecord, DocumentItem, DocType, ProjectProfile } from '../types';
import {
  GitCommit,
  GitMerge,
  History,
  Tag,
  RotateCcw,
  ArrowRight
} from 'lucide-react';

interface VersionControlViewProps {
  project?: ProjectProfile | null;
  versions: VersionRecord[];
  activeVersion: string;
  docs: DocumentItem[];
  onCreateRelease?: (versionTag: string, commitMsg: string) => void;
  onCreateNewVersion?: (versionTag: string, commitMsg: string) => void;
  onRollbackVersion: (version: VersionRecord) => void;
}

export const VersionControlView: React.FC<VersionControlViewProps> = ({
  versions,
  activeVersion,
  docs,
  onCreateRelease,
  onCreateNewVersion,
  onRollbackVersion,
}) => {
  const [selectedDocType, setSelectedDocType] = useState<DocType>('privacy-policy');
  const [compareBaseVersion, setCompareBaseVersion] = useState<string>(versions[1]?.version || versions[0]?.version || 'v1.0');
  const [compareTargetVersion, setCompareTargetVersion] = useState<string>(versions[0]?.version || 'v1.0');

  // New version release state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newVersionTag, setNewVersionTag] = useState(versions.length > 0 ? `v1.${versions.length}` : 'v1.0');
  const [commitMessage, setCommitMessage] = useState('Updated legal policies snapshot');

  const baseVer = versions.find((v) => v.version === compareBaseVersion) || versions[1] || versions[0];
  const targetVer = versions.find((v) => v.version === compareTargetVersion) || versions[0];

  const baseContent = baseVer?.docsSnapshot?.[selectedDocType] || '/* Document baseline content */';
  const targetContent =
    targetVer?.docsSnapshot?.[selectedDocType] ||
    docs.find((d) => d.type === selectedDocType)?.content ||
    '/* Target content */';

  // Compute realistic visual line diff
  const computeDiffLines = (oldText: string, newText: string) => {
    const oldLines = oldText.split('\n');
    const newLines = newText.split('\n');

    const result: Array<{ type: 'same' | 'added' | 'removed'; text: string }> = [];

    let i = 0;
    let j = 0;

    while (i < oldLines.length || j < newLines.length) {
      if (i < oldLines.length && j < newLines.length) {
        if (oldLines[i] === newLines[j]) {
          result.push({ type: 'same', text: oldLines[i] });
          i++;
          j++;
        } else {
          // Highlight modification
          result.push({ type: 'removed', text: oldLines[i] });
          result.push({ type: 'added', text: newLines[j] });
          i++;
          j++;
        }
      } else if (i < oldLines.length) {
        result.push({ type: 'removed', text: oldLines[i] });
        i++;
      } else if (j < newLines.length) {
        result.push({ type: 'added', text: newLines[j] });
        j++;
      }
    }

    return result;
  };

  const diffLines = computeDiffLines(baseContent, targetContent);

  const handleCreateRelease = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newVersionTag.trim()) return;
    if (onCreateRelease) {
      onCreateRelease(newVersionTag, commitMessage);
    } else if (onCreateNewVersion) {
      onCreateNewVersion(newVersionTag, commitMessage);
    }
    setIsModalOpen(false);
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="pb-5 border-b border-[#24222D] flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5 text-[#8C8C93] font-mono text-xs uppercase tracking-wider">
            <History className="w-3.5 h-3.5 text-[#33FBFF]" />
            <span>Workflow Step 5: Version History &amp; Audit Trail</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-display font-semibold tracking-tight text-[#FFFFFF]">
            Version Control &amp; Audit Trail
          </h1>
          <p className="text-[#8C8C93] text-sm sm:text-base mt-1 max-w-2xl leading-relaxed">
            Every legal or technical adjustment generates an immutable version tag. Inspect semantic diffs, maintain audit compliance trails, or rollback with a single click.
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="px-4 py-2 bg-[#B43BFF] hover:bg-[#A127F5] text-white rounded-md text-xs font-semibold transition-all shadow-[0_0_15px_rgba(180,59,255,0.3)] flex items-center gap-2 shrink-0 cursor-pointer"
        >
          <Tag className="w-3.5 h-3.5" />
          <span>Tag New Release</span>
        </button>
      </div>

      {/* Release Commit Timeline */}
      <div className="bg-[#15141C] rounded-md border border-[#24222D] p-5 shadow-lg">
        <h2 className="text-sm font-semibold text-[#FFFFFF] mb-4 flex items-center gap-2">
          <GitCommit className="w-4 h-4 text-[#33FBFF]" />
          <span>Release History &amp; Commit Tree</span>
        </h2>

        <div className="space-y-3">
          {versions.length === 0 ? (
            <div className="p-8 text-center bg-[#111015] rounded-md border border-[#24222D] text-[#8C8C93] text-xs">
              No version tags published yet. Click &quot;Tag New Release&quot; to snapshot your legal and technical documents.
            </div>
          ) : (
            versions.map((ver) => {
              const isLatest = ver.version === activeVersion;
              return (
                <div
                  key={ver.id}
                  className={`p-3.5 rounded-md border transition-colors flex flex-col md:flex-row md:items-center justify-between gap-4 ${
                    isLatest
                      ? 'border-[#B43BFF] bg-[#1F1D2B] shadow-[0_0_12px_rgba(180,59,255,0.12)]'
                      : 'border-[#24222D] bg-[#18171E]'
                  }`}
                >
                <div className="flex items-start gap-3">
                  <div
                    className={`w-8 h-8 rounded-md flex items-center justify-center shrink-0 font-mono text-xs font-medium border ${
                      isLatest
                        ? 'bg-[#B43BFF] text-white border-[#B43BFF]'
                        : 'bg-[#24222D] text-[#F0F0F3] border-[#2E2C39]'
                    }`}
                  >
                    {ver.version}
                  </div>

                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono text-xs font-medium text-[#33FBFF]">
                        {ver.commitSha}
                      </span>
                      <span className="text-xs text-[#8C8C93]">•</span>
                      <span className="text-xs text-[#FFFFFF] font-medium">{ver.commitMessage}</span>
                      {isLatest && (
                        <span className="text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded-md bg-[#753CFF]/15 text-[#B43BFF] border border-[#753CFF]/30">
                          Active Release
                        </span>
                      )}
                    </div>

                    <p className="text-xs text-[#8C8C93] mt-1">{ver.changesSummary}</p>

                    <div className="flex items-center gap-3 text-[11px] text-[#8C8C93] mt-1.5 font-mono">
                      <span>{ver.author}</span>
                      <span>•</span>
                      <span>{new Date(ver.timestamp).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0 self-end md:self-auto">
                  {!isLatest && (
                    <button
                      onClick={() => onRollbackVersion(ver)}
                      className="px-2.5 py-1.5 bg-[#18171E] hover:bg-[#22202A] text-[#F0F0F3] border border-[#2D2A3A] rounded-md text-xs font-medium transition-colors flex items-center gap-1.5 cursor-pointer"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>Rollback to {ver.version}</span>
                    </button>
                  )}
                  <button
                    onClick={() => {
                      setCompareBaseVersion(ver.version);
                      setCompareTargetVersion(activeVersion);
                    }}
                    className="px-2.5 py-1.5 bg-[#B43BFF] hover:bg-[#A127F5] text-white rounded-md text-xs font-medium transition-colors cursor-pointer"
                  >
                    Compare Diff
                  </button>
                </div>
              </div>
            );
          })
        )}
        </div>
      </div>

      {/* Visual Diff Viewer */}
      <div className="bg-[#15141C] rounded-md border border-[#24222D] p-5 space-y-4 shadow-lg">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#24222D] pb-4">
          <div>
            <h2 className="text-sm font-semibold text-[#FFFFFF] flex items-center gap-2">
              <GitMerge className="w-4 h-4 text-[#33FBFF]" />
              <span>Visual Diff Engine</span>
            </h2>
            <p className="text-xs text-[#8C8C93] mt-0.5">
              Comparing changes between releases. Lines with green markings represent additions; lines in red represent deletions.
            </p>
          </div>

          {/* Selectors */}
          <div className="flex items-center gap-2 flex-wrap">
            {/* Document Selector */}
            <select
              value={selectedDocType}
              onChange={(e) => setSelectedDocType(e.target.value as DocType)}
              className="text-xs font-mono px-2.5 py-1.5 rounded-md border border-[#24222D] bg-[#111015] text-[#F0F0F3] focus:outline-none focus:border-[#B43BFF]"
            >
              <option value="privacy-policy">Privacy Policy</option>
              <option value="terms-of-service">Terms of Service</option>
              <option value="cookie-policy">Cookie Policy</option>
              <option value="ai-disclosure">AI Disclosure</option>
              <option value="readme">README.md</option>
              <option value="api-docs">API Documentation</option>
            </select>

            {/* Base Version */}
            <select
              value={compareBaseVersion}
              onChange={(e) => setCompareBaseVersion(e.target.value)}
              className="text-xs font-mono px-2.5 py-1.5 rounded-md border border-[#24222D] bg-[#111015] text-[#F0F0F3] focus:outline-none focus:border-[#B43BFF]"
            >
              {versions.length > 0 ? (
                versions.map((v) => (
                  <option key={v.id} value={v.version}>
                    Base: {v.version}
                  </option>
                ))
              ) : (
                <option value="v1.0">Base: v1.0</option>
              )}
            </select>

            <ArrowRight className="w-3.5 h-3.5 text-[#8C8C93]" />

            {/* Target Version */}
            <select
              value={compareTargetVersion}
              onChange={(e) => setCompareTargetVersion(e.target.value)}
              className="text-xs font-mono px-2.5 py-1.5 rounded-md border border-[#24222D] bg-[#111015] text-[#F0F0F3] focus:outline-none focus:border-[#B43BFF]"
            >
              {versions.length > 0 ? (
                versions.map((v) => (
                  <option key={v.id} value={v.version}>
                    Target: {v.version}
                  </option>
                ))
              ) : (
                <option value="v1.0">Target: v1.0</option>
              )}
            </select>
          </div>
        </div>

        {/* Diff Content Box */}
        <div className="rounded-md border border-[#24222D] bg-[#0E0D13] font-mono text-xs overflow-x-auto max-h-[500px]">
          <div className="p-2.5 border-b border-[#24222D] bg-[#131217] text-[#8C8C93] text-[11px] flex justify-between">
            <span>--- a/{selectedDocType}.md ({compareBaseVersion})</span>
            <span>+++ b/{selectedDocType}.md ({compareTargetVersion})</span>
          </div>

          <div className="divide-y divide-[#24222D]/60 p-1">
            {diffLines.slice(0, 80).map((line, idx) => {
              if (line.type === 'added') {
                return (
                  <div key={idx} className="bg-[#0DB44A]/10 text-[#0DB44A] px-3 py-1 flex items-start gap-2 border-l-2 border-[#0DB44A]">
                    <span className="text-[#0DB44A] select-none font-bold">+</span>
                    <span>{line.text}</span>
                  </div>
                );
              }
              if (line.type === 'removed') {
                return (
                  <div key={idx} className="bg-[#FF5A5A]/10 text-[#FF5A5A] px-3 py-1 flex items-start gap-2 border-l-2 border-[#FF5A5A]">
                    <span className="text-[#FF5A5A] select-none font-bold">-</span>
                    <span>{line.text}</span>
                  </div>
                );
              }
              return (
                <div key={idx} className="text-[#A5A3B0] px-3 py-0.5 flex items-start gap-2 hover:bg-[#18171E]">
                  <span className="text-[#5E5C68] select-none font-normal"> </span>
                  <span>{line.text}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Modal: Tag New Release */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-[#15141C] rounded-md border border-[#2D2A3A] max-w-md w-full p-6 space-y-4 shadow-2xl">
            <h3 className="text-base font-display font-semibold text-[#FFFFFF] flex items-center gap-2">
              <Tag className="w-4 h-4 text-[#33FBFF]" />
              <span>Tag New Documentation Release</span>
            </h3>
            <p className="text-xs text-[#8C8C93]">
              Creates an immutable checkpoint snapshot of all active documents and stamps a semantic version.
            </p>

            <form onSubmit={handleCreateRelease} className="space-y-4">
              <div>
                <label className="block text-xs font-mono uppercase tracking-wider text-[#8C8C93] mb-1">
                  Semantic Version Tag
                </label>
                <input
                  type="text"
                  required
                  value={newVersionTag}
                  onChange={(e) => setNewVersionTag(e.target.value)}
                  placeholder="e.g. v1.3"
                  className="w-full p-2.5 rounded-md border border-[#24222D] bg-[#111015] text-xs font-mono text-[#F0F0F3] focus:outline-none focus:border-[#B43BFF]"
                />
              </div>

              <div>
                <label className="block text-xs font-mono uppercase tracking-wider text-[#8C8C93] mb-1">
                  Commit Message / Release Summary
                </label>
                <textarea
                  rows={3}
                  required
                  value={commitMessage}
                  onChange={(e) => setCommitMessage(e.target.value)}
                  placeholder="Describe legal or architectural modifications..."
                  className="w-full p-2.5 rounded-md border border-[#24222D] bg-[#111015] text-xs text-[#F0F0F3] focus:outline-none focus:border-[#B43BFF]"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-3 py-1.5 rounded-md border border-[#2D2A3A] text-xs font-medium text-[#8C8C93] hover:text-white hover:bg-[#1E1C28] cursor-pointer transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-3 py-1.5 rounded-md bg-[#B43BFF] hover:bg-[#A127F5] text-white text-xs font-semibold cursor-pointer shadow-[0_0_12px_rgba(180,59,255,0.25)] transition-all"
                >
                  Confirm &amp; Tag Release
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
