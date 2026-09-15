# 2026 curriculum coverage and provenance

## Inspected source set
All ten user-supplied 2026 Level I PDF volumes were text-extracted and indexed: **3,416 PDF pages**. Module starts were located in the actual body, then matched with the contents pages. Wrapped titles and distinct Part I / Part II titles were handled explicitly. PDF page means the 1-based physical PDF page, not the printed folio.

All four supplied 2026 SchweserNotes books were then extracted and audited: **1,174 additional PDF pages**. Their finer sequence contains **152 teaching units and 365 distinct learning outcomes**. CFA Atlas cross-maps every teaching unit to one of the official 93 modules and exposes the result as ten searchable topic mind maps. The official CFA volumes remain the authority; the study notes are a secondary sequence and explanation aid.

The source structure contains **93 learning modules plus one quantitative-methods reference supplement (Appendices A–E)**. The map includes **1,689 contents-section headings**; these include introductions, subsections and examples, not 1,689 distinct learning outcomes or authored lessons.

No online curriculum was used to replace the supplied PDFs. Original source PDFs and full extracted textbook text are deliberately not included in the distributable project. Keep your supplied PDFs separately for private verification.

## What is complete
- Ten-topic navigation, all module names and their physical PDF ranges.
- A metadata-only Schweser crosswalk covering 4 books, 152 teaching units and 365 unique outcomes, with study-note book/PDF page traceability and an official-module destination for every branch.
- A responsive interactive mind map for each of the ten topics. Outcome nodes open a beginner mission, five-pass learning method, module foundations, formula helper, original deep lesson links and targeted module practice.
- Every learning module has at least one original teaching card, MCQ and active-recall prompt.
- Every authored card and question has a source filename and module page range.
- 99 original foundation lessons; 620 original three-option MCQs (base scenarios, numerical variants, recognition, misconception-repair, application, and interpretation); 99 self-assessed recall prompts; 26 formula cards with 26 formula reconstruction prompts.
- 745 question records total. Recall/formula prompts are **not** additional MCQs.
- All 93 learning modules include a beginner briefing with a topic mental model, assumed foundations, vocabulary translations, module outcomes derived from indexed section headings, and a recommended learning sequence.
- A 12-drill BA II Plus lab covers reset/clear discipline, format, TVM, END/BGN, interest conversion, NPV, IRR, one-variable statistics, weighted data, bond worksheet orientation, amortization, and an exam routine. It is based on the official TI guidebook and current CFA calculator policy.
- Selected formulas cover return compounding, PV, Bayes, portfolio variance, sampling, regression, FX, cash conversion, NPV, WACC, EPS, FCFF, DuPont, equity valuation, bond valuation, forward rates, duration, convexity, credit loss, coverage, options, carry, parity, binomial probability, real estate and CAPM.

## What remains incomplete
**The learning pathway now indexes all 365 study-note outcomes, but it is not a verbatim textbook replacement.** Each outcome has a navigable beginner scaffold and inherits its official module’s deep lessons, formulas and practice. Most modules still have one deeply authored foundation lesson rather than a unique full lesson for every outcome. Ethics guidance has seven separate scenario concepts. Some individual definitions, formulas, official examples, and edge cases still require further original authoring. A module with all authored lessons mastered does not mean every official outcome has been mastered.

The knowledge repository preserves concise outcome labels for navigation and traceability, while its teaching method, examples and questions are original. The per-card objective remains a paraphrase chosen for that card. The crosswalk verifies presence and destination, not that every outcome has received independent expert content certification.

Source references are **module-level**, not verified exact pages for every sentence or formula. Some module ranges include end-of-module problems, solutions or closing reference pages. Section-level page references in the map are more granular navigation aids.

The two machine-readable audit files (`coverage-audit.csv` and `.json`) give counts per module and flag every nonsupplement module as **selected concepts only**. Audit assertions catch missing module coverage, duplicate identifiers, invalid choices, missing references and out-of-range pages. They do not constitute expert CFA content certification.

## Original content checks
- Numeric variants calculate the correct answer programmatically, with assumptions in each prompt and explanations of common wrong paths.
- Every MCQ has three distinct answer choices and a valid answer index.
- Formulas use explicitly stated period/quote conventions (e.g. annual effective versus simple FX rates).
- Ethics questions are original scenarios rather than copies of source questions.
- No implication of CFA Institute endorsement, official pass probability, or official topic weighting is made.

## Examination simulation assumptions
The supplied book introductions do not specify an extractable official exam blueprint or numerical topic weights. The platform therefore uses an explicitly labeled **custom practice simulation**: up to 180 unique MCQs, 90 seconds per question, sequential presentation, and a midpoint notice after 90 questions. Those sizing/timing choices are product assumptions, not sourced claims about current CFA examination rules. There is no enforced official break policy or backward navigation. Equal-topic round-robin sampling consumes each topic's available bank before filling from remaining topics; final proportions consequently reflect unequal bank depth. It is not an official-weight mock. Unanswered items count as incorrect in the mock score upon submission/expiry, but do not count as retrievals or change concept memory.

## Expansion priorities
1. Give every one of the 365 mapped outcomes its own reviewed full concept lesson, worked example and targeted question set.
2. Add more independently authored numerical and vignette questions for modules where the four structured depth variants share one underlying concept.
3. Add remaining formulas, precise source pages and expert review metadata.
4. Introduce approved blueprint weights only when supplied or separately verified; support richer multi-session mock navigation.
5. Validate question difficulty empirically; current 1–3 labels are editorial estimates.
