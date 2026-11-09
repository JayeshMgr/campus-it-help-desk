# Section 6 — Unit and White-Box Testing

**Result: 27 tests run, 27 Pass, 0 Fail, 0 skipped** (final run, November 9, 2026, 15:10)
**Evidence:** [`evidence/final-unit-test-output.txt`](evidence/final-unit-test-output.txt). Earlier runs that day also passed 27/27: see [`evidence/unit-test-output.txt`](evidence/unit-test-output.txt), which includes the coverage report.

## 6.1 Modules tested

| Module | Tests | What we checked |
| ------ | ----- | --------------- |
| `authMiddleware.js` | 5 | A valid token is accepted. Missing, badly formatted, invalid, and expired tokens are rejected |
| `roleMiddleware.js` | 3 | Staff can use staff routes. Students and users with no role are blocked |
| `authController.js` → `registerUser` | 6 | Valid sign-up, missing fields, duplicate email, password is hashed, password is never returned, database error |
| `authController.js` → `loginUser` | 6 | Valid login returns a token with the right user ID and role. Wrong password and unknown email get the same error. Missing fields and database errors are handled |
| `Ticket.js` model | 7 | A valid ticket defaults to Open. A missing title or a blank description is rejected. Only allowed statuses are accepted. Comments can be at most 2,000 characters |

## 6.2 Techniques used

- **Equivalence partitioning:** we grouped inputs into valid and invalid groups (for example, token states and login inputs) and tested one example from each group.
- **Boundary value analysis:** we tested comment lengths of exactly 2,000 characters (accepted) and 2,001 characters (rejected).
- **Branch (white-box) testing:** we wrote tests so that every `if`/`else` path in the middleware and the auth controller runs at least once, including the database-error paths.
- **Mocking:** the controller tests use a fake `User` model, so no database is needed.

## 6.3 Coverage

| File | Line coverage | Branch coverage |
| ---- | ------------- | --------------- |
| `authController.js`, `authMiddleware.js`, `roleMiddleware.js`, `Ticket.js`, `User.js` | 100% | 100% |
| `ticketRoutes.js` (all ticket routes) | Not unit tested; covered by integration tests (91% of lines, 84% of branches) | |

The 100% figure only applies to the five files the unit tests load. The ticket routes are tested at the integration level instead (see Section 7).

The coverage run helped us find code that could never run (maintainability findings M-03 and M-04, see Section 8).
