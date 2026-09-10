import React, { useState } from 'react';
import { ChangeEventAlert, ProjectProfile, DocType } from '../types';
import {
  GitPullRequest,
  AlertCircle,
  CheckCircle2,
  Sparkles,
  RefreshCw,
  Plus,
  Terminal,
  ArrowRight,
  ShieldAlert,
  GitCommit,
  Radio
} from 'lucide-react';

interface ChangeMonitorViewProps {
  project: ProjectProfile;
  alerts: ChangeEventAlert[];
  onSimulateCommit: (commitMessage: string, addedDeps: string[]) => Promise<void>;
  onApplyAlertDiff: (alertId: string) => Promise<void>;
  isProcessing: boolean;
}

export const ChangeMonitorView: React.FC<ChangeMonitorViewProps> = ({
  project,
  alerts,
  onSimulateCommit,
  onApplyAlertDiff,
  isProcessing,
}) => {
  const [selectedPreset, setSelectedPreset] = useState<'posthog' | 'stripe' | 'gemini' | 'custom'>('posthog');
  const [customCommit, setCustomCommit] = useState('');
  const [customDeps, setCustomDeps] = useState('');

  const handleSimulate = async () => {
    if (selectedPreset === 'posthog') {
      await onSimulateCommit('feat(analytics): install PostHog SDK for session recording', ['posthog-js']);
    } else if (selectedPreset === 'stripe') {
      await onSimulateCommit('feat(billing): integrate Stripe recurring subscriptions', ['@stripe/stripe-js', 'stripe']);
    } else if (selectedPreset === 'gemini') {
      await onSimulateCommit('feat(ai): integrate Google Gemini 3.8-Flash generative model', ['@google/genai']);
    } else {
      await onSimulateCommit(customCommit || 'chore: update system dependencies', customDeps.split(',').map((d) => d.trim()));
    }
  };

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      {/* Header Banner */}
      <div className="bg-slate-900 text-slate-100 rounded-2xl p-6 sm:p-8 border border-slate-800 shadow-xl relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 mb-2 text-indigo-400 font-semibold text-sm">
            <Radio className="w-4 h-4 animate-pulse text-indigo-400" />
            <span>Workflow Step 7: Continuous Documentation & CI/CD Watcher</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
            Change Monitor & Git Webhook
          </h1>
          <p className="text-slate-300 text-sm sm:text-base mt-1 max-w-2xl">
            DocForge monitors code changes in real-time. When a developer installs a tracking SDK, payment provider, or AI model, DocForge detects legal impact and prepares auto-updating diffs.
          </p>
        </div>

        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-xs font-mono text-emerald-400 shrink-0">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
          <span>Webhook Active (saasify/core-platform)</span>
        </div>
      </div>

      {/* Simulator Card */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-4">
        <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
          <Terminal className="w-5 h-5 text-indigo-600" />
          <span>Simulate CI/CD Commit or Dependency Update</span>
        </h2>
        <p className="text-xs text-slate-500">
          Test how DocForge identifies compliance changes when a developer pushes a new commit to the repository.
        </p>

        {/* Presets */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 pt-1">
          <button
            onClick={() => setSelectedPreset('posthog')}
            className={`p-3 rounded-lg border text-left transition-all cursor-pointer ${
              selectedPreset === 'posthog'
                ? 'border-indigo-600 bg-indigo-50/60 ring-1 ring-indigo-600'
                : 'border-slate-200 bg-slate-50 hover:bg-slate-100'
            }`}
          >
            <span className="text-xs font-bold text-slate-900 block">PostHog Analytics</span>
            <span className="text-[11px] text-slate-500 block mt-0.5">npm i posthog-js</span>
          </button>

          <button
            onClick={() => setSelectedPreset('stripe')}
            className={`p-3 rounded-lg border text-left transition-all cursor-pointer ${
              selectedPreset === 'stripe'
                ? 'border-indigo-600 bg-indigo-50/60 ring-1 ring-indigo-600'
                : 'border-slate-200 bg-slate-50 hover:bg-slate-100'
            }`}
          >
            <span className="text-xs font-bold text-slate-900 block">Stripe Subscriptions</span>
            <span className="text-[11px] text-slate-500 block mt-0.5">npm i stripe</span>
          </button>

          <button
            onClick={() => setSelectedPreset('gemini')}
            className={`p-3 rounded-lg border text-left transition-all cursor-pointer ${
              selectedPreset === 'gemini'
                ? 'border-indigo-600 bg-indigo-50/60 ring-1 ring-indigo-600'
                : 'border-slate-200 bg-slate-50 hover:bg-slate-100'
            }`}
          >
            <span className="text-xs font-bold text-slate-900 block">Google Gemini AI</span>
            <span className="text-[11px] text-slate-500 block mt-0.5">npm i @google/genai</span>
          </button>

          <button
            onClick={() => setSelectedPreset('custom')}
            className={`p-3 rounded-lg border text-left transition-all cursor-pointer ${
              selectedPreset === 'custom'
                ? 'border-indigo-600 bg-indigo-50/60 ring-1 ring-indigo-600'
                : 'border-slate-200 bg-slate-50 hover:bg-slate-100'
            }`}
          >
            <span className="text-xs font-bold text-slate-900 block">Custom Commit</span>
            <span className="text-[11px] text-slate-500 block mt-0.5">Specify commit text</span>
          </button>
        </div>

        {selectedPreset === 'custom' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Commit Message</label>
              <input
                type="text"
                value={customCommit}
                onChange={(e) => setCustomCommit(e.target.value)}
                placeholder="e.g. feat: integrate Sentry error tracking"
                className="w-full p-2 rounded-lg border border-slate-300 text-xs focus:ring-2 focus:ring-indigo-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Added Dependencies</label>
              <input
                type="text"
                value={customDeps}
                onChange={(e) => setCustomDeps(e.target.value)}
                placeholder="e.g. @sentry/react, sentry"
                className="w-full p-2 rounded-lg border border-slate-300 text-xs focus:ring-2 focus:ring-indigo-500 outline-none"
              />
            </div>
          </div>
        )}

        <div className="pt-2 flex justify-end">
          <button
            onClick={handleSimulate}
            disabled={isProcessing}
            className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold transition-all shadow-sm flex items-center gap-2 cursor-pointer disabled:opacity-50"
          >
            {isProcessing ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Evaluating Impact on Legal Policies...</span>
              </>
            ) : (
              <>
                <GitCommit className="w-4 h-4 text-indigo-400" />
                <span>Trigger Simulated Git Push</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Monitored Alerts Stream */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-4">
        <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
          <AlertCircle className="w-5 h-5 text-indigo-600" />
          <span>Change Notifications & Regulatory Alerts</span>
        </h2>

        <div className="space-y-4">
          {alerts.map((alert) => {
            const isPending = alert.status === 'pending';
            return (
              <div
                key={alert.id}
                className={`p-5 rounded-xl border transition-all space-y-3 ${
                  isPending
                    ? 'border-amber-300 bg-amber-50/40 shadow-xs ring-1 ring-amber-300'
                    : 'border-slate-200 bg-slate-50/60'
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${
                        isPending ? 'bg-amber-100 text-amber-800 border border-amber-200' : 'bg-slate-200 text-slate-700'
                      }`}
                    >
                      {alert.status.toUpperCase()}
                    </span>
                    <h3 className="text-sm font-bold text-slate-900">{alert.title}</h3>
                  </div>

                  <span className="text-[11px] text-slate-400 font-mono">
                    {new Date(alert.timestamp).toLocaleTimeString()}
                  </span>
                </div>

                <p className="text-xs text-slate-600 leading-relaxed">{alert.message}</p>

                {/* Affected Docs */}
                <div className="flex items-center gap-2 flex-wrap text-xs">
                  <span className="text-slate-500 font-medium">Impacted Documents:</span>
                  {alert.affectedDocs.map((doc) => (
                    <span key={doc} className="px-2 py-0.5 rounded bg-indigo-100 text-indigo-800 font-mono text-[11px] font-semibold">
                      {doc}.md
                    </span>
                  ))}
                </div>

                {/* Diff Preview */}
                <div className="p-3 rounded-lg bg-slate-900 text-slate-200 font-mono text-[11px] overflow-x-auto">
                  <span className="text-slate-400 block mb-1">// Proposed Legal Clause Addition:</span>
                  <p className="text-emerald-400 whitespace-pre-wrap">{alert.suggestedClause}</p>
                </div>

                {isPending && (
                  <div className="pt-2 flex justify-end gap-3">
                    <button
                      onClick={() => onApplyAlertDiff(alert.id)}
                      disabled={isProcessing}
                      className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold transition-all shadow-sm flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Apply Clause & Bump Version to {alert.suggestedVersion}</span>
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
