Act as a senior Node.js backend engineer. Build a **complete authentication feature** for a REST API
using **Express + MongoDB (Mongoose) + JWT** in **JavaScript ESM** (no TypeScript).

### Parameters (defaults if omitted)

- `{roles}` = ["user","admin"]
- `{seed_admin}` = false
- `{cors_origin}` = "http://localhost:5173"
- `{access_ttl}` = "15m"
- `{refresh_ttl}` = "7d"
- `{password_policy}` = "min 8 chars; at least 1 letter & 1 number"

### Functional Requirements

- Routes:
  - `POST /api/auth/register` — Zod-validate body; enforce `{password_policy}`; hash with
    **bcryptjs** (12 rounds); store `{ email, passwordHash, role:"user" }`.
  - `POST /api/auth/login` — verify credentials; issue **access token** (Authorization Bearer) and
    **refresh token** (HttpOnly cookie).
  - `POST /api/auth/refresh` — **rotate** refresh token on every call; **detect and handle reuse**;
    bump `tokenVersion` to revoke compromised sessions.
  - `POST /api/auth/logout` — clear cookie and invalidate session (`tokenVersion`++).
  - `GET /api/auth/me` — return `{ id, email, role }` using `authenticate`.
  - `GET /api/protected` — example protected route; show `authorize(["admin"])`.

### Security & Platform

- Add `helmet`, `cors` (origin = `{cors_origin}`, credentials = true), `cookie-parser`,
  `express-rate-limit` for `/login` and `/register`.
- Disable `x-powered-by`; sanitize inputs; constant-time password comparison; never log
  secrets/tokens.
- Cookies: `HttpOnly`, `SameSite="strict"`, `Secure = NODE_ENV === "production"`. Document dev
  tweaks (`SameSite:lax`, `Secure:false`).

### Persistence

- Mongoose `User` schema: `_id`, `email` (lowercase, unique, index), `passwordHash`, `role`,
  `tokenVersion` (Number, default 0), timestamps.

### Config & Env

- Use `dotenv`. Provide `.env.example` with:

```
PORT=3000
MONGODB\_URI=mongodb://localhost:27017/app
JWT\_ACCESS\_SECRET=change-me
JWT\_REFRESH\_SECRET=change-me-too
ACCESS\_TOKEN\_TTL={access\_ttl}
REFRESH\_TOKEN\_TTL={refresh\_ttl}
CORS\_ORIGIN={cors\_origin}
NODE\_ENV=development
```

### Project Layout (ESM)

```
src/
app.mjs
server.mjs
routes/auth.routes.mjs
controllers/auth.controller.mjs
middlewares/authenticate.mjs
middlewares/authorize.mjs
middlewares/errorHandler.mjs
middlewares/rateLimiter.mjs
models/user.model.mjs
schemas/auth.schema.mjs
utils/jwt.mjs
utils/password.mjs
utils/cookies.mjs
config/env.mjs
tests/auth.e2e.test.mjs
.env.example
README.md
package.json  // include: { "type": "module", "scripts": { "dev":"node --watch src/server.mjs", "test":"node --test --experimental-test-coverage" } }
```

### Token Strategy

- Access token: sign with `JWT_ACCESS_SECRET`, TTL `{access_ttl}`.
- Refresh token: sign with `JWT_REFRESH_SECRET`, TTL `{refresh_ttl}`; store **only** in HttpOnly
  cookie; **rotate** on refresh; **reuse detection** invalidates session (bump `tokenVersion`).

### Deliverables

- All implementation code in **JavaScript ESM** (no TypeScript).
- Middleware: `authenticate`, `authorize`, `rateLimiter`, `errorHandler`.
- Utils: `jwt.mjs` (sign/verify), `password.mjs` (hash/verify), `cookies.mjs` (set/clear refresh).
- Zod schemas for payloads (or `express-validator` if Zod unavailable).
- Example `.env.example`, README with setup and `curl` examples.
- **node:test + supertest** examples for register/login/refresh.
- Optional seeding when `{seed_admin}=true` (create admin without printing raw password; include CLI
  or reset instructions).

### Quality & Style

- Idiomatic Express; minimal modules with clear concerns.
- Production-safe error JSON: `{ code, message, details? }`.
- JSDoc comments where useful; no stack traces in prod responses.
- If any parameter is missing, **use defaults and document them inline**.

**Generate now using the parameters I provide; otherwise use the defaults.**
