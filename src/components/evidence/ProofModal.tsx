import React from "react";
import { X, ExternalLink, Code2, GitCommit, FolderCheck, Globe, CheckCircle2, FileText } from "lucide-react";
import { SkillEvidenceItem } from "../../types";

interface ProofModalProps {
  skill: SkillEvidenceItem | null;
  onClose: () => void;
}

export const ProofModal: React.FC<ProofModalProps> = ({ skill, onClose }) => {
  if (!skill) return null;

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "Proven":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
            Proven Evidence (1.0 pt)
          </span>
        );
      case "Partial":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
            <span className="w-2 h-2 rounded-full bg-amber-500" />
            Partial Evidence (0.5 pt)
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
            <span className="w-2 h-2 rounded-full bg-slate-400" />
            Claimed-only (0.0 pt)
          </span>
        );
    }
  };

  const getProofIcon = (type: string) => {
    switch (type) {
      case "repo":
        return <FolderCheck className="w-4 h-4 text-blue-500 shrink-0" />;
      case "code_file":
        return <Code2 className="w-4 h-4 text-purple-500 shrink-0" />;
      case "commit":
        return <GitCommit className="w-4 h-4 text-amber-500 shrink-0" />;
      case "deployment":
        return <Globe className="w-4 h-4 text-emerald-500 shrink-0" />;
      default:
        return <FileText className="w-4 h-4 text-slate-500 shrink-0" />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-2xl w-full shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-950 text-[#2F6FED] dark:text-blue-400 flex items-center justify-center font-bold text-base">
              {skill.skillName.slice(0, 2).toUpperCase()}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-[#0B1A33] dark:text-white">
                  {skill.skillName} Proof Details
                </h3>
                {getStatusBadge(skill.status)}
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Verified public GitHub artifacts & repository inspection
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-center transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-6">
          {/* Explanation */}
          <div className="bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60 rounded-xl p-4">
            <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
              Evidence Assessment
            </h4>
            <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
              {skill.explanation}
            </p>
            <div className="mt-3 flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400">
              <span>Evidence Strength:</span>
              <div className="flex-1 max-w-xs h-2 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
                <div
                  className={`h-full rounded-full ${
                    skill.evidenceStrength >= 75
                      ? "bg-emerald-500"
                      : skill.evidenceStrength >= 40
                      ? "bg-amber-500"
                      : "bg-slate-400"
                  }`}
                  style={{ width: `${skill.evidenceStrength}%` }}
                />
              </div>
              <span className="font-bold text-slate-700 dark:text-slate-200">
                {skill.evidenceStrength}%
              </span>
            </div>
          </div>

          {/* Chips */}
          <div>
            <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
              Detected Artifact Chips
            </h4>
            <div className="flex flex-wrap gap-2">
              {skill.evidenceChips.map((chip, i) => (
                <span
                  key={i}
                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-medium bg-blue-50/80 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200/60 dark:border-blue-800/60"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                  {chip}
                </span>
              ))}
            </div>
          </div>

          {/* Specific Proof Items */}
          {skill.proofs && skill.proofs.length > 0 ? (
            <div className="space-y-3">
              <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                Concrete Proof Artifacts
              </h4>
              {skill.proofs.map((proof) => (
                <div
                  key={proof.id}
                  className="bg-white dark:bg-slate-850 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-2xs space-y-2.5"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800">
                        {getProofIcon(proof.type)}
                      </div>
                      <div>
                        <div className="text-xs font-bold text-[#0B1A33] dark:text-white">
                          {proof.label}
                        </div>
                        {proof.filePath && (
                          <span className="text-[11px] font-mono text-purple-600 dark:text-purple-400">
                            {proof.filePath}
                          </span>
                        )}
                      </div>
                    </div>
                    {proof.url && (
                      <a
                        href={proof.url}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 text-xs font-semibold text-[#2F6FED] hover:underline shrink-0"
                      >
                        <span>Open on GitHub</span>
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    )}
                  </div>

                  <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                    {proof.detail}
                  </p>

                  {proof.codeSnippet && (
                    <div className="mt-2 rounded-lg bg-slate-900 text-slate-100 p-3 font-mono text-xs overflow-x-auto border border-slate-800">
                      <pre>
                        <code>{proof.codeSnippet}</code>
                      </pre>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="p-5 text-center bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200/60 dark:border-amber-900/40 rounded-xl space-y-1">
              <p className="text-xs font-bold text-amber-800 dark:text-amber-300">
                No public GitHub repositories or code files detected for this skill.
              </p>
              <p className="text-xs text-amber-700/80 dark:text-amber-400/80">
                This skill is marked as Claimed-only. Build a 20–40 min micro-task from the Growth Plan to turn it into verified portfolio proof!
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 flex items-center justify-between text-xs text-slate-500">
          <span>Evidence verified against public repository commits & trees</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
