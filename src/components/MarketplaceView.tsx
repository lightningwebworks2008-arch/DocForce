import React, { useState } from 'react';
import { MarketplaceTemplate } from '../types';
import {
  Store,
  GitFork,
  Check,
  Search
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
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="pb-5 border-b border-[#24222D] flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5 text-[#8C8C93] font-mono text-xs uppercase tracking-wider">
            <Store className="w-3.5 h-3.5 text-[#33FBFF]" />
            <span>Workflow Step 9: Open Source Templates &amp; Community Marketplace</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-display font-semibold tracking-tight text-[#FFFFFF]">
            Pre-Built Compliance &amp; Technical Templates
          </h1>
          <p className="text-[#8C8C93] text-sm sm:text-base mt-1 max-w-2xl leading-relaxed">
            Fork battle-tested legal frameworks and developer documentation for B2B SaaS, generative AI startups, HIPAA healthcare apps, and mobile marketplaces.
          </p>
        </div>

        <div className="text-left md:text-right shrink-0">
          <span className="text-[11px] font-mono text-[#8C8C93] uppercase tracking-wider block">
            Verification Status
          </span>
          <span className="text-xs font-mono text-[#0DB44A] flex items-center md:justify-end gap-1.5 mt-0.5">
            <span className="w-2 h-2 rounded-full bg-[#0DB44A]" />
            <span>Reviewed by Legal Engineers</span>
          </span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        {/* Category Buttons */}
        <div className="flex flex-wrap gap-1.5">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 text-xs font-mono rounded-md border transition-all capitalize cursor-pointer ${
                selectedCategory === cat
                  ? 'bg-[#B43BFF] text-white border-[#B43BFF] shadow-[0_0_10px_rgba(180,59,255,0.3)]'
                  : 'bg-[#18171E] text-[#8C8C93] border-[#24222D] hover:text-[#FFFFFF] hover:bg-[#201E28]'
              }`}
            >
              {cat === 'all' ? 'All Templates' : cat}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative min-w-[240px]">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[#8C8C93]" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search templates, tags, or stacks..."
            className="w-full pl-8 pr-3 py-1.5 text-xs rounded-md border border-[#24222D] bg-[#15141C] text-[#F0F0F3] focus:border-[#B43BFF] outline-none font-mono placeholder-[#8C8C93]"
          />
        </div>
      </div>

      {/* Template Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((tpl) => {
          const isForked = forkedId === tpl.id;
          return (
            <div
              key={tpl.id}
              className="bg-[#15141C] rounded-md border border-[#24222D] p-5 flex flex-col justify-between space-y-4 shadow-lg hover:border-[#B43BFF]/50 transition-all"
            >
              <div>
                {/* Category & Tag */}
                <div className="flex items-center justify-between gap-2 mb-2 pb-2 border-b border-[#24222D]">
                  <span className="text-[10px] font-mono uppercase tracking-wider text-[#33FBFF]">
                    {tpl.category}
                  </span>
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded-md bg-[#18171E] text-[#8C8C93] border border-[#24222D]">
                    Blueprint
                  </span>
                </div>

                <h3 className="text-sm font-semibold text-[#FFFFFF] font-display">{tpl.title}</h3>
                <p className="text-xs text-[#8C8C93] mt-1.5 leading-relaxed">{tpl.description}</p>

                {/* Tags */}
                <div className="flex flex-wrap gap-1 mt-3">
                  {tpl.tags.map((tag, idx) => (
                    <span key={idx} className="text-[10px] px-1.5 py-0.5 rounded-md bg-[#111015] border border-[#24222D] text-[#8C8C93] font-mono">
                      #{tag}
                    </span>
                  ))}
                </div>

                {/* Included Docs */}
                <div className="mt-4 pt-3 border-t border-[#24222D]">
                  <span className="text-[10px] font-mono uppercase tracking-wider text-[#8C8C93] block mb-1.5">
                    Included Policies:
                  </span>
                  <div className="flex flex-wrap gap-1">
                    {tpl.highlightedDocs.map((doc, idx) => (
                      <span key={idx} className="text-[10px] px-1.5 py-0.5 rounded-md bg-[#18171E] text-[#33FBFF] font-mono border border-[#24222D]">
                        {doc}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Fork Action Button */}
              <div className="pt-2 border-t border-[#24222D]">
                <button
                  onClick={() => handleFork(tpl)}
                  className={`w-full py-2 rounded-md text-xs font-semibold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                    isForked
                      ? 'bg-[#0DB44A] text-white shadow-[0_0_12px_rgba(13,180,74,0.3)]'
                      : 'bg-[#B43BFF] hover:bg-[#A127F5] text-white shadow-[0_0_12px_rgba(180,59,255,0.25)]'
                  }`}
                >
                  {isForked ? (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      <span>Forked to Active Project</span>
                    </>
                  ) : (
                    <>
                      <GitFork className="w-3.5 h-3.5" />
                      <span>Fork &amp; Customize</span>
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
