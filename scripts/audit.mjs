import fs from "node:fs";
import assert from "node:assert/strict";
const topics = JSON.parse(fs.readFileSync("src/data/curriculum.json"));
const catalog = JSON.parse(fs.readFileSync("src/data/catalog.json"));
const concepts = topics.flatMap((t) =>
  JSON.parse(fs.readFileSync(`public/content/${t.id}.json`)),
);
const qs = concepts.flatMap((c) => c.questions);
const ids = new Set();
const warnings = [];
const rows = [];
assert.equal(topics.length, 10);
assert.equal(
  topics.reduce((s, t) => s + t.pages, 0),
  3416,
);
for (const c of concepts) {
  assert(!ids.has(c.id), "Duplicate concept " + c.id);
  ids.add(c.id);
  assert(c.explanation && c.example && c.trap && c.source);
  assert(c.questions.length >= 2);
  const t = topics.find((t) => t.id === c.topicId);
  const m = t.modules.find((m) => m.id === c.moduleId);
  assert(m);
  assert(c.source.pdfPage >= 1 && c.source.endPdfPage <= t.pages);
  assert(c.source.pdfPage === m.pdfPage);
  assert(c.source.endPdfPage === m.endPdfPage);
  assert.deepEqual(
    catalog.find((x) => x.id === c.id).questionIds,
    c.questions.map((q) => q.id),
  );
}
const qids = new Set();
for (const q of qs) {
  assert(!qids.has(q.id), "Duplicate question " + q.id);
  qids.add(q.id);
  assert(q.prompt && q.explanation);
  assert([1, 2, 3].includes(q.difficulty));
  if (q.choices.length) {
    assert.equal(q.choices.length, 3);
    assert.equal(new Set(q.choices).size, 3);
    assert(q.answer >= 0 && q.answer < 3);
  } else assert(["recall", "formula"].includes(q.type));
}
for (const t of topics)
  for (const m of t.modules) {
    const cs = concepts.filter((c) => c.moduleId === m.id);
    const valid = m.sections.filter(
      (s) => s.pdfPage >= m.pdfPage && s.pdfPage <= m.endPdfPage,
    );
    if (valid.length !== m.sections.length)
      warnings.push(m.id + ": source section page outside module");
    if (!m.supplement) assert(cs.length > 0, "Missing module " + m.id);
    rows.push({
      topic: t.title,
      module: m.title,
      moduleId: m.id,
      sourceSections: m.sections.length,
      conceptCards: cs.length,
      mcqs: cs.flatMap((c) => c.questions).filter((q) => q.choices.length)
        .length,
      recallPrompts: cs
        .flatMap((c) => c.questions)
        .filter((q) => q.type === "recall").length,
      formulas: cs.filter((c) => c.formula).length,
      formulaPrompts: cs
        .flatMap((c) => c.questions)
        .filter((q) => q.type === "formula").length,
      source: t.file,
      pdfPages: `${m.pdfPage}-${m.endPdfPage}`,
      coverage: m.supplement
        ? "Reference supplement"
        : "Beginner briefing plus foundation lesson; exhaustive LOS authoring remains in progress",
    });
  }
const totals = {
  topics: 10,
  learningModules: rows.filter((r) => !r.coverage.startsWith("Reference"))
    .length,
  supplements: rows.filter((r) => r.coverage.startsWith("Reference")).length,
  pdfPages: 3416,
  sourceSectionHeadings: rows.reduce((s, r) => s + r.sourceSections, 0),
  conceptCards: concepts.length,
  mcqs: qs.filter((q) => q.choices.length).length,
  recallPrompts: qs.filter((q) => q.type === "recall").length,
  formulas: concepts.filter((c) => c.formula).length,
  formulaPrompts: qs.filter((q) => q.type === "formula").length,
  totalQuestionRecords: qs.length,
  warnings,
};
fs.mkdirSync("docs", { recursive: true });
const fields = Object.keys(rows[0]);
const esc = (x) => '"' + String(x).replaceAll('"', '""') + '"';
fs.writeFileSync(
  "docs/coverage-audit.csv",
  [
    fields.map(esc).join(","),
    ...rows.map((r) => fields.map((k) => esc(r[k])).join(",")),
  ].join("\n"),
);
fs.writeFileSync(
  "docs/coverage-audit.json",
  JSON.stringify({ totals, modules: rows }, null, 2),
);
console.log(JSON.stringify(totals, null, 2));
if (warnings.length) process.exitCode = 1;
