import React, { useState } from "react";
import {
  X,
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
  Copy,
  Check,
  ExternalLink,
  Zap,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import {
  registerWithEmail,
  loginWithEmail,
  loginWithGoogle,
  loginAsDemoStudent,
  resetPassword,
  firebaseConfig,
} from "../lib/firebase";
import { VioraLogo } from "./VioraLogo";

export const AuthModal: React.FC = () => {
  const { authModalOpen, authModalMode, closeAuthModal, openAuthModal, loginAsGuestStudent } = useAuth();

  const [mode, setMode] = useState<"login" | "signup" | "forgot">(
    authModalMode === "signup" ? "signup" : "login"
  );

  // Sync mode if context opened with specific mode
  React.useEffect(() => {
    if (authModalOpen) {
      setMode(authModalMode === "signup" ? "signup" : "login");
      setError(null);
      setAuthErrorCode(null);
      setSuccessMsg(null);
    }
  }, [authModalOpen, authModalMode]);

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

  const handleCopyHostname = () => {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(currentHostname);
      setCopiedDomain(true);
      setTimeout(() => setCopiedDomain(false), 2500);
    }
  };

  if (!authModalOpen) return null;

  // Format Firebase error codes into friendly user messages
  const parseFirebaseError = (err: any): string => {
    const code = err?.code || "";
    const msg = err?.message || "";
    setAuthErrorCode(code);

    if (code === "auth/unauthorized-domain") {
      return `Domain Authorization Required: This domain (${currentHostname}) is not yet added to your Firebase Authorized Domains list.`;
    }
    if (code === "auth/popup-blocked") {
      return "The Google sign-in popup was blocked by browser or iframe settings. Please allow popups or use the 1-Click Demo / Email login.";
    }
    if (code === "auth/email-already-in-use") {
      return "An account with this email already exists. Please log in.";
    }
    if (code === "auth/invalid-credential" || code === "auth/wrong-password" || code === "auth/user-not-found") {
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
        setSuccessMsg("Password reset link sent! Check your email inbox.");
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
        closeAuthModal();
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
        closeAuthModal();
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
      closeAuthModal();
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
      const demoResult = await loginAsDemoStudent();
      if ((demoResult as any)?.isGuestDemo) {
        loginAsGuestStudent("Demo Student");
      }
      closeAuthModal();
    } catch (err: any) {
      console.warn("Falling back to local student session:", err);
      loginAsGuestStudent("Demo Student");
      closeAuthModal();
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
    <div
      id="viora-auth-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 dark:bg-black/75 backdrop-blur-xs transition-opacity duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget) closeAuthModal();
      }}
    >
      <div
        id="viora-auth-modal"
        className="w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-100 dark:border-slate-800 overflow-hidden relative animate-in fade-in zoom-in-95 duration-200"
      >
        {/* Close Button */}
        <button
          id="close-auth-modal-btn"
          onClick={closeAuthModal}
          className="absolute top-4 right-4 p-1.5 text-slate-400 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors"
          title="Close dialog"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="p-6 pb-4 border-b border-slate-100 dark:border-slate-800 text-center">
          <div className="flex justify-center mb-3">
            <VioraLogo variant="mark" size="md" />
          </div>
          <h2 className="text-xl font-bold text-[#0B1A33] dark:text-white">
            {mode === "login" && "Welcome Back to Viora AI"}
            {mode === "signup" && "Create Your Viora AI Account"}
            {mode === "forgot" && "Reset Your Password"}
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-xs mx-auto">
            {mode === "login" && "Log in to save your viva assessments and mock interview reports."}
            {mode === "signup" && "Start your personalized oral exam and mock interview journey."}
            {mode === "forgot" && "Enter your registered email address to receive a secure recovery link."}
          </p>

          {/* Mode Tabs (Only when not in forgot password mode) */}
          {mode !== "forgot" && (
            <div className="flex items-center p-1 bg-slate-100 dark:bg-slate-800 rounded-xl mt-4 max-w-xs mx-auto">
              <button
                id="tab-switch-login"
                type="button"
                onClick={() => {
                  setMode("login");
                  setError(null);
                }}
                className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                  mode === "login"
                    ? "bg-white dark:bg-slate-700 text-[#0B1A33] dark:text-white shadow-xs"
                    : "text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"
                }`}
              >
                Log In
              </button>
              <button
                id="tab-switch-signup"
                type="button"
                onClick={() => {
                  setMode("signup");
                  setError(null);
                }}
                className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                  mode === "signup"
                    ? "bg-white dark:bg-slate-700 text-[#0B1A33] dark:text-white shadow-xs"
                    : "text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"
                }`}
              >
                Create Account
              </button>
            </div>
          )}
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-4">
          {/* Status Message Banners */}
          {error && authErrorCode !== "auth/unauthorized-domain" && (
            <div className="flex items-start gap-2.5 p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 text-rose-700 dark:text-rose-300 text-xs leading-relaxed">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-500" />
              <div>{error}</div>
            </div>
          )}

          {/* Specific Firebase Domain Authorization Guide Card */}
          {authErrorCode === "auth/unauthorized-domain" && (
            <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60 text-amber-900 dark:text-amber-200 space-y-3 text-xs">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-start gap-2.5">
                  <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-bold text-amber-950 dark:text-amber-100 text-xs">
                      1-Step Action: Authorize Domain for Google Sign-In
                    </h4>
                    <p className="text-[11px] text-amber-800 dark:text-amber-300 mt-0.5 leading-relaxed">
                      Google OAuth requires your Cloud Run domain to be added to <strong>Authorized domains</strong> in Firebase project <strong className="font-mono text-amber-900 dark:text-amber-200">{firebaseConfig.projectId}</strong>.
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setAuthErrorCode(null)}
                  className="text-amber-600 hover:text-amber-800 dark:text-amber-400 p-1 rounded hover:bg-amber-100 dark:hover:bg-amber-900/50 transition-colors"
                  title="Dismiss warning"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* 3 Quick Steps */}
              <div className="bg-amber-100/70 dark:bg-amber-950/60 p-2.5 rounded-lg border border-amber-200/80 dark:border-amber-900/50 space-y-1.5 text-[11px] text-amber-900 dark:text-amber-200">
                <div className="font-semibold text-amber-950 dark:text-amber-100">How to authorize in 15 seconds:</div>
                <ol className="list-decimal list-inside space-y-1 text-[11px] text-amber-800 dark:text-amber-300">
                  <li>
                    Click{" "}
                    <a
                      href={`https://console.firebase.google.com/project/${firebaseConfig.projectId}/authentication/settings`}
                      target="_blank"
                      rel="noreferrer"
                      className="font-semibold text-blue-700 dark:text-blue-400 underline hover:text-blue-800"
                    >
                      Open Firebase Authorized Domains ↗
                    </a>
                  </li>
                  <li>Scroll down to <strong>Authorized domains</strong> and click <strong>Add domain</strong>.</li>
                  <li>Paste the domain below and click <strong>Save</strong>.</li>
                </ol>
              </div>

              {/* Domain Copy Box */}
              <div className="bg-white/95 dark:bg-slate-900/90 p-2 rounded-lg border border-amber-200 dark:border-amber-800/60 flex items-center justify-between gap-2 text-[11px]">
                <span className="font-mono truncate text-slate-800 dark:text-slate-200 select-all font-semibold">
                  {currentHostname}
                </span>
                <button
                  type="button"
                  onClick={handleCopyHostname}
                  className="inline-flex items-center gap-1 px-2.5 py-1 bg-amber-100 dark:bg-amber-900/60 hover:bg-amber-200 dark:hover:bg-amber-800/80 text-amber-900 dark:text-amber-200 font-semibold rounded shrink-0 transition-colors"
                >
                  {copiedDomain ? <Check className="w-3 h-3 text-emerald-600 dark:text-emerald-400" /> : <Copy className="w-3 h-3" />}
                  <span>{copiedDomain ? "Copied!" : "Copy Domain"}</span>
                </button>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2 pt-1">
                {/* Instant Bypass Button */}
                <button
                  type="button"
                  onClick={handleDemoSignIn}
                  className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg shadow-xs transition-colors"
                >
                  <Zap className="w-3.5 h-3.5 text-amber-300" />
                  <span>Continue as Student (Bypass Setup)</span>
                </button>

                <div className="flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={handleGoogleSignIn}
                    disabled={googleLoading}
                    className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white px-2.5 py-1 rounded bg-amber-100/60 dark:bg-amber-900/40 hover:bg-amber-200/70 transition-colors"
                  >
                    <span>Retry Google Sign-In</span>
                  </button>
                  <a
                    href={`https://console.firebase.google.com/project/${firebaseConfig.projectId}/authentication/settings`}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-[11px] text-blue-600 dark:text-blue-400 font-semibold hover:underline"
                  >
                    <span>Settings</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </div>
            </div>
          )}

          {successMsg && (
            <div className="flex items-start gap-2.5 p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/60 text-emerald-800 dark:text-emerald-300 text-xs leading-relaxed">
              <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-emerald-600" />
              <div>{successMsg}</div>
            </div>
          )}

          {/* 1-Click Fast Access & Google Sign-In */}
          {mode !== "forgot" && (
            <div className="space-y-2.5">
              {/* Instant 1-Click Student Demo */}
              <button
                id="modal-demo-btn"
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

              <button
                id="google-signin-btn"
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

          {/* Form */}
          <form onSubmit={handleEmailSubmit} className="space-y-3.5">
            {/* Full Name for Create Account */}
            {mode === "signup" && (
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Full Name
                </label>
                <div className="relative">
                  <UserIcon className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    id="signup-name-input"
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Rahul Sharma"
                    className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl focus:bg-white dark:focus:bg-slate-800 focus:outline-hidden focus:border-[#2F6FED] focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-900/40 transition-all placeholder:text-slate-400 dark:placeholder:text-slate-500"
                  />
                </div>
              </div>
            )}

            {/* Email Address */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  id="auth-email-input"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl focus:bg-white dark:focus:bg-slate-800 focus:outline-hidden focus:border-[#2F6FED] focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-900/40 transition-all placeholder:text-slate-400 dark:placeholder:text-slate-500"
                />
              </div>
            </div>

            {/* Password Field (only for login and signup) */}
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
                        <span className="text-slate-300 dark:text-slate-700">•</span>
                        <button
                          id="forgot-password-btn"
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
                    id="auth-password-input"
                    type={showPassword ? "text" : "password"}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder={mode === "signup" ? "At least 6 characters" : "••••••••"}
                    className="w-full pl-9 pr-9 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl focus:bg-white dark:focus:bg-slate-800 focus:outline-hidden focus:border-[#2F6FED] focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-900/40 transition-all placeholder:text-slate-400 dark:placeholder:text-slate-500"
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

            {/* Confirm Password for signup */}
            {mode === "signup" && (
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Confirm Password
                </label>
                <div className="relative">
                  <KeyRound className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    id="signup-confirm-password-input"
                    type={showPassword ? "text" : "password"}
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Re-enter password"
                    className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl focus:bg-white dark:focus:bg-slate-800 focus:outline-hidden focus:border-[#2F6FED] focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-900/40 transition-all placeholder:text-slate-400 dark:placeholder:text-slate-500"
                  />
                </div>
              </div>
            )}

            {/* Submit Action Button */}
            <button
              id="auth-submit-btn"
              type="submit"
              disabled={submitting || googleLoading}
              className="w-full mt-2 flex items-center justify-center gap-2 py-2.5 px-4 bg-gradient-to-r from-[#0B1A33] to-[#2F6FED] hover:opacity-95 text-white font-semibold text-xs rounded-xl shadow-sm hover:shadow-md transition-all disabled:opacity-60"
            >
              {submitting ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : mode === "login" ? (
                <>
                  <span>Log In to Viora AI</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </>
              ) : mode === "signup" ? (
                <>
                  <span>Create Account</span>
                  <Sparkles className="w-3.5 h-3.5 text-blue-200" />
                </>
              ) : (
                <>
                  <span>Send Reset Link</span>
                  <Mail className="w-3.5 h-3.5" />
                </>
              )}
            </button>
          </form>

          {/* Footer Back/Switch */}
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
  );
};
