# Contributing to @toglelabs/casl-drizzle-adapter

Thank you for contributing! This package is **security-sensitive**, so we have strict rules.

## Rules

1.  **Safety First**:
    *   Fail closed (throw error) on unknown inputs.
    *   Never silently ignore unsupported features.
    *   Preserve CASL semantics strictly: `(ALLOW OR ALLOW) AND NOT (DENY OR DENY)`.
    *   `cannot` always overrides `can`.

2.  **Code Quality**:
    *   All changes must pass tests.
    *   New features require new tests.
    *   Do not change authorization semantics without prior discussion.

3.  **Process**:
    *   Open an issue first for significant changes.
    *   PRs must include a Changeset.
    *   PRs must pass CI (Lint, Typecheck, Test).

## Pull Requests

1.  **Tests**: Required for all behavior changes.
2.  **Changesets**: Run `npm run changeset` or `npx changeset` to generate a changelog entry.
3.  **Semver**:
    *   **patch**: Bugfixes, docs.
    *   **minor**: New operators, compatible features.
    *   **major**: Breaking changes, semantic modifications.

> **CRITICAL**: Authorization-semantic changes require prior discussion and likely a MAJOR version bump.

## Development

1.  Install dependencies: `npm install`
2.  Run tests: `npm test`
3.  Lint: `npm run check`

Thank you for keeping this package secure!
