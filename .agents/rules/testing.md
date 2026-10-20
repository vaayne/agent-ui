# Testing

Read this before changing tests or user-visible behavior.

- State caller-visible scenarios before implementation. Prefer user-focused Given/When/Then scenarios.
- Use real dependencies and real Chrome. Do not mock modules, patch imports, or add mock libraries. The anti-slop no-module-mocking rule enforces module policy.
- For a regression, keep the test and remove the fix. Prove the failure with the intended assertion, then restore the fix.
- Use recorded public or sanitized inputs. Keep data and processes isolated. Remove fixtures and stop child processes.
- Poll observable conditions with deadlines. Do not use fixed sleeps as correctness evidence.
- Browser evidence belongs in .local/. Record the command, source revision when available, tested build, selected scenarios, failures, and screenshots. Zero selected tests or skipped required scenarios must fail.
- Browser flows cover compositions and keyboard/IME, attachments, Stop, traces, and both themes. Source-package checks cover exports, CSS class scanning, and font assets.
- No coverage percentage is enforced. Generated stock controls are external source and do not have a fabricated 90% gate. Add isolated tests only for complex owned logic. See docs/dev/testing.md for current scope.
- A failure on main is a defect. Record it and fix it or request an issue. Do not label a test flaky without evidence.
- Production tests require explicit authorization, dedicated accounts, and reliable cleanup.
