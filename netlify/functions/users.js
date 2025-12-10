/**
 * Netlify Serverless Function for Users API
 * Handles user management operations
 */

const { SupabaseUserRepository } = require('../../src/infrastructure/repositories');
const { UserService } = require('../../src/application/services');

// Initialize services
const userRepository = new SupabaseUserRepository();
const userService = new UserService(userRepository);

/**
 * Simple auth middleware for serverless
 */
function verifyAuth(event) {
  const token = event.headers.authorization?.replace('Bearer ', '');
  if (!token || !userService.verifyToken(token)) {
    return false;
  }
  return true;
}

exports.handler = async (event, context) => {
  // Enable CORS
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Content-Type': 'application/json'
  };

  // Handle OPTIONS request for CORS
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: ''
    };
  }

  // All user endpoints require authentication
  if (!verifyAuth(event)) {
    return {
      statusCode: 401,
      headers,
      body: JSON.stringify({ error: 'Unauthorized' })
    };
  }

  try {
    const path = event.path.replace('/.netlify/functions/users', '');
    const method = event.httpMethod;

    // GET /api/users - Get all users
    if (method === 'GET' && (!path || path === '/')) {
      const users = await userService.getAllUsers();
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify(users)
      };
    }

    // GET /api/users/:id - Get single user
    if (method === 'GET' && path) {
      const id = path.replace('/', '');
      try {
        const user = await userService.getUserById(id);
        return {
          statusCode: 200,
          headers,
          body: JSON.stringify(user)
        };
      } catch (error) {
        if (error.message === 'User not found') {
          return {
            statusCode: 404,
            headers,
            body: JSON.stringify({ error: 'User not found' })
          };
        }
        throw error;
      }
    }

    // POST /api/users - Create new user
    if (method === 'POST') {
      const userData = JSON.parse(event.body);
      try {
        const user = await userService.createUser(userData);
        return {
          statusCode: 201,
          headers,
          body: JSON.stringify(user)
        };
      } catch (error) {
        if (error.message.startsWith('Validation failed') ||
            error.message === 'Username already exists' ||
            error.message === 'Email already exists') {
          return {
            statusCode: 400,
            headers,
            body: JSON.stringify({ error: error.message })
          };
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
        return {
          statusCode: 200,
          headers,
          body: JSON.stringify(user)
        };
      } catch (error) {
        if (error.message === 'User not found') {
          return {
            statusCode: 404,
            headers,
            body: JSON.stringify({ error: 'User not found' })
          };
        }
        if (error.message === 'Username already exists' ||
            error.message === 'Email already exists') {
          return {
            statusCode: 400,
            headers,
            body: JSON.stringify({ error: error.message })
          };
        }
        throw error;
      }
    }

    // DELETE /api/users/:id - Delete user
    if (method === 'DELETE' && path) {
      const id = path.replace('/', '');
      try {
        await userService.deleteUser(id);
        return {
          statusCode: 200,
          headers,
          body: JSON.stringify({ message: 'User deleted successfully' })
        };
      } catch (error) {
        if (error.message === 'User not found') {
          return {
            statusCode: 404,
            headers,
            body: JSON.stringify({ error: 'User not found' })
          };
        }
        throw error;
      }
    }

    // Route not found
    return {
      statusCode: 404,
      headers,
      body: JSON.stringify({ error: 'Route not found' })
    };

  } catch (error) {
    console.error('Users error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ 
        error: 'Internal server error',
        message: error.message 
      })
    };
  }
};
