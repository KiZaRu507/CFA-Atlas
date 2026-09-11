"""Add original retrieval variations grounded only in each authored concept card.

The variants deliberately test a different cognitive operation: recognition,
misconception repair, application, and consequence. Running the script twice is
safe because prior `-depth` questions are replaced.
"""
import json
import pathlib


def first_sentence(text):
    for marker in [". ", "? ", "! "]:
        if marker in text:
            return text.split(marker, 1)[0] + marker.strip()
    return text


def rotate(items, seed):
    n = seed % len(items)
    return items[n:] + items[:n]


def add(c, suffix, prompt, correct, wrongs, explanation, difficulty, qtype, seed):
    choices = rotate([correct, *wrongs], seed)
    c["questions"].append({
        "id": f'{c["id"]}-depth{suffix}',
        "conceptId": c["id"],
        "topicId": c["topicId"],
        "moduleId": c["moduleId"],
        "prompt": prompt,
        "choices": choices,
        "answer": choices.index(correct),
        "explanation": explanation,
        "distractors": [
            "This is the best answer because it matches the concept and its decision use."
            if x == correct else
            "This statement reflects an overgeneralization, reversal, or the documented trap."
            for x in choices
        ],
        "difficulty": difficulty,
        "type": qtype,
        "source": c["source"],
    })


files = sorted(pathlib.Path("public/content").glob("v*.json"))
all_concepts = []
for file in files:
    concepts = json.loads(file.read_text())
    for index, c in enumerate(concepts):
        c["questions"] = [q for q in c["questions"] if "-depth" not in q["id"]]
        truth = first_sentence(c["explanation"])
        trap = c["trap"]
        why = first_sentence(c["why"])
        add(
            c, "1",
            f"Which statement most accurately describes {c['name'].lower()}?",
            truth,
            [trap, f"It is a fixed rule that produces the same conclusion regardless of facts, timing, or assumptions."],
            c["explanation"] + " The other choices either state the common trap or remove conditions that matter.",
            1, "conceptual", index,
        )
        add(
            c, "2",
            f"A candidate applies this rule: “{trap}” What is the best correction?",
            truth,
            [f"The rule is acceptable whenever the final number appears reasonable.", f"No correction is needed because exam questions do not test the underlying distinction."],
            f"The quoted statement is the trap. {c['explanation']}",
            2, "error-repair", index + 1,
        )
        add(
            c, "3",
            f"Consider this case: {c['example']} Which approach best protects the analysis from the main error?",
            f"Apply {c['name'].lower()} while checking the stated timing, units, assumptions, and direction.",
            [f"Use the shortcut that treats this as unconditional and ignore conflicting details.", trap],
            f"The case applies the concept directly. {c['why']} Watch for: {trap}",
            2, "application", index + 2,
        )
        add(
            c, "4",
            f"Why does {c['name'].lower()} matter to an analyst or candidate?",
            why,
            [f"It matters only because terminology must be memorized; it does not affect a decision.", f"It guarantees the investment outcome once calculated correctly."],
            c["why"] + " It informs analysis but does not guarantee an outcome.",
            2, "interpretation", index + 3,
        )
    file.write_text(json.dumps(concepts, ensure_ascii=False, indent=2))
    all_concepts.extend(concepts)

catalog = json.loads(pathlib.Path("src/data/catalog.json").read_text())
lookup = {c["id"]: c for c in all_concepts}
for item in catalog:
    item["questionIds"] = [q["id"] for q in lookup[item["id"]]["questions"]]
pathlib.Path("src/data/catalog.json").write_text(json.dumps(catalog, ensure_ascii=False, indent=2))

mcqs = sum(bool(q["choices"]) for c in all_concepts for q in c["questions"])
prompts = sum(len(c["questions"]) for c in all_concepts)
print(f"Expanded to {prompts} total questions/prompts; {mcqs} MCQs")
