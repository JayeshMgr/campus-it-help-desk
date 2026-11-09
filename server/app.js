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
// - /api/tickets -> create, view, update status, comment on, resolve,
//                   and reopen tickets (see routes/ticketRoutes.js)
app.use("/api/auth", authRoutes);
app.use("/api/tickets", ticketRoutes);

// Serve the frontend HTML/CSS/JS files from the public/ folder.
// The homepage (/) is public/index.html.
app.use(express.static(path.join(__dirname, "../public")));

module.exports = app;
