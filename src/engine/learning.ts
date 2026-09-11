import type { Progress, Summary, Question, Attempt } from "../types.ts";
import { DAY, dateKey, retention, state } from "./memory.ts";
export const freshProgress = (): Progress => ({
  version: 1,
  profile: null,
  memory: {},
  attempts: [],
  sessions: [],
  theme: "dark",
});
export const score = (q: Question, index: number) => index === q.answer;
export function streak(p: Progress, now = Date.now()) {
  const days = new Set(p.attempts.map((a) => dateKey(a.at)));
  let d = new Date(now);
  if (!days.has(dateKey(+d))) d.setDate(d.getDate() - 1);
  let n = 0;
  while (days.has(dateKey(+d))) {
    n++;
    d.setDate(d.getDate() - 1);
  }
  return n;
}
export const accuracy = (a: Attempt[]) =>
  a.length
    ? Math.round((a.filter((x) => x.correct).length / a.length) * 100)
    : 0;
export function readiness(p: Progress, concepts: Summary[], now = Date.now()) {
  const topics = [...new Set(concepts.map((c) => c.topicId))];
  const mean = (nums: number[]) =>
    nums.reduce((a, b) => a + b, 0) / (nums.length || 1);
  const coverage = mean(
    topics.map((t) => {
      const cs = concepts.filter((c) => c.topicId === t);
      return mean(cs.map((c) => (p.memory[c.id]?.attempts ? 100 : 0)));
    }),
  );
  const mastery = mean(
    topics.map((t) =>
      mean(
        concepts
          .filter((c) => c.topicId === t)
          .map((c) => retention(p.memory[c.id], now)),
      ),
    ),
  );
  const performance = mean(
    topics.map((t) => {
      const a = p.attempts.filter((a) => a.topicId === t).slice(-50);
      return (
        (a.reduce((s, a) => s + (a.correct ? a.difficulty : 0), 0) /
          (a.reduce((s, a) => s + a.difficulty, 0) || 1)) *
        100
      );
    }),
  );
  const delayed = mean(
    topics.map((t) =>
      mean(
        concepts
          .filter((c) => c.topicId === t)
          .map((c) =>
            Math.min(
              100,
              Math.max(0, (p.memory[c.id]?.successDays.length || 0) - 1) * 25,
            ),
          ),
      ),
    ),
  );
  const mocks = p.sessions.filter((s) => s.mode === "Mock Examination");
  const mock = mean(mocks.slice(-3).map((s) => (s.correct / s.total) * 100));
  return {
    score: Math.round(
      0.15 * coverage +
        0.35 * mastery +
        0.25 * performance +
        0.15 * delayed +
        0.1 * mock,
    ),
    coverage,
    mastery,
    performance,
    delayed,
    mock,
  };
}
export function priority(p: Progress, c: Summary, now = Date.now()) {
  const m = p.memory[c.id];
  if (!m?.attempts)
    return 45 + (3 - (p.profile?.confidence[c.topicId] || 1)) * 5;
  return (
    (m.confidentWrong ? 100 : 0) +
    (m.due <= now ? 45 + Math.min(30, (now - m.due) / DAY) : 0) +
    (100 - retention(m, now)) * 0.4 +
    m.lapses * 3 -
    (now - m.last < 600000 ? 80 : 0)
  );
}
export function recommend(
  p: Progress,
  cs: Summary[],
  mode: string,
  limit = 10,
  now = Date.now(),
) {
  let pool = cs.filter((c) => {
    const m = p.memory[c.id];
    if (mode === "Memory Rescue")
      return !!m?.attempts && (m.due <= now || m.confidentWrong);
    if (mode === "Weakness Hunt")
      return !!m?.attempts && m.correct / m.attempts < 0.7;
    if (mode === "Error Repair")
      return p.attempts.some((a) => a.conceptId === c.id && !a.correct);
    if (mode === "Formula Forge") return c.formula;
    if (mode === "Ethics Court") return c.topicId === "v10";
    return true;
  });
  pool = [...pool].sort((a, b) => priority(p, b, now) - priority(p, a, now));
  const selected: Summary[] = [];
  const near = p.profile?.examDate
    ? new Date(p.profile.examDate).getTime() - now < 30 * DAY
    : false;
  if (mode === "Daily Quest") {
    const unstudied = pool.filter((c) => !p.memory[c.id]?.attempts);
    selected.push(
      ...unstudied.slice(
        0,
        Math.max(1, Math.round(limit * (near ? 0.15 : 0.3))),
      ),
    );
  }
  // Round-robin priority within topics gives genuine interleaving and cannot duplicate a concept.
  const queues = new Map<string, Summary[]>();
  pool
    .filter((c) => !selected.includes(c))
    .forEach((c) =>
      queues.set(c.topicId, [...(queues.get(c.topicId) || []), c]),
    );
  while (
    selected.length < limit &&
    [...queues.values()].some((q) => q.length)
  ) {
    for (const q of queues.values())
      if (q.length && selected.length < limit) selected.push(q.shift()!);
  }
  return selected.slice(0, limit);
}
export function topicStats(p: Progress, cs: Summary[], now = Date.now()) {
  const a = p.attempts.filter((a) => cs.some((c) => c.id === a.conceptId));
  return {
    mastery: Math.round(
      cs.reduce((s, c) => s + retention(p.memory[c.id], now), 0) /
        (cs.length || 1),
    ),
    mastered: cs.filter((c) => state(p.memory[c.id], now) === "Mastered")
      .length,
    due: cs.filter((c) => p.memory[c.id]?.attempts && p.memory[c.id].due <= now)
      .length,
    unseen: cs.filter((c) => !p.memory[c.id]?.seen).length,
    xp: a.reduce((s, a) => s + a.xp, 0),
    accuracy: accuracy(a),
    attempts: a.length,
    trend: accuracy(a.slice(-10)) - accuracy(a.slice(-20, -10)),
  };
}
export function achievements(p: Progress, cs: Summary[]) {
  return [
    {
      name: "First principles",
      description: "Complete your first retrieval.",
      earned: p.attempts.length > 0,
    },
    {
      name: "Formula Apprentice",
      description: "Answer 10 formula questions correctly.",
      earned:
        p.attempts.filter((a) => a.format === "formula" && a.correct).length >=
        10,
    },
    {
      name: "Ethics Investigator",
      description: "Resolve 10 ethics scenarios correctly.",
      earned:
        p.attempts.filter((a) => a.topicId === "v10" && a.correct).length >= 10,
    },
    {
      name: "Five-Day Streak",
      description: "Retrieve on five consecutive days.",
      earned: streak(p) >= 5,
    },
    {
      name: "Memory Rescue",
      description: "Complete a Memory Rescue session.",
      earned: p.sessions.some((s) => s.mode === "Memory Rescue"),
    },
    {
      name: "Confidently Correct",
      description: "Make 20 correct high-confidence recalls.",
      earned:
        p.attempts.filter((a) => a.correct && a.confidence === 3).length >= 20,
    },
    {
      name: "Deep roots",
      description: "Master a concept over time.",
      earned: cs.some((c) => state(p.memory[c.id]) === "Mastered"),
    },
    {
      name: "Fixed Income Navigator",
      description: "Complete a correct retrieval in every fixed-income module.",
      earned: cs
        .filter((c) => c.topicId === "v6")
        .every((c) => p.memory[c.id]?.correct > 0),
    },
    {
      name: "Comeback Kid",
      description: "Successfully revisit five previously missed concepts.",
      earned:
        cs.filter((c) => p.memory[c.id]?.lapses && p.memory[c.id]?.correct)
          .length >= 5,
    },
    {
      name: "Boss cleared",
      description: "Finish a Boss Battle with 80% accuracy.",
      earned: p.sessions.some(
        (s) => s.mode === "Boss Battle" && s.correct / s.total >= 0.8,
      ),
    },
  ];
}
