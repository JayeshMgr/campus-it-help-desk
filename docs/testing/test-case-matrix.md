# Section 5 — Test Design

We designed our test cases from the requirements. Each case was checked at one or more levels (Unit, Integration, System). Test IDs in the Evidence column refer to:
- [unit-test-results.md](unit-test-results.md) (Unit)
- [integration-test-results.md](integration-test-results.md) (INT)
- [system-test-results.md](system-test-results.md) (SYS)
- [nonfunctional-test-results.md](nonfunctional-test-results.md) (NFR)

**Summary:** 27 test cases.
- **24 Pass**
- **2 Not Run** (TC-24 usability, TC-26 teammates' computers)
- **1 Fail** (TC-27 maintainability review)

**11 cases are negative, boundary, or exception tests:** TC-02, 04, 05, 06, 08, 12, 14, 17, 18, 19, 21.

## 5.1 Requirements coverage

| Requirement | Test cases | Status |
| ----------- | ---------- | ------ |
| FR-01 Student registration | TC-01, TC-02, TC-06 | Pass |
| FR-02 Login (student and staff) | TC-03, TC-04 | Pass |
| FR-03 Submit a ticket | TC-07 | Pass |
| FR-04 Role-based access | TC-05, TC-06, TC-21 | Partially Verified (DEF-03 open) |
| FR-05 Students view their own tickets and statuses | TC-09, TC-11 | Pass |
| FR-06 Staff view all tickets | TC-10 | Pass |
| FR-07 Staff add resolution notes | TC-13, TC-14 | Pass |
| FR-08 Students view resolution notes | TC-15 | Pass |
| FR-09 Data persistence | TC-22 | Partially Verified (local database only) |
| FR-10 Required ticket fields | TC-08 | Pass |
| FR-11 Staff update ticket status | TC-11, TC-12 | Pass |
| FR-12 Staff filter tickets | TC-20 | Partially Verified (status filter only) |
| Ticket reopening *(not in our FR list)* | TC-16, TC-17 | Pass (after the DEF-02 fix) |
| Comments *(not in our FR list)* | TC-18, TC-19 | Pass |
| NFR-01 Usability | TC-24 | Not Run |
| NFR-02 Performance | TC-23 | Partially Verified (test computer only) |
| NFR-03 Reliability | TC-22 | Pass (local database) |
| NFR-04 Security and privacy | TC-04, 05, 06, 09, 17, 18, 21 | Partially Verified (DEF-03, DEF-05 open) |
| NFR-05 Compatibility | TC-25, TC-26 | Partially Verified |
| NFR-06 Maintainability | TC-27 | Fail (5 of 10 findings fixed) |

## 5.2 Test cases

| ID | Req. | Type | Test (input) | Expected result | Actual result | Result | Evidence |
| -- | ---- | ---- | ------------ | --------------- | ------------- | ------ | -------- |
| TC-01 | FR-01 | Positive | Register a new student with a valid email and password | Account created as `student`; password stored only as a hash; redirected to login | As expected | Pass | Unit (register); INT-01a; SYS-01 |
| TC-02 | FR-01 | Negative | Register with a missing email, a missing password, or an email that already exists | Error message; no new account created | As expected for all inputs | Pass | Unit (register); INT-01b, 01c; SYS-02 |
| TC-03 | FR-02 | Positive | Log in as a student and as staff | Login succeeds; each role is sent to its own dashboard | As expected | Pass | Unit (login); INT-02a, 02b; SYS-04, SYS-08 |
| TC-04 | FR-02, NFR-04 | Negative | Log in with a wrong password, then with an unknown email | Same "Invalid credentials" message for both; no login | As expected | Pass | Unit (login); INT-02c; SYS-03 |
| TC-05 | FR-04, NFR-04 | Negative | Call protected pages with no token, an expired token, a fake token, or an edited token | Every request rejected (401) | All 7 token types rejected | Pass | Unit (auth); INT-02e; NFR-04b, 04c |
| TC-06 | FR-04, NFR-04 | Negative | A student tries staff actions; staff try student actions; sign up with `role: staff` | Wrong-role actions rejected (403), data unchanged; sign-up still creates a student | As expected | Pass | Unit (role); INT-01d, 03d, 05b, 06e, 07b, 08c; NFR-04a |
| TC-07 | FR-03 | Positive | Student submits a ticket with a title, category, and description | Ticket saved with status Open under that student | As expected | Pass | INT-03a, 03b; SYS-05 |
| TC-08 | FR-10 | Boundary | Submit a ticket with an empty or spaces-only title, category, or description | Ticket rejected; nothing saved | As expected | Pass | Unit (ticket); INT-03c; SYS-06 |
| TC-09 | FR-05, NFR-04 | Positive | Two students each view their ticket list | Each student sees only their own tickets | As expected | Pass | INT-04a, 04b; SYS-07; NFR-04e |
| TC-10 | FR-06 | Positive | Staff open the dashboard | All tickets shown, with each student's email (no passwords) | As expected | Pass | INT-05a; SYS-08 |
| TC-11 | FR-11, FR-05 | Positive | Staff change a ticket Open → In Progress → Closed | Each change is saved and the student sees it | As expected | Pass | INT-06a, 06b; SYS-09 |
| TC-12 | FR-11 | Negative | Set an invalid status (`Resolved`, `open`, empty) or use an invalid ticket ID | Request rejected (400 or 404); status unchanged | As expected | Pass | Unit (ticket); INT-06c, 06d |
| TC-13 | FR-07 | Positive | Staff close a ticket with a resolution note | Status Closed; note saved as a staff resolution | As expected | Pass | INT-07c; SYS-10 |
| TC-14 | FR-07 | Boundary | Resolution note of 0, 2,000, and 2,001 characters; resolve an already closed ticket | 2,000 accepted; 0 and 2,001 rejected; already closed rejected | As expected | Pass | INT-07a, 07e, 07f; SYS-10 |
| TC-15 | FR-08 | Positive | Student views a ticket that staff resolved | Student sees Closed and the resolution note | As expected | Pass | INT-07d; SYS-12 |
| TC-16 | Reopen | Positive | Student reopens their own closed ticket with an explanation | Status back to Open; explanation saved | As expected | Pass | INT-08e; SYS-13 |
| TC-17 | Reopen, NFR-04 | Negative | Reopen with no explanation, as another student, as staff, an Open ticket, and a malformed ticket ID | All rejected; ticket unchanged; malformed ID returns 400 | First run: malformed ID returned 500 (DEF-02). After the fix: all as expected | Pass (retest) | INT-08a–f |
| TC-18 | Comments, NFR-04 | Negative | Comment on another student's ticket, or on your own closed ticket | Rejected; nothing added | As expected | Pass | INT-09a–e, 09g |
| TC-19 | Comments | Boundary | Comment of 0, 1, 2,000, and 2,001 characters | 1 and 2,000 accepted; 0 and 2,001 rejected | As expected | Pass | Unit (ticket); INT-09f |
| TC-20 | FR-12 | Positive | Staff filter by Open, In Progress, Closed, and All | Only matching tickets shown; overview counts stay the same | As expected | Pass | INT-10a, 10b; SYS-11 |
| TC-21 | FR-04, NFR-04 | Negative | Log out, then open the student and staff dashboards | No ticket data shown; staff page redirects to login | As expected. The student page does not redirect (DEF-03) | Pass | SYS-14 |
| TC-22 | FR-09, NFR-03 | Exception | Stop and restart the server, then log in again | All accounts, tickets, and notes are still there | 16 of 16 tickets unchanged | Pass | NFR-03a |
| TC-23 | NFR-02 | Performance | Time login, submit, and view (10 API runs + 5 browser runs) | Each under 5 seconds | Slowest: 522 ms | Pass | NFR-02a, 02b |
| TC-24 | NFR-01 | Usability | A new student registers, logs in, and submits a ticket without help | Done within 5 minutes | — | Not Run | [manual-test-procedures.md](manual-test-procedures.md) |
| TC-25 | NFR-05 | Compatibility | Run the system on our Windows test computer in Chrome and Edge | Everything works | Chrome 14/14; Edge smoke test passed | Pass | SYS-01–14; NFR-05a |
| TC-26 | NFR-05 | Compatibility | Run the system on each teammate's Windows computer | Everything works | — | Not Run | [manual-test-procedures.md](manual-test-procedures.md) |
| TC-27 | NFR-06 | Review | Review code against the design document for readability, dead code, and repeated logic | No major maintainability issues | 10 issues found; 5 fixed and verified, 5 still open | Fail | [nonfunctional-test-results.md](nonfunctional-test-results.md) |
