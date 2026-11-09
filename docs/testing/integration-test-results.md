# Section 7.1 — Integration Testing

**Result: 44 run, 44 Pass, 0 Fail** (final run, November 9, 2026, 15:10)
**Evidence:** [`evidence/final-integration-test-output.txt`](evidence/final-integration-test-output.txt). The earlier run with the DEF-02 failure (43 Pass, 1 Fail) is in [`evidence/integration-test-output.txt`](evidence/integration-test-output.txt).

**Approach:** each test sends a real HTTP request through the full path (`app.js` → `authMiddleware` → `roleMiddleware` → route or controller → Mongoose model → local test MongoDB). The test then reads the database directly to confirm what was saved.

| ID | Area (FR) | What was checked | Tests | Result |
| -- | --------- | ---------------- | ----- | ------ |
| INT-01 | Registration (FR-01, FR-04) | Account created with a hashed password; missing fields and duplicate emails rejected; `role` in the request ignored | 4 | Pass |
| INT-02 | Login and tokens (FR-02) | Token has the correct user ID and role; same error for wrong password and unknown email; bad, forged, and expired tokens rejected | 5 | Pass |
| INT-03 | Submit ticket (FR-03, FR-10) | Saved as Open under the logged-in student; empty fields rejected; staff and anonymous users blocked | 4 | Pass |
| INT-04 | Student ticket list (FR-05) | Each student gets only their own tickets; staff blocked | 3 | Pass |
| INT-05 | Staff ticket list (FR-06) | All tickets with student email and no passwords; students blocked | 2 | Pass |
| INT-06 | Status updates (FR-11) | Open → In Progress → Closed saved; invalid statuses and IDs rejected; students blocked | 5 | Pass |
| INT-07 | Resolution notes (FR-07, FR-08) | Note saved and ticket closed; 0 and 2,001 characters rejected, 2,000 accepted; student can read the note | 6 | Pass |
| INT-08 | Reopening (extra feature) | Owner can reopen with an explanation; all invalid attempts rejected | 6 | Pass (INT-08f failed before the DEF-02 fix) |
| INT-09 | Comments (extra feature) | Students comment on their own open tickets; other students and closed tickets blocked; length limits | 7 | Pass |
| INT-10 | Status filter data (FR-12) | Status counts from the API match the database | 2 | Pass |
