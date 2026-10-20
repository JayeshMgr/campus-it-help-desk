/*
 * controllers/authController.js
 * Handles user registration and login.
 * - bcrypt hashes passwords so plain-text passwords are never stored.
 * - JWT (JSON Web Token) gives logged-in users a signed token that
 *   they send with later requests to prove who they are.
 */

const bcrypt = require("bcryptjs");
const User = require("../models/User");
const jwt = require("jsonwebtoken");

// Register User
// POST /api/auth/register  body: { email, password }
// Creates a new account. Role isn't read from the request, so every
// new account gets the default "student" role from the User model.
const registerUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Both fields are required.
    if (!email || !password) {
      return res.status(400).json({
        message: "Email and password are required",
      });
    }

    // Don't allow two accounts with the same email.
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        message: "User already exists",
      });
    }

    // Hash the password before saving it
    // bcrypt adds a random salt, so the same password gives different hashes.
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await User.create({
      email,
      password: hashedPassword,
    });

    // Return basic user info only. The password hash is never sent back.
    return res.status(201).json({
      message: "User created successfully",
      user: {
        id: user._id,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    // Unexpected error (for example, a database problem).
    // Send a generic message so internal details aren't leaked.
    return res.status(500).json({
      message: "Internal server error",
    });
  }
};

// Login User
// POST /api/auth/login  body: { email, password }
// Checks the credentials and, if they're correct, returns a JWT.
// The frontend sends this token in the Authorization header on
// protected requests (see middlewares/authMiddleware.js).
const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    //Validate required fields
    if (!email || !password) {
      return res.status(400).json({
        message: "Email and password are required",
      });
    }

    // Look up the account by email. The same "Invalid credentials" message
    // is used for a wrong email or a wrong password, so attackers can't
    // tell which emails are registered.
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({
        message: "Invalid credentials",
      });
    }

    //Verify password
    // bcrypt.compare hashes the entered password and checks it against
    // the stored hash. The original password is never recovered.
    const passwordMatch = await bcrypt.compare(password, user.password);

    if (!passwordMatch) {
      return res.status(401).json({
        message: "Invalid credentials",
      });
    }

    // Generate JWT login token
    // The payload stores the user's id and role. The token is signed with
    // JWT_SECRET, so the server can later detect if it was changed.
    // It expires after 1 hour, after which the user must log in again.
    const token = jwt.sign(
      {
        userId: user._id,
        role: user.role,
      },
      process.env.JWT_SECRET,
      {
        expiresIn: "1h",
      },
    );

    res.status(200).json({
      message: "Login Successful",
      token,
      user: {
        id: user._id,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    return res.status(500).json({
      message: "Internal server error",
    });
  }
};

module.exports = { registerUser, loginUser };
