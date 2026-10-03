import React, { useState } from "react";
import { EvidenceSetup } from "../components/evidence/EvidenceSetup";
import { EvidenceDashboard } from "../components/evidence/EvidenceDashboard";
import { AssessmentFlow } from "../components/AssessmentFlow";
import { EvidenceReport, SessionReport } from "../types";
import { Mic, Layers, ArrowLeft } from "lucide-react";

interface InterviewPageProps {
  onBackToHome: () => void;
  onSessionComplete?: (session: SessionReport) => void;
}

export const Interview: React.FC<InterviewPageProps> = ({ onBackToHome, onSessionComplete }) => {
  const [currentReport, setCurrentReport] = useState<EvidenceReport | null>(null);
  const [oralPracticeMode, setOralPracticeMode] = useState<boolean>(false);
  const [skillsToProbe, setSkillsToProbe] = useState<string[]>([]);

  const handleLaunchOralPractice = (skills: string[]) => {
    setSkillsToProbe(skills);
    setOralPracticeMode(true);
  };

  // If student activated oral practice on their evidence gaps
  if (oralPracticeMode) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-xs">
          <button
            onClick={() => setOralPracticeMode(false)}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 dark:text-slate-300 hover:text-[#2F6FED]"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Return to Evidence Dashboard</span>
          </button>
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500">
              Probing Evidence Gaps:{" "}
              <strong className="text-slate-800 dark:text-slate-200">
                {skillsToProbe.length > 0 ? skillsToProbe.join(", ") : "Target Role Skills"}
              </strong>
            </span>
          </div>
        </div>

        <AssessmentFlow
          mode="interview"
          onBackToHome={() => setOralPracticeMode(false)}
          onSessionComplete={onSessionComplete}
        />
      </div>
    );
  }

  // If evidence analysis report has been generated
  if (currentReport) {
    return (
      <EvidenceDashboard
        report={currentReport}
        onReset={() => setCurrentReport(null)}
        onLaunchOralPractice={handleLaunchOralPractice}
      />
    );
  }

  // Otherwise, display the Evidence Onboarding / Setup Screen
  return (
    <EvidenceSetup
      onAnalyzeSuccess={(report) => setCurrentReport(report)}
      onBackToHome={onBackToHome}
    />
  );
};
