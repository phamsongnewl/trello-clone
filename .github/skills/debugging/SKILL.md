---
name: debugging
description: 'Systematic debugging skill for identifying, analyzing, and fixing bugs. Use when asked to debug, fix a bug, troubleshoot an error, investigate a failure, trace a crash, find root cause, fix failing tests, or diagnose unexpected behavior. Follows a 4-phase workflow: Assessment → Investigation → Resolution → Quality Assurance. Supports Python, JavaScript/TypeScript, and general codebases.'
---

# Debugging Skill

A structured, systematic approach to debugging applications. Combines a 4-phase debugging workflow with self-reflection quality gates and language-specific best practices.

## When to Use This Skill

- "Debug this error / exception / crash"
- "My tests are failing — find out why"
- "Fix this bug / unexpected behavior"
- "Investigate root cause of this issue"
- "Diagnose why this function returns wrong output"
- "Troubleshoot this failing API call / integration"
- Any request involving finding and fixing a defect

---

## Workflow Overview

The debugging workflow follows **4 phases**, drawn from a structured Debug Mode approach, combined with a **Diagnose → Implement → Verify** loop from Blueprint Mode.

```
Phase 1: Assessment    →  Understand the problem and reproduce it
Phase 2: Investigation →  Root cause analysis & hypothesis formation
Phase 3: Resolution    →  Targeted fix + verification
Phase 4: QA            →  Code quality, regression tests, final report
```

On each Verify step, apply the **Self-Reflection rubric** (see below). If any score < 8, iterate back to the appropriate phase.

---

## Phase 1: Problem Assessment

### 1. Gather Context

Before writing a single line of code:

- Read error messages, stack traces, and failure reports in full
- Examine codebase structure and **recent git changes** (`git log --oneline -20`)
- Identify **expected vs actual behavior** clearly
- Review relevant test files and their failures

### 2. Reproduce the Bug

Never make changes without first reproducing:

- Run the application or test suite to confirm the issue exists
- Record exact steps to reproduce
- Capture full error output, logs, and environment details
- Produce a concise **bug report**:

  | Field | Content |
  |---|---|
  | Steps to reproduce | Numbered, minimal sequence |
  | Expected behavior | What should happen |
  | Actual behavior | What actually happens |
  | Error / stack trace | Full trace, not truncated |
  | Environment | OS, language version, framework version |

---

## Phase 2: Investigation

### 3. Root Cause Analysis

- Trace the **code execution path** leading to the failure
- Examine variable states, data flows, and control logic at each step
- Check for common bug categories:

  | Category | Examples |
  |---|---|
  | Null / undefined references | Missing guard, uninitialized variable |
  | Off-by-one errors | Loop bounds, array indices |
  | Race conditions | Async/await misuse, shared state |
  | Type mismatches | Implicit coercion, wrong schema |
  | Incorrect assumptions | API contract mismatch, stale cache |
  | Retry/idempotency | Duplicate writes, partial failures |

- Use `usages` / symbol search tools to understand how affected components interact
- Review git history: `git log -p -- <affected-file>` to find introducing commit

### 4. Hypothesis Formation

- Formulate **specific, falsifiable hypotheses** about the root cause
- Rank by likelihood × impact
- Define a verification step for each hypothesis before touching code
- Only proceed to Phase 3 after identifying the most probable root cause

---

## Phase 3: Resolution

### 5. Implement Fix

Apply the **Blueprint Debug Workflow** loop:

```
Diagnose → Implement → Verify → [iterate if needed]
```

Rules for the fix:
- Make **targeted, minimal changes** — address root cause only
- Follow existing code patterns, naming, and architecture
- Add defensive programming where appropriate (null checks, bounds validation)
- Consider edge cases and downstream side effects
- **Never edit files via terminal** — use editor tools

### 6. Verification

After applying the fix:

1. Run the original reproduction steps — bug must be gone
2. Run the **failing tests** that triggered the investigation
3. Run the **full test suite** to catch regressions
4. Test edge cases related to the fix

---

## Phase 4: Quality Assurance

### 7. Code Quality

- Review fix for readability and maintainability
- Add or update tests to prevent regression
- Update documentation or comments if behavior changed
- Scan the codebase for **similar bugs** in adjacent code

### 8. Self-Reflection Rubric

Before marking complete, score the fix internally across all 5 dimensions:

| Dimension | Threshold | Question |
|---|---|---|
| Correctness | ≥ 8 | Does it fully meet the stated requirements? |
| Robustness | ≥ 8 | Does it handle edge cases and invalid inputs? |
| Simplicity | ≥ 8 | Is it free of over-engineering? |
| Maintainability | ≥ 8 | Can another developer easily extend or debug this? |
| Consistency | ≥ 8 | Does it adhere to existing project conventions? |

