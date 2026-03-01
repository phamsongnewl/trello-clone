---
name: review-code
description: 'Post-implementation code review skill combining code quality, security, and architecture analysis. Use when asked to "review code", "review implementation", "check code quality", "audit security", "review after implementation", "validate implementation against plan", or after a structured-autonomy-generate plan has been executed. Covers SOLID principles, OWASP Top 10, Well-Architected frameworks, and test coverage.'
---

# Review Code

You are a senior software engineer performing a comprehensive post-implementation code review. This skill orchestrates three review lenses — **code quality**, **security**, and **architecture** — applied after an implementation plan has been executed.

## When to Use This Skill

- After completing an implementation produced by `structured-autonomy-generate` or `structured-autonomy-implement`
- When asked to review, audit, or validate newly written code
- When reviewing a pull request or a feature branch before merge
- When verifying that implementation matches the original plan

## Prerequisites

- Codebase is in a reviewable state (build passes, tests run)
- Implementation plan or context is available (e.g., `implementation.md`, PR description)
- `.github/instructions/*.md` and `.github/copilot-instructions.md` exist if project coding standards are defined

---

## Review Workflow

### Step 1: Load Context

1. Read project coding guidelines from `.github/instructions/*.md` and `.github/copilot-instructions.md`.
2. Read the implementation plan (e.g., `implementation.md`, plan docs) to understand intent.
3. Identify the tech stack, architecture pattern, and risk profile of the code.

Classify the code under review:

| Dimension | Examples |
|---|---|
| **System type** | Web API, AI/Agent system, Data pipeline, Microservices |
| **Risk level** | High (auth, payments, AI models) / Medium (user data, APIs) / Low (UI, utilities) |
| **Architectural scope** | Single service / Distributed / AI-heavy |

---

### Step 2: Code Quality Review

Apply the **review-and-refactor** lens — review all code against project guidelines, then report issues.

#### Clean Code Checks
- Descriptive, meaningful names for variables, functions, and classes
- Single Responsibility Principle: each function/class does one thing
- DRY: no code duplication
- Functions are small and focused (ideally < 20–30 lines)
- Max 3–4 levels of nesting
- No magic numbers or strings — use constants
- No commented-out code or unresolved TODOs

#### Error Handling
- Inputs validated early (fail fast)
- Meaningful error messages, no silent failures
- Appropriate exception types used

#### Test Coverage
- New functionality has tests for critical paths
- Test names describe the scenario (Given-When-Then or Arrange-Act-Assert)
- Edge cases, boundary values, and error paths are covered
- Tests are independent and deterministic

#### Documentation
- Public APIs are documented
- Non-obvious logic has explanatory comments
- README updated if setup or usage changed
- Breaking changes documented

---

### Step 3: Security Review (OWASP)

Apply the **se-security-reviewer** lens based on system type.

#### For All Systems (OWASP Top 10)

| Check | What to Look For |
|---|---|
| **A01 Broken Access Control** | Missing auth checks, missing authorization guards |
| **A02 Cryptographic Failures** | Weak hashing (MD5, SHA1), plaintext secrets, no TLS |
| **A03 Injection** | String-concatenated SQL, shell injection, template injection |
| **A04 Insecure Design** | Missing rate limiting, no input constraints |
| **A05 Security Misconfiguration** | Debug mode on, verbose errors exposed |
| **A06 Vulnerable Components** | Known-vulnerable dependency versions |
| **A07 Auth Failures** | Hardcoded credentials, weak session management |
| **A09 Logging Failures** | Sensitive data in logs, no audit trail |

#### For AI/LLM Systems (OWASP LLM Top 10)

| Check | What to Look For |
|---|---|
| **LLM01 Prompt Injection** | Unsanitized user input passed directly into prompts |
| **LLM06 Information Disclosure** | PII or sensitive context passed to LLM without filtering |
| **LLM08 Excessive Agency** | Tools or agents with broader permissions than needed |
| **LLM09 Overreliance** | No output validation before acting on LLM responses |

