import React, { useState } from 'react';
import { VersionRecord, DocumentItem, DocType } from '../types';
import {
  GitCommit,
  GitBranch,
  GitMerge,
  History,
  Tag,
  Check,
  Plus,
  Minus,
  RotateCcw,
  Sparkles,
  ArrowRight,
  Clock,
  ShieldCheck,
  FileText
} from 'lucide-react';

interface VersionControlViewProps {
  versions: VersionRecord[];
  activeVersion: string;
  docs: DocumentItem[];
  onCreateNewVersion: (versionTag: string, commitMsg: string) => void;
  onRollbackVersion: (version: VersionRecord) => void;
}

export const VersionControlView: React.FC<VersionControlViewProps> = ({
  versions,
  activeVersion,
  docs,
  onCreateNewVersion,
  onRollbackVersion,
}) => {
  const [selectedDocType, setSelectedDocType] = useState<DocType>('privacy-policy');
  const [compareBaseVersion, setCompareBaseVersion] = useState<string>(versions[1]?.version || versions[0]?.version);
  const [compareTargetVersion, setCompareTargetVersion] = useState<string>(versions[0]?.version);

  // New version release state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newVersionTag, setNewVersionTag] = useState('v1.3');
  const [commitMessage, setCommitMessage] = useState('feat: update privacy policy with PostHog analytics & refund window');

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
    onCreateNewVersion(newVersionTag, commitMessage);
    setIsModalOpen(false);
  };

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      {/* Header Banner */}
      <div className="bg-slate-900 text-slate-100 rounded-2xl p-6 sm:p-8 border border-slate-800 shadow-xl relative overflow-hidden flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 mb-2 text-indigo-400 font-semibold text-sm">
            <History className="w-4 h-4" />
            <span>Workflow Step 5: Git for Legal & Technical Documentation</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
            Version Control & Audit Trail
          </h1>
          <p className="text-slate-300 text-sm sm:text-base mt-1 max-w-2xl">
            Every legal or technical adjustment generates an immutable version tag. Inspect semantic diffs, maintain audit compliance trails, or rollback with a single click.
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-semibold transition-all shadow-sm flex items-center gap-2 shrink-0 cursor-pointer"
        >
          <Tag className="w-4 h-4" />
          <span>Tag New Release</span>
        </button>
      </div>

      {/* Release Commit Timeline */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
        <h2 className="text-base font-bold text-slate-900 mb-4 flex items-center gap-2">
          <GitCommit className="w-5 h-5 text-indigo-600" />
          <span>Release History & Commit Tree</span>
        </h2>

        <div className="space-y-4">
          {versions.map((ver, idx) => {
            const isLatest = ver.version === activeVersion;
            return (
              <div
                key={ver.id}
                className={`p-4 rounded-xl border transition-all flex flex-col md:flex-row md:items-center justify-between gap-4 ${
                  isLatest
                    ? 'border-indigo-300 bg-indigo-50/40 shadow-xs'
                    : 'border-slate-200 bg-slate-50/50'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div
                    className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 font-mono text-xs font-bold ${
                      isLatest ? 'bg-indigo-600 text-white' : 'bg-slate-200 text-slate-700'
                    }`}
                  >
                    {ver.version}
                  </div>

                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono text-xs font-bold text-slate-900">
                        {ver.commitSha}
                      </span>
                      <span className="text-xs font-medium text-slate-700">•</span>
                      <span className="text-xs text-slate-600 font-medium">{ver.commitMessage}</span>
                      {isLatest && (
                        <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                          Active Release
                        </span>
                      )}
                    </div>

                    <p className="text-xs text-slate-500 mt-1">{ver.changesSummary}</p>

                    <div className="flex items-center gap-3 text-[11px] text-slate-400 mt-2 font-mono">
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
                      className="px-3 py-1.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer"
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
                    className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold transition-all cursor-pointer"
                  >
                    Compare Diff
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Visual Diff Viewer */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
          <div>
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <GitMerge className="w-5 h-5 text-indigo-600" />
              <span>Visual Diff Engine</span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Comparing changes between releases. Lines highlighted in green represent additions; lines in red represent deletions.
            </p>
          </div>

          {/* Selectors */}
          <div className="flex items-center gap-2 flex-wrap">
            {/* Document Selector */}
            <select
              value={selectedDocType}
              onChange={(e) => setSelectedDocType(e.target.value as DocType)}
              className="text-xs font-medium px-3 py-2 rounded-lg border border-slate-300 bg-slate-50 text-slate-800 focus:ring-2 focus:ring-indigo-500 outline-none"
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
              className="text-xs font-medium px-3 py-2 rounded-lg border border-slate-300 bg-slate-50 text-slate-800 focus:ring-2 focus:ring-indigo-500 outline-none font-mono"
            >
              {versions.map((v) => (
                <option key={v.id} value={v.version}>
                  Base: {v.version}
                </option>
              ))}
            </select>

            <ArrowRight className="w-4 h-4 text-slate-400" />

            {/* Target Version */}
            <select
              value={compareTargetVersion}
              onChange={(e) => setCompareTargetVersion(e.target.value)}
              className="text-xs font-medium px-3 py-2 rounded-lg border border-slate-300 bg-slate-50 text-slate-800 focus:ring-2 focus:ring-indigo-500 outline-none font-mono"
            >
              {versions.map((v) => (
                <option key={v.id} value={v.version}>
                  Target: {v.version}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Diff Content Box */}
        <div className="rounded-lg border border-slate-200 bg-slate-950 text-slate-100 font-mono text-xs overflow-x-auto max-h-[500px]">
          <div className="p-3 border-b border-slate-800 bg-slate-900 text-slate-400 text-[11px] flex justify-between">
            <span>--- a/{selectedDocType}.md ({compareBaseVersion})</span>
            <span>+++ b/{selectedDocType}.md ({compareTargetVersion})</span>
          </div>

          <div className="divide-y divide-slate-900/60 p-2">
            {diffLines.slice(0, 80).map((line, idx) => {
              if (line.type === 'added') {
                return (
                  <div key={idx} className="bg-emerald-950/60 text-emerald-300 px-3 py-1 flex items-start gap-2">
                    <span className="text-emerald-500 select-none font-bold">+</span>
                    <span>{line.text}</span>
                  </div>
                );
              }
              if (line.type === 'removed') {
                return (
                  <div key={idx} className="bg-rose-950/60 text-rose-300 px-3 py-1 flex items-start gap-2">
                    <span className="text-rose-500 select-none font-bold">-</span>
                    <span>{line.text}</span>
                  </div>
                );
              }
              return (
                <div key={idx} className="text-slate-400 px-3 py-0.5 flex items-start gap-2 hover:bg-slate-900/50">
                  <span className="text-slate-600 select-none font-normal"> </span>
                  <span>{line.text}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Modal: Tag New Release */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl border border-slate-200 shadow-2xl max-w-md w-full p-6 space-y-4">
            <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <Tag className="w-5 h-5 text-indigo-600" />
              <span>Tag New Documentation Release</span>
            </h3>
            <p className="text-xs text-slate-500">
              Creates an immutable checkpoint snapshot of all 15 active documents and stamps a semantic version.
            </p>

            <form onSubmit={handleCreateRelease} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
                  Semantic Version Tag
                </label>
                <input
                  type="text"
                  required
                  value={newVersionTag}
                  onChange={(e) => setNewVersionTag(e.target.value)}
                  placeholder="e.g. v1.3"
                  className="w-full p-2.5 rounded-lg border border-slate-300 text-sm font-mono focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
                  Commit Message / Release Summary
                </label>
                <textarea
                  rows={3}
                  required
                  value={commitMessage}
                  onChange={(e) => setCommitMessage(e.target.value)}
                  placeholder="Describe legal or architectural modifications..."
                  className="w-full p-2.5 rounded-lg border border-slate-300 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-lg border border-slate-300 text-xs font-semibold text-slate-700 hover:bg-slate-100 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-sm cursor-pointer"
                >
                  Confirm & Tag Release
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
