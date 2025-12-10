/**
 * Netlify Serverless Function for Authentication API
 * Handles login, logout, and token verification
 */

const { SupabaseUserRepository } = require('../../src/infrastructure/repositories');
const { UserService } = require('../../src/application/services');

// Initialize services
const userRepository = new SupabaseUserRepository();
const userService = new UserService(userRepository);

// Simple in-memory rate limiting for serverless (resets between cold starts)
const loginAttempts = new Map();
const verifyAttempts = new Map();

function checkRateLimit(ip, limiter, maxAttempts, windowMs) {
  const now = Date.now();
  const attempts = limiter.get(ip) || [];
  
  // Filter out attempts outside the window
  const recentAttempts = attempts.filter(timestamp => now - timestamp < windowMs);
  
  if (recentAttempts.length >= maxAttempts) {
    return false;
  }
  
  recentAttempts.push(now);
  limiter.set(ip, recentAttempts);
  return true;
}

exports.handler = async (event, context) => {
  // Enable CORS
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
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

  try {
    const path = event.path.replace('/.netlify/functions/auth', '');
    const method = event.httpMethod;
    const ip = event.headers['x-forwarded-for'] || event.headers['client-ip'] || 'unknown';

    // POST /api/auth/login
    if (method === 'POST' && path === '/login') {
      // Rate limiting: 5 attempts per 15 minutes
      if (!checkRateLimit(ip, loginAttempts, 5, 15 * 60 * 1000)) {
        return {
          statusCode: 429,
          headers,
          body: JSON.stringify({ error: 'Muitas tentativas de login. Tente novamente em 15 minutos.' })
        };
      }

      const { username, password } = JSON.parse(event.body);

      if (!username || !password) {
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({ error: 'Usuário e senha são obrigatórios' })
        };
      }

      const result = await userService.authenticate(username, password);

      if (!result) {
        return {
          statusCode: 401,
          headers,
          body: JSON.stringify({ error: 'Usuário ou senha inválidos' })
        };
      }

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          success: true,
          token: result.token,
          user: result.user,
          message: 'Login realizado com sucesso'
        })
      };
    }

    // POST /api/auth/logout
    if (method === 'POST' && path === '/logout') {
      const token = event.headers.authorization?.replace('Bearer ', '');
      if (token) {
        userService.logout(token);
      }
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ success: true, message: 'Logout realizado com sucesso' })
      };
    }

    // GET /api/auth/verify
    if (method === 'GET' && path === '/verify') {
      // Rate limiting: 30 attempts per minute
      if (!checkRateLimit(ip, verifyAttempts, 30, 60 * 1000)) {
        return {
          statusCode: 429,
          headers,
          body: JSON.stringify({ error: 'Muitas requisições. Tente novamente em breve.' })
        };
      }

      const token = event.headers.authorization?.replace('Bearer ', '');
      if (token && userService.verifyToken(token)) {
        return {
          statusCode: 200,
          headers,
          body: JSON.stringify({ valid: true })
        };
      } else {
        return {
          statusCode: 401,
          headers,
          body: JSON.stringify({ valid: false })
        };
      }
    }

    // Route not found
    return {
      statusCode: 404,
      headers,
      body: JSON.stringify({ error: 'Route not found' })
    };

  } catch (error) {
    console.error('Auth error:', error);
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
