# Frontmatter Specification for `.agent.md` Files

Complete reference for all YAML frontmatter fields supported by GitHub Copilot custom agents.

---

## Full Field Reference

```yaml
---
description: 'Brief purpose and domain of the agent'
name: 'Agent Display Name'
model: 'Claude Sonnet 4.5'
tools: ['read', 'edit', 'search']
target: 'vscode'
infer: true
argument-hint: 'Describe the task you want the agent to perform'
handoffs:
  - label: 'Next Step Label'
    agent: target-agent-name
    prompt: 'Pre-filled prompt for the target agent.'
    send: false
mcp-servers:
  my-server:
    type: 'local'
    command: 'some-command'
    args: ['--arg1']
    tools: ['*']
    env:
      API_KEY: ${{ secrets.MY_API_KEY }}
metadata:
  category: 'testing'
  version: '1.0'
---
```

---

## Field Definitions

### `description` (REQUIRED)

- Type: single-quoted string
- Length: 50–150 characters
- Shown in VS Code's Copilot Chat dropdown and GitHub UI
- Must state WHAT the agent does and its domain context
- Example: `'Focuses on security audit, vulnerability scanning, and OWASP compliance'`

### `name` (OPTIONAL)

- Type: string in title case
- If omitted, defaults to filename without `.agent.md`
- Example: `'Security Auditor'`

### `model` (STRONGLY RECOMMENDED)

- Type: string (single-quoted)
- Specifies the AI model for the agent
- Supported in VS Code, JetBrains, Eclipse, Xcode
- **Not supported** on GitHub.com coding agent
- Common values:

| Value | Notes |
|-------|-------|
| `'Claude Sonnet 4.5'` | Strong reasoning, large context |
| `'gpt-4o'` | Fast, good for broad tasks |
| `'gpt-4'` | Balanced performance |

### `tools` (OPTIONAL)

- Type: YAML array or comma-separated string
- Omit = all tools enabled; `[]` = no tools
- Unrecognized tool names are silently ignored (allows environment-specific tools)

### `target` (OPTIONAL)

- Values: `'vscode'` or `'github-copilot'`
- Omit to make the agent available in both environments
- Use `'vscode'` when using `handoffs`, `argument-hint`, or `model`

### `infer` (OPTIONAL)

- Type: boolean (default: `true`)
- `true`: Copilot may activate this agent automatically based on context
- `false`: User must manually select the agent

### `argument-hint` (OPTIONAL — VS Code only)

- Short hint text shown in the chat input below the agent name
- Tells users what to type when invoking the agent
- Example: `'Describe the feature or bug you want to address'`

### `handoffs` (OPTIONAL — VS Code 1.106+ only)

See [handoffs-and-orchestration.md](handoffs-and-orchestration.md) for full spec and examples.

### `mcp-servers` (OPTIONAL — Organization/Enterprise only)

Configure MCP servers dedicated to this agent. Not supported at repository level.

```yaml
mcp-servers:
  server-alias:
    type: 'local'          # or 'stdio'
    command: 'binary-name'
    args: ['--flag', 'value']
    tools: ['*']           # or specific tool names
    env:
      VAR_NAME: ${{ secrets.SECRET_NAME }}
```

Secrets must be pre-configured in repository settings under the "copilot" environment.

### `metadata` (OPTIONAL — GitHub.com only)

Key-value pairs for agent annotation. Not supported in VS Code.

```yaml
metadata:
  category: 'security'
  owner: 'platform-team'
  version: '2.1'
```

---

## All Standard Tool Aliases

All aliases are case-insensitive.

| Alias | Alternative Names | Description |
|-------|------------------|-------------|
| `read` | Read, NotebookRead, view | Read file contents |
| `edit` | Edit, Write, MultiEdit, NotebookEdit | Edit and modify files |
| `search` | Grep, Glob | Search for files or text |
| `execute` | shell, Bash, powershell | Execute terminal commands |
| `agent` | Task, custom-agent | Invoke other custom agents |
| `web` | WebSearch, WebFetch | Fetch web content / search internet |
| `todo` | TodoWrite | Create/manage task lists (VS Code only) |
| `vscode` | — | VS Code extension API access |

### Built-in MCP Server Tools

**GitHub MCP Server** (read-only by default):
```yaml
tools: ['github/*']                           # All GitHub tools
tools: ['github/get_file_contents']           # Specific tool
```

**Playwright MCP Server** (localhost only):
```yaml
tools: ['playwright/*']                       # All Playwright tools
tools: ['playwright/navigate', 'playwright/screenshot']
```

---

## File Placement

| Scope | Location | Who Can Use |
|-------|----------|------------|
| Repository | `.github/agents/<name>.agent.md` | Contributors to that repo |
| Organization | `agents/<name>.agent.md` (org-level repo) | All repos in org |
| Enterprise | `agents/<name>.agent.md` (enterprise repo) | All repos in enterprise |

### Name Conflict Resolution

Priority (highest → lowest): Repository → Organization → Enterprise.
Lower-level agents override higher-level ones with the same name.

---

## Naming Conventions

- Lowercase with hyphens: `security-reviewer.agent.md`
- Allowed characters: `a-z`, `0-9`, `-`, `_`, `.`
- No spaces, uppercase, or special characters

---

## Version Compatibility

| Feature | VS Code | GitHub.com |
|---------|---------|-----------|
| `description` | ✅ | ✅ |
| `tools` | ✅ | ✅ |
| `model` | ✅ | ❌ |
| `argument-hint` | ✅ | ❌ |
| `handoffs` | ✅ (1.106+) | ❌ |
| `mcp-servers` | ❌ | ✅ (org/enterprise) |
| `metadata` | ❌ | ✅ |
| `target` | ✅ | ✅ |
| `infer` | ✅ | ✅ |
