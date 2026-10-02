import React, { useState, useRef } from "react";
import {
  Sparkles,
  ArrowRight,
  ArrowLeft,
  AlertCircle,
  RefreshCw,
  BookOpen,
  UserCheck,
  Zap,
  Sliders,
  CheckCircle2,
} from "lucide-react";
import {
  AssessmentMode,
  DifficultyLevel,
  InterviewSubMode,
  QuestionItem,
  AnswerItem,
  SessionReport,
} from "../types";
import { FileUpload } from "./FileUpload";
import { QuestionCard } from "./QuestionCard";
import { ResultsSummary } from "./ResultsSummary";
import { CameraCoachWidget } from "./CameraCoachWidget";
import { captureFrame } from "../lib/camera";
import { saveSessionToStorage } from "../lib/storage";

interface AssessmentFlowProps {
  mode: AssessmentMode;
  onBackToHome: () => void;
  onSessionComplete?: (session: SessionReport) => void;
}

export const AssessmentFlow: React.FC<AssessmentFlowProps> = ({
  mode,
  onBackToHome,
  onSessionComplete,
}) => {
  // Configuration State
  const [courseName, setCourseName] = useState("");
  const [degreeProgram, setDegreeProgram] = useState("B.Tech / College Degree");
  const [targetRole, setTargetRole] = useState("Software Engineer / Tech Role");
  const [difficulty, setDifficulty] = useState<DifficultyLevel>("Intermediate");
  const [subMode, setSubMode] = useState<InterviewSubMode>("technical");
  const [numQuestions, setNumQuestions] = useState<number>(5);

  // File State
  const [file, setFile] = useState<File | null>(null);
  const [fileBase64, setFileBase64] = useState<string | null>(null);
  const [textContent, setTextContent] = useState<string | null>(null);
  const [sampleName, setSampleName] = useState<string | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);

  // Camera Coach State
  const [cameraEnabled, setCameraEnabled] = useState(false);
  const [postureTips, setPostureTips] = useState<string[]>([]);
  const [snapshotCount, setSnapshotCount] = useState<number>(0);
  const [activeCoachTip, setActiveCoachTip] = useState<{ tip: string; category?: string; label?: string } | null>(null);
  const [isEvaluatingTip, setIsEvaluatingTip] = useState<boolean>(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  // Four Core Lifecycle States: "idle" | "loading" | "error" | "data" | "finished"
  const [status, setStatus] = useState<"idle" | "loading" | "error" | "data" | "finished">("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const [questions, setQuestions] = useState<QuestionItem[]>([]);
  const [detectedSubject, setDetectedSubject] = useState<string | null>(null);
  const [detectedUnits, setDetectedUnits] = useState<string[] | null>(null);
  const [detectedKeySkills, setDetectedKeySkills] = useState<string[] | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<AnswerItem[]>([]);
  const [isSubmittingAnswer, setIsSubmittingAnswer] = useState(false);
  const [completedReport, setCompletedReport] = useState<SessionReport | null>(null);

  const isViva = mode === "viva";

  // Handle File Selection
  const handleFileSelect = (
    newFile: File | null,
    base64: string | null,
    text: string | null,
    chosenSampleName: string | null
  ) => {
    setFile(newFile);
    setFileBase64(base64);
    setTextContent(text);
    setSampleName(chosenSampleName);
    setValidationError(null);

    // Auto fill course name if viva sample is selected
    if (isViva && chosenSampleName && !courseName) {
      setCourseName("CS402: Distributed Systems & Operating Systems");
    }
  };

  // Request diverse, non-repeating Posture, Eye Contact & Presence Coach Tip
  const fetchCoachTip = async (requestedCategory?: string) => {
    setIsEvaluatingTip(true);
    try {
      let frameBase64: string | null = null;
      if (cameraEnabled && videoRef.current) {
        frameBase64 = captureFrame(videoRef.current);
        if (frameBase64) {
          setSnapshotCount((prev) => prev + 1);
        }
      }

      const res = await fetch("/api/posture-feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          frameBase64,
          previousTips: postureTips,
          requestedCategory: requestedCategory || "all",
        }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.tip) {
          setActiveCoachTip(data);
          setPostureTips((prev) => {
            if (prev.some((p) => p.toLowerCase().trim() === data.tip.toLowerCase().trim())) {
              return prev;
            }
            return [...prev, data.tip];
          });
        }
      }
    } catch (e) {
      console.warn("Posture coach request failed:", e);
    } finally {
      setIsEvaluatingTip(false);
    }
  };

  // Generate Questions via Gemini API
  const handleGenerateQuestions = async () => {
    // Validate inputs
    if (!fileBase64 && !textContent && !courseName.trim() && (!targetRole || !targetRole.trim())) {
      setValidationError(
        isViva
          ? "Please upload a syllabus document (PDF/Word/Text) or use the sample syllabus."
          : "Please upload a resume document (PDF/Word/Text) or use the sample resume."
      );
      setStatus("idle");
      return;
    }

    // If viva mode, require either course name OR an uploaded syllabus (AI will detect course name if omitted)
    const effectiveCourseName = courseName.trim() || (isViva ? "Course Syllabus" : "");

    setValidationError(null);
    setStatus("loading");
    setErrorMsg("");

    const payload = {
      mode,
      subMode: isViva ? undefined : subMode,
      courseName: effectiveCourseName || undefined,
      level: isViva ? difficulty : undefined,
      numQuestions,
      fileBase64,
      fileName: file?.name || sampleName || undefined,
      textContent,
      mimeType: file?.type || (fileBase64 ? "application/pdf" : undefined),
    };

    try {
      const res = await fetch("/api/generate-questions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.error || "Failed to generate questions. Please try again.");
      }

      const data = await res.json();
      if (!data.questions || data.questions.length === 0) {
        throw new Error("No questions were generated from the uploaded document. Please check the file contents.");
      }

      setQuestions(data.questions);
      if (data.detectedSubject && (!courseName || courseName === "Course Syllabus")) {
        setCourseName(data.detectedSubject);
      }
      setDetectedSubject(data.detectedSubject || null);
      setDetectedUnits(Array.isArray(data.detectedUnits) ? data.detectedUnits : null);
      setDetectedKeySkills(Array.isArray(data.detectedKeySkills) ? data.detectedKeySkills : null);

      setCurrentIndex(0);
      setAnswers([]);
      setPostureTips([]);
      setSnapshotCount(0);
      setStatus("data");

      // Fetch initial friendly coaching tip (eye contact or relaxed shoulders)
      setTimeout(() => {
        fetchCoachTip("all");
      }, 400);
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || "An unexpected error occurred while generating questions.");
      setStatus("error");
    }
  };

  // Handle Candidate Answer Submission
  const handleAnswerSubmit = async (answerText: string, answeredByVoice: boolean) => {
    setIsSubmittingAnswer(true);

    const currentQ = questions[currentIndex];
    const newAnswer: AnswerItem = {
      questionId: currentQ.id,
      questionText: currentQ.question,
      topicOrGrounding: currentQ.topic || currentQ.basedOn || "General",
      answerText,
      answeredByVoice,
      timestamp: Date.now(),
    };

    // Grab a camera snapshot or coaching check on answer progression
    if (currentIndex === 0 || currentIndex === Math.floor(questions.length / 2)) {
      fetchCoachTip();
    }

    // Evaluate answer with Gemini
    try {
      if (answerText.trim()) {
        const evalRes = await fetch("/api/evaluate-answer", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            question: currentQ.question,
            answer: answerText,
            topicOrGrounding: currentQ.topic || currentQ.basedOn,
            mode,
            degreeOrRole: isViva ? degreeProgram : targetRole,
          }),
        });
        if (evalRes.ok) {
          const evalData = await evalRes.json();
          newAnswer.score = evalData.score;
          newAnswer.correctnessScore = evalData.correctnessScore;
          newAnswer.confidenceScore = evalData.confidenceScore;
          newAnswer.verdict = evalData.verdict;
          newAnswer.feedback = evalData.feedback;
          newAnswer.correctAspects = evalData.correctAspects;
          newAnswer.missingOrIncorrect = evalData.missingOrIncorrect;
          newAnswer.keyTakeaway = evalData.keyTakeaway;
        }
      } else {
        newAnswer.score = 1;
        newAnswer.correctnessScore = 0;
        newAnswer.confidenceScore = 10;
        newAnswer.verdict = "Question Skipped";
        newAnswer.feedback = "No oral response was provided during this examination round.";
        newAnswer.correctAspects = [];
        newAnswer.missingOrIncorrect = ["The question was left completely unaddressed."];
        newAnswer.keyTakeaway = "Always articulate known fundamentals rather than remaining silent.";
      }
    } catch (e) {
      console.warn("Could not evaluate single answer:", e);
    }

    const updatedAnswers = [...answers, newAnswer];
    setAnswers(updatedAnswers);
    setIsSubmittingAnswer(false);

    if (currentIndex + 1 < questions.length) {
      setCurrentIndex(currentIndex + 1);
      // Automatically refresh coaching advice for the new question
      setTimeout(() => {
        fetchCoachTip();
      }, 300);
    } else {
      // Completed all questions -> Generate Final Session Report
      await finalizeSession(updatedAnswers);
    }
  };

  const finalizeSession = async (allAnswers: AnswerItem[]) => {
    setStatus("loading");

    const totalAns = allAnswers.length || 1;
    let sumCorr = 0;
    let sumConf = 0;
    let failedCount = 0;

    const qaPairs = allAnswers.map((a) => {
      const corr = typeof a.correctnessScore === "number" ? a.correctnessScore : (a.score ? a.score * 10 : 50);
      const conf = typeof a.confidenceScore === "number" ? a.confidenceScore : (a.score ? a.score * 10 : 50);
      sumCorr += corr;
      sumConf += conf;
      if (corr < 45) failedCount++;
      return {
        question: a.questionText,
        answer: a.answerText,
        score: a.score,
        correctnessScore: a.correctnessScore,
        confidenceScore: a.confidenceScore,
        verdict: a.verdict,
        topic: a.topicOrGrounding,
      };
    });

    const calculatedCorr = Math.round(sumCorr / totalAns);
    const calculatedConf = Math.round(sumConf / totalAns);
    const calculatedMerit = Math.round(calculatedCorr * 0.7 + calculatedConf * 0.3);
    const calculatedReadiness = Math.max(5, Math.min(98, calculatedMerit - (failedCount * 5)));

    const getGrade = (val: number) => {
      if (val >= 85) return "Distinction (85-100%)";
      if (val >= 70) return "Pass with Merit (70-84%)";
      if (val >= 50) return "Pass (50-69%)";
      return "Needs Re-take / Fail (<50%)";
    };

    const getReadinessStr = (val: number) => {
      if (val >= 85) return isViva ? "College Viva Ready (Distinction Tier)" : "Interview Ready (Strong Hire)";
      if (val >= 70) return isViva ? "College Viva Ready (Clear Pass)" : "Interview Ready (Hire Recommendation)";
      if (val >= 50) return isViva ? "Borderline — Vulnerable in University Viva" : "Borderline — Mixed Interview Feedback";
      return isViva ? "Not Ready — High Risk of Failing Viva" : "Not Interview Ready — Rejection Risk";
    };

    let sessionReport: SessionReport = {
      id: "sess_" + Date.now(),
      mode,
      subMode: isViva ? undefined : subMode,
      meta: {
        courseName: isViva ? courseName : undefined,
        degreeProgram: isViva ? degreeProgram : undefined,
        targetRole: !isViva ? targetRole : undefined,
        level: isViva ? difficulty : undefined,
        fileName: file ? file.name : sampleName || undefined,
        fileSize: file ? file.size : undefined,
      },
      questions,
      answers: allAnswers,
      postureTips,
      overallScore: calculatedMerit,
      correctnessAverage: calculatedCorr,
      confidenceAverage: calculatedConf,
      readinessPercentage: calculatedReadiness,
      readinessLabel: getReadinessStr(calculatedReadiness),
      readinessVerdictExplanation: isViva
        ? `With a ${calculatedReadiness}% readiness score for ${degreeProgram || courseName}, you have ${calculatedReadiness >= 70 ? "adequate preparation to pass your university viva examination" : "knowledge gaps that pose a risk of failing your oral defense"}.`
        : `With a ${calculatedReadiness}% interview readiness score for ${targetRole}, candidates in this range receive ${calculatedReadiness >= 70 ? "positive hire recommendations" : "mixed feedback requiring further technical preparation"}.`,
      degreeOrRoleTarget: isViva ? degreeProgram : targetRole,
      grade: getGrade(calculatedMerit),
      executiveSummary: `Evaluated across ${totalAns} questions with a genuine score of ${calculatedMerit}% (Technical Correctness: ${calculatedCorr}%, Oral Confidence: ${calculatedConf}%).`,
      strengths: [
        calculatedCorr >= 65 ? "Solid technical definitions" : "Good attempt across question set",
        calculatedConf >= 65 ? "Clear oral articulation" : "Maintained focus under examination pressure",
      ],
      improvements: [
        "Strengthen technical trade-offs and explicit real-world constraints",
        "Structure oral answers with definitions first, then mechanisms",
      ],
      oralPresenceTips: "Speak at a steady cadence, maintain eye contact toward the lens, and conclude each point decisively.",
      createdAt: Date.now(),
    };

    try {
      const res = await fetch("/api/evaluate-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode,
          subMode: isViva ? undefined : subMode,
          courseName: isViva ? courseName : undefined,
          degreeProgram: isViva ? degreeProgram : undefined,
          targetRole: !isViva ? targetRole : undefined,
          level: isViva ? difficulty : undefined,
          qaPairs,
          postureTips,
        }),
      });

      if (res.ok) {
        const evalData = await res.json();
        sessionReport = {
          ...sessionReport,
          overallScore: evalData.overallScore ?? calculatedMerit,
          correctnessAverage: evalData.correctnessAverage ?? calculatedCorr,
          confidenceAverage: evalData.confidenceAverage ?? calculatedConf,
          readinessPercentage: evalData.readinessPercentage ?? calculatedReadiness,
          readinessLabel: evalData.readinessLabel ?? getReadinessStr(evalData.readinessPercentage ?? calculatedReadiness),
          readinessVerdictExplanation: evalData.readinessVerdictExplanation ?? sessionReport.readinessVerdictExplanation,
          grade: evalData.grade ?? getGrade(evalData.overallScore ?? calculatedMerit),
          executiveSummary: evalData.executiveSummary ?? sessionReport.executiveSummary,
          strengths: evalData.strengths ?? sessionReport.strengths,
          improvements: evalData.improvements ?? sessionReport.improvements,
          oralPresenceTips: evalData.oralPresenceTips ?? sessionReport.oralPresenceTips,
        };
      }
    } catch (e) {
      console.warn("Session evaluation error:", e);
    }

    saveSessionToStorage(sessionReport);
    setCompletedReport(sessionReport);
    setStatus("finished");

    if (onSessionComplete) {
      onSessionComplete(sessionReport);
    }
  };

  const handleRetake = () => {
    setCurrentIndex(0);
    setAnswers([]);
    setStatus("data");
  };

  const handleStartNew = () => {
    setStatus("idle");
    setFile(null);
    setFileBase64(null);
    setTextContent(null);
    setSampleName(null);
    setCourseName("");
    setCompletedReport(null);
  };

  // 1. Loading State
  if (status === "loading") {
    return (
      <div className="max-w-2xl mx-auto py-16 px-4 text-center space-y-6">
        <div className="relative w-20 h-20 mx-auto">
          <div className="w-20 h-20 rounded-2xl bg-blue-50 dark:bg-blue-950/60 border-2 border-blue-200 dark:border-blue-900/60 flex items-center justify-center animate-pulse">
            <Sparkles className="w-10 h-10 text-[#2F6FED] dark:text-blue-400" />
          </div>
          <div className="absolute inset-0 rounded-2xl border-2 border-[#2F6FED] border-t-transparent animate-spin" />
        </div>

        <div className="space-y-2">
          <h2 className="text-xl font-bold text-[#0B1A33] dark:text-white">
            {completedReport
              ? "Compiling Examiner Report & Score..."
              : "Reading Document & Formulating Questions..."}
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 max-w-md mx-auto">
            {isViva
              ? "Gemini 3.8 Flash is analyzing syllabus units, topics, and difficulty grading to generate authentic oral examination questions."
              : "Gemini 3.8 Flash is analyzing your listed work history, technologies, and achievements to generate grounded interview questions."}
          </p>
        </div>

        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-100 dark:bg-slate-800 text-xs text-slate-600 dark:text-slate-300 font-medium">
          <span className="w-2 h-2 rounded-full bg-blue-500 animate-ping" />
          <span>Analyzing multimodal PDF context</span>
        </div>
      </div>
    );
  }

  // 2. Error State
  if (status === "error") {
    return (
      <div className="max-w-lg mx-auto py-12 px-4 space-y-6">
        <div className="p-6 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/60 rounded-2xl text-center space-y-4">
          <div className="w-12 h-12 rounded-xl bg-red-100 dark:bg-red-900/50 text-red-600 dark:text-red-400 flex items-center justify-center mx-auto">
            <AlertCircle className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-bold text-red-950 dark:text-red-300">Generation Issue</h3>
            <p className="text-xs text-red-700 dark:text-red-300 leading-relaxed">{errorMsg}</p>
          </div>
          <div className="flex items-center justify-center gap-3 pt-2">
            <button
              type="button"
              onClick={() => {
                setStatus("idle");
                setErrorMsg("");
                setValidationError(null);
              }}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold rounded-xl transition-all border border-slate-200 dark:border-slate-700 shadow-2xs"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Setup</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setErrorMsg("");
                handleGenerateQuestions();
              }}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#0B1A33] hover:bg-[#16233C] dark:bg-blue-600 dark:hover:bg-blue-700 text-white text-xs font-semibold rounded-xl transition-all shadow-xs"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Try Again</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // 3. Finished Results State
  if (status === "finished" && completedReport) {
    return (
      <ResultsSummary
        session={completedReport}
        onRetake={handleRetake}
        onStartNew={handleStartNew}
      />
    );
  }

  // 4. Data State: Question-by-Question Active Session
  if (status === "data" && questions.length > 0) {
    return (
      <div className="max-w-4xl mx-auto space-y-6 pb-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Question & Answer Area */}
          <div className="lg:col-span-2 space-y-4">
            <QuestionCard
              question={questions[currentIndex]}
              currentIndex={currentIndex}
              totalQuestions={questions.length}
              mode={mode}
              subMode={subMode}
              activeCoachTip={activeCoachTip}
              onRequestNewTip={fetchCoachTip}
              onAnswerSubmit={handleAnswerSubmit}
              isSubmitting={isSubmittingAnswer}
            />
          </div>

          {/* Side Panel: Camera Coach & Session Info */}
          <div className="space-y-4">
            <CameraCoachWidget
              enabled={cameraEnabled}
              onToggle={setCameraEnabled}
              videoRef={videoRef}
              snapshotCount={snapshotCount}
              activeCoachTip={activeCoachTip}
              postureTipsHistory={postureTips}
              onRequestTip={fetchCoachTip}
              isEvaluatingTip={isEvaluatingTip}
            />

            {/* Document Grounding Info */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-2xs space-y-3 text-xs">
              <div className="flex items-center justify-between">
                <h4 className="font-bold text-[#0B1A33] dark:text-white uppercase tracking-wider">
                  Active Assessment
                </h4>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200/80 dark:border-emerald-900/60">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse" />
                  Grounded in Syllabus
                </span>
              </div>

              <div className="space-y-1.5 text-slate-600 dark:text-slate-300">
                <p>
                  <strong className="text-slate-900 dark:text-slate-200">Mode:</strong>{" "}
                  {isViva ? "Oral Viva Voce" : `Interview (${subMode})`}
                </p>
                {isViva && (
                  <>
                    <p>
                      <strong className="text-slate-900 dark:text-slate-200">Course:</strong>{" "}
                      {detectedSubject || courseName || "Subject Syllabus"}
                    </p>
                    <p>
                      <strong className="text-slate-900 dark:text-slate-200">Difficulty:</strong> {difficulty}
                    </p>
                  </>
                )}
                <p>
                  <strong className="text-slate-900 dark:text-slate-200">Source:</strong>{" "}
                  {file?.name || sampleName || (textContent ? "Pasted Document Text" : "Attached Document")}
                </p>
              </div>

              {/* Detected Syllabus Units Coverage */}
              {detectedUnits && detectedUnits.length > 0 && (
                <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-1.5">
                  <p className="text-[11px] font-semibold text-slate-700 dark:text-slate-300">
                    Syllabus Units Covered:
                  </p>
                  <div className="space-y-1">
                    {detectedUnits.slice(0, 4).map((unit, uIdx) => (
                      <div
                        key={uIdx}
                        className="text-[11px] bg-slate-50 dark:bg-slate-800/80 px-2 py-1 rounded text-slate-700 dark:text-slate-300 border border-slate-200/60 dark:border-slate-700/60 truncate"
                        title={unit}
                      >
                        • {unit}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Detected Resume Skills Coverage */}
              {detectedKeySkills && detectedKeySkills.length > 0 && (
                <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-1.5">
                  <p className="text-[11px] font-semibold text-slate-700 dark:text-slate-300">
                    Targeted Projects & Skills:
                  </p>
                  <div className="flex flex-wrap gap-1">
                    {detectedKeySkills.slice(0, 6).map((skill, sIdx) => (
                      <span
                        key={sIdx}
                        className="text-[10px] bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded text-slate-700 dark:text-slate-300"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // 5. Idle State: Upload & Configuration Form
  return (
    <div className="max-w-2xl mx-auto space-y-8 pb-16">
      {/* Header */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <button
            onClick={onBackToHome}
            className="text-xs font-semibold text-[#2F6FED] dark:text-blue-400 hover:underline"
          >
            ← Back to Modes
          </button>
          <span className="text-slate-300 dark:text-slate-700">•</span>
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            {isViva ? "Student Oral Exam Setup" : "Job Interview Setup"}
          </span>
        </div>

        <h1 className="text-2xl sm:text-3xl font-extrabold text-[#0B1A33] dark:text-white tracking-tight flex items-center gap-3">
          {isViva ? (
            <>
              <BookOpen className="w-7 h-7 text-[#2F6FED] dark:text-blue-400" />
              <span>Viva Voce Practice</span>
            </>
          ) : (
            <>
              <UserCheck className="w-7 h-7 text-emerald-600 dark:text-emerald-400" />
              <span>Mock Interview Practice</span>
            </>
          )}
        </h1>

        <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">
          {isViva
            ? "Upload your semester or course syllabus. Viora AI formulates the questions an examiner would ask in your oral viva."
            : "Upload your professional resume. Viora AI asks targeted interview questions strictly grounded in your actual projects and experience."}
        </p>
      </div>

      {/* Main Configuration Card */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-2xl p-6 sm:p-8 shadow-xs space-y-6">
        {/* Step 1: Compulsory File Upload */}
        <FileUpload
          mode={mode}
          file={file}
          fileBase64={fileBase64}
          textContent={textContent}
          sampleName={sampleName}
          onFileSelect={handleFileSelect}
          error={validationError}
        />

        {/* Step 2: Mode Specific Options */}
        {isViva ? (
          <div className="space-y-4 pt-2 border-t border-slate-100 dark:border-slate-800">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#0B1A33] dark:text-slate-200 mb-1.5">
                  Course or Subject Title <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={courseName}
                  onChange={(e) => {
                    setCourseName(e.target.value);
                    setValidationError(null);
                  }}
                  placeholder="e.g. Operating Systems, Microprocessor..."
                  className="w-full px-4 py-2.5 text-sm text-[#16233C] dark:text-white bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 focus:border-[#2F6FED] focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-900/40 rounded-xl transition-all shadow-2xs"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#0B1A33] dark:text-slate-200 mb-1.5">
                  Degree / Program <span className="text-slate-400 font-normal">(for College Viva Readiness %)</span>
                </label>
                <input
                  type="text"
                  value={degreeProgram}
                  onChange={(e) => setDegreeProgram(e.target.value)}
                  placeholder="e.g. B.Tech CSE, B.Sc, BCA, MBA..."
                  className="w-full px-4 py-2.5 text-sm text-[#16233C] dark:text-white bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 focus:border-[#2F6FED] focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-900/40 rounded-xl transition-all shadow-2xs"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[#0B1A33] dark:text-slate-200 mb-1.5">
                Target Difficulty Level
              </label>
              <div className="grid grid-cols-3 gap-2">
                {(["Beginner", "Intermediate", "Advanced"] as DifficultyLevel[]).map((lvl) => (
                  <button
                    key={lvl}
                    type="button"
                    onClick={() => setDifficulty(lvl)}
                    className={`py-2.5 px-3 rounded-xl text-xs font-semibold transition-all border text-center ${
                      difficulty === lvl
                        ? "bg-blue-50 dark:bg-blue-950/60 text-[#2F6FED] dark:text-blue-400 border-[#2F6FED] dark:border-blue-500 shadow-2xs"
                        : "bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-750"
                    }`}
                  >
                    <div>{lvl}</div>
                    <div className="text-[10px] text-slate-500 dark:text-slate-400 font-normal mt-0.5 hidden sm:block">
                      {lvl === "Beginner" && "Definitions & Core"}
                      {lvl === "Intermediate" && "Mechanisms & Flow"}
                      {lvl === "Advanced" && "Design & Trade-offs"}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-4 pt-2 border-t border-slate-100 dark:border-slate-800">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[#0B1A33] dark:text-slate-200 mb-1.5">
                Target Job Role <span className="text-slate-400 font-normal">(for Technical Interview Readiness %)</span>
              </label>
              <input
                type="text"
                value={targetRole}
                onChange={(e) => setTargetRole(e.target.value)}
                placeholder="e.g. Full Stack Developer, Frontend Engineer, Data Analyst, Cloud DevOps..."
                className="w-full px-4 py-2.5 text-sm text-[#16233C] dark:text-white bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 focus:border-[#2F6FED] focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-900/40 rounded-xl transition-all shadow-2xs"
              />
            </div>

            <div className="space-y-2">
              <label className="block text-xs font-bold uppercase tracking-wider text-[#0B1A33] dark:text-slate-200">
                Interview Round / Sub-Mode (Pick One)
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {[
                  {
                    id: "technical",
                    title: "Technical",
                    desc: "Digs into your listed frameworks, system architectures, and engineering choices.",
                  },
                  {
                    id: "behavioral",
                    title: "Behavioral",
                    desc: "STAR-style questions on leadership, conflict resolution, and teamwork.",
                  },
                  {
                    id: "managerial",
                    title: "Managerial",
                    desc: "Ownership, priority triage, delegation, and system reliability.",
                  },
                  {
                    id: "rapidfire",
                    title: "Rapid Fire",
                    desc: "Brisk questions answerable in 30s covering the breadth of your skills.",
                  },
                ].map((sub) => (
                  <button
                    key={sub.id}
                    type="button"
                    onClick={() => setSubMode(sub.id as InterviewSubMode)}
                    className={`p-3.5 rounded-xl border text-left transition-all ${
                      subMode === sub.id
                        ? "bg-blue-50/70 dark:bg-blue-950/50 border-[#2F6FED] dark:border-blue-500 text-[#0B1A33] dark:text-white shadow-2xs"
                        : "bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 text-slate-700 dark:text-slate-300"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-xs">{sub.title}</span>
                      {subMode === sub.id && (
                        <CheckCircle2 className="w-3.5 h-3.5 text-[#2F6FED] dark:text-blue-400" />
                      )}
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                      {sub.desc}
                    </p>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Step 3: Question Count & Optional Camera Coach Toggle */}
        <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-[#0B1A33] dark:text-slate-200 mb-1">
              Number of Questions
            </label>
            <div className="flex items-center gap-1.5">
              {[3, 5, 8].map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => setNumQuestions(n)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-colors ${
                    numQuestions === n
                      ? "bg-[#0B1A33] dark:bg-blue-600 text-white border-[#0B1A33] dark:border-blue-600"
                      : "bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-750"
                  }`}
                >
                  {n} Qs
                </button>
              ))}
            </div>
          </div>

          {/* Posture Coach Quick Toggle */}
          <div className="bg-slate-50 dark:bg-slate-850 p-2.5 rounded-xl border border-slate-200/80 dark:border-slate-800 flex items-center gap-3">
            <div>
              <span className="text-xs font-bold text-[#0B1A33] dark:text-white block">Camera Coach</span>
              <span className="text-[11px] text-slate-500 dark:text-slate-400">Posture & Eye Contact tips</span>
            </div>
            <button
              type="button"
              onClick={() => setCameraEnabled(!cameraEnabled)}
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden ${
                cameraEnabled ? "bg-[#2F6FED]" : "bg-slate-300 dark:bg-slate-700"
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                  cameraEnabled ? "translate-x-5" : "translate-x-0"
                }`}
              />
            </button>
          </div>
        </div>

        {/* Camera permission preview container if enabled */}
        {cameraEnabled && (
          <CameraCoachWidget
            enabled={cameraEnabled}
            onToggle={setCameraEnabled}
            videoRef={videoRef}
            snapshotCount={0}
          />
        )}

        {/* Action Button */}
        <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end">
          <button
            type="button"
            onClick={handleGenerateQuestions}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-3.5 bg-[#0B1A33] hover:bg-[#16233C] dark:bg-blue-600 dark:hover:bg-blue-700 text-white font-bold text-sm rounded-xl shadow-xs hover:shadow-md transition-all group"
          >
            <Sparkles className="w-4 h-4 text-blue-400 group-hover:rotate-12 transition-transform" />
            <span>Generate Examination Questions</span>
            <ArrowRight className="w-4 h-4 text-blue-300 group-hover:translate-x-1 transition-transform" />
          </button>
        </div>
      </div>
    </div>
  );
};
