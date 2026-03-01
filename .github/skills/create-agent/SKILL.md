---
name: create-agent
description: 'Scaffold and write GitHub Copilot custom agent files (.agent.md). Use when asked to "create an agent", "make a custom agent", "build a Copilot agent", "write an .agent.md", "design a specialist agent", or configure agent handoffs, tool access, orchestration, or multi-agent workflows.'
---

# Create Agent

Scaffold production-ready `.agent.md` files for GitHub Copilot with proper frontmatter, safety-first tool configuration, and optional handoff workflows.

## When to Use This Skill

- User asks to create, design, or scaffold a custom Copilot agent
- User wants to configure agent tools, handoffs, or sub-agent orchestration
- User wants to convert a prompt/role description into a `.agent.md` file
- User needs to review or improve an existing agent file

## Prerequisites

- Clear purpose for the agent (role, tasks, output expectations)
- Target environment: VS Code, GitHub.com, or both
- Knowledge of whether the agent will participate in a handoff chain

---

## Step 1: Gather Requirements

Before writing any file, understand the agent needs:

| Question | Why It Matters |
|----------|----------------|
| What specialized role should this agent embody? | Shapes identity statement and name |
| What specific tasks will it perform? | Drives tool selection |
| What should it **not** do? | Defines constraints and safety rails |
| Read-only or does it edit/execute? | Determines tool privilege level |
| Standalone or part of a workflow chain? | Decides whether handoffs are needed |
| Target environment: VS Code / GitHub.com / both? | Affects which frontmatter fields apply |

If any answer is unclear, **ask the user** before proceeding.

---

## Step 2: Write the Frontmatter

Every agent file starts with YAML frontmatter. Save to `.github/agents/<agent-name>.agent.md`.

```yaml
---
description: 'Clear, single-sentence purpose shown in the Copilot UI'
name: 'Agent Display Name'
model: 'Claude Sonnet 4.5'
tools: ['read', 'search']
target: 'vscode'
infer: true
---
```

### Field Reference (summary)

| Field | Required | Notes |
|-------|----------|-------|
| `description` | **Yes** | 50–150 chars, single-quoted, WHAT + domain |
| `name` | No | Title case; defaults to filename if omitted |
| `model` | Strongly recommended | `'Claude Sonnet 4.5'`, `'gpt-4o'`, etc. |
| `tools` | No | Omit = all tools; `[]` = no tools |
| `target` | No | `'vscode'` or `'github-copilot'`; omit for both |
| `infer` | No | `false` = manual selection only |
| `argument-hint` | No | VS Code only — hint text in chat input |
| `handoffs` | No | VS Code 1.106+ only — workflow transitions |
| `mcp-servers` | No | Org/Enterprise level only |

> Full field definitions → [references/frontmatter-spec.md](references/frontmatter-spec.md)

---

## Step 3: Select Tools Safely

Apply **least-privilege** — grant only the tools the agent genuinely needs.

### Tool Selection by Agent Type

| Agent Type | Recommended Tools |
|-----------|------------------|
| Planner / Researcher | `['read', 'search', 'web']` |
| Code Reviewer / Auditor | `['read', 'search']` |
| Implementation / Refactoring | `['read', 'edit', 'search']` |
| Testing | `['read', 'edit', 'search', 'execute']` |
| Documentation Writer | `['read', 'edit', 'search']` |
| Deployment / DevOps | `['read', 'edit', 'execute', 'search']` |
| Orchestrator | `['read', 'edit', 'search', 'execute', 'agent']` |

### Standard Tool Aliases

| Alias | Includes | Use For |
|-------|---------|---------|
| `read` | Read, view, NotebookRead | Reading files |
| `edit` | Edit, Write, MultiEdit | Modifying files |
| `search` | Grep, Glob | Finding files/text |
| `execute` | shell, Bash, powershell | Running commands |
| `web` | WebSearch, WebFetch | Internet access |
| `agent` | Task, custom-agent | Invoke sub-agents |
| `todo` | TodoWrite | Task list (VS Code) |
| `github/*` | All GitHub MCP tools | GitHub operations |

### Safety Rules

- Never grant `execute` to read-only agents (planners, reviewers, auditors).
- Never grant `agent` unless the agent needs to orchestrate sub-agents.
- Prefer named tool lists over `['*']` (unrestricted access).
- If an orchestrator spawns sub-agents, its tool list must be **a superset** of all sub-agents' tools.

> Full safety patterns → [references/agent-safety-guide.md](references/agent-safety-guide.md)

---

## Step 4: Write the Agent Body

Structure the markdown body below the frontmatter:

```markdown
# [Agent Name]

You are a [role] specialized in [domain/purpose].

## Core Responsibilities
- [Task 1]
- [Task 2]
- [Task 3]

## Approach
- [How the agent thinks / methodology]
- [Quality standards]

## Constraints
- Never [dangerous or out-of-scope action]
- Always [required behavior]

## Output Format
[Describe expected output structure, format, length]
```

### Body Writing Rules

