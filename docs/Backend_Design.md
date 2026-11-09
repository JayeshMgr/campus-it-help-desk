# Backend Design

## 1. Purpose

This document records the backend design decisions for the Campus IT Help Desk Ticket System.

The backend will support the functional requirements defined in the Software Requirements Specification (SRS), including user registration and login, Student and IT Support Staff roles, ticket submission and viewing, ticket status updates, resolution notes, and persistent storage.


## 2. Backend Technology Stack

The backend will use the following technologies:

- Node.js for the server runtime.
- Express.js for creating the REST API.
- MongoDB Atlas for persistent cloud data storage.
- Mongoose for communication between the Node.js backend and MongoDB.
- dotenv for loading environment variables.
- cors for allowing communication between the frontend and backend.
- bcryptjs for password hashing.
- jsonwebtoken for authentication tokens.
- Nodemon for automatic server restart during development.


## 3. Backend Architecture

The backend follows a simple layered structure to keep the project organized and make each part easier to maintain.

- `config/` stores configuration code such as the MongoDB connection (`db.js`).
- `controllers/` contains `authController.js`, which holds the registration and login logic (`registerUser`, `loginUser`).
- `middlewares/` contains authentication (`authMiddleware.js`) and role-checking (`roleMiddleware.js`) logic.
- `models/` defines the MongoDB data structures (`User.js`, `Ticket.js`), including field validation.
- `routes/` defines the API endpoints. `authRoutes.js` maps the auth endpoints to `authController.js`. `ticketRoutes.js` defines the ticket endpoints and contains the ticket request logic directly in its route handlers; there is no separate ticket controller.
- `app.js` configures the Express application, mounts the API routes, and serves the frontend files from `public/`.
- `server.js` connects to MongoDB and starts the backend server.

There is no `utils/` folder; the project does not currently have shared helper functions.


## 4. Backend Communication Flow

The frontend is built with vanilla HTML, CSS, and JavaScript (no framework such as React). Its files are in `public/` and are served by the same Express app. The frontend and backend communicate using HTTP requests (`fetch`) to REST API endpoints.

The request flow for authentication is:

Frontend (HTML/CSS/JavaScript)
→ Express Route (`authRoutes.js`)
→ Controller (`authController.js`)
→ Mongoose Model
→ MongoDB

The request flow for tickets is:

Frontend (HTML/CSS/JavaScript)
→ Express Route (`ticketRoutes.js`)
→ `authMiddleware` and `roleMiddleware`
→ Route handler in `ticketRoutes.js`
→ Mongoose Model
→ MongoDB

The backend returns JSON responses to the frontend.

For example, when a student submits a support ticket, `public/student.js` sends the ticket data to `POST /api/tickets`. The backend checks the student's token and role, then stores the ticket in MongoDB.


## 5. Database Connection Design

MongoDB Atlas is used as the persistent database for the backend.

The database connection is handled in:

`server/config/db.js`

The connection string is stored in the local `.env` file using the `MONGO_URI` environment variable so that database credentials are not written directly in the source code.

When the backend starts, `server.js` loads the environment variables and connects to MongoDB before starting the Express server.

If the database connection fails, the backend stops instead of continuing without database access.


## 6. Student Registration Design

FR-01 allows a student to register an account.

Student accounts contain:

- Email
- Hashed password
- Role

The default role for newly registered accounts is `student`.

Registration is handled through:

`POST /api/auth/register`

The backend verifies that the email and password are provided and checks that the email is not already registered. The password is hashed using bcryptjs before the account is stored in MongoDB.

The registration response does not return the user's password.


## 7. User Login Design

FR-02 allows a registered user to log in using email and password.

Login is handled through:

`POST /api/auth/login`

The backend checks that the email and password are provided, finds the user account, and compares the entered password with the hashed password stored in MongoDB.

If the credentials are valid, the backend creates a JWT containing the user's ID and role. The token is returned with the user's basic account information.

Invalid credentials return an unauthorized response.


## 8. Role-Based Access Control Design

FR-04 supports two user roles: Student and IT Support Staff.

The backend uses JWT authentication and role-based authorization to control access to protected API routes.

Authentication is handled by:

`server/middlewares/authMiddleware.js`

This middleware checks for a Bearer token in the request's Authorization header and verifies it using the JWT secret. If the token is valid, the decoded user information is attached to the request. Missing, invalid, or expired tokens return a 401 Unauthorized response.

Role authorization is handled by:

`server/middlewares/roleMiddleware.js`

This middleware checks whether the authenticated user's role is permitted to access the requested route. Unauthorized roles receive a 403 Forbidden response.

Students register through the registration API and receive the default `student` role. IT Support Staff accounts are created administratively with the `staff` role. Both roles use the same login endpoint.

The authentication and role-checking middleware are applied to every ticket endpoint (see Section 9).


## 9. Ticket API Design

All ticket endpoints are defined in `server/routes/ticketRoutes.js` and mounted at `/api/tickets`. Every endpoint requires a valid JWT.

| Endpoint | Allowed role | Purpose |
| -------- | ------------ | ------- |
| `POST /api/tickets` | Student | Submit a new ticket (owner taken from the JWT) |
| `GET /api/tickets/mine` | Student | View the logged-in student's own tickets |
| `GET /api/tickets/all` | Staff | View all tickets, with the submitting student's email |
| `PATCH /api/tickets/:id/status` | Staff | Change a ticket's status (Open, In Progress, Closed) |
| `POST /api/tickets/:id/comments` | Student, Staff | Add a comment (students: only their own non-Closed tickets) |
| `PATCH /api/tickets/:id/resolve` | Staff | Close a ticket with a resolution note |
| `PATCH /api/tickets/:id/reopen` | Student | Reopen the student's own Closed ticket with a required explanation |

Routes that take a ticket ID return 400 for a malformed ID and 404 when no matching ticket is found.
