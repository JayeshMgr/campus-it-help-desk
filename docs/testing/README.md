# Milestone 3 Testing — Campus IT Help Desk Ticket System (Team 9)

CSE 3310 · Branch `testing/milestone3-final` · Testing done November 9, 2026

This folder holds our Milestone 3 testing documentation. Each file matches one section of the Milestone 3 template.

| Template section | Document |
| ---------------- | -------- |
| 4 — Test Plan | This file |
| 5 — Test Design | [test-case-matrix.md](test-case-matrix.md) |
| 6 — Unit and White-Box Testing | [unit-test-results.md](unit-test-results.md) |
| 7 — Integration and System Testing | [integration-test-results.md](integration-test-results.md), [system-test-results.md](system-test-results.md) |
| 8 — Nonfunctional Testing | [nonfunctional-test-results.md](nonfunctional-test-results.md) |
| 9 — Defect Log and Regression Testing | [defect-log.md](defect-log.md) |
| 10 — Verification vs. Validation | [verification-validation.md](verification-validation.md) |
| 13 — Traceability Matrix | [traceability-matrix.md](traceability-matrix.md) |
| Manual tests still to do | [manual-test-procedures.md](manual-test-procedures.md) |

Raw test output and screenshots are in [`evidence/`](evidence/).

**Note:** The SRS is not stored in this repository. Requirement titles (FR-01 to FR-12, NFR-01 to NFR-06) come from our earlier test report and the Milestone 3 instructions. Check them against the SRS before submitting.

**Result labels used in every document:**

| Label | Meaning |
| ----- | ------- |
| Pass | Test was run and the actual result matched the expected result |
| Fail | Test was run and the actual result did not match |
| Partially Verified | Only part of the requirement was tested, or it passed with a known open issue |
| Not Run | Test is prepared but has not been done yet; no result is claimed |

---

# Section 4 — Test Plan

## 4.1 Objectives and scope

Our goal was to check that the system meets the SRS requirements and works for both students and IT staff.

**In scope:**
- Registration and login (FR-01, FR-02)
- Role-based access for students and staff (FR-04)
- Submitting, viewing, updating, resolving, and filtering tickets (FR-03, FR-05 to FR-08, FR-10 to FR-12)
- Ticket comments and reopening a closed ticket
- Data persistence (FR-09)
- Nonfunctional requirements NFR-01 to NFR-06

**Out of scope:**
- The production MongoDB Atlas database. All tests used a separate local test database, so real data was never touched.
- Browsers other than Chrome and Edge, and mobile devices.

## 4.2 Test environment

| Item | Value |
| ---- | ----- |
| Computer | Windows 11 Pro (10.0.26300), Intel Core i7-11800H, 16 GB RAM |
| Software | Node.js v25.9.0, MongoDB 8.2.6 (local), Express 5.2.1, Mongoose 9.10.2 |
| Browsers | Google Chrome 156.0.8078.81, Microsoft Edge 157.0.4341.42 |
| Test tools | Node's built-in test runner, Playwright (controls a real Chrome browser) |
| Test data | Fake accounts such as `student.a@example.test`. One staff account is added to the test database for each run, because staff cannot sign up through the app |

## 4.3 Testing levels

| Level | What we tested | Tests |
| ----- | -------------- | ----- |
| Unit / white-box | Single backend functions with a fake database: login, registration, auth and role checks, ticket validation | 27 |
| Integration | API routes working together with the real database | 44 |
| System | Full user workflows in a real Chrome browser | 14 |
| Nonfunctional (automated) | Performance, reliability, security, compatibility | 10 |
| Manual | Usability, teammates' computers, visual review | See [manual-test-procedures.md](manual-test-procedures.md) |
| Code review | Maintainability (NFR-06) | 10 findings |

## 4.4 Entry and exit criteria

**Entry criteria (all met):**
- The final code was merged into the test branch.
- The local MongoDB test database was running.
- The server started without errors.

**Exit criteria:**

| Criterion | Status |
| --------- | ------ |
| Every FR and NFR has at least one planned test | Met (see Section 13) |
| All automated tests run and pass | Met. Final run on Nov 9, 15:10: unit 27/27, integration 44/44, system 14/14, NFR 10/10 (see Section 9) |
| No open High-severity defects | Met. One Medium defect (DEF-05) is documented and still open |
| Manual tests completed | **Not met.** NFR-01 usability and NFR-05 teammate computers are Not Run |

## 4.5 How to run the tests

You need Node.js, MongoDB running locally on `127.0.0.1:27017`, Google Chrome, and Microsoft Edge (Edge is only needed for NFR-05).

```powershell
cd server
npm install
npm test                    # unit tests
npm run test:integration    # integration tests
npm run test:system         # system tests in Chrome (overwrites evidence/screenshots)
npm run test:nfr            # automated nonfunctional tests (overwrites evidence/nfr-results.json)
```

**Safety:** the test scripts only accept a local database named `campus_it_help_desk_m3final_<suite>_test` and refuse anything else, including Atlas. They never read `server/.env`, and each run uses random passwords and a random JWT secret.
