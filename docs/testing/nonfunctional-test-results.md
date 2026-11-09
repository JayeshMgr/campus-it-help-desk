# Section 8 — Nonfunctional Testing

**Automated NFR tests: 10 run, 10 Pass, 0 Fail, 0 skipped.** This is the final run on November 9, 2026 at 15:10, on the current code including all fixes. The two earlier runs that morning also passed 10/10.

**Evidence:**
- [`evidence/final-nfr-test-output.txt`](evidence/final-nfr-test-output.txt) (final run)
- [`evidence/nfr-results.json`](evidence/nfr-results.json) (final run; all timings and versions)
- [`evidence/screenshots/nfr-05-edge-student-dashboard.png`](evidence/screenshots/nfr-05-edge-student-dashboard.png)
- Earlier runs: [`evidence/nfr-test-output.txt`](evidence/nfr-test-output.txt), [`evidence/regression-run-output.txt`](evidence/regression-run-output.txt), [`evidence/historical/2026-11-09-pre-fix-run/`](evidence/historical/2026-11-09-pre-fix-run/)

| NFR | Requirement | How we tested it | Measured result (final run) | Status |
| --- | ----------- | ---------------- | --------------------------- | ------ |
| NFR-01 Usability | A new student can register, log in, and submit a ticket within 5 minutes without help | Timed test with someone who has never used the system | Not tested with a participant yet | **Not Run** |
| NFR-02 Performance | Login, ticket submission, and ticket viewing each take less than 5 seconds | Timed each action 10 times through the API and 5 times in Chrome | Slowest API call: 68 ms (login). Slowest browser action: 586 ms (first login). All far under 5 s | **Partially Verified:** passed on our test computer only |
| NFR-03 Reliability | Saved data is still there after the system is closed and reopened | Stopped the server, started it again, logged in, and compared the data | 16 tickets before and 16 after; the closed ticket and its resolution note were unchanged | **Pass** (local database) |
| NFR-04 Security and privacy | Only the right users can see or change tickets | Tried other students' tickets, staff actions as a student, and edited or fake tokens; checked responses for passwords | All unauthorized requests rejected (401/403/404); no password data in any response | **Partially Verified:** all rules passed, but DEF-03 and DEF-05 are still open (see Section 9) |
| NFR-05 Compatibility | Works on the team's Windows computers | Full system test in Chrome and a smoke test in Edge | Windows 11 Pro 10.0.26300, Node v25.9.0: Chrome 156 passed 14/14; Edge 157 login, submit, view, and logout all worked | **Partially Verified:** only our test computer has recorded evidence (see note below) |
| NFR-06 Maintainability | Code is easy to read and change | Code review against our design document, plus coverage data | 10 issues found; 5 fixed and verified; 5 still open | **Fail** (see below) |

**NFR-05 note:** teammates have said the system works on their own computers, but no versions, workflows, or results were recorded. We do not count those reports here. To include them, fill in MAN-02 in [manual-test-procedures.md](manual-test-procedures.md).

## NFR-06 review findings

| ID | Issue | Status |
| -- | ----- | ------ |
| M-01 | Ticket routes were connected twice in `app.js` | **Fixed** |
| M-02 | Leftover debug message `REOPEN ROUTE HIT` (DEF-04) | **Fixed** |
| M-03 | Role check in the reopen route that can never run | Open |
| M-04 | Unused "Hello World" route in `app.js` | **Fixed** |
| M-05 | The same input checks are copied into several routes; this is how DEF-02 happened | Open |
| M-06 | Design document did not match the code (for example, it said React) | **Fixed** (`docs/Backend_Design.md` updated) |
| M-07 | Same code copied in `student.js` and `admin.js` | Open |
| M-08 | Commented-out code, an unreachable message, and misleading comments in `student.js` | **Fixed** |
| M-09 | Old unused pages (`student_sign_in.html`, `admin_sign_in.html`) and leftover HTML | Open |
| M-10 | Mixed formatting; Mongoose `new: true` option is deprecated and prints warnings | Open |

**How we verified the fixes:**
- We checked the code directly. `app.js` has a single ticket route mount and no "Hello World" route. The debug message is gone from `ticketRoutes.js`. The old code and comments are gone from `student.js`.
- In the final run, all 95 automated tests passed. The homepage still loads (SYS-01), and "REOPEN ROUTE HIT" does not appear anywhere in the test output.
