# CFA Atlas — a local-first 2026 Level I learning workspace

A working React + TypeScript app with a complete curriculum map, a 365-outcome study-note crosswalk and ten interactive topic mind maps, an **expanded original learning bank**, confidence-aware spaced recall, quizzes, formulas, adaptive sessions, calculator training and portable local progress.

**Platform functionality and curriculum completeness are different.** All ten topics, 93 official learning modules, 152 study-note teaching units and 365 extracted learning outcomes are represented. The 99 deep foundation cards do not yet give every outcome a unique full-length lesson or question set. Read `docs/CONTENT-COVERAGE.md` and the module-by-module audit before relying on coverage. No software can guarantee an exam pass.

## Run on your PC

If the PC has never been used for development, install only **Node.js 22 LTS or Node 24 LTS** from [nodejs.org](https://nodejs.org/) and a modern browser such as Chrome, Edge or Firefox. npm is included with Node.js. Git, Python, VS Code and a paid API are **not required** merely to run the downloaded ZIP. Restart the terminal after installing Node, then confirm `node --version` and `npm --version` work. (Python 3 is needed only by maintainers rebuilding source-derived data.) Tested here on Node 24.19.0 / npm 11.9.0.

1. Extract the ZIP. Open a terminal **inside `cfa-atlas`**, the folder containing `package.json`.
2. Install and start:

```sh
npm install
npm run dev
```

3. Open **http://localhost:4173** in your browser. Leave the terminal running while you study. Press Ctrl+C to stop.

No account, API key, subscription or AI service is needed. Initial npm installation needs internet access. After that, all content and functionality run locally. Use the **same address and port** each time; browser data belongs to that origin. If port 4173 is occupied, close the other process or use `npm run dev -- --port 4174` and import your progress backup at the new origin.

For a production build:

```sh
npm run build
npm run preview
```

Open the same localhost address after stopping the development server. Do not double-click `dist/index.html`: module loading and JSON retrieval require a local HTTP server. Built assets are also included in `dist/` in the ZIP.

## First session

- Enter name, exam date, attempt, weekly hours and session length; optionally add completion date and subject confidence.
- Start Today's Quest, or browse Curriculum → Topic → Module → Concept.
- Read the explanation and original worked example, then answer a question and declare confidence before checking.
- For Quick Recall and Formula Forge, type your answer first, reveal the comparison, and honestly self-assess.
- Return to Memory Rescue when reviews are due. Incorrect high-confidence answers remain flagged until a delayed successful correction.
- Export a backup from Settings after important sessions.

The optional demo is visibly labeled and separate from real persisted progress. Normal mode begins at zero.

## Included features

- Responsive desktop/mobile layouts; dark/light themes; keyboard-accessible native controls.
- Onboarding and editable study profile, countdown and first-pass pacing estimate.
- All ten topics, 93 learning modules, one reference supplement and source-section maps.
- Four SchweserNotes books audited (1,174 pages): 152 teaching units and 365 distinct learning outcomes cross-mapped to the official curriculum.
- Ten interactive topic mind maps with searchable Topic → official module → teaching unit → outcome branches; each outcome opens a beginner route, source trace, formula helper and targeted module practice.
- A dedicated Learn from Zero academy with beginner topic primers and structured briefings for all 93 learning modules.
- 99 foundation concept lessons, 26 formula cards, 620 MCQs, 99 recall prompts and 26 formula-reconstruction prompts (745 total retrieval records).
- A visually faithful BA II Plus lab with the complete 44-key face, yellow second-function labels and 12 key-by-key drills covering setup, TVM, timing, cash flows, NPV/IRR, statistics, rate conversion, bond orientation and amortization.
- Learn, Practice, Mixed Practice, Quick Recall, Daily Quest, Memory Rescue, Weakness Hunt, Error Repair, Formula Forge, Ethics Court, Boss Battle and timed Mock Examination.
- Memory states, confidence-sensitive updates, scheduled review, gradual decay and misconception repair.
- XP, levels, local-calendar streaks, ten achievements, card/module/topic mastery milestones and personal bests.
- Topic/module/concept performance, confidence calibration, difficulty accuracy, error categories, session history, study time and seven-day XP activity.
- IndexedDB persistence and validated JSON backup/import with replacement confirmation.

## Architecture

```text
src/main.tsx                 React screens and navigation (hash routes)
src/styles.css              Shared design tokens, themes and responsive styles
src/types.ts                Content, profile, memory and history types
src/engine/memory.ts         Recall updates, decay, states, review timing and XP
src/engine/learning.ts       Recommendations, readiness, statistics and achievements
src/engine/storage.ts        IndexedDB transactions, backup validation and serialization
src/engine/session.ts        Idempotent mock scoring and finalization
src/engine/webmcp.ts         Optional read-only browser tool (feature-detected)
src/data/curriculum.json     Source-derived topic/module/section map
src/data/catalog.json        Lightweight concept index without answer payloads
src/data/content.ts          Lazy loading, one content chunk per topic
public/content/v1..v10.json  Teaching, questions, formulas and references
src/data/beginner.ts         Beginner topic/module teaching scaffolds
src/data/calculator.ts       BA II Plus drills and official source links
src/data/schweser-map.json   Metadata-only 4-book teaching-unit/outcome crosswalk
src/data/knowledge.ts        Knowledge graph lookup and beginner learning method
scripts/                    Reproducible authoring/extraction helpers and coverage audit
tests/*.test.ts              26 engine, content, calculator and session regression tests
tests/browser/              Responsive browser QA harness (development only)
docs/                       Coverage, validation and technical notes
```

No backend is required: the browser is the application runtime and IndexedDB is its database. Source PDFs are not uploaded by the app or bundled in the ZIP. Source references tell you which file and PDF page range to open separately.

The initial index and compact knowledge crosswalk are loaded with the UI. Detailed lessons and question answers are loaded lazily by topic. Mock exams and the formula library intentionally load all relevant topic chunks. The bank is designed for additional thousands of records; the UI currently keeps the full attempt history in memory, so very large histories will eventually benefit from indexed queries and aggregation.

## Memory and mastery

The algorithm is a transparent heuristic, **not a fitted or clinically validated retention model**.

- Strength is 0–100. Retention signal = strength × `0.9^(elapsedDays/stabilityDays)`.
- Correct answers gain strength based on declared confidence and question difficulty. Within 20 hours, repeat gains are quartered and XP is greatly reduced; after three total attempts on a concept, further immediate repeats earn no XP.
- Correct guesses are scheduled for one day; successful delayed recalls increase stability and future intervals, capped at 90 days.
- Incorrect answers lose strength, reset stability and are due again in ten minutes. High-confidence errors lose more strength and receive priority.
- A confident misconception clears only after a correct recall of at least medium confidence ≥20 hours later.
- **Mastered** requires strength ≥80, ≥4 distinct successful local calendar dates spanning ≥7 days, and ≥2 retrieval formats. Due concepts show Review due even if previously strong.
- Self-assessed recall counts as a format; honest self-assessment is essential. Repeated variants of one calculation remain one format.
- XP is awarded for correct retrieval, with delayed-recall and misconception-repair bonuses. Reading or clicking alone earns no XP.

No state locks access to material. The user can visit any module at any time.

## Recommendations and readiness

Daily Quest reserves around 30% of slots for unstudied concepts (15% within 30 days of the examination), then interleaves topic queues ordered by due state, misconceptions, weakness and repeated mistakes. Subject confidence nudges new-concept selection. Studied concepts can use recall/formula reconstruction in Daily Quest. Dedicated mode filters target the selected need. Exam date affects urgency and new/review balance; the simulator remains a user-selected activity.

Readiness = 15% coverage + 35% decayed strength + 25% recent difficulty-weighted accuracy + 15% spaced recall + 10% recent mock accuracy. Non-mock components are averaged across topics with **equal-topic fallback weights**. No official weights were invented. It describes only the authored bank and is **not a pass probability or complete exam-readiness estimate**. The interface displays the formula and limitations.

The completion projection uses modules with at least one introduced card, not full source mastery. Before enough observations exist it withholds a trajectory. Weekly pace divides remaining source modules by time to target; it is not a claim that all modules require equal effort.

## Add or edit content

For ordinary expansion, edit the relevant `public/content/vN.json` and add/update its lightweight record in `src/data/catalog.json`. Keep stable IDs: existing progress is keyed by concept ID. Every question needs a stable ID, original prompt, answer/explanation, type, difficulty, concept/module/topic IDs and source reference. MCQs have exactly three distinct choices with a zero-based answer index. Recall/formula records have no choices and use a comparison explanation. See `src/types.ts` for the complete schema. Run `npm run content:rebuild` only when deliberately regenerating the authored seed bank and deterministic variants; it requires Python 3 for maintainers, not for learners running the app.

To regenerate the bundled authored bank (this **overwrites direct JSON edits**), install Python 3.10+ and run:

```sh
python scripts/build_content.py
python scripts/expand_calculations.py
python scripts/expand_conceptual.py
npm run audit:content
```

The extraction helper additionally expects `pdftotext -layout` outputs from your own PDFs in a folder supplied as its argument. It is an optional developer operation and is not required to install or run the app. Do not redistribute full copyrighted text alongside the app.

The Schweser crosswalk can be regenerated from private text extractions with `python scripts/build_schweser_map.py PATH_TO_EXTRACTS`. It intentionally stores headings, outcome labels and page coordinates—not explanations, worked examples or proprietary question text. CFA Atlas teaching prose and practice are independently authored.

## Optional GitHub Pages hosting

Yes. The project includes `.github/workflows/pages.yml`. Create a GitHub repository, upload the project contents, open **Settings → Pages**, choose **GitHub Actions** as the source, and push to `main`. The workflow installs, tests, builds with the repository subpath and publishes `dist/`. GitHub Pages is public by default, so do not commit the original PDFs, exported progress backups or personal data. Browser progress remains local to that hosted address; export a JSON backup before changing the repository name or domain.

After a direct content edit:

```sh
npm run audit:content
npm test
npm run build
```

## Back up and restore

Settings → Export progress JSON downloads the profile, theme, memory records, attempts and completed sessions. On another browser/PC, run the app, open Settings, choose Import backup, inspect the attempt/session counts and confirm replacement. A valid import replaces, rather than merges, the current history. Invalid schema/data is rejected. Maximum input backup size is 25 MB. Keep backups private; they contain your name, exam date and study history. Use one active tab to study; multi-tab conflict resolution is not implemented.

## Calculator references

The BA II Plus lab was written against the official [Texas Instruments BA II Plus guidebook](https://education.ti.com/en/guidebook/details/en/ADF11FB65B284B6195B0A7E9502784BA/baiiplus), including calculator formats, persistent worksheets, TVM, cash-flow, bond, amortization, statistics and interest-conversion operations. Exam-day permission and permitted accessories follow the [CFA Institute calculator policy](https://www.cfainstitute.org/about/governance/policies/cfa-calculator-policy), updated 12 January 2026. CFA Institute authorizes the BA II Plus (including Professional) and HP 12C families; this app trains the BA II Plus family only.

## Tests

`npm test` runs pure engine and validation tests without an external service. `npm run audit:content` checks all module/question references and writes CSV/JSON coverage matrices. Browser testing is documented in `docs/QA-REPORT.md`, including any limitations. The source ZIP has no test user history.

## Known limitations / priorities

1. The platform and knowledge map are functional, but the deep content is still a **foundation bank**. All 365 outcomes are navigable and source-mapped; only 99 have dedicated full concept cards. Expand and independently review each outcome before using the app as a sole study source.
2. Formula Forge and Quick Recall use self-assessment; no AI or symbolic equivalence grader is included. Formula application uses MCQs.
3. Source references are module-level. Improve exact-page attribution and independent subject-matter review.
4. Mock sizing/timing are documented product assumptions; sampling is constrained by bank composition. No official blueprint verification, enforced break, backward navigation or sophisticated exam review flags.
5. An active session queue is not restored after reload. Answered practice attempts persist immediately; unsent mock answers do not persist until submission. Unanswered questions affect mock score but do not create retrieval or memory records. End/submit before closing. A browser unload warning is provided.
6. Study time counts visible question seconds (capped per item); it excludes reading time and cannot detect every kind of idle behavior. Analytics mix scored and honestly self-assessed recall.
7. Mastery is a heuristic; questions are not psychometrically calibrated. Numerical variants vary inputs, while structured depth variants change the retrieval operation but share their parent concept.
8. The BA II Plus lab is a guided keystroke trainer, not a complete electronic emulator. Physical practice on the exact calculator model remains essential.
9. Local browser data is not encrypted by the application. There is no cloud sync, installable PWA service worker or mobile native app.
10. Tests run on Linux/Chrome; direct Windows installation and other browsers have not been executed here.

Next priorities: LOS-level content expansion and expert verification; larger independent scenario bank; exact references; persistent/resumable mocks; empirically tuned scheduling and difficulty.

CFA® is a trademark of CFA Institute. This independent personal study companion is not affiliated with, sponsored by, or endorsed by CFA Institute.