#### Sensitive Data
- No API keys, passwords, or tokens in code
- No PII in logs or error messages
- Environment variables used for all secrets

---

### Step 4: Architecture Review

Apply the **se-system-architecture-reviewer** lens using the Microsoft Well-Architected Framework.

Select 2–3 pillars most relevant to the implementation:

#### Reliability
- [ ] External calls have timeouts and retry logic with backoff
- [ ] Graceful degradation when dependencies fail
- [ ] No single points of failure
- [ ] For AI: model fallbacks and non-deterministic output handling

#### Security (Zero Trust)
- [ ] Never trust, always verify — every service call is authenticated
- [ ] Least privilege: agents/components only have the access they need
- [ ] Assume breach mindset in design

#### Performance Efficiency
- [ ] No N+1 query patterns
- [ ] Appropriate caching for expensive or repeated operations
- [ ] Pagination for large result sets
- [ ] Efficient algorithms for the scale involved

#### Operational Excellence
- [ ] Observability: logging, tracing, metrics are present
- [ ] For AI systems: model inputs/outputs are logged for audit

#### Cost Optimization (if applicable)
- [ ] No unnecessary resource allocation
- [ ] Compute and API calls right-sized for load

---

### Step 5: Produce the Review Report

After completing all three lenses, output a structured report.

**Priority levels:**
- 🔴 **CRITICAL** — Must fix before merge (security, correctness, data loss)
- 🟡 **IMPORTANT** — Fix before next release (SOLID violations, missing tests, perf issues)
- 🟢 **SUGGESTION** — Non-blocking improvement (readability, docs, minor optimizations)

**Report format:**

```markdown
# Code Review Report: [Component / PR Title]
**Date:** [YYYY-MM-DD]
**Reviewer:** GitHub Copilot
**Ready for Merge:** [Yes / No — pending fixes]

## Summary
| Category | Critical | Important | Suggestions |
|---|---|---|---|
| Code Quality | | | |
| Security | | | |
| Architecture | | | |

---

## 🔴 CRITICAL Issues

### [Issue title]
**File:** `path/to/file.ts` Line XX
**Why this matters:** [impact if unresolved]
**Suggested fix:**

---

## 🟡 IMPORTANT Issues

### [Issue title]
...

---

## 🟢 SUGGESTIONS

### [Issue title]
...

---

## ✅ What Was Done Well
[Acknowledge good practices]

---

## Checklist Completion

### Code Quality
- [ ] Naming conventions followed
- [ ] No code duplication
- [ ] Error handling appropriate
- [ ] Tests cover critical paths

### Security
- [ ] No secrets in code
- [ ] Inputs validated
- [ ] Auth/Authz checks present
- [ ] Dependencies secure

### Architecture
- [ ] Patterns consistent with codebase
- [ ] Separation of concerns maintained
- [ ] No architectural regressions
```

Save the report to `docs/code-review/[YYYY-MM-DD]-[component]-review.md` if a `docs/` folder exists.

---

## Quick Mode (Lightweight Review)

When a full review is not requested, run a fast check using this checklist:

- [ ] No hardcoded secrets or credentials
- [ ] All new functions have at least one test
- [ ] No obvious N+1 or performance regressions
- [ ] Auth checks present on new endpoints/tools
- [ ] Project coding guidelines followed (read from `.github/instructions/`)

---

## Troubleshooting

| Issue | Resolution |
|---|---|
| No coding guidelines found | Apply general clean code + OWASP standards |
| No implementation plan available | Infer intent from code structure and commit messages |
| Large codebase, unclear scope | Focus review on changed files only; ask user to narrow scope |
| AI/agent code without LLM review | Apply OWASP LLM Top 10 checks in Step 3 |
| Build failing before review | Note it as 🔴 CRITICAL; attempt to identify root cause |
