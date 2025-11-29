/**
 * Authentication Routes
 * Presentation layer - HTTP endpoints for authentication
 */
const express = require('express');
const rateLimit = require('express-rate-limit');
const router = express.Router();

// Rate limiter for login attempts - strict to prevent brute force attacks
const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // Limit each IP to 5 login attempts per windowMs
    message: { error: 'Muitas tentativas de login. Tente novamente em 15 minutos.' },
    standardHeaders: true,
    legacyHeaders: false
});

// Rate limiter for token verification - more lenient
const verifyLimiter = rateLimit({
    windowMs: 1 * 60 * 1000, // 1 minute
    max: 30, // Limit each IP to 30 verify requests per minute
    message: { error: 'Muitas requisições. Tente novamente em breve.' },
    standardHeaders: true,
    legacyHeaders: false
});

function createAuthRoutes(userService) {
    // Login - rate limited to prevent brute force attacks
    router.post('/login', loginLimiter, async (req, res) => {
        const { username, password } = req.body;

        if (!username || !password) {
            return res.status(400).json({ error: 'Usuário e senha são obrigatórios' });
        }

        try {
            const result = await userService.authenticate(username, password);

            if (!result) {
                return res.status(401).json({ error: 'Usuário ou senha inválidos' });
            }

            res.json({
                success: true,
                token: result.token,
                user: result.user,
                message: 'Login realizado com sucesso'
            });
        } catch (error) {
            console.error('Login error:', error);
            res.status(500).json({ error: 'Erro ao realizar login' });
        }
    });

    // Logout
    router.post('/logout', (req, res) => {
        const token = req.headers.authorization?.replace('Bearer ', '');
        if (token) {
            userService.logout(token);
        }
        res.json({ success: true, message: 'Logout realizado com sucesso' });
    });

    // Verify token - rate limited
    router.get('/verify', verifyLimiter, (req, res) => {
        const token = req.headers.authorization?.replace('Bearer ', '');
        if (token && userService.verifyToken(token)) {
            res.json({ valid: true });
        } else {
            res.status(401).json({ valid: false });
        }
    });

    return router;
}

module.exports = createAuthRoutes;
