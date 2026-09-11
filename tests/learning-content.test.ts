import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { beginnerBrief } from "../src/data/beginner.ts";
import { calculatorChecklist, calculatorDrills, calculatorSources } from "../src/data/calculator.ts";

const topics = JSON.parse(fs.readFileSync("src/data/curriculum.json", "utf8"));

test("every learning module produces a usable beginner briefing", () => {
  const modules = topics.flatMap((t: any) =>
    t.modules.filter((m: any) => !m.supplement).map((m: any) => ({ t, m })),
  );
  assert.equal(modules.length, 93);
  for (const { t, m } of modules) {
    const brief = beginnerBrief(t, m);
    assert.ok(brief.mentalModel.length > 120, m.id);
    assert.ok(brief.beforeYouStart.length >= 3, m.id);
    assert.ok(brief.vocabulary.length >= 3, m.id);
    assert.ok(brief.outcomes.length >= 1, m.id);
    assert.equal(brief.studyOrder.length, 5, m.id);
  }
});

test("calculator lab has complete, internally aligned key drills", () => {
  assert.ok(calculatorDrills.length >= 12);
  assert.equal(new Set(calculatorDrills.map((d) => d.id)).size, calculatorDrills.length);
  for (const d of calculatorDrills) {
    assert.ok(d.keys.length >= 2, d.id);
    assert.equal(d.keys.length, d.display.length, d.id);
    assert.ok(d.answer && d.why && d.trap, d.id);
  }
  assert.ok(calculatorChecklist.length >= 5);
  assert.match(calculatorSources.guide, /^https:\/\/education\.ti\.com\//);
  assert.match(calculatorSources.policy, /^https:\/\/www\.cfainstitute\.org\//);
});

test("expanded bank contains multiple cognitive formats per concept", () => {
  const concepts = Array.from({ length: 10 }, (_, i) =>
    JSON.parse(fs.readFileSync(`public/content/v${i + 1}.json`, "utf8")),
  ).flat();
  const required = ["conceptual", "error-repair", "application", "interpretation"];
  for (const c of concepts) {
    const formats = new Set(c.questions.map((q: any) => q.type));
    for (const type of required) assert.ok(formats.has(type), `${c.id}: ${type}`);
  }
});
