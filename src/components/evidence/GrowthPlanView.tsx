import React, { useState } from "react";
import { CheckCircle2, Clock, Sparkles, FolderGit2, Check, RefreshCw, ChevronDown, ChevronUp, ArrowRight, Zap, Target } from "lucide-react";
import { MicroTask, EvidenceReport } from "../../types";

interface GrowthPlanViewProps {
  report: EvidenceReport;
  onRecheckEvidence: (taskId: string) => Promise<void>;
  isRechecking: boolean;
}

export const GrowthPlanView: React.FC<GrowthPlanViewProps> = ({
  report,
  onRecheckEvidence,
  isRechecking,
}) => {
  const [tasks, setTasks] = useState<MicroTask[]>(report.microTasks);
  const [expandedTaskId, setExpandedTaskId] = useState<string | null>(
    report.microTasks.length > 0 ? report.microTasks[0].id : null
  );

  const completedCount = tasks.filter((t) => t.isCompleted).length;
  const totalCount = tasks.length;
  const completionPercent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  const toggleChecklistItem = (taskId: string, checkId: string) => {
    setTasks((prev) =>
      prev.map((task) => {
        if (task.id !== taskId) return task;
        const newChecklist = task.checklist.map((item) =>
          item.id === checkId ? { ...item, completed: !item.completed } : item
        );
        const allDone = newChecklist.every((item) => item.completed);
        return {
          ...task,
          checklist: newChecklist,
          isCompleted: allDone,
        };
      })
    );
  };

  const handleMarkComplete = (taskId: string) => {
    setTasks((prev) =>
      prev.map((task) => {
        if (task.id !== taskId) return task;
        return {
          ...task,
          isCompleted: true,
          checklist: task.checklist.map((c) => ({ ...c, completed: true })),
        };
      })
    );
  };

  return (
    <div className="space-y-8">
      {/* Top Banner & Progress Tracker */}
      <div className="bg-gradient-to-br from-white to-blue-50/50 dark:from-slate-900 dark:to-slate-850 border border-slate-200/90 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xs space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-xl">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 text-xs font-bold border border-purple-200/60 dark:border-purple-900/60">
              <Zap className="w-3.5 h-3.5 text-purple-500" />
              <span>Evidence-Building Engine</span>
            </div>
            <h2 className="text-2xl font-black text-[#0B1A33] dark:text-white tracking-tight">
              Actionable Portfolio Micro-Tasks (20–40 Mins)
            </h2>
            <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
              Don’t just list skills on paper. Complete these bite-sized, practical engineering tasks on your public GitHub repositories to convert claimed skills into verifiable portfolio proof.
            </p>
          </div>

          {/* Progress Card */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-850 rounded-2xl p-5 shadow-xs shrink-0 max-w-xs w-full space-y-3">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-slate-700 dark:text-slate-300">Portfolio Progress</span>
              <span className="font-black text-[#2F6FED]">{completedCount} of {totalCount} Completed</span>
            </div>
            <div className="h-2.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-[#2F6FED] to-emerald-500 rounded-full transition-all duration-700"
                style={{ width: `${completionPercent}%` }}
              />
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Publishing deliverables boosts your target role evidence score from{" "}
              <strong className="text-slate-700 dark:text-slate-200">{report.matchScore}%</strong>.
            </p>
          </div>
        </div>
      </div>

      {/* Micro-Tasks List */}
      <div className="space-y-5">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-extrabold text-[#0B1A33] dark:text-white tracking-tight">
            Targeted Micro-Projects for {report.targetRole}
          </h3>
          <span className="text-xs text-slate-500">Each task takes under 40 minutes</span>
        </div>

        {tasks.map((task) => {
          const isExpanded = expandedTaskId === task.id;
          const completedChecks = task.checklist.filter((c) => c.completed).length;

          return (
            <div
              key={task.id}
              className={`bg-white dark:bg-slate-900 border-2 transition-all duration-200 rounded-2xl overflow-hidden shadow-xs ${
                task.isCompleted
                  ? "border-emerald-200 dark:border-emerald-900/60 bg-emerald-50/20 dark:bg-emerald-950/10"
                  : isExpanded
                  ? "border-[#2F6FED] dark:border-blue-500"
                  : "border-slate-200 dark:border-slate-800 hover:border-slate-300"
              }`}
            >
              {/* Task Summary Header */}
              <div
                onClick={() => setExpandedTaskId(isExpanded ? null : task.id)}
                className="p-5 flex items-start sm:items-center justify-between gap-4 cursor-pointer select-none"
              >
                <div className="flex items-start sm:items-center gap-3.5">
                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 transition-colors ${
                      task.isCompleted
                        ? "bg-emerald-100 dark:bg-emerald-900 text-emerald-600 dark:text-emerald-300"
                        : "bg-blue-50 dark:bg-blue-950/80 text-[#2F6FED]"
                    }`}
                  >
                    {task.isCompleted ? (
                      <CheckCircle2 className="w-5 h-5" />
                    ) : (
                      <FolderGit2 className="w-5 h-5" />
                    )}
                  </div>

                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-xs font-bold text-slate-800 dark:text-white">
                        {task.title}
                      </span>
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
                        {task.skill}
                      </span>
                      <span className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-500">
                        <Clock className="w-3 h-3" />
                        ~{task.estimatedMinutes} mins
                      </span>
                    </div>
                    <div className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-1">
                      {task.whatToBuild}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <span className="hidden sm:inline text-xs font-semibold text-slate-500">
                    {completedChecks}/{task.checklist.length} steps
                  </span>
                  <div className="w-7 h-7 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500">
                    {isExpanded ? (
                      <ChevronUp className="w-4 h-4" />
                    ) : (
                      <ChevronDown className="w-4 h-4" />
                    )}
                  </div>
                </div>
              </div>

              {/* Expanded Detail Panel */}
              {isExpanded && (
                <div className="px-5 pb-6 pt-2 border-t border-slate-100 dark:border-slate-800 space-y-6">
                  {/* Why it Matters */}
                  <div className="bg-slate-50 dark:bg-slate-850/60 border border-slate-200/80 dark:border-slate-750 rounded-xl p-4 space-y-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      Why Mentors & Teams Care About This:
                    </span>
                    <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                      {task.whyItMatters}
                    </p>
                  </div>

                  {/* What to Build */}
                  <div className="space-y-1.5">
                    <span className="text-xs font-bold text-[#0B1A33] dark:text-white uppercase tracking-wider text-[11px]">
                      Concrete Portfolio Deliverable:
                    </span>
                    <p className="text-xs text-slate-600 dark:text-slate-300 font-medium">
                      {task.whatToBuild}
                    </p>
                  </div>

                  {/* Step by Step Instructions */}
                  <div className="space-y-2">
                    <span className="text-xs font-bold text-[#0B1A33] dark:text-white uppercase tracking-wider text-[11px]">
                      Step-by-Step Instructions:
                    </span>
                    <ol className="space-y-2 text-xs text-slate-600 dark:text-slate-300">
                      {task.stepByStep.map((step, idx) => (
                        <li key={idx} className="flex items-start gap-2.5">
                          <span className="w-5 h-5 rounded-full bg-blue-100 dark:bg-blue-950 text-[#2F6FED] font-bold text-[11px] flex items-center justify-center shrink-0 mt-0.5">
                            {idx + 1}
                          </span>
                          <span className="leading-relaxed font-mono text-[11.5px] text-slate-800 dark:text-slate-200">
                            {step}
                          </span>
                        </li>
                      ))}
                    </ol>
                  </div>

                  {/* Interactive Checklist */}
                  <div className="space-y-2.5 pt-2">
                    <span className="text-xs font-bold text-[#0B1A33] dark:text-white uppercase tracking-wider text-[11px]">
                      Proof Verification Checklist:
                    </span>
                    <div className="space-y-2">
                      {task.checklist.map((item) => (
                        <label
                          key={item.id}
                          className="flex items-center gap-3 p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-850 cursor-pointer transition-colors"
                        >
                          <input
                            type="checkbox"
                            checked={item.completed}
                            onChange={() => toggleChecklistItem(task.id, item.id)}
                            className="w-4 h-4 rounded-md text-[#2F6FED] focus:ring-blue-500 border-slate-300"
                          />
                          <span
                            className={`text-xs ${
                              item.completed
                                ? "line-through text-slate-400 dark:text-slate-500"
                                : "text-slate-700 dark:text-slate-200 font-medium"
                            }`}
                          >
                            {item.text}
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3">
                    <div className="text-xs text-slate-500 dark:text-slate-400">
                      Target repository:{" "}
                      <span className="font-mono font-bold text-[#2F6FED]">
                        {task.repoNameTarget || "portfolio-app"}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      {!task.isCompleted && (
                        <button
                          onClick={() => handleMarkComplete(task.id)}
                          className="px-3.5 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl transition-colors"
                        >
                          Mark as Complete
                        </button>
                      )}

                      <button
                        onClick={() => onRecheckEvidence(task.id)}
                        disabled={isRechecking}
                        className="inline-flex items-center gap-1.5 px-4 py-1.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 rounded-xl transition-all shadow-xs"
                      >
                        <RefreshCw className={`w-3.5 h-3.5 ${isRechecking ? "animate-spin" : ""}`} />
                        <span>{isRechecking ? "Verifying..." : "Recheck My Evidence"}</span>
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
