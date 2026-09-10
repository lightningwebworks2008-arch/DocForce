// Server-side GitHub API inspection, OAuth flow, and AST analysis service
// Ensures tokens, secrets, and credentials are NEVER exposed to the client

interface GitHubApiOptions {
  token?: string;
}

// Runtime in-memory configuration cache (falls back to process.env)
let runtimeClientId = process.env.GITHUB_CLIENT_ID || '';
let runtimeClientSecret = process.env.GITHUB_CLIENT_SECRET || '';

export function getGitHubConfigStatus() {
  const clientId = runtimeClientId || process.env.GITHUB_CLIENT_ID || '';
  const clientSecret = runtimeClientSecret || process.env.GITHUB_CLIENT_SECRET || '';
  const isConfigured = Boolean(clientId.trim() && clientSecret.trim());

  const missing: string[] = [];
  if (!clientId.trim()) missing.push('GITHUB_CLIENT_ID');
  if (!clientSecret.trim()) missing.push('GITHUB_CLIENT_SECRET');

  return {
    configured: isConfigured,
    clientIdPrefix: clientId.trim() ? `${clientId.slice(0, 4)}...${clientId.slice(-3)}` : null,
    hasSecret: Boolean(clientSecret.trim()),
    appId: process.env.GITHUB_APP_ID || null,
    missing,
  };
}

export function setRuntimeGitHubConfig(clientId: string, clientSecret: string) {
  if (clientId) runtimeClientId = clientId.trim();
  if (clientSecret) runtimeClientSecret = clientSecret.trim();
  return getGitHubConfigStatus();
}

export function getEffectiveClientId(): string {
  return (runtimeClientId || process.env.GITHUB_CLIENT_ID || '').trim();
}

export function getEffectiveClientSecret(): string {
  return (runtimeClientSecret || process.env.GITHUB_CLIENT_SECRET || '').trim();
}

/**
 * Generates the GitHub OAuth authorization URL
 */
export function getGitHubOAuthUrl(redirectUri: string, state?: string): string {
  const clientId = getEffectiveClientId();
  if (!clientId) {
    throw new Error('GITHUB_CLIENT_ID is not configured. Please set it in .env or configure it via the settings modal.');
  }

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    scope: 'repo read:user user:email',
    state: state || Math.random().toString(36).substring(2, 15),
  });

  return `https://github.com/login/oauth/authorize?${params.toString()}`;
}

/**
 * Exchanges the temporary authorization code from GitHub callback for an access token
 */
export async function exchangeGitHubOAuthCode(code: string, redirectUri: string) {
  const clientId = getEffectiveClientId();
  const clientSecret = getEffectiveClientSecret();

  if (!clientId || !clientSecret) {
    throw new Error('GitHub OAuth credentials are not configured on the server. Both GITHUB_CLIENT_ID and GITHUB_CLIENT_SECRET are required.');
  }

  const response = await fetch('https://github.com/login/oauth/access_token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'User-Agent': 'DocForge-Legal-Doc-Engine/2.0',
    },
    body: JSON.stringify({
      client_id: clientId,
      client_secret: clientSecret,
      code,
      redirect_uri: redirectUri,
    }),
  });

  if (!response.ok) {
    throw new Error(`GitHub token exchange failed with status ${response.status} ${response.statusText}`);
  }

  const data = await response.json();
  if (data.error) {
    throw new Error(`GitHub OAuth error: ${data.error_description || data.error}`);
  }

  if (!data.access_token) {
    throw new Error('No access_token returned from GitHub authorization exchange');
  }

  return {
    accessToken: data.access_token as string,
    tokenType: (data.token_type as string) || 'bearer',
    scope: (data.scope as string) || '',
  };
}

/**
 * Fetches authenticated user profile from GitHub API
 */
export async function fetchGitHubUser(token: string) {
  const headers = getHeaders(token);

  const res = await fetch('https://api.github.com/user', { headers });
  if (res.status === 401) {
    throw new Error('GitHub authentication token is invalid or expired. Please re-authenticate.');
  }
  if (!res.ok) {
    throw new Error(`GitHub user request failed: ${res.status} ${res.statusText}`);
  }

  const user = await res.json();

  // Try to get primary verified email if user email is null/private
  let email = user.email;
  if (!email) {
    try {
      const emailsRes = await fetch('https://api.github.com/user/emails', { headers });
      if (emailsRes.ok) {
        const emails = await emailsRes.json();
        if (Array.isArray(emails)) {
          const primary = emails.find((e: any) => e.primary && e.verified) || emails[0];
          if (primary) email = primary.email;
        }
      }
    } catch {
      // ignore
    }
  }

  return {
    id: user.id as number,
    login: user.login as string,
    name: (user.name as string) || user.login,
    avatarUrl: (user.avatar_url as string) || '',
    email: (email as string) || null,
    htmlUrl: (user.html_url as string) || `https://github.com/${user.login}`,
    publicRepos: (user.public_repos as number) || 0,
    totalPrivateRepos: (user.total_private_repos as number) || 0,
    createdAt: user.created_at as string,
  };
}

/**
 * Revokes authorization grant on GitHub
 */
