import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const topics = JSON.parse(fs.readFileSync("src/data/curriculum.json", "utf8"));
const knowledge = JSON.parse(fs.readFileSync("src/data/schweser-map.json", "utf8"));

test("study-note crosswalk covers every topic and official module", () => {
  assert.equal(knowledge.meta.books, 4);
  assert.equal(knowledge.meta.pages, 1174);
  assert.equal(knowledge.modules.length, 152);
  assert.equal(new Set(knowledge.modules.map((item: any) => item.topicId)).size, 10);
  for (const topic of topics) {
    for (const module of topic.modules.filter((item: any) => !item.supplement)) {
      assert(knowledge.modules.some((item: any) => item.moduleId === module.id), module.id);
    }
  }
});

test("365 learning outcomes have unique stable IDs and valid sources", () => {
  const objectives = knowledge.modules.flatMap((item: any) => item.objectives);
  assert.equal(objectives.length, 365);
  assert.equal(new Set(objectives.map((item: any) => item.id)).size, 365);
  for (const objective of objectives) {
    assert.match(objective.id, /^los-\d+-[a-z]$/);
    assert(objective.text.length > 12);
    assert(objective.book >= 1 && objective.book <= 4);
    assert(objective.pdfPage > 0);
  }
});

test("each crosswalk branch resolves to a valid curriculum destination", () => {
  for (const branch of knowledge.modules) {
    const topic = topics.find((item: any) => item.id === branch.topicId);
    assert(topic, branch.topicId);
    assert(topic.modules.some((item: any) => item.id === branch.moduleId), branch.moduleId);
  }
});
