import React, { useState } from 'react';
import { HumanReviewQuestion } from '../types';
import {
  CheckCircle2,
  ArrowRight,
  RefreshCw,
  SlidersHorizontal
} from 'lucide-react';

interface HumanReviewViewProps {
  questions: HumanReviewQuestion[];
  onAnswerQuestion: (questionId: string, answerValue: string) => void;
  onApplyAndSyncAll: () => Promise<void>;
  isSyncing: boolean;
  onNavigateToDocs: () => void;
}

export const HumanReviewView: React.FC<HumanReviewViewProps> = ({
  questions,
  onAnswerQuestion,
  onApplyAndSyncAll,
  isSyncing,
  onNavigateToDocs,
}) => {
  const [activeTab, setActiveTab] = useState<'all' | 'legal' | 'privacy'>('all');
  const [syncNotice, setSyncNotice] = useState<string | null>(null);

  const filteredQuestions = questions.filter((q) => activeTab === 'all' || q.category === activeTab);
  const answeredCount = questions.filter((q) => Boolean(q.selectedAnswer && q.selectedAnswer.trim().length > 0)).length;

  const handleApply = async () => {
    if (answeredCount === 0) return;
    await onApplyAndSyncAll();
    setSyncNotice('All legal and technical policies updated with human review assertions.');
    setTimeout(() => setSyncNotice(null), 4000);
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="pb-5 border-b border-[#24222D] flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5 text-[#8C8C93] font-mono text-xs uppercase tracking-wider">
            <SlidersHorizontal className="w-3.5 h-3.5 text-[#33FBFF]" />
            <span>Workflow Step 4: Human-in-the-Loop Verification</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-display font-semibold tracking-tight text-[#FFFFFF]">
            Human Review Layer
          </h1>
          <p className="text-[#8C8C93] text-sm sm:text-base mt-1 max-w-3xl leading-relaxed">
            DocForge never generates blind boilerplate. Based on services detected in your codebase, answer these critical governance decisions to legally tailor your policies.
          </p>
        </div>
      </div>

      {/* Sync Banner Notification */}
      {syncNotice && (
        <div className="p-3.5 rounded-md bg-[#0DB44A]/10 border border-[#0DB44A]/30 text-[#0DB44A] flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-[#0DB44A] shrink-0" />
            <span className="text-xs font-medium">{syncNotice}</span>
          </div>
          <button
            onClick={onNavigateToDocs}
            className="px-3 py-1 bg-[#0DB44A] hover:brightness-110 text-white rounded-md text-xs font-medium transition-colors flex items-center gap-1 cursor-pointer"
          >
            <span>View Updated Docs</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Category Pills & Apply Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex flex-wrap gap-1 font-mono text-xs">
          <button
            onClick={() => setActiveTab('all')}
            className={`px-3 py-1.5 rounded-md transition-colors cursor-pointer ${
              activeTab === 'all'
                ? 'bg-[#B43BFF] text-white font-semibold shadow-xs'
                : 'text-[#8C8C93] hover:text-[#FFFFFF] bg-[#18171E] border border-[#24222D]'
            }`}
          >
            All Questions ({questions.length})
          </button>
          <button
            onClick={() => setActiveTab('legal')}
            className={`px-3 py-1.5 rounded-md transition-colors cursor-pointer ${
              activeTab === 'legal'
                ? 'bg-[#B43BFF] text-white font-semibold shadow-xs'
                : 'text-[#8C8C93] hover:text-[#FFFFFF] bg-[#18171E] border border-[#24222D]'
            }`}
          >
            Legal &amp; Contracts ({questions.filter((q) => q.category === 'legal').length})
          </button>
          <button
            onClick={() => setActiveTab('privacy')}
            className={`px-3 py-1.5 rounded-md transition-colors cursor-pointer ${
              activeTab === 'privacy'
                ? 'bg-[#B43BFF] text-white font-semibold shadow-xs'
                : 'text-[#8C8C93] hover:text-[#FFFFFF] bg-[#18171E] border border-[#24222D]'
            }`}
          >
            Privacy &amp; Telemetry ({questions.filter((q) => q.category === 'privacy').length})
          </button>
        </div>

        <button
          onClick={handleApply}
          disabled={isSyncing || answeredCount === 0}
          className="px-4 py-2 bg-[#B43BFF] hover:bg-[#A127F5] text-white rounded-md text-xs font-semibold transition-all shadow-[0_0_18px_rgba(180,59,255,0.3)] flex items-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
        >
          {isSyncing ? (
            <>
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              <span>Synthesizing Legal Clauses...</span>
            </>
          ) : (
            <>
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>
                {answeredCount > 0
                  ? `Apply Decisions (${answeredCount}/${questions.length}) & Update Docs`
                  : 'Select Options to Apply'}
              </span>
            </>
          )}
        </button>
      </div>

      {/* Questions Stack */}
      <div className="space-y-4">
        {filteredQuestions.length === 0 ? (
          <div className="p-10 rounded-md bg-[#15141C] border border-[#24222D] text-center space-y-3">
            <div className="w-10 h-10 rounded-md bg-[#18171E] text-[#8C8C93] flex items-center justify-center mx-auto border border-[#24222D]">
              <SlidersHorizontal className="w-5 h-5 text-[#33FBFF]" />
            </div>
            <h3 className="text-sm font-semibold text-[#FFFFFF]">No Pending Human Review Items</h3>
            <p className="text-xs text-[#8C8C93] max-w-md mx-auto leading-relaxed">
              Connect your GitHub repository or enter your codebase manifest in Connect &amp; Scan. DocForge will inspect your dependencies and generate decision items for your review.
            </p>
          </div>
        ) : (
          filteredQuestions.map((q, idx) => (
            <div key={q.id} className="bg-[#15141C] rounded-md border border-[#24222D] p-5 space-y-3 shadow-md">
              {/* Question Header */}
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded-md bg-[#B43BFF]/15 text-[#B43BFF] border border-[#B43BFF]/30">
                      {q.detectedTrigger}
                    </span>
                    <span className="text-xs text-[#8C8C93] font-mono">Item {idx + 1} of {questions.length}</span>
                  </div>
                  <h3 className="text-sm font-semibold text-[#FFFFFF]">{q.question}</h3>
                  <p className="text-xs text-[#8C8C93] mt-0.5">{q.description}</p>
                </div>

                <div className="shrink-0 text-right">
                  <span className="text-[10px] font-mono uppercase tracking-wider text-[#8C8C93] block">Affected Policies:</span>
                  <div className="flex gap-1 mt-1 justify-end flex-wrap">
                    {q.affectedDocs.map((docType) => (
                      <span key={docType} className="text-[10px] font-mono px-1.5 py-0.5 bg-[#18171E] text-[#33FBFF] rounded-md border border-[#24222D]">
                        {docType}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Options Selection Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 pt-1">
                {q.options.map((opt) => {
                  const isSelected = Boolean(q.selectedAnswer) && q.selectedAnswer === opt.value;
                  return (
                    <button
                      key={opt.value}
                      onClick={() => onAnswerQuestion(q.id, opt.value)}
                      className={`p-3 rounded-md text-left transition-colors border cursor-pointer flex items-start gap-2.5 ${
                        isSelected
                          ? 'border-[#B43BFF] bg-[#1F1D2B] shadow-[0_0_12px_rgba(180,59,255,0.15)]'
                          : 'border-[#24222D] bg-[#18171E] hover:bg-[#1E1C27]'
                      }`}
                    >
                      <div
                        className={`w-3.5 h-3.5 rounded-full mt-0.5 flex items-center justify-center border shrink-0 ${
                          isSelected ? 'border-[#B43BFF] bg-[#B43BFF]' : 'border-[#8C8C93] bg-[#111015]'
                        }`}
                      >
                        {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                      </div>
                      <div>
                        <span className="text-xs font-semibold text-[#FFFFFF] block">{opt.label}</span>
                        <span className="text-[11px] text-[#8C8C93] leading-snug mt-0.5 block">{opt.value}</span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
