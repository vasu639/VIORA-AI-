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

// -------------------------------------------------------------
// Viora Evidence-Based Learning Coach Types
// -------------------------------------------------------------

export type SkillStatus = "Proven" | "Partial" | "Claimed-only";

export interface EvidenceProofItem {
  id: string;
  type: "repo" | "readme" | "code_file" | "commit" | "test_folder" | "deployment";
  label: string;
  detail: string;
  url?: string;
  repoName?: string;
  filePath?: string;
  codeSnippet?: string;
  commitHash?: string;
}

export interface SkillEvidenceItem {
  id: string;
  skillName: string;
  status: SkillStatus;
  evidenceStrength: number; // 0-100%
  explanation: string;
  evidenceChips: string[]; // e.g. ["Repository: Portfolio Website", "README mentions React", "src/App.jsx", "Recent commits", "Test folder found"]
  proofs: EvidenceProofItem[];
  category?: "Frontend" | "Backend" | "DevOps & Cloud" | "Data & Database" | "Core Languages" | "Testing & Quality" | "Tools";
}

export interface RoleComparisonRow {
  requiredSkill: string;
  studentStatus: SkillStatus | "Missing";
  evidenceFound: string;
  recommendedAction: string;
  points: number; // 1 for Proven, 0.5 for Partial, 0 for Claimed/Missing
}

export interface LearningGapItem {
  skill: string;
  impact: string;
  recommendation: string;
  priority: "High" | "Medium" | "Low";
}

export interface MicroTaskChecklistItem {
  id: string;
  text: string;
  completed: boolean;
}

export interface MicroTask {
  id: string;
  skill: string;
  title: string;
  estimatedMinutes: number; // 20-40 min
  whyItMatters: string;
  whatToBuild: string;
  stepByStep: string[];
  expectedDeliverable: string;
  checklist: MicroTaskChecklistItem[];
  isCompleted: boolean;
  repoNameTarget?: string;
}

export interface EvidenceReport {
  id: string;
  studentName: string;
  githubUsername: string;
  githubAvatarUrl?: string;
  targetRole: string;
  jobDescriptionSnippet: string;
  matchScore: number; // 0-100% calculated strictly: (earnedPoints / totalRequiredSkills) * 100
  totalRequiredSkills: number;
  earnedPoints: number;
  encouragingSummary: string;
  topLearningGaps: LearningGapItem[];
  skills: SkillEvidenceItem[];
  comparisonTable: RoleComparisonRow[];
  microTasks: MicroTask[];
  createdAt: number;
  resumeFileName?: string;
}

