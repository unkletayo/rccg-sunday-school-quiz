# RCCG YAYA Sunday School — Comprehensive Question-Generation Prompt

## HOW TO USE THIS PROMPT

Paste the full text of one Sunday school lesson where indicated.
Run it in Claude to generate a thorough, drill-style question set for that week.

---

## PROMPT TEMPLATE

```
You are an expert RCCG Sunday School examiner.
Generate a comprehensive, well-drilled question set for the lesson below.
The student must demonstrate mastery of EVERY detail — not surface-level familiarity.

---

### LESSON CONTENT
{PASTE_FULL_LESSON_TEXT_HERE}

---

### PRE-GENERATION INVENTORY (MANDATORY — DO THIS FIRST)

Before writing a single question, scan the full lesson and produce this inventory.
Do NOT skip any item. If a field is absent from the lesson, write "none".

```
MEMORY VERSES:
  MV1: [full verse text] — [reference]
  MV2: [full verse text] — [reference]   ← list ALL, not just the first

LESSON OUTLINES / SUB-TOPICS:
  O1: [exact name as printed in lesson]
  O2: ...   ← every outline point, numbered

NAMED PERSONS / PLACES / FIGURES:
  N1: [name] — [role or context]
  N2: ...   ← biblical figures, authors, places, historical persons

ALL BIBLE REFERENCES (every citation in the lesson):
  R1: [Book Chapter:Verse]
  R2: ...   ← introduction + body + conclusion; exclude further-reading schedule
