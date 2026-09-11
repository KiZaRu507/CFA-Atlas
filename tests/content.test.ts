import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
const concepts = Array.from({ length: 10 }, (_, i) =>
  JSON.parse(fs.readFileSync(`public/content/v${i + 1}.json`, "utf8")),
).flat();
const check = (id: string, expected: number, percent = false) => {
  const q = concepts
    .flatMap((c: any) => c.questions)
    .find((q: any) => q.id === id);
  const answer = Number(
    q.choices[q.answer].replaceAll(",", "").replace("%", "").replace("×", ""),
  );
  assert.ok(
    Math.abs(answer - expected * (percent ? 100 : 1)) <= 0.011,
    `${id}: ${answer} vs ${expected}`,
  );
};
test("independent recomputation of representative numerical answers", () => {
  check("v1-m2-c1-calc3", 2100 / 1.06 ** 2);
  check("v1-m4-c1-calc2", (0.09 * 0.7) / (0.09 * 0.7 + 0.91 * 0.15), true);
  check("v3-m6-c1-calc3", 0.4 * 0.05 * 0.75 + 0.6 * 0.1, true);
  check("v4-m5-c1-calc4", 140 + 14 * 0.7 - 52);
  check("v6-m12-c1-calc2", -5 * 0.01 + 0.5 * 40 * 0.01 ** 2, true);
  check("v7-m9-c1-calc3", 13 + 96 - 100);
  check("v9-m2-c1-calc2", 0.03 + 1.1 * 0.05, true);
});
test("all ten topics have meaningful practice and every concept has source evidence", () => {
  for (let i = 1; i <= 10; i++) {
    const cs = concepts.filter((c: any) => c.topicId === `v${i}`);
    assert.ok(cs.length >= 5);
    assert.ok(
      cs.every(
        (c: any) =>
          c.source.file &&
          c.source.pdfPage > 0 &&
          c.questions.some((q: any) => q.choices.length === 3),
      ),
    );
  }
});
test("bank supports a 180-question mock without repeated question IDs", () => {
  const questions = concepts
    .flatMap((c: any) => c.questions)
    .filter((q: any) => q.choices.length);
  assert.ok(questions.length >= 180);
  assert.equal(new Set(questions.map((q: any) => q.id)).size, questions.length);
});
