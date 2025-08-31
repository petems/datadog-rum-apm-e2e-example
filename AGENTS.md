# Repository Guidelines

## Project Structure & Module Organization

- `app.js` / `bin/www`: Express app and HTTP server entry.
- `controllers/`, `routes/`: Feature logic and route maps.
- `config/`: Runtime config (e.g., `rum.js`).
- `mongo/`: Models and DB setup.
- `views/`, `public/`: EJS templates and static assets.
- `scripts/`: Dev helpers (`seed-data.js`, `screenshot.js`).
- `test/e2e/`: Playwright specs; Jest unit tests like `app.test.js` live near sources.
- `docs/`: Extra docs and screenshots.

## Build, Test, and Development Commands

- Start app: `npm start` (runs `node ./bin/www`).
- Unit tests: `npm test` | watch: `npm run test:watch` | coverage: `npm run test:coverage`.
- E2E: `npm run test:e2e` (UI mode: `npm run test:e2e:ui`).
- Lint/format: `npm run lint`, `npm run lint:fix`, `npm run format`, `npm run format:check`.
- Just shortcuts: `just setup`, `just dev-check`, `just start`, `just test-e2e`.
- Local infra: `docker-compose up -d` (or `just up`), `just mongo-start`.

## Coding Style & Naming Conventions

- Node 22+, CommonJS. 2-space indent, single quotes, semicolons.
- Prettier and ESLint (flat config) are enforced; fix with `npm run lint:fix` and `npm run format`.
- Files: lowerCamelCase for modules (e.g., `pageModel.js`); kebab-case for scripts/docs.
- Keep handlers small, use async/await, avoid side effects in modules.

## Testing Guidelines

- Frameworks: Jest (unit/integration) and Playwright (E2E).
- Naming: `*.test.js` next to code or at repo root (e.g., `app.test.js`).
- Before PRs: run `npm run test:coverage`; aim to maintain or increase coverage.
- E2E rely on `playwright.config.js`; ensure app is running or use Playwright’s server config.

## Branch Strategy & Naming

- Base branch: `main`.
- Prefix branches by intent: `feature/`, `fix/`, `chore/`, `deps/`, `docs/`, `refactor/`, `perf/`, `test/`, `build/`, `ci/`, `release/`.
- Format: `type/short-slug` or `type/<issue-number>-short-slug` or `type/scope/short-slug`.
- Slug: kebab-case, imperative mood, 3–6 words max.
- Examples:
  - `feature/add-user-roles`
  - `fix/1234-handle-null-session`
  - `deps/update-jest-to-30-1-1`
  - `refactor/api/flatten-error-handling`

## Commit & Pull Request Guidelines

- Conventional Commits: use `type(scope)!: short summary`.
  - Types: `feat`, `fix`, `chore`, `deps`, `docs`, `refactor`, `perf`, `test`, `build`, `ci`, `revert`.
  - Summary: present tense, lower case, ≤ 72 chars.
  - Body (optional): explain the what and why; wrap at 100 cols.
  - Footer (when applicable): `BREAKING CHANGE: ...`, `Closes #123`, `Refs #456`.
- Keep commits focused; one logical change per commit. Squash locally if needed to keep history clean.
- Prefer squash-merge; use a Conventional Commit-style PR title so the squashed commit is well-formed.
- Write focused PRs with a clear description, linked issues, and test evidence (coverage summary/E2E output).
- For UI changes, run `npm run screenshot` and include updated `docs/screenshots` in the PR.
- Pre-commit runs `lint-staged` and tests via Husky; ensure both pass locally.

### Commit message examples

```
feat(auth): add role-based access control

Introduce RBAC middleware for route protection and UI checks.

Closes #123
```

```
fix(session): handle null user in serializer

Avoids crash when session cookie is present but user is deleted.

Refs #456
```

```
deps(dev): bump jest to 30.1.1

Keeps in sync with esm transforms and ts-jest peer range.
```

### Pull request titles and descriptions

- Title: follow Conventional Commits when possible, e.g., `feat(auth): add RBAC`.
- Description: use the template below. Keep it concise but complete.

PR description template (copy into the PR):

```
Summary
Briefly state what this PR does and why.

Motivation
What problem does this solve? Link to any design notes or discussion.

Changes
- High-level bullet points of the changes
- Include any schema or API changes

Screenshots
If UI changed, include before/after or run `npm run screenshot` and attach updated images from docs/screenshots.

Tests
- Unit: add/updated tests and coverage summary
- E2E: list Playwright scenarios or attach run output

Breaking changes
State `None` or describe migration notes; include `BREAKING CHANGE:` if applicable.

Linked issues
Closes #123, Refs #456

Checklist
- [ ] Follows branch naming conventions
- [ ] Conventional Commit title
- [ ] Tests added/updated and passing (`npm run test:coverage`)
- [ ] Lint/format clean (`npm run lint && npm run format:check`)
- [ ] Screenshots updated (if UI)
```

## Security & Configuration Tips

- Copy `.env.example` to `.env` (or `just setup`) and set Datadog RUM tokens and service metadata;
  never commit secrets.
- Tracing via `dd-trace` honors env vars in Docker/CI. Keep `config/rum.js` values aligned with
  `package.json` version and deployment env.
