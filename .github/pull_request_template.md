<!--
Formatting: write multi-line Markdown; do not include literal "\n".
Use real blank lines between sections and standard lists/checkboxes.

Title: follow Conventional Commits when possible, e.g., feat(auth): add RBAC
-->

## Summary

Briefly state what this PR does and why.

## Motivation

What problem does this solve? Link to any design notes or discussion.

## Changes

- High-level bullet points of the changes
- Include any schema or API changes

## Screenshots

If UI changed, include before/after or run `npm run screenshot` and attach updated images from
docs/screenshots.

## Tests

- Unit: add/updated tests and coverage summary
- E2E: list Playwright scenarios or attach run output

## Breaking changes

State `None` or describe migration notes; include `BREAKING CHANGE:` if applicable.

## Linked issues

Closes #123, Refs #456

## Checklist

- [ ] Follows branch naming conventions
- [ ] Conventional Commit title
- [ ] Tests added/updated and passing (`npm run test:coverage`)
- [ ] Lint/format clean (`npm run lint && npm run format:check`)
- [ ] Screenshots updated (if UI)

<!--
Correct example (no escaped newlines):

This PR moves security-specific scans into a dedicated workflow.

Changes
- Add consolidated security-scans.yml (CodeQL, Gitleaks, nodejsscan, Hadolint, Trivy, Actionlint)
- Remove security jobs from node-ci.yml; keep docker-build for e2e dependency
- Remove old security workflows (codeql.yml, secret-scan.yml, njsscan.yml)

Notes
- Nikto and ZAP remain separate due to runtime stack requirements; can merge later if desired.
- All YAML validated locally.

Checklist
- [x] Conventional Commit title
- [x] Lint/format unaffected; CI intact
- [x] Security scans upload SARIF to code scanning
-->