export async function disconnectGitHubOAuth(token?: string) {
  const clientId = getEffectiveClientId();
  const clientSecret = getEffectiveClientSecret();

  if (clientId && clientSecret && token) {
    try {
      const credentials = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');
      await fetch(`https://api.github.com/applications/${clientId}/grant`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Basic ${credentials}`,
          'Accept': 'application/vnd.github.v3+json',
          'Content-Type': 'application/json',
          'User-Agent': 'DocForge-Legal-Doc-Engine/2.0',
        },
        body: JSON.stringify({ access_token: token }),
      });
    } catch (e) {
      console.warn('Note: GitHub grant revocation error:', e);
    }
  }
  return { success: true };
}

function getHeaders(token?: string): Record<string, string> {
  const headers: Record<string, string> = {
    'Accept': 'application/vnd.github.v3+json',
    'User-Agent': 'DocForge-Legal-Doc-Engine/2.0',
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
}

/**
 * Fetches user repositories authorized for the authenticated token
 */
export async function fetchUserRepos(token?: string) {
  if (!token) {
    throw new Error('No GitHub access token provided. Please connect your GitHub account via OAuth.');
  }

  const headers = getHeaders(token);
  const response = await fetch('https://api.github.com/user/repos?per_page=100&sort=updated&affiliation=owner,collaborator,organization_member', {
    headers,
  });

  if (response.status === 401) {
    throw new Error('GitHub authorization expired or unauthorized. Please re-authenticate your GitHub account.');
  }
  if (response.status === 403 || response.status === 429) {
    const resetHeader = response.headers.get('x-ratelimit-reset');
    const resetTime = resetHeader ? new Date(parseInt(resetHeader) * 1000).toLocaleTimeString() : 'soon';
    throw new Error(`GitHub API rate limit reached. Resets at ${resetTime}. Authenticate with GitHub OAuth for 5,000 requests/hour.`);
  }
  if (!response.ok) {
    throw new Error(`GitHub API error: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();
  if (!Array.isArray(data)) {
    return [];
  }

  return data.map((repo: any) => ({
    id: repo.id,
    name: repo.name,
    fullName: repo.full_name,
    owner: {
      login: repo.owner?.login || '',
      avatarUrl: repo.owner?.avatar_url || '',
    },
    private: Boolean(repo.private),
    htmlUrl: repo.html_url,
    description: repo.description || null,
    defaultBranch: repo.default_branch || 'main',
    language: repo.language || null,
    stargazersCount: repo.stargazers_count || 0,
    forksCount: repo.forks_count || 0,
    openIssuesCount: repo.open_issues_count || 0,
    updatedAt: repo.updated_at,
  }));
}

/**
 * Performs deep repository AST, manifest, route, and configuration inspection
 * Strictly avoids reading secret values. Extracts structured metadata.
 */
export async function inspectRepository(owner: string, repo: string, branch?: string, token?: string) {
  const headers = getHeaders(token);

  // 1. Get repository metadata
  const repoRes = await fetch(`https://api.github.com/repos/${owner}/${repo}`, { headers });
  if (repoRes.status === 404) {
    throw new Error(`Repository "${owner}/${repo}" was not found or is private without authorized access.`);
  }
  if (repoRes.status === 401) {
    throw new Error('GitHub authorization expired. Please connect your GitHub account again.');
  }
  if (repoRes.status === 403 || repoRes.status === 429) {
    throw new Error('GitHub API rate limit reached. Please authenticate with GitHub OAuth or try again later.');
  }
  if (!repoRes.ok) {
    throw new Error(`Failed to fetch repository metadata (${repoRes.status} ${repoRes.statusText})`);
  }
  const repoMeta = await repoRes.json();
  const defaultBranch = branch || repoMeta.default_branch || 'main';

  // 2. Fetch README
  let readmeContent = '';
  try {
    const readmeRes = await fetch(`https://api.github.com/repos/${owner}/${repo}/readme?ref=${defaultBranch}`, { headers });
    if (readmeRes.ok) {
      const readmeData = await readmeRes.json();
      if (readmeData.content) {
        readmeContent = Buffer.from(readmeData.content, 'base64').toString('utf-8');
      }
    }
  } catch (e) {
    console.warn('Could not fetch README:', e);
  }

  // 3. Fetch Git Tree recursively
  let fileList: { path: string; type: string }[] = [];
  try {
    const treeRes = await fetch(
      `https://api.github.com/repos/${owner}/${repo}/git/trees/${defaultBranch}?recursive=1`,
      { headers }
    );
    if (treeRes.ok) {
      const treeData = await treeRes.json();
      if (Array.isArray(treeData.tree)) {
        fileList = treeData.tree;
      }
    }
  } catch (e) {
    console.warn('Could not fetch git tree:', e);
  }

  if (fileList.length === 0 && !readmeContent) {
    if (repoMeta.size === 0) {
      throw new Error(`Repository "${owner}/${repo}" is empty (no commits or branch files found).`);
    }
  }

  // 4. Safely inspect manifest & config files
  let packageJson: any = null;
  const packageFile = fileList.find((f) => f.path === 'package.json');
  if (packageFile) {
    try {
      const pRes = await fetch(`https://api.github.com/repos/${owner}/${repo}/contents/package.json?ref=${defaultBranch}`, { headers });
      if (pRes.ok) {
        const pData = await pRes.json();
        const rawPackageJsonText = Buffer.from(pData.content, 'base64').toString('utf-8');
        packageJson = JSON.parse(rawPackageJsonText);
      }
    } catch (e) {
      console.warn('Could not parse package.json:', e);
    }
  }

  // Check lockfiles
  const lockfiles = fileList
    .filter((f) =>
      ['package-lock.json', 'yarn.lock', 'pnpm-lock.yaml', 'bun.lock', 'bun.lockb', 'Cargo.lock', 'poetry.lock', 'composer.lock'].includes(f.path)
    )
    .map((f) => f.path);

  // Check language ecosystems
  const hasRequirements = fileList.some((f) => f.path === 'requirements.txt');
  const hasPyproject = fileList.some((f) => f.path === 'pyproject.toml');
  const isPython = hasRequirements || hasPyproject;
  const isRust = fileList.some((f) => f.path === 'Cargo.toml');
  const isGo = fileList.some((f) => f.path === 'go.mod');
  const isPhp = fileList.some((f) => f.path === 'composer.json');

  // Check framework configuration files
  const frameworkConfigFiles = fileList
    .filter((f) =>
      /^(vite\.config|next\.config|astro\.config|nuxt\.config|svelte\.config|remix\.config|angular\.json|tsconfig\.json|docker-compose\.ya?ml|Dockerfile)/.test(f.path)
    )
    .map((f) => f.path);

  // Check environment variables template (NEVER read secret values; only detect variable keys)
  // If .env or .env.local exists, simply report "Environment variables detected" without secret values.
  const hasEnvFiles = fileList.some((f) =>
    ['.env', '.env.local', '.env.production', '.env.development', '.env.staging'].includes(f.path)
  );

  const envTemplateCandidates = fileList.filter((f) =>
    ['.env.example', '.env.sample', '.env.template', '.env.local.example', '.env.dist'].includes(f.path)
  );

  const detectedEnvVarKeys: string[] = [];
  for (const envCandidate of envTemplateCandidates) {
    try {
      const eRes = await fetch(`https://api.github.com/repos/${owner}/${repo}/contents/${envCandidate.path}?ref=${defaultBranch}`, { headers });
      if (eRes.ok) {
        const eData = await eRes.json();
        const content = Buffer.from(eData.content, 'base64').toString('utf-8');
        const lines = content.split('\n');
        for (const line of lines) {
          const trimmed = line.trim();
          if (trimmed && !trimmed.startsWith('#') && trimmed.includes('=')) {
            const key = trimmed.split('=')[0].trim();
            if (key && !detectedEnvVarKeys.includes(key)) {
              detectedEnvVarKeys.push(key);
            }
          }
        }
      }
    } catch {
      // ignore
    }
  }

  // Detect API route structure from paths
  const detectedApiRoutes: string[] = [];
  fileList.forEach((f) => {
    if (
      f.path.startsWith('pages/api/') ||
      f.path.startsWith('app/api/') ||
      f.path.startsWith('src/pages/api/') ||
      f.path.startsWith('src/app/api/') ||
      f.path.startsWith('src/routes/') ||
      f.path.startsWith('routes/') ||
      f.path.startsWith('server/routes/') ||
      f.path.startsWith('controllers/')
    ) {
      if (!f.path.endsWith('.test.ts') && !f.path.endsWith('.spec.ts') && !f.path.endsWith('.md')) {
        let route = '/' + f.path
          .replace(/^(src\/)?(pages\/api|app\/api|routes|server\/routes|controllers)\/?/, 'api/')
          .replace(/\.(ts|js|tsx|jsx|py|go|php)$/, '')
          .replace(/\/route$/, '')
          .replace(/\/index$/, '');
        if (!detectedApiRoutes.includes(route)) {
          detectedApiRoutes.push(route);
        }
      }
    }
  });

  // Detect database configs
  const dbConfigs = fileList
    .filter((f) =>
      f.path.includes('prisma/schema.prisma') ||
      f.path.includes('drizzle.config') ||
      f.path.includes('supabase/migrations') ||
      f.path.includes('knexfile') ||
      f.path.includes('ormconfig') ||
      f.path.includes('models/')
    )
    .map((f) => f.path);

  // Combine safe text for pattern matching
  const allDependencies: Record<string, string> = {
    ...(packageJson?.dependencies || {}),
    ...(packageJson?.devDependencies || {}),
  };
  const depsKeys = Object.keys(allDependencies).map((k) => k.toLowerCase());
  const envKeysLower = detectedEnvVarKeys.map((k) => k.toLowerCase());
  const textCorpus = [
    repoMeta.description || '',
    readmeContent,
    depsKeys.join(' '),
    envKeysLower.join(' '),
  ].join(' ').toLowerCase();

  // 5. Categorize Detected Services (Classified as Confirmed, Likely, Needs confirmation)
  const detectedServices: Array<{
    id: string;
    category: 'auth' | 'payments' | 'analytics' | 'ai' | 'storage' | 'email' | 'database' | 'tracking';
    name: string;
    status: 'needs_confirmation' | 'confirmed' | 'rejected';
    confidence: 'high' | 'medium' | 'low';
    details: string;
    matchedLibrary?: string;
    requiresConfirmation: boolean;
  }> = [];

  // ===================== PAYMENTS =====================
  if (depsKeys.some((k) => k.includes('stripe')) || envKeysLower.some((k) => k.includes('stripe'))) {
    detectedServices.push({
      id: 'srv_stripe',
      category: 'payments',
      name: 'Stripe Payments',
      status: 'needs_confirmation',
      confidence: 'high',
      details: 'Detected Stripe SDK / configuration in dependencies. Requires PCI-DSS disclosures, 14-day refund policy, and billing data handling clause.',
      matchedLibrary: depsKeys.find((k) => k.includes('stripe')),
      requiresConfirmation: true,
    });
  }
  if (depsKeys.some((k) => k.includes('lemonsqueezy')) || textCorpus.includes('lemonsqueezy')) {
    detectedServices.push({
      id: 'srv_lemon',
      category: 'payments',
      name: 'LemonSqueezy',
      status: 'needs_confirmation',
      confidence: 'high',
      details: 'Detected Merchant of Record integration (LemonSqueezy) for digital checkout and tax compliance.',
      requiresConfirmation: true,
    });
  }
  if (depsKeys.some((k) => k.includes('paddle')) || textCorpus.includes('paddle')) {
    detectedServices.push({
      id: 'srv_paddle',
      category: 'payments',
      name: 'Paddle',
      status: 'needs_confirmation',
      confidence: 'high',
      details: 'Detected Paddle payment provider for software licensing.',
      requiresConfirmation: true,
    });
  }
  if (depsKeys.some((k) => k.includes('paypal') || k.includes('@paypal'))) {
    detectedServices.push({
      id: 'srv_paypal',
      category: 'payments',
      name: 'PayPal',
      status: 'needs_confirmation',
      confidence: 'high',
      details: 'Detected PayPal SDK for checkout payments.',
      requiresConfirmation: true,
    });
  }

  // ===================== AUTHENTICATION =====================
  if (depsKeys.some((k) => k.includes('supabase')) || envKeysLower.some((k) => k.includes('supabase'))) {
    detectedServices.push({
      id: 'srv_supabase_auth',
      category: 'auth',
      name: 'Supabase Auth & Session Store',
      status: 'confirmed',
      confidence: 'high',
      details: 'Detected Supabase authentication client with JWT session rotation and RLS authorization.',
      matchedLibrary: '@supabase/supabase-js',
      requiresConfirmation: false,
    });
  }
  if (depsKeys.some((k) => k.includes('firebase')) || envKeysLower.some((k) => k.includes('firebase'))) {
    detectedServices.push({
      id: 'srv_firebase_auth',
      category: 'auth',
      name: 'Firebase Auth',
      status: 'confirmed',
      confidence: 'high',
      details: 'Detected Firebase authentication SDK and user credentials manager.',
      matchedLibrary: 'firebase',
      requiresConfirmation: false,
    });
  }
  if (depsKeys.some((k) => k.includes('clerk')) || envKeysLower.some((k) => k.includes('clerk'))) {
    detectedServices.push({
      id: 'srv_clerk',
      category: 'auth',
      name: 'Clerk User Management',
      status: 'confirmed',
      confidence: 'high',
      details: 'Detected Clerk authentication widgets and directory.',
      matchedLibrary: '@clerk/clerk-react',
      requiresConfirmation: false,
    });
  }
  if (depsKeys.some((k) => k.includes('next-auth') || k.includes('@auth/core') || k.includes('@auth/nextjs'))) {
    detectedServices.push({
      id: 'srv_nextauth',
      category: 'auth',
      name: 'NextAuth.js / Auth.js',
      status: 'confirmed',
      confidence: 'high',
      details: 'Detected NextAuth authentication middleware and multi-provider credentials handler.',
      matchedLibrary: 'next-auth',
      requiresConfirmation: false,
    });
  }
  if (depsKeys.some((k) => k.includes('@auth0')) || textCorpus.includes('auth0')) {
    detectedServices.push({
      id: 'srv_auth0',
      category: 'auth',
      name: 'Auth0 Identity Platform',
      status: 'confirmed',
      confidence: 'high',
      details: 'Detected Auth0 universal login and identity federation.',
      requiresConfirmation: false,
    });
  }
  if (textCorpus.includes('google') && (textCorpus.includes('oauth') || envKeysLower.some((k) => k.includes('google')))) {
    detectedServices.push({
      id: 'srv_google_oauth',
      category: 'auth',
      name: 'Google OAuth Single-Sign-On',
      status: 'needs_confirmation',
      confidence: 'high',
      details: 'Detected Google OAuth client references. Triggers avatar handling and account deletion SLA.',
      requiresConfirmation: true,
    });
  }
  if (textCorpus.includes('github') && (textCorpus.includes('oauth') || envKeysLower.some((k) => k.includes('github_client')))) {
    detectedServices.push({
      id: 'srv_github_oauth',
      category: 'auth',
      name: 'GitHub OAuth Login',
      status: 'needs_confirmation',
      confidence: 'high',
      details: 'Detected GitHub OAuth authorization references.',
      requiresConfirmation: true,
    });
  }

  // ===================== ANALYTICS & TELEMETRY =====================
  if (depsKeys.some((k) => k.includes('posthog')) || envKeysLower.some((k) => k.includes('posthog'))) {
    detectedServices.push({
      id: 'srv_posthog',
      category: 'analytics',
      name: 'PostHog Product Analytics',
      status: 'needs_confirmation',
      confidence: 'high',
      details: 'Detected PostHog SDK. Triggers cookie banner requirements, session replay opt-out notice, and sub-processor disclosures.',
      matchedLibrary: 'posthog-js',
      requiresConfirmation: true,
    });
  }
  if (depsKeys.some((k) => k.includes('gtag') || k.includes('google-analytics') || k.includes('ga4')) || envKeysLower.some((k) => k.includes('ga4') || k.includes('google_analytics'))) {
    detectedServices.push({
      id: 'srv_ga4',
      category: 'analytics',
      name: 'Google Analytics (GA4)',
      status: 'needs_confirmation',
      confidence: 'high',
      details: 'Detected Google Analytics 4 tags. Requires cookie banner consent and IP pseudonymization disclosure.',
      requiresConfirmation: true,
    });
  }
  if (depsKeys.some((k) => k.includes('mixpanel')) || envKeysLower.some((k) => k.includes('mixpanel'))) {
    detectedServices.push({
      id: 'srv_mixpanel',
      category: 'analytics',
      name: 'Mixpanel Analytics',
      status: 'needs_confirmation',
      confidence: 'high',
      details: 'Detected Mixpanel product event tracking.',
      requiresConfirmation: true,
    });
  }
  if (depsKeys.some((k) => k.includes('sentry')) || envKeysLower.some((k) => k.includes('sentry'))) {
    detectedServices.push({
      id: 'srv_sentry',
      category: 'analytics',
      name: 'Sentry Error Monitoring',
      status: 'confirmed',
      confidence: 'high',
      details: 'Detected Sentry performance and runtime exception tracking.',
      matchedLibrary: '@sentry/react',
      requiresConfirmation: false,
    });
  }
  if (depsKeys.some((k) => k.includes('datadog'))) {
    detectedServices.push({
      id: 'srv_datadog',
      category: 'analytics',
      name: 'Datadog Observability',
      status: 'confirmed',
      confidence: 'high',
      details: 'Detected Datadog telemetry and APM logging.',
      requiresConfirmation: false,
    });
  }

  // ===================== AI & MACHINE LEARNING =====================
  if (depsKeys.some((k) => k.includes('@google/genai') || k.includes('@google/generative-ai')) || envKeysLower.some((k) => k.includes('gemini'))) {
    detectedServices.push({
      id: 'srv_gemini',
      category: 'ai',
      name: 'Google Gemini AI',
      status: 'needs_confirmation',
      confidence: 'high',
      details: 'Detected Google GenAI TypeScript SDK. Triggers EU AI Act Article 50 transparency disclosure and zero-training confirmation.',
      matchedLibrary: '@google/genai',
      requiresConfirmation: true,
    });
  }
  if (depsKeys.some((k) => k.includes('openai')) || envKeysLower.some((k) => k.includes('openai'))) {
    detectedServices.push({
      id: 'srv_openai',
      category: 'ai',
      name: 'OpenAI (GPT-4o API)',
      status: 'needs_confirmation',
      confidence: 'high',
      details: 'Detected OpenAI client library. Triggers automated prompt processing disclosures.',
      matchedLibrary: 'openai',
      requiresConfirmation: true,
    });
  }
  if (depsKeys.some((k) => k.includes('anthropic')) || envKeysLower.some((k) => k.includes('anthropic'))) {
    detectedServices.push({
      id: 'srv_anthropic',
      category: 'ai',
      name: 'Anthropic Claude API',
      status: 'needs_confirmation',
      confidence: 'high',
      details: 'Detected Anthropic Claude SDK for AI completions.',
      requiresConfirmation: true,
    });
  }

  // ===================== STORAGE & FILES =====================
  if (depsKeys.some((k) => k.includes('multer') || k.includes('uploadthing') || k.includes('@aws-sdk/client-s3')) || textCorpus.includes('s3') || textCorpus.includes('r2')) {
    detectedServices.push({
      id: 'srv_storage',
      category: 'storage',
      name: 'Object Storage & File Uploads (S3 / R2)',
      status: 'needs_confirmation',
      confidence: 'high',
      details: 'Detected file upload handler. Triggers retention window disclosures and accepted MIME-type policy.',
      requiresConfirmation: true,
    });
  }

  // ===================== DATABASE =====================
  if (depsKeys.some((k) => k.includes('prisma')) || dbConfigs.some((f) => f.includes('prisma'))) {
    detectedServices.push({
      id: 'srv_prisma',
      category: 'database',
      name: 'Prisma ORM',
      status: 'confirmed',
      confidence: 'high',
      details: 'Detected Prisma schema and migrations.',
      matchedLibrary: '@prisma/client',
      requiresConfirmation: false,
    });
  }
  if (depsKeys.some((k) => k.includes('drizzle')) || dbConfigs.some((f) => f.includes('drizzle'))) {
    detectedServices.push({
      id: 'srv_drizzle',
      category: 'database',
      name: 'Drizzle ORM',
      status: 'confirmed',
      confidence: 'high',
      details: 'Detected Drizzle ORM schema mapping and migration config.',
      matchedLibrary: 'drizzle-orm',
      requiresConfirmation: false,
    });
  }
  if (depsKeys.some((k) => k.includes('supabase')) || dbConfigs.some((f) => f.includes('supabase'))) {
    detectedServices.push({
      id: 'srv_supabase_db',
      category: 'database',
      name: 'Supabase PostgreSQL',
      status: 'confirmed',
      confidence: 'high',
      details: 'Detected managed Postgres database with Row Level Security (RLS) enforcement.',
      requiresConfirmation: false,
    });
  }

  // ===================== EMAIL PROVIDERS =====================
  if (depsKeys.some((k) => k.includes('resend')) || envKeysLower.some((k) => k.includes('resend'))) {
    detectedServices.push({
      id: 'srv_resend',
      category: 'email',
      name: 'Resend Email API',
      status: 'confirmed',
      confidence: 'high',
      details: 'Detected transactional email dispatch service for verification and billing receipts.',
      matchedLibrary: 'resend',
      requiresConfirmation: false,
    });
  }
  if (depsKeys.some((k) => k.includes('sendgrid')) || envKeysLower.some((k) => k.includes('sendgrid'))) {
    detectedServices.push({
      id: 'srv_sendgrid',
      category: 'email',
      name: 'SendGrid Email API',
      status: 'confirmed',
      confidence: 'high',
      details: 'Detected SendGrid email delivery API.',
      requiresConfirmation: false,
    });
  }

  // ===================== TRACKING / COOKIES =====================
  if (depsKeys.some((k) => k.includes('cookie') || k.includes('csurf'))) {
    detectedServices.push({
      id: 'srv_cookies',
      category: 'tracking',
      name: 'HTTP Cookie Management',
      status: 'confirmed',
      confidence: 'high',
      details: 'Detected session cookie parsers. Requires Cookie Policy with strict vs functional category breakdown.',
      requiresConfirmation: false,
    });
  }

  // 6. Infer Framework and Project Type
  let framework = 'Node.js';
  if (depsKeys.includes('next') || fileList.some((f) => f.path.startsWith('app/') || f.path.startsWith('pages/'))) {
    framework = 'Next.js';
  } else if (depsKeys.includes('react')) {
    framework = 'React (Vite)';
  } else if (depsKeys.includes('vue') || depsKeys.includes('nuxt')) {
    framework = 'Vue / Nuxt';
  } else if (depsKeys.includes('express')) {
    framework = 'Express.js';
  } else if (isPython) {
    framework = 'Python (FastAPI / Django)';
  } else if (isRust) {
    framework = 'Rust';
  } else if (isGo) {
    framework = 'Go';
  }

  let projectType: 'SaaS' | 'website' | 'mobile-app' | 'api' | 'marketplace' | 'ai-application' | 'other' = 'SaaS';
  if (detectedServices.some((s) => s.category === 'ai')) {
    projectType = 'ai-application';
  } else if (detectedServices.some((s) => s.category === 'payments')) {
    projectType = 'SaaS';
  } else if (detectedApiRoutes.length > 5 && !fileList.some((f) => f.path.includes('components/'))) {
    projectType = 'api';
  } else if (fileList.some((f) => f.path.includes('ios/') || f.path.includes('android/'))) {
    projectType = 'mobile-app';
  }

  // 7. Privacy-related Data Handling Classification
  // Explicitly marked as "needs_confirmation" unless actively confirmed by developer
  const dataHandling = [
    {
      category: 'accounts' as const,
      title: 'User Accounts & Credentials',
      status: detectedServices.some((s) => s.category === 'auth') ? ('needs_confirmation' as const) : ('not_applicable' as const),
      detectedEvidence: detectedServices.filter((s) => s.category === 'auth').map((s) => s.name).join(', ') || 'No auth library detected',
      userDescription: 'Potentially detected user account creation. Please confirm whether users register passwords, OAuth tokens, or SSO profiles.',
    },
    {
      category: 'profiles' as const,
      title: 'Names, Emails & Profile Information',
      status: 'needs_confirmation' as const,
      detectedEvidence: detectedServices.filter((s) => s.category === 'auth').map((s) => s.name).join(', ') || 'OAuth / User profile references',
      userDescription: 'Potentially detected collection of contact or profile data. Please confirm whether user names or avatars are stored.',
    },
    {
      category: 'uploads' as const,
      title: 'Uploaded Media & User-Generated Content',
      status: detectedServices.some((s) => s.category === 'storage') ? ('needs_confirmation' as const) : ('not_applicable' as const),
      detectedEvidence: detectedServices.filter((s) => s.category === 'storage').map((s) => s.name).join(', ') || 'No file upload SDK found',
      userDescription: 'Potentially detected file storage integration. Please confirm allowed MIME types and whether files are public or private.',
    },
    {
      category: 'payments' as const,
      title: 'Payment Processing & Billing History',
      status: detectedServices.some((s) => s.category === 'payments') ? ('needs_confirmation' as const) : ('not_applicable' as const),
      detectedEvidence: detectedServices.filter((s) => s.category === 'payments').map((s) => s.name).join(', ') || 'No payment processor found',
      userDescription: 'Potentially detected commercial billing integration. Please confirm whether credit card tokens or billing addresses are retained.',
    },
    {
      category: 'analytics' as const,
      title: 'Telemetry, Cookies & Device Analytics',
      status: detectedServices.some((s) => s.category === 'analytics' || s.category === 'tracking') ? ('needs_confirmation' as const) : ('not_applicable' as const),
      detectedEvidence: detectedServices.filter((s) => s.category === 'analytics' || s.category === 'tracking').map((s) => s.name).join(', ') || 'No analytics found',
      userDescription: 'Potentially detected usage tracking. Please confirm whether session recording or third-party cookies are activated.',
    },
    {
      category: 'ai' as const,
      title: 'AI Prompts, Completions & Inputs',
      status: detectedServices.some((s) => s.category === 'ai') ? ('needs_confirmation' as const) : ('not_applicable' as const),
      detectedEvidence: detectedServices.filter((s) => s.category === 'ai').map((s) => s.name).join(', ') || 'No generative models found',
      userDescription: 'Potentially detected AI model calls. Please confirm whether user input prompts are sent to external foundation models.',
    },
    {
      category: 'logs' as const,
      title: 'System Logs & IP Addresses',
      status: 'confirmed' as const,
      detectedEvidence: 'Standard server/network logs & cybersecurity defense',
      userDescription: 'IP addresses and request timestamps recorded for intrusion detection and server security.',
    },
  ];

  // 8. Generate dynamic review questions tailored to what was detected
  const generatedQuestions: Array<{
    id: string;
    triggerService: string;
    category: 'legal' | 'technical' | 'privacy';
    question: string;
    description: string;
    options: { label: string; value: string; description?: string }[];
    selectedAnswer: string;
    isConfirmed: boolean;
    affectedDocs: string[];
  }> = [];

  if (detectedServices.some((s) => s.category === 'payments')) {
    generatedQuestions.push({
      id: 'q_refund_sla',
      triggerService: 'Stripe Payments',
      category: 'legal',
      question: 'What is your customer refund and subscription cancellation policy?',
      description: 'Payment integration detected. Consumer protection laws mandate clear refund terms.',
      options: [
        { label: '14-Day Money-Back Guarantee', value: '14-day full refund guarantee upon request, no questions asked', description: 'Standard consumer-friendly refund window' },
        { label: '30-Day Money-Back Guarantee', value: '30-day money-back guarantee for all paid subscription tiers', description: 'Enterprise / premium standard' },
        { label: 'No Refunds / All Sales Final', value: 'All transactions are final; cancellations apply at end of current billing cycle', description: 'Immediate software access policy' },
      ],
      selectedAnswer: '14-day full refund guarantee upon request, no questions asked',
      isConfirmed: false,
      affectedDocs: ['privacy-policy', 'terms-of-service', 'refund-policy'],
    });
  }

  if (detectedServices.some((s) => s.category === 'auth')) {
    generatedQuestions.push({
      id: 'q_account_deletion',
      triggerService: 'User Authentication',
      category: 'privacy',
      question: 'What is your account deletion and data purge timeline?',
      description: 'GDPR Article 17 ("Right to Erasure") requires explicit timelines for deleting user accounts and database records.',
      options: [
        { label: 'Self-Service 1-Click Deletion (30-day purge)', value: 'Users can delete account directly in settings; full backup purge within 30 days', description: 'Standard GDPR-compliant SLA' },
        { label: 'Immediate Irrevocable Deletion', value: 'Immediate database purge upon confirmation with zero backup retention', description: 'Strict privacy mode' },
        { label: 'Support Request via Email (48-hour response)', value: 'Users submit email request; manually purged within 48 hours', description: 'Manual fulfillment' },
      ],
      selectedAnswer: 'Users can delete account directly in settings; full backup purge within 30 days',
      isConfirmed: false,
      affectedDocs: ['privacy-policy', 'terms-of-service', 'data-deletion'],
    });
  }

  if (detectedServices.some((s) => s.category === 'ai')) {
    generatedQuestions.push({
      id: 'q_ai_training',
      triggerService: 'Generative AI Providers',
      category: 'legal',
      question: 'Are user prompts or inputs used to train public foundation models?',
      description: 'Under the EU AI Act (Article 50), commercial applications must disclose whether user data trains AI models.',
      options: [
        { label: 'Zero-Training Guarantee (Enterprise Privacy)', value: 'User inputs are processed ephemerally and never used to train foundation models', description: 'Recommended for commercial SaaS' },
        { label: 'Opt-In Model Improvement Only', value: 'Aggregated, pseudonymized telemetry is used only with explicit user opt-in', description: 'Permissioned model tuning' },
      ],
      selectedAnswer: 'User inputs are processed ephemerally and never used to train foundation models',
      isConfirmed: false,
      affectedDocs: ['ai-disclosure', 'privacy-policy', 'terms-of-service'],
    });
  }

  if (detectedServices.some((s) => s.category === 'analytics')) {
    generatedQuestions.push({
      id: 'q_session_replay',
      triggerService: 'Analytics & Telemetry',
      category: 'privacy',
      question: 'Does your telemetry capture session recordings, and are sensitive inputs masked?',
      description: 'ePrivacy and wiretap regulations require disclosing session replays and keystroke masking.',
      options: [
        { label: 'Session Replay with Full PII Masking', value: 'Session replay enabled with strict masking on all passwords, emails, and input fields', description: 'Safe telemetry configuration' },
        { label: 'Aggregated Metrics Only (No session replay)', value: 'Only anonymous pageview counts and event metrics recorded; no screen replays', description: 'Lightweight tracking' },
      ],
      selectedAnswer: 'Session replay enabled with strict masking on all passwords, emails, and input fields',
      isConfirmed: false,
      affectedDocs: ['cookie-policy', 'privacy-policy'],
    });
  }

  // Summary
  const techStackList = Array.from(
    new Set([
      framework,
      repoMeta.language || 'TypeScript',
      ...detectedServices.map((s) => s.name),
    ])
  );

  const summary = `Analyzed repository ${owner}/${repo} (${defaultBranch}). Detected ${framework} architecture with ${detectedServices.length} integrated external services covering authentication (${detectedServices.filter((s) => s.category === 'auth').map((s) => s.name).join(', ') || 'None'}), billing (${detectedServices.filter((s) => s.category === 'payments').map((s) => s.name).join(', ') || 'None'}), and ${detectedServices.filter((s) => s.category === 'ai').map((s) => s.name).join(', ') || 'standard'} compute. Identified ${detectedApiRoutes.length} API endpoints and ${hasEnvFiles ? 'environment configuration detected' : 'clean manifest'}.`;

  return {
    repoMeta: {
      owner,
      repo,
      name: repoMeta.name,
      description: repoMeta.description,
      htmlUrl: repoMeta.html_url,
      defaultBranch,
      language: repoMeta.language,
      stargazersCount: repoMeta.stargazers_count,
      isPrivate: Boolean(repoMeta.private),
    },
    projectType,
    framework,
    primaryLanguage: repoMeta.language || 'TypeScript',
    techStack: techStackList,
    detectedServices,
    dataHandling,
    hasEnvFiles,
    detectedEnvVars: detectedEnvVarKeys,
    detectedApiRoutes,
    frameworkConfigFiles,
    dbConfigs,
    lockfiles,
    readmeSnippet: readmeContent.slice(0, 1000),
    questions: generatedQuestions,
    summary,
  };
}

/**
 * Compares a previous scan with a newly performed scan and returns a structured diff
 */
export function compareRepositoryScans(previousScan: any, currentAnalysis: any) {
  const prevServices: string[] = (previousScan?.detectedServices || []).map((s: any) => s.name.toLowerCase());
  const currentServices: string[] = currentAnalysis.detectedServices.map((s: any) => s.name.toLowerCase());

  const addedServices = currentAnalysis.detectedServices.filter(
    (s: any) => !prevServices.includes(s.name.toLowerCase())
  );
  const removedServices = (previousScan?.detectedServices || []).filter(
    (s: any) => !currentServices.includes(s.name.toLowerCase())
  );

  // Compare API routes
  const prevRoutes: string[] = previousScan?.detectedApiRoutes || [];
  const currentRoutes: string[] = currentAnalysis.detectedApiRoutes || [];
  const addedRoutes = currentRoutes.filter((r) => !prevRoutes.includes(r));
  const removedRoutes = prevRoutes.filter((r) => !currentRoutes.includes(r));

  // Compare Tech Stack
  const prevStack: string[] = (previousScan?.techStack || []).map((t: string) => t.toLowerCase());
  const currentStack: string[] = currentAnalysis.techStack.map((t: string) => t.toLowerCase());
  const addedStack = currentAnalysis.techStack.filter((t: string) => !prevStack.includes(t.toLowerCase()));

  const hasSignificantChanges =
    addedServices.length > 0 ||
    removedServices.length > 0 ||
    addedRoutes.length > 0 ||
    removedRoutes.length > 0 ||
    addedStack.length > 0;

  return {
    hasSignificantChanges,
    addedServices,
    removedServices,
    addedRoutes,
    removedRoutes,
    addedStack,
    summary: hasSignificantChanges
      ? `Potential documentation changes detected: ${addedServices.length} new services, ${removedServices.length} removed services, and ${addedRoutes.length} new API endpoints detected.`
      : 'Repository scan matches existing documentation baseline. No regulatory updates required.',
  };
}
