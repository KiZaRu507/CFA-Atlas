export interface Source {
  file: string;
  pdfPage: number;
  endPdfPage: number;
  section: string;
}
export interface Concept {
  id: string;
  moduleId: string;
  topicId: string;
  name: string;
  objective: string;
  explanation: string;
  why: string;
  definition: string;
  example: string;
  trap: string;
  mnemonic: string;
  recall: string;
  recallAnswer: string;
  source: Source;
  formula?: Formula;
  questions: Question[];
}

export interface BeginnerBrief {
  mentalModel: string;
  beforeYouStart: string[];
  outcomes: string[];
  vocabulary: { term: string; plain: string }[];
  studyOrder: string[];
}

export interface CalculatorDrill {
  id: string;
  title: string;
  purpose: string;
  problem: string;
  keys: string[];
  display: string[];
  answer: string;
  why: string;
  trap: string;
  level: "Foundation" | "Core CFA" | "Exam ready";
}
export interface LearningObjective {
  id: string;
  code: string;
  text: string;
  book: number;
  pdfPage: number;
}
export interface StudyModule {
  id: string;
  reading: number;
  part: number;
  title: string;
  topicId: string;
  moduleId: string;
  book: number;
  pdfPage: number;
  objectives: LearningObjective[];
}
export interface Formula {
  name: string;
  expression: string;
  variables: string;
  intuition: string;
  when: string;
  example: string;
  mistake: string;
  related: string[];
}
export interface Question {
  id: string;
  conceptId: string;
  topicId: string;
  moduleId: string;
  prompt: string;
  choices: string[];
  answer: number;
  explanation: string;
  distractors: string[];
  difficulty: 1 | 2 | 3;
  type: string;
  source: Source;
}
export interface Module {
  id: string;
  topicId: string;
  number: number;
  title: string;
  pdfPage: number;
  endPdfPage: number;
  printedPage?: number;
  supplement: boolean;
  sections: { title: string; pdfPage: number; printedPage: number }[];
}
export interface Topic {
  id: string;
  volume: number;
  title: string;
  color: string;
  file: string;
  pages: number;
  modules: Module[];
}
export interface Profile {
  name: string;
  examDate: string;
  attempt: number;
  hours: number;
  sessionMinutes: number;
  studied: boolean;
  completionDate: string;
  confidence: Record<string, number>;
}
export interface Memory {
  strength: number;
  stability: number;
  last: number;
  due: number;
  successDays: string[];
  formats: string[];
  attempts: number;
  correct: number;
  lapses: number;
  confidentWrong: boolean;
  seen: boolean;
}
export interface Attempt {
  id: string;
  questionId: string;
  conceptId: string;
  topicId: string;
  at: number;
  correct: boolean;
  confidence: number;
  difficulty: number;
  format: string;
  seconds: number;
  xp: number;
  error: string;
  mode: string;
}
export interface Session {
  id: string;
  mode: string;
  at: number;
  total: number;
  correct: number;
  seconds: number;
}
export interface Progress {
  version: 1;
  profile: Profile | null;
  memory: Record<string, Memory>;
  attempts: Attempt[];
  sessions: Session[];
  theme: "dark" | "light";
}
export interface Summary {
  id: string;
  name: string;
  moduleId: string;
  topicId: string;
  formula: boolean;
  questionIds: string[];
}
