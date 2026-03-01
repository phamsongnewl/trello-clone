---
name: make-skill-template
description: 'Create or update Agent Skills for GitHub Copilot from prompts or by duplicating this template. Use when asked to "create a skill", "make a new skill", "scaffold a skill", "update an existing skill", "improve a skill", "refine a skill", or when building/enhancing specialized AI capabilities with bundled resources. Generates and updates SKILL.md files with proper frontmatter, directory structure, and optional scripts/references/assets folders.'
---

# Make Skill Template

A meta-skill for creating new Agent Skills. Use this skill when you need to scaffold a new skill folder, generate a SKILL.md file, or help users understand the Agent Skills specification.

## When to Use This Skill

- User asks to "create a skill", "make a new skill", or "scaffold a skill"
- User asks to "update a skill", "improve a skill", "refine a skill", or "add capability to an existing skill"
- User wants to add a specialized capability to their GitHub Copilot setup
- User needs help structuring a skill with bundled resources
- User wants to duplicate this template as a starting point
- User wants to audit a skill for quality issues (description, coverage, stale content)

## Prerequisites

- Understanding of what the skill should accomplish
- A clear, keyword-rich description of capabilities and triggers
- Knowledge of any bundled resources needed (scripts, references, assets, templates)

## Creating a New Skill

### Step 1: Create the Skill Directory

Create a new folder with a lowercase, hyphenated name:

```
skills/<skill-name>/
└── SKILL.md          # Required
```

### Step 2: Generate SKILL.md with Frontmatter

Every skill requires YAML frontmatter with `name` and `description`:

```yaml
---
name: <skill-name>
description: '<What it does>. Use when <specific triggers, scenarios, keywords users might say>.'
---
```

#### Frontmatter Field Requirements

| Field | Required | Constraints |
|-------|----------|-------------|
| `name` | **Yes** | 1-64 chars, lowercase letters/numbers/hyphens only, must match folder name |
| `description` | **Yes** | 1-1024 chars, must describe WHAT it does AND WHEN to use it |
| `license` | No | License name or reference to bundled LICENSE.txt |
| `compatibility` | No | 1-500 chars, environment requirements if needed |
| `metadata` | No | Key-value pairs for additional properties |
| `allowed-tools` | No | Space-delimited list of pre-approved tools (experimental) |

#### Description Best Practices

**CRITICAL**: The `description` is the PRIMARY mechanism for automatic skill discovery. Include:

1. **WHAT** the skill does (capabilities)
2. **WHEN** to use it (triggers, scenarios, file types)
3. **Keywords** users might mention in prompts

**Good example:**

```yaml
description: 'Toolkit for testing local web applications using Playwright. Use when asked to verify frontend functionality, debug UI behavior, capture browser screenshots, or view browser console logs. Supports Chrome, Firefox, and WebKit.'
```

**Poor example:**

```yaml
description: 'Web testing helpers'
```

### Step 3: Write the Skill Body

After the frontmatter, add markdown instructions. Recommended sections:

| Section | Purpose |
|---------|---------|
| `# Title` | Brief overview |
| `## When to Use This Skill` | Reinforces description triggers |
| `## Prerequisites` | Required tools, dependencies |
| `## Step-by-Step Workflows` | Numbered steps for tasks |
| `## Troubleshooting` | Common issues and solutions |
| `## References` | Links to bundled docs |

### Step 4: Add Optional Directories (If Needed)

| Folder | Purpose | When to Use |
|--------|---------|-------------|
| `scripts/` | Executable code (Python, Bash, JS) | Automation that performs operations |
| `references/` | Documentation agent reads | API references, schemas, guides |
| `assets/` | Static files used AS-IS | Images, fonts, templates |
| `templates/` | Starter code agent modifies | Scaffolds to extend |

## Example: Complete Skill Structure

```
my-awesome-skill/
├── SKILL.md                    # Required instructions
├── LICENSE.txt                 # Optional license file
├── scripts/
│   └── helper.py               # Executable automation
├── references/
│   ├── api-reference.md        # Detailed docs
│   └── examples.md             # Usage examples
├── assets/
│   └── diagram.png             # Static resources
└── templates/
    └── starter.ts              # Code scaffold
```

## Updating an Existing Skill

Use this workflow when a skill already exists but needs improvement, new capabilities, or restructuring.

### Step 1: Audit the Existing Skill

Read the current `SKILL.md` and assess:

| Audit Area | Questions to Ask |
|------------|------------------|
| **Description** | Is it keyword-rich? Does it state WHAT and WHEN clearly? Is it ≤1024 chars? |
| **Triggers** | Would Copilot activate this skill for the intended prompts? |
| **Body coverage** | Are all key workflows documented? Are steps actionable and specific? |
| **Bundled resources** | Are `references/`, `scripts/`, `assets/`, or `templates/` present and accurate? |
| **Staleness** | Is any content outdated (API changes, deprecated patterns, wrong paths)? |
| **Size** | Is `SKILL.md` body under 500 lines? Are large workflows split into `references/`? |

### Step 2: Identify Gaps and Plan Changes

Investigate using three phases (adapted from the `microsoft-skill-creator` pattern):

**Phase 1 — Scope what the skill should cover:**
- What tasks should this skill enable that it currently does NOT?
- What user prompts should trigger this skill that currently would NOT?
- Are there missing keywords in the description?

