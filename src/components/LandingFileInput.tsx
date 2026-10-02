import React, { useState, useRef } from "react";
import {
  Upload,
  FileText,
  CheckCircle2,
  AlertCircle,
  X,
  Sparkles,
  BookOpen,
  ArrowRight,
  Layers,
  FileCode,
  FileCheck,
  ChevronDown,
  ChevronUp,
  Cpu,
} from "lucide-react";
import { DifficultyLevel } from "../types";
import { SAMPLE_VIVA_SYLLABUS } from "../lib/sampleDocs";

interface ExtractedDocInfo {
  text: string;
  wordCount: number;
  charCount: number;
  preview: string;
  detectedSubject: string;
  detectedUnits: string[];
}

export interface LandingFileInputProps {
  onLaunchViva: (payload: {
    file: File | null;
    fileBase64: string | null;
    textContent: string | null;
    courseName: string;
    difficulty: DifficultyLevel;
    numQuestions: number;
  }) => void;
  onSelectInterviewMode: () => void;
}

export function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      const base64 = result.split(",")[1];
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export function readFileAsText(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      resolve((reader.result as string) || "");
    };
    reader.onerror = reject;
    reader.readAsText(file);
  });
}

export const LandingFileInput: React.FC<LandingFileInputProps> = ({
  onLaunchViva,
  onSelectInterviewMode,
}) => {
  const [activeTab, setActiveTab] = useState<"upload" | "paste">("upload");
  const [dragOver, setDragOver] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileBase64, setFileBase64] = useState<string | null>(null);
  const [textContent, setTextContent] = useState<string | null>(null);
  const [pastedText, setPastedText] = useState("");
  const [isExtracting, setIsExtracting] = useState(false);
  const [extractedInfo, setExtractedInfo] = useState<ExtractedDocInfo | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [difficulty, setDifficulty] = useState<DifficultyLevel>("Intermediate");
  const [numQuestions, setNumQuestions] = useState<number>(5);
  const [courseName, setCourseName] = useState<string>("");
  const [showPreview, setShowPreview] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Extract text from file or text
  const processAndExtract = async (file: File | null, rawBase64: string | null, rawText: string | null) => {
    setErrorMsg(null);
    setIsExtracting(true);

    try {
      let extracted: ExtractedDocInfo;

      if (rawText && rawText.trim().length > 0) {
        // Plain text local analysis + API validation
        const words = rawText.trim().split(/\s+/).filter(Boolean).length;
        const lines = rawText.split("\n").map((l) => l.trim()).filter((l) => l.length > 0);
        const headingKeywords = ["unit", "module", "chapter", "section", "topic", "part"];
        const units = lines.filter((l) =>
          headingKeywords.some((kw) => l.toLowerCase().startsWith(kw) || l.toLowerCase().includes(kw + " "))
        ).slice(0, 6);

        extracted = {
          text: rawText.trim(),
          wordCount: words,
          charCount: rawText.length,
          preview: rawText.slice(0, 400) + (rawText.length > 400 ? "..." : ""),
          detectedSubject: courseName || lines[0]?.slice(0, 70) || "Course Syllabus",
          detectedUnits: units,
        };
        if (!courseName && lines[0] && lines[0].length < 70) {
          setCourseName(lines[0]);
        }
      } else if (rawBase64) {
        // Call backend /api/extract-text (which uses pdf-parse or mammoth)
        const res = await fetch("/api/extract-text", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            fileBase64: rawBase64,
            fileName: file?.name || "document.pdf",
            mimeType: file?.type || "application/pdf",
          }),
        });

        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData.error || "Failed to extract text from the document.");
        }

        const data = await res.json();
        extracted = {
          text: data.text,
          wordCount: data.wordCount,
          charCount: data.charCount,
          preview: data.preview,
          detectedSubject: data.detectedSubject || "Course Syllabus",
          detectedUnits: data.detectedUnits || [],
        };

        if (data.detectedSubject && (!courseName || courseName === "Course Syllabus")) {
          setCourseName(data.detectedSubject);
        }
      } else {
        throw new Error("No file or text provided.");
      }

      setExtractedInfo(extracted);
    } catch (err: any) {
      console.error("[Extraction Error]:", err);
      setErrorMsg(err.message || "Failed to extract text. Please ensure the file contains readable text.");
      setExtractedInfo(null);
    } finally {
      setIsExtracting(false);
    }
  };

  const handleFileChange = async (file: File) => {
    setErrorMsg(null);
    const validExtensions = [".pdf", ".docx", ".doc", ".txt", ".md"];
    const lowerName = file.name.toLowerCase();
    const isValid = validExtensions.some((ext) => lowerName.endsWith(ext)) || file.type.startsWith("text/");

    if (!isValid) {
      setErrorMsg("Please select a PDF document (.pdf), Word document (.docx), or plain text file (.txt, .md).");
      return;
    }

    if (file.size > 25 * 1024 * 1024) {
      setErrorMsg("File is too large. Please select a document under 25MB.");
      return;
    }

    setSelectedFile(file);
    const isPlainText = lowerName.endsWith(".txt") || lowerName.endsWith(".md") || file.type.startsWith("text/");

    try {
      if (isPlainText) {
        const text = await readFileAsText(file);
        const base64 = await fileToBase64(file);
        setTextContent(text);
        setFileBase64(base64);
        await processAndExtract(file, base64, text);
      } else {
        const base64 = await fileToBase64(file);
        setFileBase64(base64);
        setTextContent(null);
        await processAndExtract(file, base64, null);
      }
    } catch (e: any) {
      setErrorMsg("Failed to read the file. Please try again.");
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileChange(e.dataTransfer.files[0]);
    }
  };

  const handlePastedTextChange = async (val: string) => {
    setPastedText(val);
    setSelectedFile(null);
    setFileBase64(null);
    setTextContent(val);
    if (val.trim().length > 30) {
      await processAndExtract(null, null, val);
    } else {
      setExtractedInfo(null);
    }
  };

  const handleUseSampleSyllabus = async () => {
    setErrorMsg(null);
    setSelectedFile(null);
    setFileBase64(null);
    setTextContent(SAMPLE_VIVA_SYLLABUS);
    setPastedText(SAMPLE_VIVA_SYLLABUS);
    setCourseName("CS402: Distributed Systems & Operating Systems");
    await processAndExtract(null, null, SAMPLE_VIVA_SYLLABUS);
  };

  const handleClear = () => {
    setSelectedFile(null);
    setFileBase64(null);
    setTextContent(null);
    setPastedText("");
    setExtractedInfo(null);
    setErrorMsg(null);
    setCourseName("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleLaunch = () => {
    if (!extractedInfo && !fileBase64 && !textContent) {
      setErrorMsg("Please upload a syllabus PDF or paste your syllabus text first.");
      return;
    }

    onLaunchViva({
      file: selectedFile,
      fileBase64,
      textContent: extractedInfo?.text || textContent,
      courseName: courseName.trim() || extractedInfo?.detectedSubject || "Course Syllabus",
      difficulty,
      numQuestions,
    });
  };

  return (
    <div
      id="landing-syllabus-input-component"
      className="bg-white dark:bg-slate-900 border-2 border-blue-200/90 dark:border-blue-900/60 rounded-3xl p-6 sm:p-8 shadow-md hover:shadow-lg transition-all"
    >
      {/* Top Banner Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-6 border-b border-slate-100 dark:border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#2F6FED] to-blue-400 text-white flex items-center justify-center shadow-sm">
            <BookOpen className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#2F6FED] dark:text-blue-400 bg-blue-50 dark:bg-blue-950/70 px-2 py-0.5 rounded-full border border-blue-100 dark:border-blue-900">
                100% Strict Grounding Engine
              </span>
              <span className="text-xs text-slate-400">•</span>
              <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                Integrated with <strong className="text-slate-700 dark:text-slate-200">pdf-parse</strong>
              </span>
            </div>
            <h3 className="text-lg sm:text-xl font-black text-[#0B1A33] dark:text-white mt-1">
              Upload Syllabus for Grounded Viva Voce
            </h3>
          </div>
        </div>

        {/* Quick Sample Button */}
        {!extractedInfo && (
          <button
            type="button"
            onClick={handleUseSampleSyllabus}
            id="landing-use-sample-btn"
            className="inline-flex items-center gap-1.5 self-start sm:self-center px-3.5 py-1.5 rounded-xl bg-blue-50 dark:bg-blue-950/60 hover:bg-blue-100 dark:hover:bg-blue-900/60 border border-blue-200/80 dark:border-blue-800 text-xs font-semibold text-[#2F6FED] dark:text-blue-300 transition-colors"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            <span>Load Sample Syllabus (CS402)</span>
          </button>
        )}
      </div>

      {/* Tabs: Upload vs Paste (When no doc extracted yet) */}
      {!extractedInfo && (
        <div className="flex border-b border-slate-100 dark:border-slate-800 text-xs font-semibold mt-4 mb-4">
          <button
            type="button"
            onClick={() => setActiveTab("upload")}
            className={`pb-2.5 px-4 border-b-2 transition-all ${
              activeTab === "upload"
                ? "border-[#2F6FED] text-[#2F6FED] dark:text-blue-400"
                : "border-transparent text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
            }`}
          >
            Upload Document (PDF / DOCX / TXT)
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("paste")}
            className={`pb-2.5 px-4 border-b-2 transition-all ${
              activeTab === "paste"
                ? "border-[#2F6FED] text-[#2F6FED] dark:text-blue-400"
                : "border-transparent text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
            }`}
          >
            Paste Syllabus Text
          </button>
        </div>
      )}

      {/* Dropzone Area or Pasted Input */}
      {!extractedInfo && activeTab === "upload" && (
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all duration-200 ${
            dragOver
              ? "border-[#2F6FED] bg-blue-50/70 dark:bg-blue-950/40 scale-[1.01]"
              : "border-slate-300 dark:border-slate-700 hover:border-[#2F6FED] dark:hover:border-blue-400 bg-slate-50/60 dark:bg-slate-800/40"
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.docx,.doc,.txt,.md,application/pdf"
            onChange={(e) => {
              if (e.target.files && e.target.files[0]) {
                handleFileChange(e.target.files[0]);
              }
            }}
            className="hidden"
            id="landing-file-input"
          />

          <div className="flex flex-col items-center gap-3">
            <div className="w-14 h-14 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-xs flex items-center justify-center text-[#2F6FED] dark:text-blue-400">
              <Upload className="w-6 h-6 animate-bounce" />
            </div>

            <div className="space-y-1">
              <p className="text-sm font-bold text-[#0B1A33] dark:text-white">
                Drop your syllabus PDF or text file here, or{" "}
                <span className="text-[#2F6FED] dark:text-blue-400 underline">browse files</span>
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Supports PDF (.pdf), Word (.docx), and plain text (.txt, .md) up to 25MB
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Paste Syllabus Text Area */}
      {!extractedInfo && activeTab === "paste" && (
        <div className="space-y-2">
          <textarea
            value={pastedText}
            onChange={(e) => handlePastedTextChange(e.target.value)}
            placeholder="Paste syllabus modules, course outline, units, and learning outcomes here..."
            rows={5}
            className="w-full p-4 text-xs font-mono bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 rounded-2xl text-slate-800 dark:text-slate-100 focus:outline-hidden focus:border-[#2F6FED] focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-900/40 transition-all resize-y"
          />
          <p className="text-[11px] text-slate-400">
            Tip: Paste Unit 1, Unit 2, Unit 3 chapters to extract topics automatically.
          </p>
        </div>
      )}

      {/* Loading Extraction Indicator */}
      {isExtracting && (
        <div className="my-6 p-6 rounded-2xl bg-blue-50/80 dark:bg-blue-950/50 border border-blue-200 dark:border-blue-900 flex items-center justify-center gap-3 animate-in fade-in duration-200">
          <div className="w-5 h-5 border-2 border-[#2F6FED] border-t-transparent rounded-full animate-spin" />
          <div className="text-xs font-semibold text-[#0B1A33] dark:text-blue-200">
            Parsing document text with <strong>pdf-parse</strong> and preparing Gemini strict prompt...
          </div>
        </div>
      )}

      {/* Error Message */}
      {errorMsg && (
        <div className="mt-4 p-3.5 rounded-xl bg-red-50 dark:bg-red-950/60 border border-red-200 dark:border-red-900 flex items-start gap-2 text-xs text-red-700 dark:text-red-300">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-500" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Extracted Document Card & Configuration */}
      {extractedInfo && (
        <div className="mt-5 space-y-5 animate-in fade-in zoom-in-95 duration-200">
          {/* Document Header Badge */}
          <div className="p-4 rounded-2xl bg-emerald-50/80 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500 text-white flex items-center justify-center shrink-0">
                <FileCheck className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-emerald-800 dark:text-emerald-300">
                    Document Text Extracted Successfully
                  </span>
                  <span className="text-[10px] font-semibold uppercase bg-emerald-200/70 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-300 px-2 py-0.5 rounded-full">
                    Strictly Grounded
                  </span>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-300 font-medium">
                  {selectedFile ? selectedFile.name : "Custom Syllabus Input"} •{" "}
                  <strong>{extractedInfo.wordCount.toLocaleString()} words</strong> (
                  {extractedInfo.charCount.toLocaleString()} characters)
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={handleClear}
              className="self-end sm:self-center text-xs font-semibold text-slate-400 hover:text-red-500 dark:hover:text-red-400 flex items-center gap-1 transition-colors"
            >
              <X className="w-3.5 h-3.5" />
              <span>Change File</span>
            </button>
          </div>

          {/* Detected Subject & Units */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <label className="text-xs font-bold text-[#0B1A33] dark:text-white flex items-center gap-1.5">
                <Cpu className="w-3.5 h-3.5 text-[#2F6FED]" />
                <span>Detected Subject / Course:</span>
              </label>
              <input
                type="text"
                value={courseName}
                onChange={(e) => setCourseName(e.target.value)}
                placeholder="Enter subject title (e.g. Distributed Systems)"
                className="text-xs px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-100 font-medium focus:outline-hidden focus:border-[#2F6FED] sm:w-72"
              />
            </div>

            {/* Detected Units Pills */}
            {extractedInfo.detectedUnits.length > 0 && (
              <div className="space-y-1.5 pt-1">
                <span className="text-[11px] font-semibold text-slate-400">
                  Detected Syllabus Modules / Units for Grounding:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {extractedInfo.detectedUnits.map((u, i) => (
                    <span
                      key={i}
                      className="text-[11px] font-medium bg-blue-50 dark:bg-blue-950/70 border border-blue-200 dark:border-blue-900 text-[#2F6FED] dark:text-blue-300 px-2.5 py-1 rounded-lg"
                    >
                      {u}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Collapsible Text Preview */}
            <div className="pt-2 border-t border-slate-200 dark:border-slate-700/60">
              <button
                type="button"
                onClick={() => setShowPreview(!showPreview)}
                className="text-[11px] font-semibold text-[#2F6FED] dark:text-blue-400 flex items-center gap-1 hover:underline"
              >
                <span>{showPreview ? "Hide" : "View"} Extracted Document Excerpt</span>
                {showPreview ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
              </button>
              {showPreview && (
                <div className="mt-2 p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 text-[11px] font-mono text-slate-600 dark:text-slate-300 max-h-36 overflow-y-auto leading-relaxed whitespace-pre-wrap">
                  {extractedInfo.preview}
                </div>
              )}
            </div>
          </div>

          {/* Examination Parameters Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Difficulty Level Selector */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Viva Voce Difficulty Level:
              </label>
              <div className="grid grid-cols-3 gap-1.5">
                {(["Beginner", "Intermediate", "Advanced"] as DifficultyLevel[]).map((lvl) => (
                  <button
                    key={lvl}
                    type="button"
                    onClick={() => setDifficulty(lvl)}
                    className={`py-2 px-2 text-xs font-bold rounded-xl border text-center transition-all ${
                      difficulty === lvl
                        ? "bg-[#2F6FED] text-white border-[#2F6FED] shadow-xs"
                        : "bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-slate-300"
                    }`}
                  >
                    {lvl}
                  </button>
                ))}
              </div>
            </div>

            {/* Question Count Selector */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Number of Oral Questions:
              </label>
              <div className="grid grid-cols-4 gap-1.5">
                {[3, 5, 7, 10].map((count) => (
                  <button
                    key={count}
                    type="button"
                    onClick={() => setNumQuestions(count)}
                    className={`py-2 px-2 text-xs font-bold rounded-xl border text-center transition-all ${
                      numQuestions === count
                        ? "bg-[#0B1A33] dark:bg-white text-white dark:text-[#0B1A33] border-[#0B1A33] dark:border-white shadow-xs"
                        : "bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-slate-300"
                    }`}
                  >
                    {count} Qs
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Launch Action Buttons */}
          <div className="pt-2 flex flex-col sm:flex-row items-center gap-3">
            <button
              type="button"
              onClick={handleLaunch}
              id="landing-launch-viva-btn"
              className="w-full sm:flex-1 py-3.5 px-6 rounded-2xl bg-gradient-to-r from-[#2F6FED] to-blue-600 hover:from-blue-600 hover:to-[#2F6FED] text-white font-bold text-sm shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 group cursor-pointer"
            >
              <Sparkles className="w-4 h-4 text-blue-200 group-hover:rotate-12 transition-transform" />
              <span>Launch Strict Syllabus Viva Voce</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </button>

            <button
              type="button"
              onClick={onSelectInterviewMode}
              className="w-full sm:w-auto py-3.5 px-4 rounded-2xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-bold text-slate-600 dark:text-slate-300 transition-colors"
            >
              Switch to Interview Mode
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
