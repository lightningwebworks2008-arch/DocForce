import React, { useState, useEffect } from 'react';
import {
  ProjectProfile,
  DocumentItem,
  VersionRecord,
  HumanReviewQuestion,
  ComplianceReport,
  MarketplaceTemplate,
  ChangeEventAlert,
  DocType,
  UserProfile
} from './types';
import {
  INITIAL_PROJECT,
  INITIAL_DOCS,
  INITIAL_VERSIONS,
  INITIAL_QUESTIONS,
  MARKETPLACE_TEMPLATES,
  INITIAL_CHANGE_ALERTS
} from './data/mockProjects';
import {
  fetchUserProjects,
  saveProject,
  fetchProjectDocuments,
  saveDocument,
  fetchDocumentVersions,
  saveDocumentVersion,
  getCurrentUser,
  signOut,
  isSupabaseConfigured
} from './lib/supabase';
import { Navbar } from './components/Navbar';
import { ConnectScanView } from './components/ConnectScanView';
import { DocEngineView } from './components/DocEngineView';
import { HumanReviewView } from './components/HumanReviewView';
import { VersionControlView } from './components/VersionControlView';
import { ComplianceAssistantView } from './components/ComplianceAssistantView';
import { ChangeMonitorView } from './components/ChangeMonitorView';
import { DeployPortalView } from './components/DeployPortalView';
import { MarketplaceView } from './components/MarketplaceView';
import { AuthModal } from './components/AuthModal';