```

You will use this inventory as a checklist while generating. Every MV, O, N, and R must appear in at least one question. Mark each item as you cover it.

---

### YOUR TASK

Generate questions in the following SIX sections. Follow every rule precisely.

---

## SECTION 1 — LESSON IDENTITY & OVERVIEW
*(Multiple Choice + Fill in the Gap)*

Generate **8 questions** testing:
- The exact topic/title word-for-word, including any foreign-language terms
- The meaning of any Greek or Hebrew words used in the topic title
- The date of the lesson
- All the Bible passage reference (book, chapter, verses)
- The number of lesson outlines / sub-topics
- The overarching central idea of the lesson

**Multiple Choice (5 questions, A–D each):**
At least one wrong option per question must be a plausible distractor from nearby content.
`✔ Answer: [X]`
`📖 [One-sentence explanation citing the exact source]`

**Fill in the Gap (3 questions):**
Blank ONE critical word or phrase per sentence — never a filler word.
`✔ Answer: ___`
`📖 [Explanation]`

---

## SECTION 2 — EVERY MEMORY VERSE (DEEP DRILL)
*(Fill in the Gap + Location + Thematic)*

**CRITICAL: Repeat this entire section once per memory verse listed in the inventory.**
If the lesson has 2 memory verses, generate 2 full drill blocks (MV1 block + MV2 block).
Never collapse multiple memory verses into one block. Never skip a memory verse.

For EACH memory verse, generate **10 questions**:

**Fill in the Gap — Word-for-Word (5 questions):**
Present the verse with a DIFFERENT word blanked each time.
The student must supply the EXACT missing word — no paraphrase accepted.
Do NOT blank the same word twice.
Example: "But seek first the ________ of God…"  `✔ Answer: kingdom`

Rules:
- Blank theologically loaded words (nouns, verbs, key adjectives/adverbs)
- Never blank "the", "a", "and", "of", "to"
- Each blank must be from a different clause of the verse

**Location Quiz (3 questions):**
- "This memory verse is found in which book?" (A–D, wrong options = same-testament books)
- "What chapter is this memory verse from?" (A–D, wrong options = neighboring chapters ±1–3)
- "What verse number is it?" (A–D, wrong options = adjacent verse numbers, e.g. v.13, v.14, v.16)

**Thematic Connection (2 questions):**
- One question on what the verse commands or promises (A–D)
- "This memory verse connects to the lesson topic because ___." (A–D)

All: `✔ Answer: [X]` + `📖 [Explanation]`

---

## SECTION 3 — BIBLE PASSAGE (VERSE-BY-VERSE DRILL)
*(Multiple Choice + Fill in the Gap)*

Generate **12 questions** drilling the main Bible passage verse by verse.
Every lesson outline point (O1, O2, … from the inventory) must be named or referenced in at least one question in this section or Section 5. Mark outline points covered as you go.

Cover:
- Who is speaking and to whom
- Exact words, names, and attributes in each verse
- Order/sequence of items listed within the passage
- What each verse attributes to God (character, actions, authority)
- Each lesson outline sub-topic by its exact name

**Multiple Choice (7 questions, A–D):**
- At least 2 questions must test SEQUENCE or ORDER of content within the passage
- At least 1 question must use a nearby wrong verse number as a distractor
  (e.g. "This phrase appears in verse 12" when it is actually in verse 11)
- Wrong options must use real words from the passage placed incorrectly

**Fill in the Gap (5 questions):**
Use exact quotes from the passage with one key word/phrase blanked.
`✔ Answer: ___`
`📖 [Explanation with verse reference]`

---

## SECTION 4 — EVERY BIBLE REFERENCE IN THE LESSON (DEEP VERSE DRILL)
*(Multiple Choice + Fill in the Gap + True/False)*

Identify EVERY Bible reference cited anywhere in the lesson — introduction, lesson body,
conclusion, and further readings. Generate at least 2 questions per reference.
Minimum total: **25 questions**.

For EACH reference, apply the following drilling methods:

### Method A — State What Is There (Content MCQ)
"According to [Book Chapter:Verse], what does it say about [subject]?"
4 options (A–D). Wrong options must use real biblical language but from different contexts.
`✔ Answer: [X]`

### Method B — Where Is It Found (Location MCQ)
"Which Bible reference teaches that [concept from the verse]?"
Provide 4 verse references as options — only one is correct.
Wrong options must be from the same book or closely related books.
`✔ Answer: [X]`

### Method C — Fill in the Gap (Incomplete Verse)
Quote the verse with one significant word/phrase removed.
The student supplies the exact missing word.
Do NOT complete long verses — leave a phrase out from the middle or end.
Example: "Yours, O Lord, is the greatness, The power and the glory, The victory and the ________"
`✔ Answer: majesty`

### Method D — True or False (Altered Verse)
State the verse — but in some questions, ALTER one key word to make it FALSE.
Rules:
- At least 40% of True/False statements must be FALSE
- False statements must alter a theologically significant word, not just punctuation
- Never make it obviously wrong — the alteration must be subtle
Example (FALSE): "John 18:36 says Jesus declared His kingdom WAS of this world."
`✔ True / ✔ False`
`📖 [Exact correction if False]`

### Method E — "Which is NOT cited?" (Reference Elimination)
"Which of the following references is NOT found in this lesson?"
4 options — 3 are real lesson references, 1 is not.
`✔ Answer: [X]`

### Method F — Exact Verse Identification (Confusing Distractors)
Give a direct quote from a verse. The student must identify the EXACT reference.
All 4 options must be from the SAME chapter — adjacent verse numbers only.
Example: "Identify the exact verse: 'For God so loved the world that He gave His only begotten Son…'"
  A) John 3:14   B) John 3:15   C) John 3:16   D) John 3:17
`✔ Answer: C`
`📖 [Explanation confirming exact verse]`

Rules for Method F:
- Wrong options must be real verses from that chapter (not invented), so the student cannot eliminate by checking if a verse exists
- The quote must be a distinctive phrase, not a generic phrase common across verses
- At least one wrong option must sound thematically similar to the correct verse
- Use this method for the most important/quoted verses in the lesson — minimum 6 Method F questions

**Distribution target:**
- Method A: ~8 questions (one per major reference)
- Method B: ~6 questions
- Method C: ~6 questions (incomplete verses)
- Method D: ~8 questions (True/False)
- Method E: ~3 questions
- Method F: ~6 questions (exact verse ID, confusing same-chapter distractors)

All: `✔ Answer` + `📖 Explanation`

---

## SECTION 5 — LESSON CONTENT & THEOLOGY
*(Multiple Choice + Fill in the Gap + Best Explanation)*

Generate **15 questions** covering every doctrinal point and definition in the lesson.

**NAMES COVERAGE MANDATE:** Every named person, place, or biblical figure from the inventory (N1, N2, …) must be tested in at least one question in this section. If uncovered after 15 questions, add extra questions until all names are covered — do not leave any named entity untested.

**OUTLINE COVERAGE MANDATE:** Every lesson outline point (O1, O2, …) not yet covered in Section 3 must be named explicitly in at least one question here.

Cover:
- Definitions of all key terms (theological, Greek, Hebrew, doctrinal)
- Exact names of all lesson outline points / sub-topics — students must recall the precise names, not just the concepts
- What each sub-topic/outline teaches — in detail
- Every named biblical figure, place, author, or historical person in the lesson
- Cause-and-effect: what leads to what (e.g. repentance → kingdom entry)
- Commands, warnings, and promises given in the lesson
- How the lesson connects to salvation, repentance, or Christian living

**Multiple Choice (8 questions, A–D):**
At least 2 questions must use wrong options that contain real lesson terms placed in the WRONG context,
so the student cannot guess from familiarity alone.

**Fill in the Gap (5 questions):**
Blank sub-topic names, theological definitions, key doctrinal phrases, or named persons/places.

**Best Explanation (2 questions):**
4 brief-paragraph options. The student selects the BEST and most complete explanation.
Example: "Why does the lesson say repentance is necessary to enter the kingdom? Choose the BEST answer."

All: `✔ Answer` + `📖 Explanation`

---

## SECTION 6 — CROSS-WEEK IDENTIFICATION
*(Multiple Choice — Topics, Dates, AND Memory Verses across weeks)*

Generate **20 questions** spanning all lessons provided. Every lesson's topic AND memory verse must appear in at least one question.

### Sub-type A — Topic ↔ Date / Lesson Number (6 questions)
"The topic 'THEOS BASILEIA' belongs to which lesson number?"
"Lesson One was taught on which date?"
Wrong options: real lesson numbers or dates from the same series.

### Sub-type B — Memory Verse Reference Cross-Quiz (8 questions)
Test whether the student knows WHICH verse reference belongs to WHICH lesson.
Options are actual verse references (book chapter:verse), not verse text.

Question forms:
- "What is the memory verse reference for Lesson [X]?"
  A) Matthew 6:33   B) John 10:38   C) 1 John 5:20   D) Romans 8:8
- "Which lesson uses [Book Chapter:Verse] as its memory verse?"
  A) Lesson 1   B) Lesson 2   C) Lesson 3   D) Lesson 4

Rules:
- All 4 options must be REAL memory verse references from lessons in the provided series — never invented
- Wrong options must be from the same general genre (e.g. if correct is NT epistle, wrong options are also NT epistles)
- Cover as many different lessons as possible across the 8 questions — do not repeat the same lesson twice as the correct answer

### Sub-type C — Memory Verse Text → Lesson (6 questions)
Give the first phrase of a memory verse. Student identifies which lesson it belongs to.
Example: "The memory verse beginning 'But seek first the kingdom of God…' belongs to which lesson?"
  A) Lesson 1   B) Lesson 2   C) Lesson 3   D) Lesson 4
Wrong options: lessons whose memory verses begin with similarly structured phrases.

**Total Section 6: 20 questions**
When only one lesson is provided, generate hypothetical options using the single known lesson as the correct answer and plausible invented alternatives for wrong answers. When multiple lessons are provided, always use real cross-lesson references.

`✔ Answer: [X]` + `📖 Explanation citing the exact lesson and reference`

---

## OUTPUT FORMAT — EVERY QUESTION MUST FOLLOW THIS STRUCTURE

```
Q[N]. [Question text]

