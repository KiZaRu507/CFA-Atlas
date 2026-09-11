import test from "node:test";
import assert from "node:assert/strict";
import {
  DAY,
  blankMemory,
  updateMemory,
  retention,
  state,
  dateKey,
} from "../src/engine/memory.ts";
import {
  freshProgress,
  streak,
  readiness,
  recommend,
  priority,
  score,
  achievements,
} from "../src/engine/learning.ts";
import { backup, validateProgress } from "../src/engine/storage.ts";
import type { Summary, Question, Attempt, Memory } from "../src/types.ts";
const now = new Date("2026-09-10T12:00:00").getTime();
const cs: Summary[] = Array.from({ length: 20 }, (_, i) => ({
  id: "c" + i,
  moduleId: "m" + i,
  topicId: "v" + ((i % 10) + 1),
  name: "Concept " + i,
  formula: i % 3 === 0,
  questionIds: ["q" + i],
}));
const attempt = (at: number, extra: Partial<Attempt> = {}): Attempt => ({
  id: Math.random().toString(),
  questionId: "q0",
  conceptId: "c0",
  topicId: "v1",
  at,
  correct: true,
  confidence: 3,
  difficulty: 2,
  format: "application",
  seconds: 60,
  xp: 20,
  error: "",
  mode: "Practice",
  ...extra,
});
test("single correct answer cannot master a concept", () => {
  const { memory: m } = updateMemory(undefined, true, 3, 3, "calculation", now);
  assert.notEqual(state(m, now), "Mastered");
  assert.equal(m.successDays.length, 1);
  assert.ok(m.strength <= 55);
});
test("same-day repetitions cannot bypass delayed mastery", () => {
  let m: Memory | undefined;
  for (let i = 0; i < 100; i++)
    m = updateMemory(
      m,
      true,
      3,
      3,
      i % 2 ? "calculation" : "recall",
      now + i * 1000,
    ).memory;
  assert.equal(m!.successDays.length, 1);
  assert.ok(m!.strength <= 55);
  assert.notEqual(state(m, now + 100000), "Mastered");
});
test("retrieval over time and formats can earn mastery", () => {
  let m: Memory | undefined;
  for (const d of [0, 2, 5, 9, 16, 24, 34, 45])
    m = updateMemory(
      m,
      true,
      3,
      3,
      d % 2 ? "recall" : "calculation",
      now + d * DAY,
    ).memory;
  assert.equal(state(m, now + 45 * DAY), "Mastered");
});
test("correct guessing earns less strength and XP", () => {
  const high = updateMemory(undefined, true, 3, 2, "application", now);
  const low = updateMemory(undefined, true, 0, 2, "application", now);
  assert.ok(high.memory.strength > low.memory.strength);
  assert.ok(high.xp > low.xp);
  assert.equal(low.memory.due, now + DAY);
});
test("confident error receives priority and ten-minute repair schedule", () => {
  const { memory } = updateMemory(undefined, false, 3, 2, "application", now);
  assert.equal(memory.confidentWrong, true);
  assert.equal(memory.due, now + 600000);
  const p = freshProgress();
  p.memory.c0 = memory;
  assert.ok(priority(p, cs[0], now) > priority(p, cs[1], now));
});
test("immediate correction does not clear a confident misconception", () => {
  const m = updateMemory(undefined, false, 3, 2, "application", now).memory;
  const immediate = updateMemory(
    m,
    true,
    3,
    2,
    "application",
    now + 60000,
  ).memory;
  assert.equal(immediate.confidentWrong, true);
  const delayed = updateMemory(
    immediate,
    true,
    3,
    2,
    "recall",
    now + 2 * DAY,
  ).memory;
  assert.equal(delayed.confidentWrong, false);
});
test("retention decays with elapsed time and stays bounded", () => {
  const m = updateMemory(undefined, true, 3, 2, "application", now).memory;
  assert.ok(retention(m, now + 10 * DAY) < retention(m, now));
  assert.ok(retention(m, now + 1000 * DAY) >= 0);
  assert.equal(state(m, m.due), "Review due");
});
test("scoring compares the actual answer index", () => {
  const q = { answer: 2 } as Question;
  assert.equal(score(q, 2), true);
  assert.equal(score(q, 0), false);
  assert.equal(score(q, 99), false);
});
test("XP discourages repeat-click farming", () => {
  const first = updateMemory(undefined, true, 3, 2, "application", now);
  const repeat = updateMemory(
    first.memory,
    true,
    3,
    2,
    "application",
    now + 1000,
  );
  const delayed = updateMemory(
    repeat.memory,
    true,
    3,
    2,
    "recall",
    now + 3 * DAY,
  );
  assert.ok(repeat.xp < first.xp);
  assert.ok(delayed.xp > repeat.xp);
  assert.equal(updateMemory(undefined, false, 3, 3, "x", now).xp, 0);
});
test("streak counts unique local dates and allows yesterday", () => {
  const p = freshProgress();
  p.attempts = [
    attempt(now),
    attempt(now - 1000),
    attempt(now - DAY),
    attempt(now - 2 * DAY),
  ];
  assert.equal(streak(p, now), 3);
  assert.equal(streak(p, now + DAY), 3);
  assert.equal(streak(p, now + 2 * DAY), 0);
});
test("readiness is zero when nothing is studied", () => {
  assert.equal(readiness(freshProgress(), cs, now).score, 0);
});
test("readiness exact component weighting and equal topic fallback", () => {
  const p = freshProgress();
  for (const c of cs) {
    p.memory[c.id] = {
      ...blankMemory(),
      strength: 100,
      stability: 30,
      last: now,
      due: now + DAY,
      successDays: [
        "2026-09-01",
        "2026-09-03",
        "2026-09-05",
        "2026-09-07",
        "2026-09-10",
      ],
      formats: ["x", "y"],
      attempts: 5,
      correct: 5,
      seen: true,
    };
    p.attempts.push(attempt(now, { conceptId: c.id, topicId: c.topicId }));
  }
  const r = readiness(p, cs, now);
  assert.equal(r.score, 90);
  p.sessions.push({
    id: "m",
    mode: "Mock Examination",
    at: now,
    total: 180,
    correct: 180,
    seconds: 5000,
  });
  assert.equal(readiness(p, cs, now).score, 100);
});
test("recommendation interleaves and returns unique eligible concepts", () => {
  const p = freshProgress();
  const selected = recommend(p, cs, "Daily Quest", 10, now);
  assert.equal(selected.length, 10);
  assert.equal(new Set(selected.map((c) => c.id)).size, 10);
  assert.ok(new Set(selected.map((c) => c.topicId)).size >= 7);
});
test("rescue excludes unstudied and not-yet-due healthy concepts", () => {
  const p = freshProgress();
  p.memory.c0 = updateMemory(undefined, true, 3, 2, "x", now - 5 * DAY).memory;
  p.memory.c1 = updateMemory(undefined, true, 3, 2, "x", now).memory;
  assert.deepEqual(
    recommend(p, cs, "Memory Rescue", 10, now).map((c) => c.id),
    ["c0"],
  );
});
test("weakness hunt and formula mode respect their filters", () => {
  const p = freshProgress();
  p.memory.c0 = updateMemory(undefined, false, 1, 2, "x", now).memory;
  assert.deepEqual(
    recommend(p, cs, "Weakness Hunt", 10, now).map((c) => c.id),
    ["c0"],
  );
  assert.ok(recommend(p, cs, "Formula Forge", 20, now).every((c) => c.formula));
});
test("backup roundtrip preserves history and rejects malformed data", () => {
  const p = freshProgress();
  p.attempts.push(attempt(now));
  p.memory.c0 = updateMemory(undefined, true, 3, 2, "x", now).memory;
  assert.deepEqual(validateProgress(JSON.parse(backup(p))), p);
  assert.throws(() => validateProgress({ version: 2 }));
  assert.throws(() =>
    validateProgress({ ...p, memory: { bad: { strength: NaN } } }),
  );
  assert.throws(() =>
    validateProgress({
      ...p,
      attempts: [{ ...p.attempts[0], confidence: 99 }],
    }),
  );
});
test("achievements start locked rather than fake prior history", () => {
  assert.ok(achievements(freshProgress(), cs).every((a) => !a.earned));
});
test("date key respects calendar dates", () => {
  assert.match(dateKey(now), /^\d{4}-\d{2}-\d{2}$/);
});
