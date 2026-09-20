import React, { useState, useRef } from "react";
import { Upload, FileText, CheckCircle2, AlertCircle, X, Sparkles } from "lucide-react";
import { SAMPLE_VIVA_SYLLABUS, SAMPLE_INTERVIEW_RESUME } from "../lib/sampleDocs";

interface FileUploadProps {
  mode: "viva" | "interview";
  file: File | null;
  fileBase64: string | null;
  textContent: string | null;
  sampleName: string | null;
  onFileSelect: (file: File | null, base64: string | null, text: string | null, sampleName: string | null) => void;
  error?: string | null;
}

export function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      // Strip data URL prefix to get raw base64
      const base64 = result.split(",")[1];
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export function validateFile(file: File): string | null {
  if (!file) return "Please choose a file.";
  const isPdf = file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf");
  if (!isPdf) return "Please upload a PDF document.";
  if (file.size > 15 * 1024 * 1024) {
    return "That file is too large — please choose a PDF under 15MB.";
  }
  return null;
}

export const FileUpload: React.FC<FileUploadProps> = ({
  mode,
  file,
  sampleName,
  onFileSelect,
  error: parentError,
}) => {
  const [dragOver, setDragOver] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isViva = mode === "viva";
  const title = isViva ? "Upload Course Syllabus (PDF)" : "Upload Resume / CV (PDF)";
  const description = isViva
    ? "Viora AI reads your syllabus units, topics, and references to formulate examiner questions."
    : "Viora AI parses your work experience, projects, and tech stack to ask grounded interview questions.";

  const handleFileChange = async (selectedFile: File) => {
    setLocalError(null);
    const validationError = validateFile(selectedFile);
    if (validationError) {
      setLocalError(validationError);
      return;
    }

    setIsProcessing(true);
    try {
      const base64 = await fileToBase64(selectedFile);
      onFileSelect(selectedFile, base64, null, null);
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
      onFileSelect(null, null, SAMPLE_VIVA_SYLLABUS, "CS402: Distributed Systems Syllabus (Sample)");
    } else {
      onFileSelect(null, null, SAMPLE_INTERVIEW_RESUME, "Priya Sharma: Senior Engineer Resume (Sample)");
    }
  };

  const handleClear = () => {
    setLocalError(null);
    onFileSelect(null, null, null, null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const activeDocName = file ? file.name : sampleName;
  const activeDocSize = file ? `${(file.size / (1024 * 1024)).toFixed(2)} MB` : "Demo Document";

  return (
    <div className="w-full space-y-3">
      <div className="flex items-center justify-between">
        <label className="block text-sm font-semibold text-[#0B1A33] dark:text-slate-200">
          {title} <span className="text-red-500">*</span>
        </label>
        {!activeDocName && (
          <button
            type="button"
            onClick={handleUseSample}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#2F6FED] dark:text-blue-400 hover:text-[#0B1A33] dark:hover:text-white hover:underline"
          >
            <Sparkles className="w-3.5 h-3.5" />
            Use Sample {isViva ? "Syllabus" : "Resume"}
          </button>
        )}
      </div>

      {activeDocName ? (
        <div className="flex items-center justify-between p-4 bg-blue-50/60 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900/60 rounded-xl">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-lg bg-[#2F6FED] text-white flex items-center justify-center shrink-0">
              <FileText className="w-5 h-5" />
            </div>
            <div className="truncate">
              <p className="text-sm font-semibold text-[#0B1A33] dark:text-white truncate">
                {activeDocName}
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1.5 mt-0.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 inline" />
                <span>{activeDocSize}</span>
                <span>•</span>
                <span className="text-emerald-700 dark:text-emerald-400 font-medium">Ready for AI generation</span>
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleClear}
            className="p-1.5 text-slate-400 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-white dark:hover:bg-slate-800 rounded-lg transition-colors ml-3 shrink-0"
            title="Remove document"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      ) : (
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`relative border-2 border-dashed rounded-xl p-6 sm:p-8 text-center cursor-pointer transition-all duration-200 ${
            dragOver
              ? "border-[#2F6FED] bg-blue-50/50 dark:bg-blue-950/40 scale-[0.99]"
              : "border-slate-300 dark:border-slate-700 hover:border-slate-400 dark:hover:border-slate-600 bg-slate-50/50 dark:bg-slate-850/50 hover:bg-slate-50 dark:hover:bg-slate-800"
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="application/pdf,.pdf"
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
                {isProcessing ? "Reading PDF document..." : "Click to upload or drag & drop"}
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
                {description}
              </p>
            </div>

            <span className="inline-block text-[11px] font-medium text-slate-400 dark:text-slate-500 bg-white dark:bg-slate-800 px-2.5 py-1 rounded-md border border-slate-200/60 dark:border-slate-700 mt-1">
              PDF format (up to 15MB)
            </span>
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
