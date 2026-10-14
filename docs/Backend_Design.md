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

- `config/` stores configuration code such as the MongoDB connection.
- `controllers/` will contain the main logic for handling requests.
- `middlewares/` contains authentication and role-checking logic.
- `models/` will define the MongoDB data structures.
- `routes/` will define the API endpoints.
- `utils/` will contain reusable helper functions if needed.
- `app.js` configures the Express application and middleware.
- `server.js` connects to MongoDB and starts the backend server.


## 4. Backend Communication Flow

The frontend and backend will communicate using HTTP requests through REST API endpoints.

The general request flow will be:

Frontend (HTML/CSS/JavaScript)
→ Express Route
→ Middleware if required
→ Controller
→ Mongoose Model
→ MongoDB Atlas

The backend will return JSON responses to the frontend.

For example, when a student submits a support ticket, the React frontend will send the ticket data to an Express API endpoint. The backend will process the request and store the ticket in MongoDB.


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

The authentication and role-checking middleware have been tested using temporary protected routes in Postman. These middleware functions will be applied to the appropriate student and staff ticket endpoints as those features are implemented.
