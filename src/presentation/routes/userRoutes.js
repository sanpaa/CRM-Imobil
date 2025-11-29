/**
 * User Routes
 * Presentation layer - HTTP endpoints for user operations
 */
const express = require('express');
const router = express.Router();

function createUserRoutes(userService, authMiddleware) {
    // Get all users (requires admin auth)
    router.get('/', authMiddleware, async (req, res) => {
        try {
            const users = await userService.getAllUsers();
            res.json(users);
        } catch (error) {
            console.error('Error fetching users:', error);
            res.status(500).json({ error: 'Failed to fetch users' });
        }
    });

    // Get single user (requires admin auth)
    router.get('/:id', authMiddleware, async (req, res) => {
        try {
            const user = await userService.getUserById(req.params.id);
            res.json(user);
        } catch (error) {
            if (error.message === 'User not found') {
                return res.status(404).json({ error: 'User not found' });
            }
            console.error('Error fetching user:', error);
            res.status(500).json({ error: 'Failed to fetch user' });
        }
    });

    // Create new user (requires admin auth)
    router.post('/', authMiddleware, async (req, res) => {
        try {
            const user = await userService.createUser(req.body);
            res.status(201).json(user);
        } catch (error) {
            if (error.message.startsWith('Validation failed') ||
                error.message === 'Username already exists' ||
                error.message === 'Email already exists') {
                return res.status(400).json({ error: error.message });
            }
            console.error('Error creating user:', error);
            res.status(500).json({ error: 'Failed to create user' });
        }
    });

    // Update user (requires admin auth)
    router.put('/:id', authMiddleware, async (req, res) => {
        try {
            const user = await userService.updateUser(req.params.id, req.body);
            res.json(user);
        } catch (error) {
            if (error.message === 'User not found') {
                return res.status(404).json({ error: 'User not found' });
            }
            if (error.message === 'Username already exists' ||
                error.message === 'Email already exists') {
                return res.status(400).json({ error: error.message });
            }
            console.error('Error updating user:', error);
            res.status(500).json({ error: 'Failed to update user' });
        }
    });

    // Delete user (requires admin auth)
    router.delete('/:id', authMiddleware, async (req, res) => {
        try {
            await userService.deleteUser(req.params.id);
            res.json({ message: 'User deleted successfully' });
        } catch (error) {
            if (error.message === 'User not found') {
                return res.status(404).json({ error: 'User not found' });
            }
            console.error('Error deleting user:', error);
            res.status(500).json({ error: 'Failed to delete user' });
        }
    });

    return router;
}

module.exports = createUserRoutes;
