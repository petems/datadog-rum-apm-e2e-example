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

## Commit & Pull Request Guidelines

- Conventional Commits: `feat:`, `fix:`, `chore:`, `deps:`, `docs:`, `refactor:` (e.g.,
  `deps(deps-dev): bump jest to 30.1.1`).
- Write focused PRs with description, linked issues, and test evidence (coverage summary/E2E
  output).
- For UI changes, run `npm run screenshot` and include updated `docs/screenshots` in the PR.
- Pre-commit runs `lint-staged` and tests via Husky; ensure both pass locally.

## Security & Configuration Tips

- Copy `.env.example` to `.env` (or `just setup`) and set Datadog RUM tokens and service metadata;
  never commit secrets.
- Tracing via `dd-trace` honors env vars in Docker/CI. Keep `config/rum.js` values aligned with
  `package.json` version and deployment env.