A) ...
B) ...
C) ...
D) ...

✔ Answer: [X]
📖 [One-sentence explanation referencing exact lesson text or Bible verse]
```

For Fill in the Gap:
```
Q[N]. Complete the following: "[quote with ________ for the blank]"

✔ Answer: [exact word or phrase]
📖 [Explanation]
```

For True/False:
```
Q[N]. True or False: "[statement]"

✔ True  /  ✔ False
📖 [If False: state the correct version]
```

---

## QUALITY RULES — NON-NEGOTIABLE

1. **No give-away questions.** Every question requires actual knowledge of the content.
2. **Wrong answers must be plausible** — real biblical terms or real lesson content in wrong positions.
3. **Bible verse questions must test exact wording**, not general themes.
4. **Memory verse questions test word-for-word recall**, not paraphrase.
5. **Fill-in-gap blanks must be content words** — nouns, verbs, key adjectives only.
6. **At least 40% of True/False statements must be FALSE** — never all-true sets.
7. **Zero fact repetition across all sections.** Before writing each question, ask: "Has any prior question already tested this exact fact, verse, name, or outline point?" If yes — skip it and find uncovered ground instead. Two questions may share a topic only if they test DIFFERENT facts about it.
8. **No questions about the Sunday School Hymn** — exclude entirely.
9. **No questions about the weekly further-reading schedule** — exclude entirely.
10. **Total question count must reach 90 or more** (higher floor due to multi-memory-verse, names, and Section 6 expansion).
11. **Every memory verse must be drilled** — if the lesson has 2 memory verses, Section 2 has 2 full 10-question blocks. Zero exceptions.
12. **Every lesson outline point must be named explicitly** in at least one question — not just implied. Students must recall exact outline names.
13. **Every named person, place, or biblical figure in the lesson must appear** in at least one question. Cross-check against inventory before finalizing output.
14. **Method F (exact verse ID) wrong options must be real verses** — look up neighboring verses; never invent a verse reference as a distractor.
15. **Section 6 memory verse reference options must be real references from the lesson series** — never invent a verse reference. If only one lesson is provided, use real Bible references the student would plausibly confuse; label invented options clearly as "(distractor)" in your answer explanation only.
16. **Exhaustive key-point coverage.** Every key point, definition, cause-effect statement, command, warning, and promise stated in the lesson body must be tested. If after generating all sections any key point remains uncovered, add questions at the end of the relevant section until all are covered. No lesson content left untouched.

---

## FINAL OUTPUT STRUCTURE

```
# [LESSON TOPIC] — Comprehensive Question Set
## Date: [DATE]  |  Lesson: [LESSON NUMBER]

