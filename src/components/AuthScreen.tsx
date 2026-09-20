import React, { useState } from "react";
import {
  Mail,
  Lock,
  User as UserIcon,
  Eye,
  EyeOff,
  AlertCircle,
  AlertTriangle,
  CheckCircle2,
  Sparkles,
  ArrowRight,
  KeyRound,
  ShieldCheck,
  BookOpen,
  UserCheck,
  Mic,
  Video,
  Copy,
  Check,
  ExternalLink,
  Zap,
} from "lucide-react";
import {
  registerWithEmail,
  loginWithEmail,
  loginWithGoogle,
  loginAsDemoStudent,
  resetPassword,
  firebaseConfig,
} from "../lib/firebase";
import { VioraLogo } from "./VioraLogo";
import { ThemeToggle } from "./ThemeToggle";

export const AuthScreen: React.FC = () => {
  const [mode, setMode] = useState<"login" | "signup" | "forgot">("login");

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const [submitting, setSubmitting] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [demoLoading, setDemoLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [authErrorCode, setAuthErrorCode] = useState<string | null>(null);
  const [copiedDomain, setCopiedDomain] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const currentHostname = typeof window !== "undefined" ? window.location.hostname : "";

  // Copy hostname to clipboard
  const handleCopyHostname = () => {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(currentHostname);
      setCopiedDomain(true);
      setTimeout(() => setCopiedDomain(false), 2500);
    }
  };

  // Format Firebase error codes into friendly user messages
  const parseFirebaseError = (err: any): string => {
    const code = err?.code || "";
    const msg = err?.message || "";
    setAuthErrorCode(code);

    if (code === "auth/unauthorized-domain") {
      return `Domain Authorization Required: This preview domain (${currentHostname}) is not yet added to your Firebase Authorized Domains list.`;
    }
    if (code === "auth/popup-blocked") {
      return "The Google sign-in popup was blocked by your browser or sandbox settings. Please allow popups or use the 1-Click Demo / Email option below.";
    }
    if (code === "auth/email-already-in-use") {
      return "An account with this email already exists. Please log in.";
    }
    if (
      code === "auth/invalid-credential" ||
      code === "auth/wrong-password" ||
      code === "auth/user-not-found"
    ) {
      return "Invalid email or password. Please verify your credentials and try again.";
    }
    if (code === "auth/weak-password") {
      return "Password is too weak. Please use at least 6 characters.";
    }
    if (code === "auth/invalid-email") {
      return "Please provide a valid email address.";
    }
    if (code === "auth/popup-closed-by-user") {
      return "The Google sign-in window was closed before completing.";
    }
    if (code === "auth/operation-not-allowed") {
      return "Google Sign-In is not enabled yet in your Firebase console. Please enable Google under Firebase Console > Authentication > Sign-in method.";
    }
    if (code === "auth/network-request-failed") {
      return "Network error. Please check your internet connection and try again.";
    }
    return msg || "Authentication error occurred. Please try again.";
  };

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setAuthErrorCode(null);
    setSuccessMsg(null);

    if (!email.trim()) {
      setError("Please enter your email address.");
      return;
    }

    if (mode === "forgot") {
      setSubmitting(true);
      try {
        await resetPassword(email);
        setSuccessMsg("Password reset link sent! Please check your email inbox.");
      } catch (err: any) {
        setError(parseFirebaseError(err));
      } finally {
        setSubmitting(false);
      }
      return;
    }

    if (!password) {
      setError("Please enter your password.");
      return;
    }

    if (mode === "signup") {
      if (password.length < 6) {
        setError("Password must be at least 6 characters long.");
        return;
      }
      if (password !== confirmPassword) {
        setError("Passwords do not match. Please re-enter.");
        return;
      }

      setSubmitting(true);
      try {
        await registerWithEmail(email, password, name);
      } catch (err: any) {
        setError(parseFirebaseError(err));
      } finally {
        setSubmitting(false);
      }
    } else {
      // Login
      setSubmitting(true);
      try {
        await loginWithEmail(email, password);
      } catch (err: any) {
        setError(parseFirebaseError(err));
      } finally {
        setSubmitting(false);
      }
    }
  };

  const handleGoogleSignIn = async () => {
    setError(null);
    setAuthErrorCode(null);
    setSuccessMsg(null);
    setGoogleLoading(true);
    try {
      await loginWithGoogle();
    } catch (err: any) {
      setError(parseFirebaseError(err));
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleDemoSignIn = async () => {
    setError(null);
    setAuthErrorCode(null);
    setSuccessMsg(null);
    setDemoLoading(true);
    try {
      await loginAsDemoStudent();
    } catch (err: any) {
      setError(parseFirebaseError(err));
    } finally {
      setDemoLoading(false);
    }
  };

  const fillDemoCredentials = () => {
    setEmail("student.demo@viora.ai");
    setPassword("VioraDemo2026!");
    setMode("login");
    setError(null);
  };

  return (
    <div className="min-h-screen bg-[#F6F8FC] dark:bg-[#0B1329] text-[#16233C] dark:text-slate-100 flex flex-col justify-between selection:bg-blue-100 selection:text-[#2F6FED] transition-colors">
      {/* Top minimal brand bar */}
      <header className="w-full border-b border-slate-200/80 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <VioraLogo variant="horizontal" size="md" />
          </div>
          <div className="flex items-center gap-3">
            <ThemeToggle />
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 dark:text-slate-400 bg-slate-100/80 dark:bg-slate-800/80 px-3 py-1.5 rounded-full border border-slate-200/60 dark:border-slate-700">
              <Lock className="w-3.5 h-3.5 text-[#2F6FED]" />
              <span className="hidden sm:inline">Secure Authentication Required</span>
              <span className="sm:hidden">Secure</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Authentication Card & Hero Grid */}
      <main className="flex-1 flex items-center justify-center p-4 sm:p-8">
        <div className="max-w-4xl w-full grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          {/* Left: Brand Highlights & Trust Badges */}
          <div className="lg:col-span-6 space-y-6 text-left order-2 lg:order-1 px-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-950/60 border border-blue-100 dark:border-blue-900/60 text-[#2F6FED] dark:text-blue-400 text-xs font-semibold">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Sign In to Unlock Full Platform</span>
            </div>

            <div className="space-y-2">
              <h1 className="text-3xl sm:text-4xl font-extrabold text-[#0B1A33] dark:text-white tracking-tight leading-tight">
                Master Oral Exams & Technical Interviews
              </h1>
              <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                Viora AI provides strict, realistic oral examinations grounded directly in your syllabus
                or resume. Authenticate your account to access your personal viva sessions and mock interview history.
              </p>
            </div>

            {/* Feature Highlights */}
            <div className="space-y-3 pt-2">
              <div className="flex items-start gap-3 p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/70 dark:border-slate-800 shadow-2xs">
                <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-[#2F6FED] dark:text-blue-400 flex items-center justify-center shrink-0 mt-0.5">
                  <BookOpen className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-[#0B1A33] dark:text-white">Academic Viva Defense</h4>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Upload your syllabus or chapter to face examiner-style counter-questions and depth probes.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/70 dark:border-slate-800 shadow-2xs">
                <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 mt-0.5">
                  <UserCheck className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-[#0B1A33] dark:text-white">Real Mock Interviews</h4>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Upload your resume to get behavioral, architectural, and project-specific questions.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/70 dark:border-slate-800 shadow-2xs">
                <div className="w-8 h-8 rounded-lg bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0 mt-0.5">
                  <Video className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-[#0B1A33] dark:text-white">Camera Coach & Cloud Storage</h4>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Live posture and eye-contact feedback, with all reports synced securely to your Firebase profile.
                  </p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 text-xs text-slate-400 dark:text-slate-500 pt-1">
              <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span>End-to-end user privacy protected by Firebase Authentication</span>
            </div>
          </div>

          {/* Right: Auth Card */}
          <div className="lg:col-span-6 order-1 lg:order-2">
            <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200/80 dark:border-slate-800 overflow-hidden">
              {/* Header */}
              <div className="p-6 pb-4 border-b border-slate-100 dark:border-slate-800 text-center">
                <div className="flex justify-center mb-3">
                  <VioraLogo variant="mark" size="md" />
                </div>
                <h2 className="text-xl font-bold text-[#0B1A33] dark:text-white">
                  {mode === "login" && "Welcome to Viora AI"}
                  {mode === "signup" && "Create Your Account"}
                  {mode === "forgot" && "Reset Password"}
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-xs mx-auto">
                  {mode === "login" && "Please log in with your credentials to access the platform."}
                  {mode === "signup" && "Create a free student or candidate account to get started."}
                  {mode === "forgot" && "Enter your email to receive a secure password recovery link."}
                </p>

                {/* Tabs */}
                {mode !== "forgot" && (
                  <div className="flex items-center p-1 bg-slate-100 dark:bg-slate-800 rounded-xl mt-4 max-w-xs mx-auto">
                    <button
                      id="auth-screen-tab-login"
                      type="button"
                      onClick={() => {
                        setMode("login");
                        setError(null);
                      }}
                      className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                        mode === "login"
                          ? "bg-white dark:bg-slate-700 text-[#0B1A33] dark:text-white shadow-xs"
                          : "text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white"
                      }`}
                    >
                      Log In
                    </button>
                    <button
                      id="auth-screen-tab-signup"
                      type="button"
                      onClick={() => {
                        setMode("signup");
                        setError(null);
                      }}
                      className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                        mode === "signup"
                          ? "bg-white dark:bg-slate-700 text-[#0B1A33] dark:text-white shadow-xs"
                          : "text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white"
                      }`}
                    >
                      Create Account
                    </button>
                  </div>
                )}
              </div>

              {/* Form Body */}
              <div className="p-6 space-y-4">
                {/* Error Banner */}
                {error && authErrorCode !== "auth/unauthorized-domain" && (
                  <div className="flex items-start gap-2.5 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs leading-relaxed">
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-500" />
                    <div>{error}</div>
                  </div>
                )}

                {/* Specific Firebase Domain Authorization Guide Card */}
                {authErrorCode === "auth/unauthorized-domain" && (
                  <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 space-y-2.5 text-xs">
                    <div className="flex items-start gap-2">
                      <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                      <div>
                        <h4 className="font-bold text-amber-950">Firebase Domain Authorization Required</h4>
                        <p className="text-[11px] text-amber-800 mt-0.5 leading-relaxed">
                          Firebase requires this Cloud Run preview domain to be registered under <strong>Authorized domains</strong> before Google Sign-In can open.
                        </p>
                      </div>
                    </div>

                    <div className="bg-white/90 p-2 rounded-lg border border-amber-200 flex items-center justify-between gap-2 text-[11px]">
                      <span className="font-mono truncate text-slate-700 select-all font-semibold">{currentHostname}</span>
                      <button
                        type="button"
                        onClick={handleCopyHostname}
                        className="inline-flex items-center gap-1 px-2.5 py-1 bg-amber-100 hover:bg-amber-200 text-amber-800 font-semibold rounded shrink-0 transition-colors"
                      >
                        {copiedDomain ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                        <span>{copiedDomain ? "Copied!" : "Copy Domain"}</span>
                      </button>
                    </div>

                    <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                      <a
                        href={`https://console.firebase.google.com/project/${firebaseConfig.projectId}/authentication/settings`}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 text-[11px] text-[#2F6FED] font-semibold hover:underline"
                      >
                        <span>Open Firebase Console Settings</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                      <button
                        type="button"
                        onClick={handleDemoSignIn}
                        className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-100 hover:bg-emerald-200 px-2.5 py-1 rounded-lg transition-colors"
                      >
                        <Zap className="w-3 h-3" />
                        <span>Instant Student Sign-In</span>
                      </button>
                    </div>
                  </div>
                )}

                {/* Success Banner */}
                {successMsg && (
                  <div className="flex items-start gap-2.5 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs leading-relaxed">
                    <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-emerald-600" />
                    <div>{successMsg}</div>
                  </div>
                )}

                {/* Fast 1-Click Student Demo Access & Google Sign-In */}
                {mode !== "forgot" && (
                  <div className="space-y-2.5">
                    {/* Instant 1-Click Student Demo */}
                    <button
                      id="auth-screen-demo-btn"
                      type="button"
                      onClick={handleDemoSignIn}
                      disabled={demoLoading || submitting || googleLoading}
                      className="w-full flex items-center justify-between px-4 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold text-xs rounded-xl shadow-xs hover:shadow transition-all disabled:opacity-60"
                    >
                      <div className="flex items-center gap-2">
                        {demoLoading ? (
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        ) : (
                          <Zap className="w-4 h-4 text-amber-300" />
                        )}
                        <span>Instant Demo Access (Student Account)</span>
                      </div>
                      <span className="text-[10px] bg-white/20 px-2 py-0.5 rounded-full font-medium">1-Click</span>
                    </button>

                    {/* Google Sign-In */}
                    <button
                      id="auth-screen-google-btn"
                      type="button"
                      onClick={handleGoogleSignIn}
                      disabled={googleLoading || submitting || demoLoading}
                      className="w-full flex items-center justify-center gap-3 px-4 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-200 font-semibold text-xs rounded-xl shadow-2xs transition-all disabled:opacity-60"
                    >
                      {googleLoading ? (
                        <div className="w-4 h-4 border-2 border-slate-400 border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <svg className="w-4 h-4" viewBox="0 0 24 24">
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
                      )}
                      <span>Continue with Google</span>
                    </button>

                    <div className="relative flex items-center justify-center my-3">
                      <div className="border-t border-slate-200 dark:border-slate-800 w-full" />
                      <span className="bg-white dark:bg-slate-900 px-3 text-[11px] text-slate-400 dark:text-slate-500 font-medium tracking-wide uppercase">
                        Or continue with email
                      </span>
                    </div>
                  </div>
                )}

                {/* Email Form */}
                <form onSubmit={handleEmailSubmit} className="space-y-3.5">
                  {mode === "signup" && (
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        Full Name
                      </label>
                      <div className="relative">
                        <UserIcon className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                        <input
                          id="screen-signup-name-input"
                          type="text"
                          required
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          placeholder="e.g. Rahul Sharma"
                          className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-xl focus:bg-white dark:focus:bg-slate-800 focus:outline-hidden focus:border-[#2F6FED] focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-900/40 transition-all"
                        />
                      </div>
                    </div>
                  )}

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Email Address
                    </label>
                    <div className="relative">
                      <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        id="screen-auth-email-input"
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="name@example.com"
                        className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-xl focus:bg-white dark:focus:bg-slate-800 focus:outline-hidden focus:border-[#2F6FED] focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-900/40 transition-all"
                      />
                    </div>
                  </div>

                  {mode !== "forgot" && (
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                          Password
                        </label>
                        <div className="flex items-center gap-2">
                          {mode === "login" && (
                            <>
                              <button
                                type="button"
                                onClick={fillDemoCredentials}
                                className="text-[11px] font-medium text-slate-500 dark:text-slate-400 hover:text-[#2F6FED] dark:hover:text-blue-400 transition-colors"
                                title="Fills demo student credentials"
                              >
                                Auto-fill Demo
                              </button>
                              <span className="text-slate-300 dark:text-slate-600">•</span>
                              <button
                                id="screen-forgot-password-btn"
                                type="button"
                                onClick={() => {
                                  setMode("forgot");
                                  setError(null);
                                  setSuccessMsg(null);
                                }}
                                className="text-[11px] font-medium text-[#2F6FED] dark:text-blue-400 hover:underline"
                              >
                                Forgot password?
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                      <div className="relative">
                        <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                        <input
                          id="screen-auth-password-input"
                          type={showPassword ? "text" : "password"}
                          required
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          placeholder={mode === "signup" ? "At least 6 characters" : "••••••••"}
                          className="w-full pl-9 pr-9 py-2 text-xs bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-xl focus:bg-white dark:focus:bg-slate-800 focus:outline-hidden focus:border-[#2F6FED] focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-900/40 transition-all"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 p-1"
                          title={showPassword ? "Hide password" : "Show password"}
                        >
                          {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    </div>
                  )}

                  {mode === "signup" && (
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        Confirm Password
                      </label>
                      <div className="relative">
                        <KeyRound className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                        <input
                          id="screen-signup-confirm-password-input"
                          type={showPassword ? "text" : "password"}
                          required
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          placeholder="Re-enter password"
                          className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-xl focus:bg-white dark:focus:bg-slate-800 focus:outline-hidden focus:border-[#2F6FED] focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-900/40 transition-all"
                        />
                      </div>
                    </div>
                  )}

                  <button
                    id="screen-auth-submit-btn"
                    type="submit"
                    disabled={submitting || googleLoading}
                    className="w-full mt-2 flex items-center justify-center gap-2 py-2.5 px-4 bg-gradient-to-r from-[#0B1A33] to-[#2F6FED] hover:opacity-95 text-white font-semibold text-xs rounded-xl shadow-sm hover:shadow-md transition-all disabled:opacity-60"
                  >
                    {submitting ? (
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : mode === "login" ? (
                      <>
                        <span>Log In & Start Practicing</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </>
                    ) : mode === "signup" ? (
                      <>
                        <span>Create Free Account</span>
                        <Sparkles className="w-3.5 h-3.5 text-blue-200" />
                      </>
                    ) : (
                      <>
                        <span>Send Password Reset Link</span>
                        <Mail className="w-3.5 h-3.5" />
                      </>
                    )}
                  </button>
                </form>

                {mode === "forgot" && (
                  <div className="text-center pt-2">
                    <button
                      type="button"
                      onClick={() => {
                        setMode("login");
                        setError(null);
                        setSuccessMsg(null);
                      }}
                      className="text-xs font-semibold text-[#2F6FED] dark:text-blue-400 hover:underline"
                    >
                      Back to Log In
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200/80 dark:border-slate-800/80 bg-white/60 dark:bg-slate-900/60 py-4 text-center text-xs text-slate-500 dark:text-slate-400">
        <div className="max-w-6xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <VioraLogo variant="mark" size="xs" />
            <span className="font-bold text-[#0B1A33] dark:text-white">Viora AI</span>
            <span>—</span>
            <span>Oral Viva & Mock Interview Practice Platform</span>
          </div>
          <span className="text-[11px] text-slate-400 dark:text-slate-500">
            Protected by Firebase Authentication & Firestore
          </span>
        </div>
      </footer>
    </div>
  );
};
