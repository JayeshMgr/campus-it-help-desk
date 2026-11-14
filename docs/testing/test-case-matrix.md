# Section 5 — Test Design and Requirements Coverage

Test cases were designed from the SRS requirements. Most test cases are backed by one or more automated tests; TC-24 (usability), TC-26 (teammate compatibility), and TC-27 (code review) are manual checks.
Unit = [unit-test-results.md](unit-test-results.md), INT = [integration-test-results.md](integration-test-results.md), SYS = [system-test-results.md](system-test-results.md), NFR = [nonfunctional-test-results.md](nonfunctional-test-results.md).

**Summary:** 27 detailed test cases: **26 Pass**, **1 Partially Verified** (TC-27, maintainability review), **0 Not Run**.
**12 negative, boundary, or exception cases:** TC-02, 04, 05, 06, 08, 12, 14, 17, 18, 19, 21, 22.

## 5.1 Requirements coverage

| ID | Requirement (priority) | Test cases | Status | Evidence |
| -- | ---------------------- | ---------- | ------ | -------- |
| FR-01 | Student registration (Must) | TC-01, TC-02, TC-06 | Verified | INT-01; SYS-01, SYS-02 |
| FR-02 | Login for registered users (Must) | TC-03, TC-04 | Verified | INT-02; SYS-03, SYS-04, SYS-08 |
| FR-03 | Student submits a ticket (Must) | TC-07 | Verified | INT-03; SYS-05 |
| FR-04 | Student and staff accounts are distinguished (Must) | TC-05, TC-06 | Verified | Unit (auth, role); INT-01d, 03d, 05b, 06e; NFR-04a |
| FR-05 | Student views own tickets and status (Must) | TC-09, TC-11 | Verified | INT-04, INT-06a; SYS-07 |
| FR-06 | Staff view all tickets (Must) | TC-10 | Verified | INT-05; SYS-08 |
| FR-07 | Staff add resolution notes (Should) | TC-13, TC-14 | Verified | INT-07; SYS-10 |
| FR-08 | Student views resolution notes (Should) | TC-15 | Verified | INT-07d; SYS-12 |
| FR-09 | Accounts and tickets kept between sessions (Must) | TC-22 | Verified (local test database) | NFR-03a |
| FR-10 | Title, category, and description required (Should) | TC-08 | Verified | Unit (ticket); INT-03c; SYS-06 |
| FR-11 | Staff update status, including Closed (Must) | TC-11, TC-12 | Verified | INT-06; SYS-09, SYS-10 |
| FR-12 | Staff search and filter by category or status (Could) | TC-20 | Partially Verified: status filter works; category filter and keyword search are not implemented | INT-10; SYS-11 |
| NFR-01 | Usability: register, log in, and submit within 5 minutes | TC-24 | Verified | Team-confirmed manual usability test (TC-24) |
| NFR-02 | Performance: actions finish within 5 seconds | TC-23 | Verified | NFR-02a, 02b |
| NFR-03 | Reliability: tickets kept after restart | TC-22 | Verified (local test database) | NFR-03a |
| NFR-04 | Security/privacy: students see only their own tickets | TC-04, 05, 06, 09, 17, 18, 21 | Verified, with known limitations (DEF-03, DEF-05) | INT-02 to INT-09; NFR-04a–f; SYS-14 |
| NFR-05 | Compatibility on team Windows computers | TC-25, TC-26 | Verified (teammate checks are team-reported) | SYS-01–14; NFR-05a |
| NFR-06 | Maintainability: clear naming and comments | TC-27 | Partially Verified: 5 of 10 review findings fixed | [nonfunctional-test-results.md](nonfunctional-test-results.md) |

Ticket reopening (TC-16, TC-17) and comments (TC-18, TC-19) are extra features that are not in the SRS. They were tested because they share the same security rules (NFR-04).

## 5.2 Test cases

