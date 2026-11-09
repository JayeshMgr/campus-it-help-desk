# Section 9 — Defect Log and Regression Testing

**Severity:** High = a requirement cannot be used or data is exposed. Medium = a security or reliability weakness with no direct failure. Low = wrong error code, cosmetic, or maintainability issue.

## 9.1 Defect log

| ID | Found by | Description | Severity | Status | Retest |
| -- | -------- | ----------- | -------- | ------ | ------ |
| DEF-01 | Earlier test cycle (Nov 5) | Malformed ticket ID on the status route gave a server error (500) instead of 400 | Low | Fixed (before this cycle) | Pass: INT-06d returns 400 |
| DEF-02 | INT-08f | Malformed ticket ID on the reopen route gave a server error (500) instead of 400 | Low | **Fixed:** added the same ID check the other routes use | Pass: INT-08f returns 400; INT-08a–e still pass; final run 44/44 |
| DEF-03 | SYS-14 | After logout, the student page shows an error instead of redirecting to login (no data exposed) | Low | **Open** | Still present in the final run |
| DEF-04 | Integration output | Debug message `REOPEN ROUTE HIT` printed on every reopen request | Low | **Fixed** (M-02) | Pass: message absent from the final output |
| DEF-05 | `npm audit` | Express dependencies body-parser (high advisory) and qs (moderate advisory) | Medium | **Open:** the fix changes production packages and needs team approval | Still reported by `npm audit` on Nov 9 |

**Evidence:** the original DEF-02 failure is in [`evidence/integration-test-output.txt`](evidence/integration-test-output.txt); the retests are in [`evidence/final-integration-test-output.txt`](evidence/final-integration-test-output.txt).

## 9.2 Known limitations (not defects)

| Limitation | Evidence |
| ---------- | -------- |
| FR-12: only status filtering exists; category filtering and keyword search are not implemented | SYS-11, INT-10 |
| Staff can close a ticket from the status dropdown without a resolution note, or reopen it without an explanation | Probes OBS-P6, OBS-P7 in [`evidence/observation-probes-output.txt`](evidence/observation-probes-output.txt) |
| Registration has no server-side email format check or password rules, and email case is not normalized | Probes OBS-P1 to OBS-P3 |
| No maximum length for ticket title, category, or description | Probe OBS-P4 |
| Five minor maintainability issues remain (M-03, M-05, M-07, M-09, M-10) | [Section 8](nonfunctional-test-results.md#nfr-06--maintainability-review) |

## 9.3 Regression testing

The regression suite is the full set of 95 automated tests, re-run after every fix.

| Run | Unit | Integration | System | NFR | Evidence |
| --- | ---- | ----------- | ------ | --- | -------- |
| Baseline, Nov 9, 11:38 (before fixes) | 27/27 | 43/44 (DEF-02) | 14/14 | 10/10 | [`regression-run-output.txt`](evidence/regression-run-output.txt); [`historical/2026-11-09-pre-fix-run/`](evidence/historical/2026-11-09-pre-fix-run/) |
| **Final, Nov 9, 15:10 (all fixes in place)** | **27/27** | **44/44** | **14/14** | **10/10** | [`final-unit-test-output.txt`](evidence/final-unit-test-output.txt), [`final-integration-test-output.txt`](evidence/final-integration-test-output.txt), [`final-system-test-output.txt`](evidence/final-system-test-output.txt), [`final-nfr-test-output.txt`](evidence/final-nfr-test-output.txt) |

**Final result: 95/95 Pass, 0 Fail.** The final run included the DEF-02 fix and maintainability fixes M-01, M-02, M-04, M-06, and M-08. No previously passing test failed after these changes.
