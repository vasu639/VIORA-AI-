import React, { useState } from "react";
import {
  Trophy,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Sparkles,
  Camera,
  Copy,
  Check,
  ChevronDown,
  ChevronUp,
  Mic,
  Eye,
  Activity,
  Maximize,
  Wind,
  GraduationCap,
  Briefcase,
  Target,
  ShieldCheck,
  XCircle,
  Download,
  Printer,
  FileText,
  FileCode,
  TrendingUp,
} from "lucide-react";
import { SessionReport } from "../types";
import { useAuth } from "../context/AuthContext";
import {
  generateSessionHTML,
  generateSessionMarkdown,
  downloadFile,
} from "../lib/reportExport";

interface ResultsSummaryProps {
  session: SessionReport;
  onRetake: () => void;
  onStartNew: () => void;
  onOpenImprovementReport?: () => void;
}

export const ResultsSummary: React.FC<ResultsSummaryProps> = ({
  session,
  onRetake,
  onStartNew,
  onOpenImprovementReport,
}) => {
  const { user } = useAuth();
  const [copied, setCopied] = useState(false);
  const [downloadOpen, setDownloadOpen] = useState(false);
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);

  const isViva = session.mode === "viva";
  const overallScore = session.overallScore ?? 75;
  const correctnessAvg = session.correctnessAverage ?? overallScore;
  const confidenceAvg = session.confidenceAverage ?? overallScore;
  const readinessPct = session.readinessPercentage ?? overallScore;

  const candidateName = user?.displayName || user?.email?.split("@")[0] || "Candidate";

  const handleDownloadHTML = () => {
    const html = generateSessionHTML(session, user);
    const dateStr = new Date(session.createdAt).toISOString().split("T")[0];
    downloadFile(html, `VioraAI_Assessment_${session.mode}_${dateStr}.html`, "text/html");
    setDownloadOpen(false);
  };

  const handleDownloadMarkdown = () => {
    const md = generateSessionMarkdown(session, user);
    const dateStr = new Date(session.createdAt).toISOString().split("T")[0];
    downloadFile(md, `VioraAI_Assessment_${session.mode}_${dateStr}.md`, "text/markdown");
    setDownloadOpen(false);
  };

  const handlePrint = () => {
    const html = generateSessionHTML(session, user);
    const printWindow = window.open("", "_blank");
    if (printWindow) {
      printWindow.document.write(html);
      printWindow.document.close();
      printWindow.focus();
      setTimeout(() => {
        printWindow.print();
      }, 350);
    } else {
      handleDownloadHTML();
    }
    setDownloadOpen(false);
  };

  const targetTitle = isViva
    ? session.meta.degreeProgram || session.meta.courseName || "College Viva Voce"
    : session.meta.targetRole || "Technical Job Interview";

  const getScoreBadgeStyle = (val: number) => {
    if (val >= 85) return "text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/50 border-emerald-300 dark:border-emerald-800";
    if (val >= 70) return "text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-950/50 border-blue-300 dark:border-blue-800";
    if (val >= 50) return "text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/50 border-amber-300 dark:border-amber-800";
    return "text-rose-700 dark:text-rose-300 bg-rose-50 dark:bg-rose-950/50 border-rose-300 dark:border-rose-800";
  };

  const getReadinessTheme = (val: number) => {
    if (val >= 85) {
      return {
        badgeBg: "bg-emerald-100 dark:bg-emerald-950/80 text-emerald-900 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800",
        barBg: "bg-emerald-600",
        icon: ShieldCheck,
      };
    }
    if (val >= 70) {
      return {
        badgeBg: "bg-blue-100 dark:bg-blue-950/80 text-blue-900 dark:text-blue-300 border-blue-300 dark:border-blue-800",
        barBg: "bg-[#2F6FED]",
        icon: CheckCircle2,
      };
    }
    if (val >= 50) {
      return {
        badgeBg: "bg-amber-100 dark:bg-amber-950/80 text-amber-900 dark:text-amber-300 border-amber-300 dark:border-amber-800",
        barBg: "bg-amber-500",
        icon: AlertTriangle,
      };
    }
    return {
      badgeBg: "bg-rose-100 dark:bg-rose-950/80 text-rose-900 dark:text-rose-300 border-rose-300 dark:border-rose-800",
      barBg: "bg-rose-600",
      icon: XCircle,
    };
  };

  const readinessTheme = getReadinessTheme(readinessPct);
  const ReadinessIcon = readinessTheme.icon;

  const handleCopyReport = () => {
    const textLines = [
      `VIORA AI — ASSESSMENT & READINESS AUDIT`,
      `Mode: ${isViva ? "COLLEGE VIVA VOCE" : "JOB INTERVIEW"} ${session.subMode ? `(${session.subMode.toUpperCase()})` : ""}`,
      `Target: ${targetTitle}`,
      `Course / Syllabus: ${session.meta.courseName || "Candidate Document"}`,
      `\n--- EVALUATION METRICS ---`,
      `Genuine Merit Score: ${overallScore}% (${session.grade})`,
      `${isViva ? "College Viva Readiness" : "Job Interview Readiness"}: ${readinessPct}% [${session.readinessLabel}]`,
      `Technical Correctness: ${correctnessAvg}%`,
      `Oral Confidence & Delivery: ${confidenceAvg}%`,
      `\nREADINESS VERDICT:`,
      session.readinessVerdictExplanation || "Evaluation completed based on genuine response metrics.",
      `\nEXECUTIVE APPRAISAL:`,
      session.executiveSummary || "Demonstrated baseline understanding.",
      `\nSTRENGTHS:`,
      ...(session.strengths || []).map((s) => `• ${s}`),
      `\nCRITICAL FOCUS AREAS:`,
      ...(session.improvements || []).map((i) => `• ${i}`),
      `\nORAL PRESENCE & POSTURE COACHING:`,
      session.oralPresenceTips || "Speak decisively and maintain consistent gaze.",
      `\n--- QUESTION BREAKDOWN ---`,
      ...session.answers.map(
        (a, i) =>
          `Q${i + 1}: ${a.questionText}\nAnswer: ${a.answerText || "Skipped"}\nCorrectness: ${
            a.correctnessScore !== undefined ? `${a.correctnessScore}%` : "N/A"
          } | Confidence: ${
            a.confidenceScore !== undefined ? `${a.confidenceScore}%` : "N/A"
          } | Rating: ${a.score || 0}/10\nVerdict: ${a.verdict || "Evaluated"}\nCritique: ${
            a.feedback || ""
          }\n`
      ),
    ].join("\n");

    navigator.clipboard.writeText(textLines);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      {/* Top Banner */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 sm:p-8 shadow-xs space-y-6 transition-colors">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 pb-6 border-b border-slate-100 dark:border-slate-800">
          <div className="space-y-1.5">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-[#2F6FED] dark:text-blue-400 bg-blue-50 dark:bg-blue-950/60 px-2.5 py-0.5 rounded-full border border-blue-100 dark:border-blue-900/60 flex items-center gap-1">
                {isViva ? <GraduationCap className="w-3.5 h-3.5" /> : <Briefcase className="w-3.5 h-3.5" />}
                {isViva ? "College Viva Voce Evaluation" : "Job Interview Evaluation"}
              </span>
              <span className="text-xs text-slate-400 dark:text-slate-500">
                {new Date(session.createdAt).toLocaleDateString(undefined, {
                  month: "short",
                  day: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold text-[#0B1A33] dark:text-white tracking-tight">
              Performance & Readiness Audit
            </h1>

            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">
              <strong className="text-slate-900 dark:text-slate-200">{targetTitle}</strong>
              {session.meta.courseName && ` • ${session.meta.courseName}`}
              {session.meta.level && ` • Level: ${session.meta.level}`}
              {session.subMode && ` • Round: ${session.subMode}`}
            </p>
          </div>

          {/* Genuine Earned Merit Score Card */}
          <div className="flex items-center gap-4 shrink-0 bg-slate-50 dark:bg-slate-850 border border-slate-200/90 dark:border-slate-800 p-4 sm:p-5 rounded-2xl shadow-2xs">
            <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-[#0B1A33] to-[#2F6FED] text-white flex items-center justify-center shadow-xs">
              <Trophy className="w-7 h-7 text-amber-300" />
            </div>
            <div>
              <div className="flex items-baseline gap-1.5">
                <span className="text-3xl font-black text-[#0B1A33] dark:text-white">{overallScore}%</span>
                <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">Merit Score</span>
              </div>
              <div className="text-xs font-bold text-[#2F6FED] dark:text-blue-400 mt-0.5">
                {session.grade}
              </div>
            </div>
          </div>
        </div>

        {/* Readiness Spotlight Card */}
        <div className="p-5 sm:p-6 bg-gradient-to-br from-slate-50 to-blue-50/40 dark:from-slate-850 dark:to-blue-950/40 border border-blue-100 dark:border-blue-900/60 rounded-2xl space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-[#2F6FED] text-white flex items-center justify-center">
                <Target className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-[#0B1A33] dark:text-white">
                  {isViva ? "College Viva Voce Readiness" : "Technical Job Interview Readiness"}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {isViva
                    ? `Preparedness to defend your degree before university examiners`
                    : `Probability of clearing technical screening and receiving an offer`}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2.5">
              <span className="text-2xl font-black text-[#0B1A33] dark:text-white">{readinessPct}%</span>
              <span
                className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold border ${readinessTheme.badgeBg}`}
              >
                <ReadinessIcon className="w-3.5 h-3.5" />
                {session.readinessLabel}
              </span>
            </div>
          </div>

          {/* Readiness Meter */}
          <div className="w-full bg-slate-200 dark:bg-slate-700 h-2.5 rounded-full overflow-hidden">
            <div
              className={`h-full transition-all duration-500 rounded-full ${readinessTheme.barBg}`}
              style={{ width: `${Math.max(5, Math.min(100, readinessPct))}%` }}
            />
          </div>

          {/* Verdict Explanation */}
          <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed font-medium bg-white/80 dark:bg-slate-900/80 p-3.5 rounded-xl border border-blue-100 dark:border-blue-900/60">
            {session.readinessVerdictExplanation}
          </p>
        </div>

        {/* Dual Core Pillars: Correctness vs Confidence */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Correctness Pillar */}
          <div className="p-4 bg-white dark:bg-slate-850 border border-slate-200 dark:border-slate-800 rounded-xl space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                Technical Correctness
              </span>
              <span className="font-extrabold text-sm text-[#0B1A33] dark:text-white">{correctnessAvg}%</span>
            </div>
            <div className="w-full bg-slate-100 dark:bg-slate-700 h-2 rounded-full overflow-hidden">
              <div
                className="bg-emerald-600 dark:bg-emerald-500 h-full rounded-full transition-all duration-300"
                style={{ width: `${correctnessAvg}%` }}
              />
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Measures precision of technical facts, logic, principles, and directness of answer.
            </p>
          </div>

          {/* Confidence Pillar */}
          <div className="p-4 bg-white dark:bg-slate-850 border border-slate-200 dark:border-slate-800 rounded-xl space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                Oral Confidence & Delivery
              </span>
              <span className="font-extrabold text-sm text-[#0B1A33] dark:text-white">{confidenceAvg}%</span>
            </div>
            <div className="w-full bg-slate-100 dark:bg-slate-700 h-2 rounded-full overflow-hidden">
              <div
                className="bg-[#2F6FED] dark:bg-blue-500 h-full rounded-full transition-all duration-300"
                style={{ width: `${confidenceAvg}%` }}
              />
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Evaluates assertiveness, conviction, structure, and absence of hesitation/hedging.
            </p>
          </div>
        </div>

        {/* Executive Summary */}
        {session.executiveSummary && (
          <div className="p-4 bg-slate-50/90 dark:bg-slate-850/90 border border-slate-200/80 dark:border-slate-800 rounded-xl text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
            <span className="font-bold text-[#0B1A33] dark:text-white block mb-1">Examiner Appraisal:</span>
            {session.executiveSummary}
          </div>
        )}

        {/* Strengths & Improvements Bento */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {session.strengths && session.strengths.length > 0 && (
            <div className="p-4 bg-emerald-50/60 dark:bg-emerald-950/30 border border-emerald-200/80 dark:border-emerald-800/60 rounded-xl space-y-2">
              <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-900 dark:text-emerald-300">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                Demonstrated Strengths
              </div>
              <ul className="space-y-1 text-xs text-emerald-950 dark:text-emerald-200">
                {session.strengths.map((st, i) => (
                  <li key={i} className="flex items-start gap-1.5">
                    <span className="text-emerald-600 dark:text-emerald-400 font-bold">•</span>
                    <span>{st}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {session.improvements && session.improvements.length > 0 && (
            <div className="p-4 bg-amber-50/60 dark:bg-amber-950/30 border border-amber-200/80 dark:border-amber-800/60 rounded-xl space-y-2">
              <div className="flex items-center gap-1.5 text-xs font-bold text-amber-900 dark:text-amber-300">
                <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                Key Focus Areas to Polish
              </div>
              <ul className="space-y-1 text-xs text-amber-950 dark:text-amber-200">
                {session.improvements.map((im, i) => (
                  <li key={i} className="flex items-start gap-1.5">
                    <span className="text-amber-600 dark:text-amber-400 font-bold">•</span>
                    <span>{im}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Coach Notes Block */}
        {(() => {
          const uniqueTips = Array.from(
            new Set((session.postureTips || []).map((t) => t.trim()).filter(Boolean))
          );

          if (uniqueTips.length === 0 && !session.oralPresenceTips) return null;

          const getTipCategory = (text: string) => {
            const lower = text.toLowerCase();
            if (lower.includes("eye") || lower.includes("gaze") || lower.includes("lens") || lower.includes("look")) {
              return { label: "Eye Contact", icon: Eye, bg: "bg-blue-50 text-blue-700 border-blue-200" };
            }
            if (lower.includes("shoulder") || lower.includes("clavicle") || lower.includes("tension") || lower.includes("unclench")) {
              return { label: "Relaxed Shoulders", icon: Activity, bg: "bg-amber-50 text-amber-700 border-amber-200" };
            }
            if (lower.includes("spine") || lower.includes("lean") || lower.includes("sit") || lower.includes("chest") || lower.includes("posture")) {
              return { label: "Posture & Spine", icon: Activity, bg: "bg-purple-50 text-purple-700 border-purple-200" };
            }
            if (lower.includes("frame") || lower.includes("camera") || lower.includes("headroom") || lower.includes("height")) {
              return { label: "Framing & Angle", icon: Maximize, bg: "bg-emerald-50 text-emerald-700 border-emerald-200" };
            }
            return { label: "Vocal & Presence", icon: Wind, bg: "bg-slate-50 text-slate-700 border-slate-200" };
          };

          return (
            <div className="p-4 bg-blue-50/70 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900/60 rounded-xl space-y-2.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-md bg-[#2F6FED] text-white flex items-center justify-center">
                    <Camera className="w-3.5 h-3.5" />
                  </div>
                  <h3 className="text-xs font-bold text-[#0B1A33] dark:text-white uppercase tracking-wider">
                    Body Language & Presence Coach Takeaways
                  </h3>
                </div>
                {uniqueTips.length > 0 && (
                  <span className="text-[10px] text-blue-700 dark:text-blue-300 font-medium bg-white dark:bg-slate-850 px-2 py-0.5 rounded-full border border-blue-200 dark:border-blue-800">
                    {uniqueTips.length} Observations
                  </span>
                )}
              </div>

              {session.oralPresenceTips && (
                <p className="text-xs text-slate-800 dark:text-slate-200 bg-white/90 dark:bg-slate-900/90 p-2.5 rounded-lg border border-blue-100 dark:border-blue-900/60 leading-relaxed font-medium">
                  <strong className="text-slate-900 dark:text-white">Examiner Advice:</strong> {session.oralPresenceTips}
                </p>
              )}

              {uniqueTips.length > 0 && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                  {uniqueTips.map((tip, i) => {
                    const cat = getTipCategory(tip);
                    const CatIcon = cat.icon;
                    return (
                      <div
                        key={i}
                        className="bg-white/95 dark:bg-slate-900/95 p-3 rounded-lg border border-blue-100 dark:border-blue-900/60 text-xs text-slate-700 dark:text-slate-300 space-y-1.5 shadow-2xs"
                      >
                        <div className="flex items-center gap-1.5">
                          <span className={`inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full border ${cat.bg}`}>
                            <CatIcon className="w-2.5 h-2.5" />
                            {cat.label}
                          </span>
                        </div>
                        <p className="leading-relaxed text-slate-800 dark:text-slate-200">{tip}</p>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })()}
      </div>

      {/* Question by Question Detailed Transcript */}
      <div className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
            Per-Question Answer Ratings & Analysis ({session.answers.length})
          </h2>
          <span className="text-xs text-slate-400 dark:text-slate-500">Click any card to inspect critique</span>
        </div>

        {session.answers.map((ans, idx) => {
          const isExpanded = expandedIndex === idx;
          const corr = ans.correctnessScore ?? (ans.score ? ans.score * 10 : 50);
          const conf = ans.confidenceScore ?? (ans.score ? ans.score * 10 : 50);

          return (
            <div
              key={idx}
              className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-xl p-4 sm:p-5 shadow-2xs space-y-3 hover:border-slate-300 dark:hover:border-slate-700 transition-all cursor-pointer"
              onClick={() => setExpandedIndex(isExpanded ? null : idx)}
            >
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                <div className="space-y-1.5 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs font-bold text-slate-500 dark:text-slate-400">Q{idx + 1}</span>
                    <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 truncate max-w-xs">
                      {ans.topicOrGrounding || "Focus Topic"}
                    </span>
                    {ans.answeredByVoice && (
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#2F6FED] dark:text-blue-400 bg-blue-50 dark:bg-blue-950/60 px-2 py-0.5 rounded-full border border-blue-100 dark:border-blue-900/60">
                        <Mic className="w-2.5 h-2.5" />
                        Spoken
                      </span>
                    )}
                    {ans.verdict && (
                      <span className="text-[11px] font-semibold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full">
                        {ans.verdict}
                      </span>
                    )}
                  </div>
                  <h3 className="text-sm sm:text-base font-bold text-[#0B1A33] dark:text-white">
                    {ans.questionText}
                  </h3>
                </div>

                <div className="flex items-center gap-2 shrink-0 self-end sm:self-start">
                  <div className="flex items-center gap-1.5">
                    <span className={`text-xs font-bold px-2.5 py-1 rounded-lg border ${getScoreBadgeStyle(corr)}`}>
                      Correctness: {corr}%
                    </span>
                    <span className="text-xs font-bold px-2.5 py-1 rounded-lg border bg-blue-50 dark:bg-blue-950/60 text-[#2F6FED] dark:text-blue-400 border-blue-200 dark:border-blue-800">
                      Confidence: {conf}%
                    </span>
                  </div>
                  {isExpanded ? (
                    <ChevronUp className="w-4 h-4 text-slate-400 dark:text-slate-500" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-slate-400 dark:text-slate-500" />
                  )}
                </div>
              </div>

              {/* Candidate Answer Preview */}
              <div className="p-3 bg-slate-50 dark:bg-slate-850 border border-slate-100 dark:border-slate-800 rounded-lg text-xs text-slate-700 dark:text-slate-300">
                <span className="font-semibold text-slate-600 dark:text-slate-400 block mb-0.5">Your Response:</span>
                <p className="line-clamp-3 sm:line-clamp-none italic">
                  "{ans.answerText || "No answer recorded."}"
                </p>
              </div>

              {/* Expanded Feedback & Details */}
              {(isExpanded || ans.feedback) && (
                <div className="space-y-2 pt-1 border-t border-slate-100 dark:border-slate-800">
                  {ans.feedback && (
                    <div className="p-3 bg-blue-50/50 dark:bg-blue-950/40 border border-blue-100 dark:border-blue-900/60 rounded-lg text-xs text-[#0B1A33] dark:text-slate-200 space-y-1">
                      <span className="font-bold text-[#2F6FED] dark:text-blue-400 flex items-center gap-1">
                        <Sparkles className="w-3 h-3" />
                        Examiner Feedback:
                      </span>
                      <p className="leading-relaxed">{ans.feedback}</p>
                    </div>
                  )}

                  {((ans.correctAspects && ans.correctAspects.length > 0) ||
                    (ans.missingOrIncorrect && ans.missingOrIncorrect.length > 0)) && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                      {ans.correctAspects && ans.correctAspects.length > 0 && (
                        <div className="bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/60 p-2.5 rounded-lg">
                          <span className="font-bold text-emerald-900 dark:text-emerald-300 block mb-1">What Was Accurate:</span>
                          <ul className="list-disc list-inside space-y-0.5 text-emerald-800 dark:text-emerald-300">
                            {ans.correctAspects.map((pt, i) => (
                              <li key={i}>{pt}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                      {ans.missingOrIncorrect && ans.missingOrIncorrect.length > 0 && (
                        <div className="bg-rose-50/70 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800/60 p-2.5 rounded-lg">
                          <span className="font-bold text-rose-900 dark:text-rose-300 block mb-1">To Add or Correct:</span>
                          <ul className="list-disc list-inside space-y-0.5 text-rose-800 dark:text-rose-300">
                            {ans.missingOrIncorrect.map((pt, i) => (
                              <li key={i}>{pt}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  )}

                  {ans.keyTakeaway && (
                    <div className="text-xs text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-850 p-2.5 rounded-lg border border-slate-200 dark:border-slate-800">
                      <strong className="text-slate-800 dark:text-white">Takeaway Tip:</strong> {ans.keyTakeaway}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Action Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
        <div className="flex flex-wrap items-center gap-2">
          {/* Download Session Report Dropdown */}
          <div className="relative">
            <button
              id="download-session-report-btn"
              type="button"
              onClick={() => setDownloadOpen(!downloadOpen)}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-[#2F6FED] hover:bg-blue-600 text-white font-semibold text-xs rounded-xl shadow-xs transition-colors"
            >
              <Download className="w-4 h-4" />
              <span>Download Session Report</span>
            </button>

            {downloadOpen && (
              <div className="absolute left-0 mt-2 w-56 bg-white dark:bg-slate-850 rounded-xl shadow-xl border border-slate-200 dark:border-slate-750 py-1.5 z-50 animate-in fade-in zoom-in-95 duration-150">
                <div className="px-3 py-1 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                  Download Format
                </div>

                <button
                  type="button"
                  onClick={handleDownloadHTML}
                  className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-blue-50 dark:hover:bg-slate-800 hover:text-[#2F6FED] dark:hover:text-blue-400 transition-colors"
                >
                  <FileText className="w-4 h-4 text-blue-500" />
                  <div className="text-left">
                    <div className="font-semibold">HTML Document (.html)</div>
                    <div className="text-[10px] text-slate-400 dark:text-slate-500">Styled offline viewable file</div>
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
                    <div className="text-[10px] text-slate-400 dark:text-slate-500">Direct print layout</div>
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
                    <div className="text-[10px] text-slate-400 dark:text-slate-500">Structured markdown notes</div>
                  </div>
                </button>
              </div>
            )}
          </div>

          {/* View Overall Improvement Report Button */}
          {onOpenImprovementReport && (
            <button
              id="view-overall-improvement-btn"
              type="button"
              onClick={onOpenImprovementReport}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-blue-50 dark:bg-blue-950/50 border border-blue-200 dark:border-blue-800 text-[#2F6FED] dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/60 font-semibold text-xs rounded-xl transition-colors"
            >
              <TrendingUp className="w-4 h-4" />
              <span>View Overall Improvement Report</span>
            </button>
          )}

          {/* Copy Report */}
          <button
            type="button"
            onClick={handleCopyReport}
            className="inline-flex items-center gap-1.5 px-3.5 py-2.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 hover:border-slate-400 dark:hover:border-slate-600 text-slate-700 dark:text-slate-200 font-semibold text-xs rounded-xl shadow-2xs hover:bg-slate-50 dark:hover:bg-slate-750 transition-all"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
            <span>{copied ? "Copied" : "Copy Text"}</span>
          </button>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onRetake}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-white dark:bg-slate-850 border border-blue-200 dark:border-blue-800 text-[#2F6FED] dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-slate-800 font-semibold text-xs rounded-xl transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Retake Session</span>
          </button>

          <button
            type="button"
            onClick={onStartNew}
            className="inline-flex items-center gap-1.5 px-5 py-2.5 bg-[#0B1A33] dark:bg-[#2F6FED] hover:bg-[#16233C] dark:hover:bg-blue-600 text-white font-semibold text-xs rounded-xl shadow-xs transition-colors"
          >
            <span>Start Fresh Assessment</span>
          </button>
        </div>
      </div>
    </div>
  );
};
