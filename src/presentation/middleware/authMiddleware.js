/**
 * Authentication Middleware
 * Presentation layer - Middleware for protecting routes
 */

function createAuthMiddleware(userService) {
    return (req, res, next) => {
        const token = req.headers.authorization?.replace('Bearer ', '');

        if (!token) {
            return res.status(401).json({ error: 'Authentication required' });
        }

        if (!userService.verifyToken(token)) {
            return res.status(401).json({ error: 'Invalid or expired token' });
        }

        next();
    };
}

module.exports = createAuthMiddleware;
