import type { Progress } from "../types.ts";
import { freshProgress } from "./learning.ts";
export function validateProgress(value: unknown): Progress {
  if (!value || typeof value !== "object")
    throw Error("Backup must be a JSON object.");
  const p = value as Progress;
  if (
    p.version !== 1 ||
    !Array.isArray(p.attempts) ||
    !Array.isArray(p.sessions) ||
    !p.memory ||
    typeof p.memory !== "object" ||
    Array.isArray(p.memory) ||
    !["dark", "light"].includes(p.theme)
  )
    throw Error("This is not a supported CFA Atlas backup.");
  const finite = (x: unknown) =>
    typeof x === "number" && Number.isFinite(x) && x >= 0;
  if (
    p.profile &&
    (!/^\d{4}-\d{2}-\d{2}$/.test(p.profile.examDate) ||
      !Number.isFinite(Date.parse(p.profile.examDate)) ||
      !finite(p.profile.hours) ||
      p.profile.hours < 1 ||
      p.profile.hours > 100 ||
      !finite(p.profile.sessionMinutes) ||
      p.profile.sessionMinutes < 5 ||
      p.profile.sessionMinutes > 180 ||
      typeof p.profile.name !== "string" ||
      !p.profile.confidence ||
      typeof p.profile.confidence !== "object")
  )
    throw Error("Invalid study profile.");
  for (const m of Object.values(p.memory))
    if (
      !m ||
      ![
        m.strength,
        m.stability,
        m.last,
        m.due,
        m.attempts,
        m.correct,
        m.lapses,
      ].every(finite) ||
      m.strength > 100 ||
      m.correct > m.attempts ||
      !Array.isArray(m.successDays) ||
      !m.successDays.every(
        (d) => typeof d === "string" && /^\d{4}-\d{2}-\d{2}$/.test(d),
      ) ||
      !Array.isArray(m.formats) ||
      !m.formats.every((f) => typeof f === "string") ||
      typeof m.seen !== "boolean" ||
      typeof m.confidentWrong !== "boolean"
    )
      throw Error("Invalid memory record.");
  for (const a of p.attempts)
    if (
      !a ||
      typeof a.id !== "string" ||
      typeof a.conceptId !== "string" ||
      typeof a.questionId !== "string" ||
      typeof a.topicId !== "string" ||
      typeof a.correct !== "boolean" ||
      ![a.at, a.xp, a.seconds, a.confidence, a.difficulty].every(finite) ||
      a.confidence > 3 ||
      a.difficulty < 1 ||
      a.difficulty > 3 ||
      typeof a.error !== "string" ||
      typeof a.format !== "string" ||
      typeof a.mode !== "string"
    )
      throw Error("Invalid attempt record.");
  for (const s of p.sessions)
    if (
      !s ||
      typeof s.id !== "string" ||
      typeof s.mode !== "string" ||
      ![s.at, s.total, s.correct, s.seconds].every(finite) ||
      s.total < 1 ||
      s.correct > s.total
    )
      throw Error("Invalid session record.");
  return JSON.parse(JSON.stringify(p));
}
let dbPromise: Promise<IDBDatabase> | undefined;
function db() {
  return (dbPromise ||= new Promise((resolve, reject) => {
    const r = indexedDB.open("cfa-atlas", 1);
    r.onupgradeneeded = () => r.result.createObjectStore("state");
    r.onsuccess = () => resolve(r.result);
    r.onerror = () => reject(r.error);
  }));
}
export async function readProgress(): Promise<Progress> {
  const d = await db();
  return new Promise((resolve, reject) => {
    const r = d.transaction("state").objectStore("state").get("progress");
    r.onsuccess = () => {
      try {
        resolve(r.result ? validateProgress(r.result) : freshProgress());
      } catch (e) {
        reject(e);
      }
    };
    r.onerror = () => reject(r.error);
  });
}
export async function writeProgress(p: Progress) {
  const d = await db();
  return new Promise<void>((resolve, reject) => {
    const tx = d.transaction("state", "readwrite");
    tx.objectStore("state").put(p, "progress");
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
    tx.onabort = () => reject(tx.error);
  });
}
export function backup(p: Progress) {
  return JSON.stringify(p, null, 2);
}
