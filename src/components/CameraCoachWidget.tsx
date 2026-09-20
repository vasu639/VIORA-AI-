import React, { useEffect, useState } from "react";
import {
  Camera,
  CameraOff,
  Sparkles,
  AlertCircle,
  Eye,
  Activity,
  Maximize,
  RotateCw,
  Wind,
  CheckCircle,
} from "lucide-react";
import { startCamera, stopCamera } from "../lib/camera";
import { CoachTipData } from "./QuestionCard";

interface CameraCoachWidgetProps {
  enabled: boolean;
  onToggle: (enabled: boolean) => void;
  videoRef: React.RefObject<HTMLVideoElement | null>;
  snapshotCount: number;
  activeCoachTip?: CoachTipData | null;
  postureTipsHistory?: string[];
  onRequestTip?: (focusCategory?: string) => void;
  isEvaluatingTip?: boolean;
}

export const CameraCoachWidget: React.FC<CameraCoachWidgetProps> = ({
  enabled,
  onToggle,
  videoRef,
  snapshotCount,
  activeCoachTip,
  postureTipsHistory = [],
  onRequestTip,
  isEvaluatingTip = false,
}) => {
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isInitializing, setIsInitializing] = useState(false);
  const [selectedFocus, setSelectedFocus] = useState<string>("all");
  const [showHistory, setShowHistory] = useState(false);

  useEffect(() => {
    let activeStream: MediaStream | null = null;

    if (enabled && videoRef.current) {
      setIsInitializing(true);
      setCameraError(null);
      startCamera(videoRef.current)
        .then((s) => {
          activeStream = s;
          setStream(s);
          setIsInitializing(false);
        })
        .catch((err) => {
          console.warn("Camera init failed:", err);
          setCameraError("Camera permission not granted or device unavailable.");
          setIsInitializing(false);
          onToggle(false);
        });
    } else {
      if (stream) {
        stopCamera(stream);
        setStream(null);
      }
    }

    return () => {
      if (activeStream) {
        stopCamera(activeStream);
      }
    };
  }, [enabled]);

  const categories = [
    { id: "all", label: "All Areas", icon: Sparkles },
    { id: "eye_contact", label: "Eye Contact", icon: Eye },
    { id: "shoulders", label: "Shoulders", icon: Activity },
    { id: "posture", label: "Posture", icon: Activity },
    { id: "framing", label: "Framing", icon: Maximize },
    { id: "breathing", label: "Breathing", icon: Wind },
  ];

  const handleRequest = (catId: string) => {
    setSelectedFocus(catId);
    onRequestTip?.(catId);
  };

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-2xs space-y-3.5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-md bg-blue-50 dark:bg-blue-950/60 text-[#2F6FED] dark:text-blue-400 flex items-center justify-center">
            <Camera className="w-3.5 h-3.5" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-[#0B1A33] dark:text-white flex items-center gap-1.5">
              Posture & Presence Coach
              <span className="text-[10px] text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/70 px-1.5 py-0.2 rounded-full border border-blue-100 dark:border-blue-900/60 font-semibold">
                AI Vision
              </span>
            </h4>
          </div>
        </div>

        <button
          type="button"
          onClick={() => onToggle(!enabled)}
          className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1 ${
            enabled
              ? "bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/60 border border-red-200 dark:border-red-900/60"
              : "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-750 border border-slate-200 dark:border-slate-700"
          }`}
        >
          {enabled ? (
            <>
              <CameraOff className="w-3 h-3" />
              <span>Disable Cam</span>
            </>
          ) : (
            <>
              <Camera className="w-3 h-3" />
              <span>Enable Cam</span>
            </>
          )}
        </button>
      </div>

      {/* Video Viewport (if enabled) */}
      {enabled ? (
        <div className="space-y-2">
          <div className="relative aspect-4/3 w-full bg-slate-900 rounded-lg overflow-hidden border border-slate-800 shadow-inner">
            <video
              ref={videoRef}
              playsInline
              muted
              className="w-full h-full object-cover transform -scale-x-100"
            />
            {isInitializing && (
              <div className="absolute inset-0 flex items-center justify-center bg-slate-950/80 text-white text-xs">
                <span className="animate-pulse">Initializing camera...</span>
              </div>
            )}
            <div className="absolute top-2 left-2 flex items-center gap-1.5 bg-black/60 backdrop-blur-xs text-white text-[10px] px-2 py-0.5 rounded-full border border-white/10">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>Live Coach Feed</span>
            </div>
            {snapshotCount > 0 && (
              <div className="absolute bottom-2 right-2 bg-black/70 backdrop-blur-xs text-amber-300 text-[10px] px-2 py-0.5 rounded-full flex items-center gap-1 border border-amber-400/20">
                <Sparkles className="w-2.5 h-2.5" />
                <span>{snapshotCount} vision check{snapshotCount > 1 ? "s" : ""}</span>
              </div>
            )}
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-tight">
            Frames are processed in real-time memory for posture and eye contact analysis. Never stored.
          </p>
        </div>
      ) : (
        <div className="p-3 bg-slate-50 dark:bg-slate-850 border border-slate-200/80 dark:border-slate-800 rounded-lg space-y-1 text-xs text-slate-600 dark:text-slate-300">
          <p className="font-semibold text-slate-800 dark:text-slate-200">Camera is optional.</p>
          <p className="text-[11px] text-slate-500 dark:text-slate-400">
            You can practice with your webcam off and still receive personalized suggestions on eye contact, shoulders, and posture below.
          </p>
        </div>
      )}

      {cameraError && (
        <div className="text-[11px] text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/40 p-2 rounded-md border border-amber-200 dark:border-amber-900/60 flex items-center gap-1.5">
          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
          <span>{cameraError}</span>
        </div>
      )}

      {/* Focus Area Category Selector */}
      <div className="space-y-1.5 pt-1">
        <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider block">
          Get Specific Advice:
        </label>
        <div className="flex flex-wrap gap-1.5">
          {categories.map((cat) => {
            const Icon = cat.icon;
            const isSelected = selectedFocus === cat.id;
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => handleRequest(cat.id)}
                disabled={isEvaluatingTip}
                className={`px-2 py-1 rounded-md text-[11px] font-medium flex items-center gap-1 transition-all border ${
                  isSelected
                    ? "bg-[#2F6FED] text-white border-[#2F6FED] shadow-2xs"
                    : "bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-750 border-slate-200 dark:border-slate-700"
                }`}
              >
                <Icon className="w-2.5 h-2.5" />
                <span>{cat.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Active Coach Tip Card */}
      {activeCoachTip && (
        <div className="p-3 bg-blue-50/70 dark:bg-blue-950/40 border border-blue-200/90 dark:border-blue-900/60 rounded-xl space-y-1.5">
          <div className="flex items-center justify-between text-[11px] font-bold text-blue-900 dark:text-blue-300">
            <span className="flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-[#2F6FED] dark:text-blue-400" />
              {activeCoachTip.label || "Coach Suggestion"}
            </span>
            <button
              type="button"
              onClick={() => onRequestTip?.(selectedFocus)}
              disabled={isEvaluatingTip}
              className="text-[#2F6FED] dark:text-blue-400 hover:text-[#0B1A33] dark:hover:text-white flex items-center gap-1 font-semibold text-[10px]"
              title="Get another unique tip in this category"
            >
              <RotateCw className={`w-2.5 h-2.5 ${isEvaluatingTip ? "animate-spin" : ""}`} />
              <span>{isEvaluatingTip ? "Checking..." : "Next Tip"}</span>
            </button>
          </div>
          <p className="text-xs text-slate-800 dark:text-slate-200 leading-relaxed font-normal">
            {activeCoachTip.tip}
          </p>
        </div>
      )}

      {/* History of Received Suggestions */}
      {postureTipsHistory.length > 0 && (
        <div className="space-y-1.5 pt-1 border-t border-slate-100 dark:border-slate-800">
          <button
            type="button"
            onClick={() => setShowHistory(!showHistory)}
            className="w-full flex items-center justify-between text-[11px] font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
          >
            <span>Session Suggestions ({postureTipsHistory.length})</span>
            <span className="text-[10px] text-blue-600 dark:text-blue-400 font-medium">
              {showHistory ? "Hide" : "View all"}
            </span>
          </button>

          {showHistory && (
            <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
              {postureTipsHistory.map((tip, idx) => (
                <div
                  key={idx}
                  className="p-2 rounded-lg bg-slate-50 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700 text-[11px] text-slate-700 dark:text-slate-300 flex items-start gap-1.5 leading-snug"
                >
                  <CheckCircle className="w-3 h-3 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                  <span>{tip}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
