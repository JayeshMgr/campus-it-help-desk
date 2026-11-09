# Section 9 — Defect Log and Regression Testing

**Severity:**
- **High:** a requirement cannot be used, or data is exposed.
- **Medium:** a security or reliability weakness with no direct failure.
- **Low:** wrong error code, a cosmetic problem, or a maintainability problem.

## 9.1 Defects

| ID | Found by | Issue | Severity | Fix status | Retest result |
| -- | -------- | ----- | -------- | ---------- | ------------- |
| DEF-01 | Earlier test cycle (Nov 5) | A malformed ticket ID on the status-update route caused a server error (500) instead of 400 | Low | Fixed (before this cycle) | **Pass:** INT-06d returns 400 |
| DEF-02 | INT-08f | A malformed ticket ID on the reopen route caused a server error (500) instead of 400 | Low | **Fixed:** added the same ticket ID check that the other routes use | **Pass:** INT-08f returns 400; INT-08a–e (normal reopening and permissions) still pass; final run 44/44 |
| DEF-03 | SYS-14 | After logout, the student page does not redirect to login. It shows an empty form and an error message (no data is exposed) | Low | **Open** | Still present in the final run (SYS-14 observation) |
| DEF-04 | Integration output | Debug message `REOPEN ROUTE HIT` printed on every reopen request | Low | **Fixed** (maintainability item M-02) | **Pass:** message does not appear in the final integration output (44/44) |
| DEF-05 | `npm audit` | Two Express dependencies have known security advisories: body-parser (high, denial of service) and qs (moderate) | Medium | **Open:** `npm audit fix` is available but changes production packages, so it needs team approval | Not retested |

**Evidence:**
- Retest results come from the final regression run ([`evidence/final-integration-test-output.txt`](evidence/final-integration-test-output.txt)).
- The original DEF-02 failure is recorded in [`evidence/integration-test-output.txt`](evidence/integration-test-output.txt).

## 9.2 Remaining known issues (not defects; to check against the SRS)

| Issue | Evidence |
| ----- | -------- |
| Staff can close a ticket from the status dropdown without a resolution note, and can reopen it without an explanation | Probes OBS-P6, OBS-P7 in [`evidence/observation-probes-output.txt`](evidence/observation-probes-output.txt) |
| Filtering is by status only (no category or keyword search) | SYS-11 |
| Registration does not check the email format on the server, has no password rules, and treats emails with different capital letters as different accounts | Probes OBS-P1 to OBS-P3 |
| No maximum length for ticket title, category, or description | Probe OBS-P4 |
| The server allows staff to comment on closed tickets, but the staff page hides the comment box for them | INT-09e |
| Comments and reopening are built and tested but are not in our FR list | Section 13 |

## 9.3 Regression testing

Our regression suite is the full set of automated tests. Together they cover registration and login, ticket submission, viewing, status updates, resolution, reopening, comments, and filtering.

| Run | Unit | Integration | System | NFR (automated) | Evidence |
| --- | ---- | ----------- | ------ | --------------- | -------- |
| Baseline, Nov 9, 11:38 (before fixes) | 27/27 | 43/44 (DEF-02) | 14/14 | 10/10 | [`evidence/regression-run-output.txt`](evidence/regression-run-output.txt); screenshots and NFR data in [`evidence/historical/2026-11-09-pre-fix-run/`](evidence/historical/2026-11-09-pre-fix-run/) |
| Retests during fixing (DEF-02, then cleanup) | 27/27 | 44/44 | 14/14 | Not run | Terminal only, not saved |
| **Final run, Nov 9, 15:10 (all fixes in place)** | **27/27** | **44/44** | **14/14** | **10/10** | [`final-unit-test-output.txt`](evidence/final-unit-test-output.txt), [`final-integration-test-output.txt`](evidence/final-integration-test-output.txt), [`final-system-test-output.txt`](evidence/final-system-test-output.txt), [`final-nfr-test-output.txt`](evidence/final-nfr-test-output.txt); screenshots in [`evidence/screenshots/`](evidence/screenshots/) |

**Final result:** 95 automated tests run, **95 Pass, 0 Fail, 0 skipped**. The final run used the code with the DEF-02 fix and maintainability fixes M-01, M-02, M-04, M-06, and M-08.

The integration output still shows the Mongoose `new` option deprecation warning (M-10, not fixed). It does not affect the results.
