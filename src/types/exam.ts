export interface ExamSessionData {
  sessionId: string;
  status: string;
  currentIndex: number;
  questions: QuestionForExam[];
  answers: AnswerState[];
  roleName?: string | null;
  resume?: boolean;
}

export interface QuestionForExam {
  id: number;
  chapterId: number;
  chapterTitle?: string;
  type: "single" | "multiple" | "truefalse";
  stem: string;
  options: { label: string; text: string }[];
  answer: string[];
}

export interface AnswerState {
  selected: string[];
  revealed: boolean;
}

export interface ExamResult {
  sessionId: string;
  name: string;
  department: string;
  roleName?: string | null;
  score: number;
  total: number;
  percentage: number;
  status: string;
  finished_at: string;
  details: QuestionDetail[];
}

export interface QuestionDetail {
  questionId: number;
  stem?: string;
  type?: string;
  options?: { label: string; text: string }[];
  selected: string[];
  correctAnswer: string[];
  correct: boolean;
}

export interface MyRecord {
  id: string;
  sessionId: string;
  roleName?: string | null;
  score: number;
  total: number;
  percentage: number;
  status: string;
  finished_at: string;
}
