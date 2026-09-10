import React, { useState } from 'react';
import { ComplianceReport, DocumentItem, ProjectProfile, DocType } from '../types';
import {
  ShieldCheck,
  AlertTriangle,
  CheckCircle2,
  HelpCircle,
  Sparkles,
  RefreshCw,
  Award,
  BookOpen,
  FilePlus,
  Scale,
  ExternalLink
} from 'lucide-react';

interface ComplianceAssistantViewProps {
  project: ProjectProfile;
  docs: DocumentItem[];
  report: ComplianceReport;
  onRunAudit: () => Promise<void>;
  isAuditing: boolean;
  onGenerateMissingClause: (docTarget: DocType, recommendation: string) => Promise<void>;
}

export const ComplianceAssistantView: React.FC<ComplianceAssistantViewProps> = ({
  project,
  docs,
  report,
  onRunAudit,
  isAuditing,
  onGenerateMissingClause,
}) => {
  const [resolvingTarget, setResolvingTarget] = useState<string | null>(null);

  const handleFixMissing = async (docTarget: DocType, recommendation: string) => {
    setResolvingTarget(docTarget);
    await onGenerateMissingClause(docTarget, recommendation);
    setResolvingTarget(null);
  };

  const getScoreColor = (score: number) => {
    if (score >= 85) return 'text-emerald-600 bg-emerald-50 border-emerald-200';
    if (score >= 70) return 'text-amber-600 bg-amber-50 border-amber-200';
    return 'text-rose-600 bg-rose-50 border-rose-200';
  };

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      {/* Header Banner */}
      <div className="bg-slate-900 text-slate-100 rounded-2xl p-6 sm:p-8 border border-slate-800 shadow-xl relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 mb-2 text-indigo-400 font-semibold text-sm">
            <Scale className="w-4 h-4" />
            <span>Workflow Step 8: Multi-Jurisdictional Regulatory Audit</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
            Compliance & Privacy Assistant
          </h1>
          <p className="text-slate-300 text-sm sm:text-base mt-1 max-w-2xl">
            Automatically scans active policies and software architecture against GDPR, CCPA, COPPA, UK GDPR, and the EU Artificial Intelligence Act.
          </p>
        </div>

        <button
          onClick={onRunAudit}
          disabled={isAuditing}
          className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-semibold transition-all shadow-sm flex items-center gap-2 shrink-0 cursor-pointer disabled:opacity-50"
        >
          {isAuditing ? (
            <>
              <RefreshCw className="w-4 h-4 animate-spin" />
              <span>Auditing Regulations...</span>
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4" />
              <span>Re-Audit Policies</span>
            </>
          )}
        </button>
      </div>

      {/* Global Score Card & Breakdown Meters */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        {/* Overall Score Gauge */}
        <div className="md:col-span-4 bg-white rounded-xl border border-slate-200 p-6 shadow-sm flex flex-col items-center justify-center text-center">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">
            Overall Privacy & Regulatory Readiness
          </span>
          <div className="relative w-36 h-36 flex items-center justify-center my-2">
            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
              <circle
                cx="50"
                cy="50"
                r="40"
                fill="transparent"
                stroke="#e2e8f0"
                strokeWidth="10"
              />
              <circle
                cx="50"
                cy="50"
                r="40"
                fill="transparent"
                stroke="#4f46e5"
                strokeWidth="10"
                strokeDasharray={251.2}
                strokeDashoffset={251.2 * (1 - report.overallScore / 100)}
                strokeLinecap="round"
                className="transition-all duration-1000 ease-out"
              />
            </svg>
            <div className="absolute flex flex-col items-center">
              <span className="text-3xl font-extrabold text-slate-900">{report.overallScore}%</span>
              <span className="text-[10px] uppercase font-bold text-slate-400">Score</span>
            </div>
          </div>

          <div className="mt-2 text-xs text-slate-500 max-w-xs">
            {report.summary}
          </div>
        </div>

        {/* Breakdown by Regulation */}
        <div className="md:col-span-8 bg-white rounded-xl border border-slate-200 p-6 shadow-sm flex flex-col justify-between">
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-600 mb-4">
            Jurisdictional Breakdown
          </h2>

          <div className="space-y-4">
            {/* GDPR */}
            <div>
              <div className="flex justify-between text-xs font-semibold mb-1">
                <span className="text-slate-800">EU GDPR (General Data Protection Regulation)</span>
                <span className="font-mono text-indigo-600">{report.gdprScore}%</span>
              </div>
              <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
                <div
                  className="h-full bg-indigo-600 rounded-full transition-all duration-500"
                  style={{ width: `${report.gdprScore}%` }}
                />
              </div>
            </div>

            {/* CCPA */}
            <div>
              <div className="flex justify-between text-xs font-semibold mb-1">
                <span className="text-slate-800">California Consumer Privacy Act (CCPA / CPRA)</span>
                <span className="font-mono text-indigo-600">{report.ccpaScore}%</span>
              </div>
              <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
                <div
                  className="h-full bg-indigo-600 rounded-full transition-all duration-500"
                  style={{ width: `${report.ccpaScore}%` }}
                />
              </div>
            </div>

            {/* COPPA */}
            <div>
              <div className="flex justify-between text-xs font-semibold mb-1">
                <span className="text-slate-800">COPPA (Children&apos;s Online Privacy Protection Rule)</span>
                <span className="font-mono text-indigo-600">{report.coppaScore}%</span>
              </div>
              <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
                <div
                  className="h-full bg-indigo-600 rounded-full transition-all duration-500"
                  style={{ width: `${report.coppaScore}%` }}
                />
              </div>
            </div>

            {/* EU AI Act */}
            <div>
              <div className="flex justify-between text-xs font-semibold mb-1">
                <span className="text-slate-800">EU AI Act (Artificial Intelligence Transparency - Article 50)</span>
                <span className="font-mono text-indigo-600">{report.aiActScore}%</span>
              </div>
              <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
                <div
                  className="h-full bg-indigo-600 rounded-full transition-all duration-500"
                  style={{ width: `${report.aiActScore}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Actionable Missing Items Checklist */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-amber-500" />
            <span>Missing Regulatory Clauses & Disclosures</span>
          </h2>
          <span className="text-xs font-medium text-slate-500">
            {report.missingItems.length} findings require attention
          </span>
        </div>

        {report.missingItems.length === 0 ? (
          <div className="p-8 text-center text-slate-500 bg-slate-50 rounded-lg border border-slate-200">
            <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto mb-2" />
            <span className="text-sm font-semibold text-slate-800 block">All Mandatory Clauses Verified!</span>
            <span className="text-xs text-slate-500">Your documentation covers all key GDPR, CCPA, and AI Act statutes.</span>
          </div>
        ) : (
          <div className="space-y-3">
            {report.missingItems.map((item, idx) => (
              <div
                key={idx}
                className="p-4 rounded-xl border border-slate-200 bg-slate-50/60 hover:bg-slate-50 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div>
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <span
                      className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border ${
                        item.severity === 'high'
                          ? 'bg-rose-50 text-rose-700 border-rose-200'
                          : 'bg-amber-50 text-amber-700 border-amber-200'
                      }`}
                    >
                      {item.severity} severity
                    </span>
                    <span className="text-xs font-mono font-medium text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100">
                      {item.regulation}
                    </span>
                    <span className="text-xs font-semibold text-slate-900">{item.title}</span>
                  </div>
                  <p className="text-xs text-slate-500">{item.recommendation}</p>
                </div>

                <button
                  onClick={() => handleFixMissing(item.docTarget, item.recommendation)}
                  disabled={resolvingTarget === item.docTarget}
                  className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold shadow-2xs transition-all flex items-center gap-1.5 shrink-0 self-end sm:self-auto cursor-pointer disabled:opacity-50"
                >
                  {resolvingTarget === item.docTarget ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Synthesizing Clause...</span>
                    </>
                  ) : (
                    <>
                      <FilePlus className="w-3.5 h-3.5" />
                      <span>1-Click Generate & Fix</span>
                    </>
                  )}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Verified Passed Checks */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
        <h2 className="text-base font-bold text-slate-900 mb-4 flex items-center gap-2">
          <ShieldCheck className="w-5 h-5 text-emerald-600" />
          <span>Verified Passing Checks</span>
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {report.passedChecks.map((check, idx) => (
            <div key={idx} className="p-3 rounded-lg bg-emerald-50/40 border border-emerald-100 flex items-center gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span className="text-xs text-slate-700 font-medium">{check}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
