import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { ProjectProfile, DocumentItem, VersionRecord, UserProfile } from '../types';

const metaEnv = (import.meta as any).env || {};

// Read strictly from environment variables (No credentials stored in client localStorage)
export const supabaseUrl = metaEnv.VITE_SUPABASE_URL || '';
export const supabasePublishableKey = metaEnv.VITE_SUPABASE_PUBLISHABLE_KEY || '';

export const isSupabaseConfigured = Boolean(
  supabaseUrl &&
  supabasePublishableKey &&
  supabaseUrl.startsWith('http') &&
  !supabaseUrl.includes('placeholder')
);

export const supabase: SupabaseClient | null = isSupabaseConfigured
  ? createClient(supabaseUrl, supabasePublishableKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    })
  : null;

// Local fallback store keys (strictly for the active user's created items)
const STORAGE_PROJECTS_KEY = 'docforge_user_projects';
const STORAGE_DOCS_KEY = 'docforge_user_docs';
const STORAGE_VERSIONS_KEY = 'docforge_user_versions';
const STORAGE_USER_KEY = 'docforge_user_session';

// Purge legacy mock data from localStorage if present
if (typeof window !== 'undefined') {
  localStorage.removeItem('docforge_projects');
  localStorage.removeItem('docforge_docs');
  localStorage.removeItem('docforge_versions');
  localStorage.removeItem('docforge_questions');
  localStorage.removeItem('docforge_user');
  localStorage.removeItem('docforge_supabase_url');
  localStorage.removeItem('docforge_supabase_publishable_key');
}

/* =========================================================================
   AUTHENTICATION SERVICE
   ========================================================================= */

export function getGitHubSessionHeaders(): Record<string, string> {
  const sid = localStorage.getItem('docforge_gh_sid');
  return sid ? { 'x-github-session': sid } : {};
}

export async function signInWithGithub(): Promise<{ data: any; error: any }> {
  // First attempt: Popup authorization directly to avoid iframe "refused to connect"
  try {
    const res = await fetch('/api/github/oauth/url');
    if (res.ok) {
      const data = await res.json();
      if (data.url) {
        const width = 600;
        const height = 750;
        const left = window.screenX + (window.outerWidth - width) / 2;
        const top = window.screenY + (window.outerHeight - height) / 2;
        const popup = window.open(
          data.url,
          'github_oauth_popup',
          `width=${width},height=${height},left=${left},top=${top},toolbar=no,menubar=no,status=no`
        );

        if (popup) {
          return new Promise((resolve, reject) => {
            const handleMessage = (event: MessageEvent) => {
              if (event.data?.type === 'GITHUB_OAUTH_SUCCESS') {
                if (event.data.sid) {
                  localStorage.setItem('docforge_gh_sid', event.data.sid);
                }
                window.removeEventListener('message', handleMessage);
                window.dispatchEvent(new Event('docforge-auth-change'));
                resolve({ data: event.data, error: null });
              } else if (event.data?.type === 'GITHUB_OAUTH_ERROR') {
                window.removeEventListener('message', handleMessage);
                reject(new Error(event.data.error || 'GitHub authorization was cancelled or failed.'));
              }
            };
            window.addEventListener('message', handleMessage);
          });
        }
      }
    }
  } catch (popupErr) {
    console.warn('Backend OAuth popup initiation note:', popupErr);
  }

  if (supabase) {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'github',
      options: {
        scopes: 'repo read:user user:email',
        redirectTo: window.location.origin,
      },
    });
    if (error) throw error;
    return { data, error: null };
  } else {
    throw new Error('Please allow popup windows to connect GitHub, or provide a Personal Access Token.');
  }
}

export async function signInWithGoogle() {
  if (supabase) {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin,
      },
    });
    if (error) throw error;
    return data;
  } else {
    throw new Error('Google OAuth requires Supabase authentication credentials in container environment.');
  }
}

export async function signInWithPassword(email: string, password: string) {
  if (!email || !password) {
    throw new Error('Email and password are required.');
  }
  if (supabase) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) throw error;
    return data;
  } else {
    // Authenticated local dev session for testing when offline
    const sessionUser: UserProfile = {
      id: `usr_local_${btoa(email).replace(/[^a-zA-Z0-9]/g, '').slice(0, 12)}`,
      email,
      fullName: email.split('@')[0],
      provider: 'email',
    };
    localStorage.setItem(STORAGE_USER_KEY, JSON.stringify(sessionUser));
    window.dispatchEvent(new Event('docforge-auth-change'));
    return { user: sessionUser };
  }
}

