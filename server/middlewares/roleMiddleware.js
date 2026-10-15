//Allow access to specific roles
const roleMiddleware = (...allowedRoles) => {
    return (req, res, next) => {
        //check if user's role is authenticated
        if (!req.user || !allowedRoles.includes(req.user.role)) {
            return res.status(403).json({
                message: "Access denied. Insufficient permissions"
            });
        }

        //contiue if the user has permissions
        next();
    };
};

module.exports = roleMiddleware;