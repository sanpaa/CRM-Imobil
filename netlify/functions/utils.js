/**
 * Shared utilities for Netlify serverless functions
 */

const { SupabaseUserRepository } = require('../../src/infrastructure/repositories');
const { UserService } = require('../../src/application/services');

// Initialize services for auth verification
let userService = null;

function getUserService() {
  if (!userService) {
    const userRepository = new SupabaseUserRepository();
    userService = new UserService(userRepository);
  }
  return userService;
}

/**
 * Verify authentication token from request headers
 * @param {Object} event - Netlify function event object
 * @returns {boolean} - True if authenticated, false otherwise
 */
function verifyAuth(event) {
  try {
    const authHeader = event.headers.authorization || event.headers.Authorization;
    const token = authHeader?.replace('Bearer ', '');
    
    if (!token) {
      return false;
    }
    
    const service = getUserService();
    return service.verifyToken(token);
  } catch (error) {
    console.error('Auth verification error:', error);
    return false;
  }
}

/**
 * Get content type header (case-insensitive)
 * @param {Object} event - Netlify function event object
 * @returns {string} - Content type header value
 */
function getContentType(event) {
  return event.headers['content-type'] || event.headers['Content-Type'] || '';
}

/**
 * Create standard CORS headers
 * @returns {Object} - CORS headers object
 */
function getCorsHeaders() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Content-Type': 'application/json'
  };
}

/**
 * Create error response
 * @param {number} statusCode - HTTP status code
 * @param {string} message - Error message
 * @param {Object} details - Additional error details
 * @returns {Object} - Netlify function response object
 */
function errorResponse(statusCode, message, details = null) {
  const headers = getCorsHeaders();
  const body = { error: message };
  
  if (details) {
    body.details = details;
  }
  
  return {
    statusCode,
    headers,
    body: JSON.stringify(body)
  };
}

/**
 * Create success response
 * @param {*} data - Response data
 * @param {number} statusCode - HTTP status code (default: 200)
 * @returns {Object} - Netlify function response object
 */
function successResponse(data, statusCode = 200) {
  const headers = getCorsHeaders();
  
  return {
    statusCode,
    headers,
    body: JSON.stringify(data)
  };
}

/**
 * Handle OPTIONS request for CORS
 * @returns {Object} - Netlify function response object
 */
function handleOptions() {
  return {
    statusCode: 200,
    headers: getCorsHeaders(),
    body: ''
  };
}

module.exports = {
  verifyAuth,
  getContentType,
  getCorsHeaders,
  errorResponse,
  successResponse,
  handleOptions
};
