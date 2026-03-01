---
name: do-quick-task
description: 'Lightweight workflow for small, self-contained tasks: minor features, research/study, translation. Use when asked to "add this small feature", "research X", "explain how X works", "translate this", or any focused task that does not require large-scale planning.'
---

# Do Quick Task

A focused, low-overhead workflow for tasks that are small and self-contained. No heavy planning — just understand clearly, then act surgically.

## Task Types

| Type | Trigger phrases |
|------|----------------|
| **Small feature** | "add X", "implement Y", "make it do Z" |
| **Research / Study** | "how does X work", "research X", "explain X", "what is X" |

---

## Phase 0: Clarify (if ambiguous)

Before doing anything, ask ONE focused question if the request is unclear:

- **Scope**: What exactly is in/out of scope?
- **Context**: Which file, component, or system?
- **Expected outcome**: What does "done" look like?

> If the request is clear enough to act on, skip this phase entirely. Do NOT ask unnecessary questions.

---

## Phase 1: Understand

**For all task types:**
- Read the relevant files — identify the minimal set needed (do not read the entire codebase)
- Understand current behavior / existing content before changing anything
- State your understanding in 1–2 sentences before proceeding

---

## Phase 2: Act

### Small feature
1. Integrate into existing structure — do NOT replace working code
2. Follow the existing patterns, naming conventions, and style of the codebase
3. Only add what was requested — no extra features, no speculative edge-case handling
4. Prefer standard library / existing utilities over introducing new dependencies

### Research / Study
1. Use tools to find current, factual information (do not rely solely on internal knowledge for version-specific or time-sensitive topics)
2. Answer directly and concisely — explain the **why**, not just the what
3. Use a small concrete example only if it clarifies a concept that words alone cannot

---

## Phase 3: Verify

- Confirm the outcome matches what was requested
- For code changes: run the relevant tests or demonstrate the fix works
- For research: state what you found and flag any uncertainty

---

## Core Rules (always active)

These rules apply to all task types without exception:

1. **Surgical changes only** — alter the minimum amount of code needed; preserve everything else
2. **Explain the "why"** — briefly state the reasoning behind the approach
3. **Facts over memory** — use tools when information may be version-dependent or time-sensitive
4. **No unsolicited cleanup** — do not refactor, rename, or reformat code that was not part of the request
5. **Direct and concise** — no filler, no lengthy preamble; get to the point
6. **Code only when needed** — for research/explanation tasks, natural language is the default; code is only shown if essential

---

## Anti-patterns to avoid

| Temptation | Correct behavior |
|-----------|-----------------|
| Rewriting the whole function to fix one line | Patch the minimum; refactor is a separate task |
| Adding "while I'm in here" improvements | Only touch what was asked |
| Assuming context without reading the code | Read the relevant files first |
| Long explanation before answering | State understanding briefly, then act |
