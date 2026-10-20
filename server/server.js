/*
 * server.js
 * Entry point for the backend. Loads environment variables, connects to
 * MongoDB, and then starts the Express server.
 * Run with: node server.js (from the server/ folder).
 */

// Load variables from .env (MONGO_URI, JWT_SECRET, PORT) into process.env.
// This must run before any code that reads process.env.
require("dotenv").config();

// Debug output for checking that .env was loaded correctly.
console.log("Current directory:", process.cwd());
console.log("MONGO_URI exists:", !!process.env.MONGO_URI);
console.log("MONGO_URI value:", process.env.MONGO_URI);

const app = require("./app");
const connectDB = require("./config/db");

// Use the port from .env if set, otherwise default to 5000.
const PORT = process.env.PORT || 5000;

// Connect to the database first, then start accepting HTTP requests.
// Waiting on connectDB() means routes never run without a database.
const startServer = async () => {
  await connectDB();

  // Start listening for incoming requests on the chosen port.
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
};

startServer();
