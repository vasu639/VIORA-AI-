import React from "react";
import {
  Upload,
  Github,
  CheckCircle2,
  Sparkles,
  ArrowRight,
  BookOpen,
  UserCheck,
  FolderGit2,
  Award,
  ShieldCheck,
  Zap,
  Target,
  FileCheck,
  ExternalLink,
} from "lucide-react";
import { AssessmentMode, DifficultyLevel } from "../types";
import { VioraLogo } from "../components/VioraLogo";
import { useAuth } from "../context/AuthContext";
import { LandingFileInput } from "../components/LandingFileInput";

interface LandingProps {
  onStartMode: (mode: AssessmentMode) => void;
  onLaunchVivaWithDoc?: (payload: {
    file: File | null;
    fileBase64: string | null;
    textContent: string | null;
    courseName: string;
    difficulty: DifficultyLevel;
    numQuestions: number;
  }) => void;
  onOpenHistory: () => void;
  onOpenImprovementReport?: () => void;
  pastSessionCount: number;
}

export const Landing: React.FC<LandingProps> = ({
  onStartMode,
  onLaunchVivaWithDoc,
  onOpenHistory,
  onOpenImprovementReport,
  pastSessionCount,
}) => {
  const { user } = useAuth();

  const scrollToHowItWorks = () => {
    const el = document.getElementById("how-it-works");
    if (el) {
      el.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-16 py-6 sm:py-12 px-4">
      {/* 1. Hero Section */}
      <section className="text-center space-y-6 max-w-3xl mx-auto">
        {/* Brand Mark */}
        <div className="flex justify-center pt-2">
          <VioraLogo variant="full" size="md" />
        </div>

        {/* EduTech Domain Badge */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-50 dark:bg-blue-950/70 border border-blue-200/80 dark:border-blue-900/80 text-[#2F6FED] dark:text-blue-400 text-xs font-bold shadow-2xs">
          <Sparkles className="w-3.5 h-3.5" />
          <span>EduTech Evidence-Based Learning Coach</span>
        </div>

        {/* Hero Title */}
        <h1 className="text-4xl sm:text-6xl font-black text-[#0B1A33] dark:text-white tracking-tight leading-[1.1]">
          Turn Your Projects Into Proof.
        </h1>

        {/* Hero Subtitle */}
        <p className="text-lg sm:text-xl font-medium text-slate-700 dark:text-slate-200 leading-relaxed">
          Viora verifies the skills you claim from your real GitHub work, then gives you a practical plan to build what is missing.
        </p>

        {/* Supporting Message */}
        <p className="text-sm sm:text-base text-slate-500 dark:text-slate-400 max-w-2xl mx-auto leading-relaxed">
          “Don’t just claim skills. Show the work behind them, discover what to learn next, and build evidence others can verify.”
        </p>

        {/* CTAs */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-3">
          <button
            onClick={() => onStartMode("interview")}
            className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-[#2F6FED] hover:bg-blue-600 text-white font-extrabold text-sm flex items-center justify-center gap-2.5 shadow-lg shadow-blue-500/25 hover:shadow-xl hover:-translate-y-0.5 transition-all"
          >
            <span>Analyze My Skills</span>
            <ArrowRight className="w-4 h-4" />
          </button>

          <button
            onClick={scrollToHowItWorks}
            className="w-full sm:w-auto px-6 py-4 rounded-2xl bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-800 font-bold text-sm transition-all"
          >
            See How It Works
          </button>
        </div>

        {/* Authenticated Sync Badge */}
        {user && (
          <div className="pt-2">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200/80 dark:border-emerald-900/60 rounded-full text-xs text-emerald-800 dark:text-emerald-300 font-medium">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>
                Authenticated as <strong className="font-bold">{user.displayName || user.email}</strong> • Learning reports auto-synced
              </span>
            </div>
          </div>
        )}
      </section>

      {/* 2. Three-Step Visual Flow */}
      <section id="how-it-works" className="space-y-6 pt-6">
        <div className="text-center space-y-1">
          <span className="text-xs font-bold uppercase tracking-wider text-[#2F6FED] dark:text-blue-400">
            How Viora Works
          </span>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-[#0B1A33] dark:text-white tracking-tight">
            From Claimed Skills to Verifiable Portfolio Proof
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Step 1 */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-3xl p-6 shadow-xs relative overflow-hidden space-y-4 hover:border-blue-400 transition-colors">
            <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-950/80 text-[#2F6FED] font-black text-lg flex items-center justify-center border border-blue-100 dark:border-blue-900">
              1
            </div>
            <div className="space-y-2">
              <h3 className="text-lg font-bold text-[#0B1A33] dark:text-white">
                Upload Resume + Connect GitHub
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                Provide your resume PDF and public GitHub username. Paste your target job description or choose a learning goal.
              </p>
            </div>
            <div className="flex items-center gap-2 pt-2 text-xs font-semibold text-slate-400">
              <Upload className="w-3.5 h-3.5 text-blue-500" />
              <span>PDF Parsing & GitHub API Sync</span>
            </div>
          </div>

          {/* Step 2 */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-3xl p-6 shadow-xs relative overflow-hidden space-y-4 hover:border-emerald-400 transition-colors">
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-950/80 text-emerald-600 font-black text-lg flex items-center justify-center border border-emerald-100 dark:border-emerald-900">
              2
            </div>
            <div className="space-y-2">
              <h3 className="text-lg font-bold text-[#0B1A33] dark:text-white">
                Get Evidence-Based Skill Verification
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                Each skill is classified as <strong className="text-emerald-600 font-bold">Proven</strong>, <strong className="text-amber-600 font-bold">Partial</strong>, or <strong className="text-slate-500 font-bold">Claimed-only</strong> with direct links to repositories, code, and commits.
              </p>
            </div>
            <div className="flex items-center gap-2 pt-2 text-xs font-semibold text-slate-400">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
              <span>Transparent Match Scoring Logic</span>
            </div>
          </div>

          {/* Step 3 */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-3xl p-6 shadow-xs relative overflow-hidden space-y-4 hover:border-purple-400 transition-colors">
            <div className="w-12 h-12 rounded-2xl bg-purple-50 dark:bg-purple-950/80 text-purple-600 font-black text-lg flex items-center justify-center border border-purple-100 dark:border-purple-900">
              3
            </div>
            <div className="space-y-2">
              <h3 className="text-lg font-bold text-[#0B1A33] dark:text-white">
                Complete Micro-Tasks & Strengthen Portfolio
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                Receive practical 20–40 minute micro-projects for your missing skills. Commit them to GitHub and refresh your score.
              </p>
            </div>
            <div className="flex items-center gap-2 pt-2 text-xs font-semibold text-slate-400">
              <Award className="w-3.5 h-3.5 text-purple-500" />
              <span>Shareable Mentor & Recruiter Link</span>
            </div>
          </div>
        </div>
      </section>

      {/* 3. Section: Built for Learning, Not Just Listing Skills */}
      <section className="bg-gradient-to-br from-blue-50/70 via-white to-purple-50/60 dark:from-slate-900 dark:via-slate-900 dark:to-slate-850 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-8 sm:p-12 shadow-sm space-y-8">
        <div className="text-center space-y-2 max-w-2xl mx-auto">
          <span className="text-xs font-bold uppercase tracking-wider text-[#2F6FED] dark:text-blue-400">
            EduTech Philosophy
          </span>
          <h2 className="text-2xl sm:text-4xl font-black text-[#0B1A33] dark:text-white tracking-tight">
            Built for Learning, Not Just Listing Skills
          </h2>
          <p className="text-sm text-slate-600 dark:text-slate-300">
            Viora does not merely tell students what skills they claim. It checks their real work, shows what they can prove, identifies learning gaps for their chosen role, and gives them small practical projects to build stronger evidence.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {/* Benefit 1 */}
          <div className="bg-white dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/80 rounded-2xl p-6 shadow-2xs space-y-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/80 text-emerald-600 flex items-center justify-center font-bold">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-[#0B1A33] dark:text-white">
              Understand Which Skills You Can Actually Prove
            </h3>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
              Eliminate resume blind spots. Discover which technologies have rock-solid proof in your public repositories and which ones need stronger code artifacts.
            </p>
          </div>

          {/* Benefit 2 */}
          <div className="bg-white dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/80 rounded-2xl p-6 shadow-2xs space-y-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/80 text-[#2F6FED] flex items-center justify-center font-bold">
              <Target className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-[#0B1A33] dark:text-white">
              Find Gaps for Your Target Role
            </h3>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
              Targeting Frontend, Backend, Python, or Full Stack? Compare your verifiable skills against real industry job descriptions without arbitrary AI rejection.
            </p>
          </div>

          {/* Benefit 3 */}
          <div className="bg-white dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/80 rounded-2xl p-6 shadow-2xs space-y-3">
            <div className="w-10 h-10 rounded-xl bg-purple-50 dark:bg-purple-950/80 text-purple-600 flex items-center justify-center font-bold">
              <Zap className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-[#0B1A33] dark:text-white">
              Build Practical Mini-Projects for Real Portfolio Evidence
            </h3>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
              Instead of overwhelming multi-week courses, get targeted 20–40 minute micro-tasks (like adding Dockerfiles, writing test suites, or structuring APIs) with step-by-step guidance.
            </p>
          </div>

          {/* Benefit 4 */}
          <div className="bg-white dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/80 rounded-2xl p-6 shadow-2xs space-y-3">
            <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-950/80 text-amber-600 flex items-center justify-center font-bold">
              <FolderGit2 className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-[#0B1A33] dark:text-white">
              Share a Clear Evidence Report with Mentors or Recruiters
            </h3>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
              Export or share a clean, read-only proof profile showing verified skills and completed projects, giving mentors confidence in your genuine abilities.
            </p>
          </div>
        </div>
      </section>

      {/* 4. Assessment Track Cards */}
      <section className="space-y-6">
        <div className="flex items-center gap-3">
          <div className="flex-1 border-t border-slate-200 dark:border-slate-800" />
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
            Select Your Learning Track
          </span>
          <div className="flex-1 border-t border-slate-200 dark:border-slate-800" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Track 1: Evidence Coach & Interview Mode */}
          <div
            onClick={() => onStartMode("interview")}
            className="group relative bg-white dark:bg-slate-900 border-2 border-slate-200/90 dark:border-slate-800 hover:border-[#2F6FED] dark:hover:border-[#2F6FED] rounded-3xl p-6 sm:p-8 shadow-xs hover:shadow-xl transition-all duration-300 flex flex-col justify-between cursor-pointer"
          >
            <div className="space-y-4">
              <div className="w-14 h-14 rounded-2xl bg-blue-50 dark:bg-blue-950/60 text-[#2F6FED] flex items-center justify-center group-hover:scale-110 group-hover:bg-[#2F6FED] group-hover:text-white transition-all duration-200">
                <FolderGit2 className="w-7 h-7" />
              </div>

              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#2F6FED] bg-blue-50 dark:bg-blue-950/60 px-2.5 py-0.5 rounded-full border border-blue-200/60">
                  Primary Learning Track
                </span>
                <h3 className="text-2xl font-extrabold text-[#0B1A33] dark:text-white tracking-tight mt-2 group-hover:text-[#2F6FED] transition-colors">
                  Evidence Coach (Interview Mode)
                </h3>
                <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 mt-2 leading-relaxed">
                  Upload your resume, connect your public GitHub username, and paste your target job description. Verify what you can prove and get 20–40 min portfolio micro-tasks.
                </p>
              </div>

              <div className="space-y-1.5 pt-2 text-xs text-slate-500 font-medium">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                  <span>Proven, Partial & Claimed-only statuses</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                  <span>Transparent MVP match scoring (1.0 / 0.5 / 0.0)</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                  <span>Actionable GitHub deliverables & checklist</span>
                </div>
              </div>
            </div>

            <div className="pt-6 mt-6 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <span className="text-xs font-bold text-[#0B1A33] dark:text-white group-hover:text-[#2F6FED]">
                Launch Evidence Coach
              </span>
              <div className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-slate-800 group-hover:bg-[#2F6FED] group-hover:text-white flex items-center justify-center text-slate-600 transition-colors">
                <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
              </div>
            </div>
          </div>

          {/* Track 2: Academic Viva Voce Mode */}
          <div
            onClick={() => onStartMode("viva")}
            className="group relative bg-white dark:bg-slate-900 border-2 border-slate-200/90 dark:border-slate-800 hover:border-purple-500 dark:hover:border-purple-500 rounded-3xl p-6 sm:p-8 shadow-xs hover:shadow-xl transition-all duration-300 flex flex-col justify-between cursor-pointer"
          >
            <div className="space-y-4">
              <div className="w-14 h-14 rounded-2xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 flex items-center justify-center group-hover:scale-110 group-hover:bg-purple-600 group-hover:text-white transition-all duration-200">
                <BookOpen className="w-7 h-7" />
              </div>

              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-purple-700 bg-purple-50 dark:bg-purple-950/60 px-2.5 py-0.5 rounded-full border border-purple-200/60">
                  College Semester Defense
                </span>
                <h3 className="text-2xl font-extrabold text-[#0B1A33] dark:text-white tracking-tight mt-2 group-hover:text-purple-600 transition-colors">
                  Viva Voce Mode
                </h3>
                <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 mt-2 leading-relaxed">
                  Upload your university syllabus document. Viora AI simulates an oral viva examination with voice synthesis, camera posture coaching, and honest technical grading.
                </p>
              </div>

              <div className="space-y-1.5 pt-2 text-xs text-slate-500 font-medium">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-purple-500" />
                  <span>Strict syllabus document grounding</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-purple-500" />
                  <span>Text-to-Speech + Speech-to-Text oral questioning</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-purple-500" />
                  <span>Dual correctness & oral confidence scoring</span>
                </div>
              </div>
            </div>

            <div className="pt-6 mt-6 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <span className="text-xs font-bold text-[#0B1A33] dark:text-white group-hover:text-purple-600">
                Start Viva Voce
              </span>
              <div className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-slate-800 group-hover:bg-purple-600 group-hover:text-white flex items-center justify-center text-slate-600 transition-colors">
                <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 5. Syllabus Quick Uploader for College Viva */}
      <section className="bg-slate-50/60 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-6 sm:p-8 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-[#0B1A33] dark:text-white">
              Practicing for an Academic Viva Voce?
            </h3>
            <p className="text-xs text-slate-500">
              Attach your semester course outline or syllabus PDF below to start an oral defense immediately.
            </p>
          </div>
        </div>

        <LandingFileInput
          onLaunchViva={(payload) => {
            if (onLaunchVivaWithDoc) {
              onLaunchVivaWithDoc(payload);
            } else {
              onStartMode("viva");
            }
          }}
          onSelectInterviewMode={() => onStartMode("interview")}
        />
      </section>
    </div>
  );
};
