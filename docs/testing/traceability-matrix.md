# Section 13 — Final Traceability Matrix

Design elements are described in [`docs/Backend_Design.md`](../Backend_Design.md). Test cases are in [Section 5](test-case-matrix.md). Statuses are based on the final regression run (95/95 Pass, November 9, 2026).

| Requirement ID | Use Case / Need | Design Element | Implementation | Test Case(s) | Final Status |
| -------------- | --------------- | -------------- | -------------- | ------------ | ------------ |
| FR-01 | Student registration | User model, registration form | `authController.js`, `register.js` | TC-01, TC-02, TC-06 | Verified |
| FR-02 | User login | JWT login | `authController.js`, `login.js` | TC-03, TC-04 | Verified |
| FR-03 | Submit a ticket | Ticket model, submit form | `ticketRoutes.js`, `student.js` | TC-07 | Verified |
| FR-04 | Student vs. staff accounts | User role, auth and role middleware | `authMiddleware.js`, `roleMiddleware.js` | TC-05, TC-06 | Verified |
| FR-05 | Student views own tickets | "My tickets" route | `ticketRoutes.js`, `student.js` | TC-09, TC-11 | Verified |
| FR-06 | Staff view all tickets | "All tickets" route | `ticketRoutes.js`, `admin.js` | TC-10 | Verified |
| FR-07 | Staff add resolution notes | Resolve route, ticket comments | `ticketRoutes.js`, `admin.js` | TC-13, TC-14 | Verified |
| FR-08 | Student views resolution notes | Notes returned with tickets | `ticketRoutes.js`, `student.js` | TC-15 | Verified |
| FR-09 | Data kept between sessions | MongoDB database | `db.js`, models | TC-22 | Verified (local test database) |
| FR-10 | Required ticket fields | Required fields in Ticket model and form | `Ticket.js`, `student.html` | TC-08 | Verified |
| FR-11 | Staff update status / close | Status route (Open, In Progress, Closed) | `ticketRoutes.js`, `admin.js` | TC-11, TC-12 | Verified |
| FR-12 | Staff search and filter tickets | Status filter on staff dashboard | `admin.html`, `admin.js` | TC-20 | Partially Verified (status filter only; no category filter or keyword search) |
| NFR-01 | Usability: core task in 5 minutes | Simple register → login → submit flow | `public/` pages | TC-24 | Verified (team-confirmed manual usability test) |
| NFR-02 | Performance: under 5 seconds | Single Express server | `server/`, `public/` | TC-23 | Verified |
| NFR-03 | Reliability: data survives restart | MongoDB persistence | `db.js`, models | TC-22 | Verified (local test database) |
| NFR-04 | Security/privacy | Password hashing, JWT, role and ownership checks | middleware, `authController.js`, `ticketRoutes.js` | TC-04, 05, 06, 09, 17, 18, 21 | Verified (open: DEF-03, DEF-05) |
| NFR-05 | Compatibility on Windows | HTML/CSS/JS and Node server | All files | TC-25, TC-26 | Verified (teammate checks team-reported) |
| NFR-06 | Maintainability | Project structure, naming, comments | All source files | TC-27 | Partially Verified (5 of 10 issues fixed) |

**Summary:** 16 of 18 requirements Verified, 2 Partially Verified (FR-12, NFR-06), 0 Not Verified.

Ticket reopening and comments are extra features beyond the SRS. They were tested in TC-16 to TC-19 and all passed.
