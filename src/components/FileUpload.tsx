import React, { useState, useRef } from "react";
import {
  Upload,
  FileText,
  CheckCircle2,
  AlertCircle,
  X,
  Sparkles,
  ClipboardList,
  BookOpen,
  FileType,
} from "lucide-react";
import { SAMPLE_VIVA_SYLLABUS, SAMPLE_INTERVIEW_RESUME } from "../lib/sampleDocs";

interface FileUploadProps {
  mode: "viva" | "interview";
  file: File | null;
  fileBase64: string | null;
  textContent: string | null;
  sampleName: string | null;
  onFileSelect: (
    file: File | null,
    base64: string | null,
    text: string | null,
    sampleName: string | null
  ) => void;
  error?: string | null;
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

export function validateFile(file: File): string | null {
  if (!file) return "Please choose a file.";
  const name = file.name.toLowerCase();
  const validExtensions = [
    ".pdf",
    ".docx",
    ".doc",
    ".txt",
    ".md",
    ".png",
    ".jpg",
    ".jpeg",
    ".webp",
  ];
  const hasValidExt = validExtensions.some((ext) => name.endsWith(ext));
  const hasValidMime =
    file.type === "application/pdf" ||
    file.type.includes("wordprocessingml") ||
    file.type.startsWith("text/") ||
    file.type.startsWith("image/");

  if (!hasValidExt && !hasValidMime) {
    return "Supported formats: PDF, Word (.docx), Plain Text (.txt, .md), or Image snapshot.";
  }

  if (file.size > 20 * 1024 * 1024) {
    return "That file is too large — please choose a document under 20MB.";
  }
  return null;
}

export const FileUpload: React.FC<FileUploadProps> = ({
  mode,
  file,
  fileBase64,
  textContent,
  sampleName,
  onFileSelect,
  error: parentError,
}) => {
  const [activeTab, setActiveTab] = useState<"upload" | "paste">("upload");
  const [dragOver, setDragOver] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [pastedText, setPastedText] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isViva = mode === "viva";
  const title = isViva ? "Course Syllabus" : "Resume / CV Document";
  const description = isViva
    ? "Upload your syllabus (PDF, Word, or Text). The AI reads every unit, module, and topic to formulate questions specific to your course."
    : "Upload your resume (PDF, Word, or Text). The AI extracts your actual projects and tech stack to ask grounded interview questions.";

  const handleFileChange = async (selectedFile: File) => {
    setLocalError(null);
    const validationError = validateFile(selectedFile);
    if (validationError) {
      setLocalError(validationError);
      return;
    }

    setIsProcessing(true);
    try {
      const lowerName = selectedFile.name.toLowerCase();
      const isPlainText =
        lowerName.endsWith(".txt") ||
        lowerName.endsWith(".md") ||
        selectedFile.type.startsWith("text/");

      if (isPlainText) {
        const text = await readFileAsText(selectedFile);
        const base64 = await fileToBase64(selectedFile);
        onFileSelect(selectedFile, base64, text, null);
      } else {
        const base64 = await fileToBase64(selectedFile);
        onFileSelect(selectedFile, base64, null, null);
      }
    } catch (e) {
      console.error(e);
      setLocalError("Failed to read the file. Please try selecting it again.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileChange(e.dataTransfer.files[0]);
    }
  };

  const handleUseSample = () => {
    setLocalError(null);
    if (isViva) {
      onFileSelect(
        null,
        null,
        SAMPLE_VIVA_SYLLABUS,
        "CS402: Distributed Systems Syllabus (Sample)"
      );
    } else {
      onFileSelect(
        null,
        null,
        SAMPLE_INTERVIEW_RESUME,
        "Priya Sharma: Senior Engineer Resume (Sample)"
      );
    }
  };

  const handlePastedTextChange = (text: string) => {
    setPastedText(text);
    setLocalError(null);
    if (text.trim()) {
      onFileSelect(
        null,
        null,
        text,
        isViva ? "Pasted Syllabus Content" : "Pasted Resume Content"
      );
    } else {
      onFileSelect(null, null, null, null);
    }
  };

  const handleClear = () => {
    setLocalError(null);
    setPastedText("");
    onFileSelect(null, null, null, null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const hasContent = !!(file || fileBase64 || textContent || sampleName);
  const activeDocName = file
    ? file.name
    : sampleName || (textContent ? (isViva ? "Custom Syllabus Text" : "Custom Resume Text") : null);

  const activeDocSize = file
    ? `${(file.size / (1024 * 1024)).toFixed(2)} MB`
    : textContent
    ? `${textContent.split(/\s+/).filter(Boolean).length} words`
    : "Document Ready";

  const getFormatBadge = () => {
    if (file) {
      const ext = file.name.split(".").pop()?.toUpperCase() || "FILE";
      return ext;
    }
    if (sampleName) return "SAMPLE";
    if (textContent) return "PASTED TEXT";
    return "DOCUMENT";
  };

  return (
    <div className="w-full space-y-3" id="syllabus-file-upload-section">
      {/* Header & Sample Quick-Loader */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <BookOpen className="w-4 h-4 text-[#2F6FED] dark:text-blue-400" />
          <label className="text-sm font-semibold text-[#0B1A33] dark:text-slate-200">
            {title} <span className="text-red-500">*</span>
          </label>
        </div>
        {!hasContent && (
          <button
            type="button"
            onClick={handleUseSample}
            id="use-sample-doc-btn"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#2F6FED] dark:text-blue-400 hover:text-[#0B1A33] dark:hover:text-white hover:underline transition-colors"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            Use Sample {isViva ? "Syllabus" : "Resume"}
          </button>
        )}
      </div>

      {/* Input Mode Selector (Upload vs Paste) when not yet chosen */}
      {!hasContent && (
        <div className="flex border-b border-slate-200 dark:border-slate-800 text-xs font-medium">
          <button
            type="button"
            onClick={() => setActiveTab("upload")}
            className={`pb-2 px-3 border-b-2 font-semibold transition-all ${
              activeTab === "upload"
                ? "border-[#2F6FED] text-[#2F6FED] dark:text-blue-400"
                : "border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-300"
            }`}
          >
            Upload Document (PDF / DOCX / TXT)
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("paste")}
            className={`pb-2 px-3 border-b-2 font-semibold transition-all ${
              activeTab === "paste"
                ? "border-[#2F6FED] text-[#2F6FED] dark:text-blue-400"
                : "border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-300"
            }`}
          >
            Paste Text Directly
          </button>
        </div>
      )}

      {/* Document Active Card */}
      {hasContent && activeDocName ? (
        <div className="p-4 bg-blue-50/70 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900/60 rounded-xl space-y-3">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-lg bg-[#2F6FED] text-white flex items-center justify-center shrink-0 shadow-sm">
                <FileText className="w-5 h-5" />
              </div>
              <div className="truncate">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-semibold text-[#0B1A33] dark:text-white truncate">
                    {activeDocName}
                  </p>
                  <span className="px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded bg-blue-100 dark:bg-blue-900/60 text-[#2F6FED] dark:text-blue-300">
                    {getFormatBadge()}
                  </span>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1.5 mt-0.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 inline shrink-0" />
                  <span>{activeDocSize}</span>
                  <span>•</span>
                  <span className="text-emerald-700 dark:text-emerald-400 font-medium">
                    Grounding active — AI will tailor questions to this document
                  </span>
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={handleClear}
              id="clear-uploaded-doc-btn"
              className="p-1.5 text-slate-400 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-white dark:hover:bg-slate-800 rounded-lg transition-colors shrink-0"
              title="Replace document"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Text Snippet Preview if text available */}
          {textContent && (
            <div className="bg-white/80 dark:bg-slate-900/60 p-2.5 rounded-lg border border-blue-100 dark:border-blue-900/40 text-[11px] font-mono text-slate-600 dark:text-slate-300 max-h-20 overflow-hidden line-clamp-3">
              {textContent.slice(0, 240)}...
            </div>
          )}
        </div>
      ) : activeTab === "upload" ? (
        /* Drag & Drop Upload Zone */
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          id="syllabus-dropzone"
          className={`relative border-2 border-dashed rounded-xl p-6 sm:p-8 text-center cursor-pointer transition-all duration-200 ${
            dragOver
              ? "border-[#2F6FED] bg-blue-50/50 dark:bg-blue-950/40 scale-[0.99]"
              : "border-slate-300 dark:border-slate-700 hover:border-[#2F6FED]/70 dark:hover:border-blue-500/70 bg-slate-50/60 dark:bg-slate-850/50 hover:bg-slate-50 dark:hover:bg-slate-800"
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.docx,.doc,.txt,.md,.png,.jpg,.jpeg,.webp,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain,text/markdown"
            onChange={(e) => {
              if (e.target.files && e.target.files.length > 0) {
                handleFileChange(e.target.files[0]);
              }
            }}
            className="hidden"
          />

          <div className="flex flex-col items-center justify-center space-y-2">
            <div className="w-12 h-12 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-xs flex items-center justify-center text-slate-600 dark:text-slate-300">
              <Upload className="w-6 h-6 text-[#2F6FED] dark:text-blue-400" />
            </div>

            <div className="space-y-1">
              <p className="text-sm font-semibold text-[#0B1A33] dark:text-white">
                {isProcessing
                  ? "Reading and preparing document..."
                  : "Click to upload or drag & drop"}
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto">
                {description}
              </p>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-1.5 pt-1">
              <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400 bg-white dark:bg-slate-800 px-2 py-0.5 rounded border border-slate-200/80 dark:border-slate-700">
                PDF
              </span>
              <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400 bg-white dark:bg-slate-800 px-2 py-0.5 rounded border border-slate-200/80 dark:border-slate-700">
                Word (DOCX)
              </span>
              <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400 bg-white dark:bg-slate-800 px-2 py-0.5 rounded border border-slate-200/80 dark:border-slate-700">
                Text (.txt / .md)
              </span>
              <span className="text-[11px] font-medium text-slate-400 dark:text-slate-500">
                Up to 20MB
              </span>
            </div>
          </div>
        </div>
      ) : (
        /* Paste Text Tab */
        <div className="space-y-2" id="syllabus-paste-area">
          <textarea
            rows={6}
            value={pastedText}
            onChange={(e) => handlePastedTextChange(e.target.value)}
            placeholder={
              isViva
                ? "Paste your course syllabus here...\n\nExample:\nUnit 1: Glycolysis and Krebs Cycle\nUnit 2: Oxidative Phosphorylation & ATP Synthase\nUnit 3: Lipid Metabolism & Beta-Oxidation\nUnit 4: Amino Acid Catabolism..."
                : "Paste your resume or CV text here...\n\nExample:\nCandidate: Alex Morgan\nExperience: Senior Software Engineer at Tech Corp\n- Built scalable microservices handling 2M requests/day\n- Architected PostgreSQL & Redis caching layer..."
            }
            className="w-full text-xs font-mono p-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-[#2F6FED] focus:border-transparent outline-none transition"
          />
          <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 px-1">
            <span>
              {pastedText.split(/\s+/).filter(Boolean).length} words • {pastedText.length}{" "}
              characters
            </span>
            <span>Paste chapters, units, or resume points</span>
          </div>
        </div>
      )}

      {(localError || parentError) && (
        <div className="flex items-center gap-2 text-xs text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/40 p-3 rounded-lg border border-red-200 dark:border-red-900/60">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{localError || parentError}</span>
        </div>
      )}
    </div>
  );
};
