"""Build a metadata-only Schweser crosswalk from locally extracted text.

The output intentionally stores headings and learning-objective labels only. It
does not reproduce explanatory prose, worked examples, or proprietary questions.
Teaching text in the app is original and links back to the official curriculum.
"""
import json
import pathlib
import re
import sys

ROOT = pathlib.Path(__file__).resolve().parents[1]
SOURCE = pathlib.Path(sys.argv[1]) if len(sys.argv) > 1 else ROOT.parent / "schweser-extract"
CURRICULUM = json.loads((ROOT / "src/data/curriculum.json").read_text())

RANGES = [
    (1, 11, "v1"), (12, 19, "v2"), (20, 26, "v3"),
    (27, 38, "v4"), (39, 46, "v5"), (47, 65, "v6"),
    (66, 75, "v7"), (76, 82, "v8"), (83, 88, "v9"),
    (89, 93, "v10"),
]


def topic_for(reading):
    for start, end, topic in RANGES:
        if start <= reading <= end:
            return topic, reading - start + 1
    raise ValueError(f"Unexpected reading {reading}")


records = []
for book in range(1, 5):
    path = SOURCE / f"book{book}.txt"
    pages = path.read_text(errors="ignore").split("\f")
    current = None
    for page_number, page in enumerate(pages, 1):
        lines = page.splitlines()
        i = 0
        while i < len(lines):
            stripped = lines[i].strip()
            module_match = re.match(r"MODULE\s+(\d+)\.(\d+):\s*(.+)", stripped)
            if module_match:
                reading = int(module_match.group(1))
                part = int(module_match.group(2))
                title_parts = [module_match.group(3).strip()]
                j = i + 1
                while j < len(lines) and not title_parts[-1].endswith((".", ":")):
                    nxt = lines[j].strip()
                    if not nxt or nxt.startswith("LOS ") or re.match(r"MODULE\s+\d", nxt):
                        break
                    if nxt.isupper() and len(nxt) < 90:
                        title_parts.append(nxt)
                        j += 1
                    else:
                        break
                topic_id, module_number = topic_for(reading)
                topic = next(t for t in CURRICULUM if t["id"] == topic_id)
                official = next(m for m in topic["modules"] if m["number"] == module_number and not m["supplement"])
                current = {
                    "id": f"sw-{reading}-{part}",
                    "reading": reading,
                    "part": part,
                    "title": " ".join(title_parts).replace("  ", " ").strip(" ."),
                    "topicId": topic_id,
                    "moduleId": official["id"],
                    "book": book,
                    "pdfPage": page_number,
                    "objectives": [],
                }
                records.append(current)
                i = j - 1
            los_match = re.match(r"LOS\s+(\d+)\.([a-z]):\s*(.+)", stripped)
            if los_match and current and int(los_match.group(1)) == current["reading"]:
                code = f"{los_match.group(1)}.{los_match.group(2)}"
                text_parts = [los_match.group(3).strip()]
                j = i + 1
                while j < len(lines) and not text_parts[-1].endswith("."):
                    nxt = lines[j].strip()
                    if not nxt or nxt.startswith(("LOS ", "MODULE ", "PROFESSOR'S NOTE")):
                        break
                    text_parts.append(nxt)
                    j += 1
                objective = " ".join(text_parts)
                objective = re.sub(r"\s+", " ", objective).strip()
                current["objectives"].append({
                    "id": f"los-{code.replace('.', '-')}",
                    "code": code,
                    "text": objective,
                    "book": book,
                    "pdfPage": page_number,
                })
                i = j - 1
            i += 1

# Repeated module headers can occur at page transitions. Merge them by stable id.
merged = {}
for record in records:
    if record["id"] not in merged:
        merged[record["id"]] = record
    else:
        seen = {x["id"] for x in merged[record["id"]]["objectives"]}
        merged[record["id"]]["objectives"].extend(x for x in record["objectives"] if x["id"] not in seen)

modules = list(merged.values())
# A LOS is repeated in end-of-reading summaries. Keep its first teaching-module
# occurrence so the crosswalk has one stable destination per objective.
seen_objectives = set()
for module in modules:
    unique = []
    for objective in module["objectives"]:
        if objective["id"] not in seen_objectives:
            seen_objectives.add(objective["id"])
            unique.append(objective)
    module["objectives"] = unique
objective_ids = [o["id"] for m in modules for o in m["objectives"]]
assert len(modules) == 152, len(modules)
assert len(set(objective_ids)) == len(objective_ids), "Duplicate LOS identifiers"
assert len(objective_ids) >= 330, len(objective_ids)

payload = {
    "meta": {
        "books": 4,
        "pages": 1174,
        "studyModules": len(modules),
        "learningObjectives": len(objective_ids),
        "notice": "Metadata crosswalk only; explanations and questions are original paraphrases.",
    },
    "modules": modules,
}
(ROOT / "src/data/schweser-map.json").write_text(json.dumps(payload, ensure_ascii=False, indent=2))
print(json.dumps(payload["meta"], indent=2))
