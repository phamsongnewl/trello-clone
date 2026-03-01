---
name: create-instructions
description: 'Create, generate, and manage GitHub Copilot instruction files (.instructions.md). Use when asked to create a new instruction file, generate coding standards from a codebase, scaffold copilot-instructions.md, discover and install instructions from awesome-copilot, or write domain-specific guidelines for Copilot to follow. Supports authoring from scratch, extracting patterns from existing code, and syncing from the awesome-copilot community repository.'
---

# Create Instructions

A skill for authoring, generating, and managing GitHub Copilot custom instruction files that guide code generation, reviews, and documentation.

## When to Use This Skill

- User asks to "create an instruction file", "write coding standards", "add Copilot instructions"
- User wants Copilot to follow technology-specific or project-specific conventions
- User wants to generate `copilot-instructions.md` from an existing codebase
- User wants to discover or install instructions from the awesome-copilot repository
- User needs to update outdated instruction files

---

## Instruction File Fundamentals

### File Format & Location

| Type | Path | Scope |
|------|------|-------|
| Repository-wide | `.github/copilot-instructions.md` | Entire repository |
| Path-specific | `.github/instructions/<name>.instructions.md` | Files matching `applyTo` glob |
| Community / shareable | `instructions/<name>.instructions.md` | Distribution |

**Naming convention**: lowercase, hyphens (e.g., `react-best-practices.instructions.md`)

### Required Frontmatter

Every `.instructions.md` file **must** include YAML frontmatter:

```yaml
---
description: 'Brief description of the instruction purpose and scope'
applyTo: 'glob pattern for target files (e.g., **/*.ts, **/*.py)'
---
```

| Field | Required | Notes |
|-------|----------|-------|
| `description` | **Yes** | 1–500 chars, single-quoted, clearly states purpose |
| `applyTo` | **Yes** | Glob pattern(s); use `**` for all files |

**`applyTo` examples**:
- Single type: `'**/*.ts'`
- Multiple types: `'**/*.ts, **/*.tsx, **/*.js'`
- Specific folder: `'src/**/*.py'`
- All files: `'**'`

---

## Workflow 1 — Author an Instruction File from Scratch

Use this when the user wants to create a domain-specific instruction file (e.g., for a language, framework, or workflow).

### Steps

1. **Clarify scope** — Ask: what technology/domain, which files it applies to, key constraints.
2. **Create the file** at `.github/instructions/<name>.instructions.md`.
3. **Write frontmatter** — `description` and `applyTo`.
4. **Structure the body** using the recommended sections below.
5. **Add code examples** — include Good/Bad comparisons where helpful.
6. **Validate** with the checklist at the end of this skill.

### Recommended Body Sections

```markdown
# <Technology> Development

Brief introduction.

## General Instructions
- High-level principles (imperative mood: "Use", "Avoid", "Prefer")

## Best Practices
- Specific, actionable recommendations

## Code Standards
### Naming Conventions
### File Organization

## Common Patterns
### Pattern Name
Description + code snippet

## Security / Performance / Testing
(Include when relevant)

## Validation
- Build: `<command>`
- Lint: `<command>`
- Test: `<command>`
```

### Writing Style Rules

- Use **imperative mood**: "Use X", "Avoid Y", "Prefer Z"
- Be **specific and actionable** — no "should", "might", "possibly"
- Show **why** when it adds value
- Use **tables** for comparisons and rule lists
- Use **code snippets** over plain descriptions
- Keep sections **focused and scannable**

### Good vs. Bad Example Pattern

```markdown
### Good Example
\`\`\`typescript
// Recommended: explicit return types
function getUser(id: string): User { ... }
\`\`\`

### Bad Example
\`\`\`typescript
// Avoid: loses type safety
function getUser(id: any): any { ... }
\`\`\`
```

---

## Workflow 2 — Generate Instructions from an Existing Codebase

Use this when the user wants Copilot instructions derived from actual code patterns (not assumptions).

### Steps

1. **Detect technology versions** — scan `package.json`, `.csproj`, `pom.xml`, `requirements.txt`, etc.
2. **Identify architecture style** — folder structure, module boundaries, layer separation.
3. **Catalog code patterns**:
   - Naming conventions (variables, functions, classes, files)
   - Import/export organization
   - Error handling approaches
   - Async patterns (promises, async/await, coroutines)
   - Dependency injection style
   - Logging patterns
