# FinTrack Backend

Backend REST API for **FinTrack — IPO & Personal Money Manager**, a shared financial tracker used by two people, Deepak and Aman. Built with Node.js, Express, TypeScript, and MongoDB/Mongoose.

This repository is **backend only**. The frontend is a separate Next.js PWA that consumes this API over HTTPS with credentialed (cookie-based) requests.

---

## 1. Tech Stack

- Node.js + Express.js + TypeScript
- MongoDB + Mongoose
- Zod for input validation
- JWT stored in an HTTP-only cookie for authentication
- Helmet, CORS, express-rate-limit, express-mongo-sanitize for security
- Winston for structured, secret-redacting logs
- Jest + Supertest + mongodb-memory-server for tests

## 2. Project Structure

```
backend/
├── src/
│   ├── config/        # env validation, database connection
│   ├── controllers/   # thin HTTP layer, calls services
│   ├── services/       # business logic, calculations
│   ├── models/         # Mongoose schemas
│   ├── routes/         # Express routers
│   ├── middlewares/    # auth, validation, error handling, rate limiting
│   ├── validators/     # Zod schemas
│   ├── utils/           # money math, JWT, CSV, logger, ApiError/ApiResponse
│   ├── types/           # shared TS types, Express augmentation
│   ├── constants/       # enums: users, statuses, error codes
│   ├── app.ts            # Express app wiring
│   └── server.ts         # process entrypoint, graceful shutdown
├── scripts/seed.ts       # seeds Deepak, Aman, sample IPOs & money records
├── tests/                # Jest + Supertest integration tests
├── .env.example
├── package.json
└── tsconfig.json
```

Request flow: **Route → Middleware → Controller → Service → Model → MongoDB**. Business logic lives only in `services/`, never in controllers.

## 3. Setup & Installation

### Prerequisites
- Node.js 18+
- A MongoDB instance (local or Atlas)

### Install

```bash
cd backend
npm install
```

### Environment variables

Copy `.env.example` to `.env` and fill in real values:

```bash
cp .env.example .env
```

| Variable | Description |
|---|---|
| `NODE_ENV` | `development`, `production`, or `test` |
| `PORT` | Port the server listens on |
| `FRONTEND_URL` | Exact origin of the Next.js PWA, used for CORS |
| `MONGODB_URI` | MongoDB connection string |
| `DEEPAK_AUTH_CODE` / `AMAN_AUTH_CODE` | Secret login codes for the two users — never logged, never returned by any API |
| `JWT_SECRET` | Signing secret for session JWTs (16+ chars) |
| `JWT_EXPIRES_IN` | Token lifetime, e.g. `7d` |
| `SESSION_SECRET` | Reserved secret for session-related signing (16+ chars) |
| `COOKIE_NAME` | Name of the auth cookie |
| `COOKIE_DOMAIN` | Optional cookie domain (leave blank for host-only) |
| `RATE_LIMIT_*` | General and auth-specific rate limit tuning |

### MongoDB setup

Point `MONGODB_URI` at any MongoDB 6+ instance — local (`mongodb://127.0.0.1:27017/fintrack`) or a hosted cluster (MongoDB Atlas). Indexes are created automatically on model registration in non-production environments; in production, create indexes ahead of time (see section 10) or run once with `autoIndex` enabled.

### Seed data

```bash
npm run seed
```

Seeds the two users (Deepak, Aman), three sample IPOs, and two sample money transactions. Safe to re-run — it clears and re-inserts.

### Development

```bash
npm run dev
```

Runs with `ts-node` + `nodemon`, restarting on file changes.

### Production

```bash
npm run build
npm start
```

`npm run build` compiles TypeScript to `dist/`. `npm start` runs the compiled server (`dist/src/server.js`).

### Testing

```bash
npm test
```

Runs the Jest/Supertest suite against an in-memory MongoDB instance (`mongodb-memory-server`). The first run downloads a MongoDB binary, so it requires outbound internet access; in fully offline/sandboxed CI, point `MONGODB_URI` at a real disposable MongoDB instance instead and adapt `tests/testServer.ts` accordingly.

---

## 4. Authentication Flow

There is **no signup, no email/password, no per-user data isolation**. The only two accounts are `Deepak` and `Aman`, authenticated with a shared-secret auth code configured via environment variables.

