# Section 6 — Unit and White-Box Testing

**Result: 27 run, 27 Pass, 0 Fail** (final run, November 9, 2026, 15:10)
**Evidence:** [`evidence/final-unit-test-output.txt`](evidence/final-unit-test-output.txt). The coverage report is in [`evidence/unit-test-output.txt`](evidence/unit-test-output.txt) (earlier run, also 27/27).

## 6.1 Modules tested

| Module | Tests | What we checked |
| ------ | ----- | --------------- |
| `authMiddleware.js` | 5 | Valid token accepted; missing, badly formatted, invalid, and expired tokens rejected |
| `roleMiddleware.js` | 3 | Staff allowed on staff routes; students and users with no role blocked |
| `authController.js` → `registerUser` | 6 | Valid sign-up, missing fields, duplicate email, password hashed, password never returned, database error |
| `authController.js` → `loginUser` | 6 | Token has the correct user ID and role; wrong password and unknown email get the same error; missing fields; database error |
| `Ticket.js` model | 7 | Defaults to Open; missing title and blank description rejected; only allowed statuses accepted; comments limited to 2,000 characters |

## 6.2 Techniques

- **Equivalence partitioning:** inputs grouped into valid and invalid classes (for example, token states and login inputs), with one test per class.
- **Boundary values:** comments of exactly 2,000 characters (accepted) and 2,001 characters (rejected).
- **Branch (white-box) testing:** every `if`/`else` path in the middleware and auth controller runs at least once, including database-error paths.
- **Mocking:** controller tests use a fake `User` model, so no database is needed.

## 6.3 Coverage

| File | Lines | Branches |
| ---- | ----- | -------- |
| `authController.js`, `authMiddleware.js`, `roleMiddleware.js`, `Ticket.js`, `User.js` | 100% | 100% |
| `ticketRoutes.js` | Covered by integration tests instead: 91% | 84% |

The `ticketRoutes.js` figures come from the earlier integration run ([`evidence/integration-test-output.txt`](evidence/integration-test-output.txt)).
