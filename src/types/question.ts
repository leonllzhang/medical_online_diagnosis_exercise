export interface Option {
  label: string;
  text: string;
}

export interface Question {
  id: number;
  chapterId: number;
  chapterTitle?: string;
  type: "single" | "multiple" | "truefalse";
  stem: string;
  options: Option[];
  answer: string[];
}

export interface ChapterGroup {
  chapterId: number;
  chapterTitle: string;
  questions: Question[];
}

export const TYPE_LABELS: Record<string, string> = {
  single: "单选题",
  multiple: "多选题",
  truefalse: "判断题",
};
