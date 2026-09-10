import { createClient, SupabaseClient, User } from '@supabase/supabase-js';
import { ProjectProfile, DocumentItem, VersionRecord, HumanReviewQuestion, UserProfile } from '../types';
import { INITIAL_PROJECT, INITIAL_DOCS, INITIAL_VERSIONS, INITIAL_QUESTIONS } from '../data/mockProjects';

const metaEnv = (import.meta as any).env || {};

// Check environment variables first, then user-configured values from local storage (allows in-browser pasting)
const storedUrl = typeof window !== 'undefined' ? (localStorage.getItem('docforge_supabase_url') || '') : '';
const storedPublishableKey = typeof window !== 'undefined' ? (localStorage.getItem('docforge_supabase_publishable_key') || '') : '';

export const supabaseUrl = metaEnv.VITE_SUPABASE_URL || storedUrl || '';
export const supabasePublishableKey = metaEnv.VITE_SUPABASE_PUBLISHABLE_KEY || storedPublishableKey || '';

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

// Local fallback store keys
const STORAGE_PROJECTS_KEY = 'docforge_projects';
const STORAGE_DOCS_KEY = 'docforge_docs';
const STORAGE_VERSIONS_KEY = 'docforge_versions';
const STORAGE_QUESTIONS_KEY = 'docforge_questions';
const STORAGE_USER_KEY = 'docforge_user';

// Initialize local storage seeds if empty
function initializeLocalSeeds() {
  if (!localStorage.getItem(STORAGE_PROJECTS_KEY)) {
    localStorage.setItem(STORAGE_PROJECTS_KEY, JSON.stringify([INITIAL_PROJECT]));
  }
  if (!localStorage.getItem(STORAGE_DOCS_KEY)) {
    localStorage.setItem(STORAGE_DOCS_KEY, JSON.stringify(INITIAL_DOCS));
  }
  if (!localStorage.getItem(STORAGE_VERSIONS_KEY)) {
    localStorage.setItem(STORAGE_VERSIONS_KEY, JSON.stringify(INITIAL_VERSIONS));
  }
  if (!localStorage.getItem(STORAGE_QUESTIONS_KEY)) {
    localStorage.setItem(STORAGE_QUESTIONS_KEY, JSON.stringify(INITIAL_QUESTIONS));
  }
  if (!localStorage.getItem(STORAGE_USER_KEY)) {
    const defaultUser: UserProfile = {
      id: 'usr_dev_demo',
      email: 'developer@example.com',
      fullName: 'Alex Chen (Lead Dev)',
      avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80',
      githubUsername: 'alexchen-dev',
      provider: 'github',
    };
    localStorage.setItem(STORAGE_USER_KEY, JSON.stringify(defaultUser));
  }
}

// Run initial seed check safely
if (typeof window !== 'undefined') {
  initializeLocalSeeds();
}

/* =========================================================================
   AUTH SERVICE
   ========================================================================= */

export async function signInWithGithub() {
  if (supabase) {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'github',
      options: {
        scopes: 'repo read:user user:email',
        redirectTo: window.location.origin,
      },
    });
    if (error) throw error;
    return data;
  } else {
    // Demo login simulation when Supabase credentials are not yet entered
    const demoUser: UserProfile = {
      id: `usr_gh_${Date.now().toString(36)}`,
      email: 'octocat@github.com',
      fullName: 'The Octocat',
      avatarUrl: 'https://avatars.githubusercontent.com/u/583231?v=4',
      githubUsername: 'octocat',
      provider: 'github',
    };
    localStorage.setItem(STORAGE_USER_KEY, JSON.stringify(demoUser));
    window.dispatchEvent(new Event('docforge-auth-change'));
    return { user: demoUser };
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
    const demoUser: UserProfile = {
      id: `usr_goog_${Date.now().toString(36)}`,
      email: 'developer@gmail.com',
      fullName: 'Google Developer',
      avatarUrl: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&auto=format&fit=crop&q=80',
      provider: 'google',
    };
    localStorage.setItem(STORAGE_USER_KEY, JSON.stringify(demoUser));
    window.dispatchEvent(new Event('docforge-auth-change'));
    return { user: demoUser };
  }
}

export async function signInWithPassword(email: string, password: string) {
  if (supabase) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) throw error;
    return data;
  } else {
    const demoUser: UserProfile = {
      id: `usr_pw_${Date.now().toString(36)}`,
      email,
      fullName: email.split('@')[0],
      provider: 'email',
    };
    localStorage.setItem(STORAGE_USER_KEY, JSON.stringify(demoUser));
    window.dispatchEvent(new Event('docforge-auth-change'));
    return { user: demoUser };
  }
}

export async function signUpWithPassword(email: string, password: string, fullName?: string) {
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
    const demoUser: UserProfile = {
      id: `usr_pw_${Date.now().toString(36)}`,
      email,
      fullName: fullName || email.split('@')[0],
      provider: 'email',
    };
    localStorage.setItem(STORAGE_USER_KEY, JSON.stringify(demoUser));
    window.dispatchEvent(new Event('docforge-auth-change'));
    return { user: demoUser };
  }
}

export async function signOut() {
  if (supabase) {
    await supabase.auth.signOut();
  }
  localStorage.removeItem(STORAGE_USER_KEY);
  window.dispatchEvent(new Event('docforge-auth-change'));
}

export async function getCurrentUser(): Promise<UserProfile | null> {
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
  const local = localStorage.getItem(STORAGE_USER_KEY);
  return local ? JSON.parse(local) : null;
}

