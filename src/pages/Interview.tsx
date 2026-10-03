import React from "react";
import { AssessmentFlow } from "../components/AssessmentFlow";
import { SessionReport } from "../types";

interface InterviewPageProps {
  onBackToHome: () => void;
  onSessionComplete?: (session: SessionReport) => void;
}

export const Interview: React.FC<InterviewPageProps> = ({ onBackToHome, onSessionComplete }) => {
  return (
    <AssessmentFlow
      mode="interview"
      onBackToHome={onBackToHome}
      onSessionComplete={onSessionComplete}
    />
  );
};
