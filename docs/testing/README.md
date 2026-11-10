# Milestone 3 Testing — Campus IT Help Desk Ticket System (Team 9)

CSE 3310 · Branch `testing/milestone3-final` · Testing completed November 9, 2026

| Template section | Document |
| ---------------- | -------- |
| 4 — Test Plan and Environment | This file |
| 5 — Test Design and Requirements Coverage | [test-case-matrix.md](test-case-matrix.md) |
| 6 — Unit and White-Box Testing | [unit-test-results.md](unit-test-results.md) |
| 7 — Integration and System Testing | [integration-test-results.md](integration-test-results.md), [system-test-results.md](system-test-results.md) |
| 8 — Nonfunctional and Security Testing | [nonfunctional-test-results.md](nonfunctional-test-results.md) |
| 9 — Defect Log and Regression Testing | [defect-log.md](defect-log.md) |
| 10 — Verification vs. Validation | [verification-validation.md](verification-validation.md) |
| 13 — Traceability Matrix | [traceability-matrix.md](traceability-matrix.md) |

Raw test output, JSON results, and screenshots are in [`evidence/`](evidence/).

**Status labels**

| Label | Meaning |
| ----- | ------- |
| Pass / Fail | A single test was run and its actual result did or did not match the expected result |
| Verified | Every part of the requirement was tested and passed |
| Partially Verified | Only part of the requirement is implemented or tested, or it passed with a known open issue |
| Not Verified | No valid test evidence exists yet |

---

# Section 4 — Test Plan

## 4.1 Objective and scope

Our goal was to confirm that the system meets the 12 functional requirements (FR-01 to FR-12) and 6 nonfunctional requirements (NFR-01 to NFR-06) in our Milestone 1 SRS.

- **In scope:** registration, login, student and staff roles, ticket submission, viewing, status updates, resolution notes, status filtering, data persistence, and NFR-01 to NFR-06. We also tested two extra features that are not in the SRS: ticket reopening and comments.
- **Out of scope:** the production MongoDB Atlas database (all tests used a separate local test database), mobile devices, and browsers other than Chrome and Edge.

## 4.2 Test environment

| Item | Value |
| ---- | ----- |
| Computer | Windows 11 Pro (10.0.26300), Intel Core i7-11800H, 16 GB RAM |
| Software | Node.js v25.9.0, MongoDB 8.2.6 (local), Express 5.2.1, Mongoose 9.10.2 |
| Browsers | Google Chrome 156.0.8078.81, Microsoft Edge 157.0.4341.42 |
| Test tools | Node.js built-in test runner, Playwright (drives a real browser) |
| Test data | Fake accounts such as `student.a@example.test`. One staff account is created in the test database for each run, because staff cannot sign up through the app |

## 4.3 Testing levels

| Level | What we tested | Tests |
| ----- | -------------- | ----- |
| Unit / white-box | Backend functions with a fake database: login, registration, token and role checks, ticket rules | 27 |
| Integration | API routes working together with a real test database | 44 |
| System (end-to-end) | Complete user workflows in a real Chrome browser | 14 |
| Nonfunctional (automated) | Performance, reliability, security, and compatibility | 10 |
| Code review | Maintainability (NFR-06) | 10 findings |
| Team check | Each team member ran the app on their own computer (NFR-05) | 3 members |

## 4.4 Entry and exit criteria

**Entry criteria (all met):** the final code was on the test branch, the local test database was running, and the server started without errors.

| Exit criterion | Status |
| -------------- | ------ |
| Every FR and NFR has at least one test or review | Met |
| All automated tests pass | Met: 95/95 in the final run (Nov 9, 15:10) |
| No open High-severity defects in our code | Met. DEF-05 (Medium, a third-party package advisory) is still open |
| Timed usability test (NFR-01) | **Not met.** No timed test was recorded |

## 4.5 How to run the tests

Requires Node.js, a local MongoDB on `127.0.0.1:27017`, Chrome, and Edge (Edge is only needed for NFR-05).

```powershell
cd server
npm install
npm test                    # unit tests
npm run test:integration    # integration tests
npm run test:system         # system tests (overwrites evidence/screenshots)
npm run test:nfr            # nonfunctional tests (overwrites evidence/nfr-results.json)
```

The test scripts only accept a local database named `campus_it_help_desk_m3final_<suite>_test`. They never connect to Atlas or read `server/.env`.
