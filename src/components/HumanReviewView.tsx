import React, { useState } from 'react';
import { HumanReviewQuestion, DocType } from '../types';
import {
  ShieldAlert,
  CheckCircle2,
  HelpCircle,
  Sparkles,
  ArrowRight,
  FileCheck,
  AlertTriangle,
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

  const handleApply = async () => {
    await onApplyAndSyncAll();
    setSyncNotice('All legal and technical policies updated with human review assertions!');
    setTimeout(() => setSyncNotice(null), 4000);
  };

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      {/* Header Banner */}
      <div className="bg-amber-950 text-amber-50 rounded-2xl p-6 sm:p-8 border border-amber-900 shadow-lg relative overflow-hidden">
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-2 text-amber-400 font-semibold text-sm">
            <SlidersHorizontal className="w-4 h-4" />
            <span>Workflow Step 4: Human-in-the-Loop Verification</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
            Human Review Layer
          </h1>
          <p className="text-amber-200 text-sm sm:text-base mt-2 max-w-3xl leading-relaxed">
            DocForge never generates blind boilerplate. Based on services detected in your codebase, answer these critical business and governance decisions to legally tailor your policies.
          </p>
        </div>
      </div>

      {/* Sync Banner Notification */}
      {syncNotice && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <span className="text-sm font-semibold">{syncNotice}</span>
          </div>
          <button
            onClick={onNavigateToDocs}
            className="px-3 py-1.5 bg-emerald-600 text-white rounded-lg text-xs font-semibold hover:bg-emerald-700 transition-all flex items-center gap-1 cursor-pointer"
          >
            <span>View Updated Docs</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Category Pills & Apply Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex bg-slate-100 p-1 rounded-lg">
          <button
            onClick={() => setActiveTab('all')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${
              activeTab === 'all' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            All Questions ({questions.length})
          </button>
          <button
            onClick={() => setActiveTab('legal')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${
              activeTab === 'legal' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Legal & Contracts
          </button>
          <button
            onClick={() => setActiveTab('privacy')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${
              activeTab === 'privacy' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Privacy & Telemetry
          </button>
        </div>

        <button
          onClick={handleApply}
          disabled={isSyncing}
          className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-semibold transition-all shadow-sm flex items-center gap-2 cursor-pointer disabled:opacity-50"
        >
          {isSyncing ? (
            <>
              <RefreshCw className="w-4 h-4 animate-spin" />
              <span>Synthesizing Legal Clauses...</span>
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4" />
              <span>Apply Decisions & Update All Docs</span>
            </>
          )}
        </button>
      </div>

      {/* Questions Stack */}
      <div className="space-y-6">
        {filteredQuestions.map((q, idx) => (
          <div key={q.id} className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-4">
            {/* Question Header */}
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="text-[10px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-amber-100 text-amber-900 border border-amber-200">
                    {q.detectedTrigger}
                  </span>
                  <span className="text-xs text-slate-400">Question {idx + 1} of {questions.length}</span>
                </div>
                <h3 className="text-base font-bold text-slate-900">{q.question}</h3>
                <p className="text-xs text-slate-500 mt-0.5">{q.description}</p>
              </div>

              <div className="shrink-0 text-right">
                <span className="text-[11px] font-medium text-slate-500 block">Affected Policies:</span>
                <div className="flex gap-1 mt-1 justify-end flex-wrap">
                  {q.affectedDocs.map((docType) => (
                    <span key={docType} className="text-[10px] font-mono px-1.5 py-0.5 bg-slate-100 text-slate-600 rounded">
                      {docType}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Options Selection Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
              {q.options.map((opt) => {
                const isSelected = q.selectedAnswer === opt.value;
                return (
                  <button
                    key={opt.value}
                    onClick={() => onAnswerQuestion(q.id, opt.value)}
                    className={`p-3 rounded-lg text-left transition-all border cursor-pointer flex items-start gap-3 ${
                      isSelected
                        ? 'border-indigo-600 bg-indigo-50/50 shadow-xs ring-1 ring-indigo-600'
                        : 'border-slate-200 bg-slate-50/50 hover:bg-slate-100 hover:border-slate-300'
                    }`}
                  >
                    <div
                      className={`w-4 h-4 rounded-full mt-0.5 flex items-center justify-center border shrink-0 ${
                        isSelected ? 'border-indigo-600 bg-indigo-600' : 'border-slate-400 bg-white'
                      }`}
                    >
                      {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                    </div>
                    <div>
                      <span className="text-xs font-semibold text-slate-900 block">{opt.label}</span>
                      <span className="text-[11px] text-slate-500 leading-snug mt-0.5 block">{opt.value}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
