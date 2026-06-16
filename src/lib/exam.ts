import { Question } from "@/types/question";

interface RuleConfig {
  chapterId: number;
  questionCount: number;
}

export function generatePaper(
  allQuestions: Question[],
  configs: RuleConfig[]
): Question[] {
  const selected: Question[] = [];

  for (const cfg of configs) {
    const chapterQuestions = allQuestions.filter(
      (q) => q.chapterId === cfg.chapterId
    );

    if (cfg.questionCount === 0 || cfg.questionCount >= chapterQuestions.length) {
      selected.push(...chapterQuestions);
    } else {
      const shuffled = [...chapterQuestions].sort(() => Math.random() - 0.5);
      selected.push(...shuffled.slice(0, cfg.questionCount));
    }
  }

  // Final shuffle
  return selected.sort(() => Math.random() - 0.5);
}

export function checkAnswer(
  question: Question,
  selected: string[]
): boolean {
  const correctSet = new Set(question.answer);
  const selectedSet = new Set(selected);
  if (correctSet.size !== selectedSet.size) return false;
  const allCorrect = Array.from(correctSet).every((a) => selectedSet.has(a));
  if (!allCorrect) return false;
  return true;
}

export function calculateScore(
  questions: Question[],
  answers: { selected: string[] }[]
): { score: number; detail: { questionId: number; correct: boolean; correctAnswer: string[] }[] } {
  let score = 0;
  const detail = [];

  for (let i = 0; i < questions.length; i++) {
    const q = questions[i];
    const ans = answers[i] || { selected: [] };
    const correct = checkAnswer(q, ans.selected);
    if (correct) score++;
    detail.push({
      questionId: q.id,
      correct,
      correctAnswer: q.answer,
    });
  }

  return { score, detail };
}