| ID | Req. | Type | Test (input) | Expected result | Actual result | Result |
| -- | ---- | ---- | ------------ | --------------- | ------------- | ------ |
| TC-01 | FR-01 | Positive | Register a new student with a valid email and password | Account created as a student; password stored as a hash; sent to login page | As expected | Pass |
| TC-02 | FR-01 | Negative | Register with a missing email, missing password, or an existing email | Error shown; no account created | As expected | Pass |
| TC-03 | FR-02 | Positive | Log in as a student and as staff | Each role goes to its own dashboard | As expected | Pass |
| TC-04 | FR-02, NFR-04 | Negative | Log in with a wrong password, then an unknown email | Same "Invalid credentials" message; not logged in | As expected | Pass |
| TC-05 | FR-04, NFR-04 | Negative | Use protected routes with a missing, expired, fake, or edited token | All rejected (401) | All rejected | Pass |
| TC-06 | FR-01, FR-04, NFR-04 | Negative | Student tries staff actions; staff try student actions; sign up with `role: staff` | Wrong-role actions rejected (403); sign-up still creates a student | As expected | Pass |
| TC-07 | FR-03 | Positive | Student submits a ticket with title, category, and description | Ticket saved as Open under that student | As expected | Pass |
| TC-08 | FR-10 | Boundary | Submit with an empty or spaces-only title, category, or description | Ticket rejected; nothing saved | As expected | Pass |
| TC-09 | FR-05, NFR-04 | Positive | Two students each view their ticket list | Each sees only their own tickets | As expected | Pass |
| TC-10 | FR-06 | Positive | Staff open the dashboard | All tickets shown with each student's email (no passwords) | As expected | Pass |
| TC-11 | FR-11, FR-05 | Positive | Staff change a ticket Open → In Progress → Closed | Each change saved; student sees the new status | As expected | Pass |
| TC-12 | FR-11 | Negative | Set an invalid status (`Resolved`, `open`, empty) or use an invalid ticket ID | Rejected (400/404); status unchanged | As expected | Pass |
| TC-13 | FR-07 | Positive | Staff close a ticket with a resolution note | Status Closed; note saved | As expected | Pass |
| TC-14 | FR-07 | Boundary | Resolution note of 0, 2,000, and 2,001 characters; resolve an already closed ticket | 2,000 accepted; others rejected | As expected | Pass |
| TC-15 | FR-08 | Positive | Student views a ticket that staff resolved | Student sees Closed and the note | As expected | Pass |
| TC-16 | Extra (reopen) | Positive | Student reopens their closed ticket with an explanation | Status Open; explanation saved | As expected | Pass |
| TC-17 | Extra (reopen), NFR-04 | Negative | Reopen with no explanation, as another student, as staff, an Open ticket, or a malformed ID | All rejected; ticket unchanged | First run: malformed ID gave 500 (DEF-02). After fix: as expected | Pass (retest) |
| TC-18 | Extra (comments), NFR-04 | Negative | Comment on another student's ticket or on your own closed ticket | Rejected; nothing added | As expected | Pass |
| TC-19 | Extra (comments) | Boundary | Comment of 0, 1, 2,000, and 2,001 characters | 1 and 2,000 accepted; 0 and 2,001 rejected | As expected | Pass |
| TC-20 | FR-12 | Positive | Staff filter by Open, In Progress, Closed, and All | Only matching tickets shown; totals unchanged | As expected (status filter only) | Pass |
| TC-21 | NFR-04 | Negative | Log out, then open the student and staff dashboards | No ticket data shown | No data shown; student page does not redirect to login (DEF-03) | Pass |
| TC-22 | FR-09, NFR-03 | Exception | Stop and restart the server, then log in again | Accounts, tickets, and notes still there | Login worked; 16 of 16 tickets unchanged | Pass |
| TC-23 | NFR-02 | Performance | Time login, submit, and view (10 API runs, 5 browser runs) | Each under 5 seconds | Slowest: 586 ms | Pass |
| TC-24 | NFR-01 | Manual usability | A new student completes registration, login, and ticket submission without assistance within 5 minutes | Workflow completed within 5 minutes | Workflow successfully completed without assistance in under 5 minutes, as confirmed by the team (team-confirmed manual test; exact duration not recorded) | Pass |
| TC-25 | NFR-05 | Compatibility | Run the system on our Windows 11 test computer in Chrome and Edge | All workflows work | Chrome 14/14; Edge smoke test passed | Pass |
| TC-26 | NFR-05 | Compatibility | Each team member runs the app on their own computer | App works | All three members reported it works (no versions or detailed results recorded) | Pass (team-reported) |
| TC-27 | NFR-06 | Review | Review code for naming, comments, dead code, and repeated logic | No maintainability issues | 10 issues found; 5 fixed and verified, 5 minor issues open | Partially Verified |
