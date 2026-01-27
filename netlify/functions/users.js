/**
 * Netlify Serverless Function for Users API
 * Handles user management operations
 */

const { SupabaseUserRepository } = require('../../src/infrastructure/repositories');
const { UserService } = require('../../src/application/services');
const { verifyAuth, handleOptions, errorResponse, successResponse } = require('./utils');

// Initialize services
const userRepository = new SupabaseUserRepository();
const userService = new UserService(userRepository);

exports.handler = async (event, context) => {
  // Handle OPTIONS request for CORS
  if (event.httpMethod === 'OPTIONS') {
    return handleOptions();
  }

  // All user endpoints require authentication
  if (!verifyAuth(event)) {
    return errorResponse(401, 'Unauthorized');
  }

  try {
    const path = event.path.replace('/.netlify/functions/users', '');
    const method = event.httpMethod;

    // GET /api/users - Get all users
    if (method === 'GET' && (!path || path === '/')) {
      const users = await userService.getAllUsers();
      return successResponse(users);
    }

    // GET /api/users/:id - Get single user
    if (method === 'GET' && path) {
      const id = path.replace('/', '');
      try {
        const user = await userService.getUserById(id);
        return successResponse(user);
      } catch (error) {
        if (error.message === 'User not found') {
          return errorResponse(404, 'User not found');
        }
        throw error;
      }
    }

    // POST /api/users - Create new user
    if (method === 'POST') {
      const userData = JSON.parse(event.body);
      try {
        const user = await userService.createUser(userData);
        return successResponse(user, 201);
      } catch (error) {
        if (error.message.startsWith('Validation failed') ||
            error.message === 'Username already exists' ||
            error.message === 'Email already exists') {
          return errorResponse(400, error.message);
        }
        throw error;
      }
    }

    // PUT /api/users/:id - Update user
    if (method === 'PUT' && path) {
      const id = path.replace('/', '');
      const userData = JSON.parse(event.body);
      try {
        const user = await userService.updateUser(id, userData);
        return successResponse(user);
      } catch (error) {
        if (error.message === 'User not found') {
          return errorResponse(404, 'User not found');
        }
        if (error.message === 'Username already exists' ||
            error.message === 'Email already exists') {
          return errorResponse(400, error.message);
        }
        throw error;
      }
    }

    // DELETE /api/users/:id - Delete user
    if (method === 'DELETE' && path) {
      const id = path.replace('/', '');
      try {
        await userService.deleteUser(id);
        return successResponse({ message: 'User deleted successfully' });
      } catch (error) {
        if (error.message === 'User not found') {
          return errorResponse(404, 'User not found');
        }
        throw error;
      }
    }

    // Route not found
    return errorResponse(404, 'Route not found');

  } catch (error) {
    console.error('Users error:', error);
    return errorResponse(500, 'Internal server error', error.message);
  }
};
