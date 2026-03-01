---
name: generate-uat
description: 'Generates complete User Acceptance Testing (UAT) documentation from a completed implementation plan. Use when asked to "generate UAT", "create acceptance tests", "write UAT scenarios", "produce UAT plan", or after finishing an implementation plan with structured-autonomy-generate. Reads implementation.md and produces EARS-based acceptance criteria, categorized UAT scenarios, and a UAT report template.'
---

# Generate UAT

## Goal

Act as a senior QA Engineer and Business Analyst with expertise in User Acceptance Testing, ISTQB frameworks, and EARS requirements notation. Your task is to consume a completed `implementation.md` — produced by the `structured-autonomy-generate` skill — and generate ready-to-execute UAT documentation that bridges implementation detail and business validation.

---

## When to Use This Skill

- After `structured-autonomy-generate` has produced `plans/{feature-name}/implementation.md`
- When asked to validate that a feature meets its original business requirements
- When a tester or product owner needs executable UAT checklists without writing them from scratch
- When acceptance criteria must be formally traced back to implementation steps

---

## Prerequisites

Ensure the following file exists before proceeding:

| Artifact | Path | Produced by |
|----------|------|-------------|
| Implementation Plan | `plans/{feature-name}/implementation.md` | `structured-autonomy-generate` |

Optional input (improves output quality when available):

| Artifact | Path |
|----------|------|
| Feature PRD / Spec | `plans/{feature-name}/plan.md` |
| API / Schema docs | Any path referenced in `implementation.md` |

---

## Workflow

### Step 1 — Parse the Implementation Plan

Read `plans/{feature-name}/implementation.md` and extract:

1. **Feature name and goal** — from the `# Goal` section
2. **Implementation steps** — each numbered step and its verification points
3. **Affected files and components** — file paths and their roles
4. **Technology stack** — languages, frameworks, dependencies
5. **Existing verification points** — any `[ ]` checkboxes already written in the plan

> Do **not** generate any UAT artifacts until all five items above are extracted.

---

### Step 2 — Derive Acceptance Criteria (EARS Notation)

For each implementation step, translate its **verification points** into formal acceptance criteria using **EARS notation** (Easy Approach to Requirements Syntax):

| Pattern | Format |
|---------|--------|
| Event-driven | `WHEN [trigger event] THE SYSTEM SHALL [expected behavior]` |
| State-driven | `WHILE [in specific state] THE SYSTEM SHALL [expected behavior]` |
| Unwanted behavior | `IF [unwanted condition] THEN THE SYSTEM SHALL [required response]` |
| Ubiquitous | `THE SYSTEM SHALL [expected behavior]` |
| Optional feature | `WHERE [feature is included] THE SYSTEM SHALL [expected behavior]` |

Each acceptance criterion must be:

- **Testable** — verifiable through a concrete manual or automated action
- **Unambiguous** — only one valid interpretation
- **Traceable** — tagged with the implementation step number it came from (e.g., `[Step-3]`)
- **Feasible** — achievable within the deployed system

---

### Step 3 — Classify UAT Scenarios

Organize the derived criteria into the following scenario categories:

| Category | Description |
|----------|-------------|
| **Happy Path** | Normal usage with valid inputs — the primary business flow |
| **Boundary** | Min/max values, empty states, just-over-limit inputs |
| **Negative** | Invalid inputs, missing required fields, wrong data types |
| **Error Handling** | Network failures, timeouts, permission denials, system errors |
| **Security** | Authentication, authorization, input sanitization |
| **Accessibility** | WCAG compliance, keyboard navigation, screen reader support (if UI) |
| **Performance** | Response time thresholds, concurrency, data volume (if defined) |
| **Regression** | Existing functionality that must remain unbroken |

Prioritize by risk: **Critical → High → Medium → Low**

---

### Step 4 — Generate UAT Artifacts

Save three files into `plans/{feature-name}/`:

| File | Purpose |
|------|---------|
| `uat-acceptance-criteria.md` | Formal EARS-notation criteria, fully traced to implementation steps |
| `uat-scenarios.md` | Categorized, executable UAT checklists with tester-facing steps |
| `uat-report-template.md` | Blank report template for testers to fill in during execution |

---

## Output File Templates

### `uat-acceptance-criteria.md`

```markdown
# UAT Acceptance Criteria — {Feature Name}

## Traceability Summary

| Criterion ID | Implementation Step | EARS Pattern | Priority |
|---|---|---|---|
| AC-001 | Step-1 | Event-driven | Critical |
| AC-002 | Step-2 | State-driven | High |

---

## Acceptance Criteria

### AC-001 · [Step-1] · {Short Title}

> **WHEN** {trigger event}, **THE SYSTEM SHALL** {expected behavior}.

- **Priority**: Critical / High / Medium / Low
- **Test Type**: Functional / Non-Functional / Security / Accessibility
- **Verification Method**: Manual / Automated / Both
- **Definition of Done**: {Concrete observable outcome that confirms this criterion is met}

---

## Quality Gates

### Entry Criteria (before UAT begins)
- [ ] All implementation steps marked complete in `implementation.md`
- [ ] Feature deployed to UAT/staging environment
- [ ] Test data prepared and seeded
- [ ] Smoke test passed (application loads without errors)

### Exit Criteria (before UAT sign-off)
- [ ] 100% of Critical and High criteria passed
- [ ] No open Critical or High severity defects
- [ ] All happy path scenarios passed
- [ ] Regression scenarios validated
- [ ] UAT report signed off by product owner
```

