# Section 13 — Traceability Matrix

Design references point to sections of [`docs/Backend_Design.md`](../Backend_Design.md). Test cases are listed in [Section 5](test-case-matrix.md).

Statuses are based on the final regression run on November 9, 2026 at 15:10: 95/95 automated tests passed (see [Section 9](defect-log.md#93-regression-testing)).

| ID | Requirement | Design element | Implementation | Test cases | Status |
| -- | ----------- | -------------- | -------------- | ---------- | ------ |
| FR-01 | Student registration | §6; `User` model with default role `student`; bcrypt hashing | `authController.js` (`registerUser`), `register.html`, `register.js` | TC-01, TC-02, TC-06 | Verified |
| FR-02 | Login for students and staff | §7; JWT with user ID and role (1-hour expiry) | `authController.js` (`loginUser`), `login.html`, `login.js` | TC-03, TC-04 | Verified |
| FR-03 | Submit a ticket | §9 `POST /api/tickets`; owner taken from the login token | `ticketRoutes.js`, `Ticket.js`, `student.html`, `student.js` | TC-07 | Verified |
| FR-04 | Role-based access | §8; `authMiddleware`, `roleMiddleware` | `middlewares/`, all ticket routes, `login.js`, `admin.js` | TC-05, TC-06, TC-21 | Partially Verified (DEF-03: student page has no login redirect) |
| FR-05 | Students view their own tickets and statuses | §9 `GET /api/tickets/mine` | `ticketRoutes.js`, `student.js` | TC-09, TC-11 | Verified |
| FR-06 | Staff view all tickets | §9 `GET /api/tickets/all` with student email | `ticketRoutes.js`, `admin.html`, `admin.js` | TC-10 | Verified |
| FR-07 | Staff add resolution notes | §9 `PATCH /:id/resolve`; comments limited to 2,000 characters | `ticketRoutes.js`, `Ticket.js`, `admin.js` | TC-13, TC-14 | Verified |
| FR-08 | Students view resolution notes | §9; notes returned with the student's tickets | `ticketRoutes.js`, `student.js` | TC-15 | Verified |
| FR-09 | Data persistence | §5; MongoDB through Mongoose | `config/db.js`, `server.js`, models | TC-22 | Partially Verified (local database only; Atlas not tested) |
| FR-10 | Required ticket fields | Required fields in the `Ticket` schema; HTML `required` | `Ticket.js`, `student.html`, `student.js` | TC-08 | Verified |
| FR-11 | Staff update ticket status | §9 `PATCH /:id/status`; allowed statuses Open, In Progress, Closed | `ticketRoutes.js`, `Ticket.js`, `admin.js` | TC-11, TC-12 | Verified |
| FR-12 | Staff filter tickets | Status filter on the staff dashboard | `admin.html`, `admin.js` | TC-20 | Partially Verified (status filter only; check whether the SRS also asks for category or keyword search) |
| — | Ticket reopening *(not in our FR list)* | §9 `PATCH /:id/reopen` with a required explanation | `ticketRoutes.js`, `student.js` | TC-16, TC-17 | Verified (after the DEF-02 fix) |
| — | Comments *(not in our FR list)* | §9 `POST /:id/comments` | `ticketRoutes.js`, `student.js`, `admin.js` | TC-18, TC-19 | Verified |
| NFR-01 | Usability: core task in 5 minutes | Simple register → login → submit flow | `public/` pages | TC-24 | Not Run |
| NFR-02 | Performance: actions under 5 seconds | Single Express server | `server/`, `public/` | TC-23 | Partially Verified (test computer only) |
| NFR-03 | Reliability: data survives a restart | §5 MongoDB persistence | `config/db.js`, `server.js`, models | TC-22 | Verified (local database) |
| NFR-04 | Security and privacy | §8; bcrypt, JWT, role checks, ownership checks in queries | `middlewares/`, `authController.js`, `ticketRoutes.js` | TC-04, TC-05, TC-06, TC-09, TC-17, TC-18, TC-21 | Partially Verified (DEF-03 and DEF-05 open) |
| NFR-05 | Compatibility on Windows | Plain HTML/CSS/JavaScript and a Node server | All files | TC-25, TC-26 | Partially Verified (only our test computer has recorded evidence; teammates' computers not recorded) |
| NFR-06 | Maintainability | §3 project structure | All source files | TC-27 | Fail (5 of 10 review findings fixed and verified; M-03, M-05, M-07, M-09, M-10 open) |

**Notes:**
- **SRS not in the repository.** Check the requirement titles above against the SRS before submitting.
- **Ticket reopening and comments** are built and tested, but they do not appear in our FR-01 to FR-12 list. If the SRS does not include them, list them as additions to the original scope.