- All scores must be ≥ 8. Any score < 8 → create a precise, actionable issue and return to the appropriate phase.
- Max 3 iterations. If unresolved → mark `FAILED`, log the root cause, continue.

### 9. Final Report

Deliver a concise summary:

- **What was fixed** and how
- **Root cause** explanation
- **Preventive measures** taken (tests added, guards added)
- **Similar risks** elsewhere in the codebase (if any)

---

## Tool Usage During Debugging

| Task | Preferred Tool |
|---|---|
| Read error output | `#terminalLastCommand`, `#terminalSelection` |
| Run tests | `execute/runTests`, `execute/testFailure` |
| Inspect problems panel | `read/problems` |
| Search code / symbols | `search/usages`, `codebase` search |
| Run terminal command | `execute/runInTerminal` |
| Get terminal output | `execute/getTerminalOutput` |
| Look up library docs | `web/fetch`, Context7 |
| Edit source files | `edit/editFiles` (never via terminal) |

---

## Python-Specific Debugging Practices

### Enable Debug Logging

```python
import logging
import sys

logging.basicConfig(
    level=logging.DEBUG,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.StreamHandler(sys.stdout),
        logging.FileHandler('debug.log')
    ]
)

# Show output during pytest
# Run: pytest -s tests/
```

### Unit Testing with Mocks

```python
import pytest
from unittest.mock import Mock, patch

@pytest.fixture
def mock_client():
    return Mock(spec=MyClient)

def test_create_succeeds(mock_client):
    mock_client.create.return_value = ["id-123"]
    result = create_record(mock_client, {"name": "Test"})
    assert result == "id-123"
    mock_client.create.assert_called_once_with("record", {"name": "Test"})

def test_create_raises_on_error(mock_client):
    mock_client.create.side_effect = ValueError("Conflict")
    with pytest.raises(ValueError):
        create_record(mock_client, {"name": "Test"})
```

### Test Error Handling Paths

```python
def test_handles_not_found(mock_client):
    mock_client.get.side_effect = LookupError("Not found")
    result = get_safe(mock_client, "invalid-id")
    assert result is None  # Should return None, not raise
```

### Mock Retry / Transient Errors

```python
def test_retry_on_transient_failure(mock_client):
    # First call fails, second succeeds
    mock_client.create.side_effect = [TimeoutError("Timeout"), ["id-123"]]
    result = create_with_retry(mock_client, {})
    assert result == "id-123"
    assert mock_client.create.call_count == 2
```

### Run Tests

```bash
# Unit tests with visible output
pytest -s tests/

# Short traceback on failure
pytest --tb=short tests/

# Specific test
pytest tests/test_operations.py::test_create_succeeds

# With coverage
pytest --cov=my_app --cov-report=html tests/

# Only integration tests
pytest -m integration
```

### pytest.ini Configuration

```ini
[pytest]
testpaths = tests
python_files = test_*.py
python_functions = test_*

markers =
    integration: marks tests as integration tests
    unit: marks tests as unit tests
    slow: marks tests as slow
```

---

## Common Debugging Checklist

| Symptom | Debug Steps |
|---|---|
| Test fails unexpectedly | Add `-s` flag to see print/log output; check mock setup |
| Mock method not called | Verify method name and argument signature match exactly |
| Wrong return value | Print actual vs expected; check mock `return_value` |
| Real API failing | Check credentials, URL, permissions, network |
| Rate limiting in tests | Add delays or reduce batch size |
| Record not found | Verify record was created and not cleaned up early |
| Assertion error | Print actual and expected side-by-side before asserting |
| Race condition | Serialize async ops; add explicit awaits; check shared state |
| Off-by-one | Print loop bounds; test with n=0, n=1, n=max |
| Regression introduced | Bisect with `git bisect`; narrow to smallest failing test |

---

## Debugging Anti-Patterns to Avoid

- **Jumping to solutions** before reproducing and understanding the bug
- **Making multiple changes at once** — one change at a time for clear causality
- **Ignoring the stack trace** — the trace almost always points to the root cause
- **Only fixing the symptom** — always find and address the root cause
- **Skipping regression tests** — always run the full suite after a fix
- **Assuming the obvious** — verify every assumption with tools/logs

---

## References

- [pytest Documentation](https://docs.pytest.org/)
- [unittest.mock Reference](https://docs.python.org/3/library/unittest.mock.html)
