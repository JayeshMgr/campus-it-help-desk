# Section 10 — Verification vs. Validation

- **Verification** asks: *did we build the system right?* We check the code against the SRS and our design.
- **Validation** asks: *did we build the right system?* We check that real users can do what they need to do.

## 10.1 Verification

| Activity | What it showed | Evidence | Status |
| -------- | -------------- | -------- | ------ |
| Unit tests | Login, registration, token checks, role checks, and ticket rules work as designed | 27 unit tests | Pass |
| Integration tests | Each API route returns the right response and saves the right data; students and staff can only do what their role allows | 44 integration tests | Pass (after the DEF-02 fix) |
| Security tests | Edited, fake, and expired tokens are rejected; students cannot reach other students' tickets; passwords are never returned | NFR-04a–f | Pass |
| Performance and reliability tests | Actions take well under 5 seconds; data survives a server restart | NFR-02, NFR-03 | Pass on our test computer |
| Code review against the design document | Found 10 maintainability issues; 5 are fixed and verified (M-01, M-02, M-04, M-06, M-08) | NFR-06 | Fail (5 still open) |
| Traceability matrix | Every FR and NFR is linked to design, code, and tests | Section 13 | Done |

## 10.2 Validation

| Activity | User need | Evidence | Status |
| -------- | --------- | -------- | ------ |
| Browser tests of complete workflows | A student can register, submit, track, and reopen tickets. Staff can view, update, resolve, and filter tickets | SYS-01 to SYS-14 | Pass |
| Compatibility | Works in the browsers our users have on Windows | Chrome and Edge on our test computer | Partially Verified (1 computer) |
| Usability test with a new user | A first-time student finishes the main task in 5 minutes without help | NFR-01 / TC-24 / MAN-01 | Not Run |
| Visual review of the final design | The pages are clear and readable | Manual test MAN-03 | Not Run |

## Summary

Verification is strong. In the final run, all 95 automated tests passed (27 unit, 44 integration, 14 system, 10 NFR).

Validation is only partial. The browser tests show the workflows work, but no real user has tried the system yet. The NFR-01 usability test and the visual review in [manual-test-procedures.md](manual-test-procedures.md) still need to be done.
