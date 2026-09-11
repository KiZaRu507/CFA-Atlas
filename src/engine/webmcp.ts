import type { Progress } from "../types";
import { readiness } from "./learning";
import { catalog } from "../data/content";
interface ModelContext {
  registerTool(
    tool: {
      name: string;
      description: string;
      inputSchema: object;
      annotations: object;
      execute: (input: unknown) => unknown;
    },
    options: { signal: AbortSignal },
  ): void | Promise<void>;
}
export function registerStudyTools(p: Progress) {
  const context = (document as Document & { modelContext?: ModelContext })
    .modelContext;
  if (!context) return;
  const lifecycle = new AbortController();
  try {
    Promise.resolve(
      context.registerTool(
        {
          name: "read_study_progress",
          description:
            "Read the visible CFA Atlas readiness components and attempt count. No history changes.",
          inputSchema: {
            type: "object",
            properties: {},
            additionalProperties: false,
          },
          annotations: { readOnlyHint: true },
          execute(input) {
            if (
              !input ||
              typeof input !== "object" ||
              Object.keys(input).length
            )
              throw Error("Expected an empty object.");
            return {
              readiness: readiness(p, catalog),
              attempts: p.attempts.length,
              scope: "Authored bank only; not a pass probability",
            };
          },
        },
        { signal: lifecycle.signal },
      ),
    ).catch(() => {});
  } catch {
    /* Optional browser capability. */
  }
  return () => lifecycle.abort();
}