4. **Document quality standards** evident in the codebase (security, performance, accessibility, testability).
5. **Generate the instruction file** — only include patterns actually observed. Never prescribe practices not present in the code.
6. **Place output** at `.github/copilot-instructions.md` or `.github/instructions/<name>.instructions.md`.

### Codebase Scanning Priority

When conflicting patterns exist across files:
- Prefer patterns from **newer files**
- Prefer patterns from files with **higher test coverage**
- Prefer patterns that appear **most consistently**

### Generated File Structure

```markdown
---
description: '<Project> development guidelines derived from codebase patterns'
applyTo: '**'
---

# GitHub Copilot Instructions

## Priority Guidelines
1. Version Compatibility — respect exact versions detected
2. Codebase Patterns — follow established conventions
3. Architectural Consistency — maintain existing layer boundaries

## Technology Versions
(extracted from project config files)

## Naming Conventions
## Code Organization
## Error Handling
## Testing Patterns
## Documentation Style
```

> **Important**: Instruct Copilot to prioritize consistency with existing code over external best practices or newer language features.

---

## Workflow 3 — Discover and Install from awesome-copilot

Use this when the user wants to find community instruction files relevant to their project.

### Steps

1. **Fetch available instructions** — use the `#fetch` tool to retrieve the list from:
   `https://github.com/github/awesome-copilot/blob/main/docs/README.instructions.md`

2. **Scan local instructions** — list all `*.instructions.md` files in `.github/instructions/`.

3. **Read local frontmatter** — extract `description` and `applyTo` from each existing file.

4. **Fetch remote versions** — for each local instruction, compare with:
   `https://raw.githubusercontent.com/github/awesome-copilot/main/instructions/<filename>`

5. **Analyze context** — review chat history, file types in repo, and project needs to find relevant matches.

6. **Present results** in this table format:

| Instruction File | Description | Status | Notes |
|-----------------|-------------|--------|-------|
| `reactjs.instructions.md` | ReactJS standards | ❌ Not installed | Matches detected React usage |
| `typescript-5-es2022.instructions.md` | TS5+ES2022 guidelines | ⚠️ Outdated | `applyTo` pattern differs |
| `python.instructions.md` | Python conventions | ✅ Up to date | — |

   **Icons**: ✅ Up to date · ⚠️ Outdated (update available) · ❌ Not installed

7. **Await user confirmation** before installing or updating any files.

8. **Download/update** on request:
   - New files → `.github/instructions/<filename>`
   - Updated files → replace existing content verbatim (do not adjust content)
   - Use `#fetch` tool; fall back to `curl` via terminal if needed
   - Track progress with `#todos`

---

## Validation Checklist

Before finalizing any instruction file:

- [ ] File placed in `.github/instructions/` (or `.github/copilot-instructions.md` for repo-wide)
- [ ] Filename is lowercase with hyphens, ends in `.instructions.md`
- [ ] `description` is 10–500 characters, single-quoted
- [ ] `description` clearly states purpose and scope
- [ ] `applyTo` glob matches intended file types
- [ ] Body uses imperative mood throughout
- [ ] At least one code example included (where applicable)
- [ ] No ambiguous language ("should", "might", "possibly")
- [ ] No contradictory advice within the file
- [ ] File is under 500 lines

---

## Common Patterns to Include in Any Instruction File

1. **Naming Conventions** — variables, functions, classes, files
2. **Code Organization** — file structure, module layout, import order
3. **Error Handling** — preferred patterns and anti-patterns
4. **Dependencies** — how to manage and document
5. **Comments & Documentation** — when and how to document
6. **Version Information** — target language/framework versions

---

## Patterns to Avoid

| Anti-pattern | Why |
|-------------|-----|
| Overly verbose explanations | Hard to scan; Copilot context is shared |
| Outdated information | Leads to deprecated code generation |
| Ambiguous guidelines | "should" and "might" are ignored in practice |
| No code examples | Abstract rules are less effective |
| Contradictory advice | Inconsistent output |
| Copy-paste from docs | Add value by distilling and contextualizing |

---

## References

- [Custom Instructions Documentation](https://code.visualstudio.com/docs/copilot/customization/custom-instructions)
- [Awesome Copilot Instructions](https://github.com/github/awesome-copilot/tree/main/instructions)
