/*
 * middlewares/roleMiddleware.js
 * Authorization middleware: limits a route to certain user roles
 * ("student" or "staff"). It must run after authMiddleware, which
 * sets req.user from the JWT.
 */

//Allow access to specific roles
// Usage: roleMiddleware("student") or roleMiddleware("staff").
// It takes the allowed roles and returns the actual Express middleware.
const roleMiddleware = (...allowedRoles) => {
    return (req, res, next) => {
        //check if user's role is allowed
        // The role comes from the verified JWT. A logged-in user with the
        // wrong role gets 403 Forbidden (unlike 401, which means not logged in).
        if (!req.user || !allowedRoles.includes(req.user.role)) {
            return res.status(403).json({
                message: "Access denied. Insufficient permissions"
            });
        }

        //continue if the user has permissions
        next();
    };
};

module.exports = roleMiddleware;