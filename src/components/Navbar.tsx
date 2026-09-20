import React from "react";
import { BookOpen, UserCheck, History, ArrowLeft, TrendingUp } from "lucide-react";
import { AssessmentMode } from "../types";
import { VioraLogo } from "./VioraLogo";
import { UserNav } from "./UserNav";
import { ThemeToggle } from "./ThemeToggle";

interface NavbarProps {
  currentMode?: AssessmentMode | null;
  onSelectMode: (mode: AssessmentMode | null) => void;
  onOpenHistory: () => void;
  onOpenImprovementReport: () => void;
  hasActiveSession?: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentMode,
  onSelectMode,
  onOpenHistory,
  onOpenImprovementReport,
  hasActiveSession,
}) => {
  return (
    <header className="sticky top-0 z-40 bg-white/95 dark:bg-[#0B1329]/95 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800 shadow-xs transition-colors">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-3">
        {/* Brand Logo & Name */}
        <button
          onClick={() => onSelectMode(null)}
          className="text-left group focus:outline-hidden"
          title="Return to home"
        >
          <VioraLogo variant="horizontal" size="md" />
        </button>

        {/* Navigation / Mode Switcher & User Profile */}
        <div className="flex items-center gap-2 sm:gap-3">
          {currentMode ? (
            <button
              onClick={() => onSelectMode(null)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Modes</span>
            </button>
          ) : (
            <div className="hidden md:flex items-center gap-1 bg-slate-100/80 dark:bg-slate-900/80 p-1 rounded-xl border border-slate-200/60 dark:border-slate-800">
              <button
                onClick={() => onSelectMode("viva")}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all text-slate-700 dark:text-slate-200 hover:bg-white dark:hover:bg-slate-800 hover:shadow-xs"
              >
                <BookOpen className="w-3.5 h-3.5 text-[#2F6FED]" />
                Viva Voce
              </button>
              <button
                onClick={() => onSelectMode("interview")}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all text-slate-700 dark:text-slate-200 hover:bg-white dark:hover:bg-slate-800 hover:shadow-xs"
              >
                <UserCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                Interview Practice
              </button>
            </div>
          )}

          {/* Improvement Report button */}
          <button
            id="nav-improvement-report-btn"
            onClick={onOpenImprovementReport}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-[#2F6FED] dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 bg-blue-50/80 dark:bg-blue-950/50 hover:bg-blue-100/80 dark:hover:bg-blue-900/60 border border-blue-200/80 dark:border-blue-900/80 rounded-lg shadow-2xs transition-all"
            title="View candidate improvement report and download progress audit"
          >
            <TrendingUp className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Improvement Report</span>
          </button>

          {/* Past Sessions button */}
          <button
            onClick={onOpenHistory}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-300 hover:text-[#0B1A33] dark:hover:text-white bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 rounded-lg shadow-xs hover:bg-slate-50 dark:hover:bg-slate-800 transition-all"
            title="View past sessions"
          >
            <History className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
            <span className="hidden sm:inline">Past Attempts</span>
          </button>

          {/* Theme Mode Toggle */}
          <ThemeToggle />

          {/* User Auth: Login / Create Account / Profile */}
          <div className="pl-1 sm:pl-2 border-l border-slate-200 dark:border-slate-800">
            <UserNav
              onOpenHistory={onOpenHistory}
              onOpenImprovementReport={onOpenImprovementReport}
            />
          </div>
        </div>
      </div>
    </header>
  );
};

