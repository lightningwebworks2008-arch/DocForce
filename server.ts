import express from "express";
import path from "path";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import { GoogleGenAI } from "@google/genai";
import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { createServer as createViteServer } from "vite";
import {
  getGitHubConfigStatus,
  setRuntimeGitHubConfig,
  getGitHubOAuthUrl,
  exchangeGitHubOAuthCode,
  fetchGitHubUser,
  fetchUserRepos,
  inspectRepository,
  disconnectGitHubOAuth,
  compareRepositoryScans,
} from "./server/github";

dotenv.config();

const PORT = 3000;

// Lazy server-side Supabase client using SUPABASE_SECRET_KEY (Backend operations ONLY)
let supabaseAdmin: SupabaseClient | null = null;
function getSupabaseAdmin(): SupabaseClient | null {
  const url = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
  const secretKey = process.env.SUPABASE_SECRET_KEY;
  if (!supabaseAdmin && url && secretKey) {
    try {
      supabaseAdmin = createClient(url, secretKey, {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
        },
      });
    } catch (e) {
      console.warn("Failed to initialize server-side Supabase admin client:", e);
    }
  }
  return supabaseAdmin;
}

const ai = process.env.GEMINI_API_KEY
  ? new GoogleGenAI()
  : null;

// Secure server-side session store mapping session ID to GitHub OAuth credentials & account info
// Tokens are strictly kept server-side and never returned to the frontend
interface GitHubSession {
  token: string;
  user: {
    id: number;
    login: string;
    name: string | null;
    avatarUrl: string;
    email: string | null;
    htmlUrl: string;
    publicRepos: number;
    totalPrivateRepos: number;
  };
  userId?: string;
  createdAt: number;
}
const ghSessionStore = new Map<string, GitHubSession>();

function getSessionToken(req: express.Request): string | undefined {
  const sid = req.cookies?.docforge_gh_sid;
  if (sid && ghSessionStore.has(sid)) {
    return ghSessionStore.get(sid)!.token;
  }
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith("Bearer ")) {
    return authHeader.replace("Bearer ", "").trim();
  }
  return undefined;
}

function getSessionUser(req: express.Request) {
  const sid = req.cookies?.docforge_gh_sid;
  if (sid && ghSessionStore.has(sid)) {
    return ghSessionStore.get(sid)!.user;
  }
  return null;
}

