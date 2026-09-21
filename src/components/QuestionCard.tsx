import React, { useState, useEffect, useRef } from "react";
import {
  Volume2,
  VolumeX,
  Mic,
  MicOff,
  Sparkles,
  ArrowRight,
  CheckCircle2,
  Trash2,
  RotateCw,
  Eye,
  Activity,
  Maximize,
  Compass,
} from "lucide-react";
import { QuestionItem } from "../types";
import {
  speakQuestion,
  stopSpeaking,
  createVoiceRecognizer,
  isSpeechRecognitionSupported,
  VoiceRecognizerController,
  VoiceTranscriptResult,
} from "../lib/voice";

export interface CoachTipData {
  tip: string;
  category?: string;
  label?: string;
}

interface QuestionCardProps {
  question: QuestionItem;
  currentIndex: number;
  totalQuestions: number;
  mode: "viva" | "interview";
  subMode?: string;
  activeCoachTip?: CoachTipData | null;
  onRequestNewTip?: (category?: string) => void;
  onAnswerSubmit: (answerText: string, answeredByVoice: boolean) => Promise<void>;
  isSubmitting: boolean;
}

export const QuestionCard: React.FC<QuestionCardProps> = ({
  question,
  currentIndex,
  totalQuestions,
  mode,
  subMode,
  activeCoachTip,
  onRequestNewTip,
  onAnswerSubmit,
  isSubmitting,
}) => {
  const [answerText, setAnswerText] = useState("");
  const [isSpeakingQuestion, setIsSpeakingQuestion] = useState(false);
  const [isRecordingVoice, setIsRecordingVoice] = useState(false);
  const [answeredByVoice, setAnsweredByVoice] = useState(false);
  const [interimPreview, setInterimPreview] = useState("");
  const [quickFeedback, setQuickFeedback] = useState<{
    score?: number;
    correctnessScore?: number;
    confidenceScore?: number;
    verdict?: string;
    feedback?: string;
    correctAspects?: string[];
    missingOrIncorrect?: string[];
    keyTakeaway?: string;
  } | null>(null);
  const [isEvaluating, setIsEvaluating] = useState(false);

  // Ref to hold text that existed before the user started the current voice dictation session.
  // This ensures newly recognized speech NEVER duplicates or multiplies earlier text.
  const baseTextRef = useRef<string>("");
  const recognizerRef = useRef<VoiceRecognizerController | null>(null);
  const recognitionSupported = isSpeechRecognitionSupported();

  // Reset states when question changes
  useEffect(() => {
    setAnswerText("");
    baseTextRef.current = "";
    setInterimPreview("");
    setQuickFeedback(null);
    setAnsweredByVoice(false);
    stopSpeaking();
    setIsSpeakingQuestion(false);

    if (recognizerRef.current) {
      try {
        recognizerRef.current.stop();
      } catch (e) {}
      setIsRecordingVoice(false);
    }

    return () => {
      stopSpeaking();
      if (recognizerRef.current) {
        try {
          recognizerRef.current.stop();
        } catch (e) {}
      }
    };
  }, [question.id]);

  const handleToggleSpeak = () => {
    if (isSpeakingQuestion) {
      stopSpeaking();
      setIsSpeakingQuestion(false);
    } else {
      setIsSpeakingQuestion(true);
      speakQuestion(question.question, () => {
        setIsSpeakingQuestion(false);
      });
    }
  };

  const handleToggleVoiceAnswer = () => {
    if (isRecordingVoice) {
      if (recognizerRef.current) {
        recognizerRef.current.stop();
      }
      setIsRecordingVoice(false);
      setInterimPreview("");
      // Lock current answer into baseTextRef so any subsequent voice dictation appends after it
      baseTextRef.current = answerText.trim();
      return;
    }

    // Stop speaking question aloud if it was active
    stopSpeaking();
    setIsSpeakingQuestion(false);

    // Save existing text as the starting base for this dictation session
    baseTextRef.current = answerText.trim();
    setInterimPreview("");

    const recognizer = createVoiceRecognizer(
      (result: VoiceTranscriptResult) => {
        // Build the combined string: existing text + newly recognized speech of this session
        const base = baseTextRef.current;
        const newSpeech = result.combinedText;

        if (!newSpeech) {
          return;
        }

        const fullText = base ? `${base} ${newSpeech}` : newSpeech;
        // Clean single spaces
        const cleanText = fullText.replace(/\s+/g, " ");

        setAnswerText(cleanText);
        setInterimPreview(result.interimText);
        setAnsweredByVoice(true);
      },
      () => {
        // Recognizer ended (either by stop button, user pause, or browser silence)
        setIsRecordingVoice(false);
        setInterimPreview("");
        // Commit current text to baseTextRef
        setAnswerText((curr) => {
          baseTextRef.current = curr.trim();
          return curr;
        });
      },
      (err) => {
        console.warn("Speech recognition error:", err);
        setIsRecordingVoice(false);
        setInterimPreview("");
      }
    );

    if (recognizer) {
      recognizerRef.current = recognizer;
      try {
        recognizer.start();
        setIsRecordingVoice(true);
      } catch (e) {
        console.warn("Could not start recognizer:", e);
      }
    }
  };

  const handleClearAnswer = () => {
    if (isRecordingVoice && recognizerRef.current) {
      recognizerRef.current.stop();
      setIsRecordingVoice(false);
    }
    setAnswerText("");
    baseTextRef.current = "";
    setInterimPreview("");
    setQuickFeedback(null);
  };

  const handleQuickCritique = async () => {
    if (!answerText.trim() || isEvaluating) return;
    setIsEvaluating(true);
    try {
      const res = await fetch("/api/evaluate-answer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question: question.question,
          answer: answerText,
          topicOrGrounding: question.topic || question.basedOn,
          mode,
        }),
      });
      const data = await res.json();
      setQuickFeedback(data);
    } catch (e) {
      console.error("Critique failed:", e);
    } finally {
      setIsEvaluating(false);
    }
  };

  const handleSubmit = async () => {
    if (isRecordingVoice && recognizerRef.current) {
      recognizerRef.current.stop();
      setIsRecordingVoice(false);
      setInterimPreview("");
    }
    await onAnswerSubmit(answerText.trim(), answeredByVoice);
  };

  const progressPercent = Math.round(((currentIndex + 1) / totalQuestions) * 100);
  const isLastQuestion = currentIndex === totalQuestions - 1;

  // Icon for category
  const getCategoryIcon = (category?: string) => {
    switch (category) {
      case "eye_contact":
        return <Eye className="w-3.5 h-3.5 text-blue-600 shrink-0" />;
      case "shoulders":
        return <Activity className="w-3.5 h-3.5 text-amber-600 shrink-0" />;
      case "framing":
        return <Maximize className="w-3.5 h-3.5 text-emerald-600 shrink-0" />;
      default:
        return <Compass className="w-3.5 h-3.5 text-purple-600 shrink-0" />;
    }
  };

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-2xl shadow-sm p-5 sm:p-8 space-y-6">
      {/* Header & Progress */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs font-semibold text-slate-500 dark:text-slate-400">
          <div className="flex items-center gap-2">
            <span className="uppercase tracking-wider text-[#2F6FED] dark:text-blue-400 font-bold">
              {mode === "viva" ? "Viva Voce" : `Interview • ${subMode || "Technical"}`}
            </span>
            <span>•</span>
            <span>
              Question {currentIndex + 1} of {totalQuestions}
            </span>
          </div>
          <span className="font-mono text-slate-600 dark:text-slate-400">{progressPercent}% complete</span>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
          <div
            className="bg-[#2F6FED] dark:bg-blue-500 h-full transition-all duration-300 rounded-full"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {/* Question Grounding Badge */}
      <div className="flex flex-wrap items-center gap-2 pt-1">
        {mode === "viva" ? (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-blue-50 dark:bg-blue-950/60 text-[#0B1A33] dark:text-blue-300 border border-blue-200/80 dark:border-blue-900/60">
            <span className="w-1.5 h-1.5 rounded-full bg-[#2F6FED] dark:bg-blue-400" />
            Syllabus Topic: {question.topic || question.basedOn || "Course Syllabus"}
          </span>
        ) : (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-950 dark:text-emerald-300 border border-emerald-200/80 dark:border-emerald-900/60">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 dark:bg-emerald-400" />
            Resume Grounding: {question.basedOn || question.topic || "Candidate Experience"}
          </span>
        )}
      </div>

      {/* Question Text & Audio Button */}
      <div className="p-5 sm:p-6 bg-slate-50/80 dark:bg-slate-850/80 border border-slate-200/70 dark:border-slate-800 rounded-xl space-y-4">
        <div className="flex items-start justify-between gap-4">
          <h2 className="text-lg sm:text-xl font-bold text-[#0B1A33] dark:text-white leading-relaxed">
            {question.question}
          </h2>
          <button
            type="button"
            onClick={handleToggleSpeak}
            className={`p-2.5 rounded-xl border transition-all shrink-0 ${
              isSpeakingQuestion
                ? "bg-blue-600 text-white border-blue-700 animate-pulse"
                : "bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:text-[#2F6FED] dark:hover:text-blue-400 hover:border-blue-300 dark:hover:border-blue-700 border-slate-200 dark:border-slate-700 shadow-2xs"
            }`}
            title={isSpeakingQuestion ? "Stop reading question" : "Listen to question aloud"}
          >
            {isSpeakingQuestion ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Live Presence & Posture Coach Banner */}
      {activeCoachTip && (
        <div className="p-3.5 bg-gradient-to-r from-blue-50/90 to-indigo-50/80 dark:from-blue-950/40 dark:to-indigo-950/40 border border-blue-200/90 dark:border-blue-900/60 rounded-xl flex items-start justify-between gap-3 text-xs">
          <div className="flex items-start gap-2.5">
            <div className="mt-0.5 p-1 rounded-md bg-white dark:bg-slate-800 border border-blue-200 dark:border-blue-900 shadow-2xs">
              {getCategoryIcon(activeCoachTip.category)}
            </div>
            <div>
              <div className="font-bold text-[#0B1A33] dark:text-white flex items-center gap-2">
                <span>{activeCoachTip.label || "Presence Coach Tip"}</span>
                <span className="text-[10px] font-normal uppercase tracking-wider text-blue-600 dark:text-blue-400 bg-white dark:bg-slate-850 px-1.5 py-0.5 rounded-sm border border-blue-100 dark:border-blue-900">
                  {activeCoachTip.category?.replace("_", " ") || "Body Language"}
                </span>
              </div>
              <p className="text-slate-700 dark:text-slate-300 mt-0.5 leading-relaxed">{activeCoachTip.tip}</p>
            </div>
          </div>

          {onRequestNewTip && (
            <button
              type="button"
              onClick={() => onRequestNewTip()}
              className="px-2.5 py-1 text-[11px] font-medium text-[#2F6FED] dark:text-blue-400 hover:text-[#0B1A33] dark:hover:text-white bg-white dark:bg-slate-800 hover:bg-blue-50 dark:hover:bg-slate-750 border border-blue-200 dark:border-blue-800 rounded-lg shrink-0 flex items-center gap-1 transition-colors shadow-2xs"
              title="Get another non-repeating body language tip"
            >
              <RotateCw className="w-3 h-3" />
              <span>Next Tip</span>
            </button>
          )}
        </div>
      )}

      {/* Answer Input Area */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <label className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 flex items-center gap-2">
            <span>Your Spoken or Typed Answer</span>
            {isRecordingVoice && (
              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-medium bg-red-100 dark:bg-red-950/60 text-red-700 dark:text-red-400 animate-pulse">
                <span className="w-2 h-2 rounded-full bg-red-600" />
                Live Recording
              </span>
            )}
          </label>

          <div className="flex items-center gap-2">
            {answerText.trim().length > 0 && (
              <button
                type="button"
                onClick={handleClearAnswer}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium text-slate-500 dark:text-slate-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 border border-transparent hover:border-red-200 dark:hover:border-red-900/60 transition-colors"
                title="Clear current text"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Clear</span>
              </button>
            )}

            {recognitionSupported && (
              <button
                type="button"
                onClick={handleToggleVoiceAnswer}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all border ${
                  isRecordingVoice
                    ? "bg-red-600 text-white border-red-700 shadow-sm animate-pulse"
                    : "bg-blue-50 dark:bg-blue-950/60 text-[#2F6FED] dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/60 border-blue-200 dark:border-blue-800"
                }`}
              >
                {isRecordingVoice ? (
                  <>
                    <MicOff className="w-3.5 h-3.5" />
                    <span>Done Speaking (Stop)</span>
                  </>
                ) : (
                  <>
                    <Mic className="w-3.5 h-3.5" />
                    <span>{answerText ? "Speak to Add More" : "Answer by Voice"}</span>
                  </>
                )}
              </button>
            )}
          </div>
        </div>

        <div className="relative">
          <textarea
            value={answerText}
            onChange={(e) => {
              setAnswerText(e.target.value);
              baseTextRef.current = e.target.value;
            }}
            placeholder="Speak with the mic above or type your explanation here... (e.g. key principles, real architecture trade-offs, edge cases)"
            rows={5}
            className={`w-full px-4 py-3.5 text-sm text-[#16233C] dark:text-white bg-white dark:bg-slate-800 border rounded-xl transition-all resize-y shadow-2xs placeholder:text-slate-400 dark:placeholder:text-slate-500 ${
              isRecordingVoice
                ? "border-red-400 dark:border-red-500 ring-2 ring-red-100 dark:ring-red-900/30"
                : "border-slate-300 dark:border-slate-700 focus:border-[#2F6FED] focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-900/40"
            }`}
          />

          {isRecordingVoice && (
            <div className="absolute bottom-3 right-3 flex items-center gap-2 text-xs text-red-700 dark:text-red-400 bg-white/95 dark:bg-slate-850/95 backdrop-blur-xs px-2.5 py-1 rounded-md border border-red-200 dark:border-red-900/60 shadow-xs">
              <span className="w-2 h-2 rounded-full bg-red-600 animate-ping" />
              <span>Listening cleanly (no repetitions)...</span>
            </div>
          )}
        </div>

        {/* Interim Speech Preview */}
        {isRecordingVoice && interimPreview && (
          <div className="text-xs text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-850 border border-dashed border-slate-200 dark:border-slate-700 px-3 py-1.5 rounded-lg flex items-center gap-2">
            <span className="font-semibold text-slate-700 dark:text-slate-300">Live preview:</span>
            <span className="italic text-slate-600 dark:text-slate-400 truncate">{interimPreview}</span>
          </div>
        )}

        <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
          <span>
            {answerText.trim() ? `${answerText.trim().split(/\s+/).length} words` : "Empty answer"}
          </span>

          {answerText.trim().length > 10 && !quickFeedback && (
            <button
              type="button"
              onClick={handleQuickCritique}
              disabled={isEvaluating}
              className="inline-flex items-center gap-1 text-[#2F6FED] dark:text-blue-400 hover:text-[#0B1A33] dark:hover:text-white font-medium"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>{isEvaluating ? "Analyzing answer..." : "Get instant AI check"}</span>
            </button>
          )}
        </div>
      </div>

      {/* Quick AI Critique Banner */}
      {quickFeedback && (
        <div className="p-4 bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-700 rounded-xl space-y-3 text-xs">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="font-bold text-[#0B1A33] dark:text-white flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-[#2F6FED] dark:text-blue-400" />
              Examiner Check: {quickFeedback.verdict}
            </span>
            <div className="flex items-center gap-2">
              {quickFeedback.correctnessScore !== undefined && (
                <span className={`px-2 py-0.5 rounded-md font-semibold border ${
                  quickFeedback.correctnessScore >= 70
                    ? "bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800"
                    : quickFeedback.correctnessScore >= 50
                    ? "bg-amber-50 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border-amber-200 dark:border-amber-800"
                    : "bg-rose-50 dark:bg-rose-950/60 text-rose-800 dark:text-rose-300 border-rose-200 dark:border-rose-800"
                }`}>
                  Correctness: {quickFeedback.correctnessScore}%
                </span>
              )}
              {quickFeedback.confidenceScore !== undefined && (
                <span className={`px-2 py-0.5 rounded-md font-semibold border ${
                  quickFeedback.confidenceScore >= 70
                    ? "bg-blue-50 dark:bg-blue-950/60 text-blue-800 dark:text-blue-300 border-blue-200 dark:border-blue-800"
                    : "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700"
                }`}>
                  Confidence: {quickFeedback.confidenceScore}%
                </span>
              )}
              {quickFeedback.score && (
                <span className="font-bold text-[#0B1A33] dark:text-white bg-white dark:bg-slate-800 px-2 py-0.5 rounded-md border border-slate-200 dark:border-slate-700">
                  Rating: {quickFeedback.score}/10
                </span>
              )}
            </div>
          </div>

          <p className="text-slate-700 dark:text-slate-300 leading-relaxed">{quickFeedback.feedback}</p>

          {((quickFeedback.correctAspects && quickFeedback.correctAspects.length > 0) ||
            (quickFeedback.missingOrIncorrect && quickFeedback.missingOrIncorrect.length > 0)) && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
              {quickFeedback.correctAspects && quickFeedback.correctAspects.length > 0 && (
                <div className="bg-emerald-50/70 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/60 p-2.5 rounded-lg">
                  <span className="font-bold text-emerald-900 dark:text-emerald-300 block mb-1">Accurate Aspects:</span>
                  <ul className="list-disc list-inside space-y-0.5 text-emerald-800 dark:text-emerald-400">
                    {quickFeedback.correctAspects.map((pt, i) => (
                      <li key={i}>{pt}</li>
                    ))}
                  </ul>
                </div>
              )}
              {quickFeedback.missingOrIncorrect && quickFeedback.missingOrIncorrect.length > 0 && (
                <div className="bg-rose-50/70 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 p-2.5 rounded-lg">
                  <span className="font-bold text-rose-900 dark:text-rose-300 block mb-1">To Add / Correct:</span>
                  <ul className="list-disc list-inside space-y-0.5 text-rose-800 dark:text-rose-400">
                    {quickFeedback.missingOrIncorrect.map((pt, i) => (
                      <li key={i}>{pt}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          {quickFeedback.keyTakeaway && (
            <p className="text-slate-600 dark:text-slate-400 bg-white dark:bg-slate-800 p-2 rounded-lg border border-slate-200 dark:border-slate-700 italic">
              <strong>Tip:</strong> {quickFeedback.keyTakeaway}
            </p>
          )}
        </div>
      )}

      {/* Submit / Next Button */}
      <div className="pt-2 flex items-center justify-end gap-3 border-t border-slate-100 dark:border-slate-800">
        <button
          type="button"
          onClick={handleSubmit}
          disabled={isSubmitting}
          className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-[#0B1A33] hover:bg-[#16233C] dark:bg-blue-600 dark:hover:bg-blue-700 text-white font-semibold text-sm rounded-xl shadow-xs hover:shadow-md transition-all disabled:opacity-50"
        >
          {isSubmitting ? (
            <span className="animate-pulse">Evaluating & Advancing...</span>
          ) : (
            <>
              <span>{isLastQuestion ? "Finish & View Results" : "Save Answer & Next"}</span>
              {isLastQuestion ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              ) : (
                <ArrowRight className="w-4 h-4" />
              )}
            </>
          )}
        </button>
      </div>
    </div>
  );
};
