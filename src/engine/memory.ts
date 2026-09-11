import type { Memory } from "../types.ts";
export const DAY = 86400000;
export function dateKey(at: number) {
  const d = new Date(at);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}
export function blankMemory(): Memory {
  return {
    strength: 0,
    stability: 1,
    last: 0,
    due: 0,
    successDays: [],
    formats: [],
    attempts: 0,
    correct: 0,
    lapses: 0,
    confidentWrong: false,
    seen: false,
  };
}
export function retention(m: Memory | undefined, now = Date.now()) {
  if (!m?.attempts) return 0;
  return Math.round(
    m.strength *
      Math.pow(0.9, Math.max(0, now - m.last) / DAY / Math.max(1, m.stability)),
  );
}
export function state(m: Memory | undefined, now = Date.now()) {
  if (!m?.seen) return "Not studied";
  if (!m.attempts) return "Introduced";
  if (m.due <= now) return "Review due";
  const r = retention(m, now);
  if (
    r >= 80 &&
    m.successDays.length >= 4 &&
    m.formats.length >= 2 &&
    m.successDays[m.successDays.length - 1] !== m.successDays[0] &&
    new Date(m.successDays.at(-1)!).getTime() -
      new Date(m.successDays[0]).getTime() >=
      7 * DAY
  )
    return "Mastered";
  if (r >= 65 && m.successDays.length >= 2) return "Strong";
  return r >= 35 ? "Practicing" : "Learning";
}
export function updateMemory(
  old: Memory | undefined,
  correct: boolean,
  confidence: number,
  difficulty: number,
  format: string,
  now = Date.now(),
): { memory: Memory; xp: number } {
  const m = {
    ...(old || blankMemory()),
    successDays: [...(old?.successDays || [])],
    formats: [...(old?.formats || [])],
  };
  const delayed = !!m.last && now - m.last >= 20 * 3600000;
  const today = dateKey(now);
  const newDay = !m.successDays.includes(today);
  const before = retention(m, now);
  const repaired = correct && m.confidentWrong && confidence >= 2 && delayed;
  if (correct) {
    if (newDay) m.successDays.push(today);
    if (!m.formats.includes(format)) m.formats.push(format);
    const gain =
      (5 + confidence * 2 + difficulty * 2) *
      (m.attempts && !delayed ? 0.25 : 1);
    m.strength = Math.min(
      m.successDays.length < 2 ? 55 : m.successDays.length < 4 ? 79 : 100,
      before + gain,
    );
    m.stability = delayed
      ? Math.min(90, m.stability * (1.5 + confidence * 0.2))
      : Math.max(m.stability, confidence === 0 ? 1 : 2);
    if (repaired) m.confidentWrong = false;
  } else {
    m.strength = Math.max(0, before - (confidence === 3 ? 22 : 14));
    m.stability = 1;
    m.lapses++;
    if (confidence === 3) m.confidentWrong = true;
  }
  m.attempts++;
  m.correct += Number(correct);
  m.seen = true;
  m.last = now;
  m.due =
    now + (correct ? (confidence === 0 ? 1 : m.stability) * DAY : 10 * 60000);
  const xp =
    correct && !(old && old.attempts >= 3 && !delayed)
      ? Math.round(
          (8 +
            difficulty * 4 +
            confidence * 2 +
            (delayed ? 12 : 0) +
            (repaired ? 20 : 0)) *
            (old?.last && !delayed ? 0.15 : 1),
        )
      : 0;
  return { memory: m, xp };
}
