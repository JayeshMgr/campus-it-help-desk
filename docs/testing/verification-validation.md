# Section 10 — Verification vs. Validation

- **Verification:** *did we build the system right?* We checked the code against the SRS and our design.
- **Validation:** *did we build the right system?* We checked that students and staff can actually do what they need.

## 10.1 Verification

| Activity | What it showed | Status |
| -------- | -------------- | ------ |
| Unit tests (27) | Login, registration, token checks, role checks, and ticket rules work as designed | Pass |
| Integration tests (44) | Each API route returns the right response and saves the right data | Pass (after the DEF-02 fix) |
| Security tests (NFR-04) | Students cannot reach other students' tickets; bad tokens are rejected; passwords are never returned | Pass |
| Performance and reliability tests (NFR-02, NFR-03) | All actions under 586 ms; data survives a restart | Pass |
| Code review (NFR-06) | 10 maintainability issues found; 5 fixed and verified | Partially Verified |
| Traceability matrix | Every FR and NFR is linked to design, code, and tests | Done ([Section 13](traceability-matrix.md)) |

## 10.2 Validation

| Activity | User need | Status |
| -------- | --------- | ------ |
| System tests in a real browser (SYS-01 to SYS-14) | Students can register, submit, and track tickets; staff can view, update, resolve, and filter tickets | Pass |
| Team members ran the app on their own computers | The app works on the computers our team uses | Pass (team-reported; no versions recorded) |
| Visual check of the final design | Pages are clear and readable | Final pages captured in the system-test screenshots; no separate formal review recorded |
| Manual usability test (NFR-01, TC-24) | A new student finishes the main task in 5 minutes without help | Pass (team-confirmed; completed in under 5 minutes, exact duration not recorded) |

## Summary

Verification is strong: all 95 automated tests passed in the final run. Validation is also complete for the core needs. The workflows were tested end to end, the team confirmed the app runs on their computers, and a new student completed the register, login, and submit workflow without help in under 5 minutes (TC-24).