- Open with a strong identity statement: `"You are a [role] specialized in [purpose]"`
- Use **imperative mood**: "Analyze", "Generate", "Verify" — not "You should analyze"
- State constraints explicitly with "Never" / "Always"
- Specify output format (Markdown, JSON, code snippet structure, etc.)
- Keep body under 30,000 characters total
- For long workflows (> 5 steps), link to `references/` rather than embedding inline

---

## Step 5: Add Handoffs (Optional — VS Code 1.106+)

Handoffs create guided workflow transitions between agents.

```yaml
handoffs:
  - label: 'Implement Plan'
    agent: implementer
    prompt: 'Implement the plan outlined above.'
    send: false
  - label: 'Review Code'
    agent: code-reviewer
    prompt: 'Review the implementation for quality and security issues.'
    send: false
```

| Property | Required | Notes |
|----------|----------|-------|
| `label` | Yes | Action-oriented button text shown in UI |
| `agent` | Yes | Target agent name or filename (without `.agent.md`) |
| `prompt` | No | Pre-filled prompt for the target agent |
| `send` | No | `true` = auto-submit; `false` = user reviews first |

**Common workflow chains:**
- `Planner → Implementer → Reviewer`
- `Draft → Review → Finalize`
- `Write Failing Tests → Implement → Verify`

> Full handoff examples and sub-agent orchestration → [references/handoffs-and-orchestration.md](references/handoffs-and-orchestration.md)

---

## Step 6: Save and Test

1. Save the file to `.github/agents/<kebab-case-name>.agent.md`
2. Reload VS Code or refresh GitHub.com
3. Select the agent from the Copilot Chat dropdown
4. Test with at least 3 representative user prompts
5. Verify tool access works — no missing or excessive permissions

### File Naming Rules
- Lowercase with hyphens only: `security-reviewer.agent.md`
- Allowed characters: `a-z`, `0-9`, `-`, `_`, `.`
- No spaces, uppercase, or special characters
- Filename becomes the default agent name if `name` is omitted

---

## Common Agent Archetypes

| Archetype | Tools | Constraint |
|-----------|-------|-----------|
| **Planner** | `read, search, web` | Never write code |
| **Implementer** | `read, edit, search` | Follow established patterns |
| **Code Reviewer** | `read, search` | Suggest only, never edit |
| **Security Auditor** | `read, search, web` | Read-only, flag issues |
| **Test Writer** | `read, edit, execute` | Don't change production code |
| **Documentation Writer** | `read, edit, search` | Preserve code intent |
| **Orchestrator** | `read, edit, search, execute, agent` | Least-privilege for sub-agents |

---

## Validation Checklist

**Frontmatter:**
- [ ] `description` present, 50–150 chars, single-quoted
- [ ] `name` in title case (if specified)
- [ ] `model` specified
- [ ] `tools` list is minimal — only what is needed
- [ ] `target` set if environment-specific
- [ ] `handoffs` present only if workflow chain is intended

**Body:**
- [ ] Opens with a clear identity statement
- [ ] Uses imperative mood throughout
- [ ] Constraints ("Never / Always") explicitly stated
- [ ] Output format specified
- [ ] Total content under 30,000 characters

**File:**
- [ ] Saved to `.github/agents/`
- [ ] Filename is lowercase with hyphens, ends in `.agent.md`
- [ ] Agent purpose is unique and not duplicating an existing agent

**Safety:**
- [ ] No `execute` granted to read-only agents
- [ ] No hardcoded secrets or credentials in the file
- [ ] Orchestrator tool list covers all sub-agent tools
- [ ] Handoff target agents exist in `.github/agents/`

---

## Troubleshooting

| Issue | Solution |
|-------|---------|
| Agent not appearing in dropdown | Check `.github/agents/` location; reload VS Code |
| Agent has wrong name | Add `name:` field to frontmatter |
| Tool access denied | Add missing tool to `tools:` list |
| Handoff buttons not showing | Requires VS Code 1.106+; verify `handoffs:` syntax |
| Agent triggers too broadly | Narrow the role — add "Only use when..." in body |
| Agent too permissive | Remove `execute` / `agent` if not needed |
| Sub-agent can't edit files | Orchestrator must include `edit` in its own `tools:` |
| Description wrapping issue | Use single quotes only, no newlines in `description:` |

---

## References

- [references/frontmatter-spec.md](references/frontmatter-spec.md) — Full frontmatter field definitions, all tool aliases, MCP server config
- [references/agent-safety-guide.md](references/agent-safety-guide.md) — Safety principles, content filtering, multi-agent governance
- [references/handoffs-and-orchestration.md](references/handoffs-and-orchestration.md) — Complete handoff examples, sub-agent orchestration patterns, variable passing
- [Official Docs: Create Custom Agents](https://docs.github.com/en/copilot/how-tos/use-copilot-agents/coding-agent/create-custom-agents)
- [VS Code Custom Agents](https://code.visualstudio.com/docs/copilot/customization/custom-agents)
- [Awesome Copilot Agents Collection](https://github.com/github/awesome-copilot/tree/main/agents)
