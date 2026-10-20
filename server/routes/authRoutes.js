/*
 * routes/authRoutes.js
 * Public authentication routes, mounted at /api/auth in app.js.
 * No token is needed here; the logic lives in controllers/authController.js.
 */

const express = require("express");
const { registerUser, loginUser } = require("../controllers/authController");

const router = express.Router();

//Register User
// POST /api/auth/register
router.post("/register", registerUser);

//Login User
// POST /api/auth/login -> returns a JWT on success
router.post("/login", loginUser);

module.exports = router;
