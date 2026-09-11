import type { Progress, Question } from "../types.ts";
import { updateMemory } from "./memory.ts";
export interface SubmittedAnswer {
  q: Question;
  correct: boolean;
  confidence: number;
  seconds: number;
}
/** Unanswered items reduce the exam score, but are not evidence of retrieval. */
export function finalizeSession(
  p: Progress,
  id: string,
  mode: string,
  questions: Question[],
  answers: SubmittedAnswer[],
  seconds: number,
  at = Date.now(),
): Progress {
  if (p.sessions.some((s) => s.id === id)) return p;
  const unique = answers.filter(
    (a, i) =>
      questions.some((q) => q.id === a.q.id) &&
      answers.findIndex((b) => b.q.id === a.q.id) === i,
  );
  const next = { ...p, memory: { ...p.memory }, attempts: [...p.attempts] };
  if (mode === "Mock Examination")
    for (const a of unique) {
      const q = a.q;
      const u = updateMemory(
        next.memory[q.conceptId],
        a.correct,
        a.confidence,
        q.difficulty,
        q.type,
        at,
      );
      next.memory[q.conceptId] = u.memory;
      next.attempts.push({
        id: id + "-" + q.id,
        questionId: q.id,
        conceptId: q.conceptId,
        topicId: q.topicId,
        at,
        correct: a.correct,
        confidence: a.confidence,
        difficulty: q.difficulty,
        format: q.type,
        seconds: a.seconds,
        xp: u.xp,
        error: a.correct
          ? ""
          : a.confidence === 3
            ? "Confident misconception"
            : a.confidence === 0
              ? "Guess"
              : "Concept not understood",
        mode,
      });
    }
  return {
    ...next,
    sessions: [
      ...p.sessions,
      {
        id,
        mode,
        at,
        total: questions.length,
        correct: unique.filter((a) => a.correct).length,
        seconds,
      },
    ],
  };
}
