/*
 * middlewares/authMiddleware.js
 * Authentication middleware: checks that the request has a valid JWT
 * before letting it reach a protected route.
 */

const jwt = require("jsonwebtoken");

// Verify JWT for protected routes
// The client must send the header:  Authorization: Bearer <token>
// (the token comes from POST /api/auth/login).
const authMiddleware = (req, res, next) => {
  const authHeader = req.headers.authorization;

  // Check for Bearer token
  // If the header is missing or badly formatted, return 401 Unauthorized.
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({
      message: "Access denied. No token provided",
    });
  }

  try {
    // Take the token part from "Bearer <token>".
    const token = authHeader.split(" ")[1];

    // Verify token and get user information
    // jwt.verify checks the signature with JWT_SECRET and the expiry time.
    // It throws an error if the token was changed or has expired.
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Attach the token payload ({ userId, role }) to the request so
    // later middleware and routes know who is logged in.
    req.user = decoded;

    // Continue to the next middleware or route
    next();
  } catch (error) {
    return res.status(401).json({
      message: "Invalid or expired token",
    });
  }
};

module.exports = authMiddleware;
