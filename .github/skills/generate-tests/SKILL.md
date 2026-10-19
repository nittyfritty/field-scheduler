---
name: express-ts-test-generator
description: "Use when creating, extending, or repairing unit and integration tests for this TypeScript Express API. Covers Vitest or Jest, Supertest, Mongoose isolation, route validation, authentication, and error responses."
---

# Express TypeScript API Test Generator

## Purpose and When to Use

Write reliable, repeatable unit and HTTP integration tests for the Express API in `backend/`. Use this skill when adding endpoint coverage, testing middleware or models, fixing failing backend tests, or establishing the backend test setup.

Before writing tests, inspect the source and package configuration relevant to the behavior under test. Keep tests aligned with the actual application wiring and response contracts; do not treat a route file as reachable through the application unless it is mounted.

## Repository Profile

The backend is an ESM TypeScript project under `backend/`:

- TypeScript uses `NodeNext` modules, strict type checking, and `.js` extensions in relative imports.
- Express 5 is used for the HTTP API.
- Mongoose is the database layer. Models include `Calendar`, `User`, and `Field`.
- Routes are in `backend/src/routes/`; middleware is in `backend/src/middleware/`.
- `backend/src/app.ts` exports the Express app and currently mounts `/api/calendar`.
- `auth.ts` and `admin.ts` route modules exist, but are not currently mounted by `app.ts`. Verify route wiring before writing app-level tests for them.
- `backend/src/middleware/errorHandler.ts` exports an error handler that responds with a JSON `{ "message": ... }` body, but `app.ts` does not currently register it. Do not claim application-level global-handler coverage until it is wired into the app.
- The backend currently has no configured test runner or Supertest dependency. Its `test` script is a placeholder that exits with an error. Establish the test setup before relying on a test command.
- There are no TypeScript path aliases in the current `backend/tsconfig.json`. Do not add alias support unless aliases are introduced.

Treat this profile as a starting point, not a substitute for checking the current source. If repository structure or behavior has changed, follow the code that exists now.

## 1. Architecture & Framework Setup

Use **Vitest** as the preferred test runner for this ESM TypeScript backend, or use **Jest** if it is already the project standard. Configure TypeScript support with the matching toolchain:

- For Vitest, use Vite’s TypeScript handling and `vite-tsconfig-paths` when the project defines TypeScript path aliases. This backend currently has no aliases, so the plugin is not needed unless that changes.
- For Jest, use `ts-jest` with configuration appropriate for the project’s ESM and `NodeNext` setup.
- Use **Supertest** for HTTP assertions against an Express app without opening a network port.
- Add or update the backend `test` script so it runs the selected test runner; replace the existing placeholder when establishing this setup.
- Keep test configuration and dependencies scoped to `backend/`. Do not modify the unrelated frontend examples in the repository.

Test the exported app directly, for example by passing it to Supertest. Do not import `server.ts`, start `app.listen()`, call `connectDB()`, or require a running MongoDB instance from a test. Keep startup and database connection concerns separate from the app so HTTP tests can remain isolated.

The source uses ESM-style relative imports ending in `.js`; preserve that convention in test imports where needed for the configured runner.

## 2. Strict Mocking Guidelines

All tests must be fast, deterministic, and isolated from real infrastructure.

- Mock **every external network call**, third-party API, email/SMS provider, filesystem service, and other external side effect. No test may make a real outbound request.
- Mock **all database access**. In this project, mock the Mongoose model and connection boundaries; never connect to a real MongoDB server or depend on seeded/shared data.
- Apply the same rule to Prisma, TypeORM, or other database layers if they are added later.
- For route tests, use the real Express app and middleware where practical while mocking the model/service boundary. This verifies HTTP behavior without coupling the test to a live database.
- For unit tests, isolate the single function or middleware under test and mock only its collaborators.
- Use the selected runner’s typed mocking APIs (`vi.mock`, `vi.mocked`, `jest.mock`, or `jest.mocked`). Consider `vitest-mock-extended` or `jest-mock-extended` for interfaces and service dependencies.
- Mongoose models are classes and have model-specific APIs. Mock the methods and constructor behavior the code actually uses; do not assume a generic deep mock accurately reproduces a Mongoose model.
- Reset or restore mocks between tests. Make each test’s mock return values explicit, including rejection paths.
- Do not use a test-only database, a shared test database, or mocked HTTP responses as evidence that the production app is wired correctly.

If an endpoint cannot be tested through the exported app because it is not mounted, report that wiring gap. Do not create a separate test-only app and present it as proof that the production route is reachable.

## 3. Folder & File Naming Conventions

