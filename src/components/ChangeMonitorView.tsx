import React, { useState } from 'react';
import { ChangeEventAlert, ProjectProfile } from '../types';
import {
  AlertCircle,
  RefreshCw,
  GitCommit,
  Radio,
  CheckCircle2
} from 'lucide-react';

interface ChangeMonitorViewProps {
  project: ProjectProfile | null;
  alerts: ChangeEventAlert[];
  onSimulateCommit: (commitMessage: string, addedDeps: string[]) => Promise<void>;
  onApplyAlertDiff?: (alertId: string) => Promise<void>;
  onApplyDiff?: (alertId: string) => Promise<void>;
  isProcessing: boolean;
}

export const ChangeMonitorView: React.FC<ChangeMonitorViewProps> = ({
  project,
  alerts,
  onSimulateCommit,
  onApplyAlertDiff,
  onApplyDiff,
  isProcessing,
}) => {
  const handleApply = onApplyAlertDiff || onApplyDiff;
  const [selectedPreset, setSelectedPreset] = useState<'posthog' | 'stripe' | 'gemini' | 'custom'>('posthog');
  const [customCommit, setCustomCommit] = useState('');
  const [customDeps, setCustomDeps] = useState('');

  const handleSimulate = async () => {
    if (!selectedPreset) return;
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

  const presets = [
    { id: 'posthog' as const, label: 'PostHog Analytics', cmd: 'posthog-js' },
    { id: 'stripe' as const, label: 'Stripe Subscriptions', cmd: 'stripe' },
    { id: 'gemini' as const, label: 'Google Gemini AI', cmd: '@google/genai' },
    { id: 'custom' as const, label: 'Custom Commit', cmd: 'custom payload' },
  ];

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="pb-5 border-b border-[#24222D] flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5 text-[#8C8C93] font-mono text-xs uppercase tracking-wider">
            <Radio className="w-3.5 h-3.5 text-[#33FBFF]" />
            <span>Workflow Step 7: Continuous Documentation &amp; CI/CD Watcher</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-display font-semibold tracking-tight text-[#FFFFFF]">
            Change Monitor &amp; Git Webhook
          </h1>
          <p className="text-[#8C8C93] text-sm sm:text-base mt-1 max-w-2xl leading-relaxed">
            DocForge monitors code changes in real-time. When a developer installs a tracking SDK, payment provider, or AI model, DocForge detects legal impact and prepares auto-updating diffs.
          </p>
        </div>

        {project?.repoName ? (
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-[#18171E] border border-[#24222D] text-xs font-mono text-[#33FBFF] shrink-0 shadow-xs">
            <span className="w-2 h-2 rounded-full bg-[#0DB44A] animate-pulse" />
            <span>Webhook Active ({project.repoOwner ? `${project.repoOwner}/${project.repoName}` : project.repoName})</span>
          </div>
        ) : (
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-[#18171E] border border-[#24222D] text-xs font-mono text-[#8C8C93] shrink-0 shadow-xs">
            <span className="w-2 h-2 rounded-full bg-[#8C8C93]" />
            <span>Webhook Ready (Connect Repo to Activate)</span>
          </div>
        )}
      </div>

      {/* Simulator Card */}
      <div className="bg-[#15141C] rounded-md border border-[#24222D] p-5 space-y-4 shadow-lg">
        <div>
          <h2 className="text-sm font-semibold text-[#FFFFFF] flex items-center gap-2">
            <GitCommit className="w-4 h-4 text-[#33FBFF]" />
            <span>Simulate CI/CD Commit or Dependency Update</span>
          </h2>
          <p className="text-xs text-[#8C8C93] mt-0.5">
            Test how DocForge identifies compliance changes when a developer pushes a new commit to the repository.
          </p>
        </div>

        {/* Presets */}
        <div className="p-3 bg-[#111015] rounded-md border border-[#24222D] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <span className="text-xs font-mono uppercase tracking-wider text-[#8C8C93]">
            Commit Scenario:
          </span>
          <div className="flex flex-wrap gap-1.5">
            {presets.map((p) => (
              <button
                key={p.id}
                onClick={() => setSelectedPreset(p.id)}
                className={`px-3 py-1.5 rounded-md border text-xs font-mono transition-all cursor-pointer flex items-center gap-1.5 ${
                  selectedPreset === p.id
                    ? 'bg-[#B43BFF] text-white border-[#B43BFF] shadow-[0_0_10px_rgba(180,59,255,0.3)]'
                    : 'bg-[#18171E] text-[#8C8C93] border-[#24222D] hover:text-[#FFFFFF] hover:bg-[#201E28]'
                }`}
              >
                <span className="font-medium">{p.label}</span>
                <span className={`text-[10px] ${selectedPreset === p.id ? 'text-white/80' : 'text-[#8C8C93]'}`}>
                  ({p.cmd})
                </span>
              </button>
            ))}
          </div>
        </div>

        {selectedPreset === 'custom' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            <div>
              <label className="block text-xs font-mono uppercase tracking-wider text-[#8C8C93] mb-1">Commit Message</label>
              <input
                type="text"
                value={customCommit}
                onChange={(e) => setCustomCommit(e.target.value)}
                placeholder="e.g. feat: integrate Sentry error tracking"
                className="w-full p-2 rounded-md border border-[#24222D] bg-[#111015] text-xs text-[#F0F0F3] focus:outline-none focus:border-[#B43BFF]"
              />
            </div>
            <div>
              <label className="block text-xs font-mono uppercase tracking-wider text-[#8C8C93] mb-1">Added Dependencies</label>
              <input
                type="text"
                value={customDeps}
                onChange={(e) => setCustomDeps(e.target.value)}
                placeholder="e.g. @sentry/react, sentry"
                className="w-full p-2 rounded-md border border-[#24222D] bg-[#111015] text-xs font-mono text-[#F0F0F3] focus:outline-none focus:border-[#B43BFF]"
              />
            </div>
          </div>
        )}

        <div className="pt-1 flex justify-end">
          <button
            onClick={handleSimulate}
            disabled={isProcessing || !selectedPreset}
            className="px-4 py-2 bg-[#B43BFF] hover:bg-[#A127F5] text-white rounded-md text-xs font-semibold transition-all shadow-[0_0_15px_rgba(180,59,255,0.3)] flex items-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isProcessing ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                <span>Evaluating Impact on Legal Policies...</span>
              </>
            ) : (
              <>
                <GitCommit className="w-3.5 h-3.5" />
                <span>Trigger Simulated Git Push</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Monitored Alerts Stream */}
      <div className="bg-[#15141C] rounded-md border border-[#24222D] p-5 space-y-4 shadow-lg">
        <h2 className="text-sm font-semibold text-[#FFFFFF] flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-[#33FBFF]" />
          <span>Change Notifications &amp; Regulatory Alerts</span>
        </h2>

        {alerts.length === 0 ? (
          <div className="p-8 rounded-md border border-[#24222D] bg-[#111015] text-center space-y-2">
            <div className="w-9 h-9 rounded-md bg-[#18171E] text-[#33FBFF] flex items-center justify-center mx-auto mb-2 border border-[#24222D]">
              <Radio className="w-4 h-4 text-[#33FBFF]" />
            </div>
            <h4 className="text-sm font-semibold text-[#FFFFFF]">No CI/CD Regulatory Alerts Detected</h4>
            <p className="text-xs text-[#8C8C93] max-w-md mx-auto leading-relaxed">
              DocForge continuously monitors your repository branches and pull requests. When a commit introduces new payment providers, telemetry SDKs, or AI models, automated compliance diffs and version bump proposals will appear here.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {alerts.map((alert) => {
              const isPending = alert.status === 'pending';
              return (
                <div
                  key={alert.id}
                  className={`p-4 rounded-md border transition-colors space-y-3 ${
                    isPending
                      ? 'border-[#B43BFF] bg-[#1C1A27] shadow-[0_0_12px_rgba(180,59,255,0.12)]'
                      : 'border-[#24222D] bg-[#18171E]'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span
                        className={`text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded-md border ${
                          isPending ? 'bg-[#FFB800]/15 text-[#FFB800] border-[#FFB800]/30' : 'bg-[#0DB44A]/15 text-[#0DB44A] border-[#0DB44A]/30'
                        }`}
                      >
                        {alert.status.toUpperCase()}
                      </span>
                      <h3 className="text-xs font-semibold text-[#FFFFFF]">{alert.title}</h3>
                    </div>

                    <span className="text-[11px] text-[#8C8C93] font-mono">
                      {new Date(alert.timestamp).toLocaleTimeString()}
                    </span>
                  </div>

                  <p className="text-xs text-[#8C8C93] leading-relaxed">{alert.message}</p>

                  {/* Affected Docs */}
                  <div className="flex items-center gap-2 flex-wrap text-xs">
                    <span className="text-[#8C8C93] text-xs font-mono">Impacted Documents:</span>
                    {alert.affectedDocs.map((doc) => (
                      <span key={doc} className="px-2 py-0.5 rounded-md bg-[#111015] text-[#33FBFF] font-mono text-[11px] border border-[#24222D]">
                        {doc}.md
                      </span>
                    ))}
                  </div>

                  {/* Diff Preview */}
                  <div className="p-3 rounded-md bg-[#0E0D13] border border-[#24222D] font-mono text-xs overflow-x-auto">
                    <span className="text-[#8C8C93] block mb-1">// Proposed Legal Clause Addition:</span>
                    <p className="text-[#0DB44A] whitespace-pre-wrap">{alert.suggestedClause}</p>
                  </div>

                  {isPending && (
                    <div className="pt-1 flex justify-end gap-3">
                      <button
                        onClick={() => handleApply?.(alert.id)}
                        disabled={isProcessing}
                        className="px-3.5 py-1.5 bg-[#B43BFF] hover:bg-[#A127F5] text-white rounded-md text-xs font-semibold transition-all shadow-[0_0_12px_rgba(180,59,255,0.25)] flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Apply Clause &amp; Bump Version to {alert.suggestedVersion}</span>
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
