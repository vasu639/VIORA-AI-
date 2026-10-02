import React from "react";
import { AssessmentFlow, InitialDocConfig } from "../components/AssessmentFlow";
import { SessionReport } from "../types";

interface VivaPageProps {
  onBackToHome: () => void;
  onSessionComplete?: (session: SessionReport) => void;
  initialDocument?: InitialDocConfig | null;
}

export const Viva: React.FC<VivaPageProps> = ({
  onBackToHome,
  onSessionComplete,
  initialDocument,
}) => {
  return (
    <AssessmentFlow
      mode="viva"
      onBackToHome={onBackToHome}
      onSessionComplete={onSessionComplete}
      initialDocument={initialDocument}
    />
  );
};