Place backend tests alongside the source they cover using `*.test.ts`, or use a designated `__tests__/` directory. Keep tests within `backend/src/`; do not put backend tests under `frontend/`.

Preferred examples:

- `backend/src/routes/calendar.test.ts`
- `backend/src/middleware/errorHandler.test.ts`
- `backend/src/routes/__tests__/calendar.test.ts`

Use descriptive `describe` and `it`/`test` names that state the behavior and outcome. Group route tests by endpoint and scenario. Keep fixtures and test helpers small, typed, and close to their consumers; promote them to shared test utilities only when multiple test files need them.

## 4. Error Handling & Edge Cases

For every relevant endpoint and middleware path, cover expected behavior as well as failure behavior. Explicitly test these status classes wherever applicable:

- **400 Bad Request:** invalid, missing, malformed, or boundary-case input. For the existing `validate` middleware, assert the response uses its current `{ "errors": [...] }` JSON shape and contains useful validation details.
- **401 Unauthorized:** missing, malformed, expired, or otherwise invalid credentials. Existing auth middleware responds with a `{ "message": ... }` JSON body.
- **403 Forbidden:** an authenticated user without the required role or permission. Existing admin authorization responds with a `{ "message": ... }` JSON body.
- **404 Not Found:** a well-formed request for a resource that does not exist. Assert the endpoint’s documented `{ "message": ... }` response.
- **500 Internal Server Error:** an unexpected dependency or handler failure. Verify the response status and the JSON shape produced by the applicable error path. The current global handler’s response shape is `{ "message": ... }`.

Also test successful status codes and response bodies, malformed JSON where relevant, and boundary conditions such as empty collections, duplicate records, and rejected database operations where the endpoint supports them. Assert status, content type, and meaningful response fields; avoid snapshots that obscure the contract.

The global error handler must be tested directly and through the application’s error path:

1. Unit-test `errorHandler` for a generic error and any mapped database errors that the handler supports.
2. Assert that the response is valid JSON with the expected `{ "message": ... }` shape and does not expose a stack trace.
3. Add an app-level test proving an error reaches the handler only after the handler is registered after routes and middleware.
4. The current `app.ts` does not register `errorHandler`. Treat that as an application wiring gap: do not write a passing app-level test by manually attaching the handler in a test-only app. If the task includes fixing app wiring, register it in the production app and test that actual app.

Do not silently change a response contract just to make a test pass. If the current handler, route, or app wiring cannot satisfy a required scenario, make the discrepancy explicit and change production behavior only when that is within the task’s scope.

## 5. Typing Strictness

Keep test code compatible with the backend’s strict TypeScript settings.

- Do not use `any`, including in mock implementations, fixture builders, request payloads, or test helpers.
- Prefer the source interfaces and types, TypeScript utility types (`Pick`, `Partial`, `ReturnType`, `Parameters`), typed fixtures, and the mocking library’s typed helpers.
- Use `unknown` for values whose type is not known, then narrow them with guards before accessing properties.
- Type mocked model results and method arguments according to the code under test. Avoid broad casts that conceal incompatible test data.
- Do not weaken `tsconfig.json` or disable type checking to make tests compile.
- Include type checking in validation when the test setup affects TypeScript compilation.

## 6. Test Workflow

For each change:

1. Inspect the relevant route, middleware, model/service, app wiring, and current package scripts.
2. Identify the public HTTP contract and the dependency boundary to mock.
3. Add the smallest set of unit and Supertest integration tests that verifies the requested behavior, including applicable error and authorization cases.
4. Run the focused test file(s), then the backend test suite when practical.
5. Run `npm run type-check` from `backend/` to catch test and source type errors. Run the build if the change affects module or build configuration.
6. Report commands run, pass/fail results, and any uncovered application wiring gaps. Never describe tests as passing if they were not executed.

## 7. Project-Specific Response Contracts to Verify

Use the actual route and middleware implementation as the source of truth. At the time this skill was written:

- Validation failures from `validate` respond with status 400 and `{ "errors": [...] }`.
- Authentication failures generally respond with status 401 and `{ "message": ... }`.
- Admin authorization failures respond with status 403 and `{ "message": ... }`.
- Several route-level not-found responses use status 404 and `{ "message": ... }`.
- The global error handler responds with `{ "message": ... }`, maps duplicate-key errors to 409, maps Mongoose cast errors to 400, and otherwise defaults to 500.
- Calendar routes are mounted under `/api/calendar`; auth and admin route modules are not currently reachable through `app.ts`.

Recheck these contracts before adding assertions. If implementation changes, update the tests to verify the new intended contract rather than preserving stale expectations.