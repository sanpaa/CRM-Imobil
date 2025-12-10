/**
 * Netlify Serverless Function for Authentication API
 * Handles login, logout, and token verification
 * 
 * NOTE: Rate limiting in this implementation is basic and resets on cold starts.
 * For production, consider using an external store (Redis, database) for persistent rate limiting.
 */

const { SupabaseUserRepository } = require('../../src/infrastructure/repositories');
const { UserService } = require('../../src/application/services');
const { handleOptions, errorResponse, successResponse } = require('./utils');

// Initialize services
const userRepository = new SupabaseUserRepository();
const userService = new UserService(userRepository);

// Simple in-memory rate limiting (NOTE: resets on cold starts)
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
  // Handle OPTIONS request for CORS
  if (event.httpMethod === 'OPTIONS') {
    return handleOptions();
  }

  try {
    const path = event.path.replace('/.netlify/functions/auth', '');
    const method = event.httpMethod;
    const ip = event.headers['x-forwarded-for'] || event.headers['client-ip'] || 'unknown';

    // POST /api/auth/login
    if (method === 'POST' && path === '/login') {
      // Rate limiting: 5 attempts per 15 minutes
      if (!checkRateLimit(ip, loginAttempts, 5, 15 * 60 * 1000)) {
        return errorResponse(429, 'Muitas tentativas de login. Tente novamente em 15 minutos.');
      }

      const { username, password } = JSON.parse(event.body);

      if (!username || !password) {
        return errorResponse(400, 'Usuário e senha são obrigatórios');
      }

      const result = await userService.authenticate(username, password);

      if (!result) {
        return errorResponse(401, 'Usuário ou senha inválidos');
      }

      return successResponse({
        success: true,
        token: result.token,
        user: result.user,
        message: 'Login realizado com sucesso'
      });
    }

    // POST /api/auth/logout
    if (method === 'POST' && path === '/logout') {
      const authHeader = event.headers.authorization || event.headers.Authorization;
      const token = authHeader?.replace('Bearer ', '');
      if (token) {
        userService.logout(token);
      }
      return successResponse({ success: true, message: 'Logout realizado com sucesso' });
    }

    // GET /api/auth/verify
    if (method === 'GET' && path === '/verify') {
      // Rate limiting: 30 attempts per minute
      if (!checkRateLimit(ip, verifyAttempts, 30, 60 * 1000)) {
        return errorResponse(429, 'Muitas requisições. Tente novamente em breve.');
      }

      const authHeader = event.headers.authorization || event.headers.Authorization;
      const token = authHeader?.replace('Bearer ', '');
      
      try {
        if (token && userService.verifyToken(token)) {
          return successResponse({ valid: true });
        } else {
          return errorResponse(401, 'Invalid token', { valid: false });
        }
      } catch (error) {
        console.error('Token verification error:', error);
        return errorResponse(401, 'Invalid token', { valid: false });
      }
    }

    // Route not found
    return errorResponse(404, 'Route not found');

  } catch (error) {
    console.error('Auth error:', error);
    return errorResponse(500, 'Internal server error', error.message);
  }
};
