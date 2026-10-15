const jwt = require("jsonwebtoken");

// Verify JWT for protected routes
const authMiddleware = (req, res, next) => {
  const authHeader = req.headers.authorization;

  // Check for Bearer token
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({
      message: "Access denied. No token provided",
    });
  }

  try {
    const token = authHeader.split(" ")[1];

    // Verify token and get user information
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

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
