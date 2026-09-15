import rawMap from "./schweser-map.json";
import { catalog, topics } from "./content";
import type { LearningObjective, StudyModule } from "../types";

export const studyModules = rawMap.modules as StudyModule[];
export const knowledgeMeta = rawMap.meta;
export const learningObjectives = studyModules.flatMap((studyModule) =>
  studyModule.objectives.map((objective) => ({ objective, studyModule })),
);

export function findObjective(id: string) {
  return learningObjectives.find((item) => item.objective.id === id);
}

export function modulesForTopic(topicId: string) {
  return studyModules.filter((item) => item.topicId === topicId);
}

export function objectiveGuide(text: string) {
  const lower = text.toLowerCase();
  const action = lower.includes("calculate")
    ? "calculate a result and explain what the number means"
    : lower.includes("compare") || lower.includes("contrast")
      ? "separate similar ideas using a side-by-side test"
      : lower.includes("interpret")
        ? "translate an output into an investment conclusion"
        : lower.includes("evaluate") || lower.includes("analyze")
          ? "use evidence to reach and defend a conclusion"
          : lower.includes("identify") || lower.includes("classify")
            ? "recognize the defining facts and classify the case"
            : "explain the idea, connect cause to effect, and apply it";
  return {
    mission: `Your exam job is to ${action}. Do not begin by memorizing isolated words: first name the decision, then identify the facts that change the answer.`,
    steps: [
      "Say the idea in ordinary language before using technical vocabulary.",
      "Draw a timeline, claim hierarchy, decision tree, or equation—whichever makes the relationship visible.",
      "Work one clean example and state why every input belongs where it does.",
      "Change one assumption and predict the direction before recalculating.",
      "Close the lesson and retrieve the rule, process, or formula unaided.",
    ],
  };
}

export function knowledgeStats(topicId: string) {
  const modules = modulesForTopic(topicId);
  return {
    studyModules: modules.length,
    objectives: modules.reduce((sum, item) => sum + item.objectives.length, 0),
    cards: catalog.filter((item) => item.topicId === topicId).length,
    officialModules: topics.find((item) => item.id === topicId)?.modules.filter((item) => !item.supplement).length || 0,
  };
}