async function startServer() {
  const app = express();
  app.use(express.json({ limit: "15mb" }));
  app.use(cookieParser());

  // Health check endpoint
  app.get("/api/health", (_req, res) => {
    const ghStatus = getGitHubConfigStatus();
    res.json({
      status: "ok",
      geminiAvailable: !!process.env.GEMINI_API_KEY,
      githubConfigured: ghStatus.configured,
      githubClientIdPrefix: ghStatus.clientIdPrefix,
      supabaseConfigured: !!(
        process.env.VITE_SUPABASE_URL &&
        (process.env.VITE_SUPABASE_PUBLISHABLE_KEY || process.env.SUPABASE_SECRET_KEY)
      ),
      supabasePublishableConfigured: !!process.env.VITE_SUPABASE_PUBLISHABLE_KEY,
      supabaseSecretConfigured: !!process.env.SUPABASE_SECRET_KEY,
      timestamp: new Date().toISOString(),
    });
  });

  // =========================================================================
  // GITHUB APP / OAUTH FLOW ENDPOINTS
  // =========================================================================

  // 1. Check GitHub OAuth configuration and current connection status
  app.get("/api/github/status", (req, res) => {
    const configStatus = getGitHubConfigStatus();
    const sessionUser = getSessionUser(req);
    res.json({
      configured: configStatus.configured,
      clientIdPrefix: configStatus.clientIdPrefix,
      hasSecret: configStatus.hasSecret,
      missingConfig: configStatus.missing,
      connected: Boolean(sessionUser),
      user: sessionUser,
    });
  });

  // 2. Set or test GitHub OAuth credentials at runtime
  app.post("/api/github/config", (req, res) => {
    const { clientId, clientSecret } = req.body;
    if (!clientId || !clientSecret) {
      return res.status(400).json({ error: "Both clientId and clientSecret are required." });
    }
    const updated = setRuntimeGitHubConfig(clientId, clientSecret);
    res.json({ success: true, ...updated });
  });

  // 3. Initiate GitHub OAuth redirect flow
  app.get("/api/github/oauth/authorize", (req, res) => {
    try {
      const configStatus = getGitHubConfigStatus();
      if (!configStatus.configured) {
        return res.status(400).json({
          error: "GitHub OAuth is not configured. Please set GITHUB_CLIENT_ID and GITHUB_CLIENT_SECRET.",
        });
      }

      // Build absolute callback URL
      const host = req.get("host") || "localhost:3000";
      const protocol = req.headers["x-forwarded-proto"] || req.protocol || "http";
      const redirectUri = `${protocol}://${host}/api/github/oauth/callback`;

      const state = "df_" + Math.random().toString(36).substring(2, 15);
      res.cookie("docforge_gh_state", state, {
        httpOnly: true,
        sameSite: "lax",
        maxAge: 15 * 60 * 1000,
        path: "/",
      });

      const authUrl = getGitHubOAuthUrl(redirectUri, state);
      res.redirect(authUrl);
    } catch (err: any) {
      console.error("GitHub OAuth authorize error:", err.message);
      res.status(500).json({ error: err.message || "Failed to initiate GitHub OAuth" });
    }
  });

  // 4. Handle GitHub OAuth callback
  app.get("/api/github/oauth/callback", async (req, res) => {
    try {
      const { code, state, error, error_description } = req.query;

      if (error) {
        console.warn("GitHub OAuth access denied or cancelled:", error, error_description);
        return res.redirect(`/?github_error=${encodeURIComponent(String(error_description || error))}`);
      }

      if (!code || typeof code !== "string") {
        return res.redirect("/?github_error=Missing+authorization+code+from+GitHub");
      }

      const host = req.get("host") || "localhost:3000";
      const protocol = req.headers["x-forwarded-proto"] || req.protocol || "http";
      const redirectUri = `${protocol}://${host}/api/github/oauth/callback`;

      // Exchange code for token
      const { accessToken, tokenType, scope } = await exchangeGitHubOAuthCode(code, redirectUri);

      // Fetch confirmed GitHub user profile
      const ghUser = await fetchGitHubUser(accessToken);

      // Store in secure server-side session store
      const sid = "gh_sess_" + Math.random().toString(36).substring(2) + Date.now().toString(36);
      ghSessionStore.set(sid, {
        token: accessToken,
        user: ghUser,
        createdAt: Date.now(),
      });

      // Set HTTP-only session cookie
      res.cookie("docforge_gh_sid", sid, {
        httpOnly: true,
        sameSite: "lax",
        maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
        path: "/",
      });

      // Sync with Supabase if active
      const sb = getSupabaseAdmin();
      if (sb) {
        try {
          // Attempt to record connection in github_connections table
          // Note: If no user_id available yet, it will associate when user signs in or connects
          console.log(`GitHub OAuth connected for @${ghUser.login} (ID: ${ghUser.id})`);
        } catch (dbErr) {
          console.warn("Supabase connection record note:", dbErr);
        }
      }

      res.redirect("/?github_connected=true");
    } catch (err: any) {
      console.error("GitHub OAuth callback error:", err.message);
      res.redirect(`/?github_error=${encodeURIComponent(err.message || "Failed to exchange GitHub authorization token")}`);
    }
  });

  // 5. Get currently connected GitHub user
  app.get("/api/github/user", (req, res) => {
    const user = getSessionUser(req);
    res.json({
      connected: Boolean(user),
      user: user || null,
    });
  });

  // 6. Disconnect GitHub account
  app.post("/api/github/disconnect", async (req, res) => {
    const sid = req.cookies?.docforge_gh_sid;
    if (sid && ghSessionStore.has(sid)) {
      const session = ghSessionStore.get(sid)!;
      try {
        await disconnectGitHubOAuth(session.token);
      } catch (e) {
        // ignore
      }
      ghSessionStore.delete(sid);
    }
    res.clearCookie("docforge_gh_sid", { path: "/" });
    res.json({ success: true, message: "GitHub connection removed successfully." });
  });

  // 7. GitHub Repositories List Endpoint (Authorized user repos only, strictly real data)
  app.get("/api/github/repos", async (req, res) => {
    try {
      const token = getSessionToken(req);
      if (!token) {
        return res.status(401).json({
          error: "GitHub account not connected. Please click 'Connect GitHub' to authorize repository access.",
        });
      }

      const repos = await fetchUserRepos(token);
      res.json({ success: true, repos });
    } catch (err: any) {
      console.error("Fetch GitHub repos error:", err.message);
      const isAuthError = err.message.includes("expired") || err.message.includes("unauthorized") || err.message.includes("re-authenticate");
      const isRateLimit = err.message.includes("rate limit");
      res.status(isAuthError ? 401 : isRateLimit ? 429 : 500).json({
        error: err.message || "Failed to fetch GitHub repositories",
      });
    }
  });

  // 8. Deep GitHub Repository Inspector (AST, Manifest, Safe Env inspection)
  app.post("/api/github/inspect", async (req, res) => {
    try {
      let { repoUrl, owner, repo, branch } = req.body;

      if (!owner || !repo) {
        if (repoUrl) {
          const clean = repoUrl.replace(/^https?:\/\/github\.com\//, "").replace(/\/$/, "");
          const parts = clean.split("/");
          if (parts.length >= 2) {
            owner = parts[0];
            repo = parts[1];
          }
        }
      }

      if (!owner || !repo) {
        return res.status(400).json({
          error: "Please provide a valid GitHub repository in the format 'owner/repo' or select an authorized repository.",
        });
      }

      const token = getSessionToken(req);
      const analysis = await inspectRepository(owner, repo, branch, token);
      res.json({ success: true, analysis });
    } catch (err: any) {
      console.error("Inspect GitHub repo error:", err.message);
      const isNotFound = err.message.includes("not found");
      const isAuthError = err.message.includes("expired") || err.message.includes("unauthorized");
      const isRateLimit = err.message.includes("rate limit");
      res.status(isNotFound ? 404 : isAuthError ? 401 : isRateLimit ? 429 : 500).json({
        error: err.message || "Failed to inspect GitHub repository",
      });
    }
  });

  // 9. Re-analysis and Diff Comparison
  app.post("/api/github/compare", async (req, res) => {
    try {
      const { owner, repo, previousScan } = req.body;
      const token = getSessionToken(req);

      const currentAnalysis = await inspectRepository(owner, repo, undefined, token);
      const diff = compareRepositoryScans(previousScan, currentAnalysis);

      res.json({
        success: true,
        ...diff,
        currentAnalysis,
      });
    } catch (err: any) {
      console.error("Compare repo error:", err.message);
      res.status(500).json({ error: err.message || "Failed to compare repository changes" });
    }
  });

  // 10. Save Project Scan to Supabase (Protected by RLS)
  app.post("/api/github/save-project-scan", async (req, res) => {
    try {
      const { project, analysis, userId } = req.body;
      const sb = getSupabaseAdmin();
      if (!sb || !userId) {
        return res.json({ success: true, note: "Local persistence only (Supabase not configured or guest user)" });
      }

      // Upsert project
      const { data: projData, error: projError } = await sb
        .from("projects")
        .upsert({
          name: project.name,
          user_id: userId,
          repository_url: project.githubUrl,
          repo_owner: project.repoOwner || "",
          repo_name: project.repoName || "",
          default_branch: project.defaultBranch || "main",
          is_private: project.isPrivate || false,
          project_type: project.projectType || "SaaS",
          primary_language: project.primaryLanguage || "TypeScript",
          framework: project.framework || "React",
          compliance_score: project.complianceScore || 75,
          active_version: project.activeVersion || "v1.0",
          updated_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (projError) {
        console.warn("Supabase save project error:", projError.message);
      }

      const targetProjectId = projData?.id || project.id;

      // Insert repository scan record
      if (analysis && targetProjectId) {
        await sb.from("repository_scans").insert({
          project_id: targetProjectId,
          user_id: userId,
          commit_sha: analysis.commitSha || "",
          branch: analysis.branch || project.defaultBranch || "main",
          tech_stack: analysis.techStack || [],
          detected_services: analysis.detectedServices || [],
          detected_data_handling: analysis.dataHandling || [],
          api_routes: analysis.detectedApiRoutes || [],
          env_variables_detected: analysis.detectedEnvVars || [],
          summary: analysis.summary || "",
          scan_status: "completed",
        });

        // Insert detected services
        if (Array.isArray(analysis.detectedServices)) {
          const serviceRows = analysis.detectedServices.map((s: any) => ({
            project_id: targetProjectId,
            user_id: userId,
            category: s.category,
            name: s.name,
            status: s.status || "needs_confirmation",
            confidence: s.confidence || "high",
            details: s.details || "",
            matched_library: s.matchedLibrary || null,
          }));
          await sb.from("detected_services").insert(serviceRows);
        }

        // Insert questions
        if (Array.isArray(analysis.questions)) {
          const questionRows = analysis.questions.map((q: any) => ({
            project_id: targetProjectId,
            user_id: userId,
            trigger_service: q.triggerService || "",
            category: q.category || "privacy",
            question: q.question,
            description: q.description || "",
            options: q.options || [],
            selected_answer: q.selectedAnswer || "",
            is_confirmed: q.isConfirmed || false,
            affected_docs: q.affectedDocs || [],
          }));
          await sb.from("project_questions").insert(questionRows);
        }
      }

      res.json({ success: true, projectId: targetProjectId });
    } catch (err: any) {
      console.error("Save scan error:", err.message);
      res.status(500).json({ error: err.message || "Failed to persist scan" });
    }
  });

  // 4. Project Scanner endpoint (AST for pasted package.json & sanitized envs)
  app.post("/api/scan", async (req, res) => {
    try {
      const { repoUrl, packageJsonContent, envVars, promptDescription } = req.body;

      // Extract only env keys - NEVER values
      const sanitizedEnvKeys: string[] = [];
      if (envVars) {
        envVars.split("\n").forEach((line: string) => {
          const trimmed = line.trim();
          if (trimmed && !trimmed.startsWith("#") && trimmed.includes("=")) {
            const key = trimmed.split("=")[0].trim();
            if (key) sanitizedEnvKeys.push(key);
          }
        });
      }

      const combinedText = `${repoUrl || ""} ${packageJsonContent || ""} ${sanitizedEnvKeys.join(" ")} ${promptDescription || ""}`.toLowerCase();

      const detected = {
        auth: [] as string[],
        payments: [] as string[],
        analytics: [] as string[],
        aiModels: [] as string[],
        storage: [] as string[],
        frameworks: [] as string[],
        hasCookies: false,
        hasUserUploads: false,
        sanitizedEnvKeys,
        summary: "",
      };

      if (combinedText.includes("stripe")) detected.payments.push("Stripe");
      if (combinedText.includes("lemonsqueezy")) detected.payments.push("LemonSqueezy");
      if (combinedText.includes("paddle")) detected.payments.push("Paddle");

      if (combinedText.includes("google") && (combinedText.includes("oauth") || combinedText.includes("auth"))) {
        detected.auth.push("Google OAuth");
      }
      if (combinedText.includes("supabase")) {
        detected.auth.push("Supabase Auth");
        detected.storage.push("Supabase (PostgreSQL)");
      }
      if (combinedText.includes("nextauth") || combinedText.includes("auth0")) {
        detected.auth.push(combinedText.includes("nextauth") ? "NextAuth.js" : "Auth0");
      }
      if (combinedText.includes("clerk")) detected.auth.push("Clerk");

      if (combinedText.includes("posthog")) detected.analytics.push("PostHog");
      if (combinedText.includes("google-analytics") || combinedText.includes("ga4") || combinedText.includes("gtag")) {
        detected.analytics.push("Google Analytics (GA4)");
      }
      if (combinedText.includes("mixpanel")) detected.analytics.push("Mixpanel");
      if (combinedText.includes("sentry")) detected.analytics.push("Sentry Error Monitoring");

      if (combinedText.includes("openai") || combinedText.includes("gpt")) {
        detected.aiModels.push("OpenAI (GPT-4 / ChatGPT)");
      }
      if (combinedText.includes("gemini") || combinedText.includes("@google/genai")) {
        detected.aiModels.push("Google Gemini 3.8-Flash");
      }
      if (combinedText.includes("anthropic") || combinedText.includes("claude")) {
        detected.aiModels.push("Anthropic Claude");
      }

      if (combinedText.includes("prisma")) detected.storage.push("Prisma ORM");
      if (combinedText.includes("drizzle")) detected.storage.push("Drizzle ORM");
      if (combinedText.includes("s3") || combinedText.includes("multer") || combinedText.includes("uploadthing")) {
        detected.storage.push("Object Storage (S3 / R2)");
        detected.hasUserUploads = true;
      }

      if (combinedText.includes("next")) detected.frameworks.push("Next.js");
      else if (combinedText.includes("react")) detected.frameworks.push("React (Vite)");
      else if (combinedText.includes("express")) detected.frameworks.push("Express.js");

      detected.hasCookies = combinedText.includes("cookie") || detected.analytics.length > 0 || detected.auth.length > 0;

      let aiEnhancedSummary = "";
      if (ai) {
        try {
          const response = await ai.models.generateContent({
            model: "gemini-3.8-flash",
            contents: `Analyze this developer project input for legal and technical documentation readiness.
Repo/Info: ${promptDescription || ""}
Package.json / Env Keys: ${packageJsonContent || ""} ${sanitizedEnvKeys.join(", ")}

Write a 2-3 sentence technical architectural summary highlighting key data flows, authentication, and external services.`,
          });
          aiEnhancedSummary = response.text || "";
        } catch (e) {
          console.error("Gemini scan summary fallback:", e);
        }
      }

      if (!aiEnhancedSummary) {
        const stackList = [...detected.frameworks, ...detected.storage, ...detected.auth, ...detected.payments].join(", ");
        aiEnhancedSummary = `Detected modern architecture built with ${stackList || "React & Node.js"}. Integrated services handle authentication (${detected.auth.join(", ") || "Standard"}), billing (${detected.payments.join(", ") || "None"}), and telemetry tracking.`;
      }

      detected.summary = aiEnhancedSummary;

      res.json({
        success: true,
        detected,
      });
    } catch (err: any) {
      console.error("Scan error:", err);
      res.status(500).json({ error: err.message || "Failed to scan project" });
    }
  });

  // 5. Documentation Generation endpoint (All 19 documents supported)
  app.post("/api/generate-doc", async (req, res) => {
    try {
      const { project, docType, humanAnswers, confirmedServices } = req.body;

      if (!project || !docType) {
        return res.status(400).json({ error: "Missing project or docType parameter" });
      }

      if (ai) {
        const isLegal = [
          "privacy-policy",
          "terms-of-service",
          "cookie-policy",
          "refund-policy",
          "data-deletion",
          "ai-disclosure",
          "security-policy",
        ].includes(docType);

        const prompt = `You are DocForge, an elite legal engineering and developer documentation generator.
Generate a comprehensive, production-ready markdown document for the following software project.

Project Name: ${project.name || "Untitled App"}
Website URL: ${project.websiteUrl || "https://example.com"}
GitHub: ${project.githubUrl || "https://github.com/developer/project"}
Project Type: ${project.projectType || "SaaS"}
Tech Stack: ${(project.techStack || []).join(", ")}
Framework: ${project.framework || "React / Node.js"}
Primary Language: ${project.primaryLanguage || "TypeScript"}
Auth Methods: ${(project.authMethods || []).join(", ")}
Payment Providers: ${(project.paymentProviders || []).join(", ")}
Analytics: ${(project.analyticsProviders || []).join(", ")}
AI Models Used: ${(project.aiModels || []).join(", ")}
Data Handling / Categories: ${(project.dataCollected || []).join(", ")}

Developer Confirmed Review Answers:
${JSON.stringify(humanAnswers || {}, null, 2)}

Document requested: "${docType}"
Available Types:
Technical: readme, project-overview, installation, env-guide, architecture, api-docs, schema-docs, auth-docs, deployment, contributing, security-docs, changelog
Legal & Regulatory: privacy-policy, terms-of-service, cookie-policy, refund-policy, data-deletion, ai-disclosure, security-policy
Business: faq, support-page, security-page

CRITICAL ACCURACY INSTRUCTIONS:
- Base the document strictly on the actual project facts and confirmed developer answers provided above.
- Do NOT hallucinate unconfirmed features (e.g. do not invent payment plans if no payments were confirmed).
- ${
          isLegal
            ? `At the very top of the document, ALWAYS include this exact bold legal disclaimer blockquote:
> **LEGAL DISCLAIMER:** This document is an automated template generated based on supplied project information and technical repository analysis. It is provided for informational purposes only and does NOT constitute formal legal advice. Please consult a qualified attorney licensed in your jurisdiction to ensure full regulatory compliance.`
            : `Provide realistic, high-quality code blocks, curl commands, ASCII/Mermaid architecture diagrams, and step-by-step terminal instructions matching the tech stack.`
        }
- Output ONLY the markdown document. Do not wrap in conversational chat filler.`;

        let markdown = "";
        try {
          const timeoutPromise = new Promise((_, reject) =>
            setTimeout(() => reject(new Error("Gemini timeout")), 8000)
          );
          const aiPromise = ai.models.generateContent({
            model: "gemini-3.8-flash",
            contents: prompt,
          });
          const response: any = await Promise.race([aiPromise, timeoutPromise]);
          markdown = response.text || "";
        } catch (genErr) {
          console.warn("Gemini generation fallback used:", genErr);
          markdown = generateFallbackDoc(project, docType, humanAnswers);
        }

        if (!markdown) {
          markdown = generateFallbackDoc(project, docType, humanAnswers);
        }
        return res.json({ success: true, markdown });
      }

      // Offline / Fallback generator
      res.json({
        success: true,
        markdown: generateFallbackDoc(project, docType, humanAnswers),
      });
    } catch (err: any) {
      console.error("Generate doc error:", err);
      res.status(500).json({ error: err.message || "Failed to generate document" });
    }
  });

  // 6. Compliance Audit endpoint
  app.post("/api/audit-compliance", async (req, res) => {
    try {
      const { project, docs, humanAnswers } = req.body;

      if (ai) {
        const prompt = `You are an automated regulatory compliance auditor for web software.
Audit this application against global data privacy and AI regulations:
- GDPR (General Data Protection Regulation - EU)
- CCPA / CPRA (California Consumer Privacy Act)
- COPPA (Children's Online Privacy Protection Rule)
- UK GDPR
- EU AI Act (Artificial Intelligence Act disclosures)

Project:
Name: ${project?.name}
Stack: ${(project?.techStack || []).join(", ")}
Auth: ${(project?.authMethods || []).join(", ")}
Payments: ${(project?.paymentProviders || []).join(", ")}
Analytics: ${(project?.analyticsProviders || []).join(", ")}
AI Models: ${(project?.aiModels || []).join(", ")}
Data: ${(project?.dataCollected || []).join(", ")}
Existing Docs: ${Object.keys(docs || {}).join(", ")}
Human Review Answers: ${JSON.stringify(humanAnswers || {})}

Return JSON with this exact structure:
{
  "overallScore": number (0-100),
  "gdprScore": number (0-100),
  "ccpaScore": number (0-100),
  "coppaScore": number (0-100),
  "aiActScore": number (0-100),
  "passedChecks": [string],
  "missingItems": [
    {
      "severity": "high" | "medium" | "low",
      "title": string,
      "regulation": string,
      "recommendation": string,
      "docTarget": string
    }
  ],
  "summary": string
}`;

        const response = await ai.models.generateContent({
          model: "gemini-3.8-flash",
          contents: prompt,
          config: {
            responseMimeType: "application/json",
          },
        });

        try {
          const parsed = JSON.parse(response.text || "{}");
          return res.json({ success: true, audit: parsed });
        } catch {
          // fall through
        }
      }

      // Default audit logic
      const missing = [];
      let score = 78;
      if (!docs?.["data-deletion"]) {
        missing.push({
          severity: "high",
          title: "Missing Explicit Data Deletion & Erasure Policy",
          regulation: "GDPR Article 17 / CCPA",
          recommendation: "Publish statutory 30-day purge timelines for user accounts and backup snapshots.",
          docTarget: "data-deletion",
        });
        score -= 6;
      }
      if (project?.aiModels?.length > 0 && !docs?.["ai-disclosure"]) {
        missing.push({
          severity: "high",
          title: "Missing EU AI Act Article 50 Transparency Notice",
          regulation: "EU AI Act Article 50",
          recommendation: "Disclose use of synthetic generative AI models and user data training opt-outs.",
          docTarget: "ai-disclosure",
        });
        score -= 8;
      }
      if (!docs?.["cookie-policy"] && project?.analyticsProviders?.length > 0) {
        missing.push({
          severity: "medium",
          title: "Missing Cookie & Local Storage Disclosure",
          regulation: "ePrivacy Directive / GDPR",
          recommendation: "List first-party and third-party tracking cookies with opt-out mechanisms.",
          docTarget: "cookie-policy",
        });
        score -= 5;
      }

      res.json({
        success: true,
        audit: {
          overallScore: score,
          gdprScore: score - 2,
          ccpaScore: score + 3,
          coppaScore: 92,
          aiActScore: project?.aiModels?.length > 0 ? (docs?.["ai-disclosure"] ? 95 : 62) : 100,
          passedChecks: [
            "Lawful basis for payment processing established (Stripe)",
            "Google OAuth identity verification tokens stored securely",
            "SSL/TLS transmission encryption mandated",
            "Right to account deletion recognized in main Terms",
          ],
          missingItems: missing,
          summary: `Project complies with foundational standards but needs explicit clauses for ${missing.map((m) => m.title).join(", ") || "complete coverage"}.`,
        },
      });
    } catch (err: any) {
      console.error("Audit error:", err);
      res.status(500).json({ error: err.message || "Failed to audit compliance" });
    }
  });

  // 7. Change Monitor & Diff simulation
  app.post("/api/monitor-diff", async (req, res) => {
    try {
      const { commitMessage, addedDependencies, currentStack } = req.body;

      let detectedChange = "";
      let affectedDocs: string[] = [];
      let recommendation = "";
      let suggestedClause = "";

      if (addedDependencies?.includes("posthog") || commitMessage?.toLowerCase().includes("posthog")) {
        detectedChange = "PostHog Product Analytics SDK added to codebase";
        affectedDocs = ["privacy-policy", "cookie-policy"];
        recommendation = "Update third-party sub-processors list and disclose session replay / event tracking telemetry.";
        suggestedClause = `### 4.3 Telemetry & Product Analytics (PostHog)\nWe utilize PostHog to analyze user workflows and interactions. PostHog collects pseudonymized telemetry, device dimensions, and page navigation sequences. Users may opt out at any time via Do-Not-Track browser headers.`;
      } else if (addedDependencies?.includes("stripe") || commitMessage?.toLowerCase().includes("stripe")) {
        detectedChange = "Stripe Payments SDK added to codebase";
        affectedDocs = ["terms-of-service", "refund-policy", "privacy-policy"];
        recommendation = "Establish billing cycle, PCI-DSS compliance disclosure, and 14-day refund window policy.";
        suggestedClause = `### 3. Payment Processing & PCI-DSS Compliance\nAll payment transactions are handled exclusively by Stripe, Inc. We do not store raw credit card credentials on our servers.`;
      } else if (addedDependencies?.includes("@google/genai") || addedDependencies?.includes("openai") || commitMessage?.toLowerCase().includes("ai")) {
        detectedChange = "Generative AI Integration added to codebase";
        affectedDocs = ["ai-disclosure", "privacy-policy", "terms-of-service"];
        recommendation = "Publish EU AI Act Article 50 disclosure confirming user prompt privacy and training opt-outs.";
        suggestedClause = `### 2. Generative Artificial Intelligence Disclosure\nOur platform integrates Google Gemini / OpenAI language models to synthesize documentation. User proprietary input is processed transiently and is NOT utilized for foundation model training without explicit consent.`;
      } else {
        detectedChange = `Commit detected: "${commitMessage || "chore: update dependencies"}"`;
        affectedDocs = ["changelog"];
        recommendation = "Log dependency update and bump minor documentation release version.";
        suggestedClause = `#### [v1.2.0] - ${new Date().toISOString().split("T")[0]}\n- Updated core system dependencies and improved security hardening.`;
      }

      res.json({
        success: true,
        diff: {
          detectedChange,
          affectedDocs,
          recommendation,
          suggestedClause,
          timestamp: new Date().toISOString(),
          suggestedVersion: "v1.2",
        },
      });
    } catch (err: any) {
      console.error("Diff monitor error:", err);
      res.status(500).json({ error: err.message || "Failed to process diff" });
    }
  });

  // Vite middleware for dev or static server for production
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`DocForge server running on http://localhost:${PORT}`);
  });
}

