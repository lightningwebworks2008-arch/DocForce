import React, { useState } from 'react';
import {
  Github,
  Mail,
  Lock,
  User,
  ShieldCheck,
  ArrowRight,
  AlertCircle,
  FileCode2,
  Scale,
  GitBranch,
} from 'lucide-react';
import {
  signInWithGithub,
  signInWithGoogle,
  signInWithPassword,
  signUpWithPassword,
  isSupabaseConfigured,
} from '../lib/supabase';

interface AuthScreenProps {
  onAuthSuccess: () => void;
}

export const AuthScreen: React.FC<AuthScreenProps> = ({ onAuthSuccess }) => {
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleGithub = async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      await signInWithGithub();
      onAuthSuccess();
    } catch (err: any) {
      setErrorMsg(err.message || 'GitHub OAuth failed');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      await signInWithGoogle();
      onAuthSuccess();
    } catch (err: any) {
      setErrorMsg(err.message || 'Google OAuth failed');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);
    try {
      if (mode === 'signin') {
        await signInWithPassword(email, password);
      } else {
        await signUpWithPassword(email, password, fullName);
      }
      onAuthSuccess();
    } catch (err: any) {
      setErrorMsg(err.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0C0B0D] text-[#F0F0F3] flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center mb-6">
        <div className="inline-flex items-center justify-center w-11 h-11 rounded-md bg-[#18171E] text-[#33FBFF] mb-3 border border-[#2D2A3A] shadow-[0_0_15px_rgba(180,59,255,0.2)]">
          <FileCode2 className="w-5 h-5" />
        </div>
        <h1 className="text-2xl sm:text-3xl font-display font-semibold tracking-tight text-[#FFFFFF]">
          DocForge
        </h1>
        <p className="text-xs sm:text-sm text-[#8C8C93] mt-1">
          Automated legal &amp; technical documentation engine
        </p>
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-[#15141C] border border-[#2D2A3A] py-7 px-6 sm:px-8 rounded-md space-y-5 shadow-2xl">
          <div className="text-center">
            <h2 className="text-base font-semibold text-[#FFFFFF]">
              {mode === 'signin' ? 'Sign in to your workspace' : 'Create developer account'}
            </h2>
            <p className="text-xs text-[#8C8C93] mt-0.5">
              Authenticate to access your repositories, audits, and legal documents.
            </p>
          </div>

          {errorMsg && (
            <div className="p-2.5 rounded-md bg-[#FF5A5A]/10 border border-[#FF5A5A]/30 text-[#FF5A5A] text-xs flex items-center gap-2">
              <AlertCircle className="w-3.5 h-3.5 shrink-0 text-[#FF5A5A]" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Social OAuth Buttons */}
          <div className="space-y-2">
            <button
              onClick={handleGithub}
              disabled={loading}
              className="w-full flex items-center justify-center gap-2.5 px-3.5 py-2 rounded-md bg-[#18171E] hover:bg-[#201E28] text-[#F0F0F3] font-medium text-xs transition-colors cursor-pointer border border-[#2A2735]"
            >
              <Github className="w-4 h-4" />
              <span>Continue with GitHub</span>
            </button>

            {isSupabaseConfigured && (
              <button
                onClick={handleGoogle}
                disabled={loading}
                className="w-full flex items-center justify-center gap-2.5 px-3.5 py-2 rounded-md bg-[#18171E] hover:bg-[#201E28] text-[#F0F0F3] font-medium text-xs transition-colors cursor-pointer border border-[#2A2735]"
              >
                <svg className="w-3.5 h-3.5" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  />
                </svg>
                <span>Continue with Google</span>
              </button>
            )}
          </div>

          {/* Divider */}
          <div className="relative flex py-1 items-center">
            <div className="grow border-t border-[#24222D]"></div>
            <span className="shrink mx-3 text-[#8C8C93] text-[10px] font-mono uppercase tracking-wider">Or email</span>
            <div className="grow border-t border-[#24222D]"></div>
          </div>

          {/* Email / Password Form */}
          <form onSubmit={handleSubmit} className="space-y-3">
            {mode === 'signup' && (
              <div>
                <label className="block text-[10px] font-mono uppercase tracking-wider text-[#8C8C93] mb-1">Full Name</label>
                <div className="relative">
                  <User className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[#8C8C93]" />
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Jane Doe"
                    className="w-full pl-8 pr-3 py-1.5 bg-[#0E0D13] border border-[#272435] rounded-md text-xs text-[#F0F0F3] placeholder-[#5E5C68] focus:outline-none focus:border-[#B43BFF]"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-[10px] font-mono uppercase tracking-wider text-[#8C8C93] mb-1">Email Address</label>
              <div className="relative">
                <Mail className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[#8C8C93]" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="developer@company.com"
                  className="w-full pl-8 pr-3 py-1.5 bg-[#0E0D13] border border-[#272435] rounded-md text-xs text-[#F0F0F3] placeholder-[#5E5C68] focus:outline-none focus:border-[#B43BFF]"
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-mono uppercase tracking-wider text-[#8C8C93] mb-1">Password</label>
              <div className="relative">
                <Lock className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[#8C8C93]" />
                <input
                  type="password"
                  required
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-8 pr-3 py-1.5 bg-[#0E0D13] border border-[#272435] rounded-md text-xs text-[#F0F0F3] placeholder-[#5E5C68] focus:outline-none focus:border-[#B43BFF]"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 py-2 px-3 bg-[#B43BFF] hover:bg-[#A127F5] text-white text-xs font-semibold rounded-md transition-all shadow-[0_0_15px_rgba(180,59,255,0.25)] flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <span>{mode === 'signin' ? 'Sign In' : 'Create Account'}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </form>

          {/* Mode Switcher */}
          <div className="text-center text-xs text-[#8C8C93]">
            {mode === 'signin' ? (
              <span>
                Don&apos;t have an account?{' '}
                <button
                  type="button"
                  onClick={() => setMode('signup')}
                  className="text-[#33FBFF] hover:underline font-semibold cursor-pointer ml-1"
                >
                  Create one
                </button>
              </span>
            ) : (
              <span>
                Already have an account?{' '}
                <button
                  type="button"
                  onClick={() => setMode('signin')}
                  className="text-[#33FBFF] hover:underline font-semibold cursor-pointer ml-1"
                >
                  Sign in
                </button>
              </span>
            )}
          </div>
        </div>

        {/* Security & Features Guarantee */}
        <div className="mt-5 pt-3 border-t border-[#24222D] flex items-center justify-center gap-4 text-[10px] font-mono text-[#8C8C93] flex-wrap">
          <div className="flex items-center gap-1">
            <ShieldCheck className="w-3 h-3 text-[#0DB44A]" />
            <span>Encrypted</span>
          </div>
          <span>•</span>
          <div className="flex items-center gap-1">
            <GitBranch className="w-3 h-3 text-[#33FBFF]" />
            <span>Git Integrated</span>
          </div>
          <span>•</span>
          <div className="flex items-center gap-1">
            <Scale className="w-3 h-3 text-[#B43BFF]" />
            <span>GDPR &amp; CCPA Ready</span>
          </div>
        </div>
      </div>
    </div>
  );
};