1. `POST /api/auth/login` with `{ "user": "Deepak", "authCode": "..." }`.
2. The server compares the submitted code to the configured code for that user using a constant-time comparison (`crypto.timingSafeEqual`) to resist timing attacks.
3. On success, a JWT (`{ name: "Deepak" }`) is signed and set as an **HTTP-only, secure-in-production** cookie. The response body never contains the auth code or the token itself.
4. All other API routes (except `/api/health` and `/api/auth/login`) require this cookie via the `requireAuth` middleware.
5. `POST /api/auth/logout` clears the cookie.
6. `GET /api/auth/me` returns the current session's user.

Auth codes are never logged (the logger redacts known-sensitive keys), never returned by any endpoint, and never embedded in error messages.

## 5. Shared Data Model

**Deepak and Aman see exactly the same data.** There is no per-user filtering anywhere in the codebase — every list/detail endpoint queries the full collection (minus soft-deleted records). Each record still carries a `createdBy` field purely as an attribution/audit trail, not as an access-control boundary.

## 6. API Reference

All responses use the shape:

```json
// success
{ "success": true, "message": "...", "data": { } }

// error
{ "success": false, "message": "...", "errorCode": "SOME_CODE" }
```

List endpoints additionally include a `meta` object: `{ page, limit, total, totalPages }`.

### Auth
| Method | Path | Description |
|---|---|---|
| POST | `/api/auth/login` | Log in as Deepak or Aman |
| POST | `/api/auth/logout` | Clear session cookie |
| GET | `/api/auth/me` | Get current session user |

### IPOs
| Method | Path | Description |
|---|---|---|
| GET | `/api/ipos` | List IPOs. Query: `search, status, dematName, dateFrom, dateTo, year, month, sort, page, limit` |
| GET | `/api/ipos/:id` | Get one IPO with computed financials |
| POST | `/api/ipos` | Create an IPO |
| PUT | `/api/ipos/:id` | Update an IPO |
| DELETE | `/api/ipos/:id` | Soft-delete an IPO |

Every IPO response includes backend-computed fields: `actualInvestment`, `listingValue`, `listingProfitLoss`, `listingProfitPercentage`, `currentValue`, `currentProfitLoss`, `currentProfitPercentage`. Client-supplied values for these fields are always ignored.

### Money & Repayments
| Method | Path | Description |
|---|---|---|
| GET | `/api/money` | List money transactions. Query: `search, type, status, personName, dateFrom, dateTo, year, month, sort, page, limit` |
| GET | `/api/money/:id` | Get one transaction with `totalPaid`, `remainingAmount`, `status` |
| POST | `/api/money` | Create a transaction (`GIVEN` or `BORROWED`) |
| PUT | `/api/money/:id` | Update a transaction |
| DELETE | `/api/money/:id` | Soft-delete a transaction |
| GET | `/api/money/:id/repayments` | List repayments for a transaction |
| POST | `/api/money/:id/repayments` | Add a repayment (rejected if it exceeds the remaining amount) |
| PUT | `/api/repayments/:id` | Update a repayment (re-validated against remaining amount) |
| DELETE | `/api/repayments/:id` | Delete a repayment |

Status is always derived, never stored directly: `PENDING → PARTIALLY_PAID → PAID`, or `OVERDUE` if unpaid past `dueDate`.

### People
| Method | Path | Description |
|---|---|---|
| GET | `/api/people` | Every person with a money transaction, with aggregated totals |
| GET | `/api/people/:name` | One person's `totalGiven`, `totalBorrowed`, `totalReceived`, `totalPaid`, `remainingAmount` |

### Dashboard
| Method | Path | Description |
|---|---|---|
| GET | `/api/dashboard/summary` | Combined IPO + money summary, including net balance |
| GET | `/api/dashboard/ipo` | IPO-only stats |
| GET | `/api/dashboard/money` | Money-only stats (given/borrowed/pending/overdue/net balance) |

### Reports
| Method | Path | Description |
|---|---|---|
| GET | `/api/reports/ipo` | Filtered IPO report with totals |
| GET | `/api/reports/money` | Filtered money report with totals |
| GET | `/api/reports/combined` | Both, in one payload |

Shared filters: `dateFrom, dateTo, year, month, dematName, status`.

### Export (CSV)
| Method | Path | Description |
|---|---|---|
| GET | `/api/export/ipos` | Download all IPOs as CSV |
| GET | `/api/export/money` | Download all money transactions as CSV |
| GET | `/api/export/repayments` | Download all repayments as CSV |
| GET | `/api/export/complete` | Download a single CSV file with all three sections |

