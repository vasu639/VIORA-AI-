import React from "react";
import {
  BookOpen,
  UserCheck,
  ArrowRight,
  Sparkles,
  Mic,
  Camera,
  FileCheck,
  ShieldCheck,
  Zap,
  TrendingUp,
} from "lucide-react";
import { AssessmentMode } from "../types";
import { VioraLogo } from "../components/VioraLogo";
import { useAuth } from "../context/AuthContext";

interface LandingProps {
  onStartMode: (mode: AssessmentMode) => void;
  onOpenHistory: () => void;
  onOpenImprovementReport?: () => void;
  pastSessionCount: number;
}

export const Landing: React.FC<LandingProps> = ({
  onStartMode,
  onOpenHistory,
  onOpenImprovementReport,
  pastSessionCount,
}) => {
  const { user, openAuthModal } = useAuth();

  return (
    <div className="max-w-4xl mx-auto space-y-12 py-6 sm:py-10">
      {/* Hero Section */}
      <div className="text-center space-y-4 max-w-2xl mx-auto px-4">
        {/* Official Viora AI Logo Tile */}
        <div className="flex justify-center pt-1">
          <VioraLogo variant="full" size="sm" />
        </div>

        {/* Subtle Badge */}
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-950/60 border border-blue-100 dark:border-blue-900/60 text-[#2F6FED] dark:text-blue-400 text-xs font-semibold">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Real-Time Oral Viva & Interview Prep Platform</span>
        </div>

        {/* Hero Title */}
        <h1 className="text-3xl sm:text-5xl font-black text-[#0B1A33] dark:text-white tracking-tight leading-tight">
          Master Your Oral Defense & Technical Interviews.
        </h1>

        {/* Overview Subtitle */}
        <p className="text-base sm:text-lg text-slate-600 dark:text-slate-300 leading-relaxed">
          Upload what you're being tested on — a <strong className="text-[#0B1A33] dark:text-white font-semibold">syllabus</strong> or a{" "}
          <strong className="text-[#0B1A33] dark:text-white font-semibold">resume</strong> — and Viora AI asks you the questions a real examiner or interviewer would.
        </p>

        {/* Account & Cloud Sync Status */}
        <div className="pt-2">
          {user && (
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200/80 dark:border-emerald-900/60 rounded-full text-xs text-emerald-800 dark:text-emerald-300 font-medium">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>
                Authenticated as <strong className="font-bold">{user.displayName || user.email}</strong> • Practice sessions auto-synced to Firebase
              </span>
            </div>
          )}
        </div>
      </div>

      {/* The Two Main Mode Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 px-4">
        {/* Card 1: Viva Voce Mode */}
        <div
          onClick={() => onStartMode("viva")}
          className="group relative bg-white dark:bg-slate-900 border-2 border-slate-200/90 dark:border-slate-800 hover:border-[#2F6FED] dark:hover:border-[#2F6FED] rounded-2xl p-6 sm:p-8 shadow-xs hover:shadow-xl transition-all duration-300 flex flex-col justify-between cursor-pointer"
        >
          <div className="space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-blue-50 dark:bg-blue-950/60 text-[#2F6FED] dark:text-blue-400 border border-blue-100 dark:border-blue-900/60 flex items-center justify-center group-hover:scale-110 group-hover:bg-[#2F6FED] group-hover:text-white transition-all duration-200">
              <BookOpen className="w-7 h-7" />
            </div>

            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#2F6FED] dark:text-blue-400 bg-blue-50 dark:bg-blue-950/60 px-2.5 py-0.5 rounded-full border border-blue-100 dark:border-blue-900/60">
                Academic & Semester Defense
              </span>
              <h2 className="text-2xl font-extrabold text-[#0B1A33] dark:text-white tracking-tight mt-2 group-hover:text-[#2F6FED] transition-colors">
                Viva Voce Mode
              </h2>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 mt-2 leading-relaxed">
                Upload your semester syllabus or course curriculum. Viora AI reads every module to simulate an authentic oral viva-voce examination pitched to your chosen difficulty.
              </p>
            </div>

            <div className="space-y-1.5 pt-2 text-xs text-slate-500 dark:text-slate-400 font-medium">
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-[#2F6FED]" />
                <span>Compulsory syllabus PDF upload</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-[#2F6FED]" />
                <span>Beginner, Intermediate, or Advanced difficulty</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-[#2F6FED]" />
                <span>Topic-by-topic examiner questioning</span>
              </div>
            </div>
          </div>

          <div className="pt-6 mt-6 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <span className="text-xs font-bold text-[#0B1A33] dark:text-white group-hover:text-[#2F6FED] dark:group-hover:text-blue-400">
              Start Viva Voce
            </span>
            <div className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-slate-800 group-hover:bg-[#2F6FED] group-hover:text-white flex items-center justify-center text-slate-600 dark:text-slate-300 transition-colors">
              <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
            </div>
          </div>
        </div>

        {/* Card 2: Interview Practice Mode */}
        <div
          onClick={() => onStartMode("interview")}
          className="group relative bg-white dark:bg-slate-900 border-2 border-slate-200/90 dark:border-slate-800 hover:border-emerald-500 dark:hover:border-emerald-500 rounded-2xl p-6 sm:p-8 shadow-xs hover:shadow-xl transition-all duration-300 flex flex-col justify-between cursor-pointer"
        >
          <div className="space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-900/60 flex items-center justify-center group-hover:scale-110 group-hover:bg-emerald-600 group-hover:text-white transition-all duration-200">
              <UserCheck className="w-7 h-7" />
            </div>

            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2.5 py-0.5 rounded-full border border-emerald-100 dark:border-emerald-900/60">
                Job & Industry Preparation
              </span>
              <h2 className="text-2xl font-extrabold text-[#0B1A33] dark:text-white tracking-tight mt-2 group-hover:text-emerald-500 transition-colors">
                Interview Mode
              </h2>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 mt-2 leading-relaxed">
                Upload your resume or CV. Viora AI analyzes your actual listed skills, past companies, and system achievements to ask strictly grounded questions — never generic filler.
              </p>
            </div>

            <div className="space-y-1.5 pt-2 text-xs text-slate-500 dark:text-slate-400 font-medium">
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                <span>Compulsory resume PDF upload</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                <span>4 Sub-modes: Technical, Behavioral, Managerial, Rapid Fire</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                <span>Questions tied directly to your listed projects</span>
              </div>
            </div>
          </div>

          <div className="pt-6 mt-6 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <span className="text-xs font-bold text-[#0B1A33] dark:text-white group-hover:text-emerald-500">
              Start Mock Interview
            </span>
            <div className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-slate-800 group-hover:bg-emerald-600 group-hover:text-white flex items-center justify-center text-slate-600 dark:text-slate-300 transition-colors">
              <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
            </div>
          </div>
        </div>
      </div>

      {/* Core Capabilities (Voice, Camera, Multimodal AI) */}
      <div className="px-4">
        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-6 shadow-2xs grid grid-cols-1 sm:grid-cols-3 gap-6">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-[#2F6FED] dark:text-blue-400 flex items-center justify-center shrink-0">
              <FileCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-xs font-bold text-[#0B1A33] dark:text-white">Native PDF Grounding</h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed">
                Gemini 3.8 Flash reads complex multi-column resumes and syllabus tables natively without broken text extractors.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0">
              <Mic className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-xs font-bold text-[#0B1A33] dark:text-white">Oral Speech & Voice</h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed">
                Browser-native text-to-speech reads examiner questions aloud, with live speech-to-text for natural oral answers.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
              <Camera className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-xs font-bold text-[#0B1A33] dark:text-white">Posture & Eye Contact Coach</h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed">
                Optional snapshot analysis gives friendly, encouraging coach tips on eye-contact, presence, and camera framing.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Quick History & Improvement Access Banner */}
      {pastSessionCount > 0 && (
        <div className="px-4">
          <div className="bg-gradient-to-r from-blue-50/80 via-white to-indigo-50/80 dark:from-slate-900 dark:via-slate-900/90 dark:to-blue-950/40 border border-blue-200/80 dark:border-slate-800 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-2xs">
            <div className="flex items-center gap-3 text-left">
              <div className="w-10 h-10 rounded-xl bg-[#2F6FED] text-white flex items-center justify-center shrink-0 shadow-xs">
                <TrendingUp className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-xs sm:text-sm font-bold text-[#0B1A33] dark:text-white">
                  Candidate Improvement & Growth Trajectory
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {pastSessionCount} recorded practice session{pastSessionCount > 1 ? "s" : ""} • Track accuracy trends & download full audit report
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={onOpenHistory}
                className="px-3.5 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 hover:border-slate-400 dark:hover:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-750 rounded-xl transition-all shadow-2xs"
              >
                Past Attempts
              </button>

              {onOpenImprovementReport && (
                <button
                  type="button"
                  onClick={onOpenImprovementReport}
                  className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-[#2F6FED] hover:bg-blue-600 rounded-xl shadow-xs transition-colors"
                >
                  <TrendingUp className="w-3.5 h-3.5" />
                  <span>View Improvement Report</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
