import rawTopics from "./curriculum.json";
import rawCatalog from "./catalog.json";
import type { Topic, Summary, Concept } from "../types";
export const topics = rawTopics as Topic[];
export const catalog = rawCatalog as Summary[];
const cache = new Map<string, Promise<Concept[]>>();
export function loadTopic(id: string) {
  if (!cache.has(id))
    cache.set(
      id,
      fetch(`${import.meta.env.BASE_URL}content/${id}.json`)
        .then((r) => {
          if (!r.ok)
            throw Error(
              "Could not load study content. Check the local server and retry.",
            );
          return r.json() as Promise<Concept[]>;
        })
        .catch((e) => {
          cache.delete(id);
          throw e;
        }),
    );
  return cache.get(id)!;
}
export async function loadConcepts(ids: string[]) {
  const wanted = new Set(ids);
  const ts = [
    ...new Set(catalog.filter((c) => wanted.has(c.id)).map((c) => c.topicId)),
  ];
  return (await Promise.all(ts.map(loadTopic)))
    .flat()
    .filter((c) => wanted.has(c.id));
}
