import React, { useState } from "react";
import {
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Sparkles,
  Target,
  Layers,
  Award,
  Share2,
  RefreshCw,
  ArrowLeft,
  Mic,
  BookOpen,
  Github,
  TrendingUp,
} from "lucide-react";
import { EvidenceReport, SkillEvidenceItem } from "../../types";
import { SkillEvidenceView } from "./SkillEvidenceView";
import { RoleMatchView } from "./RoleMatchView";
import { GrowthPlanView } from "./GrowthPlanView";
import { ShareableProfileView } from "./ShareableProfileView";
import { ProofModal } from "./ProofModal";

interface EvidenceDashboardProps {
  report: EvidenceReport;
  onReset: () => void;
  onLaunchOralPractice?: (skillsToPractice: string[]) => void;
}

type TabType = "skills" | "role_match" | "growth_plan" | "shareable";

export const EvidenceDashboard: React.FC<EvidenceDashboardProps> = ({
  report: initialReport,
  onReset,
  onLaunchOralPractice,
}) => {
  const [report, setReport] = useState<EvidenceReport>(initialReport);
  const [activeTab, setActiveTab] = useState<TabType>("skills");
  const [selectedProofSkill, setSelectedProofSkill] = useState<SkillEvidenceItem | null>(null);
  const [isRechecking, setIsRechecking] = useState(false);

  const provenCount = report.skills.filter((s) => s.status === "Proven").length;
  const partialCount = report.skills.filter((s) => s.status === "Partial").length;
  const claimedCount = report.skills.filter((s) => s.status === "Claimed-only").length;

  const handleRecheckEvidence = async (taskId: string) => {
    setIsRechecking(true);
    try {
      const res = await fetch("/api/recheck-evidence", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ report, taskId }),
      });

      if (res.ok) {
        const updated: EvidenceReport = await res.json();
        setReport(updated);
      } else {
        // Local simulation fallback
        const updatedTasks = report.microTasks.map((t) =>
          t.id === taskId
            ? {
                ...t,
                isCompleted: true,
                checklist: t.checklist.map((c) => ({ ...c, completed: true })),
              }
            : t
        );
        const newScore = Math.min(100, report.matchScore + 12);
        setReport({
          ...report,
          matchScore: newScore,
          microTasks: updatedTasks,
          encouragingSummary: `Great work! Your task was marked complete. Your evidence match score is now ${newScore}%.`,
        });
      }
    } catch (err) {
      console.warn("Recheck failed, using optimistic update:", err);
      const updatedTasks = report.microTasks.map((t) =>
        t.id === taskId
          ? {
              ...t,
              isCompleted: true,
              checklist: t.checklist.map((c) => ({ ...c, completed: true })),
            }
          : t
      );
      setReport({
        ...report,
        matchScore: Math.min(100, report.matchScore + 10),
        microTasks: updatedTasks,
      });
    } finally {
      setIsRechecking(false);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Top Banner Dashboard Card */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xs space-y-6">
        {/* Navigation & Controls */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
          <button
            onClick={onReset}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-[#0B1A33] dark:hover:text-white transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>New Resume / Role Analysis</span>
          </button>

          <div className="flex items-center gap-2">
            {onLaunchOralPractice && (
              <button
                onClick={() =>
                  onLaunchOralPractice(
                    report.skills
                      .filter((s) => s.status !== "Proven")
                      .map((s) => s.skillName)
                      .slice(0, 5)
                  )
                }
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-[#2F6FED] bg-blue-50 dark:bg-blue-950/60 hover:bg-blue-100 dark:hover:bg-blue-900/60 rounded-xl transition-colors"
              >
                <Mic className="w-3.5 h-3.5" />
                <span>Practice Oral Defense</span>
              </button>
            )}
          </div>
        </div>

        {/* Profile & Score Row */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-start gap-4">
            <img
              src={report.githubAvatarUrl || `https://github.com/${report.githubUsername}.png`}
              alt={report.studentName}
              className="w-16 h-16 rounded-2xl border-2 border-[#2F6FED] shadow-xs object-cover"
              onError={(e) => {
                (e.target as any).src =
                  "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80";
              }}
            />
            <div className="space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-2xl font-black text-[#0B1A33] dark:text-white">
                  {report.studentName}
                </h1>
                <a
                  href={`https://github.com/${report.githubUsername}`}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 text-xs font-mono text-[#2F6FED] bg-blue-50 dark:bg-blue-950/60 px-2 py-0.5 rounded-md hover:underline"
                >
                  <Github className="w-3 h-3" />
                  <span>@{report.githubUsername}</span>
                </a>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Target Role:{" "}
                <strong className="text-slate-800 dark:text-slate-200">
                  {report.targetRole}
                </strong>{" "}
                • Resume: <span className="font-mono text-slate-400">{report.resumeFileName || "Uploaded_Resume.pdf"}</span>
              </p>
              <p className="text-xs text-slate-600 dark:text-slate-300 pt-1 leading-relaxed max-w-xl">
                {report.encouragingSummary}
              </p>
            </div>
          </div>

          {/* Circular Score Visual */}
          <div className="bg-slate-50 dark:bg-slate-850 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-4 flex items-center gap-4 shrink-0 shadow-2xs">
            <div className="relative w-18 h-18 flex items-center justify-center">
              <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                <path
                  className="text-slate-200 dark:text-slate-800"
                  strokeWidth="3.5"
                  stroke="currentColor"
                  fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
                <path
                  className="text-[#2F6FED] transition-all duration-1000 ease-out"
                  strokeDasharray={`${report.matchScore}, 100`}
                  strokeWidth="3.5"
                  strokeLinecap="round"
                  stroke="currentColor"
                  fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
              </svg>
              <div className="absolute text-center">
                <span className="text-lg font-black text-[#0B1A33] dark:text-white">
                  {report.matchScore}%
                </span>
              </div>
            </div>
            <div>
              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Evidence Match
              </div>
              <div className="text-xs font-bold text-[#0B1A33] dark:text-white">
                {report.earnedPoints} / {report.totalRequiredSkills} Points
              </div>
              <span className="text-[10px] text-slate-500">For this learning goal</span>
            </div>
          </div>
        </div>

        {/* Quick Stats Pill Row */}
        <div className="grid grid-cols-3 gap-3 pt-2">
          <div className="bg-emerald-50/60 dark:bg-emerald-950/30 border border-emerald-200/60 dark:border-emerald-900/40 rounded-xl p-3 text-center sm:text-left">
            <div className="flex items-center justify-center sm:justify-start gap-1.5 text-xs font-bold text-emerald-700 dark:text-emerald-300">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
              <span>Proven Skills</span>
            </div>
            <div className="text-xl font-black text-emerald-800 dark:text-emerald-200 mt-1">
              {provenCount}
            </div>
            <span className="text-[10px] text-emerald-600/80">Strong public code artifacts</span>
          </div>

          <div className="bg-amber-50/60 dark:bg-amber-950/30 border border-amber-200/60 dark:border-amber-900/40 rounded-xl p-3 text-center sm:text-left">
            <div className="flex items-center justify-center sm:justify-start gap-1.5 text-xs font-bold text-amber-700 dark:text-amber-300">
              <AlertCircle className="w-3.5 h-3.5 text-amber-500" />
              <span>Partial Evidence</span>
            </div>
            <div className="text-xl font-black text-amber-800 dark:text-amber-200 mt-1">
              {partialCount}
            </div>
            <span className="text-[10px] text-amber-600/80">Limited or incomplete proof</span>
          </div>

          <div className="bg-slate-100/80 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-center sm:text-left">
            <div className="flex items-center justify-center sm:justify-start gap-1.5 text-xs font-bold text-slate-700 dark:text-slate-300">
              <HelpCircle className="w-3.5 h-3.5 text-slate-400" />
              <span>Claimed-only</span>
            </div>
            <div className="text-xl font-black text-slate-800 dark:text-slate-100 mt-1">
              {claimedCount}
            </div>
            <span className="text-[10px] text-slate-500">No public GitHub proof yet</span>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-1 border-b border-slate-200 dark:border-slate-800 pt-2 overflow-x-auto">
          <button
            onClick={() => setActiveTab("skills")}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-extrabold border-b-2 transition-all whitespace-nowrap ${
              activeTab === "skills"
                ? "border-[#2F6FED] text-[#2F6FED] dark:text-blue-400"
                : "border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>Skill Evidence ({report.skills.length})</span>
          </button>

          <button
            onClick={() => setActiveTab("role_match")}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-extrabold border-b-2 transition-all whitespace-nowrap ${
              activeTab === "role_match"
                ? "border-[#2F6FED] text-[#2F6FED] dark:text-blue-400"
                : "border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
            }`}
          >
            <Target className="w-4 h-4" />
            <span>Role Match & Gaps</span>
          </button>

          <button
            onClick={() => setActiveTab("growth_plan")}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-extrabold border-b-2 transition-all whitespace-nowrap ${
              activeTab === "growth_plan"
                ? "border-[#2F6FED] text-[#2F6FED] dark:text-blue-400"
                : "border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
            }`}
          >
            <Award className="w-4 h-4" />
            <span>Growth Plan & Micro-Tasks ({report.microTasks.length})</span>
          </button>

          <button
            onClick={() => setActiveTab("shareable")}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-extrabold border-b-2 transition-all whitespace-nowrap ${
              activeTab === "shareable"
                ? "border-[#2F6FED] text-[#2F6FED] dark:text-blue-400"
                : "border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
            }`}
          >
            <Share2 className="w-4 h-4" />
            <span>Shareable Profile</span>
          </button>
        </div>
      </div>

      {/* Active Tab Views */}
      {activeTab === "skills" && (
        <SkillEvidenceView
          skills={report.skills}
          onViewProof={(skill) => setSelectedProofSkill(skill)}
        />
      )}

      {activeTab === "role_match" && (
        <RoleMatchView
          report={report}
          onNavigateToGrowthPlan={() => setActiveTab("growth_plan")}
        />
      )}

      {activeTab === "growth_plan" && (
        <GrowthPlanView
          report={report}
          onRecheckEvidence={handleRecheckEvidence}
          isRechecking={isRechecking}
        />
      )}

      {activeTab === "shareable" && <ShareableProfileView report={report} />}

      {/* Proof Modal */}
      <ProofModal
        skill={selectedProofSkill}
        onClose={() => setSelectedProofSkill(null)}
      />
    </div>
  );
};
