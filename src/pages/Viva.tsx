import React from "react";
import { AssessmentFlow } from "../components/AssessmentFlow";
import { SessionReport } from "../types";

interface VivaPageProps {
  onBackToHome: () => void;
  onSessionComplete?: (session: SessionReport) => void;
}

export const Viva: React.FC<VivaPageProps> = ({ onBackToHome, onSessionComplete }) => {
  return (
    <AssessmentFlow
      mode="viva"
      onBackToHome={onBackToHome}
      onSessionComplete={onSessionComplete}
    />
  );
};