export default function App() {
  const [activeTab, setActiveTab] = useState<
    'scan' | 'docs' | 'review' | 'versions' | 'compliance' | 'monitor' | 'deploy' | 'marketplace'
  >('scan');

  // User auth state
  const [user, setUser] = useState<UserProfile | null>(null);
  const [authModalOpen, setAuthModalOpen] = useState(false);

  // Multi-project state
  const [projectsList, setProjectsList] = useState<ProjectProfile[]>(INITIAL_PROJECT ? [INITIAL_PROJECT] : []);
  const [currentProject, setCurrentProject] = useState<ProjectProfile | null>(INITIAL_PROJECT);

  // Active documents & history state
  const [docs, setDocs] = useState<DocumentItem[]>(INITIAL_DOCS);
  const [activeDocId, setActiveDocId] = useState<string>(INITIAL_DOCS[0]?.id || '');
  const [versions, setVersions] = useState<VersionRecord[]>(INITIAL_VERSIONS);
  const [questions, setQuestions] = useState<HumanReviewQuestion[]>(INITIAL_QUESTIONS);
  const [alerts, setAlerts] = useState<ChangeEventAlert[]>(INITIAL_CHANGE_ALERTS);

  // Compliance Report State
  const [complianceReport, setComplianceReport] = useState<ComplianceReport | null>(null);

  // Loading states
  const [isScanning, setIsScanning] = useState(false);
  const [isGeneratingDoc, setIsGeneratingDoc] = useState(false);
  const [isSyncingReview, setIsSyncingReview] = useState(false);
  const [isAuditing, setIsAuditing] = useState(false);
  const [isProcessingChange, setIsProcessingChange] = useState(false);

  // Initial user & data load
  useEffect(() => {
    const initData = async () => {
      const activeUser = await getCurrentUser();
      setUser(activeUser);

      const projects = await fetchUserProjects();
      if (projects.length > 0) {
        setProjectsList(projects);
        setCurrentProject(projects[0]);

        const projectDocs = await fetchProjectDocuments(projects[0].id);
        if (projectDocs.length > 0) {
          setDocs(projectDocs);
          setActiveDocId(projectDocs[0].id);
        }

        const projectVersions = await fetchDocumentVersions(projects[0].id);
        if (projectVersions.length > 0) {
          setVersions(projectVersions);
        }
      }
    };

    initData();

    const handleAuthChange = async () => {
      const u = await getCurrentUser();
      setUser(u);
    };

    window.addEventListener('docforge-auth-change', handleAuthChange);
    return () => window.removeEventListener('docforge-auth-change', handleAuthChange);
  }, []);

  // When active project changes, load its documents
  const handleSelectProject = async (proj: ProjectProfile) => {
    setCurrentProject(proj);
    const pDocs = await fetchProjectDocuments(proj.id);
    if (pDocs.length > 0) {
      setDocs(pDocs);
      setActiveDocId(pDocs[0].id);
    }
    const pVersions = await fetchDocumentVersions(proj.id);
    if (pVersions.length > 0) {
      setVersions(pVersions);
    }
  };

  // 1. Deep GitHub Repository Inspection
  const handleInspectGitHubRepo = async (repoUrlOrFullName: string) => {
    setIsScanning(true);
    try {
      const res = await fetch('/api/github/inspect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ repoUrl: repoUrlOrFullName }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Repository inspection failed');
      }

      const { analysis } = data;

      const authMethods = analysis.detectedServices
        .filter((s: any) => s.category === 'auth')
        .map((s: any) => s.name);
      const paymentProviders = analysis.detectedServices
        .filter((s: any) => s.category === 'payments')
        .map((s: any) => s.name);
      const analyticsProviders = analysis.detectedServices
        .filter((s: any) => s.category === 'analytics')
        .map((s: any) => s.name);
      const aiModels = analysis.detectedServices
        .filter((s: any) => s.category === 'ai')
        .map((s: any) => s.name);

      const baseProject: ProjectProfile = currentProject || {
        id: `proj_${Date.now().toString(36)}`,
        name: analysis.repoMeta.name || 'Repository Project',
        projectType: 'SaaS',
        websiteUrl: '',
        githubUrl: analysis.repoMeta.htmlUrl,
        repoOwner: analysis.repoMeta.owner,
        repoName: analysis.repoMeta.name,
        defaultBranch: analysis.repoMeta.defaultBranch || 'main',
        isPrivate: analysis.repoMeta.isPrivate || false,
        techStack: [],
        authMethods: [],
        paymentProviders: [],
        analyticsProviders: [],
        aiModels: [],
        dataCollected: [],
        complianceScore: 0,
        activeVersion: 'v1.0',
        createdAt: new Date().toISOString(),
        lastUpdated: new Date().toISOString(),
        deployedUrls: {
          privacy: '',
          terms: '',
          security: '',
          apiDocs: '',
          publicPortal: '',
        },
      };

      const updatedProject: ProjectProfile = {
        ...baseProject,
        name: analysis.repoMeta.name || baseProject.name,
        githubUrl: analysis.repoMeta.htmlUrl,
        repoOwner: analysis.repoMeta.owner,
        repoName: analysis.repoMeta.name,
        defaultBranch: analysis.repoMeta.defaultBranch,
        isPrivate: analysis.repoMeta.isPrivate,
        techStack: analysis.techStack || baseProject.techStack,
        framework: analysis.framework,
        primaryLanguage: analysis.primaryLanguage,
        projectType: analysis.projectType || 'SaaS',
        authMethods: authMethods.length > 0 ? authMethods : baseProject.authMethods,
        paymentProviders: paymentProviders.length > 0 ? paymentProviders : baseProject.paymentProviders,
        analyticsProviders: analyticsProviders.length > 0 ? analyticsProviders : baseProject.analyticsProviders,
        aiModels: aiModels.length > 0 ? aiModels : baseProject.aiModels,
        complianceScore: 82,
        lastAnalysisDate: new Date().toISOString(),
        lastAnalysisStatus: 'complete',
      };

      setCurrentProject(updatedProject);
      setProjectsList((prev) => {
        const exists = prev.some((p) => p.id === updatedProject.id);
        return exists ? prev.map((p) => (p.id === updatedProject.id ? updatedProject : p)) : [updatedProject, ...prev];
      });
      await saveProject(updatedProject);

      // Persist repository scan to Supabase via admin endpoint
      try {
        await fetch('/api/github/save-project-scan', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            projectId: updatedProject.id,
            userId: user?.id,
            analysis,
          }),
        });
      } catch (saveErr) {
        console.warn('Repository scan persistence note:', saveErr);
      }

      // Update review questions if returned
      if (analysis.questions && analysis.questions.length > 0) {
        setQuestions(analysis.questions);
      }

      // Automatically generate or update documents for the new repo
      const answersMap: Record<string, string> = {};
      questions.forEach((q) => {
        answersMap[q.id] = q.selectedAnswer;
      });

      // Generate README & Privacy Policy right away
      try {
        const docRes = await fetch('/api/generate-doc', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            project: updatedProject,
            docType: 'readme',
            humanAnswers: answersMap,
          }),
        });
        if (docRes.ok) {
          const docData = await docRes.json();
          setDocs((prev) =>
            prev.map((d) =>
              d.type === 'readme'
                ? {
                    ...d,
                    content: docData.markdown,
                    lastModified: new Date().toISOString(),
                    wordCount: docData.markdown.split(/\s+/).filter(Boolean).length,
                  }
                : d
            )
          );
        }
      } catch (e) {
        console.warn('Initial doc generation note:', e);
      }

      return analysis;
    } finally {
      setIsScanning(false);
    }
  };

  // 2. AST Package.json & Env Key Scanner Handler
  const handleTriggerScan = async (repoUrl: string, packageJson: string, envVars: string, desc: string) => {
    setIsScanning(true);
    try {
      const res = await fetch('/api/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          repoUrl,
          packageJsonContent: packageJson,
          envVars,
          promptDescription: desc,
        }),
      });

      const data = await res.json();
      if (data.success && data.detected) {
        const detected = data.detected;
        const baseProject: ProjectProfile = currentProject || {
          id: `proj_${Date.now().toString(36)}`,
          name: 'Scanned Project',
          websiteUrl: repoUrl || '',
          githubUrl: repoUrl || '',
          projectType: 'SaaS',
          techStack: [],
          authMethods: [],
          paymentProviders: [],
          analyticsProviders: [],
          aiModels: [],
          dataCollected: [],
          complianceScore: 0,
          activeVersion: 'v1.0',
          createdAt: new Date().toISOString(),
          lastUpdated: new Date().toISOString(),
          deployedUrls: {
            privacy: '',
            terms: '',
            security: '',
            apiDocs: '',
            publicPortal: '',
          },
        };

        const updatedProject: ProjectProfile = {
          ...baseProject,
          techStack: Array.from(new Set([...baseProject.techStack, ...detected.frameworks, ...detected.storage])),
          authMethods: detected.auth.length > 0 ? detected.auth : baseProject.authMethods,
          paymentProviders: detected.payments.length > 0 ? detected.payments : baseProject.paymentProviders,
          analyticsProviders: detected.analytics.length > 0 ? detected.analytics : baseProject.analyticsProviders,
          aiModels: detected.aiModels.length > 0 ? detected.aiModels : baseProject.aiModels,
          complianceScore: 86,
          lastUpdated: new Date().toISOString(),
        };

        setCurrentProject(updatedProject);
        setProjectsList((prev) => {
          const exists = prev.some((p) => p.id === updatedProject.id);
          return exists ? prev.map((p) => (p.id === updatedProject.id ? updatedProject : p)) : [updatedProject, ...prev];
        });
        await saveProject(updatedProject);
      }
    } catch (err) {
      console.error('Scan failed:', err);
    } finally {
      setIsScanning(false);
    }
  };

  // 3. AI Document Generator Handler
  const handleRegenerateDoc = async (docType: DocType) => {
    setIsGeneratingDoc(true);
    try {
      const answersMap: Record<string, string> = {};
      questions.forEach((q) => {
        answersMap[q.id] = q.selectedAnswer;
      });

      const res = await fetch('/api/generate-doc', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          project: currentProject,
          docType,
          humanAnswers: answersMap,
        }),
      });

      const data = await res.json();
      if (data.success && data.markdown) {
        const targetDoc = docs.find((d) => d.type === docType);
        if (targetDoc) {
          const updatedDoc: DocumentItem = {
            ...targetDoc,
            content: data.markdown,
            lastModified: new Date().toISOString(),
            status: 'reviewed',
            wordCount: data.markdown.split(/\s+/).filter(Boolean).length,
          };
          setDocs((prev) => prev.map((d) => (d.id === targetDoc.id ? updatedDoc : d)));
          await saveDocument(updatedDoc);
        }
      }
    } catch (err) {
      console.error('Regenerate doc failed:', err);
    } finally {
      setIsGeneratingDoc(false);
    }
  };

  // 4. Human Review Assertions Sync
  const handleApplyAndSyncHumanReview = async () => {
    setIsSyncingReview(true);
    try {
      const answersMap: Record<string, string> = {};
      questions.forEach((q) => {
        answersMap[q.id] = q.selectedAnswer;
      });

      // Regenerate core legal docs with verified human assertions
      const legalDocTypes: DocType[] = ['privacy-policy', 'terms-of-service', 'cookie-policy', 'data-deletion'];

      for (const dt of legalDocTypes) {
        const res = await fetch('/api/generate-doc', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            project: currentProject,
            docType: dt,
            humanAnswers: answersMap,
          }),
        });
        const data = await res.json();
        if (data.success && data.markdown) {
          setDocs((prev) =>
            prev.map((d) =>
              d.type === dt
                ? {
                    ...d,
                    content: data.markdown,
                    lastModified: new Date().toISOString(),
                    status: 'reviewed',
                    wordCount: data.markdown.split(/\s+/).filter(Boolean).length,
                  }
                : d
            )
          );
        }
      }

      if (currentProject) {
        const updatedProject = {
          ...currentProject,
          complianceScore: Math.min(96, currentProject.complianceScore + 8),
        };
        setCurrentProject(updatedProject);
        await saveProject(updatedProject);
      }
    } catch (err) {
      console.error('Review sync failed:', err);
    } finally {
      setIsSyncingReview(false);
    }
  };

  // 5. Version Release & Commit Handler
  const handleCreateRelease = async (versionTag: string, commitMessage: string) => {
    const docsSnapshot: Record<string, string> = {};
    docs.forEach((d) => {
      docsSnapshot[d.type] = d.content;
    });

    const newRecord: VersionRecord = {
      id: `ver_${Date.now()}`,
      projectId: currentProject?.id || 'default',
      version: versionTag,
      timestamp: new Date().toISOString(),
      commitSha: Math.random().toString(36).substring(2, 9),
      commitMessage,
      author: user?.fullName || 'Alex Chen (Lead Dev)',
      changesSummary: `Updated compliance assertions and generated ${docs.length} documentation suites.`,
      docsSnapshot,
    };

    setVersions([newRecord, ...versions]);
    await saveDocumentVersion(newRecord);

    if (currentProject) {
      const updatedProj = {
        ...currentProject,
        activeVersion: versionTag,
        lastUpdated: new Date().toISOString(),
      };
      setCurrentProject(updatedProj);
      await saveProject(updatedProj);
    }
  };

  // 6. Rollback to Prior Version
  const handleRollbackVersion = async (versionRecord: VersionRecord) => {
    if (!versionRecord.docsSnapshot) return;

    setDocs((prev) =>
      prev.map((doc) => {
        const snapshotContent = versionRecord.docsSnapshot[doc.type];
        if (snapshotContent) {
          return {
            ...doc,
            content: snapshotContent,
            version: versionRecord.version,
            lastModified: new Date().toISOString(),
          };
        }
        return doc;
      })
    );

    if (currentProject) {
      const updatedProj = {
        ...currentProject,
        activeVersion: versionRecord.version,
        lastUpdated: new Date().toISOString(),
      };
      setCurrentProject(updatedProj);
      await saveProject(updatedProj);
    }
  };

  // 7. Run Full Regulatory Compliance Audit
  const handleRunAudit = async () => {
    setIsAuditing(true);
    try {
      const docsMap: Record<string, string> = {};
      docs.forEach((d) => {
        docsMap[d.type] = d.content;
      });

      const res = await fetch('/api/audit-compliance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          project: currentProject,
          docs: docsMap,
          humanAnswers: questions,
        }),
      });

      const data = await res.json();
      if (data.success && data.audit) {
        setComplianceReport(data.audit);
        if (currentProject) {
          const updatedProj = {
            ...currentProject,
            complianceScore: data.audit.overallScore,
          };
          setCurrentProject(updatedProj);
          await saveProject(updatedProj);
        }
      }
    } catch (err) {
      console.error('Audit failed:', err);
    } finally {
      setIsAuditing(false);
    }
  };

  // 8. Change Monitor Simulation & Diff Application
  const handleSimulateCommit = async (commitMsg: string, dependency: string) => {
    setIsProcessingChange(true);
    try {
      const res = await fetch('/api/monitor-diff', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          commitMessage: commitMsg,
          addedDependencies: [dependency],
          currentStack: currentProject?.techStack || [],
        }),
      });

      const data = await res.json();
      if (data.success && data.diff) {
        const newAlert: ChangeEventAlert = {
          id: `alt_${Date.now()}`,
          timestamp: new Date().toISOString(),
          title: `New Service Detected: ${dependency}`,
          message: data.diff.recommendation,
          detectedChange: data.diff.detectedChange,
          affectedDocs: data.diff.affectedDocs,
          suggestedClause: data.diff.suggestedClause,
          suggestedVersion: data.diff.suggestedVersion || 'v1.3',
          status: 'pending',
        };
        setAlerts([newAlert, ...alerts]);
      }
    } catch (err) {
      console.error('Commit diff error:', err);
    } finally {
      setIsProcessingChange(false);
    }
  };

  const handleApplyAlertDiff = async (alertId: string) => {
    const alert = alerts.find((a) => a.id === alertId);
    if (!alert) return;

    setDocs((prev) =>
      prev.map((doc) => {
        if (alert.affectedDocs.includes(doc.type)) {
          const updatedContent = `${doc.content}\n\n${alert.suggestedClause}`;
          return {
            ...doc,
            content: updatedContent,
            lastModified: new Date().toISOString(),
            status: 'reviewed',
          };
        }
        return doc;
      })
    );

    setAlerts((prev) =>
      prev.map((a) => (a.id === alertId ? { ...a, status: 'applied' as const } : a))
    );
  };

  // New project initialization
  const handleNewProject = async () => {
    const newId = `proj_${Date.now().toString(36)}`;
    const newProj: ProjectProfile = {
      id: newId,
      name: 'Untitled Project',
      websiteUrl: '',
      githubUrl: '',
      projectType: 'SaaS',
      techStack: [],
      authMethods: [],
      paymentProviders: [],
      analyticsProviders: [],
      aiModels: [],
      dataCollected: [],
      complianceScore: 0,
      activeVersion: 'v1.0',
      createdAt: new Date().toISOString(),
      lastUpdated: new Date().toISOString(),
      deployedUrls: {
        privacy: '',
        terms: '',
        security: '',
        apiDocs: '',
        publicPortal: '',
      },
    };

    setProjectsList((prev) => [newProj, ...prev]);
    setCurrentProject(newProj);
    await saveProject(newProj);
    setActiveTab('scan');
  };

  const handleGenerateMissingClause = async (docTarget: DocType, recommendation: string) => {
    const targetDoc = docs.find((d) => d.type === docTarget);
    if (!targetDoc) return;
    const clause = `\n\n### Regulatory Compliance Update\n${recommendation}\n*Added automatically in compliance with verified multi-jurisdictional standards.*`;
    const updatedContent = `${targetDoc.content}${clause}`;
    const updatedDoc: DocumentItem = {
      ...targetDoc,
      content: updatedContent,
      lastModified: new Date().toISOString(),
      wordCount: updatedContent.split(/\s+/).filter(Boolean).length,
    };
    setDocs((prev) => prev.map((d) => (d.id === targetDoc.id ? updatedDoc : d)));
    await saveDocument(updatedDoc);
  };

  return (
    <div className="min-h-screen bg-[#0C0B0D] text-[#F0F0F3] flex flex-col font-sans selection:bg-[#753CFF] selection:text-white">
      {/* Top Navigation & Project Switcher */}
      <Navbar
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        project={currentProject}
        projectsList={projectsList}
        onSelectProject={handleSelectProject}
        onNewProject={handleNewProject}
        user={user}
        onOpenAuthModal={() => setAuthModalOpen(true)}
        onSignOut={async () => {
          await signOut();
          setUser(null);
        }}
      />

      {/* Main Container View Router */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'scan' && (
          <ConnectScanView
            project={currentProject}
            user={user}
            onUpdateProject={async (updated) => {
              const base: ProjectProfile = currentProject || {
                id: `proj_${Date.now().toString(36)}`,
                name: updated.name || 'Untitled Project',
                projectType: 'SaaS',
                websiteUrl: '',
                githubUrl: '',
                techStack: [],
                authMethods: [],
                paymentProviders: [],
                analyticsProviders: [],
                aiModels: [],
                dataCollected: [],
                complianceScore: 0,
                activeVersion: 'v1.0',
                createdAt: new Date().toISOString(),
                lastUpdated: new Date().toISOString(),
                deployedUrls: {
                  privacy: '',
                  terms: '',
                  security: '',
                  apiDocs: '',
                  publicPortal: '',
                },
              };
              const p = { ...base, ...updated };
              setCurrentProject(p);
              setProjectsList((prev) => {
                const exists = prev.some((item) => item.id === p.id);
                return exists ? prev.map((item) => (item.id === p.id ? p : item)) : [p, ...prev];
              });
              await saveProject(p);
            }}
            onTriggerScan={handleTriggerScan}
            onInspectGitHubRepo={handleInspectGitHubRepo}
            isScanning={isScanning}
            onNavigateToReview={() => setActiveTab('review')}
            onNavigateToDocs={() => setActiveTab('docs')}
            onOpenAuthModal={() => setAuthModalOpen(true)}
          />
        )}

        {activeTab === 'docs' && (
          <DocEngineView
            project={currentProject}
            docs={docs}
            activeDocId={activeDocId}
            onSelectDoc={setActiveDocId}
            onUpdateDocContent={async (id, newContent) => {
              setDocs((prev) =>
                prev.map((d) => (d.id === id ? { ...d, content: newContent, lastModified: new Date().toISOString() } : d))
              );
              const targetDoc = docs.find((d) => d.id === id);
              if (targetDoc) {
                await saveDocument({ ...targetDoc, content: newContent, lastModified: new Date().toISOString() });
              }
            }}
            onRegenerateDocWithAI={handleRegenerateDoc}
            isGenerating={isGeneratingDoc}
            onNavigateToHumanReview={() => setActiveTab('review')}
            onNavigateToVersionControl={() => setActiveTab('versions')}
          />
        )}

        {activeTab === 'review' && (
          <HumanReviewView
            questions={questions}
            onAnswerQuestion={(qId, val) => {
              setQuestions((prev) =>
                prev.map((q) => (q.id === qId ? { ...q, selectedAnswer: val, isConfirmed: true } : q))
              );
            }}
            onApplyAndSyncAll={handleApplyAndSyncHumanReview}
            isSyncing={isSyncingReview}
            onNavigateToDocs={() => setActiveTab('docs')}
          />
        )}

        {activeTab === 'versions' && (
          <VersionControlView
            project={currentProject}
            activeVersion={currentProject?.activeVersion || 'v1.0'}
            versions={versions}
            docs={docs}
            onCreateRelease={handleCreateRelease}
            onRollbackVersion={handleRollbackVersion}
          />
        )}

        {activeTab === 'compliance' && (
          <ComplianceAssistantView
            report={complianceReport}
            project={currentProject}
            docs={docs}
            onRunAudit={handleRunAudit}
            isAuditing={isAuditing}
            onGenerateMissingClause={handleGenerateMissingClause}
          />
        )}

        {activeTab === 'monitor' && (
          <ChangeMonitorView
            project={currentProject}
            alerts={alerts}
            onSimulateCommit={handleSimulateCommit}
            onApplyDiff={handleApplyAlertDiff}
            isProcessing={isProcessingChange}
          />
        )}

        {activeTab === 'deploy' && (
          <DeployPortalView
            project={currentProject}
            docs={docs}
            onOpenDoc={(docId) => {
              setActiveDocId(docId);
              setActiveTab('docs');
            }}
          />
        )}

        {activeTab === 'marketplace' && (
          <MarketplaceView
            templates={MARKETPLACE_TEMPLATES}
            onForkTemplate={async (template: MarketplaceTemplate) => {
              const newProj: ProjectProfile = {
                id: `proj_${Date.now().toString(36)}`,
                name: template.title,
                websiteUrl: `https://${template.title.toLowerCase().replace(/[^a-z0-9]/g, '')}.dev`,
                githubUrl: `https://github.com/templates/${template.id}`,
                projectType: 'SaaS',
                techStack: template.sampleStack.tech,
                authMethods: template.sampleStack.auth,
                paymentProviders: template.sampleStack.payments,
                analyticsProviders: ['PostHog Analytics'],
                aiModels: template.sampleStack.ai,
                dataCollected: ['Account credentials', 'Billing logs'],
                complianceScore: 88,
                activeVersion: 'v1.0',
                createdAt: new Date().toISOString(),
                lastUpdated: new Date().toISOString(),
                deployedUrls: {
                  privacy: `https://${template.id}.dev/privacy`,
                  terms: `https://${template.id}.dev/terms`,
                  security: `https://${template.id}.dev/security`,
                  apiDocs: `https://${template.id}.dev/docs/api`,
                  publicPortal: `https://${template.id}.dev/docs`,
                },
              };

              setProjectsList([newProj, ...projectsList]);
              setCurrentProject(newProj);
              await saveProject(newProj);
              setActiveTab('docs');
            }}
          />
        )}
      </main>

      {/* Supabase / OAuth Auth Modal */}
      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        onAuthSuccess={async () => {
          const u = await getCurrentUser();
          setUser(u);
        }}
      />
    </div>
  );
}
