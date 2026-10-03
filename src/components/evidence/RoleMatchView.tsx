import React from "react";
import { CheckCircle2, AlertCircle, HelpCircle, ArrowRight, Sparkles, BookOpen, Target, Calculator } from "lucide-react";
import { EvidenceReport } from "../../types";

interface RoleMatchViewProps {
  report: EvidenceReport;
  onNavigateToGrowthPlan: () => void;
}

export const RoleMatchView: React.FC<RoleMatchViewProps> = ({ report, onNavigateToGrowthPlan }) => {
  const provenRows = report.comparisonTable.filter((r) => r.studentStatus === "Proven");
  const partialRows = report.comparisonTable.filter((r) => r.studentStatus === "Partial");
  const missingRows = report.comparisonTable.filter(
    (r) => r.studentStatus === "Claimed-only" || r.studentStatus === "Missing"
  );

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "Proven":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
            <CheckCircle2 className="w-3 h-3 text-emerald-500" />
            Proven (+1.0)
          </span>
        );
      case "Partial":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
            <AlertCircle className="w-3 h-3 text-amber-500" />
            Partial (+0.5)
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
            <HelpCircle className="w-3 h-3 text-slate-400" />
            {status} (+0.0)
          </span>
        );
    }
  };

  return (
    <div className="space-y-8">
      {/* Target Role & Transparent Score Banner */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xs space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-xl">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-950/60 text-[#2F6FED] dark:text-blue-400 text-xs font-bold border border-blue-200/60 dark:border-blue-900/60">
              <Target className="w-3.5 h-3.5" />
              <span>Target Learning Goal: {report.targetRole}</span>
            </div>
            <h2 className="text-2xl font-black text-[#0B1A33] dark:text-white tracking-tight">
              Evidence Gap & Role Alignment
            </h2>
            <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
              {report.encouragingSummary}
            </p>
          </div>

          {/* Circular / Ring Match Score Visual */}
          <div className="bg-slate-50 dark:bg-slate-850 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-5 flex items-center gap-4 shrink-0 shadow-2xs">
            <div className="relative w-20 h-20 flex items-center justify-center">
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
                <span className="text-xl font-black text-[#0B1A33] dark:text-white">
                  {report.matchScore}%
                </span>
              </div>
            </div>
            <div>
              <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Current Status
              </div>
              <div className="text-sm font-bold text-[#0B1A33] dark:text-white">
                {report.earnedPoints} of {report.totalRequiredSkills} Points
              </div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                Evidence match score
              </div>
            </div>
          </div>
        </div>

        {/* Transparent Scoring Formula Notice */}
        <div className="bg-blue-50/70 dark:bg-blue-950/40 border border-blue-100 dark:border-blue-900/60 rounded-2xl p-4 text-xs text-blue-900 dark:text-blue-300 flex items-start gap-3">
          <Calculator className="w-5 h-5 text-[#2F6FED] shrink-0 mt-0.5" />
          <div className="space-y-1">
            <span className="font-bold">Transparent EduTech Scoring System:</span>
            <p className="text-blue-800/90 dark:text-blue-300/90 leading-relaxed">
              Score = (Proven Skills × 1.0 + Partial Skills × 0.5 + Missing × 0.0) ÷ Total Required Skills × 100.
              This represents <strong className="font-semibold text-blue-950 dark:text-white">“Your current evidence match for this learning goal.”</strong> This is never a hiring rejection; it is an actionable roadmap of exactly what projects to build next.
            </p>
          </div>
        </div>
      </div>

      {/* Top 3 Learning Gaps */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-purple-600" />
            <h3 className="text-base font-extrabold text-[#0B1A33] dark:text-white tracking-tight">
              Top 3 High-Impact Learning Gaps
            </h3>
          </div>
          <span className="text-xs text-slate-500">Prioritized for {report.targetRole}</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {report.topLearningGaps.map((gap, idx) => (
            <div
              key={idx}
              className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-2xl p-5 shadow-xs flex flex-col justify-between space-y-4 hover:border-purple-300 dark:hover:border-purple-800 transition-colors"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-950/60 px-2.5 py-0.5 rounded-full border border-purple-100 dark:border-purple-900/60">
                    Gap #{idx + 1}
                  </span>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                      gap.priority === "High"
                        ? "bg-red-50 text-red-600 border border-red-200"
                        : "bg-amber-50 text-amber-600 border border-amber-200"
                    }`}
                  >
                    {gap.priority} Priority
                  </span>
                </div>
                <h4 className="text-base font-bold text-[#0B1A33] dark:text-white">
                  {gap.skill}
                </h4>
                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                  {gap.impact}
                </p>
              </div>

              <div className="pt-3 border-t border-slate-100 dark:border-slate-800">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Recommended Project:
                </span>
                <p className="text-xs font-medium text-slate-700 dark:text-slate-200 mt-1">
                  {gap.recommendation}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Comparison Table */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-2xl overflow-hidden shadow-xs">
        <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-[#0B1A33] dark:text-white">
              Skill-by-Skill Role Alignment Matrix
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Cross-referencing required job skills against your real GitHub evidence
            </p>
          </div>
          <button
            onClick={onNavigateToGrowthPlan}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold text-white bg-[#2F6FED] hover:bg-blue-600 rounded-xl transition-all shadow-xs"
          >
            <span>Start Micro-Tasks</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-850/80 text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider text-[10px] border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="px-5 py-3.5">Required Skill</th>
                <th className="px-5 py-3.5">Student Evidence Status</th>
                <th className="px-5 py-3.5">Evidence Found</th>
                <th className="px-5 py-3.5">Recommended Next Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80 text-slate-700 dark:text-slate-300">
              {report.comparisonTable.map((row, idx) => (
                <tr key={idx} className="hover:bg-slate-50/60 dark:hover:bg-slate-850/50 transition-colors">
                  <td className="px-5 py-4 font-bold text-[#0B1A33] dark:text-white whitespace-nowrap">
                    {row.requiredSkill}
                  </td>
                  <td className="px-5 py-4 whitespace-nowrap">
                    {getStatusBadge(row.studentStatus)}
                  </td>
                  <td className="px-5 py-4 max-w-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                    {row.evidenceFound}
                  </td>
                  <td className="px-5 py-4 max-w-sm font-medium text-slate-700 dark:text-slate-200 leading-relaxed">
                    {row.recommendedAction}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
