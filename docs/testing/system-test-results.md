# Section 7.2 — System Testing (Complete User Workflows)

**Result: 14 tests run, 14 Pass, 0 Fail, 0 skipped** (final run, November 9, 2026, 15:10, after all fixes)

**Evidence:**
- Final run: [`evidence/final-system-test-output.txt`](evidence/final-system-test-output.txt). Screenshots from this run are in [`evidence/screenshots/`](evidence/screenshots/).
- Earlier runs (also 14/14): [`evidence/system-test-output.txt`](evidence/system-test-output.txt), [`evidence/regression-run-output.txt`](evidence/regression-run-output.txt). Their screenshots are in [`evidence/historical/2026-11-09-pre-fix-run/`](evidence/historical/2026-11-09-pre-fix-run/).

## How we tested

A script controls a real Chrome browser. It clicks buttons and types into the actual pages, and the real server runs alongside it with a local test database. Each test checks what appears on the screen and what was saved in the database.

## Results

| ID | Workflow | Expected result | Result | Screenshot |
| -- | -------- | --------------- | ------ | ---------- |
| SYS-01 | Student registers | Account created; sent to the login page | Pass | `sys-01a-home.png`, `sys-01b-register-filled.png` |
| SYS-02 | Register with an existing email | "User already exists" shown; stays on the page | Pass | `sys-02-register-duplicate.png` |
| SYS-03 | Log in with a wrong password | "Invalid credentials" shown; not logged in | Pass | `sys-03-login-invalid.png` |
| SYS-04 | Student logs in | Student dashboard opens with no tickets | Pass | `sys-04-student-dashboard-empty.png` |
| SYS-05 | Student submits two tickets | Success message; both tickets shown as Open | Pass | `sys-05a-student-submitted.png` |
| SYS-06 | Submit with an empty field | Browser blocks the form; nothing saved | Pass | `sys-06-required-field-blocked.png` |
| SYS-07 | A second student logs in | Sees only their own ticket | Pass | `sys-07-student-b-own-tickets.png` |
| SYS-08 | Staff log in | All 3 tickets with student emails; counts 3 total / 3 Open | Pass | `sys-08-staff-dashboard-all.png` |
| SYS-09 | Staff set a ticket to In Progress | Badge and counts update | Pass | `sys-09-staff-in-progress.png` |
| SYS-10 | Staff close a ticket | Blocked without a note; with a note, ticket closes and the note shows | Pass | `sys-10-staff-resolved.png` |
| SYS-11 | Staff filter by status | Only matching tickets shown; overview counts do not change | Pass | `sys-11-filter-*.png` (4 files) |
| SYS-12 | Student checks a closed ticket | Sees Closed and the resolution note | Pass | `sys-12-student-sees-resolution.png` |
| SYS-13 | Student reopens a closed ticket | Blocked without an explanation; with one, ticket is Open again | Pass | `sys-13-student-reopened.png` |
| SYS-14 | Log out and open the dashboards | No ticket data shown; staff page redirects to login | Pass (see DEF-03) | `sys-14-student-page-after-logout.png` |

**SYS-14 note:** after logout, the student page does not redirect to login. It shows an empty form and "Error loading IT requests." No data is exposed, because the server rejects the request. This is logged as DEF-03.

**Not covered by these tests:** a person's judgement of the visual design, Firefox and mobile browsers, and the production Atlas database.
