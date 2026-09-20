import React from "react";
import { X, Calendar, Trophy, Trash2, ArrowRight, BookOpen, UserCheck, TrendingUp } from "lucide-react";
import { SessionReport } from "../types";
import { deleteSessionFromStorage } from "../lib/storage";

interface HistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  sessions: SessionReport[];
  onSelectSession: (session: SessionReport) => void;
  onRefresh: () => void;
  onOpenImprovementReport?: () => void;
}

export const HistoryModal: React.FC<HistoryModalProps> = ({
  isOpen,
  onClose,
  sessions,
  onSelectSession,
  onRefresh,
  onOpenImprovementReport,
}) => {
  if (!isOpen) return null;

  const handleDelete = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    deleteSessionFromStorage(id);
    onRefresh();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-2xl w-full max-h-[85vh] flex flex-col shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden transition-colors">
        {/* Header */}
        <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-[#0B1A33] dark:text-white">Past Practice Attempts</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Review your previous viva exams and mock interviews
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Improvement Report Quick Banner */}
        {sessions.length > 0 && onOpenImprovementReport && (
          <div className="mx-5 mt-4 p-3 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/40 dark:to-indigo-950/40 border border-blue-100 dark:border-blue-900/60 rounded-xl flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-[#2F6FED] text-white flex items-center justify-center shrink-0">
                <TrendingUp className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-[#0B1A33] dark:text-white">Candidate Improvement Report</h4>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">View progress trajectory & download audit report</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => {
                onClose();
                onOpenImprovementReport();
              }}
              className="inline-flex items-center gap-1 px-3 py-1.5 bg-[#2F6FED] hover:bg-blue-600 text-white font-semibold text-xs rounded-lg shadow-xs transition-colors shrink-0"
            >
              <span>View & Download</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Content */}
        <div className="p-5 overflow-y-auto space-y-3 divide-y divide-slate-100 dark:divide-slate-800/80">
          {sessions.length === 0 ? (
            <div className="py-12 text-center text-slate-400 dark:text-slate-500 space-y-2">
              <Calendar className="w-8 h-8 mx-auto stroke-1" />
              <p className="text-sm font-medium text-slate-600 dark:text-slate-300">No past sessions yet</p>
              <p className="text-xs text-slate-400 dark:text-slate-500 max-w-xs mx-auto">
                Complete your first Viva Voce or Interview practice to see your performance history here.
              </p>
            </div>
          ) : (
            sessions.map((sess) => (
              <div
                key={sess.id}
                onClick={() => {
                  onSelectSession(sess);
                  onClose();
                }}
                className="pt-3 first:pt-0 group flex items-center justify-between p-3 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-all cursor-pointer border border-transparent hover:border-slate-200 dark:hover:border-slate-700"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-[#2F6FED] dark:text-blue-400 flex items-center justify-center shrink-0">
                    {sess.mode === "viva" ? (
                      <BookOpen className="w-5 h-5" />
                    ) : (
                      <UserCheck className="w-5 h-5" />
                    )}
                  </div>

                  <div className="truncate">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold uppercase tracking-wider text-[#0B1A33] dark:text-white">
                        {sess.mode === "viva" ? "Viva Voce" : `Interview (${sess.subMode})`}
                      </span>
                      <span className="text-[11px] text-slate-400 dark:text-slate-500">
                        {new Date(sess.createdAt).toLocaleDateString(undefined, {
                          month: "short",
                          day: "numeric",
                        })}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 mt-0.5">
                      <p className="text-xs text-slate-600 dark:text-slate-400 truncate font-medium">
                        {sess.meta.degreeProgram || sess.meta.targetRole || sess.meta.courseName || `${sess.answers.length} questions completed`}
                      </p>
                      {sess.readinessPercentage !== undefined && (
                        <span className="text-[10px] text-[#2F6FED] dark:text-blue-400 font-bold bg-blue-50 dark:bg-blue-950/60 px-1.5 py-0.5 rounded">
                          {sess.readinessPercentage}% ready
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  {sess.overallScore !== undefined && (
                    <div className="text-right">
                      <span className="text-sm font-extrabold text-[#0B1A33] dark:text-white">
                        {sess.overallScore}%
                      </span>
                      <p className="text-[10px] text-slate-400 dark:text-slate-500 truncate max-w-[100px]">{sess.grade || "Merit"}</p>
                    </div>
                  )}

                  <button
                    type="button"
                    onClick={(e) => handleDelete(e, sess.id)}
                    className="p-2 text-slate-300 dark:text-slate-600 hover:text-red-500 dark:hover:text-red-400 rounded-lg transition-colors"
                    title="Delete record"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>

                  <ArrowRight className="w-4 h-4 text-slate-300 dark:text-slate-600 group-hover:text-[#2F6FED] dark:group-hover:text-blue-400 group-hover:translate-x-0.5 transition-all" />
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
