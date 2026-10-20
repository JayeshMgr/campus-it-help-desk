/*
 * models/User.js
 * Mongoose model for user accounts (stored in the "users" collection).
 */

const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  // Used as the login name. unique creates a MongoDB index so two
  // accounts can't share the same email.
  email: {
    type: String,
    required: true,
    unique: true,
  },
  // Stores the bcrypt hash, never the plain-text password
  // (hashing happens in authController.registerUser).
  password: {
    type: String,
    required: true,
  },
  // Controls what the user can do:
  // "student" = submits and views own tickets,
  // "staff"   = IT Support Staff, can view all tickets.
  // New accounts are students unless set otherwise.
  role: {
    type: String,
    enum: ["student", "staff"],
    default: "student",
  },
});

const User = mongoose.model("User", userSchema);

module.exports = User;
