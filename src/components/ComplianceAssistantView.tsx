import React, { useState } from 'react';
import { ComplianceReport, DocumentItem, ProjectProfile, DocType } from '../types';
import {
  ShieldCheck,
  AlertTriangle,
  CheckCircle2,
  RefreshCw,
  FilePlus,
  Scale
} from 'lucide-react';

interface ComplianceAssistantViewProps {
  project: ProjectProfile | null;
  docs: DocumentItem[];
  report: ComplianceReport | null;
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

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-6 pb-6 border-b border-[#24222D]">
        <div>
          <div className="flex items-center gap-2 mb-1.5 text-[#8C8C93] font-mono text-xs uppercase tracking-wider">
            <Scale className="w-3.5 h-3.5 text-[#33FBFF]" />
            <span>Workflow Step 8 • Multi-Jurisdictional Regulatory Audit</span>
          </div>
          <h1 className="font-display text-2xl sm:text-3xl font-semibold tracking-tight text-[#FFFFFF]">
            Compliance &amp; Privacy Assistant
          </h1>
          <p className="text-[#8C8C93] text-xs sm:text-sm mt-1 max-w-2xl leading-relaxed">
            Scans active policies and architecture against GDPR Articles 6 &amp; 13, California CCPA/CPRA, COPPA requirements, and the EU Artificial Intelligence Act.
          </p>
        </div>

        <button
          onClick={onRunAudit}
          disabled={isAuditing}
          className="px-4 py-2 bg-[#B43BFF] hover:bg-[#A127F5] text-white rounded-md text-xs font-semibold transition-all shadow-[0_0_15px_rgba(180,59,255,0.3)] flex items-center gap-2 shrink-0 cursor-pointer disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isAuditing ? 'animate-spin' : ''}`} />
          <span>{isAuditing ? 'Auditing Regulations...' : report ? 'Re-Audit Policies' : 'Run Regulatory Audit'}</span>
        </button>
      </div>

      {!report ? (
        <div className="border border-[#24222D] bg-[#15141C] p-12 text-center max-w-2xl mx-auto space-y-4 rounded-md shadow-xl">
          <div className="w-10 h-10 rounded-md border border-[#24222D] bg-[#18171E] text-[#33FBFF] flex items-center justify-center mx-auto">
            <Scale className="w-5 h-5 text-[#33FBFF]" />
          </div>
          <h2 className="font-display text-xl font-semibold text-[#FFFFFF]">Awaiting Regulatory Audit</h2>
          <p className="text-xs text-[#8C8C93] max-w-md mx-auto leading-relaxed">
            Run a multi-jurisdictional compliance scan to benchmark your documentation against GDPR, CCPA/CPRA, COPPA parental requirements, and EU AI Act Article 50 transparency mandates.
          </p>
          <div className="pt-2">
            <button
              onClick={onRunAudit}
              disabled={isAuditing}
              className="px-5 py-2 bg-[#B43BFF] hover:bg-[#A127F5] text-white rounded-md text-xs font-semibold transition-all shadow-[0_0_15px_rgba(180,59,255,0.3)] inline-flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isAuditing ? 'animate-spin' : ''}`} />
              <span>{isAuditing ? 'Auditing Policies...' : 'Execute Compliance Audit Now'}</span>
            </button>
          </div>
        </div>
      ) : (
        <>
          {/* Global Score Card & Breakdown Meters */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
            {/* Overall Score Gauge */}
            <div className="md:col-span-4 border border-[#24222D] bg-[#15141C] p-6 flex flex-col items-center justify-center text-center rounded-md shadow-lg">
              <span className="text-[10px] font-mono uppercase tracking-wider text-[#8C8C93] mb-2">
                Overall Regulatory Readiness
              </span>
              <div className="relative w-32 h-32 flex items-center justify-center my-2">
                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                  <circle
                    cx="50"
                    cy="50"
                    r="40"
                    fill="transparent"
                    stroke="#24222D"
                    strokeWidth="8"
                  />
                  <circle
                    cx="50"
                    cy="50"
                    r="40"
                    fill="transparent"
                    stroke="#B43BFF"
                    strokeWidth="8"
                    strokeDasharray={251.2}
                    strokeDashoffset={251.2 * (1 - report.overallScore / 100)}
                    strokeLinecap="round"
                    className="transition-all duration-700 ease-out"
                  />
                </svg>
                <div className="absolute flex flex-col items-center">
                  <span className="text-3xl font-semibold font-mono text-[#FFFFFF]">{report.overallScore}%</span>
                  <span className="text-[10px] uppercase font-mono text-[#8C8C93]">Score</span>
                </div>
              </div>

              <div className="mt-2 text-xs text-[#8C8C93] max-w-xs leading-relaxed">
                {report.summary}
              </div>
            </div>

            {/* Breakdown by Regulation */}
            <div className="md:col-span-8 border border-[#24222D] bg-[#15141C] p-6 flex flex-col justify-between rounded-md shadow-lg">
              <h2 className="text-xs font-mono uppercase tracking-wider text-[#8C8C93] mb-4">
                Jurisdictional Breakdown
              </h2>

              <div className="space-y-4">
                {/* GDPR */}
                <div>
                  <div className="flex justify-between text-xs font-medium mb-1">
                    <span className="text-[#F0F0F3]">EU GDPR (General Data Protection Regulation)</span>
                    <span className="font-mono text-[#33FBFF] font-semibold">{report.gdprScore}%</span>
                  </div>
                  <div className="w-full h-1.5 bg-[#24222D] overflow-hidden rounded-full">
                    <div
                      className="h-full bg-[#B43BFF] transition-all duration-500"
                      style={{ width: `${report.gdprScore}%` }}
                    />
                  </div>
                </div>

                {/* CCPA */}
                <div>
                  <div className="flex justify-between text-xs font-medium mb-1">
                    <span className="text-[#F0F0F3]">California Consumer Privacy Act (CCPA / CPRA)</span>
                    <span className="font-mono text-[#33FBFF] font-semibold">{report.ccpaScore}%</span>
                  </div>
                  <div className="w-full h-1.5 bg-[#24222D] overflow-hidden rounded-full">
                    <div
                      className="h-full bg-[#B43BFF] transition-all duration-500"
                      style={{ width: `${report.ccpaScore}%` }}
                    />
                  </div>
                </div>

                {/* COPPA */}
                <div>
                  <div className="flex justify-between text-xs font-medium mb-1">
                    <span className="text-[#F0F0F3]">COPPA (Children&apos;s Online Privacy Protection Rule)</span>
                    <span className="font-mono text-[#33FBFF] font-semibold">{report.coppaScore}%</span>
                  </div>
                  <div className="w-full h-1.5 bg-[#24222D] overflow-hidden rounded-full">
                    <div
                      className="h-full bg-[#B43BFF] transition-all duration-500"
                      style={{ width: `${report.coppaScore}%` }}
                    />
                  </div>
                </div>

                {/* EU AI Act */}
                <div>
                  <div className="flex justify-between text-xs font-medium mb-1">
                    <span className="text-[#F0F0F3]">EU AI Act (Artificial Intelligence Transparency - Article 50)</span>
                    <span className="font-mono text-[#33FBFF] font-semibold">{report.aiActScore}%</span>
                  </div>
                  <div className="w-full h-1.5 bg-[#24222D] overflow-hidden rounded-full">
                    <div
                      className="h-full bg-[#B43BFF] transition-all duration-500"
                      style={{ width: `${report.aiActScore}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Actionable Missing Items Checklist */}
          <div className="border border-[#24222D] bg-[#15141C] p-6 rounded-md shadow-lg">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-[#24222D]">
              <h2 className="font-display text-base font-semibold text-[#FFFFFF] flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-[#FFB800]" />
                <span>Missing Regulatory Clauses &amp; Disclosures</span>
              </h2>
              <span className="text-xs font-mono text-[#8C8C93]">
                {report.missingItems.length} findings require attention
              </span>
            </div>

            {report.missingItems.length === 0 ? (
              <div className="p-8 text-center text-[#8C8C93] bg-[#111015] border border-[#24222D] rounded-md">
                <CheckCircle2 className="w-6 h-6 text-[#0DB44A] mx-auto mb-2" />
                <span className="text-xs font-semibold text-[#FFFFFF] block">All Mandatory Clauses Verified</span>
                <span className="text-xs text-[#8C8C93]">Your documentation covers all key GDPR, CCPA, and AI Act statutes.</span>
              </div>
            ) : (
              <div className="divide-y divide-[#24222D]">
                {report.missingItems.map((item, idx) => (
                  <div
                    key={idx}
                    className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                  >
                    <div>
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <span
                          className={`text-[10px] font-mono uppercase tracking-wider px-1.5 py-0.5 rounded-md border ${
                            item.severity === 'high'
                              ? 'bg-[#FF5A5A]/15 text-[#FF5A5A] border-[#FF5A5A]/30'
                              : 'bg-[#FFB800]/15 text-[#FFB800] border-[#FFB800]/30'
                          }`}
                        >
                          {item.severity} severity
                        </span>
                        <span className="text-[10px] font-mono text-[#33FBFF] bg-[#18171E] px-1.5 py-0.5 rounded-md border border-[#24222D]">
                          {item.regulation}
                        </span>
                        <span className="text-xs font-medium text-[#FFFFFF]">{item.title}</span>
                      </div>
                      <p className="text-xs text-[#8C8C93]">{item.recommendation}</p>
                    </div>

                    <button
                      onClick={() => handleFixMissing(item.docTarget, item.recommendation)}
                      disabled={resolvingTarget === item.docTarget}
                      className="px-3 py-1.5 bg-[#B43BFF] hover:bg-[#A127F5] text-white rounded-md text-xs font-medium transition-colors flex items-center gap-1.5 shrink-0 self-end sm:self-auto cursor-pointer disabled:opacity-50 shadow-xs"
                    >
                      {resolvingTarget === item.docTarget ? (
                        <>
                          <RefreshCw className="w-3 h-3 animate-spin" />
                          <span>Synthesizing...</span>
                        </>
                      ) : (
                        <>
                          <FilePlus className="w-3 h-3" />
                          <span>Generate &amp; Fix</span>
                        </>
                      )}
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Verified Passed Checks */}
          <div className="border border-[#24222D] bg-[#15141C] p-6 rounded-md shadow-lg">
            <h2 className="font-display text-base font-semibold text-[#FFFFFF] mb-4 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-[#0DB44A]" />
              <span>Verified Passing Checks</span>
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {report.passedChecks.map((check, idx) => (
                <div key={idx} className="p-3 bg-[#111015] border border-[#24222D] rounded-md flex items-center gap-2.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#0DB44A] shrink-0" />
                  <span className="text-xs text-[#F0F0F3] font-medium">{check}</span>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
};
