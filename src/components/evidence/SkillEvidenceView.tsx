import React, { useState } from "react";
import { CheckCircle2, AlertCircle, HelpCircle, ExternalLink, Eye, Filter, Sparkles, FolderGit2, Check } from "lucide-react";
import { SkillEvidenceItem, SkillStatus } from "../../types";

interface SkillEvidenceViewProps {
  skills: SkillEvidenceItem[];
  onViewProof: (skill: SkillEvidenceItem) => void;
}

export const SkillEvidenceView: React.FC<SkillEvidenceViewProps> = ({ skills, onViewProof }) => {
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");

  const provenCount = skills.filter((s) => s.status === "Proven").length;
  const partialCount = skills.filter((s) => s.status === "Partial").length;
  const claimedCount = skills.filter((s) => s.status === "Claimed-only").length;

  const filteredSkills = skills.filter((s) => {
    if (statusFilter !== "all" && s.status !== statusFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        s.skillName.toLowerCase().includes(q) ||
        s.explanation.toLowerCase().includes(q) ||
        s.evidenceChips.some((chip) => chip.toLowerCase().includes(q))
      );
    }
    return true;
  });

  const getStatusBadge = (status: SkillStatus) => {
    switch (status) {
      case "Proven":
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 shadow-2xs">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
            <span>Proven (1.0 pt)</span>
          </span>
        );
      case "Partial":
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-50 dark:bg-amber-950/70 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800 shadow-2xs">
            <AlertCircle className="w-3.5 h-3.5 text-amber-500 shrink-0" />
            <span>Partial (0.5 pt)</span>
          </span>
        );
      case "Claimed-only":
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 shadow-2xs">
            <HelpCircle className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span>Claimed-only (0.0 pt)</span>
          </span>
        );
    }
  };

  const getCardBorder = (status: SkillStatus) => {
    switch (status) {
      case "Proven":
        return "border-emerald-200/90 dark:border-emerald-900/60 hover:border-emerald-400";
      case "Partial":
        return "border-amber-200/90 dark:border-amber-900/60 hover:border-amber-400";
      case "Claimed-only":
        return "border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700";
    }
  };

  return (
    <div className="space-y-6">
      {/* Intro & Filter Bar */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-5 shadow-xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        {/* Status Pills */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setStatusFilter("all")}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              statusFilter === "all"
                ? "bg-[#2F6FED] text-white shadow-xs"
                : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-750"
            }`}
          >
            All Skills ({skills.length})
          </button>
          <button
            onClick={() => setStatusFilter("Proven")}
            className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              statusFilter === "Proven"
                ? "bg-emerald-600 text-white shadow-xs"
                : "bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-100"
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            Proven ({provenCount})
          </button>
          <button
            onClick={() => setStatusFilter("Partial")}
            className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              statusFilter === "Partial"
                ? "bg-amber-600 text-white shadow-xs"
                : "bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-400 hover:bg-amber-100"
            }`}
          >
            <AlertCircle className="w-3.5 h-3.5" />
            Partial ({partialCount})
          </button>
          <button
            onClick={() => setStatusFilter("Claimed-only")}
            className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              statusFilter === "Claimed-only"
                ? "bg-slate-700 text-white shadow-xs"
                : "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200"
            }`}
          >
            <HelpCircle className="w-3.5 h-3.5" />
            Claimed-only ({claimedCount})
          </button>
        </div>

        {/* Search */}
        <div className="relative max-w-xs w-full">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Filter by skill, repo, file..."
            className="w-full px-3.5 py-1.5 text-xs text-slate-800 dark:text-white bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-750 rounded-xl focus:border-[#2F6FED] focus:outline-hidden"
          />
        </div>
      </div>

      {/* Skills Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {filteredSkills.map((skill) => (
          <div
            key={skill.id}
            className={`bg-white dark:bg-slate-900 border-2 ${getCardBorder(
              skill.status
            )} rounded-2xl p-5 shadow-xs hover:shadow-md transition-all flex flex-col justify-between`}
          >
            <div className="space-y-3.5">
              {/* Card Header */}
              <div className="flex items-start justify-between gap-3">
                <div>
                  {skill.category && (
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                      {skill.category}
                    </span>
                  )}
                  <h3 className="text-base font-extrabold text-[#0B1A33] dark:text-white">
                    {skill.skillName}
                  </h3>
                </div>
                {getStatusBadge(skill.status)}
              </div>

              {/* Strength Indicator */}
              <div className="space-y-1">
                <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                  <span>Evidence Strength</span>
                  <span className="font-bold text-slate-700 dark:text-slate-200">
                    {skill.evidenceStrength}%
                  </span>
                </div>
                <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      skill.status === "Proven"
                        ? "bg-emerald-500"
                        : skill.status === "Partial"
                        ? "bg-amber-500"
                        : "bg-slate-300 dark:bg-slate-700"
                    }`}
                    style={{ width: `${Math.max(8, skill.evidenceStrength)}%` }}
                  />
                </div>
              </div>

              {/* Status Explanation */}
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                {skill.explanation}
              </p>

              {/* Evidence Chips */}
              <div className="space-y-1.5 pt-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Detected Evidence:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {skill.evidenceChips.map((chip, i) => (
                    <span
                      key={i}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-medium bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200/80 dark:border-slate-750"
                    >
                      <FolderGit2 className="w-3 h-3 text-[#2F6FED]" />
                      <span className="truncate max-w-[200px]">{chip}</span>
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Bottom Actions */}
            <div className="pt-4 mt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <span className="text-[11px] text-slate-400">
                {skill.proofs.length} concrete proof {skill.proofs.length === 1 ? "item" : "items"}
              </span>
              <button
                onClick={() => onViewProof(skill)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-[#2F6FED] dark:text-blue-400 bg-blue-50 dark:bg-blue-950/60 hover:bg-blue-100 dark:hover:bg-blue-900/60 rounded-xl transition-colors"
              >
                <Eye className="w-3.5 h-3.5" />
                <span>View Proof</span>
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