export async function signUpWithPassword(email: string, password: string, fullName?: string) {
  if (!email || !password) {
    throw new Error('Email and password are required.');
  }
  if (supabase) {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
        },
      },
    });
    if (error) throw error;
    return data;
  } else {
    const sessionUser: UserProfile = {
      id: `usr_local_${btoa(email).replace(/[^a-zA-Z0-9]/g, '').slice(0, 12)}`,
      email,
      fullName: fullName || email.split('@')[0],
      provider: 'email',
    };
    localStorage.setItem(STORAGE_USER_KEY, JSON.stringify(sessionUser));
    window.dispatchEvent(new Event('docforge-auth-change'));
    return { user: sessionUser };
  }
}

export async function signOut() {
  if (supabase) {
    try {
      await supabase.auth.signOut();
    } catch (e) {
      console.warn('Supabase sign out notice:', e);
    }
  }
  try {
    await fetch('/api/github/disconnect', {
      method: 'POST',
      headers: { ...getGitHubSessionHeaders() },
    });
  } catch (e) {
    // Ignore error
  }
  localStorage.removeItem('docforge_gh_sid');
  localStorage.removeItem(STORAGE_USER_KEY);
  window.dispatchEvent(new Event('docforge-auth-change'));
}

export async function getCurrentUser(): Promise<UserProfile | null> {
  // Check Supabase session first
  if (supabase) {
    const { data } = await supabase.auth.getUser();
    if (data.user) {
      return {
        id: data.user.id,
        email: data.user.email || '',
        fullName: data.user.user_metadata?.full_name || data.user.email?.split('@')[0],
        avatarUrl: data.user.user_metadata?.avatar_url,
        githubUsername: data.user.user_metadata?.user_name || data.user.user_metadata?.preferred_username,
        provider: data.user.app_metadata?.provider as any,
      };
    }
  }

  // Check backend GitHub session
  try {
    const ghRes = await fetch('/api/github/status', {
      headers: { ...getGitHubSessionHeaders() },
    });
    if (ghRes.ok) {
      const ghData = await ghRes.json();
      if (ghData.connected && ghData.user) {
        return {
          id: `gh_${ghData.user.id}`,
          email: ghData.user.email || `${ghData.user.login}@github.com`,
          fullName: ghData.user.name || ghData.user.login,
          avatarUrl: ghData.user.avatarUrl,
          githubUsername: ghData.user.login,
          provider: 'github',
        };
      }
    }
  } catch (e) {
    // Network failure
  }

  // Check local session
  const local = localStorage.getItem(STORAGE_USER_KEY);
  return local ? JSON.parse(local) : null;
}

/* =========================================================================
   DATABASE CRUD OPERATIONS (Clean, unseeded user storage)
   ========================================================================= */

export async function fetchUserProjects(): Promise<ProjectProfile[]> {
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.warn('Supabase projects query:', error.message);
      } else if (data && data.length > 0) {
        return data.map((p) => ({
          id: p.id,
          userId: p.user_id,
          name: p.name,
          description: p.description,
          websiteUrl: p.website_url || '',
          githubUrl: p.repository_url,
          repoOwner: p.repo_owner,
          repoName: p.repo_name,
          defaultBranch: p.default_branch || 'main',
          isPrivate: p.is_private,
          projectType: p.project_type || 'SaaS',
          primaryLanguage: p.primary_language,
          framework: p.framework,
          techStack: p.tech_stack || [],
          authMethods: p.auth_methods || [],
          paymentProviders: p.payment_providers || [],
          analyticsProviders: p.analytics_providers || [],
          aiModels: p.ai_models || [],
          dataCollected: p.data_collected || [],
          complianceScore: p.compliance_score || 0,
          activeVersion: p.active_version || 'v1.0',
          createdAt: p.created_at,
          lastUpdated: p.updated_at,
          deployedUrls: {
            privacy: p.website_url ? `${p.website_url}/privacy` : undefined,
            terms: p.website_url ? `${p.website_url}/terms` : undefined,
            security: p.website_url ? `${p.website_url}/security` : undefined,
            apiDocs: p.website_url ? `${p.website_url}/docs/api` : undefined,
            publicPortal: p.website_url ? `${p.website_url}/docs` : undefined,
          },
        }));
      }
    } catch (e) {
      console.warn('Supabase fetch failed:', e);
    }
  }

  const stored = localStorage.getItem(STORAGE_PROJECTS_KEY);
  return stored ? JSON.parse(stored) : [];
}

