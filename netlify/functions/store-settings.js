/**
 * Netlify Serverless Function for Store Settings API
 */

const { SupabaseStoreSettingsRepository } = require('../../src/infrastructure/repositories');
const { StoreSettingsService } = require('../../src/application/services');
const { verifyAuth, handleOptions, errorResponse, successResponse } = require('./utils');

// Initialize services
const storeSettingsRepository = new SupabaseStoreSettingsRepository();
const storeSettingsService = new StoreSettingsService(storeSettingsRepository);

/**
 * Helper to safely convert settings to JSON
 */
function toResponseJSON(settings) {
  if (!settings) return null;
  return typeof settings.toJSON === 'function' ? settings.toJSON() : settings;
}

exports.handler = async (event, context) => {
  // Handle OPTIONS request for CORS
  if (event.httpMethod === 'OPTIONS') {
    return handleOptions();
  }

  try {
    const path = event.path.replace('/.netlify/functions/store-settings', '');
    const method = event.httpMethod;

    // GET /api/store-settings - Get store settings (public)
    if (method === 'GET' && (!path || path === '/')) {
      const settings = await storeSettingsService.getSettings();
      return successResponse(toResponseJSON(settings));
    }

    // PUT /api/store-settings - Update store settings (requires auth)
    if (method === 'PUT' && (!path || path === '/')) {
      if (!verifyAuth(event)) {
        return errorResponse(401, 'Unauthorized');
      }

      const settingsData = JSON.parse(event.body);
      const settings = await storeSettingsService.updateSettings(settingsData);
      
      return successResponse(toResponseJSON(settings));
    }

    // POST /api/store-settings/initialize - Initialize settings (requires auth)
    if (method === 'POST' && path === '/initialize') {
      if (!verifyAuth(event)) {
        return errorResponse(401, 'Unauthorized');
      }

      const settingsData = JSON.parse(event.body);
      const settings = await storeSettingsService.initializeSettings(settingsData);
      
      return successResponse(toResponseJSON(settings), 201);
    }

    // Route not found
    return errorResponse(404, 'Route not found');

  } catch (error) {
    console.error('Store settings error:', error);
    
    // Handle validation errors
    if (error.message && error.message.startsWith('Validation failed')) {
      return errorResponse(400, error.message);
    }
    
    return errorResponse(500, 'Internal server error', error.message);
  }
};
