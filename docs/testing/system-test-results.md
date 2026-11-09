# Section 7.2 — System (End-to-End) Testing

**Result: 14 run, 14 Pass, 0 Fail** (final run, November 9, 2026, 15:10)
**Evidence:** [`evidence/final-system-test-output.txt`](evidence/final-system-test-output.txt). Screenshots are in [`evidence/screenshots/`](evidence/screenshots/).

**Approach:** a script controls a real Chrome browser. It types into and clicks the actual pages while the real server runs with a local test database, then checks both the screen and the database.

| ID | Workflow (FR) | Expected result | Result | Screenshot |
| -- | ------------- | --------------- | ------ | ---------- |
| SYS-01 | Student registers (FR-01) | Account created; sent to login | Pass | `sys-01a-home.png`, `sys-01b-register-filled.png` |
| SYS-02 | Register with an existing email (FR-01) | "User already exists"; stays on page | Pass | `sys-02-register-duplicate.png` |
| SYS-03 | Log in with a wrong password (FR-02) | "Invalid credentials"; not logged in | Pass | `sys-03-login-invalid.png` |
| SYS-04 | Student logs in (FR-02) | Student dashboard, no tickets | Pass | `sys-04-student-dashboard-empty.png` |
| SYS-05 | Student submits two tickets (FR-03) | Both shown as Open | Pass | `sys-05a-student-submitted.png` |
| SYS-06 | Submit with an empty field (FR-10) | Form blocked; nothing saved | Pass | `sys-06-required-field-blocked.png` |
| SYS-07 | Second student logs in (FR-05) | Sees only their own ticket | Pass | `sys-07-student-b-own-tickets.png` |
| SYS-08 | Staff log in (FR-06) | All 3 tickets with student emails | Pass | `sys-08-staff-dashboard-all.png` |
| SYS-09 | Staff set In Progress (FR-11) | Status and counts update | Pass | `sys-09-staff-in-progress.png` |
| SYS-10 | Staff close a ticket (FR-07, FR-11) | Blocked without a note; closes with a note | Pass | `sys-10-staff-resolved.png` |
| SYS-11 | Staff filter by status (FR-12) | Only matching tickets shown | Pass | `sys-11-filter-*.png` (4 files) |
| SYS-12 | Student checks a closed ticket (FR-08) | Sees Closed and the note | Pass | `sys-12-student-sees-resolution.png` |
| SYS-13 | Student reopens a ticket (extra feature) | Blocked without explanation; then Open | Pass | `sys-13-student-reopened.png` |
| SYS-14 | Log out, then open dashboards (NFR-04) | No ticket data shown | Pass (see DEF-03) | `sys-14-student-page-after-logout.png` |

**SYS-14 note:** after logout the student page shows "Error loading IT requests." instead of redirecting to login. The server rejects the request, so no data is shown. Logged as DEF-03.
