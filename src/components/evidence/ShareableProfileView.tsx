import React, { useState } from "react";
import { CheckCircle2, Copy, Check, Printer, ExternalLink, ShieldCheck, Share2, Github, Award, BookOpen } from "lucide-react";
import { EvidenceReport } from "../../types";
import { VioraLogo } from "../VioraLogo";

interface ShareableProfileViewProps {
  report: EvidenceReport;
}

export const ShareableProfileView: React.FC<ShareableProfileViewProps> = ({ report }) => {
  const [copied, setCopied] = useState(false);

  const provenSkills = report.skills.filter((s) => s.status === "Proven");
  const partialSkills = report.skills.filter((s) => s.status === "Partial");
  const completedTasks = report.microTasks.filter((t) => t.isCompleted);

  const handleCopyLink = () => {
    if (typeof window !== "undefined") {
      const shareUrl = `${window.location.origin}/#evidence-report=${report.id}`;
      navigator.clipboard.writeText(shareUrl).then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2500);
      });
    }
  };

  const handlePrint = () => {
    if (typeof window !== "undefined") {
      window.print();
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Action Toolbar */}
      <div className="flex items-center justify-between gap-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-xs">
        <div className="flex items-center gap-2 text-xs text-slate-500">
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
          <span>Privacy Protected: Only public GitHub evidence is visible in this mentor link</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleCopyLink}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl transition-colors"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? "Link Copied!" : "Copy Share Link"}</span>
          </button>
          <button
            onClick={handlePrint}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold text-white bg-[#2F6FED] hover:bg-blue-600 rounded-xl transition-all shadow-xs"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print Report</span>
          </button>
        </div>
      </div>

      {/* Printable Card */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-10 shadow-lg space-y-8 print:shadow-none print:border-none print:p-0">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 pb-6 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-4">
            <img
              src={report.githubAvatarUrl || `https://github.com/${report.githubUsername}.png`}
              alt={report.studentName}
              className="w-16 h-16 rounded-2xl border-2 border-[#2F6FED] shadow-xs object-cover"
              onError={(e) => {
                // fallback if avatar fails
                (e.target as any).src = "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80";
              }}
            />
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-black text-[#0B1A33] dark:text-white">
                  {report.studentName}
                </h1>
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 dark:bg-blue-950/60 text-[#2F6FED] dark:text-blue-400 border border-blue-200 dark:border-blue-900">
                  Student Portfolio
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Target Role: <strong className="text-slate-800 dark:text-slate-200">{report.targetRole}</strong>
              </p>
              <a
                href={`https://github.com/${report.githubUsername}`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 text-xs text-[#2F6FED] hover:underline mt-1 font-mono"
              >
                <Github className="w-3.5 h-3.5" />
                <span>@{report.githubUsername}</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>

          {/* Match Score Badge */}
          <div className="bg-slate-50 dark:bg-slate-850 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-4 text-center sm:text-right shrink-0">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Evidence Match Score
            </span>
            <div className="text-3xl font-black text-[#2F6FED]">
              {report.matchScore}%
            </div>
            <span className="text-[11px] text-slate-500 font-medium">
              {report.earnedPoints} of {report.totalRequiredSkills} Points Earned
            </span>
          </div>
        </div>

        {/* Verified Proven Skills */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
            <h2 className="text-lg font-bold text-[#0B1A33] dark:text-white">
              Proven Technical Skills ({provenSkills.length})
            </h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {provenSkills.map((skill) => (
              <div
                key={skill.id}
                className="bg-slate-50/80 dark:bg-slate-850/60 border border-emerald-200/60 dark:border-emerald-900/40 rounded-xl p-3.5 space-y-1.5"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-[#0B1A33] dark:text-white">
                    {skill.skillName}
                  </span>
                  <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-100/70 dark:bg-emerald-950/70 px-2 py-0.5 rounded-full">
                    Proven Proof
                  </span>
                </div>
                <p className="text-[11px] text-slate-600 dark:text-slate-300 line-clamp-2">
                  {skill.explanation}
                </p>
                <div className="flex flex-wrap gap-1 pt-1">
                  {skill.evidenceChips.slice(0, 2).map((chip, idx) => (
                    <span
                      key={idx}
                      className="text-[10px] bg-white dark:bg-slate-800 px-2 py-0.5 rounded border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300"
                    >
                      {chip}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* In-Progress / Partial Skills */}
        {partialSkills.length > 0 && (
          <div className="space-y-3">
            <h3 className="text-sm font-bold text-[#0B1A33] dark:text-white">
              Skills with Partial Evidence ({partialSkills.length})
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {partialSkills.map((skill) => (
                <div
                  key={skill.id}
                  className="bg-slate-50/50 dark:bg-slate-850/40 border border-amber-200/60 dark:border-amber-900/40 rounded-xl p-3 space-y-1"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                      {skill.skillName}
                    </span>
                    <span className="text-[10px] font-bold text-amber-700 dark:text-amber-400 bg-amber-100/70 dark:bg-amber-950/60 px-2 py-0.5 rounded-full">
                      Partial (0.5 pt)
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    {skill.explanation}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Completed Growth Tasks */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Award className="w-5 h-5 text-purple-600" />
            <h2 className="text-lg font-bold text-[#0B1A33] dark:text-white">
              Completed Portfolio Evidence Tasks
            </h2>
          </div>
          {completedTasks.length > 0 ? (
            <div className="space-y-2">
              {completedTasks.map((task) => (
                <div
                  key={task.id}
                  className="flex items-center justify-between p-3 rounded-xl bg-emerald-50/40 dark:bg-emerald-950/20 border border-emerald-200/60 dark:border-emerald-900/40 text-xs"
                >
                  <div className="flex items-center gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <div>
                      <span className="font-bold text-slate-800 dark:text-white">
                        {task.title}
                      </span>
                      <span className="text-slate-500 dark:text-slate-400 ml-2">
                        ({task.skill})
                      </span>
                    </div>
                  </div>
                  <span className="text-[11px] font-mono text-emerald-700 dark:text-emerald-400">
                    Verified Deliverable
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-slate-500 italic">
              Student has not marked any micro-tasks as complete yet.
            </p>
          )}
        </div>

        {/* Footer Guarantee */}
        <div className="pt-6 border-t border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <VioraLogo variant="full" size="sm" />
            <span className="text-slate-300 dark:text-slate-700">•</span>
            <span>Evidence-Based Learning Coach</span>
          </div>
          <span>Generated by Viora • Verified via Public GitHub Repositories</span>
        </div>
      </div>
    </div>
  );
};