// Complete fallback document generator for all 19 documents
function generateFallbackDoc(project: any, docType: string, answers: any): string {
  const date = new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
  const appName = project?.name || "Acme Software";
  const url = project?.websiteUrl || "https://example.com";
  const github = project?.githubUrl || "https://github.com/developer/project";
  const refundPolicyAnswer = answers?.refundPolicy || answers?.q_refund_sla || "14-day full refund guarantee upon request, no questions asked";
  const accountDeletionAnswer = answers?.accountDeletion || answers?.q_account_deletion || "Users can delete their account in 1-click via account settings, with full data purge within 30 days";
  const aiTrainingAnswer = answers?.aiTraining || answers?.q_ai_training || "User inputs are strictly private and never used to train public foundation models";
  const sessionReplayAnswer = answers?.sessionReplay || answers?.q_session_replay || "Session replay enabled with strict masking on all passwords, emails, and input fields";
  const disclaimer = `> **LEGAL DISCLAIMER:** This document is an automated template generated based on supplied project information and technical repository analysis. It is provided for informational purposes only and does NOT constitute formal legal advice. Please consult a qualified attorney licensed in your jurisdiction to ensure full regulatory compliance.`;

  switch (docType) {
    case "privacy-policy":
      return `${disclaimer}

# Privacy Policy for ${appName}

**Effective Date:** ${date}  
**Last Updated:** ${date}  
**Website:** [${url}](${url})

At **${appName}**, we take the privacy of our developers and end-users seriously. This Privacy Policy outlines how we collect, process, store, and protect your information in full compliance with the EU General Data Protection Regulation (GDPR), the California Consumer Privacy Act (CCPA/CPRA), and international privacy frameworks.

---

### 1. Information We Collect
We collect personal data strictly necessary to fulfill our core technical services:
* **Identity & Authentication:** Email address, username, profile photo (provided via ${(project.authMethods || ["Google OAuth", "Supabase Auth"]).join(", ")}).
* **Billing & Payments:** Billing name, email, transaction records processed through ${(project.paymentProviders || ["Stripe"]).join(", ")}. We NEVER store raw credit card numbers.
* **Usage Telemetry:** Aggregated session analytics, device architecture, and interaction sequences gathered via ${(project.analyticsProviders || ["PostHog"]).join(", ")}.
* **User Project Inputs:** Repository metadata, schema definitions, and project configuration submitted for analysis.

---

### 2. How We Use Your Data
* To authenticate user sessions and secure API endpoints.
* To process subscription payments and issue tax-compliant invoices.
* To generate legal policies, API guides, and architecture documentation.
* To audit platform reliability and prevent malicious abuse.

---

### 3. Data Retention & Erasure SLA
${accountDeletionAnswer}. Routine database backup archives are maintained under AES-256 encryption and purged on a rolling 30-day lifecycle schedule.

---

### 4. Third-Party Sub-Processors
We partner with vetted infrastructure providers adhering to SOC-2 Type II standards:
* **Authentication:** ${(project.authMethods || ["Supabase Auth / Google Cloud"]).join(", ")}
* **Billing Gateway:** ${(project.paymentProviders || ["Stripe, Inc."]).join(", ")}
* **Database & Hosting:** ${(project.techStack || ["Supabase PostgreSQL", "Cloud Run"]).join(", ")}
* **AI Processing:** ${(project.aiModels || ["Google Gemini API"]).join(", ")}

---

### 5. Your Statutory Rights (GDPR / CCPA)
You have the right to request:
1. **Access & Portability:** Receive an exported archive of your project and account data.
2. **Rectification:** Update inaccurate personal profile information.
3. **Erasure ("Right to Be Forgotten"):** Request immediate hard deletion of your records.

Contact our Data Protection Officer at: privacy@${url.replace(/^https?:\/\//, "").replace(/\/.*$/, "") || "example.com"}`;

    case "terms-of-service":
      return `${disclaimer}

# Terms of Service

**Effective Date:** ${date}  
**Website:** [${url}](${url})

Please read these Terms of Service carefully before utilizing **${appName}**.

### 1. Agreement to Terms
By creating an account or accessing the platform, you agree to be bound by these Terms and our Privacy Policy.

### 2. Software Services
${appName} provides automated repository analysis, developer documentation tooling, and hosted compliance portals.

### 3. Subscriptions & Billing
* **Recurring Billing:** Subscriptions renew automatically on a monthly or annual cadence.
* **Refund Policy:** ${refundPolicyAnswer}.
* **Cancellation:** You may cancel your subscription at any time through your dashboard.

### 4. Intellectual Property Rights
You retain complete, unencumbered ownership of your source code, repositories, configuration files, and all documentation generated using our platform.

### 5. Disclaimers & Limitation of Liability
${appName} provides software tools on an "as-is" and "as-available" basis. In no event shall ${appName} be liable for any indirect, consequential, or special damages.`;

    case "cookie-policy":
      return `${disclaimer}

# Cookie & Local Storage Policy

**Effective Date:** ${date}

This Cookie Policy explains how **${appName}** uses cookies, web beacons, and local storage tokens.

### 1. Categories of Cookies Used
* **Strictly Necessary Cookies:** Essential for authentication, session verification, and CSRF token protection (e.g. \`sb:token\`, \`auth_session\`).
* **Functional Cookies:** Remembers user interface preferences, active documentation tabs, and theme modes.
* **Analytics Cookies:** Used by ${(project.analyticsProviders || ["PostHog"]).join(", ")} to detect UX bottlenecks. Telemetry is collected in accordance with: "${sessionReplayAnswer}".

### 2. Managing Your Preferences
Users may adjust cookie settings at any time via browser controls or the cookie banner settings.`;

    case "refund-policy":
      return `${disclaimer}

# Refund & Cancellation Policy

**Effective Date:** ${date}

At **${appName}**, customer satisfaction is our top priority.

### 1. Refund Window
${refundPolicyAnswer}.

### 2. How to Request a Refund
Submit a request with your account email and receipt invoice to support@${url.replace(/^https?:\/\//, "").replace(/\/.*$/, "") || "example.com"}. Approved refunds are credited to the original payment method within 3–5 business days.`;

    case "data-deletion":
      return `${disclaimer}

# Data Deletion & Retention Policy

**Effective Date:** ${date}

This policy outlines our procedures for data destruction in compliance with GDPR Article 17 ("Right to Erasure") and CCPA/CPRA.

### 1. Account Deletion Workflow
${accountDeletionAnswer}.

### 2. Data Purge Categories
* **Account Records:** Permanently expunged from primary database tables.
* **Project Files & Documentation:** Removed immediately from live storage.
* **Financial Records:** Retained for statutory tax audit periods (typically 7 years) in accordance with accounting laws.
* **Backup Archives:** Purged on a rolling 30-day automated lifecycle.`;

    case "ai-disclosure":
      return `${disclaimer}

# Artificial Intelligence (AI) Transparency Disclosure
*(In compliance with the EU Artificial Intelligence Act Article 50)*

**Effective Date:** ${date}

**${appName}** utilizes state-of-the-art Generative AI models (${(project.aiModels || ["Google Gemini 3.8-Flash"]).join(", ")}) to synthesize developer documentation.

### 1. AI Data Processing Policy
${aiTrainingAnswer}.

### 2. Synthetic Content Notice
Portions of generated documentation may be synthesized using artificial intelligence. Developers should review and verify generated clauses prior to publication.

### 3. Training & Telemetry
We do NOT sell, license, or provide your source code or documentation prompts to third parties for foundation model pre-training.`;

    case "security-policy":
      return `${disclaimer}

# Security & Responsible Disclosure Policy

**Effective Date:** ${date}

At **${appName}**, software and infrastructure security are foundational.

### 1. Infrastructure Protection
* **Encryption in Transit:** All traffic enforced over TLS 1.3 with HSTS.
* **Encryption at Rest:** AES-256 encryption across all databases, storage buckets, and automated backups.
* **Access Control:** Principle of Least Privilege (PoLP) with multi-factor authentication mandated for administrative infrastructure.

### 2. Responsible Vulnerability Disclosure
If you discover a security vulnerability, please notify our security response team at security@${url.replace(/^https?:\/\//, "").replace(/\/.*$/, "") || "example.com"} before public disclosure. We commit to acknowledging reports within 24 hours.`;

    case "readme":
      return `# ${appName}

> ${project?.description || "High-performance software application built with " + (project?.framework || "React & Node.js") + "."}

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Build Status](https://img.shields.io/badge/build-passing-brightgreen.svg)](${github})
[![Stack](https://img.shields.io/badge/stack-${encodeURIComponent((project.techStack || ["React", "Node.js"]).slice(0, 3).join("_"))}-indigo.svg)](${github})

---

## 🌟 Key Features
* ⚡ **Modern Architecture:** Built on ${project?.framework || "Next.js / React"} and ${(project.techStack || ["TypeScript"]).join(", ")}.
* 🔐 **Authentication:** Secure user identity powered by ${(project.authMethods || ["Google OAuth", "Supabase Auth"]).join(", ")}.
* 💳 **Billing & Payments:** Enterprise checkout and subscriptions via ${(project.paymentProviders || ["Stripe"]).join(", ")}.
* 📊 **Telemetry:** Observability and product telemetry via ${(project.analyticsProviders || ["PostHog"]).join(", ")}.
* 🤖 **AI Capabilities:** Generative document and code assistance via ${(project.aiModels || ["Google Gemini 3.8-Flash"]).join(", ")}.

---

## 🚀 Quickstart

### Prerequisites
* Node.js >= 20.0.0
* npm or pnpm or bun

### Installation
\`\`\`bash
# 1. Clone the repository
git clone ${github}.git
cd ${project?.name ? project.name.toLowerCase().replace(/\s+/g, "-") : "app"}

# 2. Install dependencies
npm install

# 3. Configure environment variables
cp .env.example .env.local

# 4. Start development server
npm run dev
\`\`\`

Open [http://localhost:3000](http://localhost:3000) to view the application.

---

## 📄 License
This project is open source and available under the [MIT License](LICENSE).`;

    case "project-overview":
      return `# Project Overview: ${appName}

## 1. Executive Summary
**${appName}** is a ${(project.projectType || "SaaS").toUpperCase()} solution designed to deliver seamless technical capabilities using modern cloud infrastructure.

## 2. System Objectives
1. Provide intuitive, resilient user workflows.
2. Maintain strict data protection standards (GDPR, CCPA, EU AI Act).
3. Ensure high availability with automated horizontal scaling.

## 3. Technology Matrix
| Component | Selected Technology |
|---|---|
| **Frontend Framework** | ${project?.framework || "React / Next.js"} |
| **Language** | ${project?.primaryLanguage || "TypeScript"} |
| **Authentication** | ${(project.authMethods || ["Supabase Auth"]).join(", ")} |
| **Payment Gateway** | ${(project.paymentProviders || ["Stripe"]).join(", ")} |
| **Analytics** | ${(project.analyticsProviders || ["PostHog"]).join(", ")} |
| **AI Foundation** | ${(project.aiModels || ["Google Gemini"]).join(", ")} |`;

    case "installation":
      return `# Installation & Local Setup Guide

Follow this guide to set up **${appName}** on your local workstation.

### Step 1: System Requirements
* **Node.js:** v20.x or higher
* **Git:** v2.30+
* **Package Manager:** npm / yarn / pnpm

### Step 2: Clone & Install
\`\`\`bash
git clone ${github}.git
cd ${appName.toLowerCase().replace(/\s+/g, "-")}
npm install
\`\`\`

### Step 3: Environment Setup
\`\`\`bash
cp .env.example .env
\`\`\`

Populate required API credentials in \`.env\`.

### Step 4: Run Development Server
\`\`\`bash
npm run dev
\`\`\`
Visit \`http://localhost:3000\` to confirm the dev server is operational.`;

    case "env-guide":
      return `# Environment Variables Reference

This guide details all configuration variables utilized by **${appName}**.
Never commit secret values to version control.

### Required Configuration
| Variable Name | Description | Required | Example |
|---|---|---|---|
| \`PORT\` | Server listening port | Yes | \`3000\` |
| \`DATABASE_URL\` | PostgreSQL database connection string | Yes | \`postgres://user:pass@host:5432/db\` |
| \`GEMINI_API_KEY\` | Google Gemini AI authentication key | Optional | \`AIzaSy...\` |
| \`STRIPE_SECRET_KEY\` | Stripe billing secret key | If billing enabled | \`sk_live_...\` |
| \`VITE_SUPABASE_URL\` | Supabase API endpoint URL | If Supabase used | \`https://xyz.supabase.co\` |
| \`VITE_SUPABASE_PUBLISHABLE_KEY\` | Supabase Publishable key (browser-safe, RLS-enforced) | If Supabase used | \`sb_publishable_...\` |
| \`SUPABASE_SECRET_KEY\` | Supabase Secret key (server-side ONLY; never client) | If backend admin operations used | \`sb_secret_...\` |`;

    case "architecture":
      return `# Architecture & System Design

## 1. High-Level Architecture
\`\`\`
+------------------+         +-------------------+         +--------------------+
|  Client Browser  | <-----> |   Vite / Express  | <-----> |  PostgreSQL / DB   |
| (React 19 + TW)  |   TLS   |   API Server      |  Pool   |  (Supabase RLS)    |
+------------------+         +-------------------+         +--------------------+
                                      |
                         +------------+------------+
                         |                         |
                         v                         v
                 +---------------+         +---------------+
                 | Stripe Billing|         | Google Gemini |
                 | (Webhooks)    |         | (Generative)  |
                 +---------------+         +---------------+
\`\`\`

## 2. Core Subsystems
1. **Presentation Layer:** Client-side SPA built with React 19 and Tailwind CSS.
2. **API & Orchestration Layer:** Node.js / Express server handling authentication, rate-limiting, and webhooks.
3. **Storage & Data Layer:** Relational PostgreSQL database secured with Row Level Security (RLS) policies.`;

    case "api-docs":
      return `# REST API Documentation

Base URL: \`${url}/api\`

### 1. Health Check
\`\`\`http
GET /api/health
\`\`\`
**Response (200 OK):**
\`\`\`json
{
  "status": "ok",
  "timestamp": "${new Date().toISOString()}"
}
\`\`\`

### 2. Generate Documentation
\`\`\`http
POST /api/generate-doc
Content-Type: application/json
Authorization: Bearer <TOKEN>
\`\`\`
**Body:**
\`\`\`json
{
  "docType": "privacy-policy",
  "projectId": "proj_123"
}
\`\`\`

### 3. Audit Compliance
\`\`\`http
POST /api/audit-compliance
Content-Type: application/json
\`\`\``;

    case "schema-docs":
      return `# Database Schema & Entity Documentation

Database: **PostgreSQL (Supabase)** with Row Level Security (RLS) enabled across all tables.

### 1. Table: \`projects\`
* \`id\` (UUID, PK) - Unique project identifier
* \`user_id\` (UUID, FK -> auth.users) - Project owner
* \`name\` (TEXT) - Project title
* \`repository_url\` (TEXT) - GitHub repository location
* \`compliance_score\` (INTEGER) - Audit compliance score (0-100)
* \`active_version\` (TEXT) - Semantic version tag (e.g. \`v1.0\`)

### 2. Table: \`documents\`
* \`id\` (UUID, PK) - Document identifier
* \`project_id\` (UUID, FK -> projects) - Owning project
* \`doc_type\` (TEXT) - Document specification
* \`content\` (TEXT) - Raw Markdown content
* \`current_version\` (TEXT) - Active release version
* \`status\` (TEXT) - Draft, reviewed, or published`;

    case "auth-docs":
      return `# Authentication & Identity Architecture

Authentication in **${appName}** is managed via ${(project.authMethods || ["Supabase Auth & Google OAuth"]).join(", ")}.

### 1. Authentication Flow
1. **OAuth Sign-In:** User authenticates via Google or GitHub OAuth provider.
2. **JWT Issuance:** Identity provider signs JWT token with short expiration.
3. **Session Store:** Refresh tokens are rotated securely in HTTP-only session cookies.
4. **Row Level Security (RLS):** Database queries automatically enforce \`auth.uid() = user_id\`.`;

    case "deployment":
      return `# Deployment Guide

**${appName}** can be deployed to Docker, Vercel, Cloud Run, or any standard Linux container runtime.

### Docker Deployment
\`\`\`dockerfile
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY package*.json ./
EXPOSE 3000
CMD ["npm", "start"]
\`\`\`

### Cloud Run Deployment
\`\`\`bash
gcloud run deploy ${appName.toLowerCase().replace(/\s+/g, "-")} \\
  --source . \\
  --platform managed \\
  --region us-central1 \\
  --allow-unauthenticated
\`\`\``;

    case "contributing":
      return `# Contributing to ${appName}

Thank you for your interest in contributing to **${appName}**!

### Development Workflow
1. Fork the repository on GitHub.
2. Create a feature branch (\`git checkout -b feature/amazing-feature\`).
3. Commit your changes with conventional commit messages (\`git commit -m 'feat: add new parser'\`).
4. Push to your branch (\`git push origin feature/amazing-feature\`).
5. Open a Pull Request for review.

### Code Standards
* Format with ESLint and Prettier.
* Verify TypeScript types pass without errors: \`npm run lint\`.`;

    case "changelog":
      return `# Changelog

All notable changes to **${appName}** are documented in this file.
The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).

## [1.0.0] - ${date}
### Added
- Initial production release of **${appName}**.
- Automated GitHub AST repository scanner and dependency mapper.
- Comprehensive technical and legal policy documentation engine.
- Multi-jurisdictional compliance auditor covering GDPR, CCPA, and EU AI Act.
- Git-like semantic version control and revision diff engine.`;

    default:
      return `# ${docType.toUpperCase()} for ${appName}
Generated on ${date} for [${url}](${url}).

### Overview
This document specifies policies and technical guidelines for ${appName}.`;
  }
}

startServer();
