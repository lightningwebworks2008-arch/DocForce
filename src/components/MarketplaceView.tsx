import React, { useState } from 'react';
import { MarketplaceTemplate } from '../types';
import {
  Store,
  GitFork,
  Star,
  Sparkles,
  Tag,
  Shield,
  Layers,
  ArrowRight,
  Check,
  Search,
  ExternalLink
} from 'lucide-react';

interface MarketplaceViewProps {
  templates: MarketplaceTemplate[];
  onForkTemplate: (template: MarketplaceTemplate) => void;
}

export const MarketplaceView: React.FC<MarketplaceViewProps> = ({ templates, onForkTemplate }) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [forkedId, setForkedId] = useState<string | null>(null);

  const categories = ['all', 'SaaS', 'AI Startup', 'E-Commerce', 'Mobile App', 'Healthcare & HIPAA'];

  const filtered = templates.filter((tpl) => {
    const matchesCat = selectedCategory === 'all' || tpl.category === selectedCategory;
    const matchesSearch =
      tpl.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tpl.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tpl.tags.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCat && matchesSearch;
  });

  const handleFork = (tpl: MarketplaceTemplate) => {
    setForkedId(tpl.id);
    onForkTemplate(tpl);
    setTimeout(() => setForkedId(null), 3000);
  };

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      {/* Header Banner */}
      <div className="bg-slate-900 text-slate-100 rounded-2xl p-6 sm:p-8 border border-slate-800 shadow-xl relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 mb-2 text-indigo-400 font-semibold text-sm">
            <Store className="w-4 h-4" />
            <span>Workflow Step 9: Open Source Templates & Community Marketplace</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
            Pre-Built Compliance & Technical Templates
          </h1>
          <p className="text-slate-300 text-sm sm:text-base mt-1 max-w-2xl">
            Fork battle-tested legal frameworks and developer documentation for B2B SaaS, generative AI startups, HIPAA healthcare apps, and mobile marketplaces.
          </p>
        </div>

        <div className="flex items-center gap-2 px-4 py-2 bg-indigo-600/20 border border-indigo-500/30 rounded-xl text-indigo-300 text-xs font-semibold shrink-0">
          <Sparkles className="w-4 h-4 text-indigo-400" />
          <span>Peer-Reviewed by Legal Engineers</span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        {/* Category Pills */}
        <div className="flex flex-wrap bg-slate-100 p-1 rounded-xl gap-1">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all capitalize cursor-pointer ${
                selectedCategory === cat ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {cat === 'all' ? 'All Templates' : cat}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative min-w-[240px]">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search templates, tags, or stacks..."
            className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-300 focus:ring-2 focus:ring-indigo-500 outline-none"
          />
        </div>
      </div>

      {/* Template Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filtered.map((tpl) => {
          const isForked = forkedId === tpl.id;
          return (
            <div
              key={tpl.id}
              className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm hover:shadow-md transition-all flex flex-col justify-between space-y-4"
            >
              <div>
                {/* Category & Stats */}
                <div className="flex items-center justify-between gap-2 mb-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
                    {tpl.category}
                  </span>

                  <div className="flex items-center gap-3 text-slate-500 text-xs font-mono">
                    <span className="flex items-center gap-1">
                      <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                      <span>{tpl.starsCount}</span>
                    </span>
                    <span className="flex items-center gap-1">
                      <GitFork className="w-3.5 h-3.5 text-slate-400" />
                      <span>{tpl.forksCount}</span>
                    </span>
                  </div>
                </div>

                <h3 className="text-base font-bold text-slate-900">{tpl.title}</h3>
                <p className="text-xs text-slate-600 mt-1 leading-relaxed">{tpl.description}</p>

                {/* Tags */}
                <div className="flex flex-wrap gap-1 mt-3">
                  {tpl.tags.map((tag, idx) => (
                    <span key={idx} className="text-[10px] px-2 py-0.5 rounded bg-slate-100 text-slate-600 font-medium">
                      #{tag}
                    </span>
                  ))}
                </div>

                {/* Highlighted Included Docs */}
                <div className="mt-4 pt-3 border-t border-slate-100">
                  <span className="text-[11px] font-semibold text-slate-500 block mb-1.5">Includes Policies:</span>
                  <div className="flex flex-wrap gap-1">
                    {tpl.highlightedDocs.map((doc, idx) => (
                      <span key={idx} className="text-[10px] px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 font-mono font-medium border border-emerald-100">
                        {doc}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Fork Action Button */}
              <div className="pt-2">
                <button
                  onClick={() => handleFork(tpl)}
                  className={`w-full py-2.5 rounded-lg text-xs font-semibold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                    isForked
                      ? 'bg-emerald-600 text-white'
                      : 'bg-slate-900 hover:bg-slate-800 text-white shadow-xs'
                  }`}
                >
                  {isForked ? (
                    <>
                      <Check className="w-4 h-4" />
                      <span>Forked to Active Project!</span>
                    </>
                  ) : (
                    <>
                      <GitFork className="w-4 h-4 text-indigo-400" />
                      <span>Fork & Customize Template</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
