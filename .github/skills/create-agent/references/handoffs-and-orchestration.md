# Handoffs and Sub-Agent Orchestration

Complete reference for building multi-agent workflows with handoffs and orchestrators.

---

## Handoffs (VS Code 1.106+)

Handoffs add interactive transition buttons to an agent's response, letting users move to the next agent in a workflow while preserving context.

### Handoff Frontmatter Syntax

```yaml
handoffs:
  - label: 'Start Implementation'
    agent: implementer
    prompt: 'Implement the plan described above.'
    send: false
  - label: 'Review Code'
    agent: code-reviewer
    prompt: 'Review the implementation for quality and security issues.'
    send: false
```

### Handoff Properties

| Property | Type | Required | Description |
|----------|------|----------|-------------|
| `label` | string | Yes | Button text shown in UI — use action-oriented language |
| `agent` | string | Yes | Target agent name or filename without `.agent.md` |
| `prompt` | string | No | Pre-filled text in target agent's chat input |
| `send` | boolean | No | `true` = auto-submit; `false` = user reviews first (default) |

### Handoff Design Rules

- Use `send: false` for all handoffs that require human review before execution.
- Use `send: true` only for fully automated, low-risk transitions.
- Limit handoffs to 2–3 per agent; only include logical next steps.
- Ensure target agents exist in `.github/agents/` before referencing them.
- Label text must be action-oriented:
  - ✅ `"Implement Plan"`, `"Review for Security"`, `"Write Tests"`
  - ❌ `"Next"`, `"Continue"`, `"Go"`

---

## Complete Workflow Example: Plan → Implement → Review

### `planner.agent.md`

```yaml
---
description: 'Analyze requirements and generate a detailed implementation plan'
name: 'Planner'
model: 'Claude Sonnet 4.5'
tools: ['read', 'search', 'web']
target: 'vscode'
handoffs:
  - label: 'Implement Plan'
    agent: implementer
    prompt: 'Implement the plan outlined above.'
    send: false
---
# Planner

You are a planning specialist. Analyze requirements and produce a detailed, step-by-step implementation plan.

## Responsibilities
- Break down the requirement into logical steps
- Identify dependencies and risks
- Estimate complexity for each step
- Specify testing requirements

## Constraints
- Never write production code — output plans and documentation only
- Never edit files directly
```

### `implementer.agent.md`

```yaml
---
description: 'Implement code based on a plan or specification'
name: 'Implementer'
model: 'Claude Sonnet 4.5'
tools: ['read', 'edit', 'search', 'execute']
target: 'vscode'
handoffs:
  - label: 'Review Implementation'
    agent: code-reviewer
    prompt: 'Review this implementation for code quality, security, and adherence to best practices.'
    send: false
---
# Implementer

You are an implementation specialist. Write clean, maintainable code that fulfills the provided plan.

## Responsibilities
- Follow the plan step by step
- Write code that matches existing patterns in the codebase
- Add inline comments for complex logic
- Run existing tests after changes

## Constraints
- Never skip steps in the plan without explaining why
- Never modify test configuration or CI settings unless explicitly asked
```

### `code-reviewer.agent.md`

```yaml
---
description: 'Review code for quality, security, and best practices — read-only'
name: 'Code Reviewer'
model: 'Claude Sonnet 4.5'
tools: ['read', 'search']
target: 'vscode'
handoffs:
  - label: 'Back to Planning'
    agent: planner
    prompt: 'Based on the review feedback above, revise or extend the plan as needed.'
    send: false
---
# Code Reviewer

You are a code review specialist. Identify issues and suggest improvements without modifying code.

## Responsibilities
- Check code quality and maintainability
- Identify security vulnerabilities (OWASP Top 10)
- Verify adherence to project patterns
- Suggest concrete improvements

## Constraints
- Never edit files — provide suggestions only
- Never approve code with critical security issues
```

---

## Sub-Agent Orchestration

Use the `agent` tool in an orchestrator to invoke specialized agents sequentially.

### Enable Orchestration

```yaml
tools: ['read', 'edit', 'search', 'execute', 'agent']
```

The orchestrator's `tools:` list is the permission ceiling for all sub-agents.

### Invocation Prompt Pattern

Use this wrapper prompt when invoking each sub-agent:

```text
This phase must be performed as the agent "<AGENT_NAME>"
defined in ".github/agents/<agent-file>.agent.md".

IMPORTANT:
- Read and apply the full .agent.md spec (tools, constraints, quality standards).
- Project: "${projectName}"
- Base path: "${basePath}"
- Input: "${basePath}/input/"
- Output: "${basePath}/output/"

Task:
1. [Step 1]
2. [Step 2]
3. Return a concise summary: actions taken, files produced/modified, issues found.
```

### Multi-Step Example

```text
Step 1: Security Review
Agent: security-reviewer
Spec: .github/agents/security-reviewer.agent.md
Context: project="${projectName}", basePath="${basePath}"
Output: ${basePath}/reports/security-review.md

Step 2: Test Coverage Check (run only if test files exist)
Agent: test-coverage
Spec: .github/agents/test-coverage.agent.md
Context: project="${projectName}", basePath="${basePath}"
Output: ${basePath}/reports/coverage-report.md

Step 3: Aggregate Findings (Required — always run if Step 1 succeeded)
Agent: review-aggregator
Spec: .github/agents/review-aggregator.agent.md
Context: project="${projectName}", basePath="${basePath}"
Output: ${basePath}/reports/final-review.md
```

### Step Execution Rules

| Step Status | Trigger Condition | On Failure |
|-------------|-------------------|-----------|
| **Required** | Always run | Stop pipeline |
| **Optional** | Condition met (e.g., test files present) | Continue to next step |

### Log Entry Format

Append to `${basePath}/.agent-log.md` after each step:

```markdown
## Step 2: Test Coverage Check
**Status:** ✅ SUCCESS
**Trigger:** Test directory detected
**Artifacts:** reports/coverage-report.md
**Summary:** 142 tests checked; coverage at 87%; 3 uncovered paths flagged.
```

---

## Variable Passing in Orchestration

Pass context variables in prompt text — never embed entire file contents:

```text
# Good — pass identifiers and paths
Project: "${projectName}"
Input directory: "${basePath}/src/"

# Avoid — embedding file content
Here is the full source file: [3000 lines of code...]
```

### Variable Declaration Pattern (Orchestrator Body)

```markdown
## Dynamic Parameters

- **projectName**: Extracted from user prompt or workspace name
- **basePath**: Root directory for this workflow (e.g., `projects/${projectName}`)
- **outputDir**: Where to write results (default: `${basePath}/output/`)
- **logFile**: Audit log path (default: `${basePath}/.agent-log.md`)

If `projectName` is not provided, ask the user before proceeding.
```

---

## Orchestration Anti-Patterns

| Anti-Pattern | Problem | Fix |
|-------------|---------|-----|
| Sub-agent needs `edit` but orchestrator only has `read` | Sub-agent silently loses edit capability | Add `edit` to orchestrator `tools:` |
| Orchestrating 20+ sequential steps | Excessive latency and context bloat | Implement logic directly in a single agent |
| Passing full file contents between agents | Context window exhaustion | Pass file paths; let sub-agents read themselves |
| No failure handling for required steps | Pipeline continues on broken output | Explicitly stop and surface errors for required steps |
| Auto-send handoffs for destructive operations | No human review before execution | Always use `send: false` for edits, deploys, deletes |