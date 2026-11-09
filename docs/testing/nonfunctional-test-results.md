# Section 8 — Nonfunctional and Security Testing

**Automated NFR tests: 10 run, 10 Pass, 0 Fail** (final run, November 9, 2026, 15:10)
**Evidence:** [`evidence/final-nfr-test-output.txt`](evidence/final-nfr-test-output.txt), [`evidence/nfr-results.json`](evidence/nfr-results.json) (all timings), [`evidence/screenshots/nfr-05-edge-student-dashboard.png`](evidence/screenshots/nfr-05-edge-student-dashboard.png)

| NFR | Requirement | How we tested it | Result | Status |
| --- | ----------- | ---------------- | ------ | ------ |
| NFR-01 Usability | A student can register, log in, and submit a ticket within 5 minutes without help | Timed test with a new user | No timed test was recorded | **Not Verified** |
| NFR-02 Performance | Login, submission, and viewing finish within 5 seconds on the team's test computer | Each action timed 10 times through the API and 5 times in Chrome | See table below. Slowest action was 586 ms | **Verified** |
| NFR-03 Reliability | Tickets remain available after the system is closed and reopened | Stopped the server, started it again, logged in, and compared the data | Login worked after restart. 16 tickets before and 16 after, with the same IDs; a closed ticket kept its status and resolution note | **Verified** (local test database) |
| NFR-04 Security/privacy | Students access only their own tickets; staff access all | Login, token, role, and ticket-ownership tests (see below) | Every unauthorized request rejected; no password data in any response | **Verified**, with the limitations listed below |
| NFR-05 Compatibility | Works on the team's Windows computers | Full system tests in Chrome and an Edge smoke test on Windows 11; each team member ran the app | Chrome 14/14; Edge login, submit, view, and logout worked. All three team members reported the app works on their computers | **Verified** (teammate checks are team-reported) |
| NFR-06 Maintainability | Clear naming and comments so a teammate can understand and change the code | Code review against our design document | 10 issues found; 5 fixed and verified; 5 minor issues still open | **Partially Verified** |

## NFR-02 — Performance (limit: 5 seconds)

| Action | API median / max (10 runs) | Browser median / max (5 runs, Chrome) |
| ------ | -------------------------- | ------------------------------------- |
| Login | 62 ms / 68 ms | 164 ms / 586 ms |
| Submit ticket | 4 ms / 8 ms | 63 ms / 136 ms |
| Student views tickets | 4 ms / 6 ms | 69 ms / 87 ms |
| Staff view all tickets | 5 ms / 9 ms | — |

## NFR-04 — Security and privacy tests

| What was tested | Tests | Result |
| --------------- | ----- | ------ |
| Login: wrong password and unknown email give the same error; a database operator in the email field does not log anyone in | TC-04; INT-02c; NFR-04d | Pass |
| Tokens: missing, expired, forged, edited (`role` changed to staff), and unsigned tokens rejected (401) | TC-05; INT-02e; NFR-04b, 04c | Pass |
| Roles: students blocked from every staff action (403); sign-up cannot create a staff account | TC-06; NFR-04a | Pass |
| Ownership: a student cannot read, comment on, or reopen another student's ticket | TC-09, TC-17, TC-18; INT-04a; NFR-04e | Pass |
| Password hashes never appear in API responses | NFR-04f | Pass |

**Known security limitations (no ticket data exposed):**
- **DEF-03:** after logout, the student page shows an error message instead of redirecting to login.
- **DEF-05:** two Express dependencies (body-parser, qs) have published security advisories. Still open.
- Registration does not check the email format on the server and has no password rules.

## NFR-06 — Maintainability review

| ID | Issue | Status |
| -- | ----- | ------ |
| M-01 | Ticket routes were mounted twice in `app.js` | **Fixed** |
| M-02 | Leftover debug message `REOPEN ROUTE HIT` | **Fixed** |
| M-03 | Role check in the reopen route that can never run | Open |
| M-04 | Unused "Hello World" route in `app.js` | **Fixed** |
| M-05 | The same input checks are copied into several routes (the cause of DEF-02) | Open |
| M-06 | Design document did not match the code | **Fixed** (`docs/Backend_Design.md` updated) |
| M-07 | Similar code repeated in `student.js` and `admin.js` | Open |
| M-08 | Dead code and misleading comments in `student.js` | **Fixed** |
| M-09 | Old unused pages (`student_sign_in.html`, `admin_sign_in.html`) | Open |
| M-10 | Mixed formatting; deprecated Mongoose `new: true` option prints warnings | Open |

**Fix verification:** we confirmed the five fixes in the code, and all 95 automated tests passed in the final run. "REOPEN ROUTE HIT" no longer appears in the test output.