**Phase 2 — Gather updated content:**
- Read all existing bundled resources (`references/`, `scripts/`).
- Identify duplicated information between `SKILL.md` and reference files — consolidate.
- Check code samples: do they still run correctly?

**Phase 3 — Validate coverage:**
- Can an agent complete the 3 most common tasks using only this skill?
- Are troubleshooting cases covered?
- Are external links still valid?

### Step 3: Update the Description (If Needed)

The description is the **#1 lever** for skill discoverability. Rewrite if:
- The skill fails to trigger for expected prompts
- New capabilities were added
- Keywords are vague or missing

**Before (poor):**
```yaml
description: 'Helpers for working with Azure'
```

**After (improved):**
```yaml
description: 'Azure resource management skill. Use when deploying Azure infrastructure, writing Bicep templates, configuring Azure CLI commands, troubleshooting Azure resource health, or estimating Azure costs. Covers ARM, Bicep, Azure CLI, and Azure Portal workflows.'
```

Description update checklist:
- [ ] States WHAT the skill does (capabilities)
- [ ] States WHEN to use it (triggers, user phrases, scenarios)
- [ ] Includes domain-specific keywords
- [ ] Wrapped in single quotes
- [ ] ≤1024 characters

### Step 4: Improve the Skill Body

Apply these content guidelines from `agent-skills.instructions.md`:

- Use **imperative mood**: "Run", "Create", "Configure" — not "You should run"
- Split workflows longer than 5 steps into `references/` and link from `SKILL.md`
- Remove duplicated content: information lives in `SKILL.md` **OR** a reference file, not both
- Add or update the `## Troubleshooting` table for common failure modes
- Ensure every workflow step is specific and actionable with exact commands

**Content balance — local vs. dynamic:**

| Content Type | Keep in SKILL.md | Move to references/ |
|---|---|---|
| Core concepts (3–5) | ✅ Full | |
| Hello-world / quickstart code | ✅ Full | |
| Common patterns (3–5) | ✅ Full | |
| Workflows > 5 steps | Summary + link | ✅ Full detail |
| Full API reference | Signature + example | ✅ Full docs |
| Troubleshooting | Top 5 cases | ✅ Extended cases |

### Step 5: Update Bundled Resources

| Resource type | Update action |
|---|---|
| `references/*.md` | Refresh stale content; split large SKILL.md sections here |
| `scripts/` | Update commands; verify cross-platform compatibility; add `--help` |
| `assets/` | Replace outdated static files (images, templates used AS-IS) |
| `templates/` | Refresh scaffolds that the agent modifies and extends |

Re-check path references in `SKILL.md` after any resource rename or move — use relative paths only.

### Step 6: Validate the Updated Skill

Run the full validation checklist (see [Validation Checklist](#validation-checklist)) and additionally:

- [ ] New capabilities are reflected in the `description`
- [ ] `## When to Use This Skill` is updated for new triggers
- [ ] No duplicated content between `SKILL.md` and `references/`
- [ ] All relative paths in `SKILL.md` resolve correctly
- [ ] Removed or renamed resources have no dangling links
- [ ] `npm run skill:validate` passes

---

## Quick Start: Duplicate This Template

1. Copy the `make-skill-template/` folder
2. Rename to your skill name (lowercase, hyphens)
3. Update `SKILL.md`:
   - Change `name:` to match folder name
   - Write a keyword-rich `description:`
   - Replace body content with your instructions
4. Add bundled resources as needed
5. Validate with `npm run skill:validate`

## Validation Checklist

**For new and updated skills:**

- [ ] Folder name is lowercase with hyphens
- [ ] `name` field matches folder name exactly
- [ ] `description` is 10-1024 characters
- [ ] `description` explains WHAT and WHEN, with relevant keywords
- [ ] `description` is wrapped in single quotes
- [ ] Body uses imperative mood ("Run", "Create", not "You should")
- [ ] Body content is under 500 lines
- [ ] Workflows > 5 steps are split into `references/` with links from SKILL.md
- [ ] No duplicated content between `SKILL.md` and `references/`
- [ ] All resource paths are relative and resolve correctly
- [ ] Scripts include `--help` documentation and error handling
- [ ] No hardcoded credentials or secrets
- [ ] Bundled assets are under 5MB each

## Troubleshooting

| Issue | Solution |
|-------|----------|
| Skill not discovered | Improve description with more keywords and triggers |
| Skill triggers too broadly | Narrow description — be more specific about when to activate |
| Validation fails on name | Ensure lowercase, no consecutive hyphens, matches folder |
| Description too short | Add capabilities, triggers, and keywords |
| Assets not found | Use relative paths from skill root |
| SKILL.md too long | Move large workflows or reference docs to `references/` folder |
| Stale code samples | Update scripts and templates; verify they run without errors |
| Duplicate content warnings | Keep information in one place — `SKILL.md` OR `references/`, not both |

## References

- Agent Skills official spec: <https://agentskills.io/specification>
- [VS Code Agent Skills Documentation](https://code.visualstudio.com/docs/copilot/customization/agent-skills)
- [Awesome Copilot Skills](https://github.com/github/awesome-copilot/blob/main/docs/README.skills.md)
