import test from "node:test";
import assert from "node:assert/strict";
import { finalizeSession } from "../src/engine/session.ts";
import { freshProgress, readiness } from "../src/engine/learning.ts";
import type { Question, Summary } from "../src/types.ts";
const q = {
  id: "q1",
  conceptId: "c1",
  topicId: "v1",
  moduleId: "m1",
  prompt: "Test",
  choices: ["a", "b", "c"],
  answer: 0,
  explanation: "a",
  distractors: [],
  difficulty: 2,
  type: "application",
  source: { file: "v1.pdf", pdfPage: 1, endPdfPage: 2, section: "test" },
} as Question;
const cs = [
  {
    id: "c1",
    name: "One",
    moduleId: "m1",
    topicId: "v1",
    formula: false,
    questionIds: ["q1"],
  },
] as Summary[];
test("blank mock creates a score but no invented study coverage or memory", () => {
  const p = finalizeSession(
    freshProgress(),
    "s",
    "Mock Examination",
    [q],
    [],
    5,
    Date.now(),
  );
  assert.equal(p.sessions[0].correct, 0);
  assert.equal(p.sessions[0].total, 1);
  assert.equal(p.attempts.length, 0);
  assert.deepEqual(p.memory, {});
  assert.equal(readiness(p, cs).score, 0);
});
test("mock commits only answered questions and cannot double count submission", () => {
  const p = finalizeSession(
    freshProgress(),
    "s",
    "Mock Examination",
    [q, { ...q, id: "q2" }],
    [{ q, correct: true, confidence: 3, seconds: 20 }],
    30,
    Date.now(),
  );
  assert.equal(p.sessions[0].total, 2);
  assert.equal(p.sessions[0].correct, 1);
  assert.equal(p.attempts.length, 1);
  assert.equal(p.memory.c1.attempts, 1);
  assert.equal(finalizeSession(p, "s", "Mock Examination", [q], [], 0), p);
});