---

### `uat-scenarios.md`

```markdown
# UAT Scenarios — {Feature Name}

## Scenario Execution Summary

| Scenario ID | Category | Priority | Status |
|---|---|---|---|
| UAT-001 | Happy Path | Critical | ⬜ Not Run |
| UAT-002 | Boundary | High | ⬜ Not Run |

> Status values: ⬜ Not Run · ✅ Pass · ❌ Fail · ⏭ Skipped

---

## Happy Path Scenarios

### UAT-001 · {Scenario Title}

**Linked Criterion**: AC-001  
**Priority**: Critical  
**Preconditions**: {What must be true before this test runs}

**Steps**:
1. {Concrete tester action — e.g., "Navigate to /login"}
2. {Next action}
3. {Final action}

**Expected Result**: {Exactly what the tester should see/observe}  
**Acceptance Criterion Satisfied**: AC-001 ✅ / ❌  
**Notes / Evidence**: _[Tester fills in]_

---

## Boundary Scenarios

### UAT-002 · {Scenario Title}

**Linked Criterion**: AC-002  
**Priority**: High  
**Preconditions**: {Setup}

**Steps**:
1. {Action with boundary value — e.g., "Enter 0 in the quantity field"}
2. {Submit / trigger}

**Expected Result**: {System behavior at boundary}  
**Acceptance Criterion Satisfied**: AC-002 ✅ / ❌  
**Notes / Evidence**: _[Tester fills in]_

---

## Negative Scenarios

<!-- Repeat pattern for each negative, error-handling, security,
     accessibility, performance, and regression scenario -->

---

## ISO 25010 Quality Characteristics Coverage

| Characteristic | Covered By Scenarios | Status |
|---|---|---|
| Functional Suitability | UAT-001, UAT-002, … | ⬜ |
| Reliability | UAT-0XX | ⬜ |
| Security | UAT-0XX | ⬜ |
| Usability / Accessibility | UAT-0XX | ⬜ |
| Performance Efficiency | UAT-0XX | ⬜ |
```

---

### `uat-report-template.md`

```markdown
# UAT Execution Report — {Feature Name}

**Feature**: {Feature Name}  
**Version / Branch**: {Branch or release tag}  
**Environment**: {UAT / Staging URL}  
**Executed by**: {Tester name}  
**Execution date**: {YYYY-MM-DD}  
**Report date**: {YYYY-MM-DD}

---

## Executive Summary

| Total Scenarios | Passed | Failed | Skipped | Pass Rate |
|---|---|---|---|---|
| {n} | {n} | {n} | {n} | {x}% |

**UAT Decision**: ⬜ Accepted · ⬜ Accepted with conditions · ⬜ Rejected

**Conditions / Notes**:
> _[Product owner fills in if "Accepted with conditions"]_

---

## Defect Log

| Defect ID | Scenario | Severity | Description | Steps to Reproduce | Status |
|---|---|---|---|---|---|
| DEF-001 | UAT-0XX | Critical / High / Medium / Low | {Short description} | {Steps} | Open / Fixed / Won't Fix |

---

## Scenario Results

| Scenario ID | Category | Priority | Result | Tester Notes |
|---|---|---|---|---|
| UAT-001 | Happy Path | Critical | ✅ Pass | |
| UAT-002 | Boundary | High | ❌ Fail | DEF-001 |

---

## Quality Gate Checklist

### Entry Criteria (confirm these were met before execution)
- [ ] All implementation steps marked complete
- [ ] Feature deployed to UAT environment
- [ ] Test data seeded
- [ ] Smoke test passed

### Exit Criteria (must all be checked before sign-off)
- [ ] 100% of Critical/High scenarios passed (or defects logged)
- [ ] No open Critical/High defects without accepted workaround
- [ ] Regression scenarios validated
- [ ] Product owner has reviewed defect log

---

## Sign-off

| Role | Name | Signature | Date |
|---|---|---|---|
| Tester | | | |
| Product Owner | | | |
| Tech Lead | | | |
```

---

## Validation Checklist

Before saving UAT artifacts, verify:

- [ ] Every implementation step in `implementation.md` is covered by at least one acceptance criterion
- [ ] Every acceptance criterion uses valid EARS notation and is traceable to a step
- [ ] Each scenario has concrete, observable expected results (no "should work correctly")
- [ ] Critical and High priority scenarios cover all happy path and core business flows
- [ ] Boundary and negative scenarios cover all inputs described in the implementation
- [ ] Quality gate entry/exit criteria are defined in all three output files
- [ ] All three files saved to `plans/{feature-name}/`

---

## Troubleshooting

| Problem | Solution |
|---------|----------|
| `implementation.md` missing verification points | Derive criteria directly from code changes and affected file descriptions |
| Acceptance criteria too vague | Apply EARS notation strictly; ask: "what exact observable output proves this?" |
| Too many scenarios (>50) | Group by component; prioritize Critical/High; mark Medium/Low as optional |
| Step has no testable behavior | Flag as technical debt; document as non-functional requirement instead |
| Feature has no PRD | Use implementation goal and step descriptions as the source of truth |

---

## References

- `structured-autonomy-generate` skill — produces the `implementation.md` input
- [EARS Notation](https://ieeexplore.ieee.org/document/5636770) — requirements syntax standard
- [ISTQB Glossary](https://glossary.istqb.org/) — test design technique definitions
- [ISO/IEC 25010](https://iso25000.com/index.php/en/iso-25000-standards/iso-25010) — software quality model
