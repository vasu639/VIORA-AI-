import React, { useState } from "react";
import {
  X,
  TrendingUp,
  Award,
  CheckCircle2,
  AlertTriangle,
  Download,
  Printer,
  FileText,
  Code,
  Calendar,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  ChevronRight,
  BookOpen,
  UserCheck,
  GraduationCap,
  Target,
  FileCode,
} from "lucide-react";
import { SessionReport } from "../types";
import { useAuth } from "../context/AuthContext";
import {
  calculateImprovementMetrics,
  generateImprovementHTML,
  generateImprovementMarkdown,
  generateSessionHTML,
  generateSessionMarkdown,
  downloadFile,
} from "../lib/reportExport";

interface ImprovementReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  sessions: SessionReport[];
  onSelectSession?: (session: SessionReport) => void;
}

export const ImprovementReportModal: React.FC<ImprovementReportModalProps> = ({
  isOpen,
  onClose,
  sessions,
  onSelectSession,
}) => {
  const { user } = useAuth();
  const [downloadMenuOpen, setDownloadMenuOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"overview" | "history" | "recommendations">("overview");

  if (!isOpen) return null;

  const metrics = calculateImprovementMetrics(sessions);
  const candidateName = user?.displayName || user?.email?.split("@")[0] || "Candidate";

  // Handle various export downloads
  const handleDownloadHTML = () => {
    const html = generateImprovementHTML(sessions, user);
    downloadFile(html, `VioraAI_Improvement_Report_${candidateName.replace(/\s+/g, "_")}.html`, "text/html");
    setDownloadMenuOpen(false);
  };

  const handleDownloadMarkdown = () => {
    const md = generateImprovementMarkdown(sessions, user);
    downloadFile(md, `VioraAI_Improvement_Report_${candidateName.replace(/\s+/g, "_")}.md`, "text/markdown");
    setDownloadMenuOpen(false);
  };

  const handleDownloadJSON = () => {
    const data = {
      candidate: { name: candidateName, email: user?.email },
      generatedAt: new Date().toISOString(),
      improvementMetrics: metrics,
      sessions,
    };
    downloadFile(JSON.stringify(data, null, 2), `VioraAI_Improvement_Data_${candidateName.replace(/\s+/g, "_")}.json`, "application/json");
    setDownloadMenuOpen(false);
  };

  const handlePrint = () => {
    const html = generateImprovementHTML(sessions, user);
    const printWindow = window.open("", "_blank");
    if (printWindow) {
      printWindow.document.write(html);
      printWindow.document.close();
      printWindow.focus();
      setTimeout(() => {
        printWindow.print();
      }, 350);
    } else {
      // Fallback: download styled html
      handleDownloadHTML();
    }
    setDownloadMenuOpen(false);
  };

  const handleDownloadSingleSession = (e: React.MouseEvent, session: SessionReport, format: "html" | "md") => {
    e.stopPropagation();
    const dateStr = new Date(session.createdAt).toISOString().split("T")[0];
    if (format === "html") {
      const html = generateSessionHTML(session, user);
      downloadFile(html, `VioraAI_Session_${session.mode}_${dateStr}.html`, "text/html");
    } else {
      const md = generateSessionMarkdown(session, user);
      downloadFile(md, `VioraAI_Session_${session.mode}_${dateStr}.md`, "text/markdown");
    }
  };

  const deltaPositive = metrics.scoreDelta >= 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-3xl w-full max-h-[90vh] flex flex-col shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden transition-colors">
        {/* Header Bar */}
        <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-start justify-between bg-slate-50/70 dark:bg-slate-850/70">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-blue-100 dark:bg-blue-950/80 text-[#2F6FED] dark:text-blue-400">
                <TrendingUp className="w-4 h-4" />
              </span>
              <h2 className="text-lg font-bold text-[#0B1A33] dark:text-white">Candidate Improvement & Growth Report</h2>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Audit for <strong className="text-slate-800 dark:text-slate-200 font-semibold">{candidateName}</strong> • {metrics.count} recorded attempt{metrics.count !== 1 ? "s" : ""} • {metrics.totalQuestions} questions evaluated
            </p>
          </div>

          <div className="flex items-center gap-2">
            {/* Download Dropdown */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setDownloadMenuOpen(!downloadMenuOpen)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#2F6FED] hover:bg-blue-600 text-white font-semibold text-xs rounded-xl shadow-xs transition-colors"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download Report</span>
              </button>

              {downloadMenuOpen && (
                <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-slate-850 rounded-xl shadow-xl border border-slate-200 dark:border-slate-750 py-1.5 z-50 animate-in fade-in zoom-in-95 duration-150">
                  <div className="px-3 py-1 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                    Select Download Format
                  </div>

                  <button
                    type="button"
                    onClick={handleDownloadHTML}
                    className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-blue-50 dark:hover:bg-slate-800 hover:text-[#2F6FED] dark:hover:text-blue-400 transition-colors"
                  >
                    <FileText className="w-4 h-4 text-blue-500" />
                    <div className="text-left">
                      <div className="font-semibold">HTML Document (.html)</div>
                      <div className="text-[10px] text-slate-400 dark:text-slate-500">Standalone styled offline file</div>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={handlePrint}
                    className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-blue-50 dark:hover:bg-slate-800 hover:text-[#2F6FED] dark:hover:text-blue-400 transition-colors"
                  >
                    <Printer className="w-4 h-4 text-emerald-600" />
                    <div className="text-left">
                      <div className="font-semibold">Print / Save as PDF</div>
                      <div className="text-[10px] text-slate-400 dark:text-slate-500">Direct print dialogue</div>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={handleDownloadMarkdown}
                    className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-blue-50 dark:hover:bg-slate-800 hover:text-[#2F6FED] dark:hover:text-blue-400 transition-colors"
                  >
                    <FileCode className="w-4 h-4 text-purple-600" />
                    <div className="text-left">
                      <div className="font-semibold">Markdown (.md)</div>
                      <div className="text-[10px] text-slate-400 dark:text-slate-500">Clean text notes format</div>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={handleDownloadJSON}
                    className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-blue-50 dark:hover:bg-slate-800 hover:text-[#2F6FED] dark:hover:text-blue-400 transition-colors"
                  >
                    <Code className="w-4 h-4 text-slate-500" />
                    <div className="text-left">
                      <div className="font-semibold">Raw Data (.json)</div>
                      <div className="text-[10px] text-slate-400 dark:text-slate-500">Structured audit export</div>
                    </div>
                  </button>
                </div>
              )}
            </div>

            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tab Selector */}
        <div className="flex border-b border-slate-200 dark:border-slate-800 px-5 bg-white dark:bg-slate-900 text-xs font-semibold">
          <button
            onClick={() => setActiveTab("overview")}
            className={`py-3 px-3 border-b-2 transition-all ${
              activeTab === "overview"
                ? "border-[#2F6FED] text-[#2F6FED] dark:text-blue-400"
                : "border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"
            }`}
          >
            Growth Overview
          </button>
          <button
            onClick={() => setActiveTab("history")}
            className={`py-3 px-3 border-b-2 transition-all ${
              activeTab === "history"
                ? "border-[#2F6FED] text-[#2F6FED] dark:text-blue-400"
                : "border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"
            }`}
          >
            Attempts Ledger ({sessions.length})
          </button>
          <button
            onClick={() => setActiveTab("recommendations")}
            className={`py-3 px-3 border-b-2 transition-all ${
              activeTab === "recommendations"
                ? "border-[#2F6FED] text-[#2F6FED] dark:text-blue-400"
                : "border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"
            }`}
          >
            Action Plan & Focus
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 overflow-y-auto space-y-6">
          {sessions.length === 0 ? (
            <div className="py-16 text-center text-slate-400 dark:text-slate-500 space-y-3">
              <TrendingUp className="w-10 h-10 mx-auto text-slate-300 dark:text-slate-600 stroke-1" />
              <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">No Assessment Data Yet</p>
              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto leading-relaxed">
                Complete your first Viva Voce or Mock Interview session. Your improvement trajectory, accuracy progress, and downloadable report will appear right here.
              </p>
            </div>
          ) : activeTab === "overview" ? (
            <>
              {/* Top 4 Core Metrics Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {/* Metric 1: Progression Delta */}
                <div className="p-3.5 bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800 rounded-xl space-y-1">
                  <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
                    Score Growth
                  </span>
                  <div className="flex items-baseline gap-1">
                    <span className="text-xl font-black text-[#0B1A33] dark:text-white">{metrics.latestScore}%</span>
                    <span
                      className={`text-xs font-bold ${
                        deltaPositive ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"
                      }`}
                    >
                      {deltaPositive ? `+${metrics.scoreDelta}%` : `${metrics.scoreDelta}%`}
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-400 dark:text-slate-500 truncate">
                    Started at {metrics.initialScore}%
                  </p>
                </div>

                {/* Metric 2: All-Time Average */}
                <div className="p-3.5 bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800 rounded-xl space-y-1">
                  <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
                    Average Merit
                  </span>
                  <div className="text-xl font-black text-[#0B1A33] dark:text-white">{metrics.avgScore}%</div>
                  <p className="text-[10px] text-slate-400 dark:text-slate-500 truncate">Across all sessions</p>
                </div>

                {/* Metric 3: Technical Correctness */}
                <div className="p-3.5 bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800 rounded-xl space-y-1">
                  <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
                    Technical Accuracy
                  </span>
                  <div className="text-xl font-black text-emerald-700 dark:text-emerald-400">{metrics.avgCorrectness}%</div>
                  <p className="text-[10px] text-slate-400 dark:text-slate-500 truncate">Factual precision</p>
                </div>

                {/* Metric 4: Oral Confidence & Delivery */}
                <div className="p-3.5 bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800 rounded-xl space-y-1">
                  <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
                    Oral Confidence
                  </span>
                  <div className="text-xl font-black text-[#2F6FED] dark:text-blue-400">{metrics.avgConfidence}%</div>
                  <p className="text-[10px] text-slate-400 dark:text-slate-500 truncate">Verbal delivery rating</p>
                </div>
              </div>

              {/* Readiness Status Spotlight */}
              <div className="p-4 bg-gradient-to-br from-blue-50/60 to-indigo-50/60 dark:from-blue-950/40 dark:to-indigo-950/40 border border-blue-100 dark:border-blue-900/60 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[#2F6FED] text-white flex items-center justify-center shrink-0 shadow-xs">
                    <Target className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-[#0B1A33] dark:text-white">Current Assessment Readiness Rating</h4>
                    <p className="text-xs text-[#2F6FED] dark:text-blue-400 font-semibold">{metrics.readinessStatus}</p>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <div className="text-2xl font-black text-[#0B1A33] dark:text-white">{metrics.avgReadiness}%</div>
                  <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    Readiness Index
                  </span>
                </div>
              </div>

              {/* Progress Timeline Bars */}
              <div className="space-y-2 p-4 bg-white dark:bg-slate-850 border border-slate-200 dark:border-slate-800 rounded-2xl">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-[#0B1A33] dark:text-white">Session Trajectory Curve</span>
                  <span className="text-slate-400 dark:text-slate-500 text-[11px]">Oldest → Most Recent</span>
                </div>

                <div className="flex items-end gap-2 h-24 pt-4 px-2">
                  {sessions
                    .slice()
                    .reverse()
                    .slice(-8)
                    .map((s, idx) => {
                      const score = s.overallScore || 60;
                      const heightPercent = Math.max(20, Math.min(100, score));
                      return (
                        <div key={s.id || idx} className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end group relative">
                          <span className="text-[10px] font-bold text-slate-600 dark:text-slate-400 group-hover:text-[#2F6FED] dark:group-hover:text-blue-400 transition-colors">
                            {score}%
                          </span>
                          <div
                            className={`w-full rounded-t-md transition-all duration-300 ${
                              idx === sessions.length - 1
                                ? "bg-[#2F6FED] dark:bg-blue-500"
                                : "bg-slate-200 dark:bg-slate-700 group-hover:bg-blue-300 dark:group-hover:bg-blue-600"
                            }`}
                            style={{ height: `${heightPercent}%` }}
                          />
                          <span className="text-[9px] text-slate-400 dark:text-slate-500 truncate max-w-[40px]">
                            {new Date(s.createdAt).toLocaleDateString(undefined, {
                              month: "numeric",
                              day: "numeric",
                            })}
                          </span>
                        </div>
                      );
                    })}
                </div>
              </div>

              {/* Strengths & Weaknesses 2-Column */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Strengths */}
                <div className="p-4 bg-emerald-50/50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/60 rounded-xl space-y-2.5">
                  <div className="flex items-center gap-2 text-xs font-bold text-emerald-900 dark:text-emerald-300">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                    <span>Verified Core Strengths</span>
                  </div>
                  {metrics.strengths.length > 0 ? (
                    <ul className="space-y-1.5 text-xs text-emerald-800 dark:text-emerald-300">
                      {metrics.strengths.map((str, idx) => (
                        <li key={idx} className="flex items-start gap-1.5 leading-relaxed">
                          <span className="text-emerald-500 font-bold">•</span>
                          <span>{str}</span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-xs text-slate-500 dark:text-slate-400 italic">Complete more sessions to establish strength patterns.</p>
                  )}
                </div>

                {/* Priority Areas */}
                <div className="p-4 bg-rose-50/50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800/60 rounded-xl space-y-2.5">
                  <div className="flex items-center gap-2 text-xs font-bold text-rose-900 dark:text-rose-300">
                    <AlertTriangle className="w-4 h-4 text-rose-600 dark:text-rose-400" />
                    <span>Priority Areas for Revision</span>
                  </div>
                  {metrics.improvements.length > 0 ? (
                    <ul className="space-y-1.5 text-xs text-rose-800 dark:text-rose-300">
                      {metrics.improvements.map((imp, idx) => (
                        <li key={idx} className="flex items-start gap-1.5 leading-relaxed">
                          <span className="text-rose-500 font-bold">•</span>
                          <span>{imp}</span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-xs text-slate-500 dark:text-slate-400 italic">No persistent deficiencies flagged.</p>
                  )}
                </div>
              </div>
            </>
          ) : activeTab === "history" ? (
            /* Historical Attempts Table */
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 pb-1">
                <span>Click any session to view details or download its individual audit report.</span>
              </div>

              <div className="divide-y divide-slate-100 dark:divide-slate-800 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden bg-white dark:bg-slate-900">
                {sessions.map((sess, idx) => (
                  <div
                    key={sess.id || idx}
                    onClick={() => {
                      if (onSelectSession) {
                        onSelectSession(sess);
                        onClose();
                      }
                    }}
                    className="p-3.5 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-850 cursor-pointer transition-colors group"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-9 h-9 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-[#2F6FED] dark:text-blue-400 flex items-center justify-center shrink-0">
                        {sess.mode === "viva" ? (
                          <BookOpen className="w-4 h-4" />
                        ) : (
                          <UserCheck className="w-4 h-4" />
                        )}
                      </div>

                      <div className="truncate">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-[#0B1A33] dark:text-white">
                            {sess.mode === "viva" ? "Viva Voce" : `Interview (${sess.subMode || "General"})`}
                          </span>
                          <span className="text-[11px] text-slate-400 dark:text-slate-500">
                            {new Date(sess.createdAt).toLocaleDateString(undefined, {
                              month: "short",
                              day: "numeric",
                              year: "numeric",
                            })}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 dark:text-slate-400 truncate mt-0.5">
                          {sess.meta.degreeProgram || sess.meta.targetRole || sess.meta.courseName || `${sess.answers?.length || 0} questions answered`}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 shrink-0">
                      <div className="text-right">
                        <span className="text-sm font-black text-[#0B1A33] dark:text-white">{sess.overallScore}%</span>
                        <span className="text-[10px] text-[#2F6FED] dark:text-blue-400 font-semibold block">
                          {sess.readinessPercentage || sess.overallScore}% ready
                        </span>
                      </div>

                      {/* Direct Download Button for this Session */}
                      <button
                        type="button"
                        onClick={(e) => handleDownloadSingleSession(e, sess, "html")}
                        className="p-2 text-slate-400 hover:text-[#2F6FED] dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-slate-800 rounded-lg transition-colors"
                        title="Download this session's report (HTML / Print)"
                      >
                        <Download className="w-4 h-4" />
                      </button>

                      <ChevronRight className="w-4 h-4 text-slate-300 dark:text-slate-600 group-hover:text-[#2F6FED] dark:group-hover:text-blue-400 transition-colors" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            /* Action Plan & Recommendations */
            <div className="space-y-4">
              <div className="p-4 bg-blue-50/60 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900/60 rounded-xl space-y-2">
                <div className="flex items-center gap-2 text-xs font-bold text-[#0B1A33] dark:text-white">
                  <Sparkles className="w-4 h-4 text-[#2F6FED] dark:text-blue-400" />
                  <span>Personalized Oral Defense Preparation Roadmap</span>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                  Based on your performance across all recorded practice sessions, here is your customized 3-step action plan to maximize your final grade or interview offer rate:
                </p>
              </div>

              <div className="space-y-3">
                <div className="p-3.5 bg-white dark:bg-slate-850 border border-slate-200 dark:border-slate-800 rounded-xl flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-950/80 text-[#2F6FED] dark:text-blue-400 font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                    1
                  </div>
                  <div className="space-y-1">
                    <h5 className="text-xs font-bold text-[#0B1A33] dark:text-white">Target Weak Technical Modules</h5>
                    <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                      Focus revision on the specific concepts where your correctness score was under 60%. Review key definitions, standard architectures, and trade-offs.
                    </p>
                  </div>
                </div>

                <div className="p-3.5 bg-white dark:bg-slate-850 border border-slate-200 dark:border-slate-800 rounded-xl flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-950/80 text-[#2F6FED] dark:text-blue-400 font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                    2
                  </div>
                  <div className="space-y-1">
                    <h5 className="text-xs font-bold text-[#0B1A33] dark:text-white">Refine Oral Presence & Delivery</h5>
                    <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                      {metrics.coachingTips[0] ||
                        "Practice answering with deliberate pause before speaking, avoiding fillers like 'um' or 'like', and maintaining stable eye gaze at the camera."}
                    </p>
                  </div>
                </div>

                <div className="p-3.5 bg-white dark:bg-slate-850 border border-slate-200 dark:border-slate-800 rounded-xl flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-950/80 text-[#2F6FED] dark:text-blue-400 font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                    3
                  </div>
                  <div className="space-y-1">
                    <h5 className="text-xs font-bold text-[#0B1A33] dark:text-white">Re-run with Higher Difficulty</h5>
                    <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                      Once you hit 80%+ readiness, test your resilience under "Advanced" viva difficulty or the "Rapid Fire" interview round to build instinctive confidence.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-850 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
            <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span>Authenticated and verified by Viora AI</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleDownloadHTML}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 hover:border-slate-400 dark:hover:border-slate-600 text-slate-700 dark:text-slate-200 font-semibold text-xs rounded-xl shadow-2xs hover:bg-slate-50 dark:hover:bg-slate-750 transition-all"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download HTML Report</span>
            </button>

            <button
              type="button"
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-[#0B1A33] dark:bg-[#2F6FED] hover:bg-[#16233C] dark:hover:bg-blue-600 text-white font-semibold text-xs rounded-xl shadow-xs transition-colors"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print / Save as PDF</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
