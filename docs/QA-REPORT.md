# Validation report

Validated during the build session, most recently updated on 15 September 2026.

## Automated checks

**32 tests pass, zero failures.** `npm test` runs Node's test runner against:
- `tests/engine.test.ts` (18 tests): bounded strength, delayed mastery, format diversity, confidence, misconceptions, decay, scoring, repeat-XP limits, local-calendar streaks, readiness arithmetic, recommendations, review eligibility, backups and achievements.
- `tests/content.test.ts` (3 tests): independent recomputation of representative numeric answers, topic/source coverage, and enough unique MCQs for a 180-question simulation.
- `tests/learning-content.test.ts` (3 tests): every module produces a complete beginner briefing, calculator sequences align with expected displays, and every concept has four additional cognitive question formats.
- `tests/knowledge.test.ts` (3 tests): 4-book/1,174-page crosswalk totals, coverage of every official module, 365 unique outcome IDs, source coordinates and valid curriculum destinations.
- `tests/games.test.ts` (3 tests): exactly ten unique topic/game/visual mappings, valid simulation domains and independently recomputed outputs for compounding, NPV, par bond pricing and option payoff.
- `tests/session.test.ts` (2 tests): unanswered items cannot create study progress, and session finalization cannot double count a submission.

**Production build passed** with TypeScript strict checking and Vite 7.1.3. Lesson/question data is split into ten topic files loaded on demand.

**Content audit passed with zero structural warnings:** 10 topics; 93 official learning modules; 1 reference supplement; 1,689 official section headings; 4 study-note books; 152 teaching units; 365 unique learning outcomes; 99 foundation lessons; 620 MCQs; 99 recall prompts; 26 formula prompts; 745 total retrieval records. Every study-note branch resolves to a valid official curriculum destination. Structural checks do not certify expert accuracy or a dedicated full lesson for every outcome.

## Browser flows exercised

| Flow | Result |
|---|---|
| First launch and profile creation | Passed; normal history starts at zero |
| Exam countdown and weekly pace | Passed after correcting native date-input submission |
| Dashboard, map, arena, review, formulas, mistakes, analytics, achievements, settings | All major routes rendered |
| Topic → module → concept → practice | Passed with source ranges and section metadata visible |
| Correct MCQ answer | Correct explanation, 22 XP and one-day streak observed |
| Wrong high-confidence MCQ | Confidently Wrong flag and Memory Rescue priority observed |
| Complete a one-question practice session | Result screen and completed-session record observed |
| Learn-from-zero pathway | All 10 topic primers and representative module briefing rendered |
| Knowledge mind maps | Passed: ten-topic selector, connected module/unit/outcome tree, search and clickable outcome route rendered; automated crosswalk integrity passed |
| Outcome lesson route | Passed: beginner mission, mental model, vocabulary, five-pass method, inherited lessons, formula helper, source trace and targeted practice rendered |
| BA II Plus guided drill | Reset sequence accepted key-by-key; completion explanation rendered |
| BA II Plus reference layout | 44 keys, nine-row geometry, secondary labels and two-row equals key rendered; 390 px frame measured with no horizontal overflow |
| Formula reconstruction | Typed answer → reveal → self-assessment → memory/XP update passed |
| Immediate misconception correction | Flag remains until delayed successful review |
| Progress persistence | Reload retained profile, score, XP, streak and memory record |
| JSON export | Downloaded file inspected; valid profile, one attempt and matching XP/memory |
| JSON import | File chooser accepted exported backup; counts shown before replacement; restored successfully |
| Mock startup | 180 unique items and 270-minute custom timer rendered |
| Mock answer lock | Correctness withheld until submission |
| Early mock submission | Unanswered items included as wrong in score; review explanations available |
| Blank mock after fix | 0/180 session recorded; demo attempt count stayed at 104 with unchanged XP |
| Demo isolation | Clear demo banner and separate unsaved example activity |
| Desktop layout | Visual screenshot inspected at approximately 1348px viewport |
| Mobile layout | 390px test frame; actual content width 375px with scrollWidth 375px, no horizontal overflow |
| Mobile knowledge graph and outcome lesson | Both rendered at 375px content width with scrollWidth 375px; drawer route and clickable outcome passed |
| Concept Arcade | Passed: all ten topic games rendered, topic switching and 365-outcome mission selector worked |
| Prediction simulation | Passed: prediction feedback, live control and calculated output rendered before campaign launch |
| Correct game move | Passed: combo and score increased, explanation rendered and shield count remained intact |
| High-confidence wrong game move | Passed: shield decreased, combo reset and Critical Misconception repair explanation rendered |
| Mobile game flow | Arcade and prediction lab rendered at 375px content width with scrollWidth 375px |
| Mobile navigation and formula library | Drawer navigation worked; formula page also had no horizontal overflow |

A download-event notification timed out in the test browser even though the JSON file downloaded successfully. The resulting file was directly inspected and reused for the successful browser import test. No production export error was observed.

## Defects found and fixed

1. Native date input could submit a valid DOM date without updating the React profile value in the test browser. Submission now reads and validates the actual named date field.
2. Session IDs assumed `crypto.randomUUID()` on all HTTP hosts. Added `crypto.getRandomValues()` UUID fallback for local non-secure preview hosts.
3. Blank mock answers were incorrectly creating learning records. They now reduce mock score without fabricating attempts, coverage or memory. A regression test covers this.
4. Repeated session finalization could risk double counting. The pure finalizer now checks session ID before committing.
5. Automatic persistence after a stored-record load failure could overwrite invalid data. Saving now pauses until a valid backup is explicitly restored.
6. Added an explicit mobile drawer close control, and removed an empty CSS import.

## Scope limits

- Browser testing covered representative user flows rather than clicking all 620 MCQs individually. Every question underwent structural validation; representative calculations were independently recomputed.
- Spaced-repetition behavior over days/weeks was tested using controlled timestamps, not waiting in real time. The full 270-minute exam timer was not allowed to expire in real time.
- Responsive checks used the development QA iframe at 390px and a desktop Chrome viewport, not physical mobile hardware. Cross-browser and Windows-native installation remain untested.
- Timed mock logic is a documented custom practice simulation, not verification of official exam rules or topic weights.
- Optional WebMCP capability is feature-detected and is not necessary for local operation; its validation result is noted below.
- No independent human CFA subject-matter review or exhaustive LOS-level certification has been performed. See `CONTENT-COVERAGE.md`.

Optional WebMCP validation: unavailable in this browser because `document.modelContext` is not exposed. The read-only tool is feature-detected; this does not affect any app feature.
