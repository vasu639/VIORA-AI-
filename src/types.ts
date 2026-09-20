export type AssessmentMode = "viva" | "interview";

export type DifficultyLevel = "Beginner" | "Intermediate" | "Advanced";

export type InterviewSubMode = "technical" | "behavioral" | "managerial" | "rapidfire";

export interface QuestionItem {
  id: number;
  question: string;
  topic?: string; // For viva
  basedOn?: string; // For interview
}

export interface AnswerItem {
  questionId: number;
  questionText: string;
  topicOrGrounding: string;
  answerText: string;
  score?: number; // 1-10
  correctnessScore?: number; // 0-100%
  confidenceScore?: number; // 0-100%
  verdict?: string;
  feedback?: string;
  correctAspects?: string[];
  missingOrIncorrect?: string[];
  keyTakeaway?: string;
  answeredByVoice?: boolean;
  timestamp?: number;
}

export interface SessionReport {
  id: string;
  mode: AssessmentMode;
  subMode?: InterviewSubMode;
  meta: {
    courseName?: string;
    degreeProgram?: string; // e.g. "B.Tech Computer Science", "B.Sc Physics", "MBA"
    targetRole?: string; // e.g. "Full Stack Developer", "Data Analyst"
    level?: DifficultyLevel;
    fileName?: string;
    fileSize?: number;
  };
  questions: QuestionItem[];
  answers: AnswerItem[];
  postureTips: string[];
  overallScore: number; // Genuine earned merit percentage 0-100%
  correctnessAverage: number; // 0-100%
  confidenceAverage: number; // 0-100%
  readinessPercentage: number; // 0-100% College Viva or Job Interview Readiness
  readinessLabel: string; // "Exam Ready (High)", "Borderline - Revision Needed", "Not Ready"
  readinessVerdictExplanation: string;
  degreeOrRoleTarget?: string;
  grade: string;
  executiveSummary?: string;
  strengths?: string[];
  improvements?: string[];
  oralPresenceTips?: string;
  createdAt: number;
}
