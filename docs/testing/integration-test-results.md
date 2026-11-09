# Section 7.1 — Integration Testing

**Final result: 44 tests run, 44 Pass, 0 Fail, 0 skipped** (final run, November 9, 2026, 15:10, after all fixes)

**Evidence:**
- Final run: [`evidence/final-integration-test-output.txt`](evidence/final-integration-test-output.txt)
- Before the fix: [`evidence/integration-test-output.txt`](evidence/integration-test-output.txt) and [`evidence/regression-run-output.txt`](evidence/regression-run-output.txt). Both show **43 Pass, 1 Fail** (INT-08f, DEF-02).

## How we tested

Each test sends a real HTTP request to the server. The request goes through the route, the login and role checks, and the database model, and is saved in a local test MongoDB database. After each request, the test also reads the database directly to confirm what was actually saved.

**Main integration path:** request → `app.js` → `authMiddleware` → `roleMiddleware` → route handler or `authController` → Mongoose model → MongoDB

## Results

| ID | Area | What was checked | Tests | Result |
| -- | ---- | ---------------- | ----- | ------ |
| INT-01 | Registration | Account is created with a hashed password; missing fields and duplicate emails are rejected; a `role` in the request is ignored | 4 | Pass |
| INT-02 | Login and tokens | Token holds the right user ID and role and lasts 1 hour; wrong password and unknown email get the same error; bad, forged, and expired tokens are rejected | 5 | Pass |
| INT-03 | Submit ticket | Ticket saved as Open under the logged-in student (not whatever student ID is sent in the request); empty fields rejected; staff and anonymous users blocked | 4 | Pass |
| INT-04 | Student ticket list | Each student gets only their own tickets; a student with no tickets gets an empty list; staff blocked | 3 | Pass |
| INT-05 | Staff ticket list | Staff get all tickets with the student's email and no passwords; students blocked | 2 | Pass |
| INT-06 | Status updates | Open → In Progress → Closed is saved; invalid statuses and IDs are rejected; students blocked | 5 | Pass |
| INT-07 | Resolution notes | Note saved and ticket closed; notes of 0 or 2,001 characters rejected, 2,000 accepted; already closed tickets rejected; student can read the note | 6 | Pass |
| INT-08 | Reopening | Owner can reopen with an explanation; missing explanation, other students, staff, Open tickets, and malformed IDs are rejected | 6 | Pass after the fix (INT-08f failed before, see DEF-02) |
| INT-09 | Comments | Students comment on their own open tickets; staff comment on any ticket; other students and closed tickets are blocked for students; length limits work | 7 | Pass |
| INT-10 | Filter and overview data | Status counts from the API match the database | 2 | Pass |

## Coverage

During the saved run (before the fixes), the integration tests ran 91% of the lines in `ticketRoutes.js`. The lines that did not run were mostly database-error handlers, which are hard to trigger against a real database, plus the unreachable code listed as M-03 and M-04 in Section 8.
