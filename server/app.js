/*
 * app.js
 * Creates and configures the Express app: global middleware, API routes,
 * and serving of the frontend files in public/.
 * The app is exported here and started in server.js.
 */

const express = require("express");
const cors = require("cors");
const authRoutes = require("./routes/authRoutes");
const app = express();
const path = require("path");
const ticketRoutes = require("./routes/ticketRoutes");



// Global middleware (runs on every request):
// - cors() allows the frontend to call this API from a different origin.
// - express.json() parses JSON request bodies into req.body.
app.use(cors());
app.use(express.json());


// API routes:
// - /api/auth    -> register and login (see routes/authRoutes.js)
// - /api/tickets -> create and view tickets (see routes/ticketRoutes.js)
app.use("/api/auth", authRoutes);
app.use("/api/tickets", ticketRoutes);
// Serve the frontend HTML/CSS/JS files from the public/ folder.
app.use(express.static(path.join(__dirname, "../public")));
app.use("/api/tickets", require("./routes/ticketRoutes"));

// Simple test route to confirm the server is running.
// Note: if public/ has an index.html, express.static above serves it first.
app.get("/", (req, res) => {
  res.json({ message: "Hello World" });
});

module.exports = app;