export async function saveProject(project: ProjectProfile): Promise<ProjectProfile> {
  // Update local storage
  const existing = await fetchUserProjects();
  const index = existing.findIndex((p) => p.id === project.id);
  let updatedList: ProjectProfile[];
  if (index >= 0) {
    updatedList = [...existing];
    updatedList[index] = project;
  } else {
    updatedList = [project, ...existing];
  }
  localStorage.setItem(STORAGE_PROJECTS_KEY, JSON.stringify(updatedList));

  // Sync with Supabase if online
  if (supabase) {
    try {
      const user = await supabase.auth.getUser();
      if (user.data?.user) {
        await supabase.from('projects').upsert({
          id: project.id.startsWith('proj_') ? undefined : project.id,
          user_id: user.data.user.id,
          name: project.name,
          description: project.description || '',
          repository_url: project.githubUrl,
          repo_owner: project.repoOwner || '',
          repo_name: project.repoName || '',
          default_branch: project.defaultBranch || 'main',
          is_private: project.isPrivate || false,
          project_type: project.projectType,
          primary_language: project.primaryLanguage || '',
          framework: project.framework || '',
          website_url: project.websiteUrl,
          compliance_score: project.complianceScore,
          active_version: project.activeVersion,
          updated_at: new Date().toISOString(),
        });
      }
    } catch (err) {
      console.warn('Supabase save project error:', err);
    }
  }

  return project;
}

export async function fetchProjectDocuments(projectId: string): Promise<DocumentItem[]> {
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('documents')
        .select('*')
        .eq('project_id', projectId);

      if (error) {
        console.warn('Supabase documents error:', error.message);
      } else if (data && data.length > 0) {
        return data.map((d) => ({
          id: d.id,
          projectId: d.project_id,
          type: d.doc_type as any,
          title: d.title,
          category: d.category as any,
          version: d.current_version,
          content: d.content,
          lastModified: d.updated_at,
          status: d.status as any,
          wordCount: d.word_count || d.content.split(/\s+/).filter(Boolean).length,
        }));
      }
    } catch (e) {
      console.warn('Supabase docs fetch error:', e);
    }
  }

  const stored = localStorage.getItem(STORAGE_DOCS_KEY);
  const allDocs: DocumentItem[] = stored ? JSON.parse(stored) : [];
  return allDocs.filter((d) => d.projectId === projectId);
}

export async function saveDocument(doc: DocumentItem): Promise<void> {
  const stored = localStorage.getItem(STORAGE_DOCS_KEY);
  const allDocs: DocumentItem[] = stored ? JSON.parse(stored) : [];
  const index = allDocs.findIndex((d) => d.id === doc.id || (d.projectId === doc.projectId && d.type === doc.type));
  if (index >= 0) {
    allDocs[index] = doc;
  } else {
    allDocs.push(doc);
  }
  localStorage.setItem(STORAGE_DOCS_KEY, JSON.stringify(allDocs));

  if (supabase) {
    try {
      const user = await supabase.auth.getUser();
      if (user.data?.user) {
        await supabase.from('documents').upsert({
          project_id: doc.projectId,
          user_id: user.data.user.id,
          doc_type: doc.type,
          title: doc.title,
          category: doc.category,
          current_version: doc.version,
          content: doc.content,
          status: doc.status,
          word_count: doc.wordCount,
          updated_at: new Date().toISOString(),
        }, {
          onConflict: 'project_id,doc_type',
        });
      }
    } catch (err) {
      console.warn('Supabase save doc error:', err);
    }
  }
}

export async function fetchDocumentVersions(projectId: string): Promise<VersionRecord[]> {
  const stored = localStorage.getItem(STORAGE_VERSIONS_KEY);
  const versions: VersionRecord[] = stored ? JSON.parse(stored) : [];
  return versions.filter((v) => v.projectId === projectId);
}

export async function saveDocumentVersion(record: VersionRecord): Promise<void> {
  const stored = localStorage.getItem(STORAGE_VERSIONS_KEY);
  const versions: VersionRecord[] = stored ? JSON.parse(stored) : [];
  localStorage.setItem(STORAGE_VERSIONS_KEY, JSON.stringify([record, ...versions]));

  if (supabase) {
    try {
      const user = await supabase.auth.getUser();
      if (user.data?.user) {
        await supabase.from('document_versions').insert({
          project_id: record.projectId,
          user_id: user.data.user.id,
          version: record.version,
          content: JSON.stringify(record.docsSnapshot),
          commit_sha: record.commitSha,
          commit_message: record.commitMessage,
          changelog_summary: record.changesSummary,
          created_by: record.author,
          created_at: record.timestamp,
        });
      }
    } catch (err) {
      console.warn('Supabase save version error:', err);
    }
  }
}
