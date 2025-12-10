/**
 * Netlify Serverless Function for Store Settings API
 */

const { SupabaseStoreSettingsRepository } = require('../../src/infrastructure/repositories');
const { StoreSettingsService } = require('../../src/application/services');
const { SupabaseUserRepository } = require('../../src/infrastructure/repositories');
const { UserService } = require('../../src/application/services');

// Initialize services
const storeSettingsRepository = new SupabaseStoreSettingsRepository();
const storeSettingsService = new StoreSettingsService(storeSettingsRepository);
const userRepository = new SupabaseUserRepository();
const userService = new UserService(userRepository);

/**
 * Helper to safely convert settings to JSON
 */
function toResponseJSON(settings) {
  if (!settings) return null;
  return typeof settings.toJSON === 'function' ? settings.toJSON() : settings;
}

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
    'Access-Control-Allow-Methods': 'GET, PUT, POST, OPTIONS',
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
    const path = event.path.replace('/.netlify/functions/store-settings', '');
    const method = event.httpMethod;

    // GET /api/store-settings - Get store settings (public)
    if (method === 'GET' && (!path || path === '/')) {
      const settings = await storeSettingsService.getSettings();
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify(toResponseJSON(settings))
      };
    }

    // PUT /api/store-settings - Update store settings (requires auth)
    if (method === 'PUT' && (!path || path === '/')) {
      if (!verifyAuth(event)) {
        return {
          statusCode: 401,
          headers,
          body: JSON.stringify({ error: 'Unauthorized' })
        };
      }

      const settingsData = JSON.parse(event.body);
      const settings = await storeSettingsService.updateSettings(settingsData);
      
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify(toResponseJSON(settings))
      };
    }

    // POST /api/store-settings/initialize - Initialize settings (requires auth)
    if (method === 'POST' && path === '/initialize') {
      if (!verifyAuth(event)) {
        return {
          statusCode: 401,
          headers,
          body: JSON.stringify({ error: 'Unauthorized' })
        };
      }

      const settingsData = JSON.parse(event.body);
      const settings = await storeSettingsService.initializeSettings(settingsData);
      
      return {
        statusCode: 201,
        headers,
        body: JSON.stringify(toResponseJSON(settings))
      };
    }

    // Route not found
    return {
      statusCode: 404,
      headers,
      body: JSON.stringify({ error: 'Route not found' })
    };

  } catch (error) {
    console.error('Store settings error:', error);
    
    // Handle validation errors
    if (error.message && error.message.startsWith('Validation failed')) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: error.message })
      };
    }
    
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
