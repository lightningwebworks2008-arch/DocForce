-- DocForge: Automated Legal, Technical, and Regulatory Documentation Platform
-- Supabase PostgreSQL Schema with Row Level Security (RLS)

-- 1. Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Profiles Table (Synced with auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  github_username TEXT,
  github_user_id TEXT,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. GitHub Connections Table (Stores OAuth scope and authorization status)
CREATE TABLE IF NOT EXISTS public.github_connections (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  github_user_id TEXT NOT NULL,
  username TEXT NOT NULL,
  scope TEXT DEFAULT 'repo,read:user',
  token_type TEXT DEFAULT 'bearer',
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
  CONSTRAINT unique_user_github UNIQUE(user_id, github_user_id)
);

-- 4. Projects Table
CREATE TABLE IF NOT EXISTS public.projects (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  repository_url TEXT NOT NULL,
  repo_owner TEXT,
  repo_name TEXT,
  is_private BOOLEAN DEFAULT false,
  default_branch TEXT DEFAULT 'main',
  project_type TEXT DEFAULT 'SaaS',
  primary_language TEXT,
  framework TEXT,
  website_url TEXT,
  compliance_score INTEGER DEFAULT 75,
  active_version TEXT DEFAULT 'v1.0',
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 5. Repository Scans Table
CREATE TABLE IF NOT EXISTS public.repository_scans (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  commit_sha TEXT,
  branch TEXT,
  tech_stack JSONB DEFAULT '[]'::jsonb,
  detected_services JSONB DEFAULT '[]'::jsonb,
  detected_data_handling JSONB DEFAULT '{}'::jsonb,
  api_routes JSONB DEFAULT '[]'::jsonb,
  env_variables_detected JSONB DEFAULT '[]'::jsonb,
  summary TEXT,
  scan_status TEXT DEFAULT 'completed',
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 6. Detected Services Table
CREATE TABLE IF NOT EXISTS public.detected_services (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  category TEXT NOT NULL, -- 'auth', 'payments', 'analytics', 'ai', 'storage', 'email', 'database', 'tracking'
  name TEXT NOT NULL,
  status TEXT DEFAULT 'needs_confirmation', -- 'needs_confirmation', 'confirmed', 'rejected'
  confidence TEXT DEFAULT 'high', -- 'high', 'medium', 'low'
  details TEXT,
  matched_library TEXT,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 7. Project Questions Table
CREATE TABLE IF NOT EXISTS public.project_questions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  trigger_service TEXT,
  category TEXT NOT NULL, -- 'privacy', 'legal', 'technical'
  question TEXT NOT NULL,
  description TEXT,
  options JSONB DEFAULT '[]'::jsonb,
  selected_answer TEXT,
  is_confirmed BOOLEAN DEFAULT false,
  affected_docs JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 8. Documents Table
CREATE TABLE IF NOT EXISTS public.documents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  doc_type TEXT NOT NULL,
  title TEXT NOT NULL,
  category TEXT NOT NULL, -- 'technical', 'legal', 'business'
  current_version TEXT DEFAULT 'v1.0',
  content TEXT NOT NULL,
  status TEXT DEFAULT 'draft', -- 'draft', 'reviewed', 'published'
  word_count INTEGER DEFAULT 0,
  last_generated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
  CONSTRAINT unique_project_doc UNIQUE(project_id, doc_type)
);

-- 9. Document Versions Table
CREATE TABLE IF NOT EXISTS public.document_versions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  document_id UUID NOT NULL REFERENCES public.documents(id) ON DELETE CASCADE,
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  version TEXT NOT NULL,
  content TEXT NOT NULL,
  commit_sha TEXT,
  commit_message TEXT,
  changelog_summary TEXT,
  source_scan_id UUID REFERENCES public.repository_scans(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
  created_by TEXT
);

-- 10. Enable Row Level Security (RLS) on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.github_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.repository_scans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.detected_services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.document_versions ENABLE ROW LEVEL SECURITY;

-- 11. Row Level Security Policies (Ensuring users only access their own data)

-- Profiles
CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- GitHub Connections
CREATE POLICY "Users can manage own github connections" ON public.github_connections
  FOR ALL USING (auth.uid() = user_id);

-- Projects
CREATE POLICY "Users can manage own projects" ON public.projects
  FOR ALL USING (auth.uid() = user_id);

-- Repository Scans
CREATE POLICY "Users can manage own repository scans" ON public.repository_scans
  FOR ALL USING (auth.uid() = user_id);

-- Detected Services
CREATE POLICY "Users can manage own detected services" ON public.detected_services
  FOR ALL USING (auth.uid() = user_id);

-- Project Questions
CREATE POLICY "Users can manage own project questions" ON public.project_questions
  FOR ALL USING (auth.uid() = user_id);

-- Documents
CREATE POLICY "Users can manage own documents" ON public.documents
  FOR ALL USING (auth.uid() = user_id);

-- Document Versions
CREATE POLICY "Users can manage own document versions" ON public.document_versions
  FOR ALL USING (auth.uid() = user_id);

-- 12. Trigger for Profile Creation on Signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, avatar_url, github_username, github_user_id)
  VALUES (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
    coalesce(new.raw_user_meta_data->>'avatar_url', new.raw_user_meta_data->>'picture', ''),
    coalesce(new.raw_user_meta_data->>'user_name', new.raw_user_meta_data->>'preferred_username', ''),
    coalesce(new.raw_user_meta_data->>'provider_id', '')
  )
  ON CONFLICT (id) DO UPDATE
  SET
    email = excluded.email,
    full_name = coalesce(excluded.full_name, profiles.full_name),
    avatar_url = coalesce(excluded.avatar_url, profiles.avatar_url),
    github_username = coalesce(excluded.github_username, profiles.github_username),
    updated_at = now();
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT OR UPDATE ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