---
### PRE-GENERATION INVENTORY
[memory verses / outlines / names / references — all listed before Q1]

---
### SECTION 1: LESSON IDENTITY & OVERVIEW  (8 questions)
[questions]

---
### SECTION 2: MEMORY VERSE — DEEP DRILL
#### MV1: [Reference]  (10 questions)
[questions]

#### MV2: [Reference]  (10 questions)   ← include only if lesson has a second memory verse
[questions]

---
### SECTION 3: BIBLE PASSAGE — VERSE BY VERSE  (12 questions)
[questions]

---
### SECTION 4: EVERY BIBLE REFERENCE IN THE LESSON  (31+ questions)
[questions — Methods A–F, every reference covered]

---
### SECTION 5: LESSON CONTENT & THEOLOGY  (15+ questions)
[questions — all outline points named, all named persons covered]

---
### SECTION 6: CROSS-WEEK IDENTIFICATION  (20 questions — topics + memory verse references)
[questions]

---
### COVERAGE CHECKLIST
Memory verses covered: MV1 ✔  MV2 ✔  …
Outline points covered: O1 ✔  O2 ✔  …
Named persons/places covered: N1 ✔  N2 ✔  …
Bible references covered: R1 ✔  R2 ✔  …
Total questions: [N]

---
### ANSWER KEY SUMMARY
Q1=A  Q2=C  Q3=B  ...  (grouped by section)
```

Begin generating. No preamble. No meta-commentary. Start directly with the PRE-GENERATION INVENTORY, then SECTION 1.
```

---

## USAGE NOTES

### Run once per lesson file:
Feed the full `.md` content of each scraped lesson into `{PASTE_FULL_LESSON_TEXT_HERE}`.

### For cross-week Section 6 (full power):
After scraping all lessons, build a topics list by running:

```bash
python3 - << 'EOF'
import os, re

lessons_dir = "sunday_school_lessons"
lines = []
for fname in sorted(os.listdir(lessons_dir)):
    if fname.endswith(".md") and fname != "INDEX.md":
        date = fname.replace(".md", "")
        with open(os.path.join(lessons_dir, fname)) as f:
            content = f.read()
        topic  = re.search(r"### TOPIC:\s*(.+)", content)
        lesson = re.search(r"## LESSON\s+(\w+)", content)
        if topic and lesson:
            lines.append(f"{date} | Lesson {lesson.group(1)} | {topic.group(1).strip()}")

with open("all_topics.txt", "w") as f:
    f.write("\n".join(lines))
print("Saved to all_topics.txt")
EOF
```

Then paste `all_topics.txt` alongside the lesson content so Section 6 can draw from ALL weeks.

### To print as an exam paper:
After generating, ask Claude:
> "Now reformat the above as a clean numbered exam paper with no answers visible, then print the answer key separately."

---

*RCCG YAYA Sunday School — 2025/2026 Session*