### Health
| Method | Path | Description |
|---|---|---|
| GET | `/api/health` | Liveness + DB connectivity, no sensitive detail |

---

## 7. Database Architecture

- **User** — `name` (`Deepak`/`Aman` only, enum-enforced), `isActive`.
- **IPO** — all monetary fields (`applicationAmount`, `applicationPrice`, `allotmentPrice`, `listingPrice`, `currentPrice`) stored as **integer paise**, converted to/from rupees at the service boundary. `dematName` is a plain string, not a separate collection. Soft-delete via `isDeleted/deletedAt/deletedBy`.
- **MoneyTransaction** — `amount` stored as integer paise and never mutated by repayments; `type` is `GIVEN` or `BORROWED`. Soft-delete supported.
- **Repayment** — references a `MoneyTransaction`; `amount` in paise. Repayment total is always checked against the parent's remaining balance before insert/update.
- **AuditLog** — append-only log of `LOGIN, LOGOUT, CREATE_IPO, UPDATE_IPO, DELETE_IPO, CREATE_MONEY, UPDATE_MONEY, DELETE_MONEY, ADD_REPAYMENT, UPDATE_REPAYMENT, DELETE_REPAYMENT` actions, written best-effort (a logging failure never blocks the underlying operation).

No `DematAccount`, `IPOCategory`, or `Notification` models exist, by design.

## 8. Financial Precision

All monetary amounts are persisted as **integer paise** (rupees × 100) and converted to rupee floats only at the API boundary (`src/utils/money.ts`). This avoids floating-point drift in sums, percentages, and profit/loss calculations. Negative amounts are rejected by Zod validation at the request layer and by Mongoose `min` constraints at the schema layer.

## 9. Security

- **Helmet** for security headers.
- **CORS** locked to the single configured `FRONTEND_URL`, with `credentials: true` for cookie-based auth.
- **express-rate-limit**: a general limiter on all `/api` routes, plus a stricter limiter on `/api/auth/login` to slow down auth-code guessing.
- **HTTP-only cookies**, `secure` in production, `sameSite` tuned per environment.
- **express-mongo-sanitize** strips `$`/`.` operators from user input to prevent NoSQL injection.
- All input validated with **Zod** before it reaches a controller.
- Centralized error handler never leaks stack traces or internal error detail in production responses.
- Auth codes, JWT secrets, and Mongo URIs are never logged (the logger redacts a fixed set of sensitive keys) and never appear in any API response.
- Sensitive/financial responses set `Cache-Control: private, no-store, no-cache, must-revalidate`.

## 10. MongoDB Indexes

| Collection | Indexes |
|---|---|
| IPO | `appliedDate`, `status`, `dematName`, `companyName`, `createdAt`, `isDeleted`, text index on `ipoName`/`companyName` |
| MoneyTransaction | `personName`, `type`, `transactionDate`, `dueDate`, `createdAt`, `isDeleted` |
| Repayment | `moneyTransactionId`, `paymentDate` |

## 11. PWA Compatibility

- All authenticated/financial responses are marked `private, no-store` so they are never cached by the browser, a CDN, or a service worker.
- CORS is configured for credentialed requests (`credentials: true`) with a fixed allowed origin, and Express responds correctly to preflight `OPTIONS` requests.
- Cookies use `sameSite: 'none'; secure: true` in production so they work when the Next.js PWA is installed and making cross-site-styled requests over HTTPS, and `sameSite: 'lax'; secure: false` in development over plain HTTP.
- No behavior depends on `User-Agent` sniffing.

## 12. Deployment Notes

1. Set `NODE_ENV=production` and provide all secrets via your platform's environment variable store — never commit `.env`.
2. Ensure `FRONTEND_URL` exactly matches the deployed PWA's origin (scheme + host, no trailing slash).
3. Use a managed MongoDB instance (e.g. Atlas) and restrict network access to your backend's egress IPs.
4. Run `npm run build && npm start`, or containerize with a standard multi-stage Node.js Dockerfile.
5. Put the service behind HTTPS (via your platform or a reverse proxy) — `secure` cookies require it.
6. `app.set('trust proxy', 1)` is already configured for a single reverse-proxy hop; adjust if you have more hops.

## 13. What This Backend Deliberately Does Not Include

Per the product spec, the following are intentionally absent:
- Public signup or email/password authentication
- Per-user data isolation (all data is shared between Deepak and Aman)
- A `DematAccount` collection (demat name is a plain string field)
- An IPO category system
- Any notification system (model, API, or delivery mechanism)
