import React, { useState } from 'react';
import { ProjectProfile, UserProfile } from '../types';
import {
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
  LogOut,
  User,
} from 'lucide-react';

interface NavbarProps {
  activeTab: 'scan' | 'docs' | 'review' | 'versions' | 'compliance' | 'monitor' | 'deploy' | 'marketplace';
  onSelectTab: (tab: 'scan' | 'docs' | 'review' | 'versions' | 'compliance' | 'monitor' | 'deploy' | 'marketplace') => void;
  project: ProjectProfile | null;
  projectsList: ProjectProfile[];
  onSelectProject: (proj: ProjectProfile) => void;
  onNewProject: () => void;
  user: UserProfile | null;
  onOpenAuthModal: () => void;
  onSignOut: () => void;
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

  const validProjects = (projectsList || []).filter((p): p is ProjectProfile => Boolean(p && p.id));

  return (
    <header className="sticky top-0 z-40 bg-[#111015]/95 backdrop-blur-md border-b border-[#24222D] text-[#F0F0F3]">
      {/* Top Utility Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">
          {/* Brand Logo & Project Selector */}
          <div className="flex items-center gap-4">
            <button
              onClick={() => onSelectTab('scan')}
              className="cursor-pointer text-left group"
            >
              <div>
                <span className="font-display text-lg tracking-tight font-semibold text-[#FFFFFF] group-hover:text-[#33FBFF] transition-colors">
                  DocForge
                </span>
                <span className="text-[11px] text-[#8C8C93] block -mt-0.5">
                  Legal &amp; Technical Policy Engine
                </span>
              </div>
            </button>

            <div className="h-5 w-px bg-[#24222D] hidden sm:block" />

            {/* Project Switcher */}
            <div className="relative">
              <button
                onClick={() => setProjectDropdownOpen(!projectDropdownOpen)}
                className="flex items-center gap-2 px-2.5 py-1.5 rounded-md bg-[#18171E] hover:bg-[#201E28] border border-[#2A2735] text-xs font-medium text-[#F0F0F3] transition-colors cursor-pointer"
              >
                <div className={`w-2 h-2 rounded-full ${project ? 'bg-[#33FBFF] shadow-[0_0_6px_rgba(51,251,255,0.6)]' : 'bg-[#57575A]'}`} />
                <span className="truncate max-w-[140px] sm:max-w-[200px]">
                  {project ? project.name : 'Select Project'}
                </span>
                <ChevronDown className="w-3.5 h-3.5 text-[#8C8C93]" />
              </button>

              {projectDropdownOpen && (
                <div className="absolute left-0 top-full mt-1.5 w-64 rounded-md bg-[#15141C] border border-[#2D2A3A] p-1.5 z-50 space-y-1 shadow-2xl">
                  <div className="px-2 py-1 text-[10px] font-mono uppercase tracking-wider text-[#8C8C93]">
                    Projects ({validProjects.length})
                  </div>
                  {validProjects.length > 0 ? (
                    validProjects.map((p) => (
                      <button
                        key={p.id}
                        onClick={() => {
                          onSelectProject(p);
                          setProjectDropdownOpen(false);
                        }}
                        className={`w-full text-left px-2.5 py-1.5 rounded-md text-xs font-medium flex items-center justify-between cursor-pointer transition-colors ${
                          project && p.id === project.id
                            ? 'bg-[#B43BFF] text-white font-semibold'
                            : 'text-[#C9C8D2] hover:bg-[#201E28]'
                        }`}
                      >
                        <span className="truncate">{p.name}</span>
                        <span className="text-[10px] font-mono opacity-80">{p.activeVersion}</span>
                      </button>
                    ))
                  ) : (
                    <div className="px-3 py-2 text-xs text-[#8C8C93] italic">
                      No saved projects yet
                    </div>
                  )}

                  <div className="border-t border-[#24222D] pt-1 mt-1">
                    <button
                      onClick={() => {
                        onNewProject();
                        setProjectDropdownOpen(false);
                      }}
                      className="w-full text-left px-2.5 py-1.5 rounded-md text-xs font-medium text-[#F0F0F3] hover:bg-[#201E28] flex items-center gap-2 cursor-pointer transition-colors"
                    >
                      <Plus className="w-3.5 h-3.5 text-[#B43BFF]" />
                      <span>Create New Project</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Metrics / GitHub Link / User Profile */}
          <div className="flex items-center gap-2 sm:gap-3">
            {project && (
              <>
                <div className="hidden lg:flex items-center gap-2 px-2.5 py-1 rounded-md bg-[#18171E] border border-[#24222D] text-xs">
                  <span className="text-[#8C8C93]">Compliance:</span>
                  <span className="font-semibold text-[#0DB44A] font-mono">{project.complianceScore}%</span>
                </div>

                <div className="hidden lg:flex items-center gap-2 px-2.5 py-1 rounded-md bg-[#18171E] border border-[#24222D] text-xs">
                  <span className="text-[#8C8C93]">Release:</span>
                  <span className="font-mono font-medium text-[#33FBFF]">{project.activeVersion}</span>
                </div>

                {project.githubUrl && (
                  <a
                    href={project.githubUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-[#18171E] hover:bg-[#201E28] border border-[#24222D] text-xs text-[#F0F0F3] transition-colors"
                  >
                    <Github className="w-3.5 h-3.5 text-[#8C8C93]" />
                    <span className="truncate max-w-[110px]">
                      {project.githubUrl.replace('https://github.com/', '')}
                    </span>
                  </a>
                )}
              </>
            )}

            {/* User Profile / Auth Button */}
            {user ? (
              <div className="relative">
                <button
                  onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                  className="flex items-center gap-2 px-2 py-1 rounded-md bg-[#18171E] hover:bg-[#201E28] border border-[#2A2735] text-xs font-medium text-[#F0F0F3] transition-colors cursor-pointer"
                >
                  {user.avatarUrl ? (
                    <img
                      src={user.avatarUrl}
                      alt={user.fullName || user.email}
                      className="w-6 h-6 rounded-md object-cover"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <div className="w-6 h-6 rounded-md bg-[#B43BFF] flex items-center justify-center text-white font-medium text-xs">
                      {(user.fullName || user.email || 'U')[0].toUpperCase()}
                    </div>
                  )}
                  <span className="hidden sm:inline-block max-w-[120px] truncate text-[#F0F0F3]">
                    {user.fullName || user.email.split('@')[0]}
                  </span>
                  <ChevronDown className="w-3 h-3 text-[#8C8C93]" />
                </button>

                {userDropdownOpen && (
                  <div className="absolute right-0 top-full mt-1.5 w-60 rounded-md bg-[#15141C] border border-[#2D2A3A] p-2 z-50 space-y-2 text-[#F0F0F3] text-xs shadow-2xl">
                    <div className="px-2 py-1.5 border-b border-[#24222D]">
                      <div className="font-semibold text-[#FFFFFF] truncate">{user.fullName || 'User'}</div>
                      <div className="text-[#8C8C93] text-[11px] truncate">{user.email}</div>
                      {user.githubUsername && (
                        <div className="flex items-center gap-1 text-[10px] text-[#33FBFF] font-mono mt-1">
                          <Github className="w-3 h-3 text-[#8C8C93]" />
                          <span>@{user.githubUsername}</span>
                        </div>
                      )}
                    </div>

                    <button
                      onClick={() => {
                        onSignOut();
                        setUserDropdownOpen(false);
                      }}
                      className="w-full text-left px-2 py-1 rounded-md text-xs font-medium text-[#FF5A5A] hover:bg-[#FF5A5A]/10 flex items-center gap-2 cursor-pointer transition-colors"
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
                className="px-3.5 py-1.5 rounded-md bg-[#B43BFF] hover:bg-[#A127F5] text-white font-medium text-xs transition-all shadow-[0_0_12px_rgba(180,59,255,0.3)] cursor-pointer flex items-center gap-1.5"
              >
                <User className="w-3.5 h-3.5" />
                <span>Sign In</span>
              </button>
            )}
          </div>
        </div>

        {/* Workflow Navigation Tabs */}
        <div className="flex items-center space-x-1 overflow-x-auto scrollbar-none py-1 border-t border-[#24222D]">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onSelectTab(item.id)}
                className={`px-3 py-2 text-xs font-medium flex items-center gap-1.5 whitespace-nowrap transition-colors cursor-pointer border-b-2 ${
                  isActive
                    ? 'border-[#753CFF] text-white font-semibold bg-[#753CFF]/10 shadow-[inset_0_-2px_8px_rgba(117,60,255,0.2)]'
                    : 'border-transparent text-[#8C8C93] hover:text-[#FFFFFF] hover:bg-[#18171E]/60'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-[#33FBFF]' : 'text-[#8C8C93]'}`} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </header>
  );
};
