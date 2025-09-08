# Repository Guidelines

## Agent Workflow (Codex CLI / Claude)

- Planning: use `update_plan` for multi-step work; keep exactly one step `in_progress` until done.
- Preambles: before tool calls, add a brief 1–2 sentence note grouping related actions.
- Editing: use `apply_patch`; keep changes minimal, focused, and consistent with existing style.
- Shell usage: prefer `rg` for search; read files in ≤250-line chunks to avoid truncation.
- Validation: run targeted tests where appropriate; don’t “fix” unrelated failing tests.
- Commits: follow Conventional Commits; stage only related files; avoid bundling unrelated diffs.
- Secrets: never commit secrets; use `.env.example` and local `.env` only.
- Tone & format: concise, direct, friendly; avoid heavy formatting unless necessary for clarity.
- PRs: use the template in this document; attach screenshots for UI changes.

Related docs: see `README.md` and `docs/DEVELOPMENT.md` for workflows, commands, and architecture.

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
- Use mockingoose to stub Mongoose models so unit tests run without MongoDB.
- Naming: `*.test.js` next to code or at repo root (e.g., `app.test.js`).
- Before PRs: run `npm run test:coverage`; aim to maintain or increase coverage.
- E2E rely on `playwright.config.js`; ensure app is running or use Playwright's server config.

## Branch Strategy & Naming

- Base branch: `main`.
- Prefix branches by intent: `feature/`, `fix/`, `chore/`, `deps/`, `docs/`, `refactor/`, `perf/`,
  `test/`, `build/`, `ci/`, `release/`.
- Format: `type/short-slug` or `type/<issue-number>-short-slug` or `type/scope/short-slug`.
- Slug: kebab-case, imperative mood, 3–6 words max.
- Examples:
  - `feature/add-user-roles`
  - `fix/1234-handle-null-session`
  - `deps/update-jest-to-30-1-1`
  - `refactor/api/flatten-error-handling`

## Commit & Pull Request Guidelines

- Conventional Commits: use `type(scope)!: short summary`.
  - Types: `feat`, `fix`, `chore`, `deps`, `docs`, `refactor`, `perf`, `test`, `build`, `ci`,
    `revert`.
  - Subject: present tense, lower case, max 72 chars.
  - Separation: add a blank line between the subject and the body.
  - Body: use `*` bullet points, max 5 bullets; each line ≤ 100 chars; focus on the why/what.
  - Footer (when applicable): plain lines like `BREAKING CHANGE: ...`, `Closes #123`, `Refs #456`
    after a blank line.
- Keep commits focused; one logical change per commit. Squash locally if needed to keep history
  clean.
- Prefer squash-merge; use a Conventional Commit-style PR title so the squashed commit is
  well-formed.
- Write focused PRs with a clear description, linked issues, and test evidence (coverage summary/E2E
  output).
- For UI changes, run `npm run screenshot` and include updated `docs/screenshots` in the PR.
- Pre-commit runs `lint-staged` and tests via Husky; ensure both pass locally.

### Commit message examples

```
feat(auth): add role-based access control

* add RBAC middleware for protected routes
* enforce permissions in UI components
* introduce basic roles: admin and user
* update docs for auth behavior
* add tests covering role checks

Closes #123
```

```
fix(session): handle null user in serializer

* prevent crash when cookie exists but user was deleted
* safely return anonymous session instead of throwing
* add guard in serializer to handle null user
* include regression test for null-user path
* document behavior in session README

Refs #456
```

```
deps(dev): bump jest to 30.1.1

* align with esm transforms
* match ts-jest peer dependency range
* update lockfile and scripts
```

### Pull request titles and descriptions

- Title: follow Conventional Commits when possible, e.g., `feat(auth): add RBAC`.
- Description: use the template below. Keep it concise but complete.
- Formatting: write multi-line Markdown; do not include literal `\n`. Use real blank lines between
  sections and standard lists/checkboxes.

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
