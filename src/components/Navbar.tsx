import React, { useState } from 'react';
import { ProjectProfile, UserProfile } from '../types';
import {
  FileCode2,
  Layers,
  FileText,
  SlidersHorizontal,
  History,
  Scale,
  Radio,
  UploadCloud,
  Store,
  ChevronDown,
  Plus,
  Github,
  CheckCircle2,
  Sparkles,
  LogOut,
  User,
  Database,
  ExternalLink
} from 'lucide-react';
import { isSupabaseConfigured } from '../lib/supabase';

interface NavbarProps {
  activeTab: 'scan' | 'docs' | 'review' | 'versions' | 'compliance' | 'monitor' | 'deploy' | 'marketplace';
  onSelectTab: (tab: 'scan' | 'docs' | 'review' | 'versions' | 'compliance' | 'monitor' | 'deploy' | 'marketplace') => void;
  project: ProjectProfile;
  projectsList: ProjectProfile[];
  onSelectProject: (proj: ProjectProfile) => void;
  onNewProject: () => void;
  user: UserProfile | null;
  onOpenAuthModal: () => void;
  onSignOut: () => void;
  onOpenSupabaseConfig?: () => void;
  onOpenGitHubConfig?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  onSelectTab,
  project,
  projectsList,
  onSelectProject,
  onNewProject,
  user,
  onOpenAuthModal,
  onSignOut,
  onOpenSupabaseConfig,
  onOpenGitHubConfig,
}) => {
  const [projectDropdownOpen, setProjectDropdownOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);

  const navItems = [
    { id: 'scan', label: 'Connect & Scan', icon: Layers },
    { id: 'docs', label: 'Doc Engine', icon: FileText },
    { id: 'review', label: 'Human Review', icon: SlidersHorizontal },
    { id: 'versions', label: 'Version Control', icon: History },
    { id: 'compliance', label: 'Compliance Audit', icon: Scale },
    { id: 'monitor', label: 'Change Monitor', icon: Radio },
    { id: 'deploy', label: 'Deploy & Host', icon: UploadCloud },
    { id: 'marketplace', label: 'Marketplace', icon: Store },
  ] as const;

  return (
    <header className="sticky top-0 z-40 bg-slate-900 border-b border-slate-800 shadow-md">
      {/* Top Utility Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">
          {/* Brand Logo & Project Selector */}
          <div className="flex items-center gap-4">
            <button
              onClick={() => onSelectTab('scan')}
              className="flex items-center gap-2.5 group cursor-pointer text-left"
            >
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-indigo-700 flex items-center justify-center text-white shadow-md group-hover:scale-105 transition-transform">
                <FileCode2 className="w-5 h-5" />
              </div>
              <div>
                <span className="text-lg font-extrabold tracking-tight text-white flex items-center gap-1.5">
                  DocForge
                  <span className="text-[10px] uppercase font-mono font-bold tracking-wider px-1.5 py-0.2 rounded bg-indigo-500/30 text-indigo-300 border border-indigo-500/40">
                    Copilot
                  </span>
                </span>
                <span className="text-[11px] text-slate-400 block -mt-0.5">
                  Legal & Technical Docs Engine
                </span>
              </div>
            </button>

            <div className="h-6 w-px bg-slate-800 hidden sm:block" />

            {/* Project Switcher Pill */}
            <div className="relative">
              <button
                onClick={() => setProjectDropdownOpen(!projectDropdownOpen)}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-800 border border-slate-700/80 text-xs font-semibold text-slate-200 transition-all cursor-pointer"
              >
                <div className="w-2 h-2 rounded-full bg-emerald-400" />
                <span className="truncate max-w-[140px] sm:max-w-[200px]">{project.name}</span>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
              </button>

              {projectDropdownOpen && (
                <div className="absolute left-0 top-full mt-1.5 w-64 rounded-xl bg-slate-800 border border-slate-700 shadow-2xl p-1.5 z-50 space-y-1">
                  <div className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Switch Active Project
                  </div>
                  {projectsList.map((p) => (
                    <button
                      key={p.id}
                      onClick={() => {
                        onSelectProject(p);
                        setProjectDropdownOpen(false);
                      }}
                      className={`w-full text-left px-3 py-2 rounded-lg text-xs font-medium flex items-center justify-between cursor-pointer transition-all ${
                        p.id === project.id
                          ? 'bg-indigo-600 text-white font-semibold'
                          : 'text-slate-300 hover:bg-slate-700 hover:text-white'
                      }`}
                    >
                      <span className="truncate">{p.name}</span>
                      <span className="text-[10px] font-mono opacity-80">{p.activeVersion}</span>
                    </button>
                  ))}

                  <div className="border-t border-slate-700 pt-1 mt-1">
                    <button
                      onClick={() => {
                        onNewProject();
                        setProjectDropdownOpen(false);
                      }}
                      className="w-full text-left px-3 py-1.5 rounded-lg text-xs font-semibold text-indigo-400 hover:bg-indigo-950/50 flex items-center gap-2 cursor-pointer transition-all"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>+ Create New Project</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Quick Metrics / GitHub Badge / User Profile */}
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-800/80 border border-slate-700/80 text-xs">
              <span className="text-slate-400">Compliance:</span>
              <span className="font-bold text-emerald-400">{project.complianceScore}%</span>
            </div>

            <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-800/80 border border-slate-700/80 text-xs">
              <span className="text-slate-400">Release:</span>
              <span className="font-mono font-bold text-indigo-300">{project.activeVersion}</span>
            </div>

            {project.githubUrl && (
              <a
                href={project.githubUrl}
                target="_blank"
                rel="noreferrer"
                className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 border border-slate-700/80 text-xs text-slate-300 transition-all"
              >
                <Github className="w-3.5 h-3.5" />
                <span className="truncate max-w-[110px]">
                  {project.githubUrl.replace('https://github.com/', '')}
                </span>
              </a>
            )}

            {/* Supabase Status Indicator & Config Launcher */}
            <button
              onClick={onOpenSupabaseConfig}
              title={
                isSupabaseConfigured
                  ? 'Supabase Live Connected (Click to view or edit keys)'
                  : 'Supabase Not Configured (Click to paste credentials & connect)'
              }
              className={`hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-[11px] font-medium transition-all cursor-pointer ${
                isSupabaseConfigured
                  ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-300 hover:bg-emerald-900/50'
                  : 'bg-amber-950/40 border-amber-500/40 text-amber-300 hover:bg-amber-900/50'
              }`}
            >
              <Database className={`w-3.5 h-3.5 ${isSupabaseConfigured ? 'text-emerald-400' : 'text-amber-400'}`} />
              <span>{isSupabaseConfigured ? 'Supabase Connected' : 'Configure Supabase'}</span>
            </button>

            {/* GitHub OAuth Launcher */}
            {onOpenGitHubConfig && (
              <button
                onClick={onOpenGitHubConfig}
                title="Configure GitHub OAuth / Connected Accounts"
                className="hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-slate-700 bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white text-[11px] font-medium transition-all cursor-pointer"
              >
                <Github className="w-3.5 h-3.5 text-slate-300" />
                <span>GitHub OAuth</span>
              </button>
            )}

            {/* User Profile / Auth Button */}
            {user ? (
              <div className="relative">
                <button
                  onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                  className="flex items-center gap-2 p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-semibold text-white transition-all cursor-pointer"
                >
                  {user.avatarUrl ? (
                    <img
                      src={user.avatarUrl}
                      alt={user.fullName || user.email}
                      className="w-7 h-7 rounded-lg object-cover"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <div className="w-7 h-7 rounded-lg bg-indigo-600 flex items-center justify-center text-white font-bold text-xs">
                      {(user.fullName || user.email || 'U')[0].toUpperCase()}
                    </div>
                  )}
                  <span className="hidden sm:inline-block max-w-[100px] truncate text-slate-200">
                    {user.fullName || user.email.split('@')[0]}
                  </span>
                  <ChevronDown className="w-3 h-3 text-slate-400" />
                </button>

                {userDropdownOpen && (
                  <div className="absolute right-0 top-full mt-1.5 w-60 rounded-xl bg-slate-800 border border-slate-700 shadow-2xl p-2 z-50 space-y-2 text-slate-200 text-xs">
                    <div className="px-2 py-1.5 border-b border-slate-700/70">
                      <div className="font-semibold text-white truncate">{user.fullName || 'Developer'}</div>
                      <div className="text-slate-400 text-[11px] truncate">{user.email}</div>
                      {user.githubUsername && (
                        <div className="flex items-center gap-1 text-[10px] text-indigo-400 font-mono mt-1">
                          <Github className="w-3 h-3" />
                          <span>@{user.githubUsername}</span>
                        </div>
                      )}
                    </div>

                    <button
                      onClick={() => {
                        onSignOut();
                        setUserDropdownOpen(false);
                      }}
                      className="w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-semibold text-red-400 hover:bg-red-950/40 flex items-center gap-2 cursor-pointer transition-all"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      <span>Sign Out</span>
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <button
                onClick={onOpenAuthModal}
                className="px-3.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs transition-all cursor-pointer flex items-center gap-1.5 shadow-sm"
              >
                <User className="w-3.5 h-3.5" />
                <span>Sign In</span>
              </button>
            )}
          </div>
        </div>

        {/* Workflow Navigation Tabs */}
        <div className="flex items-center space-x-1 overflow-x-auto scrollbar-none py-2 border-t border-slate-800/80">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onSelectTab(item.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 whitespace-nowrap transition-all cursor-pointer ${
                  isActive
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </header>
  );
};