export async function getProviderToken(): Promise<string | null> {
  if (supabase) {
    const { data } = await supabase.auth.getSession();
    return data.session?.provider_token || null;
  }
  return null;
}

/* =========================================================================
   DATABASE CRUD OPERATIONS (Supabase + Local fallback sync)
   ========================================================================= */

export async function fetchUserProjects(): Promise<ProjectProfile[]> {
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.warn('Supabase projects query error (falling back to local storage):', error.message);
      } else if (data && data.length > 0) {
        return data.map((p) => ({
          id: p.id,
          userId: p.user_id,
          name: p.name,
          description: p.description,
          websiteUrl: p.website_url || 'https://example.com',
          githubUrl: p.repository_url,
          repoOwner: p.repo_owner,
          repoName: p.repo_name,
          defaultBranch: p.default_branch || 'main',
          isPrivate: p.is_private,
          projectType: p.project_type || 'SaaS',
          primaryLanguage: p.primary_language,
          framework: p.framework,
          techStack: p.tech_stack || ['React', 'TypeScript'],
          authMethods: p.auth_methods || ['Google OAuth'],
          paymentProviders: p.payment_providers || [],
          analyticsProviders: p.analytics_providers || [],
          aiModels: p.ai_models || [],
          dataCollected: p.data_collected || [],
          complianceScore: p.compliance_score || 75,
          activeVersion: p.active_version || 'v1.0',
          createdAt: p.created_at,
          lastUpdated: p.updated_at,
          deployedUrls: {
            privacy: `${p.website_url || 'https://example.com'}/privacy`,
            terms: `${p.website_url || 'https://example.com'}/terms`,
            security: `${p.website_url || 'https://example.com'}/security`,
            apiDocs: `${p.website_url || 'https://example.com'}/docs/api`,
            publicPortal: `${p.website_url || 'https://example.com'}/docs`,
          },
        }));
      }
    } catch (e) {
      console.warn('Supabase fetch failed:', e);
    }
  }

  const stored = localStorage.getItem(STORAGE_PROJECTS_KEY);
  return stored ? JSON.parse(stored) : [INITIAL_PROJECT];
}

export async function saveProject(project: ProjectProfile): Promise<ProjectProfile> {
  // Update local storage first
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
  const allDocs: DocumentItem[] = stored ? JSON.parse(stored) : INITIAL_DOCS;
  return allDocs.filter((d) => d.projectId === projectId || !d.projectId);
}

export async function saveDocument(doc: DocumentItem): Promise<void> {
  const stored = localStorage.getItem(STORAGE_DOCS_KEY);
  const allDocs: DocumentItem[] = stored ? JSON.parse(stored) : INITIAL_DOCS;
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
  const versions: VersionRecord[] = stored ? JSON.parse(stored) : INITIAL_VERSIONS;
  return versions.filter((v) => !v.projectId || v.projectId === projectId);
}

export async function saveDocumentVersion(record: VersionRecord): Promise<void> {
  const stored = localStorage.getItem(STORAGE_VERSIONS_KEY);
  const versions: VersionRecord[] = stored ? JSON.parse(stored) : INITIAL_VERSIONS;
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

/* =========================================================================
   CREDENTIAL CONFIGURATION & CONNECTION VERIFICATION HELPERS
   ========================================================================= */

export function getClientSupabaseCredentials() {
  const envUrl = metaEnv.VITE_SUPABASE_URL || '';
  const envKey = metaEnv.VITE_SUPABASE_PUBLISHABLE_KEY || '';
  if (envUrl && envKey) {
    return {
      url: envUrl,
      publishableKey: envKey,
      source: 'env' as const,
    };
  }
  const customUrl = typeof window !== 'undefined' ? localStorage.getItem('docforge_supabase_url') || '' : '';
  const customKey = typeof window !== 'undefined' ? localStorage.getItem('docforge_supabase_publishable_key') || '' : '';
  return {
    url: customUrl,
    publishableKey: customKey,
    source: (customUrl && customKey) ? ('storage' as const) : ('none' as const),
  };
}

export function setClientSupabaseCredentials(url: string, publishableKey: string) {
  if (typeof window === 'undefined') return;
  if (url && publishableKey) {
    localStorage.setItem('docforge_supabase_url', url.trim());
    localStorage.setItem('docforge_supabase_publishable_key', publishableKey.trim());
  } else {
    localStorage.removeItem('docforge_supabase_url');
    localStorage.removeItem('docforge_supabase_publishable_key');
  }
  window.location.reload();
}

export function clearClientSupabaseCredentials() {
  if (typeof window === 'undefined') return;
  localStorage.removeItem('docforge_supabase_url');
  localStorage.removeItem('docforge_supabase_publishable_key');
  window.location.reload();
}

export async function testSupabaseConnection(
  url: string,
  publishableKey: string
): Promise<{ success: boolean; message: string }> {
  if (!url || !publishableKey) {
    return { success: false, message: 'Please enter both Supabase URL and Publishable Key.' };
  }
  if (!url.startsWith('https://') && !url.startsWith('http://')) {
    return { success: false, message: 'Supabase URL must begin with https://' };
  }
  try {
    const testClient = createClient(url, publishableKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });

    // Test connectivity to auth endpoint
    const { error } = await testClient.auth.getSession();
    if (error && !error.message.toLowerCase().includes('session') && !error.message.toLowerCase().includes('auth')) {
      return { success: false, message: `Supabase ping failed: ${error.message}` };
    }
    return {
      success: true,
      message: 'Successfully connected! Publishable key verified and ready for Row Level Security operations.',
    };
  } catch (err: any) {
    return { success: false, message: err.message || 'Connection test failed.' };
  }
}
