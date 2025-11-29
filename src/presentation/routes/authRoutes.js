/**
 * Authentication Routes
 * Presentation layer - HTTP endpoints for authentication
 */
const express = require('express');
const router = express.Router();

function createAuthRoutes(userService) {
    // Login
    router.post('/login', async (req, res) => {
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

    // Verify token
    router.get('/verify', (req, res) => {
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